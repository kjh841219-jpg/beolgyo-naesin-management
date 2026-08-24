import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../admin-auth";
import { cleanText, createLevelResult, getLevelResults } from "../../record-store";

export const dynamic = "force-dynamic";

function cleanScore(value: unknown, max: number) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(max, Math.round(score))) : 0;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  return NextResponse.json({ items: await getLevelResults() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const studentName = cleanText(body.studentName, 40);
    const phone = cleanText(body.phone, 30);
    const trackId = cleanText(body.trackId, 40);
    const trackLabel = cleanText(body.trackLabel, 80);

    if (!studentName || !phone || !trackId || !trackLabel) {
      return NextResponse.json({ message: "학생 이름과 연락처를 입력해 주세요." }, { status: 400 });
    }

    await createLevelResult({
      studentName,
      phone,
      trackId,
      trackLabel,
      score: cleanScore(body.score, 100),
      total: cleanScore(body.total, 100),
      vocabulary: cleanScore(body.vocabulary, 100),
      vocabularyTotal: cleanScore(body.vocabularyTotal, 100),
      grammar: cleanScore(body.grammar, 100),
      grammarTotal: cleanScore(body.grammarTotal, 100),
      reading: cleanScore(body.reading, 100),
      readingTotal: cleanScore(body.readingTotal, 100),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "레벨테스트 결과 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
