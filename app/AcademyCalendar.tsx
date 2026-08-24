"use client";

import { useEffect, useMemo, useState } from "react";
import { useLandingContent } from "./useLandingContent";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

export function AcademyCalendar() {
  const content = useLandingContent();
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [holidays, setHolidays] = useState<Array<{ date: string; name: string }>>([]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  useEffect(() => {
    fetch(`/api/public-holidays?year=${year}&v=2`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { holidays: [] })
      .then((data: { holidays?: Array<{ date: string; name: string }> }) => setHolidays(data.holidays ?? []))
      .catch(() => setHolidays([]));
  }, [year]);
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const calendarDays = [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: lastDate }, (_, index) => index + 1),
    ];
    const trailingDays = (7 - (calendarDays.length % 7)) % 7;
    return [...calendarDays, ...Array.from({ length: trailingDays }, () => null)];
  }, [year, month]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthStart = `${monthPrefix}-01`;
  const monthEnd = `${monthPrefix}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;
  const monthEvents = content.academyEvents.filter((event) =>
    event.date <= monthEnd && (event.endDate || event.date) >= monthStart);
  const holidayMap = new Map(holidays.map((holiday) => [holiday.date, holiday.name]));
  const monthHolidays = holidays.filter((holiday) => holiday.date.startsWith(monthPrefix));
  const eventMap = new Map<string, typeof monthEvents>();
  monthEvents.forEach((event) => {
    const start = new Date(`${event.date}T00:00:00Z`);
    const end = new Date(`${event.endDate || event.date}T00:00:00Z`);
    for (let cursor = start, count = 0; cursor <= end && count < 370; count += 1) {
      const date = cursor.toISOString().slice(0, 10);
      if (date >= monthStart && date <= monthEnd) {
        const current = eventMap.get(date) ?? [];
        current.push(event);
        eventMap.set(date, current);
      }
      cursor = new Date(cursor.getTime() + 86400000);
    }
  });

  function moveMonth(amount: number) {
    setViewDate(new Date(year, month + amount, 1));
  }

  return (
    <section className="academy-calendar-section" id="academy-calendar">
      <div className="academy-calendar-heading">
        <div><p className="section-label">ACADEMY CALENDAR</p><h2>학원 일정을<br /><strong>달력으로 한눈에</strong></h2></div>
        <p>휴원일, 보강, 시험과 설명회 등 중요한 학원 일정을 확인하세요. 일정은 관리자 페이지에서 직접 추가하고 수정할 수 있습니다.</p>
      </div>
      <div className="academy-calendar-wrap">
        <div className="calendar-panel">
          <div className="calendar-toolbar">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">←</button>
            <h3>{year}년 {month + 1}월</h3>
            <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">→</button>
          </div>
          <div className="calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-days">
            {days.map((day, index) => {
              if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
              const date = `${monthPrefix}-${String(day).padStart(2, "0")}`;
              const events = eventMap.get(date) ?? [];
              const holidayName = holidayMap.get(date);
              const isToday = date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              return <div className={`calendar-day ${events.length ? "has-event" : ""} ${holidayName ? "is-holiday" : ""} ${isToday ? "is-today" : ""}`} key={date}><b>{day}</b>{holidayName && <em className="holiday-name">{holidayName}</em>}<div className="calendar-event-stack">{events.slice(0, 2).map((event, eventIndex) => <span title={`${event.category} · ${event.title}`} key={`${event.title}-${eventIndex}`}>{event.title}</span>)}{events.length > 2 && <small>일정 +{events.length - 2}개</small>}</div></div>;
            })}
          </div>
        </div>
        <aside className="calendar-agenda">
          <p>{month + 1}월 일정</p>
          <h3>{monthEvents.length ? `총 ${monthEvents.length}개의 학원 일정` : "등록된 학원 일정이 없습니다"}</h3>
          <div>
            {monthHolidays.map((holiday) => <article className="holiday-agenda-item" key={holiday.date}><time dateTime={holiday.date}>{Number(holiday.date.slice(8))}<small>{weekDays[new Date(`${holiday.date}T00:00:00`).getDay()]}</small></time><p><span>국가공휴일</span><strong>{holiday.name}</strong></p></article>)}
            {monthEvents.map((event, index) => <article key={`${event.date}-${event.title}-${index}`}><time dateTime={event.date}>{Number(event.date.slice(8))}<small>{weekDays[new Date(`${event.date}T00:00:00`).getDay()]}</small></time><p><span>{event.category}</span><strong>{event.title}</strong>{event.endDate && event.endDate !== event.date && <small>{event.date.replaceAll("-", ".")} ~ {event.endDate.replaceAll("-", ".")}</small>}</p></article>)}
            {!monthEvents.length && <p className="calendar-empty-message">관리자 페이지에서 날짜와 일정명을 등록하면 이곳에 바로 표시됩니다.</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
