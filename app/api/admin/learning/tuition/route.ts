import {clean,database,ensureLearningSchema,requireAdmin} from "../_shared";

export async function GET(){
  if(!(await requireAdmin()))return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const db=database();await ensureLearningSchema(db);
  const {results}=await db.prepare("SELECT s.id AS studentId,s.name,s.grade,s.parent_phone AS parentPhone,COALESCE(t.due_date,'') AS dueDate,COALESCE(t.amount,0) AS amount,COALESCE(t.paid,0) AS paid,COALESCE(t.paid_at,'') AS paidAt,COALESCE(t.memo,'') AS memo FROM students s LEFT JOIN tuition_accounts t ON t.student_id=s.id ORDER BY CASE WHEN COALESCE(t.paid,0)=0 AND COALESCE(t.due_date,'')<>'' THEN t.due_date ELSE '9999-12-31' END,s.name").all();
  return Response.json({items:results??[]},{headers:{"Cache-Control":"no-store"}});
}

export async function PUT(request:Request){
  if(!(await requireAdmin()))return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
  const body=await request.json().catch(()=>({})),studentId=Number(body.studentId||0),dueDate=clean(body.dueDate,10),amount=Math.max(0,Math.round(Number(body.amount)||0)),paid=body.paid?1:0,memo=clean(body.memo,300);
  if(!studentId||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))return Response.json({error:"학생과 원비 결제일을 확인해 주세요."},{status:400});
  const db=database();await ensureLearningSchema(db);
  await db.prepare("INSERT INTO tuition_accounts(student_id,due_date,amount,paid,paid_at,memo,updated_at) VALUES(?,?,?,?,CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE '' END,?,CURRENT_TIMESTAMP) ON CONFLICT(student_id) DO UPDATE SET due_date=excluded.due_date,amount=excluded.amount,paid=excluded.paid,paid_at=CASE WHEN excluded.paid=1 THEN COALESCE(NULLIF(tuition_accounts.paid_at,''),CURRENT_TIMESTAMP) ELSE '' END,memo=excluded.memo,updated_at=CURRENT_TIMESTAMP RETURNING student_id").bind(studentId,dueDate,amount,paid,paid,memo).run();
  return Response.json({ok:true,message:paid?"납부 완료로 저장했습니다.":"원비 결제일을 저장했습니다."});
}
