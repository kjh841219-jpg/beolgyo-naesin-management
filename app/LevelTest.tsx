"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLandingContent } from "./useLandingContent";
import { sendTestEmailNotification } from "./test-email";

type Skill = "어휘" | "문법" | "리딩";
type TrackId = "phonics" | "elementary-lower" | "elementary-upper" | "middle-1" | "middle-2" | "middle-3";

type Question = {
  skill: Skill;
  question: string;
  passage?: string;
  options: string[];
  answer: number;
};

type Track = {
  id: TrackId;
  group: "초등" | "중등";
  label: string;
  description: string;
  nextLevel: string;
  questions: Question[];
};

const tracks: Track[] = [
  {
    id: "phonics",
    group: "초등",
    label: "초등 파닉스",
    description: "알파벳 소리와 쉬운 단어 읽기",
    nextLevel: "초등 저학년 기초",
    questions: [
      { skill: "어휘", question: "Which word starts with the /b/ sound?", options: ["ball", "cat", "sun", "fish"], answer: 0 },
      { skill: "어휘", question: "Which word rhymes with ‘cat’?", options: ["hat", "dog", "pen", "cup"], answer: 0 },
      { skill: "어휘", question: "‘사과’에 해당하는 영어 단어는 무엇인가요?", options: ["apple", "table", "water", "school"], answer: 0 },
      { skill: "어휘", question: "What is the first sound in ‘moon’?", options: ["/m/", "/n/", "/b/", "/s/"], answer: 0 },
      { skill: "문법", question: "I ___ happy.", options: ["am", "is", "are", "be"], answer: 0 },
      { skill: "문법", question: "This ___ a book.", options: ["is", "are", "am", "be"], answer: 0 },
      { skill: "문법", question: "고양이 두 마리를 바르게 나타낸 것은?", options: ["two cats", "two cat", "two cates", "two cat's"], answer: 0 },
      { skill: "리딩", passage: "I see a red dog.", question: "What color is the dog?", options: ["red", "blue", "black", "white"], answer: 0 },
      { skill: "리딩", passage: "Tom has a big hat.", question: "What does Tom have?", options: ["a hat", "a bag", "a cat", "a pen"], answer: 0 },
      { skill: "리딩", passage: "The sun is hot.", question: "What is hot?", options: ["the sun", "the moon", "the water", "the snow"], answer: 0 },
    ],
  },
  {
    id: "elementary-lower",
    group: "초등",
    label: "초등 저학년",
    description: "기초 어휘와 짧은 문장 이해",
    nextLevel: "초등 고학년 기초",
    questions: [
      { skill: "어휘", question: "Choose the opposite of ‘big’.", options: ["small", "long", "fast", "warm"], answer: 0 },
      { skill: "어휘", question: "Which one do you use to write?", options: ["pencil", "plate", "shoe", "clock"], answer: 0 },
      { skill: "어휘", question: "‘배고픈’이라는 뜻의 단어는?", options: ["hungry", "happy", "pretty", "busy"], answer: 0 },
      { skill: "어휘", question: "Which word means ‘도서관’?", options: ["library", "hospital", "market", "station"], answer: 0 },
      { skill: "문법", question: "She ___ my friend.", options: ["is", "are", "am", "be"], answer: 0 },
      { skill: "문법", question: "We ___ soccer after school.", options: ["play", "plays", "playing", "played"], answer: 0 },
      { skill: "문법", question: "Choose the correct sentence.", options: ["He likes milk.", "He like milk.", "He liking milk.", "He is like milk."], answer: 0 },
      { skill: "리딩", passage: "Mina gets up at seven. She eats bread and goes to school.", question: "What does Mina eat?", options: ["bread", "rice", "fruit", "cake"], answer: 0 },
      { skill: "리딩", passage: "Ben has a small puppy. Its name is Coco. Coco likes to run.", question: "What does Coco like to do?", options: ["run", "sleep", "swim", "sing"], answer: 0 },
      { skill: "리딩", passage: "It is rainy today. Jisu takes her umbrella.", question: "Why does Jisu take an umbrella?", options: ["It is rainy.", "It is sunny.", "It is snowy.", "It is windy."], answer: 0 },
    ],
  },
  {
    id: "elementary-upper",
    group: "초등",
    label: "초등 고학년",
    description: "문장 확장과 짧은 글의 핵심 파악",
    nextLevel: "중등 1학년 기초",
    questions: [
      { skill: "어휘", question: "‘borrow’의 뜻으로 알맞은 것은?", options: ["빌리다", "돌려주다", "만들다", "선택하다"], answer: 0 },
      { skill: "어휘", question: "Choose the word closest to ‘important’.", options: ["necessary", "tiny", "quiet", "empty"], answer: 0 },
      { skill: "어휘", question: "What does ‘arrive’ mean?", options: ["도착하다", "출발하다", "기다리다", "방문하다"], answer: 0 },
      { skill: "어휘", question: "Choose the opposite of ‘early’.", options: ["late", "quick", "first", "soon"], answer: 0 },
      { skill: "문법", question: "Yesterday, I ___ my grandmother.", options: ["visited", "visit", "visits", "visiting"], answer: 0 },
      { skill: "문법", question: "A lion is ___ than a cat.", options: ["bigger", "big", "biggest", "more big"], answer: 0 },
      { skill: "문법", question: "I will call you ___ I get home.", options: ["when", "but", "because of", "than"], answer: 0 },
      { skill: "리딩", passage: "Sora wanted to help the environment. She started using a reusable bottle instead of buying plastic bottles.", question: "Why did Sora use a reusable bottle?", options: ["To help the environment", "To buy more water", "To share with friends", "To make juice"], answer: 0 },
      { skill: "리딩", passage: "Kevin missed the bus, so he walked to school. He arrived ten minutes late.", question: "How did Kevin go to school?", options: ["He walked.", "He took a taxi.", "He rode a bike.", "He took the bus."], answer: 0 },
      { skill: "리딩", passage: "The school festival begins at 10 a.m. Students should meet in the gym by 9:30 a.m.", question: "Where should students meet?", options: ["In the gym", "In the library", "At the gate", "In the classroom"], answer: 0 },
    ],
  },
  {
    id: "middle-1",
    group: "중등",
    label: "중등 1학년",
    description: "중1 핵심 어휘·문법·독해",
    nextLevel: "중등 2학년 기초",
    questions: [
      { skill: "어휘", question: "‘invite’의 뜻은 무엇인가요?", options: ["초대하다", "소개하다", "발견하다", "설명하다"], answer: 0 },
      { skill: "어휘", question: "Choose the word closest to ‘different’.", options: ["not the same", "very easy", "full of care", "almost ready"], answer: 0 },
      { skill: "어휘", question: "What does ‘solve’ mean?", options: ["해결하다", "발생하다", "보호하다", "수집하다"], answer: 0 },
      { skill: "어휘", question: "Choose the correct meaning of ‘enough’.", options: ["충분한", "부족한", "특별한", "비슷한"], answer: 0 },
      { skill: "문법", question: "Look! The children ___ in the park.", options: ["are running", "run", "ran", "runs"], answer: 0 },
      { skill: "문법", question: "My father ___ dinner last night.", options: ["cooked", "cooks", "is cooking", "cook"], answer: 0 },
      { skill: "문법", question: "I want ___ a scientist.", options: ["to be", "be", "being", "am"], answer: 0 },
      { skill: "리딩", passage: "Leo joined the school music club because he wanted to learn the guitar. At first, playing chords was difficult, but he practiced every day.", question: "Why did Leo join the club?", options: ["To learn the guitar", "To meet a singer", "To buy an instrument", "To teach music"], answer: 0 },
      { skill: "리딩", passage: "The museum is closed on Mondays. It opens from 9 a.m. to 5 p.m. on other weekdays.", question: "When is the museum closed?", options: ["On Mondays", "Every morning", "On Fridays", "At 9 a.m."], answer: 0 },
      { skill: "리딩", passage: "Yuna felt nervous before her speech. She took a deep breath and looked at her friends. Their smiles helped her begin.", question: "What helped Yuna begin her speech?", options: ["Her friends’ smiles", "A new microphone", "Her teacher’s note", "A short break"], answer: 0 },
    ],
  },
  {
    id: "middle-2",
    group: "중등",
    label: "중등 2학년",
    description: "중2 핵심 구문과 지문 이해",
    nextLevel: "중등 3학년 기초",
    questions: [
      { skill: "어휘", question: "Choose the meaning of ‘achieve’.", options: ["성취하다", "피하다", "비교하다", "포함하다"], answer: 0 },
      { skill: "어휘", question: "What does ‘prevent’ mean?", options: ["막다", "허락하다", "계속하다", "예상하다"], answer: 0 },
      { skill: "어휘", question: "Choose the word closest to ‘reduce’.", options: ["decrease", "create", "repeat", "connect"], answer: 0 },
      { skill: "어휘", question: "‘suggest’와 가장 가까운 뜻은?", options: ["제안하다", "거절하다", "약속하다", "인정하다"], answer: 0 },
      { skill: "문법", question: "This bridge ___ in 1995.", options: ["was built", "built", "is building", "has build"], answer: 0 },
      { skill: "문법", question: "I ___ this movie three times.", options: ["have seen", "saw", "am seeing", "see"], answer: 0 },
      { skill: "문법", question: "The girl ___ won the contest is my sister.", options: ["who", "which", "where", "what"], answer: 0 },
      { skill: "리딩", passage: "Many cities are adding bike lanes. They can reduce traffic and air pollution, but safe routes and clear rules are also necessary.", question: "What is the main idea?", options: ["Bike lanes have benefits and need safe planning.", "Cars should be removed from every city.", "Bicycles are faster than trains.", "Traffic rules are unnecessary."], answer: 0 },
      { skill: "리딩", passage: "Joon planned to study for one hour, but his phone kept distracting him. He turned it off and finished his work earlier than expected.", question: "How did Joon focus on his work?", options: ["He turned off his phone.", "He studied with music.", "He changed the subject.", "He called a friend."], answer: 0 },
      { skill: "리딩", passage: "Honeybees communicate the location of food through a movement called the waggle dance. The direction and length of the dance give other bees useful information.", question: "What information does the dance communicate?", options: ["Where food is located", "When winter begins", "How large the hive is", "Which bee is the oldest"], answer: 0 },
    ],
  },
  {
    id: "middle-3",
    group: "중등",
    label: "중등 3학년",
    description: "중3 내신·고등 대비 독해 사고력",
    nextLevel: "고등 영어 준비",
    questions: [
      { skill: "어휘", question: "Choose the meaning of ‘despite’.", options: ["~에도 불구하고", "~때문에", "~을 대신하여", "~에 따르면"], answer: 0 },
      { skill: "어휘", question: "What is a ‘consequence’?", options: ["a result", "a method", "a promise", "a beginning"], answer: 0 },
      { skill: "어휘", question: "Choose the word closest to ‘assume’.", options: ["suppose", "prove", "remove", "refuse"], answer: 0 },
      { skill: "어휘", question: "‘maintain’의 뜻으로 알맞은 것은?", options: ["유지하다", "측정하다", "반대하다", "발명하다"], answer: 0 },
      { skill: "문법", question: "If I ___ more time, I would learn another language.", options: ["had", "have", "will have", "am having"], answer: 0 },
      { skill: "문법", question: "___ by the sudden noise, the baby began to cry.", options: ["Surprised", "Surprising", "Surprise", "To surprise"], answer: 0 },
      { skill: "문법", question: "The book, ___ was published last year, became a bestseller.", options: ["which", "what", "who", "where"], answer: 0 },
      { skill: "리딩", passage: "People often believe that multitasking saves time. Research, however, suggests that repeatedly switching between tasks can lower concentration and increase mistakes.", question: "What does the passage suggest?", options: ["Task switching can reduce efficiency.", "Multitasking always saves time.", "Research tasks are easy to switch.", "Mistakes improve concentration."], answer: 0 },
      { skill: "리딩", passage: "A community library extended its weekend hours after surveying local residents. Attendance increased, especially among families and students who could not visit on weekdays.", question: "Why did attendance increase?", options: ["Weekend access became easier.", "The library removed all rules.", "Weekday hours became shorter.", "Residents received free books."], answer: 0 },
      { skill: "리딩", passage: "New technology is valuable not simply because it is new, but because of how thoughtfully it solves real problems. A useful design begins with understanding the people who will use it.", question: "Which statement best expresses the main idea?", options: ["Good technology starts with users’ real needs.", "New products are always useful.", "Design should focus only on appearance.", "Technology can solve every problem."], answer: 0 },
    ],
  },
];

