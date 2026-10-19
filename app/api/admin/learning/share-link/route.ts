import { database, requireAdmin } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowedImageUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const allowed = host === "kakaocdn.net" || host.endsWith(".kakaocdn.net") || host === "kakao.com" || host.endsWith(".kakao.com");
    if (!allowed || (url.protocol !== "https:" && url.protocol !== "http:")) return "";
    url.protocol = "https:";
    return url.toString();
  } catch {
    return "";
  }
}

async function ensureShareLinkTable() {
  const db = database();
  await db.prepare("CREATE TABLE IF NOT EXISTS learning_share_links (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, student_id INTEGER NOT NULL, student_name TEXT NOT NULL, image_url TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await db.prepare("ALTER TABLE learning_share_links ADD COLUMN IF NOT EXISTS id BIGSERIAL UNIQUE").run();
  return db;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  try {
    const body = await request.json() as { studentId?: number; studentName?: string; imageUrl?: string };
    const imageUrl = allowedImageUrl(body.imageUrl);
    const studentId = Number(body.studentId) || 0;
    const studentName = String(body.studentName || "학생").trim().slice(0, 30);
    if (!imageUrl) return Response.json({ error: "전체 피드백 이미지 주소가 올바르지 않습니다." }, { status: 400 });
    const token = crypto.randomUUID().replaceAll("-", "");
    const db = await ensureShareLinkTable();
    await db.prepare("INSERT INTO learning_share_links(token,student_id,student_name,image_url) VALUES(?,?,?,?)").bind(token, studentId, studentName, imageUrl).run();
    return Response.json({ detailUrl: `${new URL(request.url).origin}/kakao-report/${token}` });
  } catch (error) {
    console.error("share-link POST failed", error);
    return Response.json({ error: "전체 피드백 연결주소를 만들지 못했습니다." }, { status: 500 });
  }
}
