import {NextRequest,NextResponse} from "next/server";
import {database,ensureLearningSchema,requireAdmin} from "../_shared";

export async function GET(request:NextRequest){
 if(!await requireAdmin())return NextResponse.json({error:"관리자 로그인이 필요합니다."},{status:401});
 const db=database();await ensureLearningSchema(db);
 const studentId=Math.max(0,Number(request.nextUrl.searchParams.get("studentId")||0));
 const [students,daily,dailyCategories,types,recent]=await Promise.all([
  db.prepare(`SELECT s.id,s.name,s.school,s.grade,COUNT(q.id) AS total,COALESCE(SUM(q.correct),0) AS correct,CASE WHEN COUNT(q.id)=0 THEN 0 ELSE ROUND(SUM(q.correct)*100.0/COUNT(q.id)) END AS accuracy,COALESCE(MAX(q.study_date),'') AS lastStudyDate FROM students s LEFT JOIN quiz_attempts q ON q.student_id=s.id WHERE (?=0 OR s.id=?) GROUP BY s.id,s.name,s.school,s.grade ORDER BY lastStudyDate DESC,s.name`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.student_id AS studentId,s.name,q.study_date AS studyDate,COUNT(*) AS total,SUM(q.correct) AS correct,ROUND(SUM(q.correct)*100.0/COUNT(*)) AS accuracy FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE (?=0 OR q.student_id=?) GROUP BY q.student_id,s.name,q.study_date ORDER BY q.study_date DESC LIMIT 120`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.student_id AS studentId,s.name,q.study_date AS studyDate,CASE WHEN q.quiz_type LIKE 'word-%' THEN 'word' ELSE 'passage' END AS category,COUNT(*) AS total,SUM(q.correct) AS correct,ROUND(SUM(q.correct)*100.0/COUNT(*)) AS accuracy FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE (?=0 OR q.student_id=?) GROUP BY q.student_id,s.name,q.study_date,CASE WHEN q.quiz_type LIKE 'word-%' THEN 'word' ELSE 'passage' END ORDER BY q.study_date DESC LIMIT 240`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.student_id AS studentId,s.name,q.quiz_type AS quizType,COUNT(*) AS total,SUM(q.correct) AS correct,ROUND(SUM(q.correct)*100.0/COUNT(*)) AS accuracy FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE (?=0 OR q.student_id=?) GROUP BY q.student_id,s.name,q.quiz_type ORDER BY q.student_id,q.quiz_type`).bind(studentId,studentId).all<any>(),
  db.prepare(`SELECT q.id,q.student_id AS studentId,s.name,q.publisher,q.grade,q.lesson,q.passage,q.quiz_type AS quizType,q.question_index AS questionIndex,q.correct,q.study_date AS studyDate,q.created_at AS createdAt FROM quiz_attempts q JOIN students s ON s.id=q.student_id WHERE (?=0 OR q.student_id=?) ORDER BY q.id DESC LIMIT 80`).bind(studentId,studentId).all<any>(),
 ]);
 return NextResponse.json({students:students.results??[],daily:daily.results??[],dailyCategories:dailyCategories.results??[],types:types.results??[],recent:recent.results??[]});
}
