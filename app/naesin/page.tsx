import Link from "next/link";
import type { Metadata } from "next";
import "./naesin.css";
import "./naesin-admin.css";

export const metadata: Metadata = {
  title: "중등 내신 4주 집중 대비 | 벌교미래엔영어학원",
  description: "본문 암기, 서술형, 오답 정리까지 시험 범위에 맞춰 매일 관리하는 벌교미래엔영어학원 중등 내신 대비 프로그램입니다.",
};

const weeks = [
  { week: "4주 전", label: "기초 정리", title: "시험 범위를 펼치고,\n빈틈부터 찾습니다", points: ["시험 범위표·교과서·프린트 한 번에 정리", "본문 전체 해석과 문장 구조 분석", "단원별 핵심 단어·숙어 1회독", "문법 기본 개념과 교과서 예문 점검"], tone: "blue" },
  { week: "3주 전", label: "본문 암기 + 서술형 정리", title: "외우는 데서 그치지 않고,\n쓸 수 있게 만듭니다", points: ["본문을 문장별로 끊어 해석·암기", "핵심 단어 2회독과 미니 테스트", "서술형 예상 문장과 모범답안 정리", "영작형·해석형 문제 직접 써보기"], tone: "mint" },
  { week: "2주 전", label: "실전 서술형 훈련", title: "시간 안에 정확히 쓰는\n실전 감각을 익힙니다", points: ["본문 빈칸·순서배열·영작·해석 훈련", "서술형 답안을 시간 재고 작성", "학교 기출·예상·변형문제 집중 풀이", "틀린 답은 표현까지 고쳐 다시 쓰기"], tone: "blue" },
  { week: "1주 전", label: "최종 마무리", title: "아는 것을 점수로 바꾸는\n마지막 점검을 합니다", points: ["본문 전체를 막힘없이 말하고 써보기", "최빈출 단어·숙어·핵심 표현 최종 암기", "오답노트와 표현노트 2~3회 반복", "실전 모의테스트와 시험 직전 확인"], tone: "mint" },
];

const routines = [
  ["01", "학교 수업 복습", "20분"], ["02", "단어 암기", "30분"], ["03", "본문 암기", "40분"],
  ["04", "서술형 쓰기", "40분"], ["05", "오답 정리", "20분"], ["06", "자기 전 본문 확인", "10분"],
];

