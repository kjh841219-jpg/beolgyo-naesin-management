import {NextRequest,NextResponse} from "next/server";
import {database,ensureLearningSchema,requireAdmin} from "../_shared";

export async function GET(request:NextRequest){
 if(!await requireAdmin())return NextResponse.json({error:"관리자 로그인이 필요합니다."},{status:401});
 const db=database();await ensureLearningSchema(db);
 const studentId=Math.max(0,Number(request.nextUrl.searchParams.get("studentId")||0));
 const [students,daily,dailyCategories,types,recent,liveProgress,completions]=await Promise.all([
  db.prepare(`SELECT s.id,s.name,s.school,s.grade,COUNT(q.id) AS total,COALESCE(SUM(q.correct),0) AS correct,CASE WHEN COUNT(q.id)=0 THEN 0 ELSE ROUND(SUM(q.correct)*100.0/COUNT(q.id)) END AS accuracy,COALESCE(MAX(q.study_date),'') AS lastStudyDate FROM students s LEFT JOIN quiz_attempts q ON q.student_id=s.id AND q.publisher NOT IN ('Story Town','Reading Town','Phonics Town') WHERE (?=0 OR s.id=?) GROUP BY s.id,s.name,s.school,s.grade ORDER BY MAX(q.study_date) DESC,s.name`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.student_id AS studentId,s.name,q.study_date AS studyDate,COUNT(*) AS total,SUM(q.correct) AS correct,ROUND(SUM(q.correct)*100.0/COUNT(*)) AS accuracy FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE q.publisher NOT IN ('Story Town','Reading Town','Phonics Town') AND (?=0 OR q.student_id=?) GROUP BY q.student_id,s.name,q.study_date ORDER BY q.study_date DESC LIMIT 120`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.student_id AS studentId,s.name,q.study_date AS studyDate,CASE WHEN q.quiz_type LIKE 'word-%' THEN 'word' ELSE 'passage' END AS category,COUNT(*) AS total,SUM(q.correct) AS correct,ROUND(SUM(q.correct)*100.0/COUNT(*)) AS accuracy FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE q.publisher NOT IN ('Story Town','Reading Town','Phonics Town') AND (?=0 OR q.student_id=?) GROUP BY q.student_id,s.name,q.study_date,CASE WHEN q.quiz_type LIKE 'word-%' THEN 'word' ELSE 'passage' END ORDER BY q.study_date DESC LIMIT 240`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.student_id AS studentId,s.name,q.quiz_type AS quizType,COUNT(*) AS total,SUM(q.correct) AS correct,ROUND(SUM(q.correct)*100.0/COUNT(*)) AS accuracy FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE q.publisher NOT IN ('Story Town','Reading Town','Phonics Town') AND (?=0 OR q.student_id=?) GROUP BY q.student_id,s.name,q.quiz_type ORDER BY q.student_id,q.quiz_type`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.id,q.student_id AS studentId,s.name,q.publisher,q.grade,q.lesson,q.passage,q.quiz_type AS quizType,q.question_index AS questionIndex,q.correct,q.answer_text AS answerText,q.study_date AS studyDate,q.created_at AS createdAt FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE q.publisher NOT IN ('Story Town','Reading Town','Phonics Town') AND (?=0 OR q.student_id=?) ORDER BY q.id DESC LIMIT 160`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT p.student_id AS studentId,s.name,s.school,s.grade,p.quiz_area AS quizArea,p.progress_json AS progressJson,p.activity_count AS activityCount,p.updated_at AS updatedAt FROM quiz_progress p JOIN students s ON s.id=p.student_id WHERE p.quiz_area<>'story' AND (?=0 OR p.student_id=?) ORDER BY p.updated_at DESC LIMIT 100`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT c.id,c.student_id AS studentId,s.name,c.quiz_area AS quizArea,c.solved,c.score,c.accuracy,c.detail,c.email_sent AS emailSent,c.completed_at AS completedAt FROM quiz_completions c JOIN students s ON s.id=c.student_id WHERE c.quiz_area<>'story' AND (?=0 OR c.student_id=?) ORDER BY c.completed_at DESC,c.id DESC LIMIT 300`).bind(studentId,studentId).all<any>(),
 ]);
 return NextResponse.json({students:students.results??[],daily:daily.results??[],dailyCategories:dailyCategories.results??[],types:types.results??[],recent:recent.results??[],completions:completions.results??[],liveProgress:(liveProgress.results??[]).map((x:any)=>({...x,progress:JSON.parse(x.progressJson||"{}")}))});
}

export async function DELETE(request:NextRequest){
 if(!await requireAdmin())return NextResponse.json({error:"관리자 로그인이 필요합니다."},{status:401});
 if(request.nextUrl.searchParams.get("scope")!=="elementary")return NextResponse.json({error:"삭제 범위를 확인해 주세요."},{status:400});
 const db=database();await ensureLearningSchema(db);
 const elementary="SELECT id FROM students WHERE grade LIKE '초%' OR grade LIKE '%초등%'";
 const [attempts,progress,completions,records]=await Promise.all([
  db.prepare(`SELECT COUNT(*) AS count FROM quiz_attempts WHERE student_id IN (${elementary})`).all<any>(),
  db.prepare(`SELECT COUNT(*) AS count FROM quiz_progress WHERE student_id IN (${elementary})`).all<any>(),
  db.prepare(`SELECT COUNT(*) AS count FROM quiz_completions WHERE student_id IN (${elementary})`).all<any>(),
  db.prepare(`SELECT COUNT(*) AS count FROM study_records WHERE student_id IN (${elementary})`).all<any>(),
 ]);
 await db.batch([
  db.prepare(`DELETE FROM quiz_attempts WHERE student_id IN (${elementary})`),
  db.prepare(`DELETE FROM quiz_progress WHERE student_id IN (${elementary})`),
  db.prepare(`DELETE FROM quiz_completions WHERE student_id IN (${elementary})`),
  db.prepare(`DELETE FROM study_records WHERE student_id IN (${elementary})`),
 ]);
 return NextResponse.json({ok:true,deleted:{quizAttempts:Number(attempts.results?.[0]?.count||0),quizProgress:Number(progress.results?.[0]?.count||0),quizCompletions:Number(completions.results?.[0]?.count||0),studyRecords:Number(records.results?.[0]?.count||0)}});
}
