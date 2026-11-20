// Read-only diagnostics. Never prints connection strings, codes, or free-text notes.
const { neon } = require('@neondatabase/serverless');
async function main() {
  const name = (process.argv[2] || '').replace(/\s/g, '');
  if (!name) throw new Error('Student name required');
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('Database configuration unavailable');
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(15000) } });
  const students = await sql.query(`SELECT s.id, s.name, s.grade, s.school,
    COUNT(r.id)::int AS record_count, MAX(r.study_date) AS last_study_date,
    MAX(r.created_at) AS last_saved_at
    FROM students s LEFT JOIN study_records r ON r.student_id=s.id
    WHERE REPLACE(s.name,' ','')=$1 GROUP BY s.id,s.name,s.grade,s.school ORDER BY s.id`, [name]);
  const recent = await sql.query(`SELECT r.id,r.student_id,r.study_date,r.exam_week,
    r.textbook,r.grammar,r.school_print,r.vocabulary,r.writing,
    LENGTH(r.mistakes) AS mistakes_length,LENGTH(r.next_action) AS next_action_length,
    r.created_at FROM study_records r JOIN students s ON s.id=r.student_id
    WHERE REPLACE(s.name,' ','')=$1 ORDER BY r.created_at DESC,r.id DESC LIMIT 6`, [name]);
  console.log(JSON.stringify({students, recent}, null, 2));
}
main().catch(error => { console.error(JSON.stringify({error: 'Read-only student-record check failed', code: error.code || error.name})); process.exitCode=1; });
