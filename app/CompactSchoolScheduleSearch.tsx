"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SchoolScheduleSearch } from "./SchoolScheduleSearch";

export function CompactSchoolScheduleSearch() {
  const [schoolName, setSchoolName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = schoolName.trim();
    if (!name) {
      document.getElementById("academy-school-name")?.focus();
      return;
    }
    setSubmittedName(name);
  }

  useEffect(() => {
    if (submittedName) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [submittedName]);

  return (
    <>
      <section className="compact-schedule" aria-labelledby="compact-schedule-title">
        <div className="compact-schedule-inner">
          <div className="compact-schedule-copy">
            <span aria-hidden="true">24</span>
            <div><p>전국 초·중·고 학교 일정</p><h2 id="compact-schedule-title">우리 학교 학사일정 검색</h2></div>
          </div>
          <form onSubmit={search}>
            <label className="sr-only" htmlFor="academy-school-name">학교명</label>
            <input id="academy-school-name" type="search" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="학교명을 입력하세요 (예: 벌교중학교)" autoComplete="off" />
            <button type="submit">달력으로 일정 보기 <b aria-hidden="true">→</b></button>
          </form>
        </div>
        <small>학교명을 검색하면 아래 달력에 해당 학교의 공개 학사일정이 바로 표시됩니다.</small>
      </section>
      {submittedName && (
        <div ref={resultRef} className="compact-school-calendar-result">
          <SchoolScheduleSearch key={submittedName} initialQuery={submittedName} autoSearch />
        </div>
      )}
    </>
  );
}
