import { NextResponse } from "next/server";
import { sendTestEmailNotificationServer } from "../../lib/test-email-server";
import type { TestEmailPayload } from "../../test-email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TestEmailPayload;
    await sendTestEmailNotificationServer(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "카카오메일 알림을 전송하지 못했습니다.";
    console.error("email notification failed", { message });
    return NextResponse.json({ message }, { status: 502 });
  }
}
