"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { quizPassages } from "../QuizProgram";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]/g, "");
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
};
export default function FullBlankQuiz() {
  const [student, setStudent] = useState<any>(null),
    [ready, setReady] = useState(false),
    [loginMode, setLoginMode] = useState<"student" | "admin">("student"),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  const [passage, setPassage] = useState(0),
    [round, setRound] = useState(1),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [checked, setChecked] = useState(false),
    [saving, setSaving] = useState(false),
    [score, setScore] = useState(0),
    [solved, setSolved] = useState(0);
  const current = quizPassages[passage],
    publisher = current.publisher || "천재교육 · 소영순",
    grade = current.grade || "중학교 2학년",
    lesson = current.lesson || "5과";
  const publishers = [
      ...new Set(quizPassages.map((x) => x.publisher || "천재교육 · 소영순")),
    ],
    grades = [
      ...new Set(
        quizPassages
          .filter((x) => (x.publisher || "천재교육 · 소영순") === publisher)
          .map((x) => x.grade || "중학교 2학년"),
      ),
    ],
    options = quizPassages
      .map((x, i) => ({ x, i }))
      .filter(
        ({ x }) =>
          (x.publisher || "천재교육 · 소영순") === publisher &&
          (x.grade || "중학교 2학년") === grade,
      );
  const blanks = useMemo(
    () =>
      current.sentences.map((sentence, si) => {
        const parts = sentence.en.split(/([A-Za-z]+(?:['’][A-Za-z]+)?)/g);
        let indexes = parts
          .map((p, i) => ({ p, i }))
          .filter(
            (x) =>
              /^[A-Za-z]/.test(x.p) &&
              x.p.length >= 3 &&
              hash(`${passage}-${round}-${si}-${x.i}`) % 100 < 28,
          )
          .map((x) => x.i);
        if (!indexes.length) {
          const first = parts.findIndex(
            (p) => /^[A-Za-z]/.test(p) && p.length >= 3,
          );
          if (first >= 0) indexes = [first];
        }
        return { sentence, parts, indexes };
      }),
    [current, passage, round],
  );
  const required = blanks.reduce((n, x) => n + x.indexes.length, 0),
    correctCount = blanks.reduce(
      (n, x, si) =>
        n +
        x.indexes.filter(
          (pi) => norm(answers[`${si}-${pi}`] || "") === norm(x.parts[pi]),
        ).length,
      0,
    ),
    allFilled = blanks.every((x, si) =>
      x.indexes.every((pi) => (answers[`${si}-${pi}`] || "").trim()),
    ),
    allCorrect = required > 0 && correctCount === required;
  useEffect(() => {
    Promise.all([
      fetch("/api/student/auth", { cache: "no-store" }),
      fetch("/api/admin/me", { cache: "no-store" }),
    ])
      .then(async ([studentResponse, adminResponse]) => {
        if (studentResponse.ok) {
          const x = await studentResponse.json();
          setStudent(x.student);
        } else if (adminResponse.ok && (await adminResponse.json()).authenticated) {
          setStudent({ name: "관리자", adminPractice: true });
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);
  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (loginMode === "admin") {
      const r = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }),
        x = await r.json().catch(() => ({}));
      if (!r.ok) return setError(x.error || "관리자 로그인에 실패했습니다.");
      setStudent({ name: "관리자", adminPractice: true });
      return;
    }
    const r = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      }),
      x = await r.json().catch(() => ({}));
    if (!r.ok) return setError(x.error || "로그인하지 못했습니다.");
    setStudent(x.student);
  };
  const reset = (newPassage = passage) => {
    setPassage(newPassage);
    setAnswers({});
    setChecked(false);
  };
  const check = async () => {
    if (checked || !allFilled) return;
    setChecked(true);
    setSolved((v) => v + 1);
    if (allCorrect) setScore((v) => v + 1);
    if (student.adminPractice) return;
    setSaving(true);
    await Promise.all(
      blanks.map((row, si) => {
        const sentenceCorrect = row.indexes.every(
          (pi) => norm(answers[`${si}-${pi}`] || "") === norm(row.parts[pi]),
        );
        return fetch("/api/student/quiz-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publisher,
            grade,
            lesson,
            passage: current.title,
            quizType: "blank-sentence",
            questionIndex: si + 1,
            correct: sentenceCorrect,
            answerText: row.indexes
              .map((pi) => answers[`${si}-${pi}`])
              .join(" | "),
          }),
        });
      }),
    );
    setSaving(false);
  };
  const next = () => {
    setRound((v) => v + 1);
    setAnswers({});
    setChecked(false);
  };
  const wrongRows = checked
    ? blanks.map((row, si) => ({ row, si })).filter(({ row, si }) =>
        row.indexes.some(
          (pi) => norm(answers[`${si}-${pi}`] || "") !== norm(row.parts[pi]),
        ),
      )
    : [];
  const printRows = (wrongOnly: boolean) => {
    const selected = wrongOnly ? wrongRows : blanks.map((row, si) => ({ row, si }));
    const rows = selected
      .map(({ row, si }) => {
        const sentence = row.parts
          .map((part, pi) =>
            row.indexes.includes(pi)
              ? `<span class="blank">${"_".repeat(Math.max(6, part.length))}</span>`
              : part,
          )
          .join("");
        return `<article><small>${si + 1}. ${row.sentence.ko}</small><p>${sentence}</p></article>`;
      })
      .join("");
    const popup = window.open("", "_blank", "width=1000,height=760");
    if (!popup) return window.print();
    popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>본문 빈칸 문제</title><style>@page{size:A4;margin:14mm}body{font-family:'Malgun Gothic',sans-serif;color:#18233d}h1{font-size:22px;margin-bottom:6px}.meta{margin-bottom:22px;color:#58657a;font-size:12px}article{padding:14px 0;border-bottom:1px solid #ccd3dd;page-break-inside:avoid}small{display:block;color:#66758b;margin-bottom:8px}p{font-family:Arial,sans-serif;font-size:15px;line-height:2;margin:0}.blank{font-weight:700;letter-spacing:1px}</style></head><body><h1>${wrongOnly ? "본문 빈칸 오답 복습지" : "본문 랜덤 빈칸 문제지"}</h1><div class="meta">${publisher} · ${grade} · ${lesson} · ${current.title}<br>이름: ____________ 날짜: ____________ · 총 ${selected.length}문장</div>${rows || "<p>출력할 오답 문장이 없습니다.</p>"}</body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => { popup.print(); popup.close(); }, 300);
  };
  if (!ready)
    return (
      <main className="fb-login">
        <p>본문 빈칸 학습을 준비하고 있습니다…</p>
      </main>
    );
  if (!student)
    return (
      <main className="fb-login">
        <form onSubmit={login}>
          <a href="/quiz">
            <span>M</span>
            <b>벌교미래엔영어 본문 퀴즈</b>
          </a>
          <div>
            <button
              type="button"
              className={loginMode === "student" ? "active" : ""}
              onClick={() => setLoginMode("student")}
            >
              학생 로그인
            </button>
            <button
              type="button"
              className={loginMode === "admin" ? "active" : ""}
              onClick={() => setLoginMode("admin")}
            >
              관리자 로그인
            </button>
          </div>
          <p>FULL PASSAGE BLANK QUIZ</p>
          <h1>본문 전체 랜덤 빈칸</h1>
          <small>
            전체 본문을 읽으며 매번 달라지는 빈칸을 모두 완성하세요.
          </small>
          {loginMode === "admin" ? (
            <label>
              관리자 비밀번호
              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
              />
            </label>
          ) : (
            <>
              <label>
                학생 이름
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                연락처 뒷번호 4자리
                <input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </label>
            </>
          )}
          {error && <em>{error}</em>}
          <button className="fb-login-button">로그인하고 풀기</button>
          <a className="fb-back" href="/quiz">
            ← 본문 퀴즈로 돌아가기
          </a>
        </form>
      </main>
    );
  return (
    <main className="fb-page">
      <header>
        <a href="/quiz">
          <span>M</span>
          <b>본문 퀴즈</b>
        </a>
        <nav>
          <b>
            {student.adminPractice ? "관리자 연습" : `${student.name} 학생`}
          </b>
          <a href="/word-quiz">단어 퀴즈</a>
          <a href="/naesin">내신관리 홈</a>
          <button
            onClick={async () => {
              await fetch(
                student.adminPractice ? "/api/admin/auth" : "/api/student/auth",
                { method: "DELETE" },
              );
              setStudent(null);
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>
      <section className="fb-hero">
        <div>
          <p>FULL PASSAGE CHALLENGE</p>
          <h1>
            본문 전체를 읽고
            <br />
            <strong>랜덤 빈칸을 완성해요.</strong>
          </h1>
          <span>새 문제를 누를 때마다 빈칸 위치가 달라집니다.</span>
        </div>
        <div>
          <b>{solved ? Math.round((score / solved) * 100) : 0}%</b>
          <span>전체 정답률</span>
        </div>
      </section>
      <section className="fb-controls">
        <label>
          출판사
          <select
            value={publisher}
            onChange={(e) =>
              reset(
                quizPassages.findIndex(
                  (x) =>
                    (x.publisher || "천재교육 · 소영순") === e.target.value,
                ),
              )
            }
          >
            {publishers.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          학년
          <select
            value={grade}
            onChange={(e) =>
              reset(
                quizPassages.findIndex(
                  (x) =>
                    (x.publisher || "천재교육 · 소영순") === publisher &&
                    (x.grade || "중학교 2학년") === e.target.value,
                ),
              )
            }
          >
            {grades.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          과·본문
          <select
            value={passage}
            onChange={(e) => reset(Number(e.target.value))}
          >
            {options.map(({ x, i }) => (
              <option value={i} key={i}>
                {x.lesson || "5과"} · {x.title}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="fb-card">
        <div className="fb-card-head">
          <div>
            <p>
              {publisher} · {grade} · {lesson}
            </p>
            <h2>{current.title}</h2>
          </div>
          <span>
            랜덤 세트 {round} · 빈칸 {required}개
          </span>
        </div>
        <div className="fb-passage">
          {blanks.map((row, si) => (
            <article key={si}>
              <small>
                {si + 1}. {row.sentence.ko}
              </small>
              <p>
                {row.parts.map((part, pi) =>
                  row.indexes.includes(pi) ? (
                    <input
                      key={pi}
                      value={answers[`${si}-${pi}`] || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [`${si}-${pi}`]: e.target.value,
                        })
                      }
                      className={
                        checked
                          ? norm(answers[`${si}-${pi}`] || "") === norm(part)
                            ? "ok"
                            : "wrong"
                          : ""
                      }
                      style={{
                        width: `${Math.max(66, part.length * 10 + 24)}px`,
                      }}
                      aria-label={`${si + 1}번 문장 빈칸`}
                    />
                  ) : (
                    <span key={pi}>{part}</span>
                  ),
                )}
              </p>
              {checked &&
                row.indexes.some(
                  (pi) =>
                    norm(answers[`${si}-${pi}`] || "") !== norm(row.parts[pi]),
                ) && <em>정답: {row.sentence.en}</em>}
            </article>
          ))}
        </div>
        {checked && (
          <div className={`fb-result ${allCorrect ? "ok" : "retry"}`}>
            <b>
              {allCorrect
                ? "전체 빈칸을 정확히 완성했습니다!"
                : `${required}개 중 ${correctCount}개 정답입니다.`}
            </b>
            <span>
              틀린 문장은 바로 아래 정답을 확인하고 새 문제로 다시 연습하세요.
            </span>
          </div>
        )}
        <div className="fb-actions">
          <button className="fb-print" onClick={() => printRows(false)}>
            빈칸 문제 인쇄
          </button>
          <button
            className="fb-print-wrong"
            disabled={!checked || !wrongRows.length}
            onClick={() => printRows(true)}
          >
            틀린 문장만 인쇄
          </button>
          <button
            onClick={() => {
              setAnswers({});
              setChecked(false);
            }}
          >
            다시 쓰기
          </button>
          <button
            disabled={
              saving || checked || Object.keys(answers).length < required
            }
            onClick={check}
          >
            {student.adminPractice ? "정답 확인" : "채점하고 기록 저장"}
          </button>
          <button onClick={next}>새 랜덤 빈칸 →</button>
        </div>
      </section>
    </main>
  );
}
