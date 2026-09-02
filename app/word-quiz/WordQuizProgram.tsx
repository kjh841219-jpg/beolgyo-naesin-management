"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { wordSets as baseWordSets } from "./wordQuizData";
import { supplementalWordSets } from "./supplementalWordQuizData";
import { speakEnglish, stopEnglishSpeech } from "../lib/speakEnglish";
import {sendTestEmailNotification} from "../test-email";

type Mode = "study" | "meaning" | "mixed";
type PrintMode = "meaning" | "spelling" | "mixed";
const wordSets=[...baseWordSets,...supplementalWordSets];
const clean = (s: string) =>
  s.toLowerCase().replace(/[’]/g, "'").replace(/[~·,./()\s-]/g, "");
const meaningMatches = (answer: string, meaning: string) => {
  const submitted = clean(answer);
  if (!submitted) return false;
  return meaning
    .split(/[,;/]| 또는 |, |\//)
    .map(clean)
    .filter(Boolean)
    .some(
      (accepted) =>
        submitted === accepted ||
        (submitted.length >= 3 && accepted.length >= 3 &&
          (submitted.includes(accepted) || accepted.includes(submitted))),
    );
};
const mix = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
const similarityScore = (spoken: string, target: string) => {
  const a = clean(spoken), b = clean(target);
  if (!a || !b) return 0;
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return Math.max(0, Math.round((1 - rows[a.length][b.length] / Math.max(a.length, b.length)) * 100));
};
const pronunciationScoreFor=(spoken:string,target:string)=>{const spokenWords=spoken.toLowerCase().match(/[a-z]+(?:['’][a-z]+)?/g)||[],targetWords=target.toLowerCase().match(/[a-z]+(?:['’][a-z]+)?/g)||[];if(targetWords.length<2)return similarityScore(spoken,target);if(!spokenWords.length)return 0;const aligned=targetWords.map((word,i)=>similarityScore(spokenWords[i]||"",word));const wordScore=aligned.reduce((a,b)=>a+b,0)/targetWords.length;const countPenalty=Math.max(0,100-Math.abs(spokenWords.length-targetWords.length)*25);return Math.round(wordScore*.65+similarityScore(spoken,target)*.25+countPenalty*.1)};

export default function WordQuizProgram() {
  const [student, setStudent] = useState<any>(null),
    [ready, setReady] = useState(false),
    [loginMode, setLoginMode] = useState<"student" | "admin">("student"),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  const [setIndex, setSetIndex] = useState(0),
    [mode, setMode] = useState<Mode>("study"),
    [queue, setQueue] = useState<number[]>([]),
    [position, setPosition] = useState(0),
    [answer, setAnswer] = useState(""),
    [checked, setChecked] = useState(false),
    [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null),
    [score, setScore] = useState(0),
    [solved, setSolved] = useState(0),
    [completedWords, setCompletedWords] = useState<number[]>([]),
    [correctWords, setCorrectWords] = useState<number[]>([]),
    [saving, setSaving] = useState(false),
    [printMode, setPrintMode] = useState<PrintMode>("meaning"),
    [recording, setRecording] = useState(false),
    [spokenText, setSpokenText] = useState(""),
    [pronunciationScore, setPronunciationScore] = useState<number | null>(null),
    [speechNotice, setSpeechNotice] = useState("");
  const gradingRef = useRef(false);
  const [saveNotice,setSaveNotice]=useState("");
  const [completionNotice,setCompletionNotice]=useState("");
  const [progressReady,setProgressReady]=useState(false);
  const current = wordSets[setIndex],
    item = current.words[queue[position] ?? 0];
  const publishers = [...new Set(wordSets.map((x) => x.publisher))],
    grades = [
      ...new Set(
        wordSets
          .filter((x) => x.publisher === current.publisher)
          .map((x) => x.grade),
      ),
    ],
    sets = wordSets
      .map((x, i) => ({ x, i }))
      .filter(
        ({ x }) =>
          x.publisher === current.publisher && x.grade === current.grade,
      );
  const direction = useMemo(
    () => (mode === "mixed" && position % 2 === 1 ? "spelling" : "meaning"),
    [mode, position],
  );
  const reset = (nextMode: Mode = mode, nextSet = setIndex) => {
    gradingRef.current=false;
    setMode(nextMode);
    setQueue(mix(wordSets[nextSet].words.map((_, i) => i)));
    setPosition(0);
    setAnswer("");
    setChecked(false);
    setGradedCorrect(null);
    setScore(0);
    setSolved(0);
    setCompletedWords([]);
    setCorrectWords([]);
    setSaving(false);
    setSaveNotice("");
  };
  useEffect(() => {
    setQueue(mix(wordSets[0].words.map((_, i) => i)));
    fetch("/api/student/auth", { cache: "no-store" })
      .then(async (r) => {
        if (r.ok) {
          const x = await r.json();
          setStudent(x.student);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);
  useEffect(()=>{if(!student)return;const key=`beolgyo-word-progress-${student.id||student.name}`;try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(saved&&wordSets[saved.setIndex]){setSetIndex(saved.setIndex);setMode(saved.mode||"study");setQueue(Array.isArray(saved.queue)&&saved.queue.length?saved.queue:wordSets[saved.setIndex].words.map((_:unknown,i:number)=>i));setPosition(Math.min(saved.position||0,wordSets[saved.setIndex].words.length-1));setAnswer(saved.answer||"");setChecked(Boolean(saved.checked));setGradedCorrect(typeof saved.gradedCorrect==="boolean"?saved.gradedCorrect:null);const done=Array.isArray(saved.completedWords)?saved.completedWords:[];const right=Array.isArray(saved.correctWords)?saved.correctWords:[];setCompletedWords(done);setCorrectWords(right);setSolved(done.length);setScore(right.length)}}catch{}setProgressReady(true)},[student]);
  useEffect(()=>{if(!student||!progressReady||!queue.length)return;localStorage.setItem(`beolgyo-word-progress-${student.id||student.name}`,JSON.stringify({setIndex,mode,queue,position,answer,checked,gradedCorrect,score,solved,completedWords,correctWords,updatedAt:new Date().toISOString()}))},[student,progressReady,setIndex,mode,queue,position,answer,checked,gradedCorrect,score,solved,completedWords,correctWords]);
  useEffect(()=>{if(!student?.id||!progressReady||!queue.length)return;const timer=window.setTimeout(()=>void fetch("/api/student/quiz-progress",{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:JSON.stringify({area:"word",progress:{setIndex,mode,position,answer,checked,score,solved,total:queue.length,publisher:current.publisher,grade:current.grade,lesson:current.lesson}})}),500);return()=>window.clearTimeout(timer)},[student?.id,progressReady,setIndex,mode,position,answer,checked,score,solved,current.publisher,current.grade,current.lesson,queue.length]);
  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (loginMode === "admin") {
      const r = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }),
        x = await r.json().catch(() => ({}));
      if (!r.ok) return setError(x.error || "관리자 로그인에 실패했습니다.");
      setStudent({ name: "관리자", adminPractice: true });
      return;
    }
    const r = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      }),
      x = await r.json().catch(() => ({}));
    if (!r.ok) return setError(x.error || "로그인하지 못했습니다.");
    setStudent(x.student);
  };
  const speak = (word = item.word) => speakEnglish(word);
  const correct =
    direction === "meaning"
      ? meaningMatches(answer, item.meaning)
      : clean(answer) === clean(item.word);
  const grade = () => {
    if (gradingRef.current || checked || !answer.trim()) return;
    gradingRef.current=true;
    const resultCorrect=correct;
    const submittedAnswer=answer;
    const wordIndex=queue[position] ?? 0;
    setChecked(true);
    setGradedCorrect(resultCorrect);
    if (!completedWords.includes(wordIndex)) {
      setCompletedWords((items) => [...items, wordIndex]);
      setSolved((v) => Math.min(queue.length, v + 1));
    }
    if (resultCorrect && !correctWords.includes(wordIndex)) {
      setCorrectWords((items) => [...items, wordIndex]);
      setScore((v) => Math.min(queue.length, v + 1));
    }
    if (student.adminPractice) { gradingRef.current=false; return; }
    setSaving(true);
    setSaveNotice("정답을 표시했습니다. 학습기록을 저장하고 있어요.");
    const payload=JSON.stringify({
        publisher: current.publisher,
        grade: current.grade,
        lesson: current.lesson,
        passage: `단어 테스트 · ${current.lesson}`,
        quizType: mode === "meaning" ? "word-meaning" : "word-mixed",
        questionIndex: (queue[position] ?? 0) + 1,
        correct:resultCorrect,
        answerText:submittedAnswer,
      });
    const saveWithTimeout=async()=>{
      for(let attempt=0;attempt<2;attempt+=1){
        const controller=new AbortController();
        const timeout=window.setTimeout(()=>controller.abort(),7000);
        try{
          const response=await fetch("/api/student/quiz-results",{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:payload,signal:controller.signal});
          if(response.ok)return;
        }catch{}
        finally{window.clearTimeout(timeout)}
      }
      throw new Error("save failed");
    };
    void saveWithTimeout().then(()=>{
      setSaveNotice("정답과 학습기록을 저장했습니다.");
    }).catch(()=>{
      setSaveNotice("정답은 확인되었습니다. 기록 저장이 지연되고 있으니 인터넷 연결을 확인해 주세요.");
    }).finally(()=>{
      setSaving(false);
      gradingRef.current=false;
    });
  };
  const next = () => {
    gradingRef.current=false;
    stopEnglishSpeech();
    setPosition((v) => (v + 1) % queue.length);
    setAnswer("");
    setChecked(false);
    setGradedCorrect(null);
    setSpokenText("");
    setPronunciationScore(null);
    setSpeechNotice("");
    setSaveNotice("");
  };
  const completeQuiz=async()=>{const r=await fetch("/api/student/quiz-complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({area:"word",solved,score,detail:`${current.publisher} ${current.grade} ${current.lesson} · ${mode}`})}),d=await r.json().catch(()=>({}));if(!r.ok)return setCompletionNotice(d.error||"완료 저장에 실패했습니다.");try{await sendTestEmailNotification(d.emailPayload);await fetch("/api/student/quiz-complete",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({completionId:d.completionId})});setCompletionNotice("학습 완료 기록을 저장하고 카카오메일로 알림을 전송했습니다.")}catch{setCompletionNotice("학습 완료 기록은 저장했습니다. 카카오메일 인증 또는 스팸함을 확인해 주세요.")}};
  const chooseSet = (i: number) => {
    setSetIndex(i);
    reset(mode, i);
  };
  const printCurrentWord = () => {
    const prompt =
      mode === "study" || direction === "meaning" ? item.word : item.meaning;
    const label =
      mode === "study"
        ? "단어 학습"
        : direction === "meaning"
          ? "단어 뜻쓰기"
          : "영단어 철자쓰기";
    const popup = window.open("", "_blank", "width=850,height=680");
    if (!popup) return window.print();
    popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${label} 문제</title><style>@page{size:A4;margin:20mm}body{font-family:'Malgun Gothic',sans-serif;color:#152b42}.brand,.footer{text-align:center;font-weight:800;color:#147a63;padding:9px;border-bottom:2px solid #147a63}.footer{border:0;border-top:2px solid #147a63;margin-top:28px}h1{font-size:22px}.meta{color:#66758a;margin-bottom:35px}.card{padding:30px;border:1px solid #bfcbd6;border-radius:12px}.card b{display:block;color:#147a63;margin-bottom:18px}.card p{font-size:24px}.line{height:42px;border-bottom:1px solid #666}</style></head><body><div class="brand">보성벌교내신은 벌교미래엔영어</div><h1>벌교미래엔영어 단어퀴즈 · ${label}</h1><div class="meta">출판사: ${current.publisher} · 학년: ${current.grade} · 과: ${current.lesson}<br>이름: ____________ 날짜: ____________</div><section class="card"><b>${position + 1}번 문제</b><p>${prompt}</p><div class="line"></div><div class="line"></div></section><div class="footer">보성벌교내신은 벌교미래엔영어</div></body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => { popup.print(); popup.close(); }, 300);
  };
  const printAllWords = () => {
    const label =
      printMode === "meaning"
        ? "단어 뜻쓰기"
        : printMode === "spelling"
          ? "뜻 보고 영단어 쓰기"
          : "단어·뜻 혼합";
    const rows = current.words
      .map((word, i) => {
        const spelling = printMode === "spelling" || (printMode === "mixed" && i % 2 === 1);
        return `<article><b>${i + 1}.</b><span>${spelling ? word.meaning : word.word}</span><i></i></article>`;
      })
      .join("");
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const printDocument = frame.contentDocument;
    const printWindow = frame.contentWindow;
    if (!printDocument || !printWindow) {
      frame.remove();
      return;
    }
    printDocument.open();
    printDocument.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${label} 전체 문제지</title><style>@page{size:A4;margin:12mm}body{font-family:'Malgun Gothic',sans-serif;color:#152b42}.brand,.footer{text-align:center;font-weight:800;color:#147a63;padding:8px;border-bottom:2px solid #147a63}.footer{border:0;border-top:2px solid #147a63;margin-top:20px}h1{font-size:22px;margin-bottom:6px}.meta{color:#66758a;margin-bottom:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}article{min-height:54px;padding:9px 0;display:grid;grid-template-columns:30px 1fr;align-items:start;border-bottom:1px solid #c8d1da;page-break-inside:avoid}article b{color:#147a63}article span{font-size:14px}article i{grid-column:2;height:20px;border-bottom:1px solid #777}</style></head><body><div class="brand">보성벌교내신은 벌교미래엔영어</div><h1>벌교미래엔영어 · ${label} 전체 문제지</h1><div class="meta">출판사: ${current.publisher} · 학년: ${current.grade} · 과: ${current.lesson} · 총 ${current.words.length}문제<br>이름: ____________ 날짜: ____________ 점수: ________</div><section class="grid">${rows}</section><div class="footer">보성벌교내신은 벌교미래엔영어 · ${current.publisher} · ${current.grade}</div></body></html>`);
    printDocument.close();
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => frame.remove(), 1000);
    }, 150);
  };
  const startPronunciation = async () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    stopEnglishSpeech();
    setSpokenText("");
    setPronunciationScore(null);
    const recordFallback = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !(window as any).MediaRecorder) {
        setRecording(false);
        setSpeechNotice("이 브라우저에서는 마이크 녹음을 지원하지 않습니다. 휴대폰 크롬이나 엣지에서 열어 주세요.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const context = AudioContextClass ? new AudioContextClass() : null;
        const analyser = context?.createAnalyser();
        if (analyser) {
          analyser.fftSize = 512;
          context.createMediaStreamSource(stream).connect(analyser);
        }
        const levels: number[] = [];
        const timer = window.setInterval(() => {
          if (!analyser) return;
          const data = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(data);
          levels.push(data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length / 128);
        }, 80);
        const recorder = new (window as any).MediaRecorder(stream);
        setRecording(true);
        setSpeechNotice("녹음 중입니다. 표시된 단어를 한 번 또렷하게 말해 주세요.");
        recorder.onstop = async () => {
          window.clearInterval(timer);
          stream.getTracks().forEach((track) => track.stop());
          await context?.close().catch(() => undefined);
          const voiced = levels.filter((level) => level > 0.025).length;
          const ratio = levels.length ? voiced / levels.length : 0;
          const average = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
          const practiceScore = ratio < 0.08 ? 20 : Math.min(96, Math.round(48 + ratio * 38 + Math.min(10, average * 160)));
          setRecording(false);
          setSpokenText("음성 녹음 완료");
          setPronunciationScore(practiceScore);
          setSpeechNotice("이 기기는 자동 받아쓰기를 지원하지 않아 녹음 음량과 발화 길이로 연습 점수를 계산했습니다.");
        };
        recorder.start();
        window.setTimeout(() => recorder.state === "recording" && recorder.stop(), 2600);
      } catch (error: any) {
        setRecording(false);
        setSpeechNotice(error?.name === "NotAllowedError" ? "마이크 사용을 허용한 뒤 다시 눌러 주세요." : "마이크를 시작하지 못했습니다. 브라우저의 마이크 권한을 확인해 주세요.");
      }
    };
    if (!Recognition) {
      await recordFallback();
      return;
    }
    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());
    } catch {
      setSpeechNotice("마이크 사용을 허용한 뒤 다시 눌러 주세요.");
      return;
    }
    setSpeechNotice("마이크에 단어를 한 번 또렷하게 말해 주세요.");
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => setRecording(true);
    recognition.onresult = (event: any) => {
      const alternatives = Array.from(event.results[0] || []).map((x: any) => x.transcript || "");
      const best = alternatives.sort((a: string, b: string) => pronunciationScoreFor(b, item.word) - pronunciationScoreFor(a, item.word))[0] || "";
      setSpokenText(best);
      setPronunciationScore(pronunciationScoreFor(best, item.word));
      setSpeechNotice("");
    };
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setSpeechNotice("마이크 사용을 허용한 뒤 다시 눌러 주세요.");
      } else {
        setRecording(false);
        setSpeechNotice("자동 음성인식을 사용할 수 없어 녹음 평가로 전환합니다.");
        window.setTimeout(recordFallback, 200);
      }
    };
    recognition.onend = () => setRecording(false);
    recognition.start();
  };
  if (!ready)
    return (
      <main className="wq-login">
        <p>단어 학습을 준비하고 있습니다…</p>
      </main>
    );
  if (!student)
    return (
      <main className="wq-login">
        <form onSubmit={login}>
          <a href="/naesin">
            <span>M</span>
            <b>벌교미래엔영어 내신관리</b>
          </a>
          <div className="wq-tabs">
            <button
              type="button"
              className={loginMode === "student" ? "active" : ""}
              onClick={() => setLoginMode("student")}
            >
              학생 로그인
            </button>
            <button
              type="button"
              className={loginMode === "admin" ? "active" : ""}
              onClick={() => setLoginMode("admin")}
            >
              관리자 로그인
            </button>
          </div>
          <p>VOCABULARY QUIZ LOGIN</p>
          <h1>나의 단어 퀴즈</h1>
          <small>
            음원을 듣고 단어를 공부한 뒤 뜻쓰기와 혼합 테스트에 도전하세요.
          </small>
          {loginMode === "admin" ? (
            <label>
              관리자 비밀번호
              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
              />
            </label>
          ) : (
            <>
              <label>
                학생 이름
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                연락처 뒷번호 4자리
                <input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </label>
            </>
          )}
          {error && <div className="wq-error">{error}</div>}
          <button className="wq-login-button">로그인하고 학습하기</button>
          <a className="wq-back" href="/naesin">
            ← 내신관리로 돌아가기
          </a>
        </form>
      </main>
    );
  return (
    <main className="wq-page">
      <header>
        <a href="/naesin">
          <span>M</span>
          <b>벌교미래엔영어 내신관리</b>
        </a>
        <nav>
          <b>
            {student.adminPractice ? "관리자 연습" : `${student.name} 학생`}
          </b>
          <a href="/quiz">본문 퀴즈</a>
          <a href="/dialog-quiz">대화문 퀴즈</a>
          <a href="/naesin">내신관리 홈</a>
          <button
            onClick={async () => {
              await fetch(
                student.adminPractice ? "/api/admin/auth" : "/api/student/auth",
                { method: "DELETE" },
              );
              setStudent(null);
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>
      <section className="wq-hero">
        <div>
          <p>VOCABULARY LAB</p>
          <h1>
            듣고, 쓰고, 확인하는
            <br />
            <strong>나의 교과서 단어 학습</strong>
          </h1>
          <span>WORD TEST 자료를 출판사·학년·과별로 그대로 정리했습니다.</span>
        </div>
        <div className="wq-rate">
          <i
            style={{
              background: `conic-gradient(#20b486 ${solved ? Math.round((score / solved) * 100) : 0}%,#dfe8f2 0)`,
            }}
          >
            <b>{solved ? Math.round((score / solved) * 100) : 0}%</b>
          </i>
          <span>
            {score}/{solved} 정답
          </span>
        </div>
      </section>
      <section className="wq-controls">
        <label>
          출판사
          <select
            value={current.publisher}
            onChange={(e) =>
              chooseSet(
                wordSets.findIndex((x) => x.publisher === e.target.value),
              )
            }
          >
            {publishers.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          학년
          <select
            value={current.grade}
            onChange={(e) =>
              chooseSet(
                wordSets.findIndex(
                  (x) =>
                    x.publisher === current.publisher &&
                    x.grade === e.target.value,
                ),
              )
            }
          >
            {grades.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          과 선택
          <select
            value={setIndex}
            onChange={(e) => chooseSet(Number(e.target.value))}
          >
            {sets.map(({ x, i }) => (
              <option value={i} key={i}>
                {x.lesson} · {x.words.length}단어
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="wq-print-all">
        <div><p>PRINTABLE WORD TEST</p><h2>전체 단어 문제지 만들기</h2><span>현재 선택한 과의 모든 단어를 원하는 문제 유형으로 출력합니다.</span></div>
        <div className="wq-print-modes" role="group" aria-label="인쇄 문제 유형"><button className={printMode==="meaning"?"active":""} onClick={()=>setPrintMode("meaning")}>영단어 → 뜻</button><button className={printMode==="spelling"?"active":""} onClick={()=>setPrintMode("spelling")}>뜻 → 영단어</button><button className={printMode==="mixed"?"active":""} onClick={()=>setPrintMode("mixed")}>단어·뜻 혼합</button></div>
        <button onClick={printAllWords}>{printMode==="meaning"?"뜻쓰기":printMode==="spelling"?"영단어 쓰기":"혼합"} 전체 {current.words.length}문제 인쇄</button>
      </section>
      <section className="wq-shell">
        <aside>
          <p>LEARNING MODE</p>
          {[
            ["study", "01", "음원 듣고 공부하기", "단어와 뜻을 함께 학습"],
            ["meaning", "02", "단어 뜻쓰기", "영단어를 보고 뜻 입력"],
            ["mixed", "03", "혼합 테스트", "뜻쓰기와 철자쓰기 교차"],
          ].map((x) => (
            <button
              key={x[0]}
              className={mode === x[0] ? "active" : ""}
              onClick={() => {if(x[0]==="meaning")setPrintMode("meaning");if(x[0]==="mixed")setPrintMode("mixed");reset(x[0] as Mode)}}
            >
              <i>{x[1]}</i>
              <b>{x[2]}</b>
              <small>{x[3]}</small>
            </button>
          ))}
        </aside>
        <article className="wq-card">
          <div className="wq-card-head">
            <span>
              {current.publisher} · {current.grade} · {current.lesson}
            </span>
            <b>
              {position + 1}/{queue.length}
            </b>
          </div>
          {mode === "study" ? (
            <div className="wq-study">
              <button
                className="wq-sound"
                onClick={() => speak()}
                aria-label={`${item.word} 발음 듣기`}
              >
                🔊
              </button>
              <p>소리를 듣고 따라 읽어 보세요</p>
              <h2>{item.word}</h2>
              <strong>{item.meaning}</strong>
              <button className="wq-again" onClick={() => speak()}>
                발음 다시 듣기
              </button>
              <div className="wq-pronunciation">
                <button className={recording ? "recording" : ""} disabled={recording} onClick={startPronunciation}>{recording ? "● 듣는 중…" : "🎙 발음 녹음하고 점수 보기"}</button>
                {speechNotice && <p>{speechNotice}</p>}
                {pronunciationScore !== null && <div><b>{pronunciationScore}점</b><span>인식된 발음: {spokenText || "-"}</span><em>{pronunciationScore >= 90 ? "아주 정확해요!" : pronunciationScore >= 70 ? "좋아요. 한 번 더 또렷하게 연습해 보세요." : "음원을 다시 듣고 천천히 따라 해 보세요."}</em></div>}
              </div>
            </div>
          ) : (
            <>
              <div className="wq-prompt">
                <small>
                  {direction === "meaning"
                    ? "단어의 우리말 뜻을 쓰세요"
                    : "뜻에 맞는 영단어를 쓰세요"}
                </small>
                <h2>{direction === "meaning" ? item.word : item.meaning}</h2>
                {direction === "meaning" && (
                  <button onClick={() => speak()}>🔊 발음 듣기</button>
                )}
              </div>
              <input
                className="wq-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && grade()}
                readOnly={checked}
                placeholder={
                  direction === "meaning" ? "우리말 뜻 입력" : "영단어 입력"
                }
              />
              {checked && (
                <div className={`wq-result ${gradedCorrect ? "correct" : "retry"}`}>
                  <b>{gradedCorrect ? "정답입니다!" : "다시 확인해 보세요."}</b>
                  <p>
                    정답:{" "}
                    <strong>
                      {direction === "meaning" ? item.meaning : item.word}
                    </strong>
                  </p>
                </div>
              )}
            </>
          )}
          <div className="wq-actions">
            {student?.id&&<button className="wq-complete" onClick={completeQuiz} disabled={solved<queue.length}>{solved>=queue.length?"단어퀴즈 완료·메일 알림 보내기":`전체 ${queue.length}문제 완료 후 버튼 활성화 (${solved}/${queue.length})`}</button>}
            <button className="wq-print" onClick={printCurrentWord}>
              현재 문제 인쇄
            </button>
            {mode !== "study" && (
              <button
                disabled={checked || !answer.trim()}
                onClick={grade}
              >
                {student.adminPractice ? "정답 확인" : checked ? "정답 확인 완료" : "정답 확인 + 기록 저장"}
              </button>
            )}
            <button onClick={next}>다음 단어 →</button>
          </div>
          {saveNotice&&<p className={`wq-save-notice ${saving?"saving":""}`} role="status" aria-live="polite">{saveNotice}</p>}
          {completionNotice&&<p className="wq-completion-notice">{completionNotice}</p>}
          <small className="wq-source">자료: {current.source}</small>
        </article>
      </section>
    </main>
  );
}
