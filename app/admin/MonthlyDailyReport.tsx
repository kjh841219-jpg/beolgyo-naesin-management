"use client";

import { useMemo, useState } from "react";

export type MonthlyDailyItem = {
  id: string;
  testDate: string;
  studentName: string;
  phone: string;
  levelLabel: string;
  score: number;
  total: number;
  listening: number;
  listeningTotal: number;
  vocabulary: number;
  vocabularyTotal: number;
  grammar?: number;
  grammarTotal?: number;
  reading: number;
  readingTotal: number;
};

const percent = (score: number, total: number) => total ? Math.round((score / total) * 100) : 0;
const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const monthLabel = (month: string) => {
  const [year, value] = month.split("-");
  return `${year}년 ${Number(value)}월`;
};

function evaluation(name: string, attendance: number, overall: number, strongest: string, weakest: string) {
  const effort = attendance >= 20
    ? "한 달 동안 매우 꾸준하게 참여하며 성실한 학습 습관을 보여주었습니다."
    : attendance >= 12
      ? "정해진 학습에 꾸준히 참여하며 좋은 학습 흐름을 만들어 가고 있습니다."
      : "학습에 참여한 날의 집중도는 좋았습니다. 다음 달에는 조금 더 규칙적인 참여를 기대합니다.";
  const achievement = overall >= 90
    ? "전반적인 이해도와 문제 해결력이 매우 안정적이며 자신 있게 다음 단계에 도전할 수 있습니다."
    : overall >= 75
      ? "핵심 내용을 잘 이해하고 있으며, 반복 학습을 이어가면 더욱 안정적인 성취가 기대됩니다."
      : overall >= 60
        ? "기본 개념을 차근차근 익히고 있습니다. 틀린 문제를 다시 확인하는 과정이 큰 도움이 됩니다."
        : "현재는 기초를 단단히 다지는 과정입니다. 부담을 줄이고 작은 성공 경험을 충분히 쌓도록 지도하겠습니다.";
  return `${name} 학생은 ${effort} ${strongest} 영역에서 특히 좋은 강점을 보였으며, ${weakest} 영역은 짧게라도 매일 반복하면 더욱 빠르게 성장할 수 있습니다. ${achievement} 다음 달에도 결과만을 재촉하기보다 꾸준히 도전하는 과정을 충분히 칭찬하며 세심하게 지도하겠습니다.`;
}

export default function MonthlyDailyReport({ items }: { items: MonthlyDailyItem[] }) {
  const currentMonth = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
  const students = useMemo(() => {
    const map = new Map<string, MonthlyDailyItem>();
    items.forEach((item) => map.set(`${item.studentName}|${item.phone}`, item));
    return [...map.entries()].map(([key, item]) => ({ key, name: item.studentName, phone: item.phone }));
  }, [items]);
  const [studentKey, setStudentKey] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const activeKey = studentKey || students[0]?.key || "";
  const records = useMemo(() =>
    items
      .filter((item) => `${item.studentName}|${item.phone}` === activeKey && item.testDate.startsWith(month))
      .sort((a, b) => a.testDate.localeCompare(b.testDate)),
  [items, activeKey, month]);
  const student = students.find((item) => item.key === activeKey);
  const overall = average(records.map((item) => percent(item.score, item.total)));
  const listening = average(records.map((item) => percent(item.listening, item.listeningTotal)));
  const vocabulary = average(records.map((item) => percent(item.vocabulary, item.vocabularyTotal)));
  const grammarRecords = records.filter((item) => (item.grammarTotal ?? 0) > 0);
  const grammar = average(grammarRecords.map((item) => percent(item.grammar ?? 0, item.grammarTotal ?? 0)));
  const reading = average(records.map((item) => percent(item.reading, item.readingTotal)));
  const areas: Array<readonly [string, number]> = [["듣기", listening], ["단어", vocabulary], ...(grammarRecords.length ? [["문법", grammar] as const] : []), ["리딩", reading]];
  const ranked = [...areas].sort((a, b) => b[1] - a[1]);
  const level = records.at(-1)?.levelLabel ?? "-";

  return (
    <section className="admin-record-card monthly-report-section" id="admin-monthly-report">
      <div className="admin-record-heading monthly-report-heading">
        <div>
          <p>MONTHLY DAILY REPORT</p>
          <h2>학생별 월간 DAILY 평가표</h2>
          <small>한 달의 테스트 결과를 모아 학생별 종합평가표를 자동 생성합니다.</small>
        </div>
        <div className="monthly-report-controls">
          <select value={activeKey} onChange={(event) => setStudentKey(event.target.value)} aria-label="평가표 학생 선택">
            {!students.length && <option value="">저장된 학생 없음</option>}
            {students.map((item) => <option key={item.key} value={item.key}>{item.name} · {item.phone}</option>)}
          </select>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="평가표 월 선택" />
          <button type="button" onClick={() => window.print()} disabled={!records.length}>인쇄·PDF 저장</button>
        </div>
      </div>

      {records.length ? (
        <article className="monthly-report-paper">
          <header>
            <div><span>BEOLGYO MIRAEN ENGLISH</span><h3>DAILY 영어학습 월간 평가표</h3></div>
            <strong>{monthLabel(month)}</strong>
          </header>
          <div className="monthly-report-profile">
            <dl><dt>학생명</dt><dd>{student?.name}</dd></dl>
            <dl><dt>학습 단계</dt><dd>{level}</dd></dl>
            <dl><dt>참여 일수</dt><dd>{records.length}일</dd></dl>
            <dl><dt>종합 평균</dt><dd>{overall}점</dd></dl>
          </div>
          <div className="monthly-score-grid">
            {areas.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong><small>/ 100</small><i><b style={{ width: `${value}%` }} /></i></div>
            ))}
          </div>
          <section className="monthly-teacher-note">
            <p>TEACHER&apos;S COMMENT</p>
            <h4>이번 달 종합평가</h4>
            <div>{evaluation(student?.name ?? "학생", records.length, overall, ranked[0][0], ranked.at(-1)?.[0] ?? "리딩")}</div>
          </section>
          <section className="monthly-records">
            <h4>일자별 학습 기록</h4>
            <table>
              <thead><tr><th>날짜</th><th>단계</th><th>듣기</th><th>단어</th>{grammarRecords.length > 0 && <th>문법</th>}<th>리딩</th><th>종합</th></tr></thead>
              <tbody>{records.map((item) => (
                <tr key={item.id}>
                  <td>{item.testDate}</td><td>{item.levelLabel}</td>
                  <td>{percent(item.listening, item.listeningTotal)}점</td>
                  <td>{percent(item.vocabulary, item.vocabularyTotal)}점</td>
                  {grammarRecords.length > 0 && <td>{(item.grammarTotal ?? 0) > 0 ? `${percent(item.grammar ?? 0, item.grammarTotal ?? 0)}점` : "-"}</td>}
                  <td>{percent(item.reading, item.readingTotal)}점</td>
                  <td><b>{percent(item.score, item.total)}점</b></td>
                </tr>
              ))}</tbody>
            </table>
          </section>
          <footer><b>벌교미래엔영어학원</b><span>학생의 매일이 자신 있는 영어 실력으로 이어지도록 함께하겠습니다.</span></footer>
        </article>
      ) : <div className="monthly-report-empty">선택한 학생의 해당 월 DAILY 결과가 없습니다.</div>}
    </section>
  );
}
