"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type School = {
  officeCode: string;
  officeName: string;
  schoolCode: string;
  name: string;
  kind: string;
  region: string;
  address: string;
  homepage: string;
};

type SchoolEvent = {
  date: string;
  title: string;
  description: string;
  type: string;
  grades: number[];
};

const regions = [
  ["", "전국"],
  ["B10", "서울"],
  ["C10", "부산"],
  ["D10", "대구"],
  ["E10", "인천"],
  ["F10", "광주"],
  ["G10", "대전"],
  ["H10", "울산"],
  ["I10", "세종"],
  ["J10", "경기"],
  ["K10", "강원"],
  ["M10", "충북"],
  ["N10", "충남"],
  ["P10", "전북"],
  ["Q10", "전남"],
  ["R10", "경북"],
  ["S10", "경남"],
  ["T10", "제주"],
] as const;

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

function formatAgendaDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return `${parsed.getMonth() + 1}.${String(parsed.getDate()).padStart(2, "0")} (${weekDays[parsed.getDay()]})`;
}

export function SchoolScheduleSearch() {
  const today = new Date();
  const [query, setQuery] = useState("벌교");
  const [region, setRegion] = useState("Q10");
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [message, setMessage] = useState("학교명을 검색하고 목록에서 학교를 선택해 주세요.");
  const [limited, setLimited] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: lastDate }, (_, index) => index + 1),
    ];
  }, [year, month]);

  const eventMap = useMemo(() => {
    const result = new Map<string, SchoolEvent[]>();
    events.forEach((event) => result.set(event.date, [...(result.get(event.date) ?? []), event]));
    return result;
  }, [events]);

  async function searchSchools(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const name = query.trim();
    if (name.length < 2) {
      setMessage("학교명을 두 글자 이상 입력해 주세요.");
      document.getElementById("school-name")?.focus();
      return;
    }
    setSearching(true);
    setSelectedSchool(null);
    setEvents([]);
    setSchools([]);
    setLimited(false);
    setMessage("전국 학교 정보를 검색하고 있습니다…");
    try {
      const response = await fetch(`/api/school-schedules?action=schools&q=${encodeURIComponent(name)}&region=${encodeURIComponent(region)}`);
      const data = await response.json() as { schools?: School[]; error?: string };
      if (!response.ok) throw new Error(data.error);
      const nextSchools = data.schools ?? [];
      setSchools(nextSchools);
      setMessage(nextSchools.length
        ? `${nextSchools.length}개 학교를 찾았습니다. 확인할 학교를 선택해 주세요.`
        : "검색 결과가 없습니다. 학교의 정식 명칭이나 지역을 다시 확인해 주세요.");
      if (nextSchools.length === 1) setSelectedSchool(nextSchools[0]);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "학교 검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!selectedSchool) return;
    const controller = new AbortController();
    setLoadingSchedule(true);
    setEvents([]);
    setLimited(false);
    setMessage(`${selectedSchool.name} ${month + 1}월 일정을 불러오고 있습니다…`);
    fetch(`/api/school-schedules?action=schedule&office=${selectedSchool.officeCode}&school=${selectedSchool.schoolCode}&year=${year}&month=${month + 1}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json() as { events?: SchoolEvent[]; error?: string; limited?: boolean };
        if (!response.ok) throw new Error(data.error);
        setEvents(data.events ?? []);
        setLimited(Boolean(data.limited));
        setMessage(data.events?.length
          ? `${selectedSchool.name}의 ${year}년 ${month + 1}월 주요 일정입니다.`
          : `${selectedSchool.name}의 ${year}년 ${month + 1}월 공개 일정이 없습니다.`);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error && error.message ? error.message : "학사일정을 불러오지 못했습니다.");
      })
      .finally(() => setLoadingSchedule(false));
    return () => controller.abort();
  }, [selectedSchool, year, month]);

  function moveMonth(amount: number) {
    setViewDate(new Date(year, month + amount, 1));
  }

  return (
    <section className="school-schedule-section" id="school-schedule" aria-labelledby="schedule-title">
      <div className="school-schedule-heading">
        <div>
          <p className="school-schedule-kicker"><span />전국 초·중·고 학교 일정</p>
          <h2 id="schedule-title">우리 학교의 중요한 날,<br /><strong>한 번에 확인하세요</strong></h2>
        </div>
        <p>교육부 나이스 교육정보 개방포털의 공개 데이터를 활용합니다. 학교를 검색하고 시험·방학·행사 등 월별 학사일정을 달력으로 확인하세요.</p>
      </div>

      <div className="school-search-card">
        <form className="school-search-form" onSubmit={searchSchools}>
          <label>
            <span>지역</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              {regions.map(([code, name]) => <option value={code} key={name}>{name}</option>)}
            </select>
          </label>
          <label className="school-name-field">
            <span>학교명</span>
            <input id="school-name" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 벌교중학교" autoComplete="off" />
          </label>
          <button type="submit" disabled={searching}>{searching ? "검색 중…" : "학교 검색"} <b aria-hidden="true">→</b></button>
        </form>
        <div className="school-search-status" role="status"><span className={searching || loadingSchedule ? "is-loading" : ""} />{message}</div>

        {schools.length > 0 && (
          <div className="school-result-list" aria-label="학교 검색 결과">
            {schools.map((school) => (
              <button
                className={selectedSchool?.schoolCode === school.schoolCode ? "is-selected" : ""}
                type="button"
                onClick={() => setSelectedSchool(school)}
                key={`${school.officeCode}-${school.schoolCode}`}
              >
                <span>{school.kind}</span>
                <strong>{school.name}</strong>
                <small>{school.address || school.region}</small>
                <b>{selectedSchool?.schoolCode === school.schoolCode ? "선택됨" : "일정 보기"}</b>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`school-calendar-layout ${selectedSchool ? "has-school" : ""}`}>
        <div className="school-calendar-panel">
          <div className="calendar-toolbar school-calendar-toolbar">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">←</button>
            <div>
              <span>{selectedSchool?.name ?? "학교를 선택해 주세요"}</span>
              <h3>{year}년 {month + 1}월</h3>
            </div>
            <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">→</button>
          </div>
          <div className="calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-days school-calendar-days">
            {calendarDays.map((day, index) => {
              if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
              const date = `${monthPrefix}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventMap.get(date) ?? [];
              const isToday = date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              return (
                <div className={`calendar-day ${dayEvents.length ? "has-event" : ""} ${isToday ? "is-today" : ""}`} key={date}>
                  <b>{day}</b>
                  {dayEvents.slice(0, 2).map((event, eventIndex) => <span title={event.title} key={`${event.title}-${eventIndex}`}>{event.title}</span>)}
                  {dayEvents.length > 2 && <small>+{dayEvents.length - 2}개</small>}
                </div>
              );
            })}
          </div>
          {!selectedSchool && <div className="school-calendar-placeholder"><span>⌕</span><strong>위 검색창에서 학교를 찾아 선택하세요</strong><small>학교 선택 후 월별 학사일정이 달력에 표시됩니다.</small></div>}
        </div>

        <aside className="school-agenda">
          <div className="school-agenda-head">
            <span>MONTHLY SCHEDULE</span>
            <h3>{selectedSchool ? `${month + 1}월 주요 일정` : "학교 일정 안내"}</h3>
          </div>
          <div className="school-agenda-list">
            {events.map((event, index) => (
              <article key={`${event.date}-${event.title}-${index}`}>
                <time dateTime={event.date}>{formatAgendaDate(event.date)}</time>
                <div>
                  <span>{event.type || "학사일정"}{event.grades.length ? ` · ${event.grades.join("·")}학년` : ""}</span>
                  <strong>{event.title}</strong>
                  {event.description && <p>{event.description}</p>}
                </div>
              </article>
            ))}
            {selectedSchool && !loadingSchedule && !events.length && <p className="school-agenda-empty">이 달에 공개된 학사일정이 없습니다.</p>}
            {!selectedSchool && <p className="school-agenda-empty">학교를 선택하면 시험, 방학, 행사 등 공개된 일정이 이곳에 정리됩니다.</p>}
          </div>
          {selectedSchool?.homepage && <a href={selectedSchool.homepage} target="_blank" rel="noreferrer">학교 홈페이지에서 더 보기 <span>↗</span></a>}
          <a className="neis-source-link" href="https://open.neis.go.kr/" target="_blank" rel="noreferrer">출처: 나이스 교육정보 개방포털 <span>↗</span></a>
          {limited && <small className="school-data-note">현재 공개 API가 제공하는 주요 일정이 표시됩니다. 전체 공지는 학교 홈페이지도 함께 확인해 주세요.</small>}
        </aside>
      </div>
    </section>
  );
}
