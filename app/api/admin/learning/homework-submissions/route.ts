import { NextRequest, NextResponse } from "next/server";
import { readFile } from "../../../file-store";
import { clean, database, ensureLearningSchema, requireAdmin } from "../_shared";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401, headers: noStore });
  const db = database(); await ensureLearningSchema(db);
  const id = Number(request.nextUrl.searchParams.get("fileId") || 0);
  if (id) {
    const { results } = await db.prepare('SELECT file_key AS "fileKey", file_name AS "fileName", content_type AS "contentType" FROM homework_submissions WHERE id=? LIMIT 1').bind(id).all<any>();
    const item = results?.[0], body = item?.fileKey ? await readFile(db, "homework", id, item.fileKey) : null;
    if (!item || !body) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404, headers: noStore });
    return new NextResponse(body, { headers: { ...noStore, "Content-Type": item.contentType || "application/octet-stream", "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(item.fileName)}` } });
  }
  const { results } = await db.prepare('SELECT h.id, h.student_id AS "studentId", s.name AS "studentName", s.school, s.grade, h.homework_date AS "homeworkDate", h.title, h.student_note AS "studentNote", h.file_name AS "fileName", h.content_type AS "contentType", h.file_size AS "fileSize", h.teacher_feedback AS "teacherFeedback", h.feedback_at AS "feedbackAt", h.created_at AS "createdAt" FROM homework_submissions h JOIN students s ON s.id=h.student_id WHERE h.file_key<>\'pending\' ORDER BY h.id DESC LIMIT 100').all();
  return NextResponse.json({ items: results ?? [] }, { headers: noStore });
}

export async function PATCH(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401, headers: noStore });
  const body = await request.json().catch(() => ({})), id = Number(body.id), feedback = clean(body.teacherFeedback, 2500);
  if (!id || !feedback) return NextResponse.json({ error: "피드백을 입력해 주세요." }, { status: 400, headers: noStore });
  const db = database(); await ensureLearningSchema(db);
  await db.prepare("UPDATE homework_submissions SET teacher_feedback=?, feedback_at=? WHERE id=?").bind(feedback, new Date().toISOString(), id).run();
  return NextResponse.json({ ok: true, message: "피드백이 저장되어 학생 화면에 바로 반영되었습니다." }, { headers: noStore });
}
