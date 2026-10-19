import { database, requireAdmin } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureShareTable() {
  const db = database();
  await db.prepare("CREATE TABLE IF NOT EXISTS learning_share_images (token TEXT PRIMARY KEY, student_id INTEGER NOT NULL, image_base64 TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  return db;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const form = await request.formData();
  const image = form.get("image"), studentId = Number(form.get("studentId"));
  if (!(image instanceof File) || image.type !== "image/jpeg" || !image.size || image.size > 1_500_000) {
    return Response.json({ error: "학습피드백 JPG 이미지를 1.5MB 이하로 만들어 주세요." }, { status: 400 });
  }
  const token = crypto.randomUUID().replaceAll("-", "");
  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const db = await ensureShareTable();
  await db.prepare("INSERT INTO learning_share_images(token,student_id,image_base64,expires_at) VALUES(?,?,?,CURRENT_TIMESTAMP + INTERVAL '100 years')").bind(token, studentId || 0, imageBase64).run();
  return Response.json({ imageUrl: `${new URL(request.url).origin}/api/admin/learning/share-image?token=${token}` });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.replace(/[^a-f0-9]/gi, "").slice(0, 64) || "";
  if (!token) return new Response("Not found", { status: 404 });
  const db = await ensureShareTable();
  const result = await db.prepare("SELECT image_base64 FROM learning_share_images WHERE token=? AND expires_at>CURRENT_TIMESTAMP LIMIT 1").bind(token).all<{ image_base64: string }>();
  const item = result.results[0];
  if (!item) return new Response("Image expired", { status: 404 });
  return new Response(Buffer.from(item.image_base64, "base64"), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
}
