import type { TestEmailPayload } from "../test-email";
import { sendTransactionalEmail } from "./email-provider";

export async function sendTestEmailNotificationServer(payload: TestEmailPayload) {
  const email = payload.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("결과 알림 이메일 주소를 확인해 주세요.");
  const text = [
    `${payload.kind} 완료 알림`,
    `학생이름: ${payload.studentName}`,
    `학부모연락처: ${payload.phone}`,
    `응시일: ${payload.date}`,
    `응시단계: ${payload.level}`,
    `총점: ${payload.score}/${payload.total}`,
    `영역별결과: ${payload.details}`,
    `관리자페이지: ${payload.adminUrl ?? "https://vercel-deploy-mauve-one-18.vercel.app/admin"}`,
  ].join("\n");
  return sendTransactionalEmail({
    to: email,
    subject: `[벌교미래엔영어] ${payload.studentName} 학생 ${payload.kind} 완료`,
    text,
  });
}
