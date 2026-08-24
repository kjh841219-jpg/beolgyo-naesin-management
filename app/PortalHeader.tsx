export function PortalHeader({ active = 3 }: { active?: 2 | 3 }) {
  return (
    <header className="site-header portal-header">
      <a className="brand" href="/" aria-label="벌교미래엔영어학원 메인">
        <span className="brand-mark">M</span>
        <span>벌교미래엔<small>영어학원</small></span>
      </a>
      <nav aria-label="페이지 메뉴">
        <a className="nav-naesin" href="https://naesin-vercel-deploy.vercel.app/">내신관리</a>
        <a href="/academy">학원소개</a>
        <a className={active === 2 ? "portal-active" : ""} href="/academy-calendar">학원일정</a>
        <a className={active === 3 ? "portal-active" : ""} href="/">학사일정</a>
        <a className="nav-daily-test" href="/academy#daily-mini-test">DAILY 미니테스트</a>
        <a className="nav-level-test" href="/academy#level-test">무료 레벨테스트</a>
        <a className="nav-cta" href="/academy#consult">상담예약</a>
        <a className="nav-admin" href="/admin">관리자 로그인</a>
      </nav>
    </header>
  );
}
