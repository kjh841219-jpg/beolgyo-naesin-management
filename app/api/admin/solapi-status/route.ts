import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../admin-auth";
import { resolveSolapiCredentials } from "../../../solapi-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "관리자 로그인이 필요합니다." }, { status: 401 });
  const kakaoConfigured = Boolean(process.env.SOLAPI_KAKAO_PF_ID && process.env.SOLAPI_KAKAO_TEMPLATE_ID);
  const resolved = await resolveSolapiCredentials();
  if (!resolved.credentials) return NextResponse.json({ smsConfigured: false, kakaoConfigured, message: resolved.message }, { status: 502 });
  return NextResponse.json({ smsConfigured: true, kakaoConfigured, balance: resolved.balance ?? 0, point: resolved.point ?? 0, message: resolved.message });
}
