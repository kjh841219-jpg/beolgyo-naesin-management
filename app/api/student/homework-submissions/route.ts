import { NextRequest, NextResponse } from "next/server";
import { readFile, removeFile, saveFile } from "../../file-store";
import { database, ensureLearningSchema, studentSession } from "../_shared";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const value = (form: FormData, key: string, max: number) => String(form.get(key) || "").trim().slice(0, max);

export async function GET(request: NextRequest) {
  const student = await studentSession();
  if (!student) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401, headers: noStore });
  const db = database(); await ensureLearningSchema(db);
  const id = Number(request.nextUrl.searchParams.get("fileId") || 0);
  if (id) {
    const { results } = await db.prepare('SELECT file_key AS "fileKey", file_name AS "fileName", content_type AS "contentType" FROM homework_submissions WHERE id=? AND student_id=? LIMIT 1').bind(id, student.id).all<any>();
    const item = results?.[0], body = item?.fileKey ? await readFile(db, "homework", id, item.fileKey) : null;
    if (!item || !body) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404, headers: noStore });
    return new NextResponse(body, { headers: { ...noStore, "Content-Type": item.contentType, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(item.fileName)}` } });
  }
  const { results } = await db.prepare('SELECT id, homework_date AS "homeworkDate", title, student_note AS "studentNote", file_name AS "fileName", teacher_feedback AS "teacherFeedback", feedback_at AS "feedbackAt", created_at AS "createdAt" FROM homework_submissions WHERE student_id=? AND file_key<>\'pending\' ORDER BY id DESC LIMIT 50').bind(student.id).all();
  return NextResponse.json({ items: results ?? [] }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const student = await studentSession();
  if (!student) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401, headers: noStore });
  try {
    const form = await request.formData(), file = form.get("file"), title = value(form, "title", 120), date = value(form, "homeworkDate", 10), note = value(form, "studentNote", 1500);
    if (!title || !date || !(file instanceof File) || !file.size) return NextResponse.json({ error: "날짜, 숙제명, 제출 파일을 모두 입력해 주세요." }, { status: 400, headers: noStore });
    if (!allowed.has(file.type) || file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "사진은 자동 압축되며, PDF·Word·Excel 파일은 4MB 이하만 제출할 수 있습니다." }, { status: 400, headers: noStore });
    const db = database(); await ensureLearningSchema(db);
    const inserted = await db.prepare("INSERT INTO homework_submissions(student_id,homework_date,title,student_note,file_key,file_url,file_name,content_type,file_size,status) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(student.id, date, title, note, "pending", "database-file", file.name.slice(0, 200), file.type, file.size, "submitted").run();
    const id = Number(inserted.meta?.last_row_id || 0);
    if (!id) throw new Error("제출 기록 번호를 만들지 못했습니다.");
    try {
      const key = await saveFile(db, "homework", id, file, "homework");
      await db.prepare("UPDATE homework_submissions SET file_key=? WHERE id=?").bind(key, id).run();
      return NextResponse.json({ ok: true, id, message: "숙제가 제출되었습니다. 관리자 화면에 바로 반영됩니다." }, { status: 201, headers: noStore });
    } catch (error) {
      await removeFile(db, "homework", id, `db:homework:${id}`); await db.prepare("DELETE FROM homework_submissions WHERE id=?").bind(id).run(); throw error;
    }
  } catch (error) {
    console.error("[student/homework-submissions] submit failed", error);
    return NextResponse.json({ error: "숙제 제출 중 오류가 발생했습니다. 잠시 후 다시 눌러 주세요." }, { status: 500, headers: noStore });
  }
}
