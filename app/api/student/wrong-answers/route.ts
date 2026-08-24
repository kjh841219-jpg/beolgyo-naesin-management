import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { studentSession } from "../_shared";

type Bucket = { put(key:string,value:ArrayBuffer,options?:unknown):Promise<unknown>; get(key:string):Promise<{body:BodyInit;httpMetadata?:{contentType?:string}}|null>; delete(key:string):Promise<void> };
const bucket=()=>{const value=(env as unknown as {UPLOADS?:Bucket}).UPLOADS;if(!value)throw new Error("UPLOADS binding unavailable");return value};
const text=(form:FormData,key:string,max=1000)=>String(form.get(key)??"").trim().slice(0,max);
const areaAnalysis=(title:string,questionType:string,studentNote:string)=>{
  const source=`${title} ${questionType} ${studentNote}`;
  const area=/문법|어법|시제|수일치/.test(source)?"문법":/단어|어휘|숙어/.test(source)?"어휘":/서술|영작|쓰기/.test(source)?"서술형":/프린트|학습지/.test(source)?"학교 프린트":"본문";
  const note=studentNote||"학생 자기평가가 아직 작성되지 않았습니다.";
  return `[자동 기초분석 · 사진 확인 전]\n\n[본문] 핵심 문장과 내용 흐름을 정확히 재현했는지 사진을 보며 확인합니다.\n[문법] 시제·수일치·어순·문장 구조의 반복 실수를 확인합니다.\n[어휘] 철자와 핵심 단어·숙어 사용을 확인합니다.\n[서술형] 문제 조건 반영, 문장 완성도와 철자·문장부호를 확인합니다.\n[중점 영역] ${area}\n[학생 자기평가] ${note}\n[오답 원인] ${area} 영역의 정확도와 반복 실수 여부를 우선 점검합니다.\n[다음 학습] 틀린 부분을 표시하고 같은 문장을 다시 쓰거나 유사 문제로 재확인합니다.\n\n[학부모 안내문 초안]\n${title||"학습 결과물"}을 제출했습니다. 현재 ${area} 영역을 중심으로 학습 과정과 정확도를 확인하고 있습니다. 잘한 부분은 유지하고 부족한 부분은 다시 쓰기와 확인 문제로 보완해 다음 학습에서 개선 여부까지 점검하겠습니다.`;
};

export async function GET(request:NextRequest){
  const student=await studentSession();if(!student)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
  const db=(await import("../_shared")).database();
  const imageId=Number(request.nextUrl.searchParams.get("imageId")||0);
  if(imageId){const{results}=await db.prepare("SELECT image_key AS imageKey,content_type AS contentType FROM wrong_answer_photos WHERE id=? AND student_id=? LIMIT 1").bind(imageId,student.id).all<any>();const row=results?.[0];if(!row)return NextResponse.json({error:"사진을 찾을 수 없습니다."},{status:404});const object=await bucket().get(row.imageKey);if(!object)return NextResponse.json({error:"사진 파일을 찾을 수 없습니다."},{status:404});return new NextResponse(object.body,{headers:{"Content-Type":row.contentType,"Cache-Control":"private, max-age=300"}})}
  const{results}=await db.prepare("SELECT id,study_date AS studyDate,title,question_type AS questionType,wrong_reason AS wrongReason,correct_reason AS correctReason,retry_plan AS retryPlan,student_note AS studentNote,teacher_analysis AS teacherAnalysis,status,created_at AS createdAt FROM wrong_answer_photos WHERE student_id=? ORDER BY study_date DESC,id DESC LIMIT 50").bind(student.id).all<any>();
  return NextResponse.json({photos:results??[]});
}

export async function POST(request:NextRequest){
  const student=await studentSession();if(!student)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
  const form=await request.formData();const file=form.get("photo");
  if(!(file instanceof File)||file.size===0)return NextResponse.json({error:"오답노트 사진을 선택해 주세요."},{status:400});
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))return NextResponse.json({error:"JPG, PNG, WEBP 사진만 올릴 수 있습니다."},{status:400});
  if(file.size>8*1024*1024)return NextResponse.json({error:"사진은 8MB 이하로 올려 주세요."},{status:400});
  const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const key=`wrong-answers/${student.id}/${crypto.randomUUID()}.${ext}`;
  await bucket().put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  try{const db=(await import("../_shared")).database();const title=text(form,"title",100)||"오답노트",questionType=text(form,"questionType",100),studentNote=text(form,"studentNote")||text(form,"learningNote"),analysis=areaAnalysis(title,questionType,studentNote);const result=await db.prepare("INSERT INTO wrong_answer_photos (student_id,study_date,title,image_key,content_type,file_name,question_type,wrong_reason,correct_reason,retry_plan,student_note,teacher_analysis,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(student.id,text(form,"studyDate",10)||new Date().toISOString().slice(0,10),title,key,file.type,file.name.slice(0,200),questionType,text(form,"wrongReason"),text(form,"correctReason"),text(form,"retryPlan"),studentNote,analysis,"auto_analyzed").run();return NextResponse.json({ok:true,id:result.meta?.last_row_id,analysis});}catch(error){await bucket().delete(key);throw error}
}
