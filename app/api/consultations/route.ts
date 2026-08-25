import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../admin-auth";
import { cleanText, createConsultation, getConsultations } from "../../record-store";
import { sendNotificationEmail } from "../../lib/mail";

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

    const record = await createConsultation(input);

    // 이메일 발송 실패가 상담 신청 자체를 실패시키지 않도록 별도로 처리합니다.
    sendNotificationEmail({
      subject: `[상담 신청] ${record.studentName} 학생`,
      text: [
        `이름: ${record.studentName}`,
        `연락처: ${record.phone}`,
        `학년: ${record.grade}`,
        `희망 상담일시: ${record.consultationAt}`,
        `학습 경험: ${record.learningExperience || "-"}`,
        `희망 방향: ${record.desiredDirection || "-"}`,
        `신청 시각: ${record.createdAt}`,
      ].join("\n"),
    }).catch((error) => console.error("[consultations] 알림 메일 발송 실패", error));

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "상담 신청 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
