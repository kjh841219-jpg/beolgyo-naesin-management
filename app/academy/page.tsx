import { ConsultationForm } from "../ConsultationForm";
import { LevelTest } from "../LevelTest";
import { CallbackWidget } from "../CallbackWidget";
import { ScoreResults } from "../ScoreResults";
import { LiteracySection } from "../LiteracySection";
import { CurriculumSection } from "../CurriculumSection";
import { SocialSection } from "../SocialSection";
import { HeroCopy } from "../HeroCopy";
import { AcademyContactCard, FooterContact } from "../AcademyContact";
import { AcademyCalendar } from "../AcademyCalendar";
import { DailyMiniTest } from "../DailyMiniTest";
import { CompactSchoolScheduleSearch } from "../CompactSchoolScheduleSearch";

const elementaryPoints = [
  "파닉스부터 소리와 글자 연결",
  "읽기·쓰기·듣기의 균형 있는 기초",
  "교재·음원·QR을 활용한 반복 학습",
];

const middlePoints = [
  "최근 시험지와 취약 영역 분석",
  "어휘·문법·독해를 연결한 내신 대비",
  "평가 결과에 따른 보완과 다음 계획",
];

const faqs = [
  {
    question: "모든 학생이 같은 교재와 진도로 공부하나요?",
    answer:
      "아닙니다. N-TELS 진단과 상담, 학생의 현재 학습 자료를 바탕으로 출발점을 정하고 필요한 단계와 교재를 선택합니다.",
  },
  {
    question: "테스트와 숙제가 아이에게 부담이 되지 않을까요?",
    answer:
      "학생의 학년과 현재 수준, 학교 일정, 학습 적응도를 살펴 분량과 난도를 조정합니다. 평가는 줄 세우기가 아니라 배운 내용을 확인하고 다음 학습을 정하기 위한 과정입니다.",
  },
  {
    question: "단기간에 성적이 오를 수 있나요?",
    answer:
      "변화의 속도와 폭은 시작 수준, 출석, 과제 수행, 학습 태도와 시험 범위에 따라 달라집니다. 획일적인 결과를 약속하기보다 현재 상태를 확인하고 현실적인 목표와 단계를 함께 정합니다.",
  },
  {
    question: "상담할 때 무엇을 준비하면 좋나요?",
    answer:
      "중학생은 최근 시험지나 성적 자료를, 초등학생은 현재 읽을 수 있는 단어와 문장 수준을 알려주시면 더 구체적인 상담에 도움이 됩니다.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="벌교미래엔영어학원 메인">
          <span className="brand-mark">M</span>
          <span>
            벌교미래엔
            <small>영어학원</small>
          </span>
        </a>
        <nav aria-label="주요 메뉴">
          <a className="nav-naesin" href="https://naesin-vercel-deploy.vercel.app/">내신관리</a>
          <a className="portal-active" href="/academy">학원소개</a>
          <a href="/academy-calendar">학원일정</a>
          <a href="/">학사일정</a>
          <a className="nav-daily-test" href="#daily-mini-test">DAILY 미니테스트</a>
          <a className="nav-level-test" href="#level-test">무료 레벨테스트</a>
          <a className="nav-cta" href="#consult">
            상담예약
          </a>
          <a className="nav-admin" href="/admin">관리자 로그인</a>
        </nav>
      </header>

      <CompactSchoolScheduleSearch />

      <section className="hero" id="top">
        <HeroCopy />

        <div className="hero-visual" aria-label="학생 수준 진단과 성장 과정을 보여주는 학습 카드">
          <div className="visual-glow" />
          <div className="report-card">
            <div className="report-header">
              <div>
                <span className="report-kicker">LEARNING MAP</span>
                <h2>현재 위치부터<br />정확하게</h2>
              </div>
              <span className="report-badge">N-TELS</span>
            </div>
            <div className="student-row">
              <span className="student-avatar">가</span>
              <div><strong>우리 아이 성장 지도</strong><small>진단 결과에 맞춘 학습 방향</small></div>
              <span className="level-chip">STEP 03</span>
            </div>
            <div className="skill-list">
              <div><span>듣기</span><i><b style={{ width: "72%" }} /></i><em>강점</em></div>
              <div><span>어휘</span><i><b style={{ width: "56%" }} /></i><em>성장 중</em></div>
              <div><span>문법</span><i><b style={{ width: "42%" }} /></i><em>우선 보완</em></div>
              <div><span>독해</span><i><b style={{ width: "63%" }} /></i><em>성장 중</em></div>
            </div>
            <div className="report-note">
              <span>다음 목표</span>
              <p>막히는 문법 개념부터 이해하고<br />독해 문제에 연결해요.</p>
            </div>
          </div>
          <div className="floating-note note-one"><span>✓</span> 이해 가능한 단계부터</div>
          <div className="floating-note note-two"><span>↗</span> 작은 성취를 자신감으로</div>
        </div>
      </section>

      <AcademyCalendar />

      <DailyMiniTest />

      <ScoreResults />

      <LiteracySection />

      <CurriculumSection />

      <LevelTest />

      <section className="problem-section">
        <div className="section-heading">
          <p className="section-label">WHY IT MATTERS</p>
          <h2>공부는 하는데,<br />왜 영어는 그대로일까요?</h2>
          <p>의지의 문제가 아니라 지금 막히는 지점과 학습 방법이 맞지 않았기 때문일 수 있습니다.</p>
        </div>
        <div className="problem-grid">
          <article>
            <span>01</span>
            <h3>같은 실수를 반복해요</h3>
            <p>취약 영역을 모른 채 문제 풀이와 진도만 반복하면 시간은 늘어도 변화는 작을 수 있습니다.</p>
          </article>
          <article>
            <span>02</span>
            <h3>영어 자신감이 낮아져요</h3>
            <p>해냈다는 경험 없이 어려운 수업을 따라가면 시도하기 전부터 영어를 피하게 됩니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>다음 학년이 더 버거워져요</h3>
            <p>읽기·쓰기와 어휘·문법의 빈틈은 학년이 올라갈수록 더 큰 학습 부담으로 이어질 수 있습니다.</p>
          </article>
        </div>
      </section>

      <section className="system-section" id="system">
        <div className="section-heading centered">
          <p className="section-label">GROWTH SYSTEM</p>
          <h2>목표부터 안심까지,<br />영어성장 3단계 시스템</h2>
          <p>수업 한 번이 아니라, 진단부터 피드백까지 이어지는 성장의 흐름을 만듭니다.</p>
        </div>
        <div className="steps">
          <article>
            <div className="step-number">1</div>
            <span className="step-en">DISCOVER</span>
            <h3>우리 아이 목표 정하기</h3>
            <p>N-TELS 진단과 상담으로 현재 수준과 취약 영역을 확인하고 현실적인 학습 목표를 정합니다.</p>
            <ul><li>현재 수준 진단</li><li>최근 학습 자료 확인</li><li>초·중등 목표 설정</li></ul>
          </article>
          <div className="step-arrow">→</div>
          <article className="featured-step">
            <div className="step-number">2</div>
            <span className="step-en">GROW</span>
            <h3>수준에 맞춰 성장하기</h3>
            <p>이해 가능한 단계부터 수업·평가·복습을 연결해 작은 성취를 차근차근 쌓습니다.</p>
            <ul><li>수준별 교재와 수업</li><li>Daily·Final·Word Test</li><li>숙제와 가정 복습</li></ul>
          </article>
          <div className="step-arrow">→</div>
          <article>
            <div className="step-number">3</div>
            <span className="step-en">REVIEW</span>
            <h3>변화를 확인하며 안심하기</h3>
            <p>평가 결과와 학습 태도, 강점과 보완점, 다음 계획을 상담과 피드백으로 공유합니다.</p>
            <ul><li>성장 과정 확인</li><li>학부모 피드백</li><li>다음 학습 계획</li></ul>
          </article>
        </div>
      </section>

      <section className="courses-section" id="courses">
        <div className="section-heading course-heading">
          <div>
            <p className="section-label">COURSES</p>
            <h2>학년에 맞는 고민을<br />정확하게 다룹니다</h2>
          </div>
          <p>초등의 첫 읽기와 중등의 내신은 목표가 다릅니다.<br />그래서 출발점과 관리 방법도 달라야 합니다.</p>
        </div>
        <div className="course-grid">
          <article className="course-card elementary">
            <div className="course-top"><span>ELEMENTARY</span><b>초등 영어</b></div>
            <h3>소리에서 문장까지,<br />영어의 첫 자신감을 만듭니다</h3>
            <p>알파벳을 아는 데서 멈추지 않고, 스스로 읽고 쓰는 경험으로 이어지도록 단계별로 학습합니다.</p>
            <ul>{elementaryPoints.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul>
            <div className="course-visual letter-visual"><span>A</span><span>B</span><span>C</span><i>read · write · listen</i></div>
          </article>
          <article className="course-card middle">
            <div className="course-top"><span>MIDDLE SCHOOL</span><b>중등 영어</b></div>
            <h3>취약점을 찾아 보완하고,<br />학교 영어에 연결합니다</h3>
            <p>시험 결과만 보는 것이 아니라 어휘·문법·독해 중 막히는 지점을 찾아 다음 시험의 계획을 세웁니다.</p>
            <ul>{middlePoints.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul>
            <div className="course-visual chart-visual"><span /><span /><span /><span /><i>analyze · plan · improve</i></div>
          </article>
        </div>
      </section>

      <section className="values-section" id="values">
        <div className="values-intro">
          <p className="section-label">WHY MIRAEN ENGLISH</p>
          <h2>아이에게는 영어 자신감을,<br />부모님에게는 교육 방향에 대한 확신을</h2>
          <p>벌교미래엔영어학원은 단순히 진도를 나가는 데 그치지 않습니다. 학생의 현재 수준을 확인하고, 필요한 단계부터 배우며, 학습 과정을 꾸준히 점검할 수 있도록 수업과 관리를 연결합니다.</p>
        </div>

        <div className="values-grid">
          <article className="value-card">
            <div className="value-card-top"><span>01</span><em>DIAGNOSIS</em></div>
            <h3>막연한 추측 대신,<br />우리 아이에게 맞는 출발점을 찾습니다</h3>
            <p>N-TELS 레벨 진단과 상담을 통해 듣기·어휘·문법·독해 영역의 현재 수준과 취약점을 살펴봅니다. 이를 바탕으로 학생에게 필요한 교재와 학습 단계를 정하기 때문에, 무엇부터 보완해야 할지 몰라 느꼈던 학부모의 불안을 줄이고 올바른 학습 방향에 대한 <strong>안심과 확신</strong>을 얻을 수 있습니다.</p>
          </article>

          <article className="value-card value-card-blue">
            <div className="value-card-top"><span>02</span><em>CONFIDENCE</em></div>
            <h3>이해할 수 있는 단계부터 시작해<br />영어 자신감을 키웁니다</h3>
            <p>학생의 수준에 맞춰 파닉스·문법·독해·쓰기·회화·듣기 과정을 단계적으로 학습합니다. 지나치게 어려운 수업을 따라가며 좌절하거나, 이미 아는 내용만 반복하지 않도록 필요한 영역부터 시작합니다. 초등학생은 영어의 소리와 글자를 연결해 읽고 쓰는 경험을 쌓고, 중학생은 취약한 개념을 이해해 문제에 적용하면서 <strong>‘나도 할 수 있다’는 자신감</strong>을 키워갈 수 있습니다.</p>
          </article>

          <article className="value-card">
            <div className="value-card-top"><span>03</span><em>ASSESSMENT</em></div>
            <h3>배운 내용을 확인하며<br />학습 공백을 줄입니다</h3>
            <p>Daily Test·Final Test·Word Test를 통해 오늘 배운 내용과 단원별 이해도, 어휘 학습 상태를 확인합니다. 평가는 학생을 압박하거나 비교하기 위한 과정이 아니라, 놓친 내용을 찾고 다시 복습하기 위한 과정입니다. 이해한 부분과 보완할 부분을 구분해 다음 학습으로 연결하면서 학생은 작은 성취를 반복하고 <strong>꾸준히 성장하는 성취감</strong>을 느낄 수 있습니다.</p>
          </article>

          <article className="value-card value-card-warm">
            <div className="value-card-top"><span>04</span><em>HOME REVIEW</em></div>
            <h3>수업에서 배운 내용이<br />가정에서도 이어집니다</h3>
            <p>워크북, 단어 학습, 음원 듣기, 읽기와 영작 활동을 통해 수업에서 배운 내용을 가정에서도 반복할 수 있도록 관리합니다. 학생의 학년과 현재 수준에 맞춰 필요한 복습을 연결하기 때문에, 학부모가 매일 새로운 내용을 직접 가르치거나 무조건 많은 문제를 풀게 할 필요가 줄어듭니다. 아이는 규칙적인 학습 습관을 만들고, 부모님은 반복되는 잔소리와 확인에 대한 <strong>부담과 스트레스를 덜 수 있습니다.</strong></p>
          </article>

          <article className="value-card value-card-soft">
            <div className="value-card-top"><span>05</span><em>BLENDED LEARNING</em></div>
            <h3>교재와 다양한 학습 도구로<br />반복의 지루함을 줄입니다</h3>
            <p>교재 중심 수업에 팝펜, QR, 음원, 온라인 평가를 결합해 배운 내용을 여러 방식으로 반복합니다. 디지털 도구가 수업을 대신하는 것이 아니라, 발음을 듣고 따라 하거나 배운 내용을 다시 확인하도록 돕는 보조 수단으로 활용됩니다. 학생은 자신에게 익숙한 방식으로 학습을 이어가며 <strong>흥미와 집중력을 유지하고, 꾸준히 공부하는 편안함</strong>을 느낄 수 있습니다.</p>
          </article>

          <article className="value-card value-card-dark">
            <div className="value-card-top"><span>06</span><em>FEEDBACK</em></div>
            <h3>아이가 어디까지 성장했는지<br />부모님도 확인할 수 있습니다</h3>
            <p>학부모 상담과 학습 피드백을 통해 학생의 진도와 평가 결과, 잘하고 있는 부분, 보완이 필요한 영역과 다음 학습 계획을 공유합니다. 단순히 학원에 다니고 있다는 사실만 믿고 기다리는 것이 아니라, 자녀가 현재 무엇을 배우고 어떤 방향으로 나아가는지 확인할 수 있습니다. 부모님은 교육 방향에 대한 <strong>신뢰와 안심</strong>을 얻고, 아이의 작은 변화를 함께 응원할 수 있습니다.</p>
          </article>
        </div>

        <div className="values-note">
          <p>학생마다 시작 수준과 학습 속도는 다릅니다. 벌교미래엔영어학원은 모든 학생에게 같은 기간이나 결과를 약속하지 않습니다. 진단과 상담을 통해 현실적인 목표를 정하고, 출석과 과제 수행, 학습 태도와 평가 결과를 살피며 필요한 학습 방향을 조정합니다.</p>
          <strong>자녀의 눈에 보이는 변화는 아이에게는 자신감이 되고, 부모에게는 확신이 됩니다.</strong>
          <a href="#consult">우리 아이에게 맞는 영어 학습 방향 확인하기 <span>→</span></a>
        </div>
      </section>

      <section className="director-section" id="director">
        <div className="director-quote">
          <span className="quote-mark">“</span>
          <blockquote>
            노력한 만큼 결과가 나오지 않는 것은<br />아이의 의지가 부족해서가 아닐 수 있습니다.
            <strong>아이에게 맞는 출발점을 다시 찾는다면<br />작은 변화부터 만들어갈 수 있습니다.</strong>
          </blockquote>
        </div>
        <div className="director-profile">
          <p className="section-label light">DIRECTOR</p>
          <h2><strong>15년 이상</strong><br />학생의 영어 성장을<br />가까이에서 지도했습니다.</h2>
          <div className="profile-list">
            <span>영어 전공</span><span>15년+ 교육 경력</span><span>보성·벌교 지역 교육</span>
          </div>
          <p>학생마다 다른 막힘의 원인을 살피고, 이해 가능한 단계부터 시작해 스스로 해내는 힘을 기르는 교육을 지향합니다.</p>
        </div>
      </section>

      <section className="outcome-section">
        <div className="section-heading centered">
          <p className="section-label">THE CHANGE</p>
          <h2>점수 하나를 넘어,<br />영어를 대하는 태도가 달라지도록</h2>
        </div>
        <div className="outcome-wrap">
          <div className="outcome-card before">
            <span>BEFORE</span>
            <h3>“영어는 해도 안 돼요”</h3>
            <ul><li>무엇부터 공부할지 모르는 답답함</li><li>반복되는 실수와 낮아진 자신감</li><li>방향이 맞는지 확인하기 어려운 불안</li></ul>
          </div>
          <div className="outcome-center"><span>→</span><b>작은 성취가<br />쌓이면</b></div>
          <div className="outcome-card after">
            <span>AFTER</span>
            <h3>“나도 하나씩 할 수 있어요”</h3>
            <ul><li>나에게 맞는 출발점과 구체적인 방향</li><li>스스로 해내며 생기는 영어 자신감</li><li>성장 과정과 다음 계획을 확인하는 안심</li></ul>
          </div>
        </div>
        <p className="disclaimer">※ 학습 결과와 변화의 속도는 학생의 시작 수준, 출석, 과제 수행, 학습 태도 등에 따라 달라질 수 있습니다.</p>
      </section>

      <section className="faq-section">
        <div className="faq-title"><p className="section-label">FAQ</p><h2>상담 전,<br />많이 물어보시는 질문</h2></div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary><span>0{index + 1}</span>{faq.question}<i>+</i></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <SocialSection />

      <section className="consult-section" id="consult">
        <div className="consult-inner">
          <div className="consult-copy">
            <p className="section-label light">START WITH A CONVERSATION</p>
            <h2>우리 아이 영어 고민,<br />상담예약부터 시작하세요.</h2>
            <p>현재 학습 경험과 바라는 방향을 남겨주시면 아이에게 필요한 출발점과 학습 방향을 더 구체적으로 확인할 수 있습니다.</p>
            <div className="consult-checklist">
              <div><span>중학생</span><b>최근 시험지 또는 성적 자료</b></div>
              <div><span>초등학생</span><b>현재 읽을 수 있는 단어·문장 수준</b></div>
            </div>
            <AcademyContactCard />
            <small>벌교미래엔영어학원 · 초등·중등 영어교육</small>
          </div>
          <ConsultationForm />
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">M</span><span>벌교미래엔<small>영어학원</small></span></a>
        <p>아이에게는 영어 자신감을, 부모님에게는 교육 방향에 대한 확신을.</p>
        <FooterContact />
      </footer>

      <a className="mobile-cta" href="#consult">학생 상담예약</a>
      <CallbackWidget />
    </main>
  );
}