function randomizeQuestions(source: Question[]) {
  const questions = source.map((question) => {
    const options = question.options.map((option, index) => ({ option, isAnswer: index === question.answer }));
    for (let index = options.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [options[index], options[target]] = [options[target], options[index]];
    }
    return { ...question, options: options.map((item) => item.option), answer: options.findIndex((item) => item.isAnswer) };
  });
  for (let index = questions.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [questions[index], questions[target]] = [questions[target], questions[index]];
  }
  return questions;
}

const skillOrder: Skill[] = ["어휘", "문법", "리딩"];

export function LevelTest() {
  const content = useLandingContent();
  const [trackId, setTrackId] = useState<TrackId | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [resultSaving, setResultSaving] = useState(false);
  const [resultSaveMessage, setResultSaveMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [resultConsent, setResultConsent] = useState(false);

  const track = tracks.find((item) => item.id === trackId) ?? null;
  const question = testQuestions[questionIndex];
  const optionOrder = useMemo(() => {
    if (!question || !trackId) return [];
    const shift = (questionIndex * 3 + trackId.length) % question.options.length;
    return question.options
      .map((option, index) => ({ option, index, order: (index + shift) % question.options.length }))
      .sort((a, b) => a.order - b.order);
  }, [question, questionIndex, trackId]);

  const result = useMemo(() => {
    if (!track || !finished) return null;
    const breakdown = skillOrder.map((skill) => {
      const indexedQuestions = testQuestions
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.skill === skill);
      const correct = indexedQuestions.filter(({ item, index }) => answers[index] === item.answer).length;
      return { skill, correct, total: indexedQuestions.length };
    });
    const score = testQuestions.filter((item, index) => answers[index] === item.answer).length;
    return { score, breakdown };
  }, [answers, finished, track, testQuestions]);

  function startTest(id: TrackId) {
    const selectedTrack = tracks.find((item) => item.id === id);
    if (!selectedTrack) return;
    setTrackId(id);
    setTestQuestions(randomizeQuestions(selectedTrack.questions));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setFinished(false);
    setResultSaved(false);
    setResultSaveMessage("");
    setStudentName("");
    setPhone("");
    setResultConsent(false);
  }

  function submitAnswer() {
    if (!track || selectedAnswer === null) return;
    const nextAnswers = [...answers, selectedAnswer];
    setAnswers(nextAnswers);
    setSelectedAnswer(null);
    if (questionIndex === testQuestions.length - 1) {
      setFinished(true);
    } else {
      setQuestionIndex((current) => current + 1);
    }
  }

  function resetTest() {
    setTrackId(null);
    setTestQuestions([]);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setFinished(false);
    setResultSaved(false);
    setResultSaveMessage("");
    setStudentName("");
    setPhone("");
    setResultConsent(false);
  }

  async function saveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!track || !result) return;
    const formData = new FormData(event.currentTarget);
    setResultSaving(true);
    setResultSaveMessage("");
    const response = await fetch("/api/level-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: formData.get("studentName"),
        phone: formData.get("phone"),
        trackId: track.id,
        trackLabel: track.label,
        score: result.score,
        total: testQuestions.length,
        vocabulary: result.breakdown[0]?.correct ?? 0,
        vocabularyTotal: result.breakdown[0]?.total ?? 0,
        grammar: result.breakdown[1]?.correct ?? 0,
        grammarTotal: result.breakdown[1]?.total ?? 0,
        reading: result.breakdown[2]?.correct ?? 0,
        readingTotal: result.breakdown[2]?.total ?? 0,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setResultSaving(false);
    if (!response.ok) {
      setResultSaveMessage(data.message ?? "결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    let emailSent = false;
    try {
      await sendTestEmailNotification({
        email: content.notificationEmail,
        kind: "레벨테스트",
        studentName: String(formData.get("studentName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        date: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
        level: track.label,
        score: result.score,
        total: testQuestions.length,
        details: result.breakdown.map((item) => `${item.skill} ${item.correct}/${item.total}`).join(" · "),
      });
      emailSent = true;
    } catch {
      // The test result remains stored even if the optional email service is delayed.
    }
    setResultSaved(true);
    setResultSaveMessage(emailSent ? "레벨테스트 결과가 저장되고 학원 카카오 이메일로 완료 알림을 전송했습니다." : "레벨테스트 결과가 저장되었습니다. 이메일 알림이 지연되어 관리자페이지에서 바로 확인해 주세요.");
  }

  const resultMessage = result
    ? result.score <= 3
      ? "기초 개념부터 천천히 연결하는 학습이 필요해요."
      : result.score <= 6
        ? "핵심 개념을 보완하면 현재 단계가 훨씬 안정돼요."
        : result.score <= 8
          ? "현재 단계의 기본기가 잘 형성되어 있어요."
          : `${track?.nextLevel}에 도전할 준비가 되어 있어요.`
    : "";

  const report = useMemo(() => {
    if (!result || !track) return null;
    const areas = result.breakdown.map((item) => ({ ...item, percent: Math.round((item.correct / Math.max(item.total, 1)) * 100) }));
    const ranked = [...areas].sort((a, b) => b.percent - a.percent);
    const overall = Math.round((result.score / testQuestions.length) * 100);
    const comment = `${studentName || "학생"} 학생은 ${ranked[0]?.skill ?? "어휘"} 영역에서 가장 안정적인 이해를 보였습니다. ${ranked.at(-1)?.skill ?? "리딩"} 영역은 틀린 문제를 다시 읽고 핵심 근거를 찾는 연습을 꾸준히 하면 더욱 빠르게 성장할 수 있습니다. ${overall >= 80 ? "현재 단계의 기본기가 잘 형성되어 있으므로 정확성을 유지하면서 다음 단계 유형에 도전해도 좋습니다." : overall >= 60 ? "핵심 개념을 조금 더 반복하면 현재 단계의 문제를 훨씬 안정적으로 해결할 수 있습니다." : "부담 없는 기초 문제부터 작은 성공 경험을 쌓으며 어휘와 문장 구조를 차근차근 연결하는 학습을 권합니다."} 결과만을 재촉하기보다 끝까지 문제를 풀어낸 과정을 충분히 칭찬해 주세요.`;
    return { areas, ranked, overall, comment };
  }, [result, studentName, track, testQuestions.length]);

  const reportText = report && result && track
    ? `[벌교미래엔영어] ${studentName || "학생"} 학생 레벨테스트 결과\n단계: ${track.label}\n총점: ${result.score}/${testQuestions.length} (${report.overall}점)\n${report.areas.map((item) => `${item.skill}: ${item.correct}/${item.total}`).join(" · ")}\n\n${report.comment}\n\nhttps://vercel-deploy-mauve-one-18.vercel.app/academy#level-test`
    : "";

  function sendLevelSms() {
    if (!phone.trim()) return setResultSaveMessage("문자를 보낼 학부모 연락처를 입력해 주세요.");
    window.location.href = `sms:${phone}?&body=${encodeURIComponent(reportText)}`;
  }

  async function shareLevelKakao() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "영어 레벨테스트 결과 리포트", text: reportText });
        setResultSaveMessage("공유 화면에서 카카오톡을 선택해 주세요.");
      } else {
        await navigator.clipboard.writeText(reportText);
        setResultSaveMessage("리포트를 복사했습니다. 카카오톡 채팅방에 붙여넣어 주세요.");
      }
    } catch {
      setResultSaveMessage("공유가 취소되었습니다.");
    }
  }

  return (
    <section className="level-test-section" id="level-test">
      <div className="level-test-intro">
        <p className="section-label">FREE LEVEL TEST</p>
        <h2>10문제로 확인하는<br />우리 아이 영어 출발점</h2>
        <p>학년과 현재 학습 단계에 맞는 테스트를 선택하면 어휘·문법·리딩 영역을 간단히 확인할 수 있습니다.</p>
        <div className="test-feature-list">
          <span><b>10</b>문제</span>
          <span><b>3</b>영역 분석</span>
          <span><b>무료</b> 결과 확인</span>
        </div>
        <small>※ 본 테스트는 간단한 자가진단이며, 정확한 학습 단계는 상담과 진단을 통해 확인합니다.</small>
      </div>

      <div className="level-test-panel">
        {!track && (
          <div className="track-picker">
            <div className="test-panel-heading">
              <span>STEP 1</span>
              <h3>테스트할 단계를 선택해 주세요</h3>
              <p>학생의 현재 학년 또는 최근 학습 수준과 가까운 단계를 선택하세요.</p>
            </div>
            <div className="track-group">
              <strong>초등 과정</strong>
              <div className="track-grid">
                {tracks.filter((item) => item.group === "초등").map((item) => (
                  <button key={item.id} type="button" onClick={() => startTest(item.id)}>
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                    <i>→</i>
                  </button>
                ))}
              </div>
            </div>
            <div className="track-group">
              <strong>중등 과정</strong>
              <div className="track-grid">
                {tracks.filter((item) => item.group === "중등").map((item) => (
                  <button key={item.id} type="button" onClick={() => startTest(item.id)}>
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                    <i>→</i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {track && !finished && question && (
          <div className="question-view">
            <div className="test-progress-header">
              <div>
                <button type="button" onClick={resetTest}>← 단계 다시 선택</button>
                <strong>{track.label}</strong>
              </div>
              <span>{questionIndex + 1} / {testQuestions.length}</span>
            </div>
            <div className="progress-track" aria-label={`${testQuestions.length}문제 중 ${questionIndex + 1}번 문제`}>
              <span style={{ width: `${((questionIndex + 1) / testQuestions.length) * 100}%` }} />
            </div>
            <div className="question-card">
              <span className={`skill-chip skill-${question.skill}`}>{question.skill}</span>
              {question.passage && <p className="reading-passage">{question.passage}</p>}
              <h3><b>Q{questionIndex + 1}.</b> {question.question}</h3>
              <div className="answer-grid" role="group" aria-label="답 선택">
                {optionOrder.map(({ option, index }, displayIndex) => (
                  <button
                    key={option}
                    type="button"
                    className={selectedAnswer === index ? "selected" : ""}
                    aria-pressed={selectedAnswer === index}
                    onClick={() => setSelectedAnswer(index)}
                  >
                    <span>{displayIndex + 1}</span>{option}
                  </button>
                ))}
              </div>
            </div>
            <button className="test-next-button" type="button" disabled={selectedAnswer === null} onClick={submitAnswer}>
              {questionIndex === testQuestions.length - 1 ? "결과 확인하기" : "다음 문제"}<span>→</span>
            </button>
          </div>
        )}

        {track && finished && result && (
          <div className="test-result" aria-live="polite">
            <div className="level-test-complete-notice">
              <span>LEVEL TEST COMPLETE</span>
              <h3>레벨테스트를 끝까지 완료했습니다.</h3>
              <p>아래 학생 정보와 학부모 연락처를 입력해 결과를 저장해 주세요. 점수·영역별 분석·교사 피드백이 포함된 상세 평가지와 PDF 출력은 관리자페이지에서 확인할 수 있습니다.</p>
            </div>
            <form className="test-result-save" onSubmit={saveResult}>
              <div>
                <label>
                  <span>학생 이름</span>
                  <input name="studentName" value={studentName} onChange={(event) => setStudentName(event.target.value)} maxLength={40} placeholder="학생 이름" required disabled={resultSaved} />
                </label>
                <label>
                  <span>학부모 연락처</span>
                  <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" maxLength={20} placeholder="010-0000-0000" required disabled={resultSaved} />
                </label>
              </div>
              <label className="test-result-consent">
                <input type="checkbox" checked={resultConsent} onChange={(event) => setResultConsent(event.target.checked)} required disabled={resultSaved} />
                <span>결과 저장, 상담 및 학원 이메일 완료 알림을 위한 개인정보 수집·이용에 동의합니다.</span>
              </label>
              <button type="submit" disabled={resultSaving || resultSaved}>
                {resultSaved ? "결과 저장 완료" : resultSaving ? "저장 중…" : "내 결과 저장하기"}
              </button>
              {resultSaveMessage && <p role="status">{resultSaveMessage}</p>}
              {!resultSaved && <p className="test-auto-save-note">휴대폰 번호를 끝까지 입력한 뒤 ‘결과 저장하기’를 눌러 주세요.</p>}
            </form>
            <p className="level-report-admin-notice">상세 평가지 출력과 문자·카카오톡 전송은 학원 관리자페이지에서 안전하게 관리됩니다.</p>
            <div className="result-actions">
              <a href="#consult">결과 가지고 상담예약하기 <span>→</span></a>
              <button type="button" onClick={resetTest}>다른 단계 테스트하기</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
