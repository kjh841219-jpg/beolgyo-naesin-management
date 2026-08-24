import { AcademyCalendar } from "../AcademyCalendar";
import { PortalHeader } from "../PortalHeader";

export default function AcademyCalendarPage() {
  return (
    <main>
      <PortalHeader active={2} />
      <div className="subpage-banner">
        <p>PAGE 02 · ACADEMY CALENDAR</p>
        <h1>벌교미래엔영어학원<br /><strong>월별 학원 일정</strong></h1>
        <div><a href="/academy">← 학원소개</a><a href="/">학사일정 →</a></div>
      </div>
      <AcademyCalendar />
    </main>
  );
}
