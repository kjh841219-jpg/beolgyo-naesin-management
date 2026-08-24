const bookSeries = [
  {
    title: "Phonics 시리즈",
    tag: "영어 첫걸음",
    image: "/miraen/phonics.png",
    alt: "미래엔영어 Phonics 시리즈 교재",
    description: "알파벳의 소리와 모양부터 자음·모음 조합, Sight Words까지 연결해 자연스러운 읽기의 기초를 만듭니다.",
    skills: ["소리와 글자 연결", "문장 읽기 기초"],
  },
  {
    title: "Story Town 시리즈",
    tag: "문형·말하기",
    image: "/miraen/story-town.png",
    alt: "미래엔영어 Story Town 시리즈 교재",
    description: "친숙한 이야기로 필수 문형을 익히고, 읽기와 말하기를 함께 훈련해 표현력과 영어 문해력을 키웁니다.",
    skills: ["필수 문형", "읽기·말하기"],
  },
  {
    title: "Reading Town 시리즈",
    tag: "영어 문해력",
    image: "/miraen/reading-town.png",
    alt: "미래엔영어 Reading Town 시리즈 교재",
    description: "교과 융합 지문과 체계적인 읽기 전략으로 어휘·배경지식을 넓히고 직독직해와 속독속해를 훈련합니다.",
    skills: ["전략적 독해", "서술형·수능 기반"],
  },
  {
    title: "중학내신 시리즈",
    tag: "학교 시험 대비",
    image: "/miraen/middle-school.png",
    alt: "미래엔영어 중학내신 시리즈 교재",
    description: "중학 문법 개념부터 학교 진도, 듣기평가와 모의고사까지 연결해 내신에 필요한 실전 적용력을 완성합니다.",
    skills: ["문법 개념", "내신 실전"],
  },
];

export function CurriculumSection() {
  return (
    <section className="miraen-curriculum" id="curriculum">
      <div className="curriculum-orbit orbit-one" aria-hidden="true" />
      <div className="curriculum-orbit orbit-two" aria-hidden="true" />

      <div className="curriculum-head">
        <div>
          <p className="section-label">MIRAEN ENGLISH CURRICULUM</p>
          <h2>
            처음 파닉스부터<br />
            <strong>중학 내신·수능 기반</strong>까지
          </h2>
        </div>
        <div className="curriculum-intro">
          <span>100+ LEVEL ROADMAP</span>
          <p>
            같은 학년이라도 출발점은 다릅니다. 진단 결과에 따라 필요한 영역과 난이도를 조합해,
            기초 보완부터 심화 도전까지 학생별 학습 경로를 설계합니다.
          </p>
          <div className="curriculum-path" aria-label="학습 단계">
            <b>PHONICS</b><i>→</i><b>STORY</b><i>→</i><b>READING</b><i>→</i><b>내신</b>
          </div>
        </div>
      </div>

      <div className="all-books-showcase">
        <div className="all-books-copy">
          <span>1등 교과서 미래엔의 교육 콘텐츠</span>
          <h3>영역별·수준별로 촘촘하게 설계된<br /><strong>100권 이상의 교재</strong></h3>
          <p>교재를 정해 놓고 학생을 맞추는 것이 아니라, 학생의 현재 실력과 목표에 맞춰 필요한 교재를 선택합니다.</p>
        </div>
        <div className="all-books-image">
          <img src="/miraen/all-books.png" alt="미래엔영어의 다양한 영역별 수준별 교재" loading="lazy" />
        </div>
      </div>

      <div className="book-series-grid">
        {bookSeries.map((book, index) => (
          <article className="book-series-card" key={book.title}>
            <div className="book-card-visual">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <img src={book.image} alt={book.alt} loading="lazy" />
            </div>
            <div className="book-card-copy">
              <em>{book.tag}</em>
              <h3>{book.title}</h3>
              <p>{book.description}</p>
              <div>{book.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="curriculum-learner-grid">
        <article><span>01</span><h3>기초 보완형</h3><p>놓친 소리·어휘·문법을 찾아 이해할 수 있는 단계부터 다시 연결합니다.</p></article>
        <article><span>02</span><h3>표준 성장형</h3><p>학년과 수준에 맞는 정규 과정으로 읽기·쓰기·듣기·말하기의 균형을 쌓습니다.</p></article>
        <article><span>03</span><h3>심화 도전형</h3><p>높은 난도의 독해와 문법, 서술형 문제까지 확장해 상위 과정에 대비합니다.</p></article>
      </div>

      <div className="curriculum-cta">
        <div><span>우리 아이는 어디서 시작해야 할까요?</span><strong>무료 레벨테스트로 맞춤 커리큘럼을 확인해 보세요.</strong></div>
        <a className="button button-dark" href="#level-test">무료 레벨테스트 <span>→</span></a>
        <a className="button button-light" href="#consult">상담예약</a>
      </div>

      <p className="curriculum-source">교재 및 프로그램 정보 출처: <a href="https://www.miraenenglish.co.kr/Home2/System/Curriculum.html" target="_blank" rel="noreferrer">미래엔영어 공식 커리큘럼</a></p>
    </section>
  );
}
