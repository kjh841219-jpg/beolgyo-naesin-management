export type ScoreStory = {
  school: string;
  grade: string;
  student: string;
  before: number;
  after: number;
  gain: number;
};

export type LiteracyCard = {
  title: string;
  eyebrow: string;
  description: string;
};

export type AcademyEvent = {
  date: string;
  endDate?: string;
  title: string;
  category: string;
};

export type LandingContent = {
  academyName: string;
  academyAddress: string;
  academyLocationNote: string;
  academyPhone: string;
  notificationEmail: string;
  heroEyebrow: string;
  heroTitleBefore: string;
  heroTitleAccent: string;
  heroTitleAfter: string;
  heroDescription: string;
  blogUrl: string;
  instagramUrl: string;
  socialTitle: string;
  socialDescription: string;
  scoreTitle: string;
  scoreHeadline: string;
  scoreSummary: string;
  scoreCta: string;
  scoreStories: ScoreStory[];
  literacyTitle: string;
  literacyIntro: string;
  literacyStatement: string;
  literacyBridge: string;
  literacyCards: LiteracyCard[];
  literacyCta: string;
  literacyCtaSecondary: string;
  dailyResultMessage: string;
  dailyKakaoMessage: string;
  levelResultMessage: string;
  levelKakaoMessage: string;
  academyEvents: AcademyEvent[];
};

