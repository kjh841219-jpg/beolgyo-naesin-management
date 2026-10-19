"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLandingContent } from "./useLandingContent";
import { DAILY_MINI_TEST_AUTHORING_PROMPT } from "./daily-mini-test-prompt";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: {
          objectType: "text";
          text: string;
          link: { mobileWebUrl: string; webUrl: string };
          buttonTitle: string;
        }) => void;
      };
    };
  }
}

type BankLevelId = "elementary-low" | "elementary-mid" | "elementary-high" | "middle-1" | "middle-2" | "middle-3" | "high";
type LevelId = Exclude<BankLevelId, "high"> | "high-intro" | "high-basic" | "high-advanced";
type Question = { skill: "듣기" | "단어" | "문법" | "리딩"; prompt: string; audio?: string; passage?: string; options: string[]; answer: number };
type DailySet = { title: string; questions: Question[] };

const audioSources: Record<string, string> = {
  "I eat an apple.": "/daily-audio/listening-01.mp3",
  "Open your book, please.": "/daily-audio/listening-02.mp3",
  "Minsu plays soccer after school.": "/daily-audio/listening-03.mp3",
  "I drink water after exercise.": "/daily-audio/listening-04.mp3",
  "Please bring a photo for our class project tomorrow.": "/daily-audio/listening-05.mp3",
  "It will rain tomorrow, so we will visit the museum instead of the park.": "/daily-audio/listening-06.mp3",
  "I enjoy taking pictures, so I want to join the photography club.": "/daily-audio/listening-07.mp3",
  "The weekend market opens at ten in the morning.": "/daily-audio/listening-08.mp3",
  "Let's turn off the lights when we leave the classroom.": "/daily-audio/listening-09.mp3",
  "This app reminds me when it is time to take my medicine.": "/daily-audio/listening-10.mp3",
  "All performers must meet in the gym thirty minutes before the festival begins.": "/daily-audio/listening-11.mp3",
  "I put my phone in another room while I was studying.": "/daily-audio/listening-12.mp3",
  "Motivation may get you started, but a consistent routine is what keeps you moving forward.": "/daily-audio/listening-13.mp3",
  "Before sharing an online claim, check who created it and whether reliable evidence supports it.": "/daily-audio/listening-14.mp3",
  "The cat is under the table.": "/daily-audio/listening-15.mp3",
  "Can I have some orange juice, please?": "/daily-audio/listening-16.mp3",
  "Our class meeting starts at three thirty.": "/daily-audio/listening-17.mp3",
  "Could you show me the way to the nearest subway station?": "/daily-audio/listening-18.mp3",
  "Let's meet in front of the library at two.": "/daily-audio/listening-19.mp3",
  "Due to heavy rain, today's baseball game has been canceled.": "/daily-audio/listening-20.mp3",
  "Productive feedback focuses on specific actions that can be improved rather than judging the person.": "/daily-audio/listening-21.mp3",
  "Good morning! Please put your bag on the chair.": "/daily-audio/listening-22.mp3",
  "My sister has a small white rabbit.": "/daily-audio/listening-23.mp3",
  "We eat lunch at twelve thirty.": "/daily-audio/listening-24.mp3",
  "Please wash your hands before dinner.": "/daily-audio/listening-25.mp3",
  "The school bus will arrive five minutes late.": "/daily-audio/listening-26.mp3",
  "Judy chose the blue notebook because it was cheaper.": "/daily-audio/listening-27.mp3",
  "The music club meets every Wednesday after school.": "/daily-audio/listening-28.mp3",
  "I could not go hiking because I had a cold.": "/daily-audio/listening-29.mp3",
  "Students can borrow up to three books for two weeks.": "/daily-audio/listening-30.mp3",
  "Remember to submit your science report by Friday.": "/daily-audio/listening-31.mp3",
  "The train was delayed because of the heavy snow.": "/daily-audio/listening-32.mp3",
  "Using a reusable cup can reduce unnecessary waste.": "/daily-audio/listening-33.mp3",
  "The speaker recommends taking short breaks during long study sessions.": "/daily-audio/listening-34.mp3",
  "Although the first plan failed, the team learned how to improve it.": "/daily-audio/listening-35.mp3",
  "The lecture has been moved from Room 201 to the main hall.": "/daily-audio/listening-36.mp3",
  "The girl decided to volunteer after learning about the local shelter.": "/daily-audio/listening-37.mp3",
  "The experiment should be repeated to make sure the result is reliable.": "/daily-audio/listening-38.mp3",
  "The museum offers a guided tour in English every Saturday afternoon.": "/daily-audio/listening-39.mp3",
  "The author argues that failure can provide valuable information for future decisions.": "/daily-audio/listening-40.mp3",
  "Technological convenience should be evaluated alongside its social and environmental effects.": "/daily-audio/listening-41.mp3",
  "A persuasive argument acknowledges opposing views before presenting stronger evidence.": "/daily-audio/listening-42.mp3",
  "The student missed the bus, so she walked to school.": "/daily-audio/listening-43.mp3",
  "Please bring your worksheet to the next English class.": "/daily-audio/listening-44.mp3",
  "The library closes earlier than usual during the vacation.": "/daily-audio/listening-45.mp3",
  "The survey suggests that regular exercise improves students' concentration.": "/daily-audio/listening-46.mp3",
  "The speaker changed her opinion after examining additional evidence.": "/daily-audio/listening-47.mp3",
  "The new policy aims to reduce waste without limiting consumer choice.": "/daily-audio/listening-48.mp3",
  "The apparent simplicity of the solution may conceal several long-term risks.": "/daily-audio/listening-49.mp3",
  "Scientific progress often depends on questioning assumptions that were once widely accepted.": "/daily-audio/listening-50.mp3",
  "The speaker implies that efficiency alone cannot justify a decision with irreversible consequences.": "/daily-audio/listening-51.mp3",
  "Can I have some milk, please?": "/daily-audio/listening-52.mp3",
  "I will visit my grandmother after school.": "/daily-audio/listening-53.mp3",
  "I cannot find my red pencil case.": "/daily-audio/listening-54.mp3",
  "I will be late because the bus is stuck in traffic.": "/daily-audio/listening-55.mp3",
  "The art class will begin at two instead of one thirty.": "/daily-audio/listening-56.mp3",
  "Please upload your presentation slides before Thursday evening.": "/daily-audio/listening-57.mp3",
  "A surprising result should be investigated carefully rather than dismissed as an error.": "/daily-audio/listening-58.mp3",
};

const levels: Array<{ id: LevelId; label: string; description: string }> = [
  { id: "elementary-low", label: "초등 저학년", description: "소리·기초 단어·짧은 문장" },
  { id: "elementary-mid", label: "초등 중학년", description: "생활 어휘·기본문장 읽기" },
  { id: "elementary-high", label: "초등 고학년", description: "문장 이해·기초 독해" },
  { id: "middle-1", label: "중학교 1학년", description: "기본 문법과 핵심 내용" },
  { id: "middle-2", label: "중학교 2학년", description: "문맥 어휘와 세부 내용" },
  { id: "middle-3", label: "중학교 3학년", description: "내신형 듣기·독해" },
  { id: "high-intro", label: "고등 입문", description: "고등 기초어휘·문장 구조" },
  { id: "high-basic", label: "고등 기본", description: "내신·수능 기본 유형" },
  { id: "high-advanced", label: "고등 심화", description: "수능 고난도·추론 유형" },
];

const dailySets: Record<BankLevelId, DailySet[]> = {
  "elementary-low": [
    { title: "My Morning", questions: [
      { skill: "듣기", prompt: "들은 문장의 뜻을 고르세요.", audio: "I eat an apple.", options: ["나는 사과를 먹어요.", "나는 우유를 마셔요.", "나는 학교에 가요.", "나는 책을 읽어요."], answer: 0 },
      { skill: "단어", prompt: "‘강아지’에 해당하는 영어 단어는?", options: ["dog", "book", "desk", "rain"], answer: 0 },
      { skill: "리딩", prompt: "Who is happy?", passage: "Tom has a new ball. He is happy.", options: ["Tom", "Mom", "Jane", "A teacher"], answer: 0 },
    ]},
    { title: "At School", questions: [
      { skill: "듣기", prompt: "들은 문장의 뜻을 고르세요.", audio: "Open your book, please.", options: ["책을 펴세요.", "문을 닫으세요.", "앉으세요.", "연필을 주세요."], answer: 0 },
      { skill: "단어", prompt: "‘파란색’에 해당하는 영어 단어는?", options: ["blue", "big", "bird", "blackboard"], answer: 0 },
      { skill: "리딩", prompt: "What color is the bag?", passage: "This is Mina's bag. It is red.", options: ["Red", "Blue", "Green", "Yellow"], answer: 0 },
    ]},
  ],
  "elementary-mid": [
    { title: "After School", questions: [
      { skill: "듣기", prompt: "민수가 방과 후에 하는 일을 고르세요.", audio: "Minsu plays soccer after school.", options: ["축구를 한다.", "피아노를 친다.", "책을 읽는다.", "수영을 한다."], answer: 0 },
      { skill: "단어", prompt: "‘도서관’에 해당하는 영어 단어는?", options: ["library", "hospital", "station", "restaurant"], answer: 0 },
      { skill: "리딩", prompt: "When does Amy visit her grandma?", passage: "Amy visits her grandma every Sunday. They cook lunch together.", options: ["Every Sunday", "Every Monday", "On Friday", "In winter"], answer: 0 },
    ]},
    { title: "Healthy Day", questions: [
      { skill: "듣기", prompt: "들은 내용과 일치하는 것을 고르세요.", audio: "I drink water after exercise.", options: ["운동 후 물을 마신다.", "운동 전 잠을 잔다.", "아침에 우유를 산다.", "저녁에 달린다."], answer: 0 },
      { skill: "단어", prompt: "‘건강한’의 뜻을 가진 단어는?", options: ["healthy", "heavy", "hungry", "honest"], answer: 0 },
      { skill: "리딩", prompt: "Why does Jina go to bed early?", passage: "Jina goes to bed at nine because she wants to get enough sleep.", options: ["To get enough sleep", "To watch TV", "To study math", "To call a friend"], answer: 0 },
    ]},
  ],
  "elementary-high": [
    { title: "A Small Project", questions: [
      { skill: "듣기", prompt: "발표 준비를 위해 필요한 것을 고르세요.", audio: "Please bring a photo for our class project tomorrow.", options: ["사진", "운동화", "도시락", "우산"], answer: 0 },
      { skill: "단어", prompt: "‘prepare’와 가장 가까운 뜻은?", options: ["준비하다", "발견하다", "비교하다", "기억하다"], answer: 0 },
      { skill: "리딩", prompt: "What did the students do first?", passage: "The students wanted a clean classroom. First, they picked up paper. Then, they cleaned the desks.", options: ["They picked up paper.", "They opened windows.", "They moved desks.", "They drew pictures."], answer: 0 },
    ]},
    { title: "Weather Plan", questions: [
      { skill: "듣기", prompt: "내일 계획이 바뀐 이유를 고르세요.", audio: "It will rain tomorrow, so we will visit the museum instead of the park.", options: ["비가 올 예정이라서", "박물관이 문을 닫아서", "친구가 아파서", "숙제가 많아서"], answer: 0 },
      { skill: "단어", prompt: "‘instead of’의 뜻은?", options: ["~ 대신에", "~ 때문에", "~ 앞에서", "~와 함께"], answer: 0 },
      { skill: "리딩", prompt: "What should visitors bring?", passage: "The science museum is cold inside. Visitors should bring a light jacket.", options: ["A light jacket", "A lunch box", "A camera", "An umbrella"], answer: 0 },
    ]},
  ],
  "middle-1": [
    { title: "New Club", questions: [
      { skill: "듣기", prompt: "화자가 가입하려는 동아리는?", audio: "I enjoy taking pictures, so I want to join the photography club.", options: ["사진 동아리", "요리 동아리", "축구 동아리", "과학 동아리"], answer: 0 },
      { skill: "단어", prompt: "‘join’의 문맥상 뜻은?", options: ["가입하다", "떠나다", "고치다", "나누다"], answer: 0 },
      { skill: "리딩", prompt: "Why was Kevin late?", passage: "Kevin missed the bus because he left home late. He walked to school and arrived at 9:10.", options: ["He left home late.", "He lost his bag.", "The school moved.", "He helped a friend."], answer: 0 },
    ]},
    { title: "Weekend Market", questions: [
      { skill: "듣기", prompt: "시장이 열리는 시간을 고르세요.", audio: "The weekend market opens at ten in the morning.", options: ["오전 10시", "오전 9시", "오후 1시", "오후 5시"], answer: 0 },
      { skill: "단어", prompt: "‘local’의 뜻으로 알맞은 것은?", options: ["지역의", "비싼", "유명한", "조용한"], answer: 0 },
      { skill: "리딩", prompt: "What can people buy at the market?", passage: "Farmers sell fresh vegetables and fruit at the weekend market.", options: ["Fresh vegetables and fruit", "School uniforms", "Used computers", "Train tickets"], answer: 0 },
    ]},
  ],
  "middle-2": [
    { title: "Saving Energy", questions: [
      { skill: "듣기", prompt: "화자가 제안하는 행동은?", audio: "Let's turn off the lights when we leave the classroom.", options: ["교실을 나갈 때 불을 끈다.", "창문을 모두 연다.", "컴퓨터를 새로 산다.", "수업을 일찍 끝낸다."], answer: 0 },
      { skill: "단어", prompt: "‘reduce’와 가장 가까운 뜻은?", options: ["줄이다", "발생시키다", "보호하다", "교환하다"], answer: 0 },
      { skill: "리딩", prompt: "What is the main idea?", passage: "Small actions can save energy. Turning off unused lights and unplugging chargers both make a difference.", options: ["Small habits help save energy.", "Chargers are difficult to use.", "Lights should stay on.", "Energy is always free."], answer: 0 },
    ]},
    { title: "A Helpful App", questions: [
      { skill: "듣기", prompt: "앱의 기능을 고르세요.", audio: "This app reminds me when it is time to take my medicine.", options: ["약 먹을 시간을 알려준다.", "사진을 편집한다.", "음식을 주문한다.", "날씨를 기록한다."], answer: 0 },
      { skill: "단어", prompt: "‘remind’의 뜻은?", options: ["상기시키다", "삭제하다", "선택하다", "거절하다"], answer: 0 },
      { skill: "리딩", prompt: "Why did Hana download the app?", passage: "Hana often forgot her study plan. She downloaded an app that sends an alert before each study session.", options: ["To remember her study plan", "To play games", "To meet new friends", "To buy a phone"], answer: 0 },
    ]},
  ],
  "middle-3": [
    { title: "School Festival", questions: [
      { skill: "듣기", prompt: "공연자들이 모여야 하는 장소는?", audio: "All performers must meet in the gym thirty minutes before the festival begins.", options: ["체육관", "도서관", "교문", "음악실"], answer: 0 },
      { skill: "단어", prompt: "‘performer’의 뜻은?", options: ["공연자", "관람객", "안내원", "기자"], answer: 0 },
      { skill: "리딩", prompt: "Why should students arrive early?", passage: "The festival begins at noon, but performers must check their equipment and rehearse before the show.", options: ["To prepare for the show", "To eat lunch", "To clean the library", "To buy tickets"], answer: 0 },
    ]},
    { title: "Better Concentration", questions: [
      { skill: "듣기", prompt: "화자가 집중하기 위해 한 행동은?", audio: "I put my phone in another room while I was studying.", options: ["휴대전화를 다른 방에 두었다.", "음악을 크게 틀었다.", "친구에게 전화했다.", "공부 장소를 떠났다."], answer: 0 },
      { skill: "단어", prompt: "‘concentrate’와 가장 가까운 뜻은?", options: ["집중하다", "후회하다", "반복하다", "상상하다"], answer: 0 },
      { skill: "리딩", prompt: "What does the passage suggest?", passage: "Short breaks can help students stay focused. However, checking social media during every break may make it harder to return to work.", options: ["Breaks should be used wisely.", "Students should never rest.", "Social media improves all study.", "Long breaks are always best."], answer: 0 },
    ]},
  ],
  high: [
    { title: "The Power of Habit", questions: [
      { skill: "듣기", prompt: "화자의 핵심 의견을 고르세요.", audio: "Motivation may get you started, but a consistent routine is what keeps you moving forward.", options: ["꾸준한 습관이 지속적인 발전을 만든다.", "동기는 항상 충분하다.", "계획은 필요하지 않다.", "빠른 결과가 가장 중요하다."], answer: 0 },
      { skill: "단어", prompt: "‘consistent’의 문맥상 의미는?", options: ["일관된", "우연한", "복잡한", "즉각적인"], answer: 0 },
      { skill: "리딩", prompt: "What is the best title for the passage?", passage: "People often wait for inspiration before beginning difficult work. Yet action itself can create motivation. Starting with a small task lowers resistance and makes the next step easier.", options: ["Action Can Create Motivation", "Why Difficult Work Is Useless", "The Danger of Small Tasks", "Waiting for Perfect Inspiration"], answer: 0 },
    ]},
    { title: "Critical Reading", questions: [
      { skill: "듣기", prompt: "정보를 판단할 때 필요한 태도는?", audio: "Before sharing an online claim, check who created it and whether reliable evidence supports it.", options: ["출처와 근거를 확인한다.", "제목만 읽고 공유한다.", "가장 인기 있는 의견을 따른다.", "모든 온라인 정보를 거부한다."], answer: 0 },
      { skill: "단어", prompt: "‘reliable’과 가장 가까운 뜻은?", options: ["신뢰할 수 있는", "논쟁적인", "일시적인", "창의적인"], answer: 0 },
      { skill: "리딩", prompt: "What can be inferred from the passage?", passage: "A familiar statement can feel true simply because we have heard it repeatedly. Therefore, familiarity should not be mistaken for evidence.", options: ["Repeated claims still require evidence.", "Familiar ideas are always correct.", "Evidence becomes unnecessary over time.", "Unknown claims are always false."], answer: 0 },
    ]},
  ],
};

