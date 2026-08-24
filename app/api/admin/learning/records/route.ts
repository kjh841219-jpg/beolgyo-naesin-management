import { clean, database, ensureLearningSchema, requireAdmin, score } from "../_shared";

export async function GET(request:Request){
  if(!(await requireAdmin())) return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const studentId=Number(new URL(request.url).searchParams.get("studentId")); const db=database(); await ensureLearningSchema(db);
  const {results}=await db.prepare("SELECT id, student_id AS studentId, study_date AS studyDate, exam_week AS examWeek, textbook, grammar, school_print AS schoolPrint, vocabulary, writing, mistakes, next_action AS nextAction, teacher_note AS teacherNote, created_at AS createdAt FROM study_records WHERE student_id=? ORDER BY study_date DESC,id DESC").bind(studentId).all();
  return Response.json({items:results??[]});
}
export async function POST(request:Request){
  if(!(await requireAdmin())) return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const b=await request.json().catch(()=>({})); const studentId=Number(b.studentId), studyDate=clean(b.studyDate,10), examWeek=clean(b.examWeek,30);
  if(!studentId||!studyDate||!examWeek) return Response.json({error:"학생, 학습일, 시험 주차를 확인해 주세요."},{status:400});
  const db=database(); await ensureLearningSchema(db);
  const r=await db.prepare("INSERT INTO study_records (student_id,study_date,exam_week,textbook,grammar,school_print,vocabulary,writing,mistakes,next_action,teacher_note) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(studentId,studyDate,examWeek,score(b.textbook),score(b.grammar),score(b.schoolPrint),score(b.vocabulary),score(b.writing),clean(b.mistakes,800),clean(b.nextAction,800),clean(b.teacherNote,1200)).run();
  return Response.json({ok:true,id:r.meta?.last_row_id},{status:201});
}
