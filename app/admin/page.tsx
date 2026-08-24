"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { defaultLandingContent, LandingContent } from "../content";
import MonthlyDailyReport from "./MonthlyDailyReport";

type Consultation = {
  id: string; createdAt: string; studentName: string; phone: string; grade: string;
  consultationAt: string; learningExperience: string; desiredDirection: string;
};
type LevelResult = {
  id: string; createdAt: string; studentName: string; phone: string; trackLabel: string;
  score: number; total: number; vocabulary: number; vocabularyTotal: number;
  grammar: number; grammarTotal: number; reading: number; readingTotal: number;
};
type DailyResult = {
  id: string; createdAt: string; testDate: string; studentName: string; phone: string; levelLabel: string;
  score: number; total: number; listening: number; listeningTotal: number;
  vocabulary: number; vocabularyTotal: number; grammar?: number; grammarTotal?: number; reading: number; readingTotal: number;
};
type ViewState = "checking" | "login" | "editor";
type SolapiStatus = { smsConfigured: boolean; kakaoConfigured: boolean; balance?: number; point?: number; message: string };
type SendStatus = { state: "sending" | "success" | "error"; message: string };

const koreanDate = (value: string) =>
  new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

const percent = (score: number, total: number) => total > 0 ? Math.round((score / total) * 100) : 0;

function levelEvaluation(item: LevelResult) {
  const overall = percent(item.score, item.total);
  if (overall >= 90) return "영어 기초가 매우 탄탄합니다. 현재 단계보다 한 단계 높은 과정에서 확장 어휘와 심화 독해를 시작해도 좋습니다.";
  if (overall >= 70) return "핵심 개념을 안정적으로 이해하고 있습니다. 틀린 영역을 짧게 복습하면서 현재 단계의 응용 문제를 꾸준히 풀어 주세요.";
  if (overall >= 50) return "기본 개념은 형성되어 있습니다. 영역별 오답을 중심으로 문장 구조와 핵심 어휘를 차근차근 보완하면 빠르게 성장할 수 있습니다.";
  return "기초 개념부터 부담 없이 다시 연결하는 학습을 권합니다. 짧은 문장과 필수 어휘를 반복하면 영어 자신감을 충분히 키울 수 있습니다.";
}

type DiagnosticBand = "상" | "중" | "하";

function diagnosticBand(score: number, total: number): DiagnosticBand {
  const value = percent(score, total);
  if (value >= 80) return "상";
  if (value >= 50) return "중";
  return "하";
}

function schoolStage(trackLabel: string) {
  if (trackLabel.includes("파닉스")) return "파닉스";
  if (trackLabel.includes("고등")) return "고등";
  if (trackLabel.includes("중등") || /중[123]/.test(trackLabel)) return "중등";
  return "초등";
}

function diagnosticCopy(stage: string, area: string, band: DiagnosticBand) {
  const copies: Record<string, Record<DiagnosticBand, { assessment: string; direction: string }>> = {
    "파닉스·어휘": {
      상: { assessment: "철자와 소리의 연결이 안정적이며 핵심 어휘를 문맥 속에서 빠르게 인식합니다.", direction: "복합 모음·다음절 단어와 문장 속 어휘 확장 학습을 권합니다." },
      중: { assessment: "기본 음가와 익숙한 단어는 이해하지만 새로운 철자 조합에서 실수가 나타납니다.", direction: "단모음·장모음·이중자 규칙을 소리 내어 읽고 받아쓰기로 연결해 주세요." },
      하: { assessment: "알파벳 소리와 철자의 연결이 아직 불안정해 단어 읽기에 도움이 필요합니다.", direction: "알파벳 음가부터 CVC 단어까지 짧게 매일 반복하는 기초 과정을 권합니다." },
    },
    "어휘": {
      상: { assessment: `${stage} 단계의 필수 어휘를 안정적으로 이해하고 문맥에 맞게 적용할 수 있습니다.`, direction: "유의어·반의어와 주제별 확장 어휘를 문장 및 독해와 함께 학습해 주세요." },
      중: { assessment: `${stage} 필수 어휘의 기본 뜻은 알지만 문맥에 따른 의미 변화에서 보완이 필요합니다.`, direction: "교과 핵심 어휘를 예문·어근·연어 단위로 반복하며 사용 범위를 넓혀 주세요." },
      하: { assessment: `${stage} 학습에 필요한 기본 어휘량이 부족해 문장 이해 속도가 느려질 수 있습니다.`, direction: "빈출 필수 단어를 그림·소리·짧은 예문과 연결해 누적 복습하는 과정을 권합니다." },
    },
    "문법": {
      상: { assessment: `${stage} 핵심 문장 구조와 문법 규칙을 정확히 구분하고 문제에 적용합니다.`, direction: "서술형 영작과 복합문 분석으로 문법 활용력을 심화해 주세요." },
      중: { assessment: "기본 규칙은 이해하지만 시제·품사·문장 구조가 섞인 문제에서 실수가 있습니다.", direction: "오답 문장을 직접 고쳐 쓰며 개념과 적용을 한 세트로 복습해 주세요." },
      하: { assessment: "주어·동사 찾기와 기본 어순 등 문장 뼈대에 대한 단계적 보완이 필요합니다.", direction: "짧은 문장의 품사와 1~5형식 기초부터 예문 중심으로 다시 연결해 주세요." },
    },
    "리딩": {
      상: { assessment: `${stage} 지문의 중심 내용과 세부 정보를 정확하게 파악하고 추론할 수 있습니다.`, direction: "긴 지문 요약, 근거 찾기, 빈칸·추론 유형으로 독해 깊이를 확장해 주세요." },
      중: { assessment: "글의 핵심 흐름은 이해하지만 세부 정보와 문장 간 연결에서 일부 놓치는 부분이 있습니다.", direction: "문단별 핵심문장 표시와 근거 문장 찾기를 반복해 정확도를 높여 주세요." },
      하: { assessment: "어휘와 문장 구조의 부담으로 지문의 핵심 내용을 파악하는 데 시간이 필요합니다.", direction: "짧은 문장 해석부터 끊어 읽기와 핵심어 표시를 병행하는 기초 독해를 권합니다." },
    },
  };
  return copies[area][band];
}

function levelDiagnostics(item: LevelResult) {
  const stage = schoolStage(item.trackLabel);
  const vocabularyArea = stage === "파닉스" ? "파닉스·어휘" : "어휘";
  return [
    { area: vocabularyArea, score: item.vocabulary, total: item.vocabularyTotal },
    { area: "문법", score: item.grammar, total: item.grammarTotal },
    { area: "리딩", score: item.reading, total: item.readingTotal },
  ].map((entry) => {
    const band = diagnosticBand(entry.score, entry.total);
    return { ...entry, band, ...diagnosticCopy(stage, entry.area, band) };
  });
}

