import { env } from "cloudflare:workers";
import { clean, database, ensureLearningSchema, requireAdmin } from "../_shared";

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(value => value.toString(16).padStart(2, "0")).join("");
}
async function authorization(apiKey: string, secret: string) {
  const date = new Date().toISOString(), salt = crypto.randomUUID().replaceAll("-", "");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${await hmac(secret, date + salt)}`;
}
async function base64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer()); let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const contentType = request.headers.get("content-type") || "";
  const body: Record<string, unknown> = contentType.includes("multipart/form-data") ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  const channel = clean(body.channel, 10), to = clean(body.to, 20).replace(/\D/g, ""), text = clean(body.text, 1900), studentId = Number(body.studentId);
  const image = body.image instanceof File && body.image.size ? body.image : null;
  if (!["sms", "kakao"].includes(channel) || !/^01\d{8,9}$/.test(to) || !text) return Response.json({ error: "채널, 수신번호, 메시지를 확인해 주세요." }, { status: 400 });
  if (image && (image.type !== "image/jpeg" || image.size > 200_000)) return Response.json({ error: "이미지 문자는 JPG 형식, 200KB 이하만 전송할 수 있습니다." }, { status: 400 });

  const values = env as unknown as Record<string, string | undefined>;
  const apiKey = values.SOLAPI_API_KEY ?? "", secret = values.SOLAPI_API_SECRET ?? "", from = (values.SOLAPI_SENDER ?? "01040322588").replace(/\D/g, "");
  if (!apiKey || !secret || !from) return Response.json({ error: "솔라피 API Key, Secret, 발신번호를 사이트 환경변수에 등록해 주세요.", code: "SOLAPI_CONFIGURATION_REQUIRED" }, { status: 503 });

  let imageId = "";
  if (image) {
    const uploadResponse = await fetch("https://api.solapi.com/storage/v1/files", {
      method: "POST", headers: { Authorization: await authorization(apiKey, secret), "Content-Type": "application/json" },
      body: JSON.stringify({ file: await base64(image), type: "MMS", name: `${studentId || "student"}-learning-feedback.jpg` }),
    });
    const upload = await uploadResponse.json().catch(() => ({})) as { fileId?: string; errorMessage?: string; message?: string };
    if (!uploadResponse.ok || !upload.fileId) return Response.json({ error: upload.errorMessage || upload.message || "학습 리포트 이미지를 솔라피에 올리지 못했습니다." }, { status: 502 });
    imageId = upload.fileId;
  }

  const message: Record<string, unknown> = { to, from, text, subject: "벌교미래엔영어 학습 피드백", autoTypeDetect: true };
  if (imageId) { message.imageId = imageId; message.type = "MMS"; }
  if (channel === "kakao") {
    const pfId = values.SOLAPI_KAKAO_PF_ID, templateId = values.SOLAPI_KAKAO_TEMPLATE_ID;
    if (!pfId || !templateId) return Response.json({ error: "카카오 채널 PF ID와 승인된 템플릿 ID를 등록해 주세요.", code: "KAKAO_CONFIGURATION_REQUIRED" }, { status: 503 });
    message.kakaoOptions = { pfId, templateId, variables: { "#{내용}": text }, disableSms: false };
  }
  const response = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST", headers: { Authorization: await authorization(apiKey, secret), "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [message], showMessageList: true }),
  });
  const result = await response.json().catch(() => ({})) as { failedMessageList?: { statusMessage?: string }[]; messageList?: { messageId?: string }[]; errorMessage?: string; message?: string };
  const failed = result.failedMessageList?.[0], status = response.ok && !failed ? "sent" : "failed", providerId = result.messageList?.[0]?.messageId ?? "";
  const db = database(); await ensureLearningSchema(db);
  await db.prepare("INSERT INTO message_logs(student_id,channel,recipient,body,status,provider_id) VALUES(?,?,?,?,?,?)").bind(studentId, imageId ? "mms" : channel, to, text, status, providerId).run();
  if (status === "failed") return Response.json({ error: failed?.statusMessage || result.errorMessage || result.message || "발송에 실패했습니다." }, { status: 502 });
  return Response.json({ ok: true, message: imageId ? "그래프 이미지와 학습 피드백이 솔라피 MMS로 정상 접수되었습니다." : "학습 피드백 문자가 솔라피에 정상 접수되었습니다.", messageId: providerId, imageId: imageId || undefined });
}
