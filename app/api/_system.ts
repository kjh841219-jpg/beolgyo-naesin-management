import{cookies}from"next/headers";import{database,type VercelDatabase}from"@/app/vercel-database";
export type D1=VercelDatabase;
export const db=()=>database();
export async function sha(v:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}

const defaults=[
 ["출근·준비","출근 및 근무 시작 확인","수업 시작 20분 전까지 출근하고 오늘 시간표와 전달사항을 확인합니다."],
 ["출근·준비","교실 환경 점검","조명·냉난방·환기·책상·화이트보드 상태를 확인합니다."],
 ["출근·준비","교재와 수업자료 준비","교재·프린트·단어시험·영상·필기도구를 학생별로 준비합니다."],
 ["출근·준비","학생별 이전 기록 확인","지난 수업 진도·숙제·오답·보충 필요사항을 확인합니다."],
 ["출결·등원","등원 학생 확인","수업 시작 전 학생의 등원 여부와 지각 여부를 확인합니다."],
 ["출결·등원","결석·지각 학생 조치","미등원 학생은 보호자 연락 여부를 확인하고 사유와 조치 내용을 기록합니다."],
 ["출결·등원","보강 필요 여부 기록","결석 학생의 보강 대상 여부와 가능한 일정을 기록합니다."],
 ["수업 진행","오늘 학습목표 안내","학생에게 오늘 배울 내용과 완료해야 할 목표를 구체적으로 안내합니다."],
 ["수업 진행","숙제 수행 확인","숙제 완료 여부와 미완료 사유를 확인하고 필요한 조치를 기록합니다."],
 ["수업 진행","단어·본문·문법 점검","수업 단계에 맞춰 단어시험, 본문 암기, 문법 이해도를 점검합니다."],
 ["수업 진행","학생 참여와 이해도 확인","질문·발표·문제풀이 반응을 통해 이해가 부족한 부분을 확인합니다."],
 ["수업 진행","수업 진도 기록","교재명·페이지·학습 범위·테스트 결과를 다음 강사가 알 수 있게 기록합니다."],
 ["숙제·오답","다음 숙제 안내","교재·페이지·문항·제출기한을 학생이 이해하도록 정확히 안내합니다."],
 ["숙제·오답","오답 원인 확인","개념 부족·암기 부족·문제 해석·시간 부족 등 오답 원인을 구분합니다."],
 ["숙제·오답","보충자료 필요 여부","부족한 단원에 필요한 프린트·재시험·추가 설명 여부를 기록합니다."],
 ["학생 관리","학습 태도 기록","집중도·수업 참여·과제 습관의 변화와 지도 내용을 기록합니다."],
 ["학생 관리","성취 및 부족 영역 기록","잘한 점과 보완이 필요한 단어·본문·문법·서술형 영역을 남깁니다."],
 ["학생 관리","정서·관계 특이사항 확인","학생의 기분 변화·친구 관계·수업 거부 등 특이사항을 기록합니다."],
 ["학생 관리","다음 수업 조치 계획","재시험·보강·자리 배치·상담 등 다음 수업에서 할 조치를 기록합니다."],
 ["학부모 소통","학부모 전달 필요 여부","결석·숙제 미완료·학습 변화·성취 내용을 전달해야 하는지 확인합니다."],
 ["학부모 소통","피드백 내용 기록","전달한 핵심 내용과 학부모 요청사항을 구체적으로 기록합니다."],
 ["학부모 소통","원장 보고 필요 여부","민원 가능성·장기 결석·학습 저하·퇴원 징후는 즉시 원장에게 보고합니다."],
 ["마감·정리","학생 귀가 확인","어린 학생과 별도 귀가 관리 학생의 안전한 귀가 여부를 확인합니다."],
 ["마감·정리","교실과 자료 정리","책상·보드·교재·프린트·전자기기를 정리하고 분실물을 확인합니다."],
 ["마감·정리","미완료 업무 확인","미처리 연락·보강 일정·자료 준비·보고사항을 확인하고 세부내용을 남깁니다."],
 ["마감·정리","다음 근무 준비","다음 수업 자료와 우선 확인 학생을 메모한 뒤 업무를 마감합니다."],
 ["원장 확인","강사별 업무 완료율 확인","강사별 체크리스트 완료율과 미완료 항목을 확인합니다."],
 ["원장 확인","학생 특이사항 검토","학습·정서·출결·학부모 소통 관련 세부 기록을 확인합니다."],
 ["원장 확인","후속 조치 담당자 지정","상담·보강·자료 준비·민원 대응의 담당자와 처리기한을 정합니다."],
 ["원장 확인","당일 운영 마감","긴급 보고사항과 다음 날 우선 업무를 확인하고 운영을 마감합니다."]
];

export async function schema(){
 const d=db();
 await d.batch([
  d.prepare("CREATE TABLE IF NOT EXISTS instructors(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,role TEXT NOT NULL DEFAULT '강사',pin_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  d.prepare("CREATE TABLE IF NOT EXISTS staff_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,instructor_id INTEGER NOT NULL,token_hash TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  d.prepare("CREATE TABLE IF NOT EXISTS manual_admin_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,token_hash TEXT NOT NULL,expires_at TEXT NOT NULL)"),
  d.prepare("CREATE TABLE IF NOT EXISTS checklist_templates(id INTEGER PRIMARY KEY AUTOINCREMENT,category TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',cadence TEXT NOT NULL DEFAULT 'daily',sort_order INTEGER NOT NULL DEFAULT 0)"),
  d.prepare("CREATE TABLE IF NOT EXISTS checklist_entries(id INTEGER PRIMARY KEY AUTOINCREMENT,instructor_id INTEGER NOT NULL,template_id INTEGER NOT NULL,work_date TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,details TEXT NOT NULL DEFAULT '',special_notes TEXT NOT NULL DEFAULT '',consultation TEXT NOT NULL DEFAULT '',completed_at TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  d.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_name ON instructors(name)"),d.prepare("CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON staff_sessions(token_hash)"),d.prepare("CREATE INDEX IF NOT EXISTS idx_manual_admin_sessions_token ON manual_admin_sessions(token_hash)"),d.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_category_title ON checklist_templates(category,title)"),d.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_unique ON checklist_entries(instructor_id,template_id,work_date)"),d.prepare("CREATE INDEX IF NOT EXISTS idx_entries_date_instructor ON checklist_entries(work_date,instructor_id)")
 ]);
 for(let i=0;i<defaults.length;i++)await d.prepare("INSERT OR IGNORE INTO checklist_templates(category,title,description,sort_order) VALUES(?,?,?,?)").bind(...defaults[i],100+i).run();
 return d
}
export async function staff(){const t=(await cookies()).get("manual_staff")?.value??"";if(!t)return null;const d=await schema(),r=await d.prepare("SELECT i.id,i.name,i.role FROM staff_sessions s JOIN instructors i ON i.id=s.instructor_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND i.active=1 LIMIT 1").bind(await sha(t)).all<any>();return r.results?.[0]??null}
export async function admin(){const t=(await cookies()).get("manual_admin")?.value??"";if(!t)return false;const d=await schema(),r=await d.prepare("SELECT id FROM manual_admin_sessions WHERE token_hash=? AND expires_at>CURRENT_TIMESTAMP LIMIT 1").bind(await sha(t)).all<any>();return!!r.results?.[0]}