export const defaultLandingContent: LandingContent = {
  academyName: "벌교미래엔영어학원",
  academyAddress: "전남 보성군 벌교읍 태백산맥길 20-2 1층",
  academyLocationNote: "보성여관 맞은편",
  academyPhone: "010.4668.4859",
  notificationEmail: "jinsim84@kakao.com",
  heroEyebrow: "초·중등 영어 학습 상담 진행 중",
  heroTitleBefore: "단순히 오래 하는\n영어가 아닌",
  heroTitleAccent: "스스로 해내는",
  heroTitleAfter: "진짜 영어 공부",
  heroDescription: "현재 수준을 정확히 살피고 필요한 단계부터 시작합니다.\n아이에게는 영어 자신감을, 부모님에게는 교육 방향에 대한 확신을 만들어갑니다.",
  blogUrl: "https://blog.naver.com/jinsim84_",
  instagramUrl: "https://www.instagram.com/beolgyo_miraen/",
  socialTitle: "학원의 오늘과 아이들의 성장 이야기",
  socialDescription: "QR을 휴대폰 카메라로 스캔하거나 아래 카드를 눌러 블로그와 인스타그램을 바로 방문해 보세요.",
  scoreTitle: "벌교미래엔영어 중등부 성적",
  scoreHeadline: "최대 40점 상승, 성적 반전이 시작되는 곳",
  scoreSummary: "학생별 취약 영역을 찾고, 필요한 개념부터 다시 연결한 결과입니다.",
  scoreCta: "우리 아이 상담예약",
  scoreStories: [
    { school: "벌교중", grade: "3학년", student: "박OO", before: 50, after: 90, gain: 40 },
    { school: "벌교여중", grade: "3학년", student: "김OO", before: 60, after: 96, gain: 36 },
    { school: "벌교여중", grade: "3학년", student: "김OO", before: 75, after: 97, gain: 22 },
    { school: "벌교여중", grade: "3학년", student: "김OO", before: 75, after: 95, gain: 20 },
  ],
  literacyTitle: "단어를 아는 아이에서, 글의 뜻을 읽는 아이로",
  literacyIntro: "단어는 많이 외웠는데 긴 지문 앞에서 멈춘다면, 지금 필요한 것은 더 많은 암기가 아니라 글의 흐름과 맥락을 이해하는 영어 문해력입니다.",
  literacyStatement: "읽고, 생각하고, 스스로 적용하는 힘",
  literacyBridge: "초등 기초부터 중·고등 내신과 수능까지",
  literacyCards: [
    { title: "문장 속에서 익히는 진짜 어휘·문법", eyebrow: "CONTEXT WORD LINK", description: "단어 하나만 외우는 대신 문장과 지문 속에서 단어의 뜻과 문법의 역할을 함께 이해합니다. 배운 표현을 실제 맥락에서 반복해 오래 기억되는 영어를 만듭니다." },
    { title: "레벨에 맞춰 쌓아가는 정독·다독", eyebrow: "LEVEL READING ROUTE", description: "학생의 현재 수준에 맞는 교재와 단계별 시스템을 활용합니다. 한 문장씩 정확히 읽는 정독에서 다양한 글을 접하는 다독까지 읽기의 깊이와 폭을 함께 키웁니다." },
    { title: "질문으로 키우는 스스로 읽는 힘", eyebrow: "QUESTION COACHING", description: "1:1 밀착 코칭을 통해 ‘무슨 뜻일까?’에서 멈추지 않고 ‘왜 그렇게 말했을까?’까지 생각하게 합니다. 글의 근거와 의도를 스스로 찾아가는 학습입니다." },
    { title: "문해력에서 실전 응용력까지", eyebrow: "EXAM BRIDGE", description: "글의 구조를 파악하고 핵심 내용을 요약하는 힘을 서술형, 추론, 빈칸, 내신·수능 지문 풀이로 연결해 실전에서 쓰이는 영어를 완성합니다." },
  ],
  literacyCta: "무료 레벨테스트 신청하기",
  literacyCtaSecondary: "문해력 상담 예약하기",
  dailyResultMessage: "[벌교미래엔영어] {학생명} DAILY {점수}/{총점}점({단계}). 오늘도 수고했습니다!",
  dailyKakaoMessage: "오늘의 영어 습관 완료! {학생명} 학생이 {단계} DAILY 미니테스트에서 {점수}/{총점}점을 받았습니다. {링크}",
  levelResultMessage: "[벌교미래엔영어] 안녕하세요, {학생명} 학생의 무료 레벨테스트 결과를 안내드립니다. 응시 과정은 {단계}, 결과는 {점수}/{총점}점입니다. {피드백} 자세한 평가지 확인 및 상담: {링크}",
  levelKakaoMessage: "[벌교미래엔영어]\n{학생명} 학생의 무료 레벨테스트가 완료되었습니다.\n\n응시 과정: {단계}\n결과: {점수}/{총점}점\n\n{피드백}\n\n아이의 현재 강점과 보완 방향을 평가지에서 확인해 주세요. {링크}",
  academyEvents: [],
};

const text = (value: unknown, fallback: string, max = 1000) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;

const url = (value: unknown, fallback: string) => {
  const candidate = text(value, fallback, 300);
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
};

