import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../admin-auth";
import { cleanText, createDailyResult, getDailyResults } from "../../record-store";

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
    return NextResponse.json({ ok: true, item: record }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "DAILY 테스트 결과 저장에 실패했습니다." }, { status: 500 });
  }
}
