import { NextRequest, NextResponse } from "next/server";
import { readFile } from "../../file-store";
import { database, ensureLearningSchema, studentSession } from "../_shared";
export async function GET(req: NextRequest) {
  const student = await studentSession(); if (!student) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });
  const db = database(); await ensureLearningSchema(db); const id = Number(req.nextUrl.searchParams.get("fileId") || 0);
  if (id) { const { results } = await db.prepare('SELECT id,file_key AS "fileKey",file_name AS "fileName",content_type AS "contentType" FROM learning_resources WHERE id=? AND student_id=? LIMIT 1').bind(id, student.id).all<any>(); const x = results?.[0], object = x ? await readFile(db, "learning-resource", x.id, x.fileKey) : null; if (!x || !object) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 }); return new NextResponse(object, { headers: { "Content-Type": x.contentType || "application/octet-stream", "Content-Disposition": `${String(x.contentType).startsWith("video/") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(x.fileName)}`, "Cache-Control": "private, no-store" } }); }
  const { results } = await db.prepare('SELECT id,title,description,resource_url AS "resourceUrl",file_name AS "fileName",content_type AS "contentType",file_size AS "fileSize",created_at AS "createdAt" FROM learning_resources WHERE student_id=? ORDER BY id DESC').bind(student.id).all(); return NextResponse.json({ items: results ?? [] });
}