const extraQuestions: Record<BankLevelId, Question[]> = {
  "elementary-low": [
    { skill: "듣기", prompt: "들은 문장의 뜻을 고르세요.", audio: "The cat is under the table.", options: ["고양이가 탁자 아래에 있어요.", "개가 의자 위에 있어요.", "새가 나무에 있어요.", "책이 가방 안에 있어요."], answer: 0 },
    { skill: "단어", prompt: "‘학교’에 해당하는 영어 단어는?", options: ["school", "house", "garden", "market"], answer: 0 },
    { skill: "리딩", prompt: "What does Ben have?", passage: "Ben has a yellow kite. He flies it in the park.", options: ["A yellow kite", "A blue ball", "A red bike", "A green bag"], answer: 0 },
  ],
  "elementary-mid": [
    { skill: "듣기", prompt: "화자가 원하는 것을 고르세요.", audio: "Can I have some orange juice, please?", options: ["오렌지 주스", "사과", "물", "빵"], answer: 0 },
    { skill: "단어", prompt: "‘조심스러운’의 뜻을 가진 단어는?", options: ["careful", "famous", "different", "early"], answer: 0 },
    { skill: "리딩", prompt: "Where does Leo read?", passage: "Leo likes quiet places. He reads books in the library after lunch.", options: ["In the library", "In the gym", "At the station", "At home"], answer: 0 },
  ],
  "elementary-high": [
    { skill: "듣기", prompt: "회의가 시작되는 시간을 고르세요.", audio: "Our class meeting starts at three thirty.", options: ["3시 30분", "2시 30분", "3시", "4시"], answer: 0 },
    { skill: "단어", prompt: "‘borrow’의 뜻은?", options: ["빌리다", "돌려주다", "모으다", "잃어버리다"], answer: 0 },
    { skill: "리딩", prompt: "Why did Sue take a bus?", passage: "Sue usually walks to school, but it was raining heavily today. She took a bus.", options: ["Because it was raining heavily", "Because she woke up early", "Because the bus was free", "Because she met a teacher"], answer: 0 },
  ],
  "middle-1": [
    { skill: "듣기", prompt: "화자가 요청한 것을 고르세요.", audio: "Could you show me the way to the nearest subway station?", options: ["지하철역 가는 길", "버스 시간표", "식당 메뉴", "박물관 표"], answer: 0 },
    { skill: "단어", prompt: "‘available’의 뜻으로 알맞은 것은?", options: ["이용 가능한", "위험한", "전통적인", "반드시 필요한"], answer: 0 },
    { skill: "리딩", prompt: "What will Mia do next?", passage: "Mia finished her homework. She packed her swimsuit because she has a swimming lesson at four.", options: ["Go to a swimming lesson", "Start her homework", "Buy a new desk", "Visit a museum"], answer: 0 },
  ],
  "middle-2": [
    { skill: "듣기", prompt: "두 사람이 만날 장소는?", audio: "Let's meet in front of the library at two.", options: ["도서관 앞", "교실 안", "체육관 옆", "버스 정류장"], answer: 0 },
    { skill: "단어", prompt: "‘benefit’과 가장 가까운 뜻은?", options: ["이점", "실수", "원인", "경고"], answer: 0 },
    { skill: "리딩", prompt: "What helped the team solve the problem?", passage: "Each member had a different idea. By listening carefully and combining their ideas, the team found a better solution.", options: ["Combining their ideas", "Working alone", "Ignoring questions", "Changing members"], answer: 0 },
  ],
  "middle-3": [
    { skill: "듣기", prompt: "방송의 목적을 고르세요.", audio: "Due to heavy rain, today's baseball game has been canceled.", options: ["경기 취소 안내", "선수 모집", "경기장 위치 안내", "우산 판매"], answer: 0 },
    { skill: "단어", prompt: "‘due to’와 같은 뜻은?", options: ["because of", "instead of", "in front of", "as well as"], answer: 0 },
    { skill: "리딩", prompt: "What is the writer's purpose?", passage: "Reusable bottles reduce plastic waste. Carrying one is a simple choice that can protect the environment every day.", options: ["To encourage reusable bottles", "To advertise bottled water", "To explain a science experiment", "To compare two schools"], answer: 0 },
  ],
  high: [
    { skill: "듣기", prompt: "화자가 강조하는 핵심을 고르세요.", audio: "Productive feedback focuses on specific actions that can be improved rather than judging the person.", options: ["피드백은 개선 가능한 행동에 초점을 두어야 한다.", "사람의 성격을 평가해야 한다.", "피드백은 구체적이면 안 된다.", "실수는 언급하지 않아야 한다."], answer: 0 },
    { skill: "단어", prompt: "‘substantial’과 가장 가까운 뜻은?", options: ["상당한", "일시적인", "의도하지 않은", "불확실한"], answer: 0 },
    { skill: "리딩", prompt: "What is the main idea?", passage: "Convenience can save time, but it may also hide environmental costs. Evaluating a product requires considering not only its immediate usefulness but also its full life cycle.", options: ["Products should be judged beyond immediate convenience.", "Convenient products have no environmental cost.", "All useful products should be avoided.", "A product's price is its only important feature."], answer: 0 },
  ],
};

