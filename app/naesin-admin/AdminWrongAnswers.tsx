"use client";
import { useEffect, useMemo, useState } from "react";
type Student = { id: number; name: string; school: string; grade: string };
type Photo = {
  id: number;
  studentId: number;
  studentName: string;
  studyDate: string;
  title: string;
  questionType: string;
  wrongReason: string;
  correctReason: string;
  retryPlan: string;
  studentNote: string;
  teacherAnalysis: string;
  status: string;
};
function generatedAnalysis(p: Photo) {
  const source = `${p.title} ${p.questionType} ${p.wrongReason} ${p.studentNote}`,
    focus = /문법|어법|시제|수일치/.test(source)
      ? "문법"
      : /단어|어휘|숙어/.test(source)
        ? "어휘"
        : /서술|영작|쓰기/.test(source)
          ? "서술형"
          : /프린트|학습지/.test(source)
            ? "학교 프린트"
            : "본문";
  return `[영역별 분석 · 사진 확인 후 수정]\n\n[본문] 핵심 문장 암기와 내용 흐름의 정확도를 확인합니다.\n[문법] 시제·수일치·어순·문장 구조의 반복 실수를 확인합니다.\n[어휘] 핵심 단어·숙어와 철자 정확도를 확인합니다.\n[서술형] 문제 조건 반영, 문장 완성도와 문장부호를 확인합니다.\n[중점 영역] ${focus}\n[학생 자기평가] ${p.studentNote || p.wrongReason || "작성 내용 없음"}\n[오답 원인] ${p.wrongReason || `${focus} 영역의 정확도와 반복 실수를 추가 확인합니다.`}\n[잘한 점] 제출한 결과물을 바탕으로 학습 과정을 성실하게 이어가고 있습니다.\n[다음 학습] ${p.retryPlan || "틀린 부분을 표시하고 다시 쓰기와 유사 문제로 재확인합니다."}\n\n[학부모 안내문]\n안녕하세요. ${p.studentName} 학생의 ${p.title} 결과물을 확인하고 있습니다. ${focus} 영역을 중심으로 정확도와 반복 실수를 점검하고, 잘한 부분은 유지하면서 부족한 부분은 다시 쓰기와 확인 문제로 보완하겠습니다.`;
}
export default function AdminWrongAnswers() {
  const [students, setStudents] = useState<Student[]>([]),
    [studentId, setStudentId] = useState(0),
    [photos, setPhotos] = useState<Photo[]>([]),
    [notes, setNotes] = useState<Record<number, string>>({}),
    [query, setQuery] = useState(""),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [updated, setUpdated] = useState("");
  async function load(id = studentId) {
    const r = await fetch(`/api/admin/learning/wrong-answers?studentId=${id}`, {
      cache: "no-store",
    });
    if (!r.ok) {
      setReady(false);
      return;
    }
    const data = await r.json(),
      rows = data.photos || [];
    setPhotos(rows);
    setNotes(
      Object.fromEntries(
        rows.map((p: Photo) => [p.id, p.teacherAnalysis || ""]),
      ),
    );
    setReady(true);
    setUpdated(
      new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }
  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/admin/learning/students", {
        cache: "no-store",
      });
      if (r.ok) {
        const data = await r.json();
        setStudents(data.items || []);
      }
      await load(0);
    })();
    const timer = setInterval(() => void load(studentId), 2000);
    return () => clearInterval(timer);
  }, [studentId]);
  const visible = useMemo(
      () =>
        photos.filter(
          (p) =>
            !query ||
            `${p.studentName} ${p.title} ${p.questionType}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        ),
      [photos, query],
    ),
    waiting = photos.filter((p) => p.status !== "reviewed").length,
    done = photos.length - waiting;
  async function save(p: Photo) {
    const r = await fetch("/api/admin/learning/wrong-answers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: p.id,
        teacherAnalysis: notes[p.id],
        status: "reviewed",
      }),
    });
    if (r.ok) {
      setNotice(`${p.studentName} 학생의 영역별 분석을 저장했습니다.`);
      await load(studentId);
    }
  }
  function generate(p: Photo) {
    setNotes({ ...notes, [p.id]: generatedAnalysis(p) });
    setNotice(
      "영역별 자동문구를 만들었습니다. 사진을 확인한 뒤 수정해 주세요.",
    );
  }
  async function copy(p: Photo) {
    await navigator.clipboard.writeText(notes[p.id] || generatedAnalysis(p));
    setNotice(`${p.studentName} 학생의 분석 문구를 복사했습니다.`);
  }
  if (!ready) return null;
  return (
    <section className="awa-shell awa-homework-style">
      <header className="awa-dashboard-head">
        <div>
          <span>PHOTO HOMEWORK & FEEDBACK</span>
          <h2>학생별 오답노트 제출현황·분석</h2>
          <p>
            숙제 제출현황과 같은 카드 형식으로 학생명, 오답 사진, 틀린 이유,
            정답 근거와 재학습 계획을 확인하고 피드백을 작성합니다.
          </p>
        </div>
        <button onClick={() => void load(studentId)}>
          <i /> 실시간 관리 중<small>최근 확인 {updated || "확인 중"}</small>
        </button>
      </header>
      <div className="awa-stats">
        <article>
          <b>{photos.length}</b>
          <span>선택 범위 제출</span>
        </article>
        <article>
          <b>{waiting}</b>
          <span>피드백 대기</span>
        </article>
        <article>
          <b>{done}</b>
          <span>피드백 완료</span>
        </article>
      </div>
      <div className="awa-filters">
        <label>
          <span>학생 선택</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value))}
          >
            <option value="0">전체 학생</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.school} {s.grade}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>학생 이름·제출물 검색</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 박세훈 또는 문법 오답"
          />
        </label>
        <button onClick={() => void load(studentId)}>지금 새로고침</button>
      </div>
      {notice && <p className="awa-notice">{notice}</p>}
      <div className="awa-review-list">
        {!visible.length && (
          <p className="awa-empty">조건에 맞는 학습 결과물 사진이 없습니다.</p>
        )}
        {visible.map((p) => {
          const s = students.find((x) => x.id === p.studentId);
          return (
            <article
              key={p.id}
              className={p.status === "reviewed" ? "reviewed" : ""}
            >
              <div className="awa-card-head">
                <div className="awa-file-kind">PHOTO</div>
                <div>
                  <h3>
                    <strong>{p.studentName}</strong>
                    <span>{p.title}</span>
                  </h3>
                  <p>
                    {s?.school || "학교 미지정"} · {s?.grade || "학년 미지정"} ·
                    제출일 {p.studyDate}
                  </p>
                </div>
                <a
                  href={`/api/admin/learning/wrong-answers?imageId=${p.id}`}
                  target="_blank"
                >
                  제출 사진 크게 보기
                </a>
              </div>
              <div className="awa-photo-layout">
                <a
                  href={`/api/admin/learning/wrong-answers?imageId=${p.id}`}
                  target="_blank"
                >
                  <img
                    src={`/api/admin/learning/wrong-answers?imageId=${p.id}`}
                    alt={`${p.studentName} 학습 결과물`}
                  />
                </a>
                <div className="awa-card-body">
                  <div className="awa-student-note">
                    <b>학생 메모</b>
                    <p>{p.studentNote || p.wrongReason || "학생 메모 없음"}</p>
                  </div>
                  <dl>
                    <dt>문제 영역</dt>
                    <dd>{p.questionType || "학습 결과물"}</dd>
                    <dt>틀린 이유</dt>
                    <dd>{p.wrongReason || "-"}</dd>
                    <dt>정답 근거</dt>
                    <dd>{p.correctReason || "-"}</dd>
                    <dt>재학습 계획</dt>
                    <dd>{p.retryPlan || "-"}</dd>
                  </dl>
                  <label>
                    선생님 피드백
                    <textarea
                      rows={10}
                      value={notes[p.id] || ""}
                      onChange={(e) =>
                        setNotes({ ...notes, [p.id]: e.target.value })
                      }
                      placeholder="자동문구를 생성하거나 직접 피드백을 작성하세요."
                    />
                  </label>
                  <div className="awa-actions">
                    <button className="generate" onClick={() => generate(p)}>
                      영역별 자동문구 생성
                    </button>
                    <button className="copy" onClick={() => copy(p)}>
                      문구 복사
                    </button>
                    <button onClick={() => save(p)}>피드백 수정·저장</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
