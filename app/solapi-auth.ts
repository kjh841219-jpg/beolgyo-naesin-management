import { createHmac, randomBytes } from "node:crypto";

const BALANCE_URL = "https://api.solapi.com/cash/v1/balance";

export type SolapiCredentials = { apiKey: string; apiSecret: string };

export function createSolapiAuthorization({ apiKey, apiSecret }: SolapiCredentials) {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

function addCandidate(list: SolapiCredentials[], apiKey?: string, apiSecret?: string) {
  const key = (apiKey ?? "").trim();
  const secret = (apiSecret ?? "").trim();
  if (!/^NCS[A-Z0-9]{13}$/.test(key) || !secret) return;
  if (!list.some((item) => item.apiKey === key && item.apiSecret === secret)) list.push({ apiKey: key, apiSecret: secret });
}

export async function resolveSolapiCredentials() {
  const candidates: SolapiCredentials[] = [];
  const configuredKey = (process.env.SOLAPI_API_KEY ?? "").trim();
  const pairedSecret = (configuredKey ? process.env[configuredKey] : "")?.trim() ?? "";
  const configuredSecret = (process.env.SOLAPI_API_SECRET ?? "").trim();

  addCandidate(candidates, configuredKey, pairedSecret);
  addCandidate(candidates, configuredKey, configuredSecret);
  addCandidate(candidates, configuredSecret, configuredKey);

  if (!candidates.length) return { credentials: null, message: "환경변수 입력이 올바르지 않습니다. SOLAPI_API_KEY에는 NCS로 시작하는 16자리 Key를, SOLAPI_API_SECRET에는 함께 발급된 긴 Secret을 넣어 주세요." };

  let lastMessage = "솔라피 API Key와 API Secret 조합이 올바르지 않습니다.";
  for (const credentials of candidates) {
    const response = await fetch(BALANCE_URL, {
      headers: { Authorization: createSolapiAuthorization(credentials) },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as { balance?: number; point?: number; errorMessage?: string; message?: string };
    if (response.ok) return { credentials, balance: result.balance ?? 0, point: result.point ?? 0, message: "솔라피 문자 API가 정상 연결되었습니다." };
    lastMessage = result.errorMessage || result.message || lastMessage;
  }
  return { credentials: null, message: `${lastMessage} SOLAPI_API_KEY와 SOLAPI_API_SECRET을 같은 발급 세트로 다시 확인해 주세요.` };
}
