import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { defaultLandingContent, sanitizeLandingContent } from "../../content";
import { isAdminAuthenticated } from "../../admin-auth";
import { getJsonSetting, setJsonSetting } from "../../record-store";

export const runtime = "nodejs";
const CONTENT_PATH = "landing-content.json";

async function readContent() {
  const content = await getJsonSetting<unknown>(CONTENT_PATH);
  return content ? sanitizeLandingContent(content) : defaultLandingContent;
}

export async function GET() {
  try {
    return NextResponse.json(await readContent(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Content read failed", error);
    return NextResponse.json(defaultLandingContent);
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "저장할 내용을 확인해 주세요." }, { status: 400 });

  try {
    const content = sanitizeLandingContent(payload);
    await setJsonSetting(CONTENT_PATH, content);
    revalidatePath("/academy");
    revalidatePath("/academy-calendar");
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    console.error("Content save failed", error);
    return NextResponse.json({ error: "서버 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  const payload = await request.json().catch(() => null) as { academyEvents?: unknown } | null;
  if (!payload || !Array.isArray(payload.academyEvents)) {
    return NextResponse.json({ error: "저장할 일정 내용을 확인해 주세요." }, { status: 400 });
  }

  try {
    const current = await readContent();
    const content = sanitizeLandingContent({ ...current, academyEvents: payload.academyEvents });
    await setJsonSetting(CONTENT_PATH, content);
    revalidatePath("/academy");
    revalidatePath("/academy-calendar");
    return NextResponse.json({ ok: true, content, savedCount: content.academyEvents.length });
  } catch (error) {
    console.error("Calendar save failed", error);
    return NextResponse.json({ error: "일정 서버 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
