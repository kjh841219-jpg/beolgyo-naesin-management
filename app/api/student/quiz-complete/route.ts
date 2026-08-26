import {database,ensureLearningSchema,studentSession} from "../_shared";
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
 const recipient=process.env.QUIZ_NOTIFICATION_EMAIL||"kjh841219@kakao.com";
 let emailSent=false;
 try{
  const form=new URLSearchParams({
   _subject:`[벌교미래엔영어] ${student.name} 학생 ${labels[area]} 완료`,
   _template:"table",_captcha:"false",
   "학생이름":student.name,"학교·학년":`${student.school} ${student.grade}`,
   "완료영역":labels[area],"교재정보":`${progress.publisher||""} ${progress.grade||""} ${progress.lesson||""}`,
   "학습내용":detail,"푼문제":`${solved}문제`,"정답":`${score}문제`,"정답률":`${rate}%`,
   "완료시각":new Date().toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})
  });
  const response=await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8",Accept:"application/json"},body:form.toString()});
  const result=await response.json().catch(()=>({})) as any;
  emailSent=response.ok&&(result.success===true||result.success==="true");
 }catch{}
 await db.prepare("INSERT INTO quiz_completions(student_id,quiz_area,solved,score,accuracy,detail,email_recipient,email_sent,completed_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)").bind(student.id,area,solved,score,rate,detail,recipient,emailSent?1:0).run();
 return Response.json({ok:true,emailSent,message:emailSent?"학습 완료 기록과 이메일 알림을 보냈습니다.":"학습 완료 기록은 저장했습니다. 이메일 서비스 확인이 필요합니다."});
}
