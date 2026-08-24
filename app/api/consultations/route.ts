import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../admin-auth";
import { cleanText, createConsultation, getConsultations } from "../../record-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  return NextResponse.json({ items: await getConsultations() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (cleanText(body.website, 100)) return NextResponse.json({ ok: true });

    const input = {
      studentName: cleanText(body.studentName, 40),
      phone: cleanText(body.phone, 30),
      grade: cleanText(body.grade, 30),
      consultationAt: cleanText(body.consultationAt, 60),
      learningExperience: cleanText(body.learningExperience, 100),
      desiredDirection: cleanText(body.desiredDirection, 800),
    };

    if (!input.studentName || !input.phone || !input.grade || !input.consultationAt) {
      return NextResponse.json({ message: "필수 신청 정보를 확인해 주세요." }, { status: 400 });
    }

    await createConsultation(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "상담 신청 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
