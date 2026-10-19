"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
type Student = { id: number; name: string; school: string; grade: string };
type AnyItem = Record<string, any>;
export default function AdminStudentMirror() {
  const [students, setStudents] = useState<Student[]>([]),
    [studentId, setStudentId] = useState(0),
    [data, setData] = useState<Record<string, AnyItem[]>>({}),
    [updated, setUpdated] = useState("");
  const student = students.find((x) => x.id === studentId);
  const load = useCallback(
    async (id: number) => {
      if (!id) return;
      const urls = {
        records: `/api/admin/learning/records?studentId=${id}`,
        quiz: `/api/admin/learning/quiz-results?studentId=${id}`,
        photos: `/api/admin/learning/wrong-answers?studentId=${id}`,
        homework: "/api/admin/learning/homework-submissions",
        checks: "/api/admin/learning/homework",
        resources: `/api/admin/learning/resources?studentId=${id}`,
        outputs: "/api/admin/learning/resource-submissions",
      };
      const entries = await Promise.all(
        Object.entries(urls).map(async ([key, url]) => {
          const r = await fetch(url, { cache: "no-store" });
          return [key, r.ok ? await r.json() : {}] as const;
        }),
      );
      const raw = Object.fromEntries(entries);
      setData({
        records: raw.records.items || [],
        quiz: raw.quiz.types || [],
        photos: raw.photos.photos || [],
        homework: (raw.homework.items || []).filter(
          (x: AnyItem) => x.studentId === id,
        ),
        checks: (raw.checks.items || []).filter(
          (x: AnyItem) => x.studentId === id,
        ),
        resources: raw.resources.items || [],
        outputs: (raw.outputs.items || []).filter(
          (x: AnyItem) =>
            x.studentName === students.find((s) => s.id === id)?.name,
        ),
      });
      setUpdated(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    },
    [students],
  );
  useEffect(() => {
    fetch("/api/admin/learning/students", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const rows = d.items || [];
        setStudents(rows);
        if (rows[0]) setStudentId(rows[0].id);
      });
  }, []);
  useEffect(() => {
    if (!studentId) return;
    void load(studentId);
    const t = setInterval(() => void load(studentId), 3000);
    return () => clearInterval(t);
  }, [studentId, load]);
  const total = useMemo(
    () => Object.values(data).reduce((n, x) => n + x.length, 0),
    [data],
  );
  const sections = [
    {
      key: "records",
      title: "내신 학습기록",
      empty: "학습기록 없음",
      render: (x: AnyItem) => (
        <>
          <b>
            {x.studyDate} · {x.examWeek}
          </b>
          <span>
            본문 {x.textbook}% · 문법 {x.grammar}% · 단어 {x.vocabulary}% ·
            서술형 {x.writing}%
          </span>
        </>
      ),
    },
    {
      key: "homework",
      title: "숙제 사진·파일",
      empty: "숙제 파일 없음",
      render: (x: AnyItem) => (
        <>
          <b>
            {x.homeworkDate} · {x.title}
          </b>
          <span>
            {x.fileName} · {x.teacherFeedback ? "피드백 완료" : "피드백 대기"}
          </span>
        </>
      ),
    },
    {
      key: "checks",
      title: "숙제 완료 체크",
      empty: "완료 체크 없음",
      render: (x: AnyItem) => (
        <>
          <b>
            {x.homeworkDate} · {x.title}
          </b>
          <span>
            {String(x.completedItems || "")
              .split("|")
              .join(" · ")}
          </span>
        </>
      ),
    },
    {
      key: "quiz",
      title: "퀴즈 학습",
      empty: "퀴즈 기록 없음",
      render: (x: AnyItem) => (
        <>
          <b>{x.quizType || "퀴즈"}</b>
          <span>
            {x.total || 0}문항 · 정답률 {x.accuracy || 0}%
          </span>
        </>
      ),
    },
    {
      key: "photos",
      title: "학습 결과물·오답 사진",
      empty: "사진 기록 없음",
      render: (x: AnyItem) => (
        <>
          <b>
            {x.studyDate} · {x.title}
          </b>
          <span>
            문제 유형: {x.questionType || "학습 결과물"} ·{" "}
            {x.status === "reviewed" ? "분석 완료" : "확인 대기"}
          </span>
          <span>틀린 이유: {x.wrongReason || "-"}</span>
          <span>정답 근거: {x.correctReason || "-"}</span>
          <span>다시 풀 계획: {x.retryPlan || "-"}</span>
          <span>학생 메모: {x.studentNote || "-"}</span>
        </>
      ),
    },
    {
      key: "resources",
      title: "배정 인강·자료",
      empty: "인강 배정 없음",
      render: (x: AnyItem) => (
        <>
          <b>{x.title}</b>
          <span>
            {x.resourceUrl ? "링크 " : ""}
            {x.fileName ? `파일 ${x.fileName}` : ""}
          </span>
        </>
      ),
    },
    {
      key: "outputs",
      title: "인강 학습 결과 제출",
      empty: "결과 제출 없음",
      render: (x: AnyItem) => (
        <>
          <b>{x.resourceTitle}</b>
          <span>
            {x.fileName} ·{" "}
            {String(x.createdAt || "")
              .replace("T", " ")
              .slice(0, 16)}
          </span>
        </>
      ),
    },
  ];
  return (
    <section className="student-mirror">
      <header>
        <div>
          <span>STUDENT LOGIN MIRROR</span>
          <h2>학생 로그인 화면 통합 기록</h2>
          <p>
            학생이 로그인 후 저장·제출한 모든 내용과 관리자가 배정한 인강을
            3초마다 모아 보여줍니다.
          </p>
        </div>
        <button onClick={() => void load(studentId)}>
          ● 실시간 반영 · {updated || "확인 중"}
        </button>
      </header>
      <div className="mirror-controls">
        <select
          value={studentId}
          onChange={(e) => setStudentId(Number(e.target.value))}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.school} {s.grade}
            </option>
          ))}
        </select>
        <strong>
          {student?.name || "학생 선택"} · 전체 {total}건
        </strong>
      </div>
      <div className="mirror-grid">
        {sections.map((section) => (
          <article key={section.key}>
            <h3>
              {section.title}
              <em>{data[section.key]?.length || 0}</em>
            </h3>
            <div>
              {(data[section.key] || []).slice(0, 5).map((x, i) => (
                <section key={x.id || i}>{section.render(x)}</section>
              ))}
              {!data[section.key]?.length && <p>{section.empty}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
