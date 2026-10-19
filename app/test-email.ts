export type TestEmailPayload = {
  email: string;
  kind: "레벨테스트" | "DAILY 미니테스트" | "단어퀴즈" | "본문퀴즈" | "본문 빈칸퀴즈";
  studentName: string;
  phone: string;
  date: string;
  level: string;
  score: number;
  total: number;
  details: string;
  adminUrl?: string;
};

export async function sendTestEmailNotification(payload: TestEmailPayload) {
  const response = await fetch("/api/email-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message || "완료 알림 메일을 전송하지 못했습니다.");
}
