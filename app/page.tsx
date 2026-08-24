import { PortalHeader } from "./PortalHeader";
import { SchoolScheduleSearch } from "./SchoolScheduleSearch";

export default function SchoolScheduleHome() {
  return (
    <main className="schedule-home-page">
      <PortalHeader />
      <section className="schedule-home-hero">
        <div className="schedule-home-orbit orbit-a" aria-hidden="true" />
        <div className="schedule-home-orbit orbit-b" aria-hidden="true" />
        <div className="schedule-home-copy">
          <p><span /> SCHOOL SCHEDULE SEARCH</p>
          <h1>전국 학교 학사일정을<br /><strong>한 번에 찾아보세요</strong></h1>
          <p className="schedule-home-lead">학교명만 입력하면 초·중·고등학교의 공개된 학사일정 검색 결과로 바로 연결됩니다.</p>
        </div>
        <SchoolScheduleSearch />
        <div className="schedule-home-links">
          <a href="/academy"><b>01</b><span>학원 소개<small>교육과정과 상담 안내</small></span><i>→</i></a>
          <a href="/academy-calendar"><b>02</b><span>학원 일정<small>휴원·보강·시험 일정</small></span><i>→</i></a>
          <a className="current" href="/"><b>03</b><span>학교 학사일정<small>전국 학교 일정 검색</small></span><i>✓</i></a>
        </div>
      </section>
    </main>
  );
}