function deepLevelAnalysis(item: LevelResult) {
  const stage = schoolStage(item.trackLabel);
  const overall = percent(item.score, item.total);
  const overallBand = diagnosticBand(item.score, item.total);
  const diagnostics = levelDiagnostics(item).map((entry) => ({ ...entry, value: percent(entry.score, entry.total) }));
  const ranked = [...diagnostics].sort((a, b) => b.value - a.value);
  const strongest = ranked[0];
  const priority = ranked[ranked.length - 1];
  const placement = stage === "파닉스"
    ? overallBand === "상" ? "파닉스 완성·초등 기초 리딩 진입" : overallBand === "중" ? "파닉스 규칙 통합·단어 읽기 강화" : "알파벳 음가·기초 파닉스 재정비"
    : `${stage} ${overallBand === "상" ? "심화·상위 단계" : overallBand === "중" ? "기본 완성 단계" : "기초 개념 보완 단계"}`;
  const interpretation = overallBand === "상"
    ? `${stage} 수준의 핵심 개념이 안정적으로 형성되어 있습니다. ${strongest.area} 영역의 강점을 유지하면서 ${priority.area}의 정확도를 보완하면 상위 단계로 자연스럽게 이동할 수 있습니다.`
    : overallBand === "중"
      ? `${stage} 기본 개념은 이해하고 있으나 문제 유형이 복합적으로 제시될 때 정확도가 흔들릴 수 있습니다. ${priority.area}를 우선 보완하고 오답 근거를 설명하는 연습이 필요합니다.`
      : `${stage} 학습을 진행하기 전에 필수 기초를 다시 연결하는 과정이 필요합니다. ${priority.area}부터 짧고 쉬운 과제로 성공 경험을 만들고 영역 간 학습 격차를 줄여야 합니다.`;
  const plan = [
    { period: "1주차", title: `${priority.area} 핵심 진단·개념 보완`, detail: `${priority.direction} 오답 문항을 다시 풀고 틀린 이유를 말로 설명합니다.` },
    { period: "2주차", title: `${stage === "파닉스" ? "소리-철자 자동화" : "필수 어휘 문맥 확장"}`, detail: stage === "파닉스" ? "음가, 철자 조합, 단어 읽기를 듣기·말하기·쓰기와 연결합니다." : "필수 어휘를 예문과 함께 익히고 누적 복습으로 장기 기억을 만듭니다." },
    { period: "3주차", title: "문장 구조·문법 적용", detail: "핵심 문법을 짧은 문장 분석과 영작에 적용해 단순 암기에서 활용 단계로 옮깁니다." },
    { period: "4주차", title: "리딩 통합·재평가", detail: "핵심문장과 근거를 표시하며 지문을 읽고 동일 수준의 재평가로 향상도를 확인합니다." },
  ];
  return { stage, overall, overallBand, strongest, priority, placement, interpretation, plan };
}

