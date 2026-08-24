import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../admin-auth";
import { cleanText } from "../../../record-store";
import { createSolapiAuthorization, resolveSolapiCredentials } from "../../../solapi-auth";

const SOLAPI_URL = "https://api.solapi.com/messages/v4/send-many/detail";
const SOLAPI_SENDER = "01040322588";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "관리자 로그인이 필요합니다." }, { status: 401 });
  const resolved = await resolveSolapiCredentials();
  if (!resolved.credentials) return NextResponse.json({ message: resolved.message }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { to?: unknown; text?: unknown } | null;
  const to = cleanText(body?.to, 30).replace(/\D/g, "");
  const messageText = cleanText(body?.text, 1900);
  if (!/^01\d{8,9}$/.test(to) || !messageText) return NextResponse.json({ message: "수신번호와 메시지 내용을 확인해 주세요." }, { status: 400 });

  const authorization = createSolapiAuthorization(resolved.credentials);
  const response = await fetch(SOLAPI_URL, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ to, from: SOLAPI_SENDER, text: messageText, subject: "벌교미래엔영어 결과 안내", autoTypeDetect: true }], showMessageList: true }),
  });
  const result = await response.json().catch(() => ({})) as { failedMessageList?: Array<{ statusMessage?: string }>; messageList?: Array<{ messageId?: string }>; errorMessage?: string; message?: string };
  const failure = result.failedMessageList?.[0];
  if (!response.ok || failure) {
    const reason = failure?.statusMessage || result.errorMessage || result.message || "문자 발송에 실패했습니다.";
    const message = reason.includes("허용되지 않은 IP") ? "솔라피 API Key의 IP 접근 제한을 해제해 주세요. Vercel 서버 IP는 변경될 수 있습니다." : reason;
    return NextResponse.json({ message }, { status: 502 });
  }
  return NextResponse.json({ ok: true, message: "문자가 솔라피에 정상 접수되었습니다.", messageId: result.messageList?.[0]?.messageId ?? "" });
}
