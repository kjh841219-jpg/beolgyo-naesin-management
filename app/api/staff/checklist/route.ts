import{schema,staff}from"../../_system";
const day=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
export async function GET(r:Request){
 const s=await staff();if(!s)return Response.json({error:"로그인이 필요합니다."},{status:401});
 const date=new URL(r.url).searchParams.get("date")||day(),d=await schema(),isDirector=String(s.role).includes("원장");
 const x=await d.prepare("SELECT t.id,t.category,t.title,t.description,COALESCE(e.completed,0) AS completed,COALESCE(e.details,'') AS details,COALESCE(e.special_notes,'') AS specialNotes,COALESCE(e.consultation,'') AS consultation,COALESCE(e.completed_at,'') AS completedAt FROM checklist_templates t LEFT JOIN checklist_entries e ON e.template_id=t.id AND e.instructor_id=? AND e.work_date=? WHERE (?=1 OR t.category!='원장 확인') ORDER BY t.sort_order,t.id").bind(s.id,date,isDirector?1:0).all<any>();
 return Response.json({staff:s,date,items:x.results??[]})
}
export async function PATCH(r:Request){
 const s=await staff();if(!s)return Response.json({error:"로그인이 필요합니다."},{status:401});
 const b=await r.json()as any,id=Number(b.templateId),date=String(b.date||day()).slice(0,10),completed=b.completed?1:0,details=String(b.details||"").trim().slice(0,2000),specialNotes=String(b.specialNotes||"").trim().slice(0,2000),consultation=String(b.consultation||"").trim().slice(0,2000),d=await schema();
 await d.prepare("INSERT INTO checklist_entries(instructor_id,template_id,work_date,completed,details,special_notes,consultation,completed_at) VALUES(?,?,?,?,?,?,?,CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE '' END) ON CONFLICT(instructor_id,template_id,work_date) DO UPDATE SET completed=excluded.completed,details=excluded.details,special_notes=excluded.special_notes,consultation=excluded.consultation,completed_at=CASE WHEN excluded.completed=1 THEN CURRENT_TIMESTAMP ELSE '' END,updated_at=CURRENT_TIMESTAMP").bind(s.id,id,date,completed,details,specialNotes,consultation,completed).run();
 return Response.json({ok:true})
}