export default function NaesinPage() {
  return <main className="naesin-page">
    <style>{`
      @media(max-width:560px){.ns-mobile-actions{grid-template-columns:repeat(4,1fr)}.ns-mobile-actions a{font-size:10px;letter-spacing:-.04em}}
    `}</style>
    <header className="ns-header">
      <a className="ns-brand" href="/academy"><span>M</span><b>벌교미래엔영어학원</b></a>
      <nav aria-label="내신 대비 메뉴"><a className="ns-home-link" href="https://vercel-deploy-mauve-one-18.vercel.app/academy">벌교미래엔영어 랜딩페이지</a><a href="#plan">4주 계획</a><a href="#system">관리 방식</a><Link className="ns-word-link" href="/word-quiz">단어 퀴즈</Link><Link className="ns-quiz-link" href="/quiz">본문 퀴즈</Link><Link href="/dialog-quiz">대화문 퀴즈</Link><Link className="ns-student-login" href="/study-log">학생 로그인</Link><Link className="ns-admin-login" href="/naesin-admin">관리자 로그인</Link><a className="ns-nav-cta" href="https://vercel-deploy-mauve-one-18.vercel.app/academy#consult">상담 예약</a></nav>
    </header>

    <section className="ns-hero">
      <div className="ns-hero-copy">
        <p className="ns-kicker"><span>BEOLGYO MIRAEN ENGLISH</span> 중등 내신 집중 대비</p>
        <h1>시험 4주 전,<br/><em>점수가 달라지는</em><br/>공부가 시작됩니다.</h1>
        <p className="ns-lead">본문 암기부터 서술형, 오답 정리까지.<br/>해야 할 공부를 주차별로 나누고 매일 확인합니다.</p>
        <div className="ns-actions"><a className="ns-primary" href="https://vercel-deploy-mauve-one-18.vercel.app/academy#consult">내신 대비 상담하기 <span>→</span></a><a className="ns-secondary" href="#plan">4주 계획 보기</a></div>
        <div className="ns-proof"><div><b>4WEEK</b><span>시험 범위 맞춤 계획</span></div><div><b>DAILY</b><span>매일 학습 루틴</span></div><div><b>1:1</b><span>오답·서술형 점검</span></div></div>
      </div>
      <div className="ns-hero-board" aria-label="내신 대비 진행 과정">
        <div className="ns-board-top"><span>EXAM PREP MAP</span><b>4주 완성 로드맵</b><i>진행 중</i></div>
        {weeks.map((item, index) => <div className="ns-board-row" key={item.week}><span>0{index + 1}</span><div><b>{item.week}</b><small>{item.label}</small></div><i style={{"--progress": `${30 + index * 22}%`} as React.CSSProperties}/></div>)}
        <div className="ns-board-note"><span>✓</span><p><b>오늘의 학습까지 구체적으로</b><small>계획 → 실행 → 확인 → 보완</small></p></div>
      </div>
    </section>

    <section className="ns-principles">
      <p>내신 공부 원칙</p><div><span>01</span><b>본문은<br/>정확하게</b></div><div><span>02</span><b>서술형은<br/>직접 쓰기</b></div><div><span>03</span><b>단어·문법은<br/>함께 점검</b></div><div><span>04</span><b>오답은<br/>끝까지 정리</b></div>
    </section>

    <section className="ns-plan" id="plan">
      <div className="ns-section-heading"><p>4-WEEK STUDY PLAN</p><h2>막연한 “열심히” 대신,<br/><strong>점수로 이어지는 순서</strong>가 있습니다.</h2><span>시험 범위와 학생의 현재 수준에 따라 세부 계획은 조정됩니다.</span></div>
      <div className="ns-week-list">{weeks.map((item, index) => <article className={`ns-week ${item.tone}`} key={item.week}>
        <div className="ns-week-no"><small>WEEK {4-index}</small><strong>{item.week}</strong><span>{item.label}</span></div>
        <div className="ns-week-main"><h3>{item.title.split("\n").map((line, i) => <span key={line}>{line}{i === 0 && <br/>}</span>)}</h3><ul>{item.points.map(point => <li key={point}><span>✓</span>{point}</li>)}</ul></div>
        <div className="ns-week-index">0{index+1}</div>
      </article>)}</div>
    </section>

    <section className="ns-routine">
      <div className="ns-routine-heading"><p>DAILY ROUTINE</p><h2>매일 해야 할 공부가<br/>분명하면 흔들리지 않습니다.</h2></div>
      <div className="ns-routine-grid">{routines.map(([no, title, time]) => <article key={no}><span>{no}</span><div className="ns-routine-icon">{no === "01" ? "S" : no === "02" ? "W" : no === "03" ? "B" : no === "04" ? "P" : no === "05" ? "✓" : "★"}</div><b>{title}</b><small>{time}</small></article>)}</div>
    </section>

    <section className="ns-system" id="system">
      <div className="ns-section-heading light"><p>MIRAEN EXAM SYSTEM</p><h2>계획표만 주지 않습니다.<br/><strong>실행되는지 매일 확인합니다.</strong></h2></div>
      <div className="ns-system-grid"><article><span>01</span><h3>범위 분석</h3><p>시험 범위표와 교과서, 프린트, 학교별 출제 경향을 모아 우선순위를 정합니다.</p></article><article><span>02</span><h3>주차별 실행</h3><p>본문·어휘·문법·서술형을 하루 단위로 나누고 학습 완료 여부를 점검합니다.</p></article><article><span>03</span><h3>오답 재학습</h3><p>틀린 이유를 찾고 같은 실수를 반복하지 않도록 변형 문제와 다시 쓰기로 보완합니다.</p></article><article><span>04</span><h3>시험 직전 완성</h3><p>최종 모의테스트로 남은 빈틈을 확인하고 시험장에서 꺼내 쓸 수 있게 정리합니다.</p></article></div>
    </section>

    <section className="ns-check"><div><p>FINAL CHECKLIST</p><h2>시험 전, 이것까지 확인합니다.</h2></div><ul>{["시험 범위 자료 정리", "본문 암기 완료", "단어장 최종 점검", "서술형 답안 정리", "오답노트 반복", "실전 모의테스트"].map(x=><li key={x}><span>✓</span>{x}</li>)}</ul></section>

    <section className="ns-cta"><p>이번 시험, 준비 방식부터 달라져야 합니다.</p><h2>우리 아이의 시험 범위와 현재 수준에 맞는<br/><strong>4주 내신 계획</strong>을 상담해 보세요.</h2><a href="https://vercel-deploy-mauve-one-18.vercel.app/academy#consult">내신 대비 상담 예약 <span>→</span></a><small>상담 후 학생별 시험 범위와 학습 상태에 맞춰 안내드립니다.</small></section>
    <footer className="ns-footer"><a className="ns-brand" href="/academy"><span>M</span><b>벌교미래엔영어학원</b></a><p>학생별 시험 범위와 학습 상태에 따라 수업 및 계획은 달라질 수 있습니다.</p></footer>
    <div className="ns-mobile-actions"><Link href="/word-quiz">단어 퀴즈</Link><Link href="/quiz">본문 퀴즈</Link><Link href="/dialog-quiz">대화문 퀴즈</Link><a href="https://vercel-deploy-mauve-one-18.vercel.app/academy#consult">상담 예약</a></div>
  </main>
}
