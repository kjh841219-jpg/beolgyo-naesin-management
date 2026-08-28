type NotificationEmail = {
  subject: string;
  text: string;
};

const DEFAULT_RECIPIENT = "jinsim84@kakao.com";

export async function sendNotificationEmail({ subject, text }: NotificationEmail) {
  const recipient = (process.env.NOTIFICATION_EMAIL || DEFAULT_RECIPIENT).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("알림 이메일 주소가 올바르지 않습니다.");
  }

  const form = new URLSearchParams({
    _subject: subject,
    _template: "table",
    _captcha: "false",
    내용: text,
  });
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
      },
      body: form.toString(),
      cache: "no-store",
    },
  );
  const result = (await response.json().catch(() => ({}))) as {
    success?: boolean | string;
    message?: string;
  };
  if (!response.ok || (result.success !== true && result.success !== "true")) {
    throw new Error(result.message || "알림 메일 전송에 실패했습니다.");
  }
}
