import {database,ensureLearningSchema,studentSession} from "../_shared";
import {sendTestEmailNotification} from "@/app/test-email";
const labels:Record<string,string>={word:"단어퀴즈",passage:"본문퀴즈",blank:"본문 빈칸퀴즈"};
export async function POST(request:Request){
 const student=await studentSession();
 if(!student)return Response.json({error:"학생 로그인이 필요합니다."},{status:401});
 const body=await request.json().catch(()=>({})) as any;
 const area=String(body.area||"");
 if(!labels[area])return Response.json({error:"완료 영역을 확인해 주세요."},{status:400});
 const solved=Math.max(0,Number(body.solved)||0),score=Math.max(0,Number(body.score)||0);
 const rate=solved?Math.round(score/solved*100):0,detail=String(body.detail||"").slice(0,300),db=database();
 await ensureLearningSchema(db);
 const{results}=await db.prepare("SELECT progress_json AS progressJson FROM quiz_progress WHERE student_id=? AND quiz_area=? LIMIT 1").bind(student.id,area).all<any>();
 const progress=results?.[0]?JSON.parse(results[0].progressJson||"{}"):{};
 const recipient=process.env.QUIZ_NOTIFICATION_EMAIL||"jinsim84@kakao.com";
 let emailSent=false;
 try{
  await sendTestEmailNotification({email:recipient,kind:labels[area] as "단어퀴즈"|"본문퀴즈"|"본문 빈칸퀴즈",studentName:student.name,phone:student.parentPhone||"미등록",date:new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"}),level:`${student.school} ${student.grade}`,score,total:solved,details:`${detail} · 교재 ${progress.publisher||""} ${progress.grade||""} ${progress.lesson||""} · 정답률 ${rate}%`,adminUrl:"https://vercel-deploy-mauve-one-18.vercel.app/naesin-admin#quiz-results"});
  emailSent=true;
 }catch{}
 await db.prepare("INSERT INTO quiz_completions(student_id,quiz_area,solved,score,accuracy,detail,email_recipient,email_sent,completed_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)").bind(student.id,area,solved,score,rate,detail,recipient,emailSent?1:0).run();
 return Response.json({ok:true,emailSent,message:emailSent?"학습 완료 기록과 이메일 알림을 보냈습니다.":"학습 완료 기록은 저장했습니다. 이메일 서비스 확인이 필요합니다."});
}
