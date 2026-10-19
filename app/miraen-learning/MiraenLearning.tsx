"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import storySource from "./storyTownData.json";
import readingSource from "./readingTownData.json";
import phonicsSource from "./phonicsTownData.json";
import story2Source from "./storyTown2Data.json";
import readingBuilderSource from "./readingBuilderData.json";
import { speakEnglish } from "../lib/speakEnglish";
import VoicePractice from "./VoicePractice";
import { sendTestEmailNotification } from "../test-email";
type Sentence = {
    en: string;
    ko: string;
};
type Unit = {
    id: string;
    book: string;
    unit: number;
    title: string;
    sentences: Sentence[];
    words: string[];
};
type Mode = "listenWrite" | "translateWrite" | "order" | "speak" | "word" | "wordMixed" | "phonicsSound";
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const bad = /^(?:[A-D]?\d+\b|think and|trace and|choose|listen and|read and|write the|complete the|translate into|make sentences|fill in|what is the story|what happened|who |what |where |when |why |how |does |do |is |are |can )/i;
const instruction = /^(?:expressions?|make sentences?|translate(?: into)?|choose|listen|read|write|fill|look|match|circle|chant|find|spelling words?|day \d|which words?|a\s+make|[a-f]\s+(?:make|read|choose|write|translate|fill|match))/i;
const wordStop = new Set(["expressions","expressionstranslate","translate","korean","english","sentences","sentence","choose","correct","answer","answers","question","questions","write","read","listen","match","circle","together","make","words","word"]);
function normalizeSentence(value:string){return value.replace(/\bW e\b/g,"We").replace(/\bY ou\b/g,"You").replace(/\bT he\b/g,"The").replace(/\bT hey\b/g,"They").replace(/\bS he\b/g,"She").replace(/\bH e\b/g,"He").replace(/\bI t\b/g,"It").replace(/\bW hat\b/g,"What").replace(/\s+([,.!?])/g,"$1").replace(/\s+/g," ").replace(/[”"]$/,".").trim()}
function cleanUnit(unit:Unit):Unit{const sentences=unit.sentences.map(x=>({...x,en:normalizeSentence(x.en)})).filter(x=>{const en=x.en;const tokens=en.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[];return en.length>7&&tokens.length>=3&&/^[A-Z]/.test(en)&&/[.!?]$/.test(en)&&!instruction.test(en)&&!/[→➔]|indd|script|_{2,}|\s[.]|\bis\s+[.]|\bto\s+[.]|\bthink\s+.+\s+[.]/i.test(en)});const words=[...new Set([...unit.words,...sentences.flatMap(x=>x.en.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[])].map(x=>x.toLowerCase().trim()).filter(x=>/^[a-z]+(?:'[a-z]+)?$/.test(x)&&x.length>=3&&!wordStop.has(x)))];return{...unit,sentences,words}}
const storyUnits: Unit[] = (storySource as any[]).map((book, bookIndex) => {
    const sentences: string[] = [];
    (book.sentences as string[]).forEach(raw => {
        const en = normalizeSentence(raw.replace(/^[A-D]\d+\s*/i, "").replace(/^→\s*/, ""));
        const marks=en.match(/[.!?]/g)||[],tokens=en.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[];
        if (!bad.test(raw.trim()) && /^[A-Z]/.test(en) && /[.!?]$/.test(en) && marks.length===1 && tokens.length>=3 && en.length > 7 && en.length < 150 && !/[+\[\]_]|\bis\s+[.]|\bam\s+[.]|\bare\s+[.]/i.test(en) && !sentences.includes(en))
            sentences.push(en);
    });
    const words = [...new Set(sentences.flatMap(x => x.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []).filter(x => x.length > 3))].slice(0, 50);
    return { id: `story-${book.id}`, book: `Story Town ${book.id}`, unit: bookIndex + 1, title: book.title, sentences: sentences.map(en => ({ en, ko: "" })), words };
}).filter(x => x.sentences.length);
const readingUnits = [...readingSource as Unit[],...readingBuilderSource as Unit[]].map(cleanUnit), phonicsUnits = (phonicsSource as Unit[]).map(cleanUnit), allStoryUnits = [...storyUnits, ...story2Source as Unit[]].map(cleanUnit);
export default function MiraenLearning() {
    const [student, setStudent] = useState<any>(null), [ready, setReady] = useState(false), [loginMode, setLoginMode] = useState<"student" | "admin">("student"), [name, setName] = useState(""), [code, setCode] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState("");
    const [autoTranslation, setAutoTranslation] = useState(""), [translationLoading, setTranslationLoading] = useState(false);
    const [wordMeaning, setWordMeaning] = useState(""), [wordMeaningLoading, setWordMeaningLoading] = useState(false);
    const [series, setSeries] = useState<"story" | "reading" | "phonics">("story"), [unitId, setUnitId] = useState(allStoryUnits[0]?.id || ""), [index, setIndex] = useState(0), [wordIndex, setWordIndex] = useState(0), [mode, setMode] = useState<Mode>("listenWrite"), [answer, setAnswer] = useState(""), [built, setBuilt] = useState<string[]>([]), [checked, setChecked] = useState(false), [score, setScore] = useState(0), [solved, setSolved] = useState(0);
    const units = series === "story" ? allStoryUnits : series === "reading" ? readingUnits : phonicsUnits, unit = units.find(x => x.id === unitId) || units[0], sentenceSource = unit?.sentences[index] || { en: "", ko: "" }, sentence = { ...sentenceSource }, word = unit?.words[wordIndex % Math.max(unit.words.length, 1)] || "";
    const tokens = useMemo(() => sentence.en.replace(/[.!?]/g, "").split(/\s+/).filter(Boolean).map((word, i) => ({ id: String(i), word })).sort(() => Math.random() - .5), [unitId, index]);
    const mixedChoices = useMemo(() => [word, ...unit.words.filter(x => x !== word).sort(() => Math.random() - .5).slice(0, 3)].sort(() => Math.random() - .5), [unitId, wordIndex, word]);
    const mixedType = wordIndex % 3, letterTokens = useMemo(() => word.split("").map((letter, i) => ({ id: `letter-${i}`, word: letter })).sort(() => Math.random() - .5), [unitId, wordIndex, word]);
    const suppliedTranslation = /[가-힣]/.test(sentence.ko || "") && !/indd|script|→|➔|본책|교사용|워크북|^[\d✽●]|\b\d+[.)]|:\s*~/i.test(sentence.ko || "") ? sentence.ko.trim() : "";
    useEffect(() => {
        if (mode !== "translateWrite" || !sentence.en) return;
        if (suppliedTranslation) { setAutoTranslation(suppliedTranslation); return; }
        let alive = true;
        setAutoTranslation("");
        setTranslationLoading(true);
        fetch(`/api/translate?text=${encodeURIComponent(sentence.en)}`, { cache: "force-cache" }).then(r => r.json()).then(d => { if (alive) setAutoTranslation(d.translation || "한국어 해석을 불러오지 못했습니다."); }).catch(() => { if (alive) setAutoTranslation("한국어 해석을 불러오지 못했습니다."); }).finally(() => { if (alive) setTranslationLoading(false); });
        return () => { alive = false; };
    }, [mode, sentence.en, suppliedTranslation]);
    if (mode === "translateWrite") sentence.ko = translationLoading ? "한국어 해석을 만드는 중입니다…" : (autoTranslation || suppliedTranslation || "한국어 해석을 준비하고 있습니다…");
    useEffect(() => {
        if (mode !== "wordMixed" || !word) return;
        let alive = true; setWordMeaning(""); setWordMeaningLoading(true);
        fetch(`/api/translate?text=${encodeURIComponent(word)}`, { cache: "force-cache" }).then(r => r.json()).then(d => { if (alive) setWordMeaning(d.translation || "뜻을 불러오지 못했습니다."); }).catch(() => { if (alive) setWordMeaning("뜻을 불러오지 못했습니다."); }).finally(() => { if (alive) setWordMeaningLoading(false); });
        return () => { alive = false; };
    }, [mode, word]);
    useEffect(() => {
        fetch("/api/student/auth", { cache: "no-store" }).then(async (response) => {
            const data = response.ok ? await response.json() : {};
            if (data.authenticated)
                setStudent(data.student);
            setReady(true);
        }).catch(() => setReady(true));
    }, []);
    useEffect(() => {
        if (student) return;
        const link = document.querySelector<HTMLAnchorElement>(".ml-admin-login");
        if (!link) return;
        link.textContent = "학습관리자 로그인";
        link.href = "/naesin-admin";
        const goAdmin = (event: Event) => { event.preventDefault(); event.stopPropagation(); window.location.assign("/naesin-admin"); };
        link.addEventListener("click", goAdmin, true);
        return () => link.removeEventListener("click", goAdmin, true);
    }, [student, ready]);
    useEffect(() => {
        if (!student || student.adminPractice) return;
        const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href="/miraen-assessment"]')];
        const target = student.name?.replace(/\s/g, "") === "박세훈" ? `/monthly-exam?studentId=${student.id}&name=${encodeURIComponent(student.name)}&storyId=story-town-1-1&official=1` : "/miraen-assessment";
        const openAssessment = (event: Event) => { event.preventDefault(); window.location.assign(target); };
        links.forEach(link => link.addEventListener("click", openAssessment, true));
        return () => links.forEach(link => link.removeEventListener("click", openAssessment, true));
    }, [student]);
    async function login(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (loginMode === "admin") {
            const r = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
            if (!r.ok)
                return setError("관리자 비밀번호를 확인해 주세요.");
            window.location.assign("/naesin-admin");
            return;
        }
        const r = await fetch("/api/student/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, code }) }), d = await r.json().catch(() => ({}));
        if (!r.ok)
            return setError(d.error || "학생 이름과 휴대폰 뒷번호를 확인해 주세요.");
        setStudent(d.student);
        window.dispatchEvent(new Event("student-session-changed"));
        const next = new URLSearchParams(window.location.search).get("next");
        if (["/grammar-quiz", "/phonics-quiz", "/homework-submit"].includes(next || "")) {
            window.location.assign(next!);
        }
    }
    function chooseSeries(next: "story" | "reading" | "phonics") { const list = next === "story" ? allStoryUnits : next === "reading" ? readingUnits : phonicsUnits; setSeries(next); setUnitId(list[0]?.id || ""); reset(); }
    function chooseUnit(id: string) { setUnitId(id); setIndex(0); setWordIndex(0); reset(); }
    function reset() { setAnswer(""); setBuilt([]); setChecked(false); }
    function changeMode(next: Mode) { setMode(next); reset(); }
    function grade() {
        if (checked)
            return;
        const response = mode === "order" ? built.map(id => tokens.find(x => x.id === id)?.word || "").join(" ") : mode === "wordMixed" && mixedType === 2 ? built.map(id => letterTokens.find(x => x.id === id)?.word || "").join("") : answer;
        const target = mode === "wordMixed" && mixedType === 0 ? wordMeaning : mode === "word" || mode === "wordMixed" ? word : sentence.en, ok = clean(response) === clean(target);
        setChecked(true);
        setSolved(x => x + 1);
        if (ok)
            setScore(x => x + 1);
        if (student?.id && !student.adminPractice)
            void Promise.all([
                fetch("/api/student/quiz-results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publisher: series === "story" ? "Story Town" : series === "reading" ? "Reading Town" : "Phonics Town", grade: unit.book, lesson: String(unit.unit), passage: unit.title, quizType: mode, questionIndex: (mode === "word" ? wordIndex : index) + 1, correct: ok, answerText: response }) }),
                fetch("/api/student/quiz-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ area: "story", progress: { solved: solved + 1, score: score + (ok ? 1 : 0), total: mode === "word" || mode === "wordMixed" || mode === "phonicsSound" ? unit.words.length : unit.sentences.length, publisher: series === "story" ? "Story Town" : series === "reading" ? "Reading Town" : "Phonics Town", grade: unit.book, lesson: `Unit ${unit.unit}`, mode, title: unit.title } }) })
            ]);
    }
    useEffect(() => {
        if (!student || student.adminPractice) return;
        const button = document.createElement("button");
        button.className = "ml-complete-mail";
        button.textContent = "오늘 학습 완료 · 알림메일";
        button.onclick = async () => {
            if (!solved) { button.textContent = "문제를 먼저 학습해 주세요"; return; }
            button.disabled = true; button.textContent = "완료 저장·메일 전송 중…";
            try {
                const response = await fetch("/api/student/quiz-complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ area: "story", solved, score, detail: `${unit.book} Unit ${unit.unit} · ${unit.title} · ${mode}` }) });
                const data = await response.json(); if (!response.ok) throw new Error(data.error);
                await sendTestEmailNotification(data.emailPayload);
                await fetch("/api/student/quiz-complete", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completionId: data.completionId }) });
                button.textContent = "완료 · jinsim84@kakao.com 전송됨";
            } catch { button.textContent = "완료 저장됨 · 메일 설정 확인"; button.disabled = false; }
        };
        document.body.appendChild(button); return () => button.remove();
    }, [student, solved, score, unit.book, unit.unit, unit.title, mode]);
    function next() {
        if (mode === "word" || mode === "wordMixed" || mode === "phonicsSound")
            setWordIndex(x => (x + 1) % Math.max(unit.words.length, 1));
        else
            setIndex(x => (x + 1) % unit.sentences.length);
        reset();
    }
    if (!ready)
        return <main className="ml-loading">미래엔 영어학습을 준비하고 있습니다…</main>;
    if (!student)
        return <main className="ml-login-page"><header className="ml-public-header"><a className="ml-public-brand" href="/"><span>M</span><b>벌교미래엔영어학원</b></a><nav><a className="ml-student-login" href="#student-login" onClick={() => setLoginMode("student")}>학생 로그인</a><a className="ml-admin-login" href="#student-login" onClick={() => setLoginMode("admin")}>관리자 로그인</a><a className="ml-assessment-login" href="/miraen-assessment">학생 월말평가 로그인</a><a href="#courses">Story Town</a><a href="#courses">Reading Town</a><a href="#courses">단어 퀴즈</a><a className="ml-consult" href="https://vercel-deploy-mauve-one-18.vercel.app/academy#consult">상담 예약</a></nav></header><section className="ml-login-hero"><div className="ml-login-copy"><p>MIRAEN ENGLISH LEARNING</p><h1>스토리와 리딩으로<br /><strong>영어 실력을 키워요.</strong></h1><span>Story Town과 Reading Town의 실제 단원별 본문 문장과 단어로 듣기, 쓰기, 말하기 퀴즈를 학습합니다.</span><div className="ml-login-features" id="courses"><i>Story Town 본문</i><i>Reading Town 7권</i><i>단원별 단어 퀴즈</i></div></div><div className="ml-login-card" id="student-login"><div className="ml-login-tabs"><button className={loginMode === "student" ? "on" : ""} onClick={() => setLoginMode("student")}>학생 로그인</button><button className={loginMode === "admin" ? "on" : ""} onClick={() => setLoginMode("admin")}>관리자 로그인</button></div><p>{loginMode === "student" ? "STUDENT LOGIN" : "ADMIN LOGIN"}</p><h2>{loginMode === "student" ? "학습자 로그인" : "관리자 로그인"}</h2><form onSubmit={login}>{loginMode === "student" ? <><label><b>학생 이름</b><input required value={name} onChange={e => setName(e.target.value)} placeholder="등록된 학생 이름"/></label><label><b>휴대폰 뒷번호</b><input required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="숫자 4자리"/></label></> : <label><b>관리자 비밀번호</b><input required type="password" value={password} onChange={e => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="비밀번호 4자리"/></label>}<button>{loginMode === "student" ? "학습 시작하기" : "관리자로 문제 풀기"}<b>→</b></button></form>{error && <em>{error}</em>}<small>{loginMode === "student" ? "내신관리와 같은 학생 정보로 로그인합니다." : "관리자도 모든 문제를 직접 풀어볼 수 있습니다."}</small><a className="ml-assessment-card-link" href="/miraen-assessment">배정된 월말평가 확인·응시 →</a></div></section></main>;
    const accuracy = solved ? Math.round(score / solved * 100) : 0;
    return <main className="ml-shell"><header><a href="/"><b>M 벌교미래엔영어</b></a><nav><a href="#library">교재·단원</a><a href="#quiz">문장·단어 퀴즈</a><a href="#progress">학습 현황</a><a className="ml-assessment-nav" href="/miraen-assessment">월말평가 응시</a></nav><span>{student.adminPractice ? "관리자 연습" : `${student.name} 학생`}</span></header><section className="ml-hero"><div><p>STORY TOWN · READING TOWN</p><h1>단원 문장으로 듣고,<br /><strong>직접 쓰고 말해요.</strong></h1><span>문제번호와 활동문구를 뺀 실제 본문 문장과 단어만 학습합니다.</span><div className="ml-hero-actions"><a href="#quiz">오늘 학습 시작 →</a><a href="/miraen-assessment">배정된 월말평가 보기 →</a></div></div><div className="ml-hero-ring"><i><b>{accuracy}%</b><small>누적 정답률</small></i></div></section><section id="library" className="ml-library"><div><p>BOOK & UNIT LIBRARY</p><h2>교재와 영어 단원 선택</h2><div className="ml-series-tabs"><button className={series === "story" ? "on" : ""} onClick={() => chooseSeries("story")}>Story Town</button><button className={series === "reading" ? "on" : ""} onClick={() => chooseSeries("reading")}>Reading Town · Builder</button><button className={series === "phonics" ? "on" : ""} onClick={() => chooseSeries("phonics")}>Phonics Town 1·2·3</button></div></div><div>{units.map(x => <button key={x.id} onClick={() => chooseUnit(x.id)} className={unit.id === x.id ? "on" : ""}><em>UNIT {x.unit}</em><strong>{x.book}</strong><span>{x.title}</span><small>{x.sentences.length}문장 · {x.words.length}단어</small></button>)}</div></section><section id="quiz" className="ml-quiz"><aside><p>QUIZ TYPE</p>{[...[ ["listenWrite", "영어 문장 듣고 쓰기"], ["translateWrite", "해석 보고 영어로 쓰기"], ["order", "단어 순서 배열"], ["speak", "문장 따라 읽기·녹음"], ["word", "단어 듣고 철자 쓰기"], ["wordMixed", "교재 단어 혼합퀴즈"] ], ...(series === "phonics" ? [["phonicsSound", "파닉스 음가·따라읽기 녹음"]] : [])].map(([id, label]) => <button className={mode === id ? "on" : ""} onClick={() => changeMode(id as Mode)} key={id}>{label}</button>)}<div id="progress"><b>{accuracy}%</b><span>누적 정답률</span><small>{score}/{solved} 정답</small></div></aside><article><header><div><span>{unit.book} · Unit {unit.unit}</span><h2>{unit.title}</h2></div><strong>{mode === "word" || mode === "wordMixed" || mode === "phonicsSound" ? wordIndex + 1 : index + 1} / {mode === "word" || mode === "wordMixed" || mode === "phonicsSound" ? unit.words.length : unit.sentences.length}</strong></header>{mode === "listenWrite" ? <div className="ml-write-quiz"><button onClick={() => speakEnglish(sentence.en)}>▶ 영어 문장 듣기</button><p>문장을 듣고 영어로 정확하게 쓰세요.</p><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="들은 영어 문장을 입력하세요." rows={3}/></div> : mode === "translateWrite" ? <div className="ml-write-quiz"><button onClick={() => speakEnglish(sentence.en)}>▶ 정답 문장 음원 듣기</button><p>{sentence.ko || "이 문장의 뜻을 생각하고 영어 문장을 완성하세요."}</p><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="해석에 맞는 영어 문장을 입력하세요." rows={3}/></div> : mode === "order" ? <div className="ml-order"><div className="built">{built.map(id => <button key={id} onClick={() => setBuilt(built.filter(x => x !== id))}>{tokens.find(x => x.id === id)?.word}</button>)}</div><div className="tokens">{tokens.filter(x => !built.includes(x.id)).map(x => <button key={x.id} onClick={() => setBuilt([...built, x.id])}>{x.word}</button>)}</div></div> : mode === "speak" ? <VoicePractice text={sentence.en}/> : mode === "phonicsSound" ? <div className="ml-phonics-sound"><p><b>{word.slice(0,2).toUpperCase()}</b> 음가를 듣고 단어 전체를 따라 읽어 보세요.</p><button type="button" onClick={() => speakEnglish(word)}>▶ {word} 음가·단어 듣기</button><VoicePractice text={word}/></div> : mode === "wordMixed" ? <div className="ml-write-quiz ml-word-mixed"><button onClick={() => speakEnglish(word)}>▶ 영어 단어 음원 듣기</button><p>{mixedType === 0 ? "영어 단어를 듣고 한국어 뜻을 쓰세요." : mixedType === 1 ? "한국어 뜻을 보고 영어 단어를 쓰세요." : "음원을 듣고 알파벳을 올바른 순서로 배열하세요."}</p>{mixedType === 1 && <strong className="ml-word-meaning">{wordMeaningLoading ? "뜻을 불러오는 중…" : wordMeaning}</strong>}{mixedType < 2 ? <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder={mixedType === 0 ? "한국어 뜻 입력" : "영어 단어 입력"} rows={2}/> : <div className="ml-letter-order"><div className="built">{built.map(id => <button key={id} onClick={() => setBuilt(built.filter(x => x !== id))}>{letterTokens.find(x => x.id === id)?.word}</button>)}</div><div className="tokens">{letterTokens.filter(x => !built.includes(x.id)).map(x => <button key={x.id} onClick={() => setBuilt([...built, x.id])}>{x.word}</button>)}</div></div>}</div> : <div className="ml-write-quiz"><button onClick={() => speakEnglish(word)}>▶ 단어 듣기</button><p>단어를 듣고 철자를 입력하세요.</p><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="영어 단어 철자" rows={2}/></div>}{checked && mode !== "speak" && <div className={clean(mode === "wordMixed" && mixedType === 0 ? wordMeaning : mode === "word" || mode === "wordMixed" ? word : sentence.en) === clean(mode === "order" ? built.map(id => tokens.find(x => x.id === id)?.word || "").join(" ") : mode === "wordMixed" && mixedType === 2 ? built.map(id => letterTokens.find(x => x.id === id)?.word || "").join("") : answer) ? "ml-result ok" : "ml-result wrong"}><b>{clean(mode === "wordMixed" && mixedType === 0 ? wordMeaning : mode === "word" || mode === "wordMixed" ? word : sentence.en) === clean(mode === "order" ? built.map(id => tokens.find(x => x.id === id)?.word || "").join(" ") : mode === "wordMixed" && mixedType === 2 ? built.map(id => letterTokens.find(x => x.id === id)?.word || "").join("") : answer) ? "정답입니다!" : "다시 확인해 보세요."}</b><p>{mode === "wordMixed" && mixedType === 0 ? `${word} : ${wordMeaning}` : mode === "word" || mode === "wordMixed" ? word : sentence.en}</p></div>}<footer>{mode !== "speak" && mode !== "phonicsSound" && <button onClick={grade} disabled={checked}>정답 확인</button>}<button onClick={next}>다음 문제 →</button></footer></article></section><footer className="ml-footer">미래엔영어학습 · Story Town · Reading Town</footer></main>;
}
