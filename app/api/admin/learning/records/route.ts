import { clean, database, ensureLearningSchema, requireAdmin, score } from "../_shared";

export async function GET(request:Request){
  if(!(await requireAdmin())) return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const studentId=Number(new URL(request.url).searchParams.get("studentId")); const db=database(); await ensureLearningSchema(db);
  const {results}=await db.prepare("SELECT id, student_id AS studentId, study_date AS studyDate, exam_term AS examTerm, exam_week AS examWeek, textbook, grammar, school_print AS schoolPrint, vocabulary, writing, problem_solving AS problemSolving, wrong_notebook AS wrongNotebook, task_scores AS taskScores, mistakes, next_action AS nextAction, teacher_note AS teacherNote, created_at AS createdAt FROM study_records WHERE student_id=? ORDER BY study_date DESC,id DESC").bind(studentId).all();
  return Response.json({items:results??[]});
}
export async function POST(request:Request){
  if(!(await requireAdmin())) return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const b=await request.json().catch(()=>({})); const studentId=Number(b.studentId), studyDate=clean(b.studyDate,10), examTerm=clean(b.examTerm,30)||"시험 미지정", examWeek=clean(b.examWeek,30);
  if(!studentId||!studyDate||!examWeek) return Response.json({error:"학생, 시험 종류, 학습일, 시험 주차를 확인해 주세요."},{status:400});
  const taskScores=JSON.stringify(b.taskScores&&typeof b.taskScores==="object"?b.taskScores:{}).slice(0,4000);
  const db=database(); await ensureLearningSchema(db);
  const r=await db.prepare("INSERT INTO study_records (student_id,study_date,exam_term,exam_week,textbook,grammar,school_print,vocabulary,writing,problem_solving,wrong_notebook,task_scores,mistakes,next_action,teacher_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(studentId,studyDate,examTerm,examWeek,score(b.textbook),score(b.grammar),score(b.schoolPrint),score(b.vocabulary),score(b.writing),score(b.problemSolving),score(b.wrongNotebook),taskScores,clean(b.mistakes,800),clean(b.nextAction,800),clean(b.teacherNote,1200)).run();
  return Response.json({ok:true,id:r.meta?.last_row_id},{status:201});
}

export async function PATCH(request:Request){
  if(!(await requireAdmin())) return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const b=await request.json().catch(()=>({})); const studentId=Number(b.studentId),recordId=Number(b.recordId);
  if(!studentId||!recordId)return Response.json({error:"수정할 학생 기록을 확인해 주세요."},{status:400});
  const db=database(); await ensureLearningSchema(db);
  const {results}=await db.prepare("SELECT id FROM study_records WHERE id=? AND student_id=? LIMIT 1").bind(recordId,studentId).all();
  if(!results?.length)return Response.json({error:"수정할 기록을 찾지 못했습니다."},{status:404});
  const taskScores=JSON.stringify(b.taskScores&&typeof b.taskScores==="object"?b.taskScores:{}).slice(0,4000);
  await db.prepare("UPDATE study_records SET study_date=?,exam_term=?,exam_week=?,textbook=?,grammar=?,school_print=?,vocabulary=?,writing=?,problem_solving=?,wrong_notebook=?,task_scores=?,mistakes=?,next_action=?,teacher_note=? WHERE id=? AND student_id=?").bind(clean(b.studyDate,10),clean(b.examTerm,30)||"시험 미지정",clean(b.examWeek,30),score(b.textbook),score(b.grammar),score(b.schoolPrint),score(b.vocabulary),score(b.writing),score(b.problemSolving),score(b.wrongNotebook),taskScores,clean(b.mistakes,800),clean(b.nextAction,800),clean(b.teacherNote,1200),recordId,studentId).run();
  return Response.json({ok:true});
}

export async function DELETE(request:Request){
  if(!(await requireAdmin())) return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const b=await request.json().catch(()=>({}));
  const studentId=Number(b.studentId),recordId=Number(b.recordId);
  if(!studentId||!recordId)return Response.json({error:"삭제할 학생 기록을 확인해 주세요."},{status:400});
  const db=database();await ensureLearningSchema(db);
  const {results}=await db.prepare("SELECT id,study_date AS studyDate,exam_week AS examWeek FROM study_records WHERE id=? AND student_id=? LIMIT 1").bind(recordId,studentId).all();
  if(!results?.length)return Response.json({error:"삭제할 기록을 찾지 못했습니다."},{status:404});
  await db.prepare("DELETE FROM study_records WHERE id=? AND student_id=?").bind(recordId,studentId).run();
  return Response.json({ok:true,deleted:results[0]});
}
