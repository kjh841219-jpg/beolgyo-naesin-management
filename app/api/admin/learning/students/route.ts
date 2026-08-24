import { clean, database, ensureLearningSchema, requireAdmin, sha256 } from "../_shared";
import { syncDashboardRoster } from "../dashboard-roster";
import { env } from "cloudflare:workers";

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const db = database(); await ensureLearningSchema(db); await syncDashboardRoster(db);
  const { results } = await db.prepare("SELECT id, name, school, grade, parent_phone AS parentPhone, exam_date AS examDate, memo, created_at AS createdAt FROM students ORDER BY name").all();
  return Response.json({ items: results ?? [] });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name=clean(body.name,40), school=clean(body.school,80), grade=clean(body.grade,30), phone=clean(body.parentPhone,20).replace(/\D/g,""), examDate=clean(body.examDate,10), memo=clean(body.memo,500),accessCode=clean(body.accessCode,4).replace(/\D/g,"");
  if(!name||!school||!grade||!/^01\d{8,9}$/.test(phone)||!/^\d{4}$/.test(accessCode)) return Response.json({error:"학생 정보와 연락처 뒷번호 4자리를 확인해 주세요."},{status:400});
  const db=database(); await ensureLearningSchema(db);
  const result=await db.prepare("INSERT INTO students (name,school,grade,parent_phone,exam_date,memo,access_code_hash) VALUES (?,?,?,?,?,?,?)").bind(name,school,grade,phone,examDate,memo,await sha256(accessCode)).run();
  return Response.json({ok:true,id:result.meta?.last_row_id},{status:201});
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const id=Number(new URL(request.url).searchParams.get("id")||0);
  if(!id) return Response.json({error:"삭제할 학생을 선택해 주세요."},{status:400});
  const db=database();await ensureLearningSchema(db);
  const {results}=await db.prepare("SELECT id,name FROM students WHERE id=? LIMIT 1").bind(id).all<{id:number;name:string}>();
  const student=results?.[0];
  if(!student)return Response.json({error:"학생을 찾을 수 없습니다."},{status:404});
  const [photos,materials]=await Promise.all([
    db.prepare("SELECT image_key AS fileKey FROM wrong_answer_photos WHERE student_id=?").bind(id).all<{fileKey:string}>(),
    db.prepare("SELECT file_key AS fileKey FROM study_materials WHERE student_id=?").bind(id).all<{fileKey:string}>(),
  ]);
  await db.batch([
    db.prepare("DELETE FROM student_sessions WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM exam_analyses WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM study_records WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM message_logs WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM wrong_answer_photos WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM study_materials WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM learning_links WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM quiz_attempts WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM homework_completions WHERE student_id=?").bind(id),
    db.prepare("DELETE FROM students WHERE id=?").bind(id),
  ]);
  const uploads=(env as unknown as {UPLOADS?:{delete(key:string):Promise<void>}}).UPLOADS;
  if(uploads)await Promise.all([...(photos.results??[]),...(materials.results??[])].map(x=>uploads.delete(x.fileKey).catch(()=>undefined)));
  return Response.json({ok:true,message:`${student.name} 학생과 연결된 학습자료를 삭제했습니다.`});
}
