import { env } from "cloudflare:workers";
import { clean,database,ensureLearningSchema,requireAdmin } from "../_shared";

async function hmac(secret:string,value:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function authorization(apiKey:string,secret:string){const date=new Date().toISOString(),salt=crypto.randomUUID().replaceAll("-","");return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${await hmac(secret,date+salt)}`;}
export async function POST(request:Request){
 if(!(await requireAdmin()))return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
 const b=await request.json().catch(()=>({})),channel=clean(b.channel,10),to=clean(b.to,20).replace(/\D/g,""),text=clean(b.text,1900),studentId=Number(b.studentId);
 if(!["sms","kakao"].includes(channel)||!/^01\d{8,9}$/.test(to)||!text)return Response.json({error:"채널, 수신번호, 메시지를 확인해 주세요."},{status:400});
 const e=env as unknown as Record<string,string|undefined>,apiKey=e.SOLAPI_API_KEY??"",secret=e.SOLAPI_API_SECRET??"",from=(e.SOLAPI_SENDER??"").replace(/\D/g,"");
 if(!apiKey||!secret||!from)return Response.json({error:"솔라피 API Key, Secret, 발신번호를 사이트 환경변수에 등록해 주세요.",code:"SOLAPI_CONFIGURATION_REQUIRED"},{status:503});
 const message:any={to,from,text,subject:"벌교미래엔영어 학습 안내",autoTypeDetect:true};
 if(channel==="kakao"){const pfId=e.SOLAPI_KAKAO_PF_ID,templateId=e.SOLAPI_KAKAO_TEMPLATE_ID;if(!pfId||!templateId)return Response.json({error:"카카오 채널 PF ID와 승인된 템플릿 ID를 등록해 주세요.",code:"KAKAO_CONFIGURATION_REQUIRED"},{status:503});message.kakaoOptions={pfId,templateId,variables:{"#{내용}":text},disableSms:false};}
 const response=await fetch("https://api.solapi.com/messages/v4/send-many/detail",{method:"POST",headers:{Authorization:await authorization(apiKey,secret),"Content-Type":"application/json"},body:JSON.stringify({messages:[message],showMessageList:true})});
 const result=await response.json().catch(()=>({})) as any;const failed=result.failedMessageList?.[0];const status=response.ok&&!failed?"sent":"failed",providerId=result.messageList?.[0]?.messageId??"";const db=database();await ensureLearningSchema(db);await db.prepare("INSERT INTO message_logs(student_id,channel,recipient,body,status,provider_id) VALUES(?,?,?,?,?,?)").bind(studentId,channel,to,text,status,providerId).run();
 if(status==="failed")return Response.json({error:failed?.statusMessage||result.errorMessage||result.message||"발송에 실패했습니다."},{status:502});return Response.json({ok:true,message:"메시지가 솔라피에 정상 접수되었습니다.",messageId:providerId});
}
