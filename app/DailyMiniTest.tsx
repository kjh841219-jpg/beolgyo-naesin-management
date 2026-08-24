"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLandingContent } from "./useLandingContent";
import { sendTestEmailNotification } from "./test-email";
import { DAILY_MINI_TEST_AUTHORING_PROMPT } from "./daily-mini-test-prompt";

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
  return (Math.floor(Date.UTC(year, month - 1, day) / 86400000) * 100000) + attempt;
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

function applyDailyVariant(question: Question, _seedValue: string, variantIndex: number) {
  const theme = dailyMissionThemes[variantIndex % dailyMissionThemes.length];
  const mode = dailyMissionModes[Math.floor(variantIndex / dailyMissionThemes.length) % dailyMissionModes.length];

  // Never rewrite words inside the passage, audio, or choices. Replacing a
  // colour, number, person, place, or object in only part of a question can
  // remove the correct answer from the choices (for example orange vs. Red).
  // Variety comes from the question bank and selection order instead.
  return {
    ...question,
    prompt: `[${theme} · ${mode}] ${question.prompt}`,
    options: [...question.options],
  };
}

function takeWithoutRepeating(pool: Question[], count: number, serial: number, seedValue: string) {
  if (!pool.length) return [];
  // Use one stable order as a circular queue. Consecutive attempts advance by
  // exactly `count`, so no source question can reappear until every question
  // for that skill has been used once.
  const orderedPool = seededShuffle(pool, `${seedValue}-base-order`);
  const chosen: Question[] = [];
  for (let slot = 0; slot < Math.min(count, pool.length); slot += 1) {
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
  const difficultyPool = levelId.startsWith("high-") ? highDifficultyQuestions[levelId as keyof typeof highDifficultyQuestions] : [];
  const pool = [...dailySets[bankLevel].flatMap((set) => set.questions), ...extraQuestions[bankLevel], ...additionalListeningQuestions[bankLevel], ...(grammarQuestions[bankLevel] ?? []), ...supplementaryQuestions[bankLevel], ...difficultyPool];
  const serial = daySerial(today, attempt);
  const promptVersion = hashSeed(DAILY_MINI_TEST_AUTHORING_PROMPT);
  const skills: Question["skill"][] = ["듣기", "단어", "문법", "리딩"];
  const selected = skills.flatMap((skill) =>
    takeWithoutRepeating(
      pool.filter((question) => question.skill === skill),
      3,
      serial,
      `${levelId}-${skill}-${promptVersion}`,
    ),
  );
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

  async function playAudio(text: string) {
    const source = audioSources[text];
    if (!source) {
      if (!("speechSynthesis" in window)) return setShareMessage("이 기기에서는 듣기 재생을 지원하지 않습니다.");
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.82;
      utterance.onend = () => setShareMessage("듣기 재생이 끝났습니다. 필요하면 다시 들을 수 있습니다.");
      window.speechSynthesis.speak(utterance);
      setShareMessage("오늘의 새로운 영어 문장을 재생하고 있습니다.");
      return;
    }
    try {
      audioPlayer.current?.pause();
      const player = new Audio(source);
      player.preload = "auto";
      player.volume = 1;
      audioPlayer.current = player;
      player.onended = () => setShareMessage("듣기 재생이 끝났습니다. 필요하면 다시 들을 수 있습니다.");
      player.onerror = () => setShareMessage("음원을 불러오지 못했습니다. 인터넷 연결을 확인한 후 다시 눌러 주세요.");
      await player.play();
      setShareMessage("영어 문장을 재생하고 있습니다. 휴대폰 미디어 음량을 확인해 주세요.");
    } catch {
      setShareMessage("재생이 차단되었습니다. 휴대폰 무음 모드를 해제하고 듣기 버튼을 다시 눌러 주세요.");
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
    if (!response.ok) {
      setResultSaving(false);
      return setShareMessage("결과 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    let emailSent = false;
    try {
      await sendTestEmailNotification({
        email: content.notificationEmail,
        kind: "DAILY 미니테스트",
        studentName,
        phone,
        date: today,
        level: level.label,
        score,
        total: questions.length,
        details: `듣기 ${listening.correct}/${listening.total} · 단어 ${vocabulary.correct}/${vocabulary.total}${grammar.total ? ` · 문법 ${grammar.correct}/${grammar.total}` : ""} · 리딩 ${reading.correct}/${reading.total}`,
      });
      emailSent = true;
    } catch {
      // The test result remains stored even if the optional email service is delayed.
    }
    setResultSaving(false);
    setResultSaved(true);
    setShareMessage(emailSent ? "결과가 저장되고 학원 카카오 이메일로 완료 알림을 전송했습니다." : "결과가 저장되었습니다. 이메일 알림이 지연되어 관리자페이지에서 바로 확인해 주세요.");
  }

  async function shareKakao() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "DAILY 영어 미니테스트", text: shareText, url: "https://vercel-deploy-mauve-one-18.vercel.app/academy#daily-mini-test" });
        setShareMessage("공유 화면에서 카카오톡을 선택해 전송하세요.");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareMessage("내용을 복사했습니다. 카카오톡 채팅방에 붙여넣어 주세요.");
      }
    } catch {
      setShareMessage("공유가 취소되었습니다.");
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
              {question.audio && <button className="daily-audio" type="button" onClick={() => playAudio(question.audio!)}>▶ 영어 문장 듣기 <small>필요하면 다시 들으세요</small></button>}
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
          <div className="daily-share"><button type="button" onClick={sendSms} disabled={!completed}>문자로 보내기</button><button type="button" onClick={shareKakao} disabled={!completed}>카카오톡으로 공유</button></div>
          {shareMessage && <p role="status">{shareMessage}</p>}
        </div>
      </div>
    </section>
  );
}
