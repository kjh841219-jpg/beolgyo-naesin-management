import {database as vercelDatabase,type VercelDatabase} from "@/app/vercel-database";
import {isAdminAuthenticated} from "@/app/admin-auth";

export type D1 = VercelDatabase;

export async function requireAdmin() {
  return await isAdminAuthenticated()?{id:1}:null;
}

export function database(): D1 {
  return vercelDatabase();
}

export async function ensureLearningSchema(db: D1) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, school TEXT NOT NULL, grade TEXT NOT NULL, parent_phone TEXT NOT NULL, exam_date TEXT NOT NULL DEFAULT '', memo TEXT NOT NULL DEFAULT '', access_code_hash TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS student_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS exam_analyses (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, exam_name TEXT NOT NULL, exam_date TEXT NOT NULL, score INTEGER NOT NULL, total_score INTEGER NOT NULL DEFAULT 100, question_errors TEXT NOT NULL DEFAULT '', mistake_types TEXT NOT NULL DEFAULT '', mistake_reasons TEXT NOT NULL DEFAULT '', difficult_units TEXT NOT NULL DEFAULT '', good_points TEXT NOT NULL DEFAULT '', action_plan TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS study_records (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, study_date TEXT NOT NULL, exam_week TEXT NOT NULL, textbook INTEGER NOT NULL DEFAULT 0, grammar INTEGER NOT NULL DEFAULT 0, school_print INTEGER NOT NULL DEFAULT 0, vocabulary INTEGER NOT NULL DEFAULT 0, writing INTEGER NOT NULL DEFAULT 0, mistakes TEXT NOT NULL DEFAULT '', next_action TEXT NOT NULL DEFAULT '', teacher_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS message_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, name TEXT NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS message_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, channel TEXT NOT NULL, recipient TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, provider_id TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS wrong_answer_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, study_date TEXT NOT NULL, title TEXT NOT NULL, image_key TEXT NOT NULL, content_type TEXT NOT NULL, file_name TEXT NOT NULL, question_type TEXT NOT NULL DEFAULT '', wrong_reason TEXT NOT NULL DEFAULT '', correct_reason TEXT NOT NULL DEFAULT '', retry_plan TEXT NOT NULL DEFAULT '', student_note TEXT NOT NULL DEFAULT '', teacher_analysis TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'submitted', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS study_materials (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, title TEXT NOT NULL, learning_area TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', file_key TEXT NOT NULL, file_name TEXT NOT NULL, content_type TEXT NOT NULL, file_size INTEGER NOT NULL DEFAULT 0, student_answer TEXT NOT NULL DEFAULT '', student_question TEXT NOT NULL DEFAULT '', solve_status TEXT NOT NULL DEFAULT 'assigned', completed_at TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS learning_links (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS quiz_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, publisher TEXT NOT NULL, grade TEXT NOT NULL, lesson TEXT NOT NULL, passage TEXT NOT NULL, quiz_type TEXT NOT NULL, question_index INTEGER NOT NULL, correct INTEGER NOT NULL DEFAULT 0, answer_text TEXT NOT NULL DEFAULT '', study_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS homework_completions (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, homework_date TEXT NOT NULL, title TEXT NOT NULL, completed_items TEXT NOT NULL DEFAULT '', student_note TEXT NOT NULL DEFAULT '', email_sent INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_study_records_student_date ON study_records(student_id, study_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_message_logs_student_created ON message_logs(student_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_sessions(token_hash)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_exam_analyses_student_date ON exam_analyses(student_id, exam_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_wrong_answer_photos_student_date ON wrong_answer_photos(student_id, study_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_study_materials_student_created ON study_materials(student_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_learning_links_student_created ON learning_links(student_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_date ON quiz_attempts(student_id, study_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_homework_student_date ON homework_completions(student_id, homework_date)"),
  ]);
}

export const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
export const score = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0));
export function homeworkFeedback(name:string,title:string,completedItems:string,studentNote:string){const items=completedItems.split("|").filter(Boolean),count=items.length;const focus=items.includes("오답노트")?"오답 원인을 설명하고 같은 유형을 다시 풀어 정확도를 확인해 보세요.":items.includes("서술형·영작")?"서술형 답안의 조건 반영, 어순, 철자와 문장부호를 한 번 더 점검해 보세요.":items.includes("본문 암기")?"본문을 문장별로 말하고 쓴 뒤 막힌 문장만 다시 암기하면 효율이 높아집니다.":items.includes("단어·숙어")?"헷갈린 단어는 철자 쓰기와 문장 속 활용까지 확인해 보세요.":"오늘 완료한 내용을 짧은 확인 문제로 다시 점검해 기억을 안정시키세요.";const note=studentNote?`학생 메모 “${studentNote.slice(0,160)}”를 다음 수업에서 우선 확인하겠습니다.`:"어려웠던 부분을 한 문장으로 기록하면 다음 피드백이 더 정확해집니다.";return `${name} 학생은 오늘 「${title}」에서 ${items.join(" · ")} ${count}개 항목을 완료했습니다. ${count>=5?"여러 영역을 균형 있게 학습한 점이 좋습니다.":count>=3?"핵심 학습을 꾸준히 완료했습니다.":"선택한 영역을 집중해서 마무리했습니다."}\n\n[잘한 점] 완료 항목을 직접 확인하고 학습 과정을 기록했습니다.\n[분석·보완] ${focus}\n[학생 메모] ${note}\n[다음 학습] 가장 어려웠던 1개를 다시 풀고 틀린 부분만 짧게 반복한 뒤 선생님 확인을 받으세요.`}
export async function sha256(value:string){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
