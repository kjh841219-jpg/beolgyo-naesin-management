type TestEmailPayload = {
  email: string;
  kind: "레벨테스트" | "DAILY 미니테스트";
  studentName: string;
  phone: string;
  date: string;
  level: string;
  score: number;
  total: number;
  details: string;
};

export async function sendTestEmailNotification(payload: TestEmailPayload) {
  const email = payload.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("결과 알림 이메일 주소를 확인해 주세요.");
  const emailForm = new URLSearchParams({
    _subject: `[벌교미래엔영어] ${payload.studentName} 학생 ${payload.kind} 완료`,
    _template: "table",
    _captcha: "false",
    "알림구분": `${payload.kind} 완료 알림`,
    "학생이름": payload.studentName,
    "학부모연락처": payload.phone,
    "응시일": payload.date,
    "응시단계": payload.level,
    "총점": `${payload.score}/${payload.total}`,
    "영역별결과": payload.details,
    "관리자페이지": "https://vercel-deploy-mauve-one-18.vercel.app/admin",
  });
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", Accept: "application/json" },
    body: emailForm.toString(),
  });
  const result = (await response.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
  if (!response.ok || (result.success !== true && result.success !== "true")) throw new Error(result.message ?? "완료 알림 메일을 전송하지 못했습니다.");
}