export default function AdminPage() {
  const [view, setView] = useState<ViewState>("checking");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [content, setContent] = useState<LandingContent>(defaultLandingContent);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [levelResults, setLevelResults] = useState<LevelResult[]>([]);
  const [dailyResults, setDailyResults] = useState<DailyResult[]>([]);
  const [consultationQuery, setConsultationQuery] = useState("");
  const [levelQuery, setLevelQuery] = useState("");
  const [dailyQuery, setDailyQuery] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [printLevelResult, setPrintLevelResult] = useState<LevelResult | null>(null);
  const [solapiStatus, setSolapiStatus] = useState<SolapiStatus | null>(null);
  const [sendStatuses, setSendStatuses] = useState<Record<string, SendStatus>>({});
  const [dailySmsDrafts, setDailySmsDrafts] = useState<Record<string, string>>({});

  function updateSendStatus(key: string, status: SendStatus) {
    setSendStatuses((current) => ({ ...current, [key]: status }));
  }

  async function loadContent() {
    const response = await fetch("/api/site-content", { cache: "no-store" });
    if (response.ok) {
      const loaded = (await response.json()) as LandingContent;
      setContent({ ...loaded, dailyResultMessage: loaded.dailyResultMessage.length > 70 ? defaultLandingContent.dailyResultMessage : loaded.dailyResultMessage });
    }
  }

  async function loadRecords() {
    setRecordsLoading(true);
    const [consultationResponse, resultResponse, dailyResponse] = await Promise.all([
      fetch("/api/consultations", { cache: "no-store", credentials: "include" }),
      fetch("/api/level-results", { cache: "no-store", credentials: "include" }),
      fetch("/api/daily-results", { cache: "no-store", credentials: "include" }),
    ]);
    if (consultationResponse.ok) {
      const data = (await consultationResponse.json()) as { items: Consultation[] };
      setConsultations(data.items);
    }
    if (resultResponse.ok) {
      const data = (await resultResponse.json()) as { items: LevelResult[] };
      setLevelResults(data.items);
    }
    if (dailyResponse.ok) {
      const data = (await dailyResponse.json()) as { items: DailyResult[] };
      setDailyResults(data.items);
    }
    setRecordsLoading(false);
  }

  async function loadSolapiStatus() {
    const response = await fetch("/api/admin/solapi-status", { cache: "no-store", credentials: "include" });
    const result = await response.json().catch(() => null) as SolapiStatus | null;
    if (result) setSolapiStatus(result);
  }

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((response) => response.json())
      .then(async (result: { authenticated?: boolean }) => {
        if (!result.authenticated) return setView("login");
        setView("editor");
        await Promise.all([loadContent(), loadRecords(), loadSolapiStatus()]);
      })
      .catch(() => setView("login"));
  }, []);

  useEffect(() => {
    if (view !== "editor") return;
    const refresh = () => {
      if (document.visibilityState === "visible") void loadRecords();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [view]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    if (!response.ok) return setMessage("비밀번호를 확인해 주세요.");
    setPassword("");
    setView("editor");
    await Promise.all([loadContent(), loadRecords(), loadSolapiStatus()]);
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE", credentials: "include" });
    setView("login");
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/site-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(content),
    });
    setSaving(false);
    setMessage(response.ok ? "학원 홈페이지 내용이 저장되었습니다." : "저장하지 못했습니다.");
    if (response.ok && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("academy-content");
      channel.postMessage({ type: "content-updated" });
      channel.close();
    }
  }

  async function saveCalendarChanges() {
    const invalidEvent = content.academyEvents.find((item) => !item.date || !item.title.trim());
    if (invalidEvent) {
      setMessage("일정의 날짜와 내용을 모두 입력한 뒤 저장해 주세요.");
      return;
    }
    setCalendarSaving(true);
    setMessage("");
    const response = await fetch("/api/site-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ academyEvents: content.academyEvents }),
    });
    const result = (await response.json().catch(() => ({}))) as { content?: LandingContent; error?: string };
    setCalendarSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "일정을 저장하지 못했습니다.");
      return;
    }
    if (result.content) setContent((current) => ({ ...current, academyEvents: result.content!.academyEvents }));
    setMessage(`학원 일정 ${result.content?.academyEvents.length ?? content.academyEvents.length}개가 저장되어 일정 페이지에 바로 반영되었습니다.`);
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("academy-content");
      channel.postMessage({ type: "calendar-updated" });
      channel.close();
    }
  }

  function updateText<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function updateStory(index: number, key: "school" | "grade" | "student" | "before" | "after", value: string) {
    setContent((current) => ({
      ...current,
      scoreStories: current.scoreStories.map((story, storyIndex) => {
        if (storyIndex !== index) return story;
        const next = { ...story, [key]: key === "before" || key === "after" ? Number(value) : value };
        return { ...next, gain: Number(next.after) - Number(next.before) };
      }),
    }));
  }

  function updateLiteracyCard(index: number, key: "eyebrow" | "title" | "description", value: string) {
    setContent((current) => ({
      ...current,
      literacyCards: current.literacyCards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [key]: value } : card),
    }));
  }

  function addAcademyEvent() {
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
    setContent((current) => ({ ...current, academyEvents: [...current.academyEvents, {
      date: today, endDate: today, category: "학원 일정", title: "",
    }] }));
    setMessage("새 일정 입력칸을 추가했습니다. 내용을 입력한 뒤 ‘일정 변경사항 저장’을 눌러 주세요.");
    window.setTimeout(() => {
      const rows = document.querySelectorAll<HTMLElement>(".admin-event-row");
      const lastRow = rows.item(rows.length - 1);
      lastRow?.scrollIntoView({ behavior: "smooth", block: "center" });
      lastRow?.querySelector<HTMLInputElement>('input[aria-label="일정 내용"]')?.focus();
    }, 50);
  }

  function updateAcademyEvent(index: number, key: "date" | "endDate" | "category" | "title", value: string) {
    setContent((current) => ({ ...current, academyEvents: current.academyEvents.map((item, itemIndex) =>
      itemIndex === index
        ? { ...item, [key]: value, ...(key === "date" && (!item.endDate || item.endDate < value) ? { endDate: value } : {}) }
        : item) }));
  }

  function removeAcademyEvent(index: number) {
    setContent((current) => ({ ...current, academyEvents: current.academyEvents.filter((_, itemIndex) => itemIndex !== index) }));
  }

  const filteredConsultations = useMemo(() => {
    const query = consultationQuery.trim().toLowerCase();
    if (!query) return consultations;
    return consultations.filter((item) =>
      [item.studentName, item.phone, item.grade, item.consultationAt, item.learningExperience, item.desiredDirection]
        .join(" ").toLowerCase().includes(query),
    );
  }, [consultations, consultationQuery]);

  const filteredResults = useMemo(() => {
    const query = levelQuery.trim().toLowerCase();
    if (!query) return levelResults;
    return levelResults.filter((item) =>
      [item.studentName, item.phone, item.trackLabel, item.score].join(" ").toLowerCase().includes(query),
    );
  }, [levelResults, levelQuery]);

  const filteredDailyResults = useMemo(() => {
    const query = dailyQuery.trim().toLowerCase();
    if (!query) return dailyResults;
    return dailyResults.filter((item) => [item.studentName, item.phone, item.levelLabel, item.testDate, item.score].join(" ").toLowerCase().includes(query));
  }, [dailyResults, dailyQuery]);

  function dailyMessage(item: DailyResult, type: "sms" | "kakao") {
    const savedTemplate = type === "sms" ? content.dailyResultMessage : content.dailyKakaoMessage;
    const templates = type === "sms"
      ? [
          ...(savedTemplate.length <= 70 ? [savedTemplate] : []),
          "[벌교미래엔영어] {학생명} DAILY {점수}/{총점}점({단계}). 오늘도 수고했습니다!",
          "[벌교미래엔영어] {학생명} {단계} DAILY 결과 {점수}/{총점}점. 꾸준한 도전을 응원합니다!",
          "[벌교미래엔영어] {학생명} 오늘의 DAILY {점수}/{총점}점. 성실하게 잘 마쳤습니다!",
          "[벌교미래엔영어] {학생명} DAILY 완료! {단계} {점수}/{총점}점. 따뜻한 격려 부탁드립니다.",
          "[벌교미래엔영어] {학생명} 오늘 결과 {점수}/{총점}점({단계}). 내일도 힘차게 응원합니다!",
        ]
      : [
          ...(savedTemplate.length >= 140 ? [savedTemplate] : []),
          "[벌교미래엔영어학원]\n안녕하세요, 학부모님.\n{학생명} 학생이 오늘도 영어 공부를 성실하게 마쳤습니다.\n\n■ {날짜} DAILY 미니테스트\n단계: {단계}\n결과: {점수}/{총점}점\n\n점수도 소중하지만 매일 빠짐없이 도전하고 끝까지 해낸 과정이 더욱 값진 성장입니다. 오늘의 작은 노력이 탄탄한 영어 실력과 자신감으로 이어지도록 학원에서도 세심하게 살피고 따뜻하게 지도하겠습니다.\n\n가정에서도 '오늘도 정말 수고했어'라는 격려 한마디 부탁드립니다.\n{링크}",
          "[벌교미래엔영어학원]\n학부모님께 반가운 학습 소식을 전해드립니다.\n\n{학생명} 학생이 {단계} DAILY 미니테스트에 참여하여 {점수}/{총점}점을 받았습니다. 틀린 문제까지 다시 살펴보는 습관은 앞으로의 실력을 키우는 든든한 밑거름이 됩니다.\n\n결과에 조급해하지 않고 학생의 속도에 맞춰 한 걸음씩 성장할 수 있도록 정성을 다해 지도하겠습니다. 오늘 꾸준히 해낸 노력에 따뜻한 칭찬과 격려를 보내주세요. 함께 응원해 주셔서 감사합니다.\n{링크}",
          "[벌교미래엔영어학원]\n오늘도 애쓴 {학생명} 학생의 학습 결과를 안내드립니다.\n\n{날짜} {단계} DAILY 미니테스트\n결과: {점수}/{총점}점\n\n매일 듣기·단어·리딩을 조금씩 반복하는 과정이 쌓이면 문장을 이해하는 힘과 문제를 해결하는 자신감이 자랍니다. 잘한 부분은 충분히 칭찬하고 어려웠던 부분은 차근차근 보완하겠습니다.\n\n오늘 스스로 끝까지 해낸 점을 먼저 칭찬해 주세요. 학원도 학생의 성장을 늘 가까이에서 응원하겠습니다.\n{링크}",
          "[벌교미래엔영어학원]\n학부모님, {학생명} 학생이 오늘의 {단계} DAILY 미니테스트를 끝까지 잘 마쳤습니다.\n결과는 {점수}/{총점}점입니다.\n\n한 번의 점수보다 중요한 것은 어제보다 조금 더 알고, 조금 더 자신 있게 문제에 도전하는 마음입니다. 잘 이해한 부분은 더 단단하게 만들고 어려워한 부분은 부담 없이 다시 도전하도록 세심하게 지도하겠습니다.\n\n오늘의 성실한 노력이 내일의 좋은 변화로 이어질 수 있도록 따뜻한 응원 부탁드립니다.\n{링크}",
        ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const values: Record<string, string> = {
      학생명: item.studentName, 날짜: item.testDate, 단계: item.levelLabel,
      점수: String(item.score), 총점: String(item.total),
      링크: "https://vercel-deploy-mauve-one-18.vercel.app/academy#daily-mini-test",
    };
    const baseMessage = Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template)
      .replaceAll("벌교미래N영어학원", "벌교미래엔영어").replaceAll("벌교미래엔영어학원", "벌교미래엔영어");
    if (type !== "sms") return baseMessage;

    const wrongTotal = Math.max(item.total - item.score, 0);
    const percentageScore = percent(item.score, item.total);

    const compactAreas = [
      `단어 ${item.vocabulary}/${item.vocabularyTotal}(오답${Math.max(item.vocabularyTotal - item.vocabulary, 0)})`,
      ...((item.grammarTotal ?? 0) > 0 ? [`문법 ${item.grammar ?? 0}/${item.grammarTotal}(오답${Math.max((item.grammarTotal ?? 0) - (item.grammar ?? 0), 0)})`] : []),
      `듣기 ${item.listening}/${item.listeningTotal}(오답${Math.max(item.listeningTotal - item.listening, 0)})`,
      `리딩 ${item.reading}/${item.readingTotal}(오답${Math.max(item.readingTotal - item.reading, 0)})`,
    ].join(" · ");
    return `[벌교미래엔영어]\n${item.studentName} 학생 DAILY 결과\n${compactAreas}\n전체 ${item.score}/${item.total}(오답${wrongTotal}) · ${percentageScore}점\n\n오늘도 끝까지 풀어낸 모습이 대견합니다.\n오답은 부담 없이 이해하도록 따뜻하게 지도하겠습니다^^`;
  }

  function generateDailySmsDraft(item: DailyResult) {
    const text = dailyMessage(item, "sms");
    setDailySmsDrafts((current) => ({ ...current, [item.id]: text }));
    setMessage(`${item.studentName} 학생의 영역별 결과와 따뜻한 피드백 문자내용을 생성했습니다.`);
  }

  async function sendDailyKakao(item: DailyResult) {
    const statusKey = `daily-${item.id}-kakao`;
    const link = "https://vercel-deploy-mauve-one-18.vercel.app/academy#daily-mini-test";
    const text = dailyMessage(item, "kakao");
    updateSendStatus(statusKey, { state: "sending", message: "카카오 알림톡 발송을 요청하는 중입니다…" });
    const response = await fetch("/api/admin/send-kakao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        to: item.phone,
        text,
        studentName: item.studentName,
        testDate: item.testDate,
        levelLabel: item.levelLabel,
        score: item.score,
        total: item.total,
        link,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string; messageId?: string };
    const status = result.message ?? (response.ok ? "카카오 알림톡이 발송되었습니다." : "카카오 알림톡 발송에 실패했습니다.");
    updateSendStatus(statusKey, { state: response.ok ? "success" : "error", message: response.ok ? `${status}${result.messageId ? ` · 접수번호 ${result.messageId}` : ""}` : status });
    setMessage(`${status}\n\n이번에 자동 생성된 문구:\n${text}`);
  }

  async function sendDailySms(item: DailyResult) {
    const statusKey = `daily-${item.id}-sms`;
    const text = dailySmsDrafts[item.id] || dailyMessage(item, "sms");
    updateSendStatus(statusKey, { state: "sending", message: "문자 발송을 요청하는 중입니다…" });
    const response = await fetch("/api/admin/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ to: item.phone, text }),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string; messageId?: string };
    const status = result.message ?? (response.ok ? "문자가 발송되었습니다." : "문자 발송에 실패했습니다.");
    updateSendStatus(statusKey, { state: response.ok ? "success" : "error", message: response.ok ? `${status}${result.messageId ? ` · 접수번호 ${result.messageId}` : ""}` : status });
    setMessage(`${status}\n\n이번에 자동 생성된 문구:\n${text}`);
  }

  function levelMessage(item: LevelResult, type: "sms" | "kakao") {
    const feedback = levelEvaluation(item);
    const template = type === "sms" ? content.levelResultMessage : content.levelKakaoMessage;
    const values: Record<string, string> = {
      학생명: item.studentName,
      날짜: koreanDate(item.createdAt),
      단계: item.trackLabel,
      점수: String(item.score),
      총점: String(item.total),
      어휘: `${item.vocabulary}/${item.vocabularyTotal}`,
      문법: `${item.grammar}/${item.grammarTotal}`,
      리딩: `${item.reading}/${item.readingTotal}`,
      피드백: feedback,
      링크: "https://vercel-deploy-mauve-one-18.vercel.app/academy#level-test",
    };
    return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template)
      .replaceAll("벌교미래N영어학원", "벌교미래엔영어").replaceAll("벌교미래엔영어학원", "벌교미래엔영어");
  }

  async function sendLevelSms(item: LevelResult) {
    const statusKey = `level-${item.id}-sms`;
    const text = levelMessage(item, "sms");
    updateSendStatus(statusKey, { state: "sending", message: "문자 발송을 요청하는 중입니다…" });
    const response = await fetch("/api/admin/send-sms", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ to: item.phone, text }),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string; messageId?: string };
    const status = result.message ?? (response.ok ? "레벨테스트 결과 문자가 발송되었습니다." : "문자 발송에 실패했습니다.");
    updateSendStatus(statusKey, { state: response.ok ? "success" : "error", message: response.ok ? `${status}${result.messageId ? ` · 접수번호 ${result.messageId}` : ""}` : status });
    setMessage(`${status}\n\n자동 생성된 문구:\n${text}`);
  }

  async function sendLevelKakao(item: LevelResult) {
    const statusKey = `level-${item.id}-kakao`;
    const link = "https://vercel-deploy-mauve-one-18.vercel.app/academy#level-test";
    const text = levelMessage(item, "kakao");
    updateSendStatus(statusKey, { state: "sending", message: "카카오 알림톡 발송을 요청하는 중입니다…" });
    const response = await fetch("/api/admin/send-kakao", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ to: item.phone, text, studentName: item.studentName, testDate: koreanDate(item.createdAt), levelLabel: item.trackLabel, score: item.score, total: item.total, link }),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string; messageId?: string };
    const status = result.message ?? (response.ok ? "레벨테스트 카카오 알림톡이 발송되었습니다." : "카카오 알림톡 발송에 실패했습니다.");
    updateSendStatus(statusKey, { state: response.ok ? "success" : "error", message: response.ok ? `${status}${result.messageId ? ` · 접수번호 ${result.messageId}` : ""}` : status });
    setMessage(`${status}\n\n자동 생성된 문구:\n${text}`);
  }

  const todayCount = consultations.filter((item) =>
    new Date(item.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) ===
    new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }),
  ).length;
  const averageScore = levelResults.length
    ? (levelResults.reduce((sum, item) => sum + (item.score / Math.max(item.total, 1)) * 100, 0) / levelResults.length).toFixed(0)
    : "0";

  if (view === "checking") return <main className="admin-page"><div className="admin-loading">관리자 페이지를 확인하는 중입니다.</div></main>;

  if (view === "login") {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login">
          <div className="admin-login-mark">M</div>
          <p className="admin-kicker">BEOLGYO MIRAEN ENGLISH</p>
          <h1>관리자 페이지</h1>
          <p>상담 신청자와 레벨테스트 결과, 학원 홈페이지 내용을 안전하게 관리합니다.</p>
          <form onSubmit={handleLogin}>
            <label><span>관리자 비밀번호</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus placeholder="비밀번호를 입력하세요" /></label>
            <button type="submit">관리자 페이지 입장 <b>→</b></button>
          </form>
          {message && <p className="admin-error" role="alert">{message}</p>}
          <a href="/academy">← 학원 랜딩페이지로 돌아가기</a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div><p className="admin-kicker">BEOLGYO MIRAEN ADMIN</p><h1>학원 통합 관리</h1><p>상담 신청과 레벨테스트 결과를 검색하고 엑셀로 내려받을 수 있습니다.</p></div>
          <div className="admin-header-actions"><a href="/academy" target="_blank">랜딩페이지 보기</a><button type="button" onClick={logout}>로그아웃</button></div>
        </header>

        <nav className="admin-section-tabs" aria-label="관리 메뉴">
          <strong>빠른 관리</strong><a href="#admin-consultations">상담 신청자</a><a href="#admin-level-results">레벨테스트 결과</a><a href="#admin-daily-results">DAILY 결과</a><a href="#admin-monthly-report">월간 평가표</a><a href="#admin-daily-message">문자·카톡 설정</a><a href="#admin-profile">기본정보</a><a href="#admin-calendar">학원일정</a>
        </nav>

        <section className="admin-record-summary">
          <article><span>전체 상담 신청</span><strong>{consultations.length}<small>명</small></strong></article>
          <article><span>오늘 상담 신청</span><strong>{todayCount}<small>명</small></strong></article>
          <article><span>DAILY 테스트 결과</span><strong>{dailyResults.length}<small>건</small></strong></article>
          <article><span>평균 정답률</span><strong>{averageScore}<small>%</small></strong></article>
        </section>

        <section className="admin-record-card" id="admin-consultations">
          <div className="admin-record-heading">
            <div><p>CONSULTATION APPLICATIONS</p><h2>상담 신청자 목록</h2><small>이름, 연락처, 학년, 상담 내용으로 검색할 수 있습니다.</small></div>
            <div className="admin-record-toolbar">
              <input value={consultationQuery} onChange={(e) => setConsultationQuery(e.target.value)} placeholder="이름·연락처·학년 검색" aria-label="상담 신청자 검색" />
              <button type="button" onClick={loadRecords}>{recordsLoading ? "불러오는 중…" : "새로고침"}</button>
              <a href="/api/admin/export/consultations">엑셀 파일 다운로드</a>
            </div>
          </div>
          <div className="admin-record-table-wrap">
            <table className="admin-record-table"><thead><tr><th>신청일시</th><th>학생 이름</th><th>연락처</th><th>학년</th><th>희망 상담일시</th><th>학습 경험·상담 내용</th></tr></thead>
              <tbody>{filteredConsultations.map((item) => <tr key={item.id}><td>{koreanDate(item.createdAt)}</td><td><b>{item.studentName}</b></td><td><a href={`tel:${item.phone}`}>{item.phone}</a></td><td>{item.grade}</td><td>{item.consultationAt.replace("T", " ")}</td><td className="admin-record-detail">{item.learningExperience}<br /><small>{item.desiredDirection}</small></td></tr>)}
              {!filteredConsultations.length && <tr><td colSpan={6} className="admin-record-empty">검색 조건에 맞는 상담 신청자가 없습니다.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <section className="admin-record-card" id="admin-level-results">
          <div className="admin-record-heading">
            <div><p>LEVEL TEST RESULTS</p><h2>무료 레벨테스트 결과</h2><small>학생 이름, 연락처, 응시 레벨, 점수로 검색할 수 있습니다.</small></div>
            <div className="admin-record-toolbar">
              <input value={levelQuery} onChange={(e) => setLevelQuery(e.target.value)} placeholder="이름·연락처·레벨 검색" aria-label="레벨테스트 결과 검색" />
              <button type="button" onClick={loadRecords}>{recordsLoading ? "불러오는 중…" : "새로고침"}</button>
              <a href="/api/admin/export/level-results">엑셀 파일 다운로드</a>
            </div>
          </div>
          <div className="admin-record-table-wrap">
            <table className="admin-record-table"><thead><tr><th>응시일시</th><th>학생 이름</th><th>연락처</th><th>응시 레벨</th><th>총점</th><th>영역별 결과</th><th>결과 전송·평가지</th></tr></thead>
              <tbody>{filteredResults.map((item) => { const sms = sendStatuses[`level-${item.id}-sms`]; const kakao = sendStatuses[`level-${item.id}-kakao`]; return <tr key={item.id}><td>{koreanDate(item.createdAt)}</td><td><b>{item.studentName}</b></td><td><a href={`tel:${item.phone}`}>{item.phone}</a></td><td>{item.trackLabel}</td><td><b>{item.score}/{item.total}</b></td><td>어휘 {item.vocabulary}/{item.vocabularyTotal} · 문법 {item.grammar}/{item.grammarTotal} · 리딩 {item.reading}/{item.readingTotal}</td><td><div className="admin-result-send admin-level-send"><button type="button" disabled={sms?.state === "sending"} onClick={() => sendLevelSms(item)}>{sms?.state === "sending" ? "문자 발송 중…" : "문자 즉시발송"}</button><button type="button" disabled={kakao?.state === "sending"} onClick={() => sendLevelKakao(item)}>{kakao?.state === "sending" ? "카카오 발송 중…" : "카카오톡 즉시발송"}</button><button className="admin-level-print-button" type="button" onClick={() => setPrintLevelResult(item)}>평가지 출력</button>{sms && <p className={`admin-send-feedback ${sms.state}`}>문자: {sms.message}</p>}{kakao && <p className={`admin-send-feedback ${kakao.state}`}>카카오톡: {kakao.message}</p>}</div></td></tr>; })}
              {!filteredResults.length && <tr><td colSpan={7} className="admin-record-empty">검색 조건에 맞는 레벨테스트 결과가 없습니다.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        {printLevelResult && (
          <div className="admin-level-report-modal" role="dialog" aria-modal="true" aria-label="레벨테스트 평가지">
            <div className="admin-level-report-toolbar"><strong>{printLevelResult.studentName} 학생 평가지</strong><div><button type="button" onClick={() => window.print()}>인쇄·PDF 저장</button><button type="button" onClick={() => setPrintLevelResult(null)}>닫기</button></div></div>
            <div className="admin-level-message-preview">
              <article><span>문자 자동 전송 내용</span><p>{levelMessage(printLevelResult, "sms")}</p><button type="button" onClick={() => sendLevelSms(printLevelResult)}>이 내용으로 문자 발송</button></article>
              <article><span>카카오톡 자동 전송 내용</span><p>{levelMessage(printLevelResult, "kakao")}</p><button type="button" onClick={() => sendLevelKakao(printLevelResult)}>이 내용으로 카카오톡 발송</button></article>
            </div>
            <article className="level-report-paper">
              <header><div><span>BEOLGYO MIRAE-N ENGLISH</span><h4>영어 레벨 진단 평가지</h4></div><strong>{printLevelResult.trackLabel}</strong></header>
              <div className="level-report-profile"><span>학생명<b>{printLevelResult.studentName}</b></span><span>학령 구분<b>{schoolStage(printLevelResult.trackLabel)}</b></span><span>종합점수<b>{percent(printLevelResult.score, printLevelResult.total)}점</b></span><span>응시일<b>{koreanDate(printLevelResult.createdAt)}</b></span></div>
              <div className="level-report-areas">
                {[
                  [schoolStage(printLevelResult.trackLabel) === "파닉스" ? "파닉스·어휘" : "어휘", printLevelResult.vocabulary, printLevelResult.vocabularyTotal],
                  ["문법", printLevelResult.grammar, printLevelResult.grammarTotal],
                  ["리딩", printLevelResult.reading, printLevelResult.readingTotal],
                ].map(([label, score, total]) => { const value = percent(Number(score), Number(total)); return <div key={String(label)}><span>{label}</span><strong>{value}</strong><small>점</small><i><b style={{ width: `${value}%` }} /></i><small>{score}/{total} 정답</small></div>; })}
              </div>
              <div className="level-diagnostic-heading"><div><p>DETAILED LEVEL ANALYSIS</p><h5>영역별 상세 분석표</h5></div><span>상 80% 이상 · 중 50~79% · 하 49% 이하</span></div>
              <div className="level-diagnostic-table-wrap">
                <table className="level-diagnostic-table">
                  <thead><tr><th>영역</th><th>수준</th><th>진단 해석</th><th>추천 학습 방향</th></tr></thead>
                  <tbody>{levelDiagnostics(printLevelResult).map((entry) => <tr key={entry.area}><td><b>{entry.area}</b><small>{entry.score}/{entry.total} 정답</small></td><td><strong className={`band-${entry.band}`}>{entry.band}</strong></td><td>{entry.assessment}</td><td>{entry.direction}</td></tr>)}</tbody>
                </table>
              </div>
              {(() => { const deep = deepLevelAnalysis(printLevelResult); return <>
                <div className="level-deep-summary">
                  <article><span>CURRENT PLACEMENT</span><small>현재 진단 위치</small><strong>{deep.placement}</strong><p>{deep.stage} 기준 종합 {deep.overall}점 · {deep.overallBand} 수준</p></article>
                  <article><span>CORE STRENGTH</span><small>핵심 강점</small><strong>{deep.strongest.area} {deep.strongest.value}점</strong><p>{deep.strongest.assessment}</p></article>
                  <article><span>FIRST PRIORITY</span><small>최우선 보완</small><strong>{deep.priority.area} {deep.priority.value}점</strong><p>{deep.priority.direction}</p></article>
                </div>
                <section className="level-deep-comment"><p>IN-DEPTH INTERPRETATION</p><h5>심층 진단 해석</h5><div>{deep.interpretation}</div></section>
                <div className="level-learning-plan"><div className="level-learning-plan-heading"><p>4-WEEK LEARNING ROADMAP</p><h5>추천 4주 학습 로드맵</h5></div><ol>{deep.plan.map((step) => <li key={step.period}><span>{step.period}</span><div><b>{step.title}</b><p>{step.detail}</p></div></li>)}</ol></div>
              </>; })()}
              <section><p>TEACHER&apos;S COMMENT</p><h5>종합평가 및 학습 방향</h5><div>{levelEvaluation(printLevelResult)} 학생의 학습 속도와 오답 반응을 수업 중 추가로 관찰하여 교재 난이도와 과제량을 조정하는 것을 권합니다.</div></section>
              <footer><b>벌교미래엔영어</b><span>학생에게 꼭 맞는 출발점에서 차근차근 함께하겠습니다.</span></footer>
            </article>
          </div>
        )}

        <section className="admin-record-card" id="admin-daily-results">
          <div className="admin-record-heading">
            <div><p>DAILY MINI TEST RESULTS</p><h2>DAILY 미니테스트 결과 관리</h2><small>학생별 점수와 듣기·단어·문법·리딩 결과를 확인하고 메시지를 전송합니다.</small></div>
            <div className="admin-record-toolbar">
              <input value={dailyQuery} onChange={(e) => setDailyQuery(e.target.value)} placeholder="이름·연락처·단계 검색" aria-label="DAILY 결과 검색" />
              <button type="button" onClick={loadRecords}>{recordsLoading ? "불러오는 중…" : "새로고침"}</button>
              <a href="/api/admin/export/daily-results">엑셀 파일 다운로드</a>
            </div>
          </div>
          <div className="admin-record-table-wrap">
            <table className="admin-record-table"><thead><tr><th>응시일</th><th>학생</th><th>연락처</th><th>단계</th><th>총점</th><th>영역별 결과</th><th>결과 전송</th></tr></thead>
              <tbody>{filteredDailyResults.map((item) => { const sms = sendStatuses[`daily-${item.id}-sms`]; const kakao = sendStatuses[`daily-${item.id}-kakao`]; const draft = dailySmsDrafts[item.id]; return <tr key={item.id}><td>{item.testDate}</td><td><b>{item.studentName}</b></td><td><a href={`tel:${item.phone}`}>{item.phone}</a></td><td>{item.levelLabel}</td><td><b>{item.score}/{item.total}</b></td><td>듣기 {item.listening}/{item.listeningTotal} · 단어 {item.vocabulary}/{item.vocabularyTotal}{(item.grammarTotal ?? 0) > 0 ? ` · 문법 ${item.grammar ?? 0}/${item.grammarTotal}` : ""} · 리딩 {item.reading}/{item.readingTotal}</td><td><div className="admin-result-send"><button type="button" disabled={sms?.state === "sending"} onClick={() => sendDailySms(item)}>{sms?.state === "sending" ? "문자 발송 중…" : "문자 즉시발송"}</button><button type="button" disabled={kakao?.state === "sending"} onClick={() => sendDailyKakao(item)}>{kakao?.state === "sending" ? "카카오 발송 중…" : "카카오톡 즉시발송"}</button><button className="admin-message-generate" type="button" onClick={() => generateDailySmsDraft(item)}>문자내용 생성</button>{draft && <textarea className="admin-message-preview" aria-label={`${item.studentName} 문자내용 미리보기`} value={draft} readOnly rows={14} />}{sms && <p className={`admin-send-feedback ${sms.state}`}>문자: {sms.message}</p>}{kakao && <p className={`admin-send-feedback ${kakao.state}`}>카카오톡: {kakao.message}</p>}</div></td></tr>; })}
              {!filteredDailyResults.length && <tr><td colSpan={7} className="admin-record-empty">저장된 DAILY 미니테스트 결과가 없습니다.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <MonthlyDailyReport items={dailyResults} />

        <p className="admin-privacy-note">신청자 개인정보는 상담 및 학습 안내 목적으로만 확인하고 안전하게 관리해 주세요.</p>

        <form className="admin-form" id="admin-content" onSubmit={saveContent}>
          <section className="admin-card" id="admin-daily-message">
            <div className="admin-card-heading"><span>00</span><div><p>MESSAGE AUTOMATION</p><h2>DAILY 결과 문자·카카오톡 설정</h2></div><em>결과 전송 버튼에 자동 적용</em></div>
            <div className="solapi-connection-panel">
              <div className={solapiStatus?.smsConfigured ? "connected" : "disconnected"}><b>솔라피 문자</b><span>{solapiStatus?.message ?? "연결 상태 확인 중…"}</span>{solapiStatus?.smsConfigured && <small>잔액 {Number(solapiStatus.balance ?? 0).toLocaleString()}원 · 포인트 {Number(solapiStatus.point ?? 0).toLocaleString()}P</small>}</div>
              <div className={solapiStatus?.kakaoConfigured ? "connected" : "disconnected"}><b>카카오 알림톡</b><span>{solapiStatus?.kakaoConfigured ? "카카오 채널과 승인된 알림톡 템플릿이 연결되었습니다." : "알림톡은 카카오 정책상 채널 연결과 승인 템플릿이 반드시 필요합니다. 설정 전에는 버튼을 누르면 정확한 실패 사유가 바로 표시됩니다."}</span></div>
              <button type="button" onClick={loadSolapiStatus}>연결 상태 다시 확인</button>
            </div>
            <div className="admin-fields">
              <label className="wide"><span>문자 자동 메시지</span><textarea rows={4} value={content.dailyResultMessage} onChange={(e) => updateText("dailyResultMessage", e.target.value)} /><small>사용 가능: {"{학생명} {날짜} {단계} {점수} {총점} {링크}"}</small></label>
              <label className="wide"><span>카카오톡 공유 메시지</span><textarea rows={4} value={content.dailyKakaoMessage} onChange={(e) => updateText("dailyKakaoMessage", e.target.value)} /><small>저장 후 학생 결과의 문자·카카오톡 버튼에 자동 적용됩니다.</small></label>
              <label className="wide"><span>레벨테스트 문자 자동 메시지</span><textarea rows={5} value={content.levelResultMessage} onChange={(e) => updateText("levelResultMessage", e.target.value)} /><small>사용 가능: {"{학생명} {날짜} {단계} {점수} {총점} {어휘} {문법} {리딩} {피드백} {링크}"}</small></label>
              <label className="wide"><span>레벨테스트 카카오톡 자동 메시지</span><textarea rows={6} value={content.levelKakaoMessage} onChange={(e) => updateText("levelKakaoMessage", e.target.value)} /><small>학생 점수에 맞는 피드백이 {"{피드백}"} 위치에 자동 생성됩니다.</small></label>
            </div>
          </section>

          <section className="admin-card" id="admin-profile">
            <div className="admin-card-heading"><span>01</span><div><p>ACADEMY PROFILE</p><h2>학원 기본 정보</h2></div><em>상단·연락처·하단에 반영</em></div>
            <div className="admin-fields">
              <label><span>학원 이름</span><input value={content.academyName} onChange={(e) => updateText("academyName", e.target.value)} /></label>
              <label><span>상담 전화번호</span><input value={content.academyPhone} onChange={(e) => updateText("academyPhone", e.target.value)} /></label>
              <label><span>테스트 완료 알림 이메일</span><input type="email" value={content.notificationEmail} onChange={(e) => updateText("notificationEmail", e.target.value)} placeholder="jinsim84@kakao.com" /></label>
              <label className="wide"><span>학원 주소</span><input value={content.academyAddress} onChange={(e) => updateText("academyAddress", e.target.value)} /></label>
              <label className="wide"><span>위치 안내</span><input value={content.academyLocationNote} onChange={(e) => updateText("academyLocationNote", e.target.value)} /></label>
            </div>
          </section>

          <section className="admin-card" id="admin-hero">
            <div className="admin-card-heading"><span>02</span><div><p>MAIN HERO</p><h2>메인 화면 문구</h2></div><em>첫 화면 전체 문구 관리</em></div>
            <div className="admin-fields">
              <label className="wide"><span>상단 안내 문구</span><input value={content.heroEyebrow} onChange={(e) => updateText("heroEyebrow", e.target.value)} /></label>
              <label className="wide"><span>메인 제목 앞부분</span><textarea rows={2} value={content.heroTitleBefore} onChange={(e) => updateText("heroTitleBefore", e.target.value)} /><small>줄바꿈이 필요한 위치에서 Enter를 누르세요.</small></label>
              <label><span>강조 문구</span><input value={content.heroTitleAccent} onChange={(e) => updateText("heroTitleAccent", e.target.value)} /></label>
              <label><span>메인 제목 뒷부분</span><input value={content.heroTitleAfter} onChange={(e) => updateText("heroTitleAfter", e.target.value)} /></label>
              <label className="wide"><span>메인 소개 설명</span><textarea rows={4} value={content.heroDescription} onChange={(e) => updateText("heroDescription", e.target.value)} /></label>
            </div>
          </section>

          <section className="admin-card" id="admin-calendar">
            <div className="admin-card-heading"><span>03</span><div><p>ACADEMY CALENDAR</p><h2>학원 일정 관리</h2></div><em>학원 일정 달력에 반영</em></div>
            <div className="admin-calendar-actions">
              <p>하루 일정은 시작일과 종료일을 같게, 방학·시험기간은 종료일을 이어서 설정하세요.</p>
              <div><button type="button" className="admin-calendar-add" onClick={addAcademyEvent} aria-label="새 학원 일정 입력칸 추가">+ 일정 추가</button><button type="button" className="admin-calendar-save" onClick={saveCalendarChanges} disabled={calendarSaving}>{calendarSaving ? "일정 저장 중…" : "일정 변경사항 저장"}</button></div>
            </div>
            <div className="admin-event-list">
              {content.academyEvents.map((item, index) => (
                <div className="admin-event-row" key={`${item.date}-${index}`}>
                  <label className="admin-event-date"><span>시작일</span><input type="date" value={item.date} onChange={(e) => updateAcademyEvent(index, "date", e.target.value)} aria-label="일정 시작일" /></label>
                  <label className="admin-event-date"><span>종료일</span><input type="date" min={item.date} value={item.endDate || item.date} onChange={(e) => updateAcademyEvent(index, "endDate", e.target.value)} aria-label="일정 종료일" /></label>
                  <input value={item.category} onChange={(e) => updateAcademyEvent(index, "category", e.target.value)} placeholder="분류" aria-label="일정 분류" />
                  <input value={item.title} onChange={(e) => updateAcademyEvent(index, "title", e.target.value)} placeholder="일정 내용을 입력하세요" aria-label="일정 내용" />
                  <button type="button" onClick={() => removeAcademyEvent(index)}>삭제</button>
                </div>
              ))}
              {!content.academyEvents.length && <p className="admin-event-empty">등록된 일정이 없습니다. 일정 추가 버튼을 눌러 시작하세요.</p>}
            </div>
          </section>

          <section className="admin-card" id="admin-score">
            <div className="admin-card-heading"><span>04</span><div><p>SCORE RESULTS</p><h2>성적 향상 사례</h2></div><em>소개 문구와 학생 사례 관리</em></div>
            <div className="admin-fields">
              <label><span>영역 제목</span><input value={content.scoreTitle} onChange={(e) => updateText("scoreTitle", e.target.value)} /></label>
              <label><span>강조 문구</span><input value={content.scoreHeadline} onChange={(e) => updateText("scoreHeadline", e.target.value)} /></label>
              <label className="wide"><span>설명 문구</span><textarea rows={3} value={content.scoreSummary} onChange={(e) => updateText("scoreSummary", e.target.value)} /></label>
              <label className="wide"><span>상담 버튼 문구</span><input value={content.scoreCta} onChange={(e) => updateText("scoreCta", e.target.value)} /></label>
            </div>
            <div className="admin-story-grid">
              {content.scoreStories.map((story, index) => (
                <div className="admin-story" key={index}>
                  <strong>성적 사례 0{index + 1}</strong>
                  <input value={story.school} onChange={(e) => updateStory(index, "school", e.target.value)} placeholder="학교" aria-label={`사례 ${index + 1} 학교`} />
                  <input value={story.grade} onChange={(e) => updateStory(index, "grade", e.target.value)} placeholder="학년" aria-label={`사례 ${index + 1} 학년`} />
                  <input value={story.student} onChange={(e) => updateStory(index, "student", e.target.value)} placeholder="학생" aria-label={`사례 ${index + 1} 학생`} />
                  <div><input type="number" min="0" max="100" value={story.before} onChange={(e) => updateStory(index, "before", e.target.value)} aria-label="이전 점수" /><b>→</b><input type="number" min="0" max="100" value={story.after} onChange={(e) => updateStory(index, "after", e.target.value)} aria-label="향상 점수" /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card" id="admin-literacy">
            <div className="admin-card-heading"><span>05</span><div><p>ENGLISH LITERACY</p><h2>영어 문해력 과정</h2></div><em>소개·학습법 카드·버튼 관리</em></div>
            <div className="admin-fields">
              <label className="wide"><span>영역 제목</span><textarea rows={2} value={content.literacyTitle} onChange={(e) => updateText("literacyTitle", e.target.value)} /></label>
              <label className="wide"><span>소개 문구</span><textarea rows={3} value={content.literacyIntro} onChange={(e) => updateText("literacyIntro", e.target.value)} /></label>
              <label><span>핵심 메시지</span><input value={content.literacyStatement} onChange={(e) => updateText("literacyStatement", e.target.value)} /></label>
              <label><span>학습 연결 문구</span><input value={content.literacyBridge} onChange={(e) => updateText("literacyBridge", e.target.value)} /></label>
            </div>
            <div className="admin-literacy-grid">
              {content.literacyCards.map((card, index) => (
                <div className="admin-literacy-card" key={index}>
                  <strong>학습법 0{index + 1}</strong>
                  <label><span>영문 라벨</span><input value={card.eyebrow} onChange={(e) => updateLiteracyCard(index, "eyebrow", e.target.value)} /></label>
                  <label><span>카드 제목</span><input value={card.title} onChange={(e) => updateLiteracyCard(index, "title", e.target.value)} /></label>
                  <label><span>카드 설명</span><textarea rows={4} value={card.description} onChange={(e) => updateLiteracyCard(index, "description", e.target.value)} /></label>
                </div>
              ))}
            </div>
            <div className="admin-fields admin-fields-bottom">
              <label><span>레벨테스트 버튼</span><input value={content.literacyCta} onChange={(e) => updateText("literacyCta", e.target.value)} /></label>
              <label><span>상담 버튼</span><input value={content.literacyCtaSecondary} onChange={(e) => updateText("literacyCtaSecondary", e.target.value)} /></label>
            </div>
          </section>

          <section className="admin-card" id="admin-social">
            <div className="admin-card-heading"><span>06</span><div><p>SOCIAL CHANNELS</p><h2>블로그·인스타그램</h2></div><em>링크 변경 시 QR 자동 갱신</em></div>
            <div className="admin-fields">
              <label className="wide"><span>SNS 영역 제목</span><input value={content.socialTitle} onChange={(e) => updateText("socialTitle", e.target.value)} /></label>
              <label className="wide"><span>SNS 영역 설명</span><textarea rows={3} value={content.socialDescription} onChange={(e) => updateText("socialDescription", e.target.value)} /></label>
              <label><span>네이버 블로그 주소</span><input type="url" value={content.blogUrl} onChange={(e) => updateText("blogUrl", e.target.value)} /></label>
              <label><span>인스타그램 주소</span><input type="url" value={content.instagramUrl} onChange={(e) => updateText("instagramUrl", e.target.value)} /></label>
            </div>
          </section>

          <div className={`admin-save-bar ${message ? "has-message" : ""}`}>
            <p>{message || "모든 항목을 수정한 뒤 저장하면 학원 랜딩페이지에 반영됩니다."}</p>
            <div><a href="/academy" target="_blank">랜딩페이지 미리보기</a><button type="submit" disabled={saving}>{saving ? "전체 내용 저장 중…" : "전체 변경 내용 저장"} <b>→</b></button></div>
          </div>
        </form>
      </div>
    </main>
  );
}
