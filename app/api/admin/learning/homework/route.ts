import { database, ensureLearningSchema, requireAdmin } from "../_shared";

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const db = database();
  await ensureLearningSchema(db);
  const { results } = await db.prepare(`
    SELECT h.id, h.student_id AS studentId, s.name AS studentName,
      s.school, s.grade, h.homework_date AS homeworkDate, h.title,
      h.completed_items AS completedItems, h.student_note AS studentNote,
      h.email_sent AS emailSent, h.created_at AS createdAt
    FROM homework_completions h
    JOIN students s ON s.id = h.student_id
    ORDER BY h.id DESC
    LIMIT 100
  `).all();
  return Response.json({ items: results ?? [] });
}
