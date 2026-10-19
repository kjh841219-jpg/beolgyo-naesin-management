import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../admin-auth";
import { defaultLandingContent, sanitizeLandingContent } from "../../content";
import { cleanText, createDailyResult, getDailyResults, getJsonSetting } from "../../record-store";
import type { TestEmailPayload } from "../../test-email";
import { sendTestEmailNotificationServer } from "../../lib/test-email-server";

export const dynamic = "force-dynamic";
const score = (value: unknown, max = 20) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "관리자 로그인이 필요합니다." }, { status: 401 });
  return NextResponse.json({ items: await getDailyResults() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const studentName = cleanText(body.studentName, 40);
    const phone = cleanText(body.phone, 30);
    const levelId = cleanText(body.levelId, 40);
    const levelLabel = cleanText(body.levelLabel, 60);
    const testDate = cleanText(body.testDate, 10);
    if (!studentName || !phone || !levelId || !levelLabel || !/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
      return NextResponse.json({ message: "학생 정보와 테스트 날짜를 확인해 주세요." }, { status: 400 });
    }
    const record = await createDailyResult({
      studentName, phone, levelId, levelLabel, testDate,
      score: score(body.score), total: score(body.total),
      listening: score(body.listening), listeningTotal: score(body.listeningTotal),
      vocabulary: score(body.vocabulary), vocabularyTotal: score(body.vocabularyTotal),
      grammar: score(body.grammar), grammarTotal: score(body.grammarTotal),
      reading: score(body.reading), readingTotal: score(body.readingTotal),
    });
    let emailSent = false;
    let emailMessage = "";
    let emailPayload: TestEmailPayload | undefined;
    try {
      const savedContent = await getJsonSetting<unknown>("landing-content.json");
      const content = savedContent ? sanitizeLandingContent(savedContent) : defaultLandingContent;
      const grammarText = record.grammarTotal ? ` · 문법 ${record.grammar}/${record.grammarTotal}` : "";
      emailPayload = {
        email: content.notificationEmail,
        kind: "DAILY 미니테스트",
        studentName: record.studentName,
        phone: record.phone,
        date: record.testDate,
        level: record.levelLabel,
        score: record.score,
        total: record.total,
        details: `듣기 ${record.listening}/${record.listeningTotal} · 단어 ${record.vocabulary}/${record.vocabularyTotal}${grammarText} · 리딩 ${record.reading}/${record.readingTotal}`,
      };
      await sendTestEmailNotificationServer(emailPayload);
      emailSent = true;
      emailMessage = `${content.notificationEmail}로 완료 알림을 전송했습니다.`;
      console.info("daily-test email notification sent", { resultId: record.id, recipient: content.notificationEmail });
    } catch (error) {
      emailMessage = error instanceof Error ? error.message : "카카오메일 완료 알림을 전송하지 못했습니다.";
      console.error("daily-test email notification failed", { resultId: record.id, message: emailMessage });
    }
    return NextResponse.json({ ok: true, item: record, emailSent, emailMessage, emailPayload: emailSent ? undefined : emailPayload }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "DAILY 테스트 결과 저장에 실패했습니다." }, { status: 500 });
  }
}
