import { cookies } from "next/headers";
import { clean } from "../../admin/learning/_shared";
import {
  COOKIE,
  database,
  ensureLearningSchema,
  sha256,
  studentSession,
} from "../_shared";
import { syncDashboardRoster } from "../../admin/learning/dashboard-roster";
export async function GET() {
  const student = await studentSession();
  return Response.json({ authenticated: Boolean(student), student });
}
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({})),
    name = clean(b.name, 40).replace(/\s+/g, ""),
    code = clean(b.code, 4).replace(/\D/g, "");
  if (!name || !/^\d{4}$/.test(code))
    return Response.json(
      { error: "이름과 연락처 뒷번호 4자리를 확인해 주세요." },
      { status: 400 },
    );
  const db = database();
  await ensureLearningSchema(db);
  await syncDashboardRoster(db);
  const hash = await sha256(code),
    { results } = await db
      .prepare(
        "SELECT id,name,school,grade,exam_date AS examDate FROM students WHERE REPLACE(name,' ','')=? AND (access_code_hash=? OR SUBSTR(REPLACE(REPLACE(parent_phone,'-',''),' ',''),-4)=?) ORDER BY CASE WHEN access_code_hash=? THEN 0 ELSE 1 END LIMIT 1",
      )
      .bind(name, hash, code, hash)
      .all<any>();
  const student = results?.[0];
  if (!student)
    return Response.json(
      {
        error:
          "학생 이름 또는 연락처 뒷번호 4자리가 맞지 않습니다. 관리자 등록 연락처를 확인해 주세요.",
      },
      { status: 401 },
    );
  const token = crypto.randomUUID() + crypto.randomUUID(),
    expires = new Date(Date.now() + 7 * 86400000);
  await db
    .prepare(
      "INSERT INTO student_sessions(student_id,token_hash,expires_at) VALUES(?,?,?)",
    )
    .bind(student.id, await sha256(token), expires.toISOString())
    .run();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: "/",
    expires,
  });
  return Response.json({ ok: true, student });
}
export async function DELETE() {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
  return Response.json({ ok: true });
}
