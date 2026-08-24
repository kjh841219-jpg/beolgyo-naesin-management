import{admin,schema,sha}from"../../_system";
const day=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
export async function GET(r:Request){
 if(!await admin())return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
 const url=new URL(r.url),date=url.searchParams.get("date")||day(),all=url.searchParams.get("all")==="1",d=await schema();
 const applicable="(t.category!='원장 확인' OR i.role LIKE '%원장%')";
 const people=await d.prepare(`SELECT i.id,i.name,i.role,COUNT(t.id) AS total,SUM(CASE WHEN e.completed=1 THEN 1 ELSE 0 END) AS completed FROM instructors i CROSS JOIN checklist_templates t LEFT JOIN checklist_entries e ON e.instructor_id=i.id AND e.template_id=t.id AND e.work_date=? WHERE i.active=1 AND ${applicable} GROUP BY i.id ORDER BY i.name`).bind(date).all<any>();
 const categories=await d.prepare(`SELECT t.category,COUNT(*) AS total,SUM(CASE WHEN e.completed=1 THEN 1 ELSE 0 END) AS completed FROM instructors i CROSS JOIN checklist_templates t LEFT JOIN checklist_entries e ON e.instructor_id=i.id AND e.template_id=t.id AND e.work_date=? WHERE i.active=1 AND ${applicable} GROUP BY t.category ORDER BY MIN(t.sort_order)`).bind(date).all<any>();
 const personCategories=await d.prepare(`SELECT i.id AS instructorId,i.name,t.category,COUNT(*) AS total,SUM(CASE WHEN e.completed=1 THEN 1 ELSE 0 END) AS completed FROM instructors i CROSS JOIN checklist_templates t LEFT JOIN checklist_entries e ON e.instructor_id=i.id AND e.template_id=t.id AND e.work_date=? WHERE i.active=1 AND ${applicable} GROUP BY i.id,t.category ORDER BY i.name,MIN(t.sort_order)`).bind(date).all<any>();
 const sql=`SELECT e.work_date AS workDate,i.name,t.category,t.title,t.description,e.details,e.special_notes AS specialNotes,e.consultation,e.completed,e.updated_at AS updatedAt FROM checklist_entries e JOIN instructors i ON i.id=e.instructor_id JOIN checklist_templates t ON t.id=e.template_id ${all?"":"WHERE e.work_date=?"} ORDER BY e.work_date DESC,e.updated_at DESC`;
 const records=all?await d.prepare(sql).all<any>():await d.prepare(sql).bind(date).all<any>();
 return Response.json({date,instructors:people.results??[],categories:categories.results??[],personCategories:personCategories.results??[],activity:records.results??[]});
}
export async function POST(r:Request){
 if(!await admin())return Response.json({error:"관리자 로그인이 필요합니다."},{status:401});
 const b=await r.json()as any,name=String(b.name||"").trim().slice(0,40),role=String(b.role||"강사").trim().slice(0,40),pin=String(b.pin||"");
 if(!name||!/^\d{4}$/.test(pin))return Response.json({error:"강사 이름과 휴대폰 뒷번호 4자리가 필요합니다."},{status:400});
 const d=await schema();try{await d.prepare("INSERT INTO instructors(name,role,pin_hash) VALUES(?,?,?)").bind(name,role,await sha(pin)).run();return Response.json({ok:true})}catch{return Response.json({error:"이미 등록된 이름입니다."},{status:409})}
}
