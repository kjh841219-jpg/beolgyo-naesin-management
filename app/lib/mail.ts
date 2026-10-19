type NotificationEmail = {
  subject: string;
  text: string;
};

import { sendTransactionalEmail } from "./email-provider";

const DEFAULT_RECIPIENT = "jinsim84@kakao.com";

export async function sendNotificationEmail({ subject, text }: NotificationEmail) {
  const recipient = (process.env.NOTIFICATION_EMAIL || DEFAULT_RECIPIENT).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("알림 이메일 주소가 올바르지 않습니다.");
  }

  await sendTransactionalEmail({ to: recipient, subject, text });
}
