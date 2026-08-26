import { cookies } from "next/headers";
import { database,ensureLearningSchema,homeworkFeedback,sha256 } from "../admin/learning/_shared";
const COOKIE="beolgyo_student_session";
export async function studentSession(){const token=(await cookies()).get(COOKIE)?.value??"";if(!token)return null;const db=database();await ensureLearningSchema(db);const{results}=await db.prepare("SELECT s.id,s.name,s.school,s.grade,s.parent_phone AS parentPhone,s.exam_date AS examDate FROM student_sessions x JOIN students s ON s.id=x.student_id WHERE x.token_hash=? AND x.expires_at>CURRENT_TIMESTAMP LIMIT 1").bind(await sha256(token)).all<any>();return results?.[0]??null}
export {COOKIE,database,ensureLearningSchema,homeworkFeedback,sha256};
