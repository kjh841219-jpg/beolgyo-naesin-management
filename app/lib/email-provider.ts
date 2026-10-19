type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
};

const DEFAULT_FROM = "벌교미래엔영어 <onboarding@resend.dev>";

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail({ to, subject, text }: TransactionalEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("메일 발송 서비스 연결이 필요합니다. Vercel에서 Resend 무료 연동 약관에 동의해 주세요.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `beolgyo-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
      to: [to],
      subject,
      text,
      html: `<div style="font-family:Arial,'Noto Sans KR',sans-serif;line-height:1.7;white-space:pre-wrap">${htmlEscape(text)}</div>`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const result = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };
  if (!response.ok || !result.id) {
    throw new Error(`메일 발송 실패(${response.status}): ${result.message || result.name || "Resend 응답 오류"}`);
  }
  return result.id;
}
