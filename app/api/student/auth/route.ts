import { cookies } from "next/headers";
import { clean } from "../../admin/learning/_shared";
import {
  COOKIE,
  database,
  ensureLearningSchema,
  sha256,
  studentSession,
} from "../_shared";

const normalizeName = (value: unknown) => clean(value, 40).replace(/\s+/g, "");
const normalizePhone = (value: unknown) => String(value ?? "").replace(/\D/g, "");

export async function GET() {
  const student = await studentSession();
  return Response.json({ authenticated: Boolean(student), student });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = normalizeName(body.name);
  const code = normalizePhone(clean(body.code, 20)).slice(-4);

  if (!name || !/^\d{4}$/.test(code)) {
    return Response.json(
      { error: "이름과 연락처 뒷번호 4자리를 확인해 주세요." },
      { status: 400 },
    );
  }

  const db = database();
  await ensureLearningSchema(db);

  const hash = await sha256(code);
  const { results } = await db
    .prepare(
      "SELECT id,name,school,grade,parent_phone AS parentPhone,exam_date AS examDate,access_code_hash AS accessCodeHash FROM students ORDER BY name",
    )
    .all<any>();

  const student = (results ?? []).find((candidate: any) => {
    const sameName = normalizeName(candidate?.name) === name;
    if (!sameName) return false;
    const phoneLastFour = normalizePhone(candidate?.parentPhone).slice(-4);
    return candidate?.accessCodeHash === hash || phoneLastFour === code;
  });

  if (!student) {
    return Response.json(
      {
        error:
          "학생 이름 또는 연락처 뒷번호 4자리가 맞지 않습니다. 관리자 등록 연락처를 확인해 주세요.",
      },
      { status: 401 },
    );
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 86400000);
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

  const { accessCodeHash: _accessCodeHash, ...safeStudent } = student;
  return Response.json({ ok: true, student: safeStudent });
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