const grammarQuestions: Partial<Record<BankLevelId, Question[]>> = {
  "elementary-mid": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. She ___ my friend.", options: ["is", "are", "am", "be"], answer: 0 },
    { skill: "문법", prompt: "올바른 문장을 고르세요.", options: ["He likes soccer.", "He like soccer.", "He liking soccer.", "He are soccer."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. I have ___ apple.", options: ["an", "a", "the two", "some a"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. These ___ my pencils.", options: ["are", "is", "am", "be"], answer: 0 },
    { skill: "문법", prompt: "올바른 의문문을 고르세요.", options: ["Do you like music?", "You do like music?", "Are you like music?", "Does you like music?"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Tom ___ a bike.", options: ["has", "have", "having", "is have"], answer: 0 },
  ],
  "elementary-high": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Mina ___ to school every day.", options: ["goes", "go", "going", "gone"], answer: 0 },
    { skill: "문법", prompt: "다음 문장의 부정형으로 알맞은 것은? He can swim.", options: ["He cannot swim.", "He does not can swim.", "He not can swim.", "He can not swims."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. There ___ two books on the desk.", options: ["are", "is", "am", "be"], answer: 0 },
    { skill: "문법", prompt: "과거형이 알맞은 문장을 고르세요.", options: ["We played tennis yesterday.", "We play tennis yesterday.", "We plays tennis yesterday.", "We are play tennis yesterday."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. You should ___ your homework.", options: ["finish", "finishes", "finished", "finishing"], answer: 0 },
    { skill: "문법", prompt: "올바른 문장을 고르세요.", options: ["She does not eat meat.", "She do not eats meat.", "She not eat meat.", "She does not eats meat."], answer: 0 },
  ],
  "middle-1": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. My brother ___ TV now.", options: ["is watching", "watches now", "watch", "watched now"], answer: 0 },
    { skill: "문법", prompt: "과거 시제 문장으로 알맞은 것은?", options: ["I visited my aunt yesterday.", "I visit my aunt yesterday.", "I am visit my aunt yesterday.", "I visiting my aunt yesterday."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. ___ you like science?", options: ["Do", "Are", "Does", "Is"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. We ___ dinner two hours ago.", options: ["ate", "eat", "eaten", "are eating"], answer: 0 },
    { skill: "문법", prompt: "명령문으로 알맞은 것은?", options: ["Please close the door.", "You closing the door.", "Do you closed the door.", "The door close please."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Jina and I ___ classmates.", options: ["are", "is", "am", "be"], answer: 0 },
  ],
  "middle-2": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. This book is ___ than that one.", options: ["more interesting", "most interesting", "interesting", "interestinger"], answer: 0 },
    { skill: "문법", prompt: "수동태 문장으로 알맞은 것은?", options: ["The room was cleaned by Jina.", "The room cleaned Jina.", "Jina was cleaned the room.", "The room was clean by Jina."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. I have lived here ___ 2022.", options: ["since", "for", "during", "from"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The box is too heavy for me ___ carry.", options: ["to", "for", "that", "of"], answer: 0 },
    { skill: "문법", prompt: "현재완료 문장으로 알맞은 것은?", options: ["She has finished her work.", "She have finish her work.", "She finished has her work.", "She has finishing her work."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. I enjoy ___ English songs.", options: ["listening to", "listen", "to listening", "listened to"], answer: 0 },
  ],
  "middle-3": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. If it rains, we ___ at home.", options: ["will stay", "stayed", "would stayed", "staying"], answer: 0 },
    { skill: "문법", prompt: "관계대명사가 알맞게 쓰인 문장은?", options: ["This is the book that I bought.", "This is the book who I bought.", "This is the book what I bought it.", "This is the book where I bought it."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. She asked me ___ the window.", options: ["to open", "open", "opening", "opened"], answer: 0 },
    { skill: "문법", prompt: "분사구문으로 알맞은 것은?", options: ["Feeling tired, he went to bed early.", "Felt tired, he going to bed early.", "He feeling tired went bed.", "To felt tired, he went bed."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. I wish I ___ more time.", options: ["had", "have", "will have", "am having"], answer: 0 },
    { skill: "문법", prompt: "간접의문문으로 알맞은 것은?", options: ["Do you know where she lives?", "Do you know where does she live?", "Do you know where she live?", "Do you know where is she live?"], answer: 0 },
  ],
  high: [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Had I known the truth, I ___ differently.", options: ["would have acted", "will act", "acted", "would act yesterday"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["What matters is how we respond to change.", "What matter are how we respond change.", "What is matter how we respond to change.", "What matters is how do we respond to change."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Not until the meeting ended ___ the problem.", options: ["did we understand", "we understood", "we did understand", "understood we"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["The more we practice, the more confident we become.", "The more we practice, we become more confident.", "More we practice, more confident become.", "The most we practice, the more confidence."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. It is essential that every applicant ___ the form.", options: ["submit", "submits", "submitted", "submitting"], answer: 0 },
    { skill: "문법", prompt: "어법상 알맞은 표현을 고르세요. Rarely ___ such a thoughtful response.", options: ["have I seen", "I have seen", "I saw have", "have seen I"], answer: 0 },
  ],
};

const additionalListeningQuestions: Record<BankLevelId, Question[]> = {
  "elementary-low": [
    { skill: "듣기", prompt: "가방을 어디에 두어야 하는지 고르세요.", audio: "Good morning! Please put your bag on the chair.", options: ["의자 위", "책상 아래", "문 옆", "가방 안"], answer: 0 },
    { skill: "듣기", prompt: "화자의 자매가 키우는 동물을 고르세요.", audio: "My sister has a small white rabbit.", options: ["작은 흰 토끼", "큰 검은 개", "노란 새", "갈색 고양이"], answer: 0 },
    { skill: "듣기", prompt: "점심시간을 고르세요.", audio: "We eat lunch at twelve thirty.", options: ["12시 30분", "11시", "1시 30분", "2시"], answer: 0 },
  ],
  "elementary-mid": [
    { skill: "듣기", prompt: "저녁 식사 전에 해야 할 일을 고르세요.", audio: "Please wash your hands before dinner.", options: ["손을 씻는다.", "숙제를 끝낸다.", "창문을 닫는다.", "물을 마신다."], answer: 0 },
    { skill: "듣기", prompt: "학교 버스에 관한 내용으로 알맞은 것은?", audio: "The school bus will arrive five minutes late.", options: ["5분 늦게 도착한다.", "5분 일찍 떠난다.", "운행하지 않는다.", "다른 장소에 온다."], answer: 0 },
    { skill: "듣기", prompt: "Judy가 파란 공책을 고른 이유는?", audio: "Judy chose the blue notebook because it was cheaper.", options: ["더 저렴해서", "더 커서", "친구가 줘서", "그림이 있어서"], answer: 0 },
  ],
  "elementary-high": [
    { skill: "듣기", prompt: "음악 동아리가 모이는 날은?", audio: "The music club meets every Wednesday after school.", options: ["매주 수요일", "매주 월요일", "격주 금요일", "매일 아침"], answer: 0 },
    { skill: "듣기", prompt: "하이킹을 가지 못한 이유는?", audio: "I could not go hiking because I had a cold.", options: ["감기에 걸려서", "비가 와서", "길을 몰라서", "약속이 있어서"], answer: 0 },
    { skill: "듣기", prompt: "학생이 빌릴 수 있는 책의 수는?", audio: "Students can borrow up to three books for two weeks.", options: ["최대 3권", "최대 2권", "최대 5권", "1권만"], answer: 0 },
  ],
  "middle-1": [
    { skill: "듣기", prompt: "과학 보고서 제출 기한은?", audio: "Remember to submit your science report by Friday.", options: ["금요일까지", "월요일까지", "오늘 정오까지", "다음 달까지"], answer: 0 },
    { skill: "듣기", prompt: "기차가 지연된 이유는?", audio: "The train was delayed because of the heavy snow.", options: ["폭설 때문에", "승객이 적어서", "휴일이라서", "공사 때문에"], answer: 0 },
    { skill: "듣기", prompt: "화자가 제안하는 환경 보호 행동은?", audio: "Using a reusable cup can reduce unnecessary waste.", options: ["다회용 컵 사용", "물을 적게 마시기", "종이컵 더 쓰기", "컵을 매일 사기"], answer: 0 },
  ],
  "middle-2": [
    { skill: "듣기", prompt: "화자가 권하는 공부 방법은?", audio: "The speaker recommends taking short breaks during long study sessions.", options: ["짧은 휴식을 취한다.", "밤새 공부한다.", "휴대전화를 계속 본다.", "한 과목만 공부한다."], answer: 0 },
    { skill: "듣기", prompt: "첫 번째 계획의 실패 후 팀이 얻은 것은?", audio: "Although the first plan failed, the team learned how to improve it.", options: ["개선 방법을 배웠다.", "활동을 포기했다.", "팀을 해체했다.", "목표를 잊었다."], answer: 0 },
    { skill: "듣기", prompt: "강의 장소가 어디로 변경되었나요?", audio: "The lecture has been moved from Room 201 to the main hall.", options: ["대강당", "201호", "도서관", "체육관"], answer: 0 },
  ],
  "middle-3": [
    { skill: "듣기", prompt: "소녀가 봉사를 결심한 계기는?", audio: "The girl decided to volunteer after learning about the local shelter.", options: ["지역 보호소를 알게 되어서", "학교 숙제라서", "친구가 선물을 줘서", "대회에 나가려고"], answer: 0 },
    { skill: "듣기", prompt: "실험을 반복해야 하는 이유는?", audio: "The experiment should be repeated to make sure the result is reliable.", options: ["결과의 신뢰성을 확인하려고", "시간을 보내려고", "도구를 바꾸려고", "결과를 숨기려고"], answer: 0 },
    { skill: "듣기", prompt: "영어 안내 투어가 열리는 때는?", audio: "The museum offers a guided tour in English every Saturday afternoon.", options: ["매주 토요일 오후", "매주 일요일 오전", "평일 저녁", "매일 정오"], answer: 0 },
  ],
  high: [
    { skill: "듣기", prompt: "글쓴이가 말하는 실패의 가치는?", audio: "The author argues that failure can provide valuable information for future decisions.", options: ["미래 결정에 유용한 정보를 준다.", "항상 피해야 한다.", "성공과 관계없다.", "모든 계획을 끝낸다."], answer: 0 },
    { skill: "듣기", prompt: "기술의 편리함을 평가할 때 함께 고려할 것은?", audio: "Technological convenience should be evaluated alongside its social and environmental effects.", options: ["사회·환경적 영향", "가격만", "인기도만", "개발 속도만"], answer: 0 },
    { skill: "듣기", prompt: "설득력 있는 주장에 필요한 태도는?", audio: "A persuasive argument acknowledges opposing views before presenting stronger evidence.", options: ["반대 의견을 인정한 뒤 근거를 제시한다.", "반대 의견을 무시한다.", "근거 없이 결론을 말한다.", "감정만 강조한다."], answer: 0 },
  ],
};

const highDifficultyQuestions: Record<"high-intro" | "high-basic" | "high-advanced", Question[]> = {
  "high-intro": [
    { skill: "듣기", prompt: "학생이 학교까지 걸어간 이유는?", audio: "The student missed the bus, so she walked to school.", options: ["버스를 놓쳐서", "운동하고 싶어서", "친구를 만나서", "학교가 가까워서"], answer: 0 },
    { skill: "듣기", prompt: "다음 영어 수업에 가져와야 하는 것은?", audio: "Please bring your worksheet to the next English class.", options: ["학습지", "노트북", "사전", "체육복"], answer: 0 },
    { skill: "듣기", prompt: "방학 중 도서관 운영에 관한 내용은?", audio: "The library closes earlier than usual during the vacation.", options: ["평소보다 일찍 닫는다.", "24시간 운영한다.", "주말에만 연다.", "평소보다 늦게 닫는다."], answer: 0 },
    { skill: "단어", prompt: "‘improve’와 가장 가까운 뜻은?", options: ["향상시키다", "포기하다", "줄이다", "분리하다"], answer: 0 },
    { skill: "단어", prompt: "‘ordinary’의 뜻은?", options: ["평범한", "정확한", "긴급한", "독립적인"], answer: 0 },
    { skill: "단어", prompt: "‘require’와 가장 가까운 뜻은?", options: ["필요로 하다", "제공하다", "비교하다", "허락하다"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. I look forward to ___ from you.", options: ["hearing", "hear", "heard", "be heard"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장은?", options: ["The news made me happy.", "The news made me happily.", "The news made I happy.", "The news making me happy."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The girl ___ near the window is my sister.", options: ["sitting", "sat", "is sit", "to sitting"], answer: 0 },
    { skill: "리딩", prompt: "What is the main idea?", passage: "Small daily goals are easier to continue than large, vague plans. Completing them also gives learners a sense of progress.", options: ["Small goals support steady progress.", "Large plans always succeed.", "Goals reduce motivation.", "Progress cannot be measured."], answer: 0 },
    { skill: "리딩", prompt: "Why did Paul carry an umbrella?", passage: "The sky was clear in the morning, but the forecast predicted rain in the afternoon. Paul put an umbrella in his bag.", options: ["Rain was expected later.", "He wanted shade indoors.", "His bag was empty.", "The umbrella was new."], answer: 0 },
    { skill: "리딩", prompt: "What does the passage suggest?", passage: "Reading aloud helps learners notice pronunciation and rhythm. Recording their voice can make this practice more effective.", options: ["Recording can improve speaking practice.", "Silent reading is always harmful.", "Rhythm is unimportant.", "Pronunciation cannot change."], answer: 0 },
  ],
  "high-basic": [
    { skill: "듣기", prompt: "설문조사가 보여주는 것은?", audio: "The survey suggests that regular exercise improves students' concentration.", options: ["규칙적인 운동이 집중력을 높인다.", "운동이 성적을 낮춘다.", "학생들이 운동을 싫어한다.", "집중력은 변하지 않는다."], answer: 0 },
    { skill: "듣기", prompt: "화자가 의견을 바꾼 계기는?", audio: "The speaker changed her opinion after examining additional evidence.", options: ["추가 근거를 검토한 후", "친구가 부탁해서", "시간이 부족해서", "처음 생각을 잊어서"], answer: 0 },
    { skill: "듣기", prompt: "새 정책의 목적은?", audio: "The new policy aims to reduce waste without limiting consumer choice.", options: ["선택을 제한하지 않고 폐기물을 줄이는 것", "소비를 완전히 금지하는 것", "제품 가격을 높이는 것", "선택지를 하나로 줄이는 것"], answer: 0 },
    { skill: "단어", prompt: "‘significant’의 문맥상 뜻은?", options: ["상당한", "우연한", "일시적인", "개인적인"], answer: 0 },
    { skill: "단어", prompt: "‘maintain’과 가장 가까운 뜻은?", options: ["유지하다", "예측하다", "방해하다", "측정하다"], answer: 0 },
    { skill: "단어", prompt: "‘alternative’의 뜻은?", options: ["대안", "결과", "증거", "경향"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The problem is difficult ___ solve.", options: ["to", "for", "that", "by"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장은?", options: ["Neither answer is completely correct.", "Neither answers are completely correct.", "Neither answer are complete correct.", "Neither is answers correctly."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. By next year, she ___ the course.", options: ["will have completed", "completes", "completed", "is completing yesterday"], answer: 0 },
    { skill: "리딩", prompt: "What is the author's main point?", passage: "Digital tools can make information easier to access, but access alone does not guarantee understanding. Learners still need to evaluate and connect ideas.", options: ["Access must be paired with thoughtful learning.", "Digital tools guarantee understanding.", "Information should be avoided.", "Evaluation slows all learning."], answer: 0 },
    { skill: "리딩", prompt: "What can be inferred?", passage: "The company shortened meetings and asked employees to share key information in advance. Projects began moving faster with fewer misunderstandings.", options: ["Better preparation improved efficiency.", "Longer meetings were required.", "Employees stopped communicating.", "Projects became more confusing."], answer: 0 },
    { skill: "리딩", prompt: "What is the best title?", passage: "A habit becomes easier to repeat when it is connected to a clear cue. Placing a book on your desk, for example, can remind you to read.", options: ["Using Cues to Build Habits", "Why Reminders Never Work", "Removing Every Routine", "The Cost of Buying Books"], answer: 0 },
  ],
  "high-advanced": [
    { skill: "듣기", prompt: "화자가 지적하는 해결책의 문제는?", audio: "The apparent simplicity of the solution may conceal several long-term risks.", options: ["단순해 보이지만 장기 위험을 숨길 수 있다.", "실행 비용이 전혀 없다.", "모두가 이미 반대한다.", "단기 효과가 없다는 점이다."], answer: 0 },
    { skill: "듣기", prompt: "과학 발전의 조건으로 언급된 것은?", audio: "Scientific progress often depends on questioning assumptions that were once widely accepted.", options: ["널리 받아들여진 가정을 의심하는 것", "기존 가정을 그대로 따르는 것", "실험을 줄이는 것", "결과를 먼저 정하는 것"], answer: 0 },
    { skill: "듣기", prompt: "화자가 암시하는 의사결정 기준은?", audio: "The speaker implies that efficiency alone cannot justify a decision with irreversible consequences.", options: ["돌이킬 수 없는 결과에는 효율성 외 기준도 필요하다.", "효율성만 높으면 모든 결정이 정당하다.", "결과는 고려할 필요가 없다.", "결정은 항상 되돌릴 수 있다."], answer: 0 },
    { skill: "단어", prompt: "‘conceal’과 가장 가까운 뜻은?", options: ["감추다", "강조하다", "측정하다", "복원하다"], answer: 0 },
    { skill: "단어", prompt: "‘plausible’의 뜻으로 가장 알맞은 것은?", options: ["그럴듯한", "필연적인", "영구적인", "무관한"], answer: 0 },
    { skill: "단어", prompt: "‘undermine’과 가장 가까운 뜻은?", options: ["약화시키다", "입증하다", "통합하다", "예측하다"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Had it not been for her support, the project ___.", options: ["would have failed", "will fail yesterday", "has fail", "would failed"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장은?", options: ["So complex was the issue that no quick solution emerged.", "So complex the issue was that emerged no solution.", "The issue so complex that no solution was emerge.", "So was complex the issue no solution emerged."], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The evidence, ___ carefully examined, revealed a different pattern.", options: ["when", "what", "which was it", "being it"], answer: 0 },
    { skill: "리딩", prompt: "What is the central idea?", passage: "Predictions influence behavior, and behavior can make those predictions appear accurate. Therefore, observed outcomes may partly reflect expectations rather than independent reality.", options: ["Expectations can help create the outcomes they predict.", "Predictions never affect behavior.", "All observations are completely objective.", "Reality depends only on statistics."], answer: 0 },
    { skill: "리딩", prompt: "What does the author imply?", passage: "Efficiency metrics reward what is easy to count. Valuable activities that resist measurement may then receive less attention, even when they matter more in the long run.", options: ["Measurement can distort priorities.", "Only measurable work has value.", "Long-term value is always obvious.", "Efficiency metrics remove bias."], answer: 0 },
    { skill: "리딩", prompt: "What is the best summary?", passage: "A theory that explains every possible outcome cannot be meaningfully tested. Strong explanations risk being proven wrong because they make clear predictions.", options: ["Testable explanations require the possibility of failure.", "Good theories explain everything after it happens.", "Predictions weaken scientific theories.", "A theory should avoid clear claims."], answer: 0 },
  ],
};

// Keep a second, independent bank so a new attempt changes the actual language
// being tested instead of only changing names or option order.
const supplementaryQuestions: Record<BankLevelId, Question[]> = {
  "elementary-low": [
    { skill: "듣기", prompt: "화자가 원하는 것을 고르세요.", audio: "Can I have some milk, please?", options: ["우유", "주스", "빵", "사과"], answer: 0 },
    { skill: "단어", prompt: "‘비가 오는’에 해당하는 영어 단어는?", options: ["rainy", "sunny", "windy", "cloudy"], answer: 0 },
    { skill: "리딩", prompt: "Where is the bird?", passage: "A small bird is in the tree. It is singing.", options: ["In the tree", "Under the desk", "In the water", "On the bed"], answer: 0 },
  ],
  "elementary-mid": [
    { skill: "듣기", prompt: "화자가 방과 후에 할 일을 고르세요.", audio: "I will visit my grandmother after school.", options: ["할머니를 찾아간다.", "축구를 한다.", "도서관에 간다.", "저녁을 만든다."], answer: 0 },
    { skill: "단어", prompt: "‘조용한’에 해당하는 영어 단어는?", options: ["quiet", "quick", "strong", "bright"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. We ___ English on Mondays.", options: ["study", "studies", "studying", "is study"], answer: 0 },
    { skill: "리딩", prompt: "Why does Eric carry a bottle?", passage: "Eric plays basketball after school. He carries a bottle because he gets thirsty.", options: ["Because he gets thirsty", "Because it is heavy", "Because it is new", "Because he sells water"], answer: 0 },
  ],
  "elementary-high": [
    { skill: "듣기", prompt: "화자가 잃어버린 물건을 고르세요.", audio: "I cannot find my red pencil case.", options: ["빨간 필통", "파란 공책", "검은 우산", "노란 가방"], answer: 0 },
    { skill: "단어", prompt: "‘choose’의 뜻은?", options: ["선택하다", "기다리다", "설명하다", "도착하다"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. My sister ___ a letter last night.", options: ["wrote", "writes", "write", "is writing"], answer: 0 },
    { skill: "리딩", prompt: "What did Nari do after planting the seeds?", passage: "Nari planted flower seeds in a pot. Then she gave them some water and put the pot by the window.", options: ["She watered them.", "She threw them away.", "She picked the flowers.", "She painted the pot."], answer: 0 },
  ],
  "middle-1": [
    { skill: "듣기", prompt: "화자가 약속 시간에 늦는 이유는?", audio: "I will be late because the bus is stuck in traffic.", options: ["버스가 교통 체증에 갇혀서", "약속 장소를 몰라서", "숙제를 끝내지 못해서", "비가 오기 때문에"], answer: 0 },
    { skill: "단어", prompt: "‘continue’와 가장 가까운 뜻은?", options: ["계속하다", "멈추다", "선택하다", "준비하다"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. There ___ some milk in the glass.", options: ["is", "are", "be", "were"], answer: 0 },
    { skill: "리딩", prompt: "Why did Ella open the window?", passage: "The classroom felt hot and stuffy. Ella opened the window to let in some fresh air.", options: ["To let in fresh air", "To hear the music", "To call her friend", "To watch the rain"], answer: 0 },
  ],
  "middle-2": [
    { skill: "듣기", prompt: "안내 방송의 변경 사항을 고르세요.", audio: "The art class will begin at two instead of one thirty.", options: ["수업이 2시에 시작한다.", "수업 장소가 바뀐다.", "수업이 취소된다.", "수업이 1시에 시작한다."], answer: 0 },
    { skill: "단어", prompt: "‘participate’의 뜻으로 알맞은 것은?", options: ["참여하다", "관찰하다", "예측하다", "방해하다"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The cookies ___ by my aunt yesterday.", options: ["were made", "made", "are making", "was made"], answer: 0 },
    { skill: "리딩", prompt: "What made the garden healthier?", passage: "The students collected rainwater and used it in the school garden. This saved tap water and helped the plants grow well.", options: ["Using collected rainwater", "Removing all the plants", "Using more plastic", "Closing the garden"], answer: 0 },
  ],
  "middle-3": [
    { skill: "듣기", prompt: "발표 자료 제출 방법을 고르세요.", audio: "Please upload your presentation slides before Thursday evening.", options: ["목요일 저녁 전까지 업로드한다.", "금요일에 인쇄해 온다.", "수업 후 이메일로 보낸다.", "발표 당일 작성한다."], answer: 0 },
    { skill: "단어", prompt: "‘impact’와 가장 가까운 뜻은?", options: ["영향", "목적", "과정", "기회"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The movie was so moving that I could not help ___ .", options: ["crying", "to cry", "cry", "cried"], answer: 0 },
    { skill: "리딩", prompt: "What can be inferred about the repair café?", passage: "At the repair café, volunteers fix broken household items and teach owners how to maintain them. Fewer usable items are thrown away.", options: ["It helps reduce waste.", "It sells only new products.", "It discourages learning skills.", "It accepts food waste only."], answer: 0 },
  ],
  high: [
    { skill: "듣기", prompt: "화자가 강조하는 연구 태도는?", audio: "A surprising result should be investigated carefully rather than dismissed as an error.", options: ["뜻밖의 결과도 신중히 조사해야 한다.", "예상과 다른 결과는 버려야 한다.", "모든 오류는 숨겨야 한다.", "결론을 먼저 정해야 한다."], answer: 0 },
    { skill: "단어", prompt: "‘inevitable’과 가장 가까운 뜻은?", options: ["피할 수 없는", "임시적인", "측정 가능한", "논쟁의 여지가 없는"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["Only after the data were reviewed did the pattern become clear.", "Only after the data reviewed the pattern became clear.", "Only the data were reviewed did become the pattern clear.", "After only reviewing did the pattern became clear."], answer: 0 },
    { skill: "리딩", prompt: "What is the author's main point?", passage: "A model simplifies reality so that we can reason about it. Its value depends not on including every detail, but on preserving the features relevant to the question being asked.", options: ["A useful model keeps the details relevant to its purpose.", "A model must reproduce every detail of reality.", "Simple models cannot support reasoning.", "All questions require the same model."], answer: 0 },
  ],
};

// Extra authored items keep the high-volume daily areas from wrapping back to
// yesterday's source questions. These are deliberately written rather than
// produced through token substitution so grammar, meaning, and answer keys
// remain stable.
const antiRepeatQuestions: Record<BankLevelId, Question[]> = {
  "elementary-low": [
    { skill: "단어", prompt: "‘창문’에 해당하는 영어 단어는?", options: ["window", "pencil", "flower", "kitchen"], answer: 0 },
    { skill: "단어", prompt: "‘행복한’에 해당하는 영어 단어는?", options: ["happy", "small", "cold", "slow"], answer: 0 },
    { skill: "리딩", prompt: "What does Jisu have?", passage: "Jisu has a small yellow umbrella.", options: ["A yellow umbrella", "A red hat", "A blue cup", "A green book"], answer: 0 },
    { skill: "리딩", prompt: "Where is the cat?", passage: "The cat is sleeping on the sofa.", options: ["On the sofa", "Under the tree", "In the bag", "By the door"], answer: 0 },
  ],
  "elementary-mid": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. She ___ to school every day.", options: ["goes", "go", "going", "went tomorrow"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. There ___ two apples on the table.", options: ["are", "is", "am", "be"], answer: 0 },
    { skill: "리딩", prompt: "Why does Sumi take an umbrella?", passage: "Dark clouds are in the sky. Sumi takes an umbrella before she leaves home.", options: ["It may rain.", "It is very hot.", "She lost her bag.", "She wants to exercise."], answer: 0 },
    { skill: "리딩", prompt: "What does Junho do after dinner?", passage: "Junho washes the dishes after dinner. Then he reads a comic book.", options: ["He washes the dishes.", "He plays soccer.", "He cooks breakfast.", "He goes to school."], answer: 0 },
  ],
  "elementary-high": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. We ___ the museum last Saturday.", options: ["visited", "visit", "visits", "visiting"], answer: 0 },
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. This box is ___ than that one.", options: ["heavier", "heavy", "heaviest", "more heavy"], answer: 0 },
    { skill: "리딩", prompt: "Why did Minho turn off the computer?", passage: "Minho finished his homework on the computer. He turned it off to save energy.", options: ["To save energy", "To download a game", "To call his teacher", "To print a photo"], answer: 0 },
    { skill: "리딩", prompt: "What happened after the students practiced?", passage: "The students practiced the song every afternoon. At the festival, they sang confidently.", options: ["They sang confidently.", "They canceled the festival.", "They forgot the song.", "They left the stage early."], answer: 0 },
  ],
  "middle-1": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. My brother enjoys ___ basketball.", options: ["playing", "play", "to played", "plays"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["She was tired, so she went to bed early.", "She tired, so went bed early.", "She was tired because she go early.", "She is tired yesterday."], answer: 0 },
    { skill: "리딩", prompt: "Why did Joon return to the classroom?", passage: "Joon noticed that his notebook was missing. He remembered leaving it under his desk, so he returned to the classroom.", options: ["To get his notebook", "To meet a new teacher", "To open a window", "To finish lunch"], answer: 0 },
    { skill: "리딩", prompt: "What is the main idea?", passage: "Keeping a short daily journal helps learners notice what they understand and what they still need to practice.", options: ["A journal can guide daily learning.", "Writing always takes too much time.", "Practice is unnecessary.", "Learners should avoid reviewing."], answer: 0 },
  ],
  "middle-2": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. If it rains tomorrow, we ___ indoors.", options: ["will stay", "stayed", "stay yesterday", "would stayed"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["The book that I borrowed was interesting.", "The book who I borrowed were interesting.", "The book I borrowing was interest.", "The book that borrowed me interesting."], answer: 0 },
    { skill: "리딩", prompt: "What helped the class reduce waste?", passage: "The class placed separate bins for paper and plastic. Clear labels helped everyone put items in the right bin.", options: ["Clearly labeled recycling bins", "Buying more plastic", "Removing every bin", "Using paper only once"], answer: 0 },
    { skill: "리딩", prompt: "What can be inferred?", passage: "Mina divided her large project into small tasks and completed one task each day. She finished before the deadline without rushing.", options: ["Small steps made the project manageable.", "The deadline was canceled.", "She completed everything in one night.", "Planning slowed her progress."], answer: 0 },
  ],
  "middle-3": [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. The window ___ before the storm arrived.", options: ["had been closed", "has close", "was closing it", "closed had"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["Not only did she apologize, but she also fixed the mistake.", "Not only she apologized, but fixed also.", "Not only did apologize she, but fixes it.", "She not only did apologized the mistake."], answer: 0 },
    { skill: "리딩", prompt: "What is the author's purpose?", passage: "Before accepting a dramatic headline, readers should check the full article, its source, and the evidence it provides.", options: ["To encourage careful evaluation of news", "To promote dramatic headlines", "To discourage all online reading", "To replace evidence with opinions"], answer: 0 },
    { skill: "리딩", prompt: "What can be inferred about the team?", passage: "The team tested three designs. Although the first two failed, each result showed them what to change in the final design.", options: ["They learned from unsuccessful attempts.", "They used only their first idea.", "They refused to test the design.", "They ignored every result."], answer: 0 },
  ],
  high: [
    { skill: "문법", prompt: "빈칸에 알맞은 말을 고르세요. Rarely ___ such a thoughtful response.", options: ["have I seen", "I have seen", "did I saw", "I seeing"], answer: 0 },
    { skill: "문법", prompt: "어법상 올바른 문장을 고르세요.", options: ["Were the evidence stronger, the conclusion would be more convincing.", "Was the evidence stronger, the conclusion will convincing.", "Were stronger the evidence, the conclusion is convinced.", "The evidence were strong would convince."], answer: 0 },
    { skill: "리딩", prompt: "What is the central idea?", passage: "Abundant information does not automatically produce sound judgment. People must compare sources, test assumptions, and revise conclusions when new evidence appears.", options: ["Good judgment requires active evaluation.", "More information always guarantees accuracy.", "Assumptions should never be questioned.", "Conclusions must remain unchanged."], answer: 0 },
    { skill: "리딩", prompt: "What does the author imply?", passage: "A policy may improve an average outcome while leaving some groups worse off. An average alone therefore cannot show how benefits and costs are distributed.", options: ["Distribution matters when evaluating policy.", "Average results reveal every individual effect.", "Policies never create unequal outcomes.", "Costs should be excluded from evaluation."], answer: 0 },
  ],
};

// 초등 저학년은 하루에 영역별 3문항을 사용하므로, 소수의 정적 문항만으로는
// 며칠 뒤 같은 문장이 다시 나올 수 있습니다. 아래 전용 은행은 검수된 단어와
// 문장 틀을 조합해 듣기 96개, 단어 96개, 리딩 120개의 고유 문항을 만듭니다.
// 같은 원문 문항은 각 영역의 전체 은행이 한 바퀴 돌기 전에는 재사용되지 않습니다.
const elementaryLowVocabulary = [
  ["apple", "사과"], ["bread", "빵"], ["water", "물"], ["milk", "우유"],
  ["juice", "주스"], ["rice", "밥"], ["egg", "달걀"], ["cheese", "치즈"],
  ["book", "책"], ["pencil", "연필"], ["eraser", "지우개"], ["ruler", "자"],
  ["notebook", "공책"], ["desk", "책상"], ["chair", "의자"], ["window", "창문"],
  ["school", "학교"], ["library", "도서관"], ["park", "공원"], ["hospital", "병원"],
  ["market", "시장"], ["garden", "정원"], ["kitchen", "부엌"], ["bedroom", "침실"],
  ["dog", "강아지"], ["cat", "고양이"], ["rabbit", "토끼"], ["bird", "새"],
  ["fish", "물고기"], ["turtle", "거북이"], ["horse", "말"], ["duck", "오리"],
  ["happy", "행복한"], ["sad", "슬픈"], ["hungry", "배고픈"], ["thirsty", "목마른"],
  ["small", "작은"], ["large", "큰"], ["fast", "빠른"], ["slow", "느린"],
  ["sunny", "맑은"], ["rainy", "비가 오는"], ["cloudy", "흐린"], ["windy", "바람이 부는"],
  ["morning", "아침"], ["evening", "저녁"], ["family", "가족"], ["friend", "친구"],
] as const;

const elementaryLowListeningActions = [
  ["reads a book after school.", "방과 후에 책을 읽어요."],
  ["drinks milk at breakfast.", "아침 식사 때 우유를 마셔요."],
  ["plays soccer in the park.", "공원에서 축구를 해요."],
  ["draws a picture at home.", "집에서 그림을 그려요."],
  ["feeds the rabbit every morning.", "매일 아침 토끼에게 먹이를 줘요."],
  ["rides a bike on Sunday.", "일요일에 자전거를 타요."],
  ["helps Mom in the kitchen.", "부엌에서 엄마를 도와요."],
  ["writes in a notebook before class.", "수업 전에 공책에 써요."],
] as const;
const elementaryLowNames = ["Mina", "Jisu", "Ben", "Tom", "Emma", "Lucy", "Eric", "Nari", "Sora", "Junho", "Yuna", "Alex"] as const;

const elementaryLowReadingFacts = [
  { sentence: "puts a lunch box in the blue bag before school.", prompt: "What is in the blue bag?", answer: "A lunch box", wrong: ["A soccer ball", "A toy car", "A storybook"] },
  { sentence: "feeds a white rabbit every morning.", prompt: "What animal does the child feed?", answer: "A white rabbit", wrong: ["A brown dog", "A small bird", "A yellow duck"] },
  { sentence: "wears red boots on rainy days.", prompt: "What does the child wear?", answer: "Red boots", wrong: ["A green hat", "Blue gloves", "A yellow coat"] },
  { sentence: "takes the bus to school every day.", prompt: "How does the child go to school?", answer: "By bus", wrong: ["By bike", "On foot", "By train"] },
  { sentence: "reads a comic book after dinner.", prompt: "What does the child read?", answer: "A comic book", wrong: ["A menu", "A map", "A letter"] },
  { sentence: "plays tennis with Dad on Saturday.", prompt: "What sport does the child play?", answer: "Tennis", wrong: ["Baseball", "Basketball", "Soccer"] },
  { sentence: "has two yellow pencils in the pencil case.", prompt: "How many yellow pencils are there?", answer: "Two", wrong: ["One", "Three", "Four"] },
  { sentence: "drinks a glass of milk with breakfast.", prompt: "What does the child drink?", answer: "Milk", wrong: ["Water", "Juice", "Tea"] },
  { sentence: "visits Grandma every Sunday afternoon.", prompt: "When does the child visit Grandma?", answer: "Sunday afternoon", wrong: ["Monday morning", "Friday evening", "Saturday morning"] },
  { sentence: "keeps a toy robot on the desk.", prompt: "Where is the toy robot?", answer: "On the desk", wrong: ["Under the bed", "In the bag", "By the door"] },
] as const;

function circularChoices(values: readonly string[], correctIndex: number) {
  return [values[correctIndex], values[(correctIndex + 1) % values.length], values[(correctIndex + 2) % values.length], values[(correctIndex + 3) % values.length]];
}

const elementaryLowExpandedQuestions: Question[] = [
  ...elementaryLowVocabulary.flatMap(([english, korean], index) => {
    const englishWords = elementaryLowVocabulary.map(([word]) => word);
    const koreanWords = elementaryLowVocabulary.map(([, meaning]) => meaning);
    return [
      { skill: "단어" as const, prompt: `‘${korean}’에 해당하는 영어 단어는?`, options: circularChoices(englishWords, index), answer: 0 },
      { skill: "단어" as const, prompt: `영어 단어 ‘${english}’의 뜻은?`, options: circularChoices(koreanWords, index), answer: 0 },
    ];
  }),
  ...elementaryLowNames.flatMap((name) => elementaryLowListeningActions.map(([action, meaning], actionIndex) => ({
    skill: "듣기" as const,
    prompt: `${name}가 하는 일을 고르세요.`,
    audio: `${name} ${action}`,
    options: circularChoices(elementaryLowListeningActions.map(([, label]) => label), actionIndex),
    answer: 0,
  }))),
  ...elementaryLowNames.flatMap((name) => elementaryLowReadingFacts.map((fact) => ({
    skill: "리딩" as const,
    prompt: fact.prompt,
    passage: `${name} ${fact.sentence}`,
    options: [fact.answer, ...fact.wrong],
    answer: 0,
  }))),
];

type GeneratedBand = "elementary" | "middle" | "high";
type GeneratedActivity = { base: string; third: string; past: string; ing: string; ko: string };

const generatedActivities: Record<GeneratedBand, GeneratedActivity[]> = {
  elementary: [
    { base: "read a story", third: "reads a story", past: "read a story", ing: "reading a story", ko: "이야기책 읽기" },
    { base: "play badminton", third: "plays badminton", past: "played badminton", ing: "playing badminton", ko: "배드민턴 치기" },
    { base: "wash the dishes", third: "washes the dishes", past: "washed the dishes", ing: "washing the dishes", ko: "설거지하기" },
    { base: "visit the library", third: "visits the library", past: "visited the library", ing: "visiting the library", ko: "도서관 방문하기" },
    { base: "help the family", third: "helps the family", past: "helped the family", ing: "helping the family", ko: "가족 돕기" },
    { base: "draw a picture", third: "draws a picture", past: "drew a picture", ing: "drawing a picture", ko: "그림 그리기" },
    { base: "ride a bicycle", third: "rides a bicycle", past: "rode a bicycle", ing: "riding a bicycle", ko: "자전거 타기" },
    { base: "clean the room", third: "cleans the room", past: "cleaned the room", ing: "cleaning the room", ko: "방 청소하기" },
    { base: "practice the piano", third: "practices the piano", past: "practiced the piano", ing: "practicing the piano", ko: "피아노 연습하기" },
    { base: "pack a school bag", third: "packs a school bag", past: "packed a school bag", ing: "packing a school bag", ko: "책가방 챙기기" },
    { base: "water the plants", third: "waters the plants", past: "watered the plants", ing: "watering the plants", ko: "식물에 물 주기" },
    { base: "feed the puppy", third: "feeds the puppy", past: "fed the puppy", ing: "feeding the puppy", ko: "강아지에게 먹이 주기" },
    { base: "make a sandwich", third: "makes a sandwich", past: "made a sandwich", ing: "making a sandwich", ko: "샌드위치 만들기" },
    { base: "write a letter", third: "writes a letter", past: "wrote a letter", ing: "writing a letter", ko: "편지 쓰기" },
    { base: "collect leaves", third: "collects leaves", past: "collected leaves", ing: "collecting leaves", ko: "나뭇잎 모으기" },
    { base: "practice English", third: "practices English", past: "practiced English", ing: "practicing English", ko: "영어 연습하기" },
  ],
  middle: [
    { base: "organize a study plan", third: "organizes a study plan", past: "organized a study plan", ing: "organizing a study plan", ko: "학습 계획 정리하기" },
    { base: "prepare a presentation", third: "prepares a presentation", past: "prepared a presentation", ing: "preparing a presentation", ko: "발표 준비하기" },
    { base: "compare two solutions", third: "compares two solutions", past: "compared two solutions", ing: "comparing two solutions", ko: "두 해결책 비교하기" },
    { base: "review the science notes", third: "reviews the science notes", past: "reviewed the science notes", ing: "reviewing the science notes", ko: "과학 노트 복습하기" },
    { base: "join a volunteer project", third: "joins a volunteer project", past: "joined a volunteer project", ing: "joining a volunteer project", ko: "봉사 프로젝트 참여하기" },
    { base: "solve a difficult puzzle", third: "solves a difficult puzzle", past: "solved a difficult puzzle", ing: "solving a difficult puzzle", ko: "어려운 퍼즐 풀기" },
    { base: "practice a short speech", third: "practices a short speech", past: "practiced a short speech", ing: "practicing a short speech", ko: "짧은 연설 연습하기" },
    { base: "research an environmental issue", third: "researches an environmental issue", past: "researched an environmental issue", ing: "researching an environmental issue", ko: "환경 문제 조사하기" },
    { base: "repair a broken chair", third: "repairs a broken chair", past: "repaired a broken chair", ing: "repairing a broken chair", ko: "부서진 의자 수리하기" },
    { base: "record the experiment results", third: "records the experiment results", past: "recorded the experiment results", ing: "recording the experiment results", ko: "실험 결과 기록하기" },
    { base: "design a class poster", third: "designs a class poster", past: "designed a class poster", ing: "designing a class poster", ko: "학급 포스터 디자인하기" },
    { base: "interview a local artist", third: "interviews a local artist", past: "interviewed a local artist", ing: "interviewing a local artist", ko: "지역 예술가 인터뷰하기" },
    { base: "summarize a news article", third: "summarizes a news article", past: "summarized a news article", ing: "summarizing a news article", ko: "뉴스 기사 요약하기" },
    { base: "measure the plant growth", third: "measures the plant growth", past: "measured the plant growth", ing: "measuring the plant growth", ko: "식물 성장 측정하기" },
    { base: "explain the team decision", third: "explains the team decision", past: "explained the team decision", ing: "explaining the team decision", ko: "팀 결정 설명하기" },
    { base: "create a reading journal", third: "creates a reading journal", past: "created a reading journal", ing: "creating a reading journal", ko: "독서 일지 만들기" },
  ],
  high: [
    { base: "analyze the evidence", third: "analyzes the evidence", past: "analyzed the evidence", ing: "analyzing the evidence", ko: "근거 분석하기" },
    { base: "evaluate the proposal", third: "evaluates the proposal", past: "evaluated the proposal", ing: "evaluating the proposal", ko: "제안 평가하기" },
    { base: "revise the hypothesis", third: "revises the hypothesis", past: "revised the hypothesis", ing: "revising the hypothesis", ko: "가설 수정하기" },
    { base: "interpret the data", third: "interprets the data", past: "interpreted the data", ing: "interpreting the data", ko: "자료 해석하기" },
    { base: "compare the sources", third: "compares the sources", past: "compared the sources", ing: "comparing the sources", ko: "자료 출처 비교하기" },
    { base: "challenge the assumption", third: "challenges the assumption", past: "challenged the assumption", ing: "challenging the assumption", ko: "가정에 의문 제기하기" },
    { base: "synthesize the findings", third: "synthesizes the findings", past: "synthesized the findings", ing: "synthesizing the findings", ko: "연구 결과 종합하기" },
    { base: "verify the claim", third: "verifies the claim", past: "verified the claim", ing: "verifying the claim", ko: "주장 검증하기" },
    { base: "assess the consequences", third: "assesses the consequences", past: "assessed the consequences", ing: "assessing the consequences", ko: "결과 평가하기" },
    { base: "formulate a solution", third: "formulates a solution", past: "formulated a solution", ing: "formulating a solution", ko: "해결책 구상하기" },
    { base: "examine the pattern", third: "examines the pattern", past: "examined the pattern", ing: "examining the pattern", ko: "패턴 검토하기" },
    { base: "justify the conclusion", third: "justifies the conclusion", past: "justified the conclusion", ing: "justifying the conclusion", ko: "결론 정당화하기" },
    { base: "identify a limitation", third: "identifies a limitation", past: "identified a limitation", ing: "identifying a limitation", ko: "한계점 파악하기" },
    { base: "consider an alternative", third: "considers an alternative", past: "considered an alternative", ing: "considering an alternative", ko: "대안 고려하기" },
    { base: "predict the long-term effect", third: "predicts the long-term effect", past: "predicted the long-term effect", ing: "predicting the long-term effect", ko: "장기 효과 예측하기" },
    { base: "defend a position", third: "defends a position", past: "defended a position", ing: "defending a position", ko: "입장 논증하기" },
  ],
};

const generatedTimes = ["this morning", "after lunch", "after school", "before dinner", "this evening", "on Monday", "on Tuesday", "on Wednesday", "on Thursday", "on Friday", "on Saturday", "on Sunday"];
const generatedTimeKo = ["오늘 아침", "점심 식사 후", "방과 후", "저녁 식사 전", "오늘 저녁", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const generatedExtraVocabulary: Record<GeneratedBand, Array<{ en: string; ko: string }>> = {
  elementary: [
    { en: "careful", ko: "조심스러운" }, { en: "favorite", ko: "가장 좋아하는" },
    { en: "together", ko: "함께" }, { en: "usually", ko: "보통" },
    { en: "different", ko: "다른" }, { en: "important", ko: "중요한" },
    { en: "kind", ko: "친절한" }, { en: "quiet", ko: "조용한" },
    { en: "early", ko: "일찍" }, { en: "excited", ko: "신이 난" },
    { en: "borrow", ko: "빌리다" }, { en: "return", ko: "돌려주다" },
    { en: "choose", ko: "선택하다" }, { en: "remember", ko: "기억하다" },
    { en: "invite", ko: "초대하다" }, { en: "arrive", ko: "도착하다" },
  ],
  middle: [
    { en: "participate", ko: "참여하다" }, { en: "available", ko: "이용 가능한" },
    { en: "reduce", ko: "줄이다" }, { en: "solution", ko: "해결책" },
    { en: "responsible", ko: "책임감 있는" }, { en: "opportunity", ko: "기회" },
    { en: "concentrate", ko: "집중하다" }, { en: "recommend", ko: "추천하다" },
    { en: "improve", ko: "향상시키다" }, { en: "prevent", ko: "예방하다" },
    { en: "efficient", ko: "효율적인" }, { en: "environment", ko: "환경" },
    { en: "influence", ko: "영향을 미치다" }, { en: "benefit", ko: "이점" },
    { en: "maintain", ko: "유지하다" }, { en: "require", ko: "요구하다" },
  ],
  high: [
    { en: "substantial", ko: "상당한" }, { en: "inevitable", ko: "피할 수 없는" },
    { en: "ambiguous", ko: "모호한" }, { en: "plausible", ko: "그럴듯한" },
    { en: "undermine", ko: "약화시키다" }, { en: "reinforce", ko: "강화하다" },
    { en: "comprehensive", ko: "포괄적인" }, { en: "valid", ko: "타당한" },
    { en: "contradict", ko: "모순되다" }, { en: "derive", ko: "도출하다" },
    { en: "allocate", ko: "할당하다" }, { en: "distort", ko: "왜곡하다" },
    { en: "conventional", ko: "관습적인" }, { en: "tentative", ko: "잠정적인" },
    { en: "explicit", ko: "명백한" }, { en: "coherent", ko: "일관성 있는" },
  ],
};

function generatedBandFor(level: BankLevelId): GeneratedBand {
  if (level.startsWith("elementary")) return "elementary";
  return level.startsWith("middle") ? "middle" : "high";
}

function grammarQuestion(level: BankLevelId, name: string, activity: GeneratedActivity, index: number): Question {
  const mode = index % 6;
  if (level.startsWith("elementary")) {
    if (mode === 0) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. ${name} ___ every day.`, options: [activity.third, activity.base, activity.ing, activity.past], answer: 0 };
    if (mode === 1) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. ${name} is ___ now.`, options: [activity.ing, activity.base, activity.past, activity.third], answer: 0 };
    if (mode === 2) return { skill: "문법", prompt: `어제 한 일을 나타내는 문장을 고르세요.`, options: [`${name} ${activity.past} yesterday.`, `${name} ${activity.third} yesterday.`, `${name} is ${activity.base} yesterday.`, `${name} ${activity.ing} yesterday.`], answer: 0 };
    if (mode === 3) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. ${name} wants to ___.`, options: [activity.base, activity.third, activity.past, activity.ing], answer: 0 };
    if (mode === 4) return { skill: "문법", prompt: `올바른 미래 표현을 고르세요.`, options: [`${name} will ${activity.base} tomorrow.`, `${name} will ${activity.past} tomorrow.`, `${name} will ${activity.ing} tomorrow.`, `${name} wills ${activity.base} tomorrow.`], answer: 0 };
    return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. Does ${name} ___ on Sunday?`, options: [activity.base, activity.third, activity.past, activity.ing], answer: 0 };
  }
  if (level.startsWith("middle")) {
    if (mode === 0) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. ${name} ___ yesterday.`, options: [activity.past, activity.third, activity.base, activity.ing], answer: 0 };
    if (mode === 1) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. ${name} is interested in ___.`, options: [activity.ing, activity.base, activity.past, activity.third], answer: 0 };
    if (mode === 2) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. If ${name} has time, ${name} will ___.`, options: [activity.base, activity.past, activity.ing, activity.third], answer: 0 };
    if (mode === 3) return { skill: "문법", prompt: `어법상 올바른 문장을 고르세요.`, options: [`${name} decided to ${activity.base}.`, `${name} decided ${activity.past}.`, `${name} decided to ${activity.ing}.`, `${name} deciding to ${activity.base}.`], answer: 0 };
    if (mode === 4) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. While ${name} was ___, the teacher arrived.`, options: [activity.ing, activity.base, activity.past, activity.third], answer: 0 };
    return { skill: "문법", prompt: `올바른 의문문을 고르세요.`, options: [`Did ${name} ${activity.base}?`, `Did ${name} ${activity.past}?`, `Does ${name} ${activity.past}?`, `Was ${name} ${activity.base}?`], answer: 0 };
  }
  if (mode === 0) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. Only after the discussion did ${name} ___.`, options: [activity.base, activity.past, activity.third, activity.ing], answer: 0 };
  if (mode === 1) return { skill: "문법", prompt: `어법상 올바른 문장을 고르세요.`, options: [`Had ${name} had more time, ${name} would have ${activity.past}.`, `Had ${name} more time, ${name} will ${activity.past}.`, `${name} had more time would have ${activity.base}.`, `If had ${name} time, ${name} would ${activity.past}.`], answer: 0 };
  if (mode === 2) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. It was essential that ${name} ___.`, options: [activity.base, activity.third, activity.past, activity.ing], answer: 0 };
  if (mode === 3) return { skill: "문법", prompt: `도치 구문으로 올바른 문장을 고르세요.`, options: [`Not until noon did ${name} ${activity.base}.`, `Not until noon ${name} ${activity.past}.`, `Not until did noon ${name} ${activity.base}.`, `Not noon until ${name} did ${activity.past}.`], answer: 0 };
  if (mode === 4) return { skill: "문법", prompt: `빈칸에 알맞은 말을 고르세요. ${name}, having finished the first task, began ___.`, options: [activity.ing, activity.base, activity.past, activity.third], answer: 0 };
  return { skill: "문법", prompt: `어법상 올바른 문장을 고르세요.`, options: [`What ${name} did was ${activity.base}.`, `What did ${name} was ${activity.past}.`, `What ${name} did were ${activity.ing}.`, `${name} what did was ${activity.base}.`], answer: 0 };
}

function buildExpandedQuestions(level: BankLevelId): Question[] {
  if (level === "elementary-low") return [];
  const band = generatedBandFor(level);
  const activities = generatedActivities[band];
  const listening = elementaryLowNames.flatMap((name, nameIndex) => activities.map((activity, activityIndex) => ({
    skill: "듣기" as const,
    prompt: level.startsWith("elementary") ? `${name}가 할 일을 고르세요.` : "화자가 말한 계획을 고르세요.",
    audio: band === "high" ? `After considering the available options, ${name} decided to ${activity.base} ${generatedTimes[(nameIndex + activityIndex) % generatedTimes.length]}.` : `${name} will ${activity.base} ${generatedTimes[(nameIndex + activityIndex) % generatedTimes.length]}.`,
    options: circularChoices(activities.map((item) => item.ko), activityIndex),
    answer: 0,
  })));
  const grammar = elementaryLowNames.flatMap((name, nameIndex) => activities.map((activity, activityIndex) => grammarQuestion(level, name, activity, nameIndex + activityIndex)));
  const vocabularyConcepts = [
    ...activities.map((activity) => ({ en: activity.base, ko: activity.ko })),
    ...generatedExtraVocabulary[band],
  ];
  const vocabulary = vocabularyConcepts.map((concept, index) => ({
    skill: "단어" as const,
    prompt: `‘${concept.ko}’와 가장 가까운 영어 표현은?`,
    options: circularChoices(vocabularyConcepts.map((item) => item.en), index),
    answer: 0,
  }));
  const reading = elementaryLowNames.flatMap((name, nameIndex) => activities.map((activity, activityIndex) => {
    const originalTime = (nameIndex + activityIndex) % generatedTimes.length;
    const changedTime = (originalTime + 3 + (activityIndex % 4)) % generatedTimes.length;
    const passage = band === "elementary"
      ? `${name} wants to ${activity.base}. The plan was for ${generatedTimes[originalTime]}, but it changed to ${generatedTimes[changedTime]}.`
      : band === "middle"
        ? `${name} planned to ${activity.base} ${generatedTimes[originalTime]}. Because another class was added, the plan was moved to ${generatedTimes[changedTime]}.`
        : `Although ${name} had initially intended to ${activity.base} ${generatedTimes[originalTime]}, an unexpected schedule conflict required the task to be postponed until ${generatedTimes[changedTime]}.`;
    return {
      skill: "리딩" as const,
      prompt: band === "high" ? "When will the task most likely take place?" : `When will ${name} ${activity.base}?`,
      passage,
      options: circularChoices(generatedTimeKo, changedTime),
      answer: 0,
    };
  }));
  return [...listening, ...grammar, ...vocabulary, ...reading];
}

const expandedQuestionsByLevel = Object.fromEntries(
  (["elementary-low", "elementary-mid", "elementary-high", "middle-1", "middle-2", "middle-3", "high"] as BankLevelId[])
    .map((level) => [level, buildExpandedQuestions(level)]),
) as Record<BankLevelId, Question[]>;

function dateKey() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

function hashSeed(value: string) {
  return [...value].reduce((seed, char) => ((seed * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

function seededShuffle<T>(items: T[], seedValue: string) {
  let seed = hashSeed(seedValue);
  const result = [...items];
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function daySerial(today: string, attempt = 0) {
  const [year, month, day] = today.split("-").map(Number);
  // Advance exactly one question block per calendar day. The previous
  // `day * 100000` value often became a multiple of middle-school pool sizes,
  // so the modulo operation returned the same starting question every day.
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000) + attempt;
}

function rotateOptions(question: Question, seedValue: string) {
  const indexed = question.options.map((text, index) => ({ text, correct: index === question.answer }));
  const shuffled = seededShuffle(indexed, seedValue);
  return {
    ...question,
    options: shuffled.map((item) => item.text),
    answer: shuffled.findIndex((item) => item.correct),
  };
}

const dailyMissionThemes = ["학교생활", "친구와 대화", "과학 탐구", "환경 보호", "건강 습관", "여행", "문화", "디지털 생활", "스포츠", "진로", "독서", "일상생활"];
const dailyMissionModes = ["핵심 찾기", "문맥 추론", "실전 적용", "개념 확인"];
const dailyMissionFrames = [
  "핵심 단서를 먼저 찾고 해결하세요.",
  "문장 전체의 흐름을 확인한 뒤 답하세요.",
  "정답의 근거가 되는 표현을 찾아보세요.",
  "비슷해 보이는 오답의 차이를 구별하세요.",
  "배운 규칙을 새로운 상황에 적용해 보세요.",
  "앞뒤 문맥을 연결하여 가장 자연스러운 답을 고르세요.",
  "문장의 목적과 상황을 함께 생각해 보세요.",
  "한 번 더 검토하며 정확한 근거를 선택하세요.",
];

// A source item can only return after every item in its skill pool has been
// used. When it eventually returns, rotate every matching context token across
// the prompt, passage, audio, and choices together. This keeps the answer
// relationship intact while producing a genuinely different situation rather
// than merely shuffling the same four choices.
const coherentVariantGroups = [
  ["Kevin", "Daniel", "Eric", "Ben", "Tom", "Alex", "David", "Minsu"],
  ["Mina", "Ella", "Nari", "Sora", "Emma", "Sarah", "Julia", "Lucy"],
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  ["library", "classroom", "gym", "park", "museum", "cafeteria", "community center", "science room"],
  ["morning", "afternoon", "evening"],
  ["project", "assignment", "presentation", "report"],
  ["students", "learners", "club members", "classmates"],
];

type BilingualConcept = { en: string; ko: string; koNoun?: string };
const elementaryConceptGroups: BilingualConcept[][] = [
  [
    { en: "apple", ko: "사과" },
    { en: "milk", ko: "우유" },
    { en: "water", ko: "물" },
    { en: "juice", ko: "주스" },
  ],
  [
    { en: "book", ko: "책" },
    { en: "pencil", ko: "연필" },
    { en: "bag", ko: "가방" },
    { en: "ball", ko: "공" },
  ],
  [
    { en: "dog", ko: "강아지" },
    { en: "cat", ko: "고양이" },
    { en: "bird", ko: "새" },
    { en: "rabbit", ko: "토끼" },
  ],
  [
    { en: "school", ko: "학교" },
    { en: "park", ko: "공원" },
    { en: "library", ko: "도서관" },
    { en: "museum", ko: "박물관" },
  ],
  [
    { en: "red", ko: "빨간", koNoun: "빨간색" },
    { en: "blue", ko: "파란", koNoun: "파란색" },
    { en: "green", ko: "초록", koNoun: "초록색" },
    { en: "yellow", ko: "노란", koNoun: "노란색" },
  ],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rotateContext(value: string | undefined, variantIndex: number, seedValue: string) {
  if (!value) return value;
  return coherentVariantGroups.reduce((result, group, groupIndex) => {
    const offset = 1 + (hashSeed(`${seedValue}-${groupIndex}-${variantIndex}`) % (group.length - 1));
    const pattern = new RegExp(`\\b(${group.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|")})\\b`, "g");
    return result.replace(pattern, (match) => {
      const index = group.indexOf(match);
      return index < 0 ? match : group[(index + offset) % group.length];
    });
  }, value);
}

function rotateElementaryConcepts(value: string | undefined, variantIndex: number, seedValue: string) {
  if (!value || !seedValue.startsWith("elementary-")) return value;
  return elementaryConceptGroups.reduce((result, group, groupIndex) => {
    const offset = 1 + (hashSeed(`${seedValue}-elementary-${groupIndex}-${variantIndex}`) % (group.length - 1));
    const tokenOwners = new Map<string, { conceptIndex: number; form: "en" | "ko" | "koNoun" }>();
    group.forEach((concept, conceptIndex) => {
      tokenOwners.set(concept.en, { conceptIndex, form: "en" });
      tokenOwners.set(concept.ko, { conceptIndex, form: "ko" });
      if (concept.koNoun) tokenOwners.set(concept.koNoun, { conceptIndex, form: "koNoun" });
    });
    const tokens = [...tokenOwners.keys()].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(tokens.map((token) => /^[a-z]+$/i.test(token) ? `\\b${escapeRegExp(token)}\\b` : escapeRegExp(token)).join("|"), "gi");
    return result.replace(pattern, (match) => {
      const owner = tokenOwners.get(match.toLowerCase()) ?? tokenOwners.get(match);
      if (!owner) return match;
      const target = group[(owner.conceptIndex + offset) % group.length];
      if (owner.form === "koNoun") return target.koNoun ?? `${target.ko}색`;
      if (owner.form === "ko") return target.ko;
      const replacement = target.en;
      return match[0] === match[0]?.toUpperCase() ? `${replacement[0].toUpperCase()}${replacement.slice(1)}` : replacement;
    });
  }, value);
}

function applyDailyVariant(question: Question, seedValue: string, variantIndex: number) {
  const theme = dailyMissionThemes[variantIndex % dailyMissionThemes.length];
  const mode = dailyMissionModes[Math.floor(variantIndex / dailyMissionThemes.length) % dailyMissionModes.length];
  const frame = dailyMissionFrames[variantIndex % dailyMissionFrames.length];

  // 문제 안의 낱말을 기계적으로 바꾸면 한국어 조사(을/를, 이/가)가
  // 틀리거나 장소와 행동이 맞지 않는 문장이 생길 수 있습니다. 매일 다른
  // 문항은 날짜별 순환으로 선택하고, 검수된 원문·음원·정답 관계는 그대로
  // 보존합니다. 안내 문구와 보기 순서만 날짜 씨드에 따라 달라집니다.
  return {
    ...question,
    prompt: `[${theme} · ${mode}] ${frame} ${question.prompt}`,
  };
}

function isValidQuestion(question: Question) {
  return question.options.length === 4
    && question.answer >= 0
    && question.answer < question.options.length
    && new Set(question.options.map((option) => option.trim())).size === question.options.length
    && Boolean(question.prompt.trim());
}

function questionSignature(question: Question) {
  return [question.skill, question.prompt, question.audio ?? "", question.passage ?? ""].join("|").toLowerCase().replace(/\s+/g, " ").trim();
}

function takeWithoutRepeating(pool: Question[], count: number, serial: number, seedValue: string) {
  const validPool = [...new Map(pool.filter(isValidQuestion).map((question) => [questionSignature(question), question])).values()];
  if (!validPool.length) return [];
  // Use one stable order as a circular queue. Consecutive attempts advance by
  // exactly `count`, so no source question can reappear until every question
  // for that skill has been used once.
  const orderedPool = seededShuffle(validPool, `${seedValue}-base-order`);
  const chosen: Question[] = [];
  // Always return the requested number of items. When a small legacy pool has
  // fewer items, continue through the next variant cycle instead of silently
  // shortening the test.
  for (let slot = 0; slot < count; slot += 1) {
    const absoluteIndex = serial * count + slot;
    const cycle = Math.floor(absoluteIndex / orderedPool.length);
    const question = orderedPool[absoluteIndex % orderedPool.length];
    const variantIndex = cycle % 48;
    const variantSeed = `${seedValue}-cycle-${cycle}-variant-${variantIndex}`;
    chosen.push(rotateOptions(applyDailyVariant(question, variantSeed, variantIndex), `${variantSeed}-options`));
  }
  return chosen;
}

function seededQuestions(levelId: LevelId, today: string, attempt: number) {
  const bankLevel: BankLevelId = levelId.startsWith("high-") ? "high" : levelId as BankLevelId;
  // 고등 문제의 변별력은 유지하되 고난도 전용 문항 비중을 절반으로 낮춰
  // 매일 학습용 테스트가 과도하게 어렵지 않도록 조정합니다.
  const difficultyPool = levelId.startsWith("high-")
    ? highDifficultyQuestions[levelId as keyof typeof highDifficultyQuestions]
    : [];
  const pool = [...dailySets[bankLevel].flatMap((set) => set.questions), ...extraQuestions[bankLevel], ...additionalListeningQuestions[bankLevel], ...(grammarQuestions[bankLevel] ?? []), ...supplementaryQuestions[bankLevel], ...antiRepeatQuestions[bankLevel], ...(bankLevel === "elementary-low" ? elementaryLowExpandedQuestions : expandedQuestionsByLevel[bankLevel]), ...difficultyPool];
  const serial = daySerial(today, attempt);
  const promptVersion = hashSeed(DAILY_MINI_TEST_AUTHORING_PROMPT);
  // 초등 저학년은 부담을 낮춘 9문항(듣기·단어·리딩 각 3문항),
  // 나머지 과정은 12문항(Listening 4 + Grammar 4 + Reading 4)으로 고정합니다.
  const selected = levelId === "elementary-low"
    ? [
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "듣기"), 3, serial, `${levelId}-듣기-${promptVersion}`),
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "단어"), 3, serial, `${levelId}-단어-${promptVersion}`),
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "리딩"), 3, serial, `${levelId}-리딩-${promptVersion}`),
      ]
    : [
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "듣기"), 4, serial, `${levelId}-듣기-${promptVersion}`),
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "문법"), 4, serial, `${levelId}-문법-${promptVersion}`),
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "단어"), 1, serial, `${levelId}-리딩문맥어휘-${promptVersion}`),
        ...takeWithoutRepeating(pool.filter((question) => question.skill === "리딩"), 3, serial, `${levelId}-리딩독해-${promptVersion}`),
      ];
  return seededShuffle(selected, `${today}-${attempt}-${levelId}-${promptVersion}-question-order`);
}

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);
}

export function DailyMiniTest() {
  const content = useLandingContent();
  const [levelId, setLevelId] = useState<LevelId>("elementary-low");
  const [attemptSerial, setAttemptSerial] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [resultSaved, setResultSaved] = useState(false);
  const [resultSaving, setResultSaving] = useState(false);
  const [resultConsent, setResultConsent] = useState(false);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const audioElements = useRef<Record<number, HTMLAudioElement | null>>({});
  const today = dateKey();
  const questions = useMemo(() => seededQuestions(levelId, today, attemptSerial), [levelId, today, attemptSerial]);
  const level = levels.find((item) => item.id === levelId) ?? levels[0];
  const score = questions.filter((question, index) => answers[index] === question.answer).length;
  const totals = (skill: Question["skill"]) => {
    const indexed = questions.map((question, index) => ({ question, index })).filter((item) => item.question.skill === skill);
    const correct = indexed.filter((item) => answers[item.index] === item.question.answer).length;
    return { total: indexed.length, correct, wrong: Math.max(indexed.length - correct, 0) };
  };
  const listening = totals("듣기");
  const vocabulary = totals("단어");
  const grammar = totals("문법");
  const reading = totals("리딩");
  const wrongTotal = Math.max(questions.length - score, 0);
  const percentageScore = questions.length ? Math.round((score / questions.length) * 100) : 0;

  function createNextAttempt(targetLevel: LevelId) {
    // Attempts are scoped to the date. This prevents an old or abnormally
    // large saved counter from affecting today's question selection.
    const storageKey = `beolgyo-daily-attempt-${today}-${targetLevel}`;
    try {
      const stored = window.localStorage.getItem(storageKey);
      const saved = stored === null ? -1 : Number(stored);
      const previous = Number.isSafeInteger(saved) && saved >= -1 ? saved : -1;
      const next = previous + 1;
      window.localStorage.setItem(storageKey, String(next));
      setAttemptSerial(next);
    } catch {
      setAttemptSerial((previous) => previous + 1);
    }
  }

  useEffect(() => {
    createNextAttempt(levelId);
  }, [levelId]);

  function changeLevel(next: LevelId) {
    setLevelId(next);
    setAnswers({});
    setCompleted(false);
    setShareMessage("");
    setResultSaved(false);
    setResultConsent(false);
  }

  async function playAudio(text: string, questionIndex?: number) {
    const source = audioSources[text];
    const speakWithDevice = () => {
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
        setShareMessage("음원을 재생하지 못했습니다. 인터넷 연결과 미디어 음량을 확인해 주세요.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.82;
      utterance.onend = () => setShareMessage("듣기 재생이 끝났습니다. 필요하면 다시 들을 수 있습니다.");
      utterance.onerror = () => setShareMessage("음원을 재생하지 못했습니다. 미디어 음량을 확인한 후 다시 눌러 주세요.");
      window.speechSynthesis.speak(utterance);
      setShareMessage("영어 문장을 재생하고 있습니다. 휴대폰 미디어 음량을 확인해 주세요.");
    };
    const serverSource = `/api/tts?text=${encodeURIComponent(text.replace(/\s+/g, " ").trim())}`;
    try {
      audioPlayer.current?.pause();
      window.speechSynthesis?.cancel();
      const player = questionIndex === undefined ? new Audio(source ?? serverSource) : audioElements.current[questionIndex] ?? new Audio(source ?? serverSource);
      if (player.currentTime > 0) player.currentTime = 0;
      player.preload = "auto";
      player.volume = 1;
      audioPlayer.current = player;
      player.onended = () => setShareMessage("듣기 재생이 끝났습니다. 필요하면 다시 들을 수 있습니다.");
      player.onerror = () => {
        audioPlayer.current = null;
        if (source) {
          const fallbackPlayer = new Audio(serverSource);
          fallbackPlayer.preload = "auto";
          fallbackPlayer.volume = 1;
          audioPlayer.current = fallbackPlayer;
          fallbackPlayer.onended = () => setShareMessage("듣기 재생이 끝났습니다. 필요하면 다시 들을 수 있습니다.");
          fallbackPlayer.onerror = () => { audioPlayer.current = null; speakWithDevice(); };
          void fallbackPlayer.play().catch(speakWithDevice);
        } else {
          speakWithDevice();
        }
      };
      await player.play();
      setShareMessage("영어 문장을 재생하고 있습니다. 휴대폰 미디어 음량을 확인해 주세요.");
    } catch {
      speakWithDevice();
    }
  }

  const templateValues = {
    학생명: studentName || "학생",
    날짜: today,
    단계: level.label,
    점수: String(score),
    총점: String(questions.length),
    링크: "https://vercel-deploy-mauve-one-18.vercel.app/academy#daily-mini-test",
  };
  const shareText = fillTemplate(content.dailyKakaoMessage, templateValues);
  const compactAreas = [
    `단어 ${vocabulary.correct}/${vocabulary.total}(오답${vocabulary.wrong})`,
    ...(grammar.total > 0 ? [`문법 ${grammar.correct}/${grammar.total}(오답${grammar.wrong})`] : []),
    `듣기 ${listening.correct}/${listening.total}(오답${listening.wrong})`,
    `리딩 ${reading.correct}/${reading.total}(오답${reading.wrong})`,
  ].join(" · ");
  const smsText = `[벌교미래엔영어]
${studentName || "학생"} 학생 DAILY 결과
${compactAreas}
전체 ${score}/${questions.length}(오답${wrongTotal}) · ${percentageScore}점

오늘도 끝까지 풀어낸 모습이 대견합니다.
오답은 부담 없이 이해하도록 따뜻하게 지도하겠습니다^^`;

  function sendSms() {
    if (!phone.trim()) return setShareMessage("학부모 연락처를 입력해 주세요.");
    window.location.href = `sms:${phone}?&body=${encodeURIComponent(smsText)}`;
  }

  async function saveDailyResult() {
    if (!studentName.trim() || !phone.trim()) return setShareMessage("학생 이름과 연락처를 입력해 주세요.");
    if (!resultConsent) return setShareMessage("결과 저장 및 이메일 알림을 위한 개인정보 수집·이용에 동의해 주세요.");
    setResultSaving(true);
    const response = await fetch("/api/daily-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testDate: today, studentName, phone, levelId, levelLabel: level.label, score, total: questions.length,
        listening: listening.correct, listeningTotal: listening.total,
        vocabulary: vocabulary.correct, vocabularyTotal: vocabulary.total,
        grammar: grammar.correct, grammarTotal: grammar.total,
        reading: reading.correct, readingTotal: reading.total,
      }),
    });
    const result = await response.json().catch(() => ({})) as { emailSent?: boolean; emailMessage?: string };
    if (!response.ok) {
      setResultSaving(false);
      return setShareMessage("결과 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    const emailSent = Boolean(result.emailSent);
    const emailMessage = result.emailMessage;
    setResultSaving(false);
    setResultSaved(true);
    setShareMessage(emailSent
      ? "결과가 저장되고 학원 카카오메일로 완료 알림을 전송했습니다."
      : `결과는 저장됐지만 카카오메일 알림을 보내지 못했습니다. ${emailMessage || "관리자페이지에서 결과를 확인해 주세요."}`);
  }

  function shareKakao() {
    const kakao = window.Kakao;
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!kakaoKey) {
      setShareMessage("카카오 디벨로퍼스 JavaScript 키 연결이 필요합니다.");
      return;
    }
    if (!kakao) {
      setShareMessage("카카오톡 공유 기능을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
      return;
    }
    try {
      if (!kakao.isInitialized()) kakao.init(kakaoKey);
      const landingUrl = "https://vercel-deploy-mauve-one-18.vercel.app/academy#daily-mini-test";
      kakao.Share.sendDefault({
        objectType: "text",
        text: shareText.slice(0, 200),
        link: { mobileWebUrl: landingUrl, webUrl: landingUrl },
        buttonTitle: "벌교미래엔영어홈페이지보기",
      });
      setShareMessage("카카오톡에서 친구 또는 채팅방을 선택해 보내 주세요.");
    } catch (error) {
      console.error("Kakao Share failed", error);
      setShareMessage("카카오톡 친구 선택창을 열지 못했습니다. 카카오 앱 설정을 확인해 주세요.");
    }
  }

  return (
    <section className="daily-test-section" id="daily-mini-test">
      <div className="daily-test-heading">
        <div><p className="section-label">DAILY ENGLISH MINI TEST</p><h2>매일 영역별 3문제로 만드는<br /><strong>영어 학습 습관</strong></h2></div>
        <p>초등 저학년은 듣기·단어·리딩 각 3문제, 나머지 단계는 문법 3문제를 더해 하루 총 12문제를 풉니다. 날짜와 단계에 따라 문제 순서가 매일 자동 변경됩니다.</p>
      </div>
      <div className="daily-levels" role="tablist" aria-label="DAILY 테스트 단계">
        {levels.map((item) => <button type="button" role="tab" aria-selected={levelId === item.id} className={levelId === item.id ? "active" : ""} onClick={() => changeLevel(item.id)} key={item.id}><b>{item.label}</b><small>{item.description}</small></button>)}
      </div>
      <div className="daily-test-card">
        <header><div><span>{today}</span><h3>{level.label} · 오늘의 영역별 미니테스트</h3></div><strong>DAILY {questions.length}</strong></header>
        <div className="daily-questions">
          {questions.map((question, index) => (
            <article className={completed ? (answers[index] === question.answer ? "correct" : "wrong") : ""} key={`${levelId}-${today}-${index}`}>
              <div className="daily-question-top"><span>{question.skill}</span><b>0{index + 1}</b></div>
              {question.audio && <div className="daily-audio-wrap"><button className="daily-audio" type="button" onClick={() => playAudio(question.audio!, index)}>▶ 영어 문장 듣기 <small>필요하면 다시 들으세요</small></button><audio className="daily-audio-player" controls preload="metadata" ref={(element) => { audioElements.current[index] = element; }} src={audioSources[question.audio] ?? `/api/tts?text=${encodeURIComponent(question.audio.replace(/\s+/g, " ").trim())}`} onPlay={(event) => { if (audioPlayer.current && audioPlayer.current !== event.currentTarget) audioPlayer.current.pause(); audioPlayer.current = event.currentTarget; setShareMessage("영어 문장을 재생하고 있습니다. 휴대폰 미디어 음량을 확인해 주세요."); }} onEnded={() => setShareMessage("듣기 재생이 끝났습니다. 필요하면 다시 들을 수 있습니다.")} onError={() => setShareMessage("음원을 불러오지 못했습니다. 인터넷 연결을 확인한 후 다시 눌러 주세요.")}>영어 듣기 음원을 재생할 수 없습니다.</audio></div>}
              {question.passage && <p className="daily-passage">{question.passage}</p>}
              <h4>{question.prompt}</h4>
              <div className="daily-options">{question.options.map((option, optionIndex) => <button type="button" disabled={completed} className={answers[index] === optionIndex ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} key={option}><span>{optionIndex + 1}</span>{option}</button>)}</div>
              {completed && <p className="daily-answer">{answers[index] === question.answer ? "정답입니다!" : `정답: ${question.options[question.answer]}`}</p>}
            </article>
          ))}
        </div>
        <div className="daily-test-actions">
          {!completed ? <button className="daily-submit" type="button" disabled={Object.keys(answers).length !== questions.length} onClick={() => setCompleted(true)}>오늘의 결과 확인하기 <span>→</span></button> : <>
            <div className="daily-score"><span>오늘의 점수</span><strong>{score}<small>/ {questions.length}</small></strong><button type="button" onClick={() => { createNextAttempt(levelId); setAnswers({}); setCompleted(false); setResultSaved(false); }}>새 문제 풀기</button></div>
            <div className="daily-result-info"><input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="학생 이름" aria-label="학생 이름" disabled={resultSaved} /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="학부모 연락처" type="tel" aria-label="학부모 연락처" disabled={resultSaved} /><button type="button" onClick={saveDailyResult} disabled={resultSaving || resultSaved}>{resultSaved ? "결과 저장 완료" : resultSaving ? "저장 중…" : "결과 저장하기"}</button></div>
            <label className="daily-result-consent"><input type="checkbox" checked={resultConsent} onChange={(event) => setResultConsent(event.target.checked)} disabled={resultSaved} /><span>결과 저장, 상담 및 학원 이메일 완료 알림을 위한 개인정보 수집·이용에 동의합니다.</span></label>
            {!resultSaved && <p className="daily-save-note">휴대폰 번호를 끝까지 입력한 뒤 ‘결과 저장하기’를 눌러 주세요.</p>}
          </>}
          <div className="daily-share"><button type="button" onClick={sendSms} disabled={!completed}>문자로 보내기</button><button type="button" onClick={shareKakao} disabled={!completed}>카톡 보내기</button></div>
          {shareMessage && <p role="status">{shareMessage}</p>}
        </div>
      </div>
    </section>
  );
}
