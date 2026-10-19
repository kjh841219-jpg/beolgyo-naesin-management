import { NextRequest, NextResponse } from "next/server";
import { readFile, removeFile, saveFile } from "../../../file-store";
import {
  clean,
  database,
  ensureLearningSchema,
  requireAdmin,
} from "../_shared";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  const db = database();
  await ensureLearningSchema(db);
  const id = Number(req.nextUrl.searchParams.get("fileId") || 0);
  if (id) {
    const { results } = await db
      .prepare(
        'SELECT id,file_key AS "fileKey",file_name AS "fileName",content_type AS "contentType" FROM learning_resources WHERE id=? LIMIT 1',
      )
      .bind(id)
      .all<any>();
    const x = results?.[0],
      object = x
        ? await readFile(db, "learning-resource", x.id, x.fileKey)
        : null;
    if (!x || !object)
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다." },
        { status: 404 },
      );
    return new NextResponse(object, {
      headers: {
        "Content-Type": x.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(x.fileName)}`,
      },
    });
  }
  const studentId = Number(req.nextUrl.searchParams.get("studentId") || 0),
    query = `SELECT r.id,r.student_id AS "studentId",s.name AS "studentName",r.title,r.description,r.resource_url AS "resourceUrl",r.file_name AS "fileName",r.content_type AS "contentType",r.file_size AS "fileSize",r.created_at AS "createdAt" FROM learning_resources r JOIN students s ON s.id=r.student_id ${studentId ? "WHERE r.student_id=?" : ""} ORDER BY r.id DESC`,
    { results } = studentId
      ? await db.prepare(query).bind(studentId).all()
      : await db.prepare(query).all();
  return NextResponse.json({ items: results ?? [] });
}
export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  const form = await req.formData(),
    studentId = Number(form.get("studentId")),
    title = clean(form.get("title"), 120),
    description = clean(form.get("description"), 1000),
    resourceUrl = clean(form.get("resourceUrl"), 1000),
    file = form.get("file"),
    uploadedPath = clean(form.get("uploadedPath"), 1000),
    uploadedName = clean(form.get("uploadedName"), 200),
    uploadedType = clean(form.get("uploadedType"), 160),
    uploadedSize = Number(form.get("uploadedSize") || 0),
    assignmentKey = clean(form.get("assignmentKey"), 100);
  if (
    !studentId ||
    !title ||
    (!resourceUrl && !uploadedPath && (!(file instanceof File) || !file.size))
  )
    return NextResponse.json(
      { error: "학생과 제목을 선택하고 링크 또는 파일을 등록해 주세요." },
      { status: 400 },
    );
  if (uploadedPath && !uploadedPath.startsWith("resources/"))
    return NextResponse.json(
      { error: "업로드된 파일 경로가 올바르지 않습니다." },
      { status: 400 },
    );
  if (file instanceof File && file.size > 30 * 1024 * 1024)
    return NextResponse.json(
      { error: "파일은 30MB 이하로 올려 주세요." },
      { status: 400 },
    );
  const db = database();
  await ensureLearningSchema(db);
  const inserted = await db
      .prepare(
        "INSERT INTO learning_resources(student_id,title,description,resource_url,file_key,file_name,content_type,file_size,assignment_key) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT (assignment_key) WHERE assignment_key <> '' DO UPDATE SET student_id=EXCLUDED.student_id,title=EXCLUDED.title,description=EXCLUDED.description,resource_url=EXCLUDED.resource_url,file_key=EXCLUDED.file_key,file_name=EXCLUDED.file_name,content_type=EXCLUDED.content_type,file_size=EXCLUDED.file_size RETURNING id",
      )
      .bind(
        studentId,
        title,
        description,
        resourceUrl,
        uploadedPath,
        uploadedPath
          ? uploadedName
          : file instanceof File
            ? file.name.slice(0, 200)
            : "",
        uploadedPath ? uploadedType : file instanceof File ? file.type : "",
        uploadedPath ? uploadedSize : file instanceof File ? file.size : 0,
        assignmentKey,
      )
      .run(),
    id = Number(inserted.meta?.last_row_id);
  try {
    if (file instanceof File && file.size) {
      const key = await saveFile(
        db,
        "learning-resource",
        id,
        file,
        `resources/${studentId}`,
      );
      await db
        .prepare("UPDATE learning_resources SET file_key=? WHERE id=?")
        .bind(key, id)
        .run();
    }
    return NextResponse.json(
      { ok: true, id, message: "인강·학습자료가 학생 화면에 등록되었습니다." },
      { status: 201 },
    );
  } catch (error) {
    await db
      .prepare(
        "DELETE FROM uploaded_file_chunks WHERE owner_kind=? AND owner_id=?",
      )
      .bind("learning-resource", id)
      .run();
    await db
      .prepare("DELETE FROM learning_resources WHERE id=?")
      .bind(id)
      .run();
    throw error;
  }
}
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  const id = Number(req.nextUrl.searchParams.get("id") || 0),
    db = database();
  await ensureLearningSchema(db);
  const { results } = await db
    .prepare('SELECT file_key AS "fileKey" FROM learning_resources WHERE id=?')
    .bind(id)
    .all<any>();
  if (results?.[0])
    await removeFile(db, "learning-resource", id, results[0].fileKey);
  await db.prepare("DELETE FROM learning_resources WHERE id=?").bind(id).run();
  return NextResponse.json({ ok: true });
}