export function sanitizeLandingContent(value: unknown): LandingContent {
  if (!value || typeof value !== "object") return defaultLandingContent;
  const input = value as Partial<LandingContent>;
  const stories = Array.isArray(input.scoreStories) ? input.scoreStories : defaultLandingContent.scoreStories;
  const cards = Array.isArray(input.literacyCards) ? input.literacyCards : defaultLandingContent.literacyCards;
  const events = Array.isArray(input.academyEvents) ? input.academyEvents : defaultLandingContent.academyEvents;

  return {
    academyName: text(input.academyName, defaultLandingContent.academyName, 80),
    academyAddress: text(input.academyAddress, defaultLandingContent.academyAddress, 160),
    academyLocationNote: text(input.academyLocationNote, defaultLandingContent.academyLocationNote, 80),
    academyPhone: text(input.academyPhone, defaultLandingContent.academyPhone, 30),
    notificationEmail: text(input.notificationEmail, defaultLandingContent.notificationEmail, 120),
    heroEyebrow: text(input.heroEyebrow, defaultLandingContent.heroEyebrow, 100),
    heroTitleBefore: text(input.heroTitleBefore, defaultLandingContent.heroTitleBefore, 140),
    heroTitleAccent: text(input.heroTitleAccent, defaultLandingContent.heroTitleAccent, 80),
    heroTitleAfter: text(input.heroTitleAfter, defaultLandingContent.heroTitleAfter, 80),
    heroDescription: text(input.heroDescription, defaultLandingContent.heroDescription, 500),
    blogUrl: url(input.blogUrl, defaultLandingContent.blogUrl),
    instagramUrl: url(input.instagramUrl, defaultLandingContent.instagramUrl),
    socialTitle: text(input.socialTitle, defaultLandingContent.socialTitle, 140),
    socialDescription: text(input.socialDescription, defaultLandingContent.socialDescription, 500),
    scoreTitle: text(input.scoreTitle, defaultLandingContent.scoreTitle, 100),
    scoreHeadline: text(input.scoreHeadline, defaultLandingContent.scoreHeadline, 160),
    scoreSummary: text(input.scoreSummary, defaultLandingContent.scoreSummary),
    scoreCta: text(input.scoreCta, defaultLandingContent.scoreCta, 80),
    scoreStories: stories.slice(0, 4).map((story, index) => {
      const fallback = defaultLandingContent.scoreStories[index] ?? defaultLandingContent.scoreStories[0];
      const item = story && typeof story === "object" ? story as Partial<ScoreStory> : {};
      const before = Number.isFinite(Number(item.before)) ? Math.max(0, Math.min(100, Number(item.before))) : fallback.before;
      const after = Number.isFinite(Number(item.after)) ? Math.max(0, Math.min(100, Number(item.after))) : fallback.after;
      return { school: text(item.school, fallback.school, 30), grade: text(item.grade, fallback.grade, 20), student: text(item.student, fallback.student, 20), before, after, gain: after - before };
    }),
    literacyTitle: text(input.literacyTitle, defaultLandingContent.literacyTitle, 180),
    literacyIntro: text(input.literacyIntro, defaultLandingContent.literacyIntro),
    literacyStatement: text(input.literacyStatement, defaultLandingContent.literacyStatement, 100),
    literacyBridge: text(input.literacyBridge, defaultLandingContent.literacyBridge, 100),
    literacyCards: cards.slice(0, 4).map((card, index) => {
      const fallback = defaultLandingContent.literacyCards[index] ?? defaultLandingContent.literacyCards[0];
      const item = card && typeof card === "object" ? card as Partial<LiteracyCard> : {};
      return { title: text(item.title, fallback.title, 120), eyebrow: text(item.eyebrow, fallback.eyebrow, 50), description: text(item.description, fallback.description) };
    }),
    literacyCta: text(input.literacyCta, defaultLandingContent.literacyCta, 80),
    literacyCtaSecondary: text(input.literacyCtaSecondary, defaultLandingContent.literacyCtaSecondary, 80),
    dailyResultMessage: text(input.dailyResultMessage, defaultLandingContent.dailyResultMessage, 600),
    dailyKakaoMessage: text(input.dailyKakaoMessage, defaultLandingContent.dailyKakaoMessage, 600),
    levelResultMessage: text(input.levelResultMessage, defaultLandingContent.levelResultMessage, 900),
    levelKakaoMessage: text(input.levelKakaoMessage, defaultLandingContent.levelKakaoMessage, 900),
    academyEvents: events.slice(0, 60).flatMap((event) => {
      if (!event || typeof event !== "object") return [];
      const item = event as Partial<AcademyEvent>;
      const date = typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : "";
      const requestedEndDate = typeof item.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.endDate) ? item.endDate : "";
      const endDate = requestedEndDate && requestedEndDate >= date ? requestedEndDate : date;
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 80) : "";
      if (!date || !title) return [];
      return [{ date, endDate, title, category: text(item.category, "학원 일정", 30) }];
    }).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
