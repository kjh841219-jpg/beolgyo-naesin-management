"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { fullStudyWeekPlan, planForStage } from "../study-week-plan";

type Student = {
  id: number;
  name: string;
  parentPhone: string;
  school: string;
  grade: string;
};
type RecordItem = {
  studyDate: string;
  examTerm?: string;
  examWeek: string;
  textbook: number;
  grammar: number;
  schoolPrint: number;
  vocabulary: number;
  writing: number;
  problemSolving: number;
  wrongNotebook: number;
  taskScores?: string | Record<string, number>;
  mistakes: string;
  nextAction: string;
  teacherNote: string;
};
type QuizResult = {
  types?: {
    quizType: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
};
type HomeworkItem = {
  studentId: number;
  homeworkDate: string;
  title: string;
  completedItems?: string;
  studentNote?: string;
  autoFeedback?: string;
};
type HomeworkSubmission = {
  studentId: number;
  homeworkDate: string;
  title: string;
  studentNote?: string;
  fileName?: string;
};
type SendPreview = { phone: string; image: Blob; imageUrl: string };
const fields = [
  ["본문", "textbook"],
  ["문법", "grammar"],
  ["학교 프린트", "schoolPrint"],
  ["단어", "vocabulary"],
  ["서술형", "writing"],
  ["문제풀이", "problemSolving"],
  ["오답노트", "wrongNotebook"],
] as const;
const academyPastels = [
  "#8fc9a3",
  "#9fc5e8",
  "#b9a7d9",
  "#f2b8a0",
  "#e9d58a",
  "#91d5c1",
  "#dfa6b3",
] as const;
const examTerms = [
  "1학기 중간고사",
  "1학기 기말고사",
  "2학기 중간고사",
  "2학기 기말고사",
];
const clamp = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value || 0)));
function parsedTaskScores(record?: RecordItem) {
  if (!record?.taskScores) return {} as Record<string, number>;
  if (typeof record.taskScores === "object") return record.taskScores;
  try {
    return JSON.parse(record.taskScores) as Record<string, number>;
  } catch {
    return {};
  }
}
const recordAverage = (record?: RecordItem) => {
  if (!record) return 0;
  const scores = parsedTaskScores(record),
    explicit = Number(scores._overall);
  if (Number.isFinite(explicit)) return clamp(explicit);
  const values = Object.entries(scores)
    .filter(([key]) => !key.startsWith("_"))
    .map(([, value]) => Number(value));
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : Math.round(
        fields.reduce((sum, [, key]) => sum + record[key], 0) / fields.length,
      );
};
function quizCategory(type: string) {
  const value = type.toLowerCase();
  if (value.includes("word")) return "단어 퀴즈";
  if (value.includes("blank")) return "빈칸 퀴즈";
  if (value.includes("dialog")) return "대화문 퀴즈";
  return "본문 퀴즈";
}
function latestByStudyDate(items: RecordItem[]) {
  const dates = new Set<string>();
  return items.filter((item) => {
    if (dates.has(item.studyDate)) return false;
    dates.add(item.studyDate);
    return true;
  });
}
function weekNumber(value: string, taskScores?: string | Record<string, number>) {
  // A student-selected non-default week is authoritative. Older records were
  // saved with the default "4주 전" value, so only those need label recovery.
  if (value.includes("2주차") || value.startsWith("3주 전")) return 2;
  if (value.includes("3주차") || value.startsWith("2주 전")) return 3;
  if (value.includes("4주차") || value.startsWith("1주 전")) return 4;
  if (value.includes("1주차") && !value.startsWith("4주 전")) return 1;
  let labels = "";
  try {
    const parsed = typeof taskScores === "string" ? JSON.parse(taskScores) : taskScores;
    labels = parsed && typeof parsed === "object" ? Object.keys(parsed).join(" ") : "";
  } catch {}
  if (/두 번째 단원 문법|마지막 학교 프린트물/.test(labels)) return 4;
  if (/두 번째 단원 및 교과서 외부지문|외부지문/.test(labels)) return 3;
  if (/첫 번째 단원 문법|그래머 인사이트/.test(labels)) return 2;
  if (/첫 번째 단원 (단어|대화문|본문) 암기/.test(labels)) return 1;
  if (value.includes("1주차") || value.startsWith("4주 전")) return 1;
  return 0;
}
function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(","),
    bytes = atob(encoded),
    array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new Blob([array], {
    type: header.match(/data:(.*?);/)?.[1] || "image/jpeg",
  });
}
function solapiReadyJpeg(source: HTMLCanvasElement) {
  const maxWidth = 1500,
    maxHeight = 1440,
    maxBytes = 195000;
  let scale = Math.min(1, maxWidth / source.width, maxHeight / source.height),
    canvas = document.createElement("canvas");
  const redraw = () => {
    canvas.width = Math.max(1, Math.floor(source.width * scale));
    canvas.height = Math.max(1, Math.floor(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("솔라피 전송 이미지를 만들지 못했습니다.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
  };
  redraw();
  let quality = 0.86,
    blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality));
  while (blob.size > maxBytes && quality > 0.3) {
    quality -= 0.07;
    blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality));
  }
  while (blob.size > maxBytes && canvas.width > 600) {
    scale *= 0.88;
    redraw();
    quality = 0.72;
    blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality));
  }
  if (
    blob.size > 200000 ||
    canvas.width > maxWidth ||
    canvas.height > maxHeight
  )
    throw new Error("솔라피 MMS 이미지 제한에 맞게 변환하지 못했습니다.");
  return blob;
}
type KakaoSdk = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: {
    uploadImage: (value: {
      file: File[];
    }) => Promise<{ infos: { original: { url: string } } }>;
    sendDefault: (value: unknown) => void;
  };
};
async function loadKakaoSdk() {
  const current = window as typeof window & { Kakao?: KakaoSdk };
  if (current.Kakao) return current.Kakao;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="t1.kakaocdn.net/kakao_js_sdk"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("카카오 SDK를 불러오지 못했습니다.")),
        { once: true },
      );
      if (existing.dataset.loaded === "true") resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () =>
      reject(new Error("카카오 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
  if (!current.Kakao)
    throw new Error("카카오 공유 기능을 시작하지 못했습니다.");
  return current.Kakao;
}
function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 6,
) {
  const words = value.split(/\s+/);
  let line = "",
    lines = 0;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (context.measureText(trial).width > maxWidth && line) {
      context.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = word;
      if (lines >= maxLines) return y;
    } else line = trial;
  }
  if (line && lines < maxLines) {
    context.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}
function wrappedLines(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  const result: string[] = [];
  for (const paragraph of value.split("\n")) {
    if (!paragraph.trim()) {
      result.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (line && context.measureText(trial).width > maxWidth) {
        result.push(line);
        line = word;
      } else line = trial;
    }
    if (line) result.push(line);
  }
  return result;
}

export default function FeedbackReportTools() {
  const [students, setStudents] = useState<Student[]>([]),
    [studentId, setStudentId] = useState(0),
    [records, setRecords] = useState<RecordItem[]>([]),
    [quiz, setQuiz] = useState<QuizResult>({}),
    [homework, setHomework] = useState<HomeworkItem[]>([]),
    [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]),
    [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily"),
    [selectedExamTerm, setSelectedExamTerm] = useState("2학기 기말고사"),
    [selectedWeek, setSelectedWeek] = useState(1),
    [text, setText] = useState(""),
    [recipient, setRecipient] = useState(""),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false);
  const [makeupNotice, setMakeupNotice] = useState(
    "이번 주 토요일 보강시간은 12시입니다.",
  );
  const [previewing, setPreviewing] = useState(false);
  const [sendPreview, setSendPreview] = useState<SendPreview | null>(null);
  const sendLock = useRef(false);
  const previewRestoreStarted = useRef(false);
  useEffect(() => {
    const controls = document.querySelector<HTMLElement>(".feedback-controls");
    if (!controls) return;
    controls.querySelector(".feedback-exam-period-filters")?.remove();
    const panel = document.createElement("div");
    panel.className = "feedback-exam-period-filters";
    panel.style.cssText =
      "display:flex;flex-wrap:wrap;align-items:end;gap:8px;width:100%;padding:12px;border-radius:14px;background:#eef5ff;border:1px solid #cfe0f7";
    const termLabel = document.createElement("label"),
      termTitle = document.createElement("span"),
      termSelect = document.createElement("select");
    termTitle.textContent = "시험 선택";
    termTitle.style.cssText =
      "display:block;font-size:12px;font-weight:800;margin-bottom:4px";
    termSelect.setAttribute("aria-label", "피드백 시험 선택");
    for (const term of examTerms) {
      const option = document.createElement("option");
      option.value = term;
      option.textContent = term;
      option.selected = term === selectedExamTerm;
      termSelect.appendChild(option);
    }
    termSelect.onchange = () => setSelectedExamTerm(termSelect.value);
    termLabel.append(termTitle, termSelect);
    const weekLabel = document.createElement("label"),
      weekTitle = document.createElement("span"),
      weekSelect = document.createElement("select");
    weekTitle.textContent = "주차 선택";
    weekTitle.style.cssText = termTitle.style.cssText;
    weekSelect.setAttribute("aria-label", "피드백 주차 선택");
    for (let week = 1; week <= 4; week++) {
      const option = document.createElement("option");
      option.value = String(week);
      option.textContent = `${week}주차`;
      option.selected = week === selectedWeek;
      weekSelect.appendChild(option);
    }
    weekSelect.onchange = () => setSelectedWeek(Number(weekSelect.value));
    weekLabel.append(weekTitle, weekSelect);
    const monthly = document.createElement("button");
    monthly.type = "button";
    monthly.textContent = "월간";
    monthly.className = period === "monthly" ? "on" : "";
    monthly.onclick = () => setPeriod("monthly");
    panel.append(termLabel, weekLabel, monthly);
    controls.insertBefore(panel, controls.firstChild);
    return () => panel.remove();
  }, [selectedExamTerm, selectedWeek, period]);
  useEffect(() => {
    fetch("/api/admin/learning/students", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || [];
        setStudents(items);
        let savedId = 0;
        try {
          savedId =
            Number(
              JSON.parse(
                sessionStorage.getItem("solapi-pending-preview") || "{}",
              ).studentId,
            ) || 0;
        } catch {}
        const valid = items.some((item: Student) => item.id === savedId);
        if (items[0]) setStudentId(valid ? savedId : items[0].id);
      });
  }, []);
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    const load = () =>
      Promise.all([
        fetch(`/api/admin/learning/records?studentId=${studentId}`, {
          cache: "no-store",
        }).then((r) => r.json()),
        fetch(`/api/admin/learning/quiz-results?studentId=${studentId}`, {
          cache: "no-store",
        }).then((r) => r.json()),
        fetch("/api/admin/learning/homework", { cache: "no-store" }).then((r) =>
          r.json(),
        ),
        fetch("/api/admin/learning/homework-submissions", {
          cache: "no-store",
        }).then((r) => r.json()),
      ])
        .then(([a, b, c, d]) => {
          if (!active) return;
          setRecords(a.items || []);
          setQuiz(b || {});
          setHomework(
            (c.items || []).filter(
              (item: HomeworkItem) => item.studentId === studentId,
            ),
          );
          setSubmissions(
            (d.items || []).filter(
              (item: HomeworkSubmission) => item.studentId === studentId,
            ),
          );
        })
        .catch(() => {
          if (active)
            setMessage(
              "최신 학습자료를 불러오지 못했습니다. 잠시 후 자동으로 다시 확인합니다.",
            );
        });
    void load();
    const timer = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [studentId]);
  const student = students.find((item) => item.id === studentId),
    datedRecords = useMemo(() => latestByStudyDate(records), [records]),
    examRecords = useMemo(
      () =>
        records.filter(
          (item) => (item.examTerm || "시험 미지정") === selectedExamTerm,
        ),
      [records, selectedExamTerm],
    ),
    weekRecords = useMemo(
      () =>
        examRecords.filter(
          (item) => weekNumber(item.examWeek, item.taskScores) === selectedWeek,
        ),
      [examRecords, selectedWeek],
    ),
    selectedRecords = useMemo(
      () =>
        period === "monthly"
          ? examRecords
          : period === "weekly"
            ? weekRecords
            : weekRecords.slice(0, 1),
      [examRecords, weekRecords, period],
    ),
    latest = selectedRecords[0] || examRecords[0];
  useEffect(
    () => setRecipient(student?.parentPhone || ""),
    [student?.id, student?.parentPhone],
  );
  const studyRate = selectedRecords.length
    ? Math.round(
        selectedRecords.reduce((sum, item) => sum + recordAverage(item), 0) /
          selectedRecords.length,
      )
    : 0;
  const weekMetrics = useMemo(
    () =>
      [1, 2, 3, 4].map((week) => {
        const items = examRecords.filter(
            (item) => weekNumber(item.examWeek, item.taskScores) === week,
          ),
          days = new Set(items.map((item) => item.studyDate)).size,
          recent = items[0],
          taskScores = Object.fromEntries(
            Object.entries(parsedTaskScores(recent)).filter(
              ([key]) => !key.startsWith("_"),
            ),
          );
        return {
          label: `${week}주차`,
          count: items.length,
          days,
          rate: items.length
            ? Math.round(
                items.reduce((sum, item) => sum + recordAverage(item), 0) /
                  items.length,
              )
            : 0,
          detail: recent
            ? Object.keys(taskScores).length
              ? Object.entries(taskScores)
                  .map(([label, value]) => `${label} ${value}%`)
                  .join(" · ")
              : fields
                  .map(([label, key]) => `${label} ${recent[key] || 0}%`)
                  .join(" · ")
            : "기록 없음",
        };
      }),
    [examRecords],
  );
  const weekRecordText = useMemo(
    () =>
      `[${selectedExamTerm}]\n${weekMetrics.map((item) => `• ${item.label}: ${item.count ? `${item.rate}% (${item.days}일 · ${item.count}회 기록) · ${item.detail}` : "아직 기록 없음"}`).join("\n")}`,
    [selectedExamTerm, weekMetrics],
  );
  useEffect(() => {
    const dashboard = document.querySelector<HTMLElement>(
      ".feedback-dashboard",
    );
    if (!dashboard) return;
    dashboard.querySelector(".feedback-week-rings")?.remove();
    const section = document.createElement("section");
    section.className = "feedback-week-rings";
    const title = document.createElement("h3");
    title.textContent = `${selectedExamTerm} · 학생이 기록한 1~4주차 학습량`;
    section.appendChild(title);
    const grid = document.createElement("div");
    for (const item of weekMetrics) {
      const article = document.createElement("article"),
        ring = document.createElement("i"),
        value = document.createElement("b"),
        label = document.createElement("strong"),
        count = document.createElement("small");
      ring.className = "week-ring";
      ring.style.setProperty("--rate", `${clamp(item.rate) * 3.6}deg`);
      value.textContent = `${item.rate}%`;
      label.textContent = item.label;
      count.textContent = item.count
        ? item.count === item.days
          ? `${item.days}일 기록`
          : `${item.days}일 · ${item.count}회 기록`
        : "기록 없음";
      ring.appendChild(value);
      article.append(ring, label, count);
      grid.appendChild(article);
    }
    section.appendChild(grid);
    const bars = dashboard.querySelector(".feedback-bars");
    dashboard.insertBefore(section, bars);
    return () => section.remove();
  }, [weekMetrics, selectedExamTerm]);
  const quizMetrics = useMemo(() => {
    const groups = new Map<string, { total: number; correct: number }>();
    for (const item of quiz.types || []) {
      const label = quizCategory(item.quizType),
        current = groups.get(label) || { total: 0, correct: 0 };
      current.total += Number(item.total || 0);
      current.correct += Number(item.correct || 0);
      groups.set(label, current);
    }
    return ["단어 퀴즈", "본문 퀴즈", "빈칸 퀴즈", "대화문 퀴즈"].map(
      (label) => {
        const group = groups.get(label) || { total: 0, correct: 0 };
        return {
          label,
          total: group.total,
          rate: group.total
            ? Math.round((group.correct * 100) / group.total)
            : 0,
        };
      },
    );
  }, [quiz.types]);
  const periodCutoff = Date.now() - (period === "monthly" ? 29 : 6) * 86400000;
  const recentHomework =
      period === "daily"
        ? homework.slice(0, 1)
        : homework.filter((item) => {
            const time = new Date(item.homeworkDate || 0).getTime();
            return !Number.isFinite(time) || time >= periodCutoff;
          }),
    recentSubmissions =
      period === "daily"
        ? submissions.slice(0, 1)
        : submissions.filter((item) => {
            const time = new Date(item.homeworkDate || 0).getTime();
            return !Number.isFinite(time) || time >= periodCutoff;
          });
  const homeworkChecks = recentHomework.reduce((sum, item) => {
    try {
      const value = JSON.parse(item.completedItems || "[]");
      return (
        sum +
        (Array.isArray(value)
          ? value.length
          : Object.values(value || {}).filter(Boolean).length)
      );
    } catch {
      return (
        sum +
        (item.completedItems
          ?.split(/[|,]/)
          .map((value) => value.trim())
          .filter(Boolean).length || 0)
      );
    }
  }, 0);
  const homeworkRate = clamp((homeworkChecks + recentSubmissions.length) * 20),
    homeworkLine =
      [
        ...recentHomework.map(
          (item) =>
            `${item.title}${item.studentNote ? ` (${item.studentNote})` : ""}`,
        ),
        ...recentSubmissions.map(
          (item) =>
            `${item.title} 제출${item.studentNote ? ` (${item.studentNote})` : ""}`,
        ),
      ]
        .slice(0, 6)
        .join(" · ") || "학생이 작성하거나 제출한 숙제 기록이 아직 없습니다";
  const homeworkAnalysis =
    recentHomework[0]?.autoFeedback?.trim() ||
    `${student?.name || "학생"} 학생이 직접 체크한 숙제 완료 항목은 ${homeworkChecks}개, 제출 자료는 ${recentSubmissions.length}개입니다. ${homeworkChecks || recentSubmissions.length ? "스스로 학습 과정을 기록한 점이 좋으며, 어려웠던 부분을 다시 확인하도록 지도하겠습니다." : "숙제 기록이 입력되면 잘한 점과 보완할 내용을 자동으로 분석합니다."}`;
  useEffect(() => {
    const dashboard = document.querySelector<HTMLElement>(
      ".feedback-dashboard",
    );
    if (!dashboard) return;
    dashboard.querySelector(".feedback-homework-analysis")?.remove();
    const card = document.createElement("article");
    card.className = "feedback-homework-analysis";
    card.style.cssText =
      "grid-column:1/-1;padding:18px 20px;border-radius:18px;background:#f5f1ff;border:1px solid #ddd2ff;color:#26324a;white-space:pre-line;line-height:1.65";
    const title = document.createElement("strong");
    title.textContent = `숙제 완료 자동분석 · ${homeworkRate}%`;
    title.style.cssText =
      "display:block;color:#6746b8;margin-bottom:8px;font-size:17px";
    const content = document.createElement("span");
    content.textContent = homeworkAnalysis;
    card.append(title, content);
    const bars = dashboard.querySelector(".feedback-bars");
    dashboard.insertBefore(card, bars);
    return () => card.remove();
  }, [homeworkAnalysis, homeworkRate]);
  const studiedQuiz = quizMetrics.filter((item) => item.total),
    quizRate = studiedQuiz.length
      ? Math.round(
          studiedQuiz.reduce((sum, item) => sum + item.rate, 0) /
            studiedQuiz.length,
        )
      : 0,
    activeRates = [studyRate, quizRate, homeworkRate].filter(Boolean),
    overall = activeRates.length
      ? Math.round(activeRates.reduce((a, b) => a + b, 0) / activeRates.length)
      : 0;
  const detailedMetrics = useMemo(
    () =>
      fields.map(([label, key]) => {
        const values = selectedRecords.map((item) => Number(item[key] || 0)),
          value = values.length
            ? Math.round(
                values.reduce((sum, item) => sum + item, 0) / values.length,
              )
            : 0;
        return {
          label,
          key,
          value,
          status: value >= 85 ? "강점" : value >= 60 ? "진행 중" : "집중 보완",
        };
      }),
    [selectedRecords],
  );
  const trendRecords = useMemo(() => {
    const source = period === "monthly" ? examRecords : weekRecords;
    return [...latestByStudyDate(source)]
      .sort((a, b) => a.studyDate.localeCompare(b.studyDate))
      .slice(-10);
  }, [examRecords, weekRecords, period]);
  const trendPoints = useMemo(
    () =>
      trendRecords.map((item, index) => ({
        x:
          trendRecords.length === 1
            ? 300
            : 55 + (index * 500) / (trendRecords.length - 1),
        y: 215 - recordAverage(item) * 1.6,
        value: recordAverage(item),
        date: item.studyDate.slice(5),
      })),
    [trendRecords],
  );
  const learningContentMetrics = useMemo(() => {
    const totals = new Map<string, { sum: number; count: number }>();
    for (const item of trendRecords) {
      for (const [label, value] of Object.entries(parsedTaskScores(item))) {
        if (label.startsWith("_")) continue;
        const current = totals.get(label) || { sum: 0, count: 0 };
        current.sum += Number(value || 0);
        current.count += 1;
        totals.set(label, current);
      }
    }
    return [...totals.entries()].map(([label, value]) => ({
      label,
      value: Math.round(value.sum / value.count),
    }));
  }, [trendRecords]);
  const detailedFeedback = useMemo(
    () =>
      detailedMetrics
        .map(
          (item) =>
            `• ${item.label}: ${item.value}% · ${item.status}${item.value >= 85 ? " — 현재 학습 흐름을 유지하며 실전 정확도를 높입니다." : item.value >= 60 ? " — 틀린 부분을 짧게 반복해 완성도를 높입니다." : " — 핵심 개념부터 다시 확인하고 기본 문제로 재점검합니다."}`,
        )
        .join("\n"),
    [detailedMetrics],
  );
  useEffect(() => {
    const dashboard = document.querySelector<HTMLElement>(
      ".feedback-dashboard",
    );
    if (!dashboard) return;
    dashboard.querySelector(".feedback-detailed-charts")?.remove();
    const section = document.createElement("section");
    section.className = "feedback-detailed-charts";
    section.style.cssText =
      "grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;padding:18px;border-radius:20px;background:#fff;border:1px solid #dce7f5";
    const radar = document.createElement("article"),
      trend = document.createElement("article"),
      details = document.createElement("article");
    for (const card of [radar, trend, details])
      card.style.cssText =
        "min-width:0;padding:14px;border-radius:16px;background:#f8fbff;border:1px solid #e1eaf5";
    const radarTitle = document.createElement("h3");
    radarTitle.textContent = "항목별 균형 · 다각형 그래프";
    radarTitle.style.cssText = "margin:0 0 10px;color:#173d78;font-size:16px";
    const n = detailedMetrics.length,
      cx = 180,
      cy = 140,
      radius = 92,
      point = (index: number, scale: number) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / n;
        return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
      },
      grids = [0.25, 0.5, 0.75, 1]
        .map(
          (scale) =>
            `<polygon points="${detailedMetrics.map((_, index) => point(index, scale)).join(" ")}" fill="none" stroke="#d7e3f2" stroke-width="1"/>`,
        )
        .join(""),
      axes = detailedMetrics
        .map(
          (_, index) =>
            `<line x1="${cx}" y1="${cy}" x2="${point(index, 1).split(",")[0]}" y2="${point(index, 1).split(",")[1]}" stroke="#d7e3f2"/>`,
        )
        .join(""),
      shape = detailedMetrics
        .map((item, index) => point(index, item.value / 100))
        .join(" "),
      labels = detailedMetrics
        .map((item, index) => {
          const [x, y] = point(index, 1.22).split(",");
          return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#263d60">${item.label} ${item.value}%</text>`;
        })
        .join("");
    radar.innerHTML = `<svg viewBox="0 0 360 290" role="img" aria-label="항목별 학습 균형 레이더 그래프" style="width:100%;height:auto">${grids}${axes}<polygon points="${shape}" fill="rgba(36,94,219,.22)" stroke="#245edb" stroke-width="3"/>${shape
      .split(" ")
      .map((value) => {
        const [x, y] = value.split(",");
        return `<circle cx="${x}" cy="${y}" r="4" fill="#245edb"/>`;
      })
      .join("")}${labels}</svg>`;
    radar.insertBefore(radarTitle, radar.firstChild);
    const trendTitle = document.createElement("h3");
    trendTitle.textContent = "날짜별 성장 · 꺾은선 그래프";
    trendTitle.style.cssText = radarTitle.style.cssText;
    const trendItems = [...selectedRecords].reverse().slice(-10),
      linePoints = trendItems.map((item, index) => {
        const x =
            trendItems.length === 1
              ? 250
              : 45 + index * (410 / (trendItems.length - 1)),
          y = 210 - recordAverage(item) * 1.6;
        return {
          x,
          y,
          value: recordAverage(item),
          date: item.studyDate.slice(5),
        };
      }),
      poly = linePoints.map((item) => `${item.x},${item.y}`).join(" ");
    trend.innerHTML = `<svg viewBox="0 0 500 260" role="img" aria-label="날짜별 학습량 꺾은선 그래프" style="width:100%;height:auto"><line x1="40" y1="210" x2="465" y2="210" stroke="#ccd9e8"/><line x1="40" y1="50" x2="40" y2="210" stroke="#ccd9e8"/>${[25, 50, 75, 100].map((value) => `<line x1="40" y1="${210 - value * 1.6}" x2="465" y2="${210 - value * 1.6}" stroke="#e6edf6"/><text x="34" y="${214 - value * 1.6}" text-anchor="end" font-size="10" fill="#718198">${value}</text>`).join("")}<polyline points="${poly}" fill="none" stroke="#178767" stroke-width="4" stroke-linejoin="round"/>${linePoints.map((item) => `<circle cx="${item.x}" cy="${item.y}" r="5" fill="#178767"/><text x="${item.x}" y="${item.y - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#173d78">${item.value}%</text><text x="${item.x}" y="232" text-anchor="middle" font-size="10" fill="#62738a">${item.date}</text>`).join("")}</svg>`;
    trend.insertBefore(trendTitle, trend.firstChild);
    const detailTitle = document.createElement("h3");
    detailTitle.textContent = "항목별 상세 분석";
    detailTitle.style.cssText = radarTitle.style.cssText;
    details.appendChild(detailTitle);
    for (const [metricIndex, item] of detailedMetrics.entries()) {
      const row = document.createElement("div"),
        head = document.createElement("div"),
        bar = document.createElement("i"),
        fill = document.createElement("em");
      row.style.cssText = "margin:11px 0";
      head.style.cssText =
        "display:flex;justify-content:space-between;gap:8px;font-size:13px";
      head.innerHTML = `<b>${item.label}</b><span>${item.value}% · ${item.status}</span>`;
      bar.style.cssText =
        "display:block;height:9px;margin-top:6px;border-radius:999px;background:#e3ebf4;overflow:hidden";
      fill.style.cssText = `display:block;width:${item.value}%;height:100%;border-radius:999px;background:${academyPastels[metricIndex % academyPastels.length]}`;
      bar.appendChild(fill);
      row.append(head, bar);
      details.appendChild(row);
    }
    section.append(radar, trend, details);
    const bars = dashboard.querySelector(".feedback-bars");
    dashboard.insertBefore(section, bars);
    return () => section.remove();
  }, [detailedMetrics, selectedRecords]);
  const generatedText = useMemo(() => {
    if (!student) return "";
    const periodName =
        period === "monthly"
          ? "월간"
          : period === "weekly"
            ? `${selectedWeek}주차 주간`
            : "데일리",
      strength = latest
        ? [...fields].sort((a, b) => latest[b[1]] - latest[a[1]])[0][0]
        : "학습 참여",
      weakness = latest
        ? [...fields].sort((a, b) => latest[a[1]] - latest[b[1]])[0][0]
        : "기초 학습",
      quizLine =
        studiedQuiz
          .map((item) => `${item.label} ${item.rate}%(${item.total}문항)`)
          .join(" · ") || "퀴즈 기록이 아직 없습니다",
      plan =
        period === "monthly"
          ? fullStudyWeekPlan
          : planForStage(latest?.examWeek);
    return `안녕하세요. 벌교미래엔영어입니다 ^^\n\n${student.name} 학생의 ${selectedExamTerm} ${periodName} 학습 피드백입니다.\n\n종합 학습량은 ${overall}%이며, 내신 준비율 ${studyRate}%, 퀴즈 정답률 ${quizRate}%, 숙제 활동률 ${homeworkRate}%입니다. ${overall >= 80 ? "꾸준한 학습이 안정적인 결과로 이어지고 있어 칭찬해 주고 싶습니다." : "현재 부족한 부분을 정확히 확인했으며, 작은 성공을 쌓도록 차근차근 지도하겠습니다."}\n\n[학생이 기록한 숙제·제출 내용]\n• ${homeworkLine}\n\n[학생이 기록한 주차별 학습량]\n${weekRecordText}\n\n[주차별 학습 계획]\n${plan}\n\n• 강점 영역: ${strength}\n• 보완 영역: ${weakness}\n• 퀴즈 현황: ${quizLine}\n• 관찰 내용: ${latest?.teacherNote || "학습 과정과 참여도를 계속 세심하게 살피겠습니다."}\n• 다음 학습: ${latest?.nextAction || "취약 영역을 짧게 반복한 뒤 확인 문제로 다시 점검하겠습니다."}\n\n점수만 보지 않고 ${student.name} 학생의 노력과 변화를 함께 살피며 따뜻하고 정확하게 지도하겠습니다. - 벌교미래엔영어`;
  }, [
    student,
    period,
    selectedExamTerm,
    selectedWeek,
    overall,
    studyRate,
    quizRate,
    homeworkRate,
    homeworkLine,
    studiedQuiz,
    latest,
    weekRecordText,
  ]);
  const finalizedText = `${generatedText}\n\n[선택 기준]\n${selectedExamTerm} · ${selectedWeek}주차 · ${period === "monthly" ? "월간" : period === "weekly" ? "주간" : "데일리"}\n\n[항목별 상세 분석]\n${detailedFeedback}\n\n[숙제 완료 자동분석]\n${homeworkAnalysis}\n\n[보강시간 안내]\n${makeupNotice.trim() || "이번 주 토요일 보강시간은 12시입니다."}`;
  useEffect(() => setText(finalizedText), [finalizedText]);
  useEffect(() => {
    document.body.classList.toggle("preview-open", Boolean(sendPreview));
    return () => document.body.classList.remove("preview-open");
  }, [sendPreview]);
  useEffect(() => {
    if (
      previewRestoreStarted.current ||
      sendPreview ||
      previewing ||
      !student ||
      !text.trim()
    )
      return;
    let pending = false;
    try {
      pending = Boolean(sessionStorage.getItem("solapi-pending-preview"));
    } catch {}
    if (!pending) return;
    previewRestoreStarted.current = true;
    void requestSolapiPreview();
  }, [student?.id, text, sendPreview, previewing]);

  async function createReportImage() {
    if (!student) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1500;
    const c = canvas.getContext("2d");
    if (!c) return null;
    c.fillStyle = "#f4f8ff";
    c.fillRect(0, 0, 900, 1500);
    c.fillStyle = "#0e3d91";
    c.fillRect(0, 0, 900, 195);
    c.fillStyle = "white";
    c.font = '700 42px "Malgun Gothic",Arial,sans-serif';
    c.fillText("벌교미래엔영어 학습 리포트", 50, 78);
    c.font = '25px "Malgun Gothic",Arial,sans-serif';
    const periodLabel =
      period === "monthly" ? "월간" : period === "weekly" ? "주간" : "데일리";
    c.fillText(`${student.name} 학생 · ${selectedExamTerm} · ${selectedWeek}주차`, 50, 130);
    c.font = '18px "Malgun Gothic",Arial,sans-serif';
    c.fillText(`${periodLabel} 상세 분석 · 종합 학습량 ${overall}%`, 50, 168);

    c.fillStyle = "white";
    c.fillRect(35, 220, 830, 430);
    c.fillStyle = "#173d78";
    c.font = '700 22px "Malgun Gothic",Arial,sans-serif';
    c.fillText("항목별 균형 · 다각형 그래프", 60, 260);
    const count = detailedMetrics.length,
      centerX = 245,
      centerY = 440,
      radius = 125,
      radarPoint = (index: number, scale: number) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
        return {
          x: centerX + Math.cos(angle) * radius * scale,
          y: centerY + Math.sin(angle) * radius * scale,
        };
      };
    for (const scale of [0.25, 0.5, 0.75, 1]) {
      c.beginPath();
      detailedMetrics.forEach((_, index) => {
        const point = radarPoint(index, scale);
        if (index === 0) c.moveTo(point.x, point.y);
        else c.lineTo(point.x, point.y);
      });
      c.closePath();
      c.strokeStyle = "#d7e3f2";
      c.lineWidth = 1;
      c.stroke();
    }
    detailedMetrics.forEach((item, index) => {
      const edge = radarPoint(index, 1),
        label = radarPoint(index, 1.24);
      c.beginPath();
      c.moveTo(centerX, centerY);
      c.lineTo(edge.x, edge.y);
      c.strokeStyle = "#d7e3f2";
      c.stroke();
      c.fillStyle = "#263d60";
      c.textAlign = "center";
      c.font = '700 13px "Malgun Gothic",Arial,sans-serif';
      c.fillText(item.label, label.x, label.y);
      c.fillText(`${item.value}%`, label.x, label.y + 17);
    });
    c.beginPath();
    detailedMetrics.forEach((item, index) => {
      const point = radarPoint(index, item.value / 100);
      if (index === 0) c.moveTo(point.x, point.y);
      else c.lineTo(point.x, point.y);
    });
    c.closePath();
    c.fillStyle = "rgba(36,94,219,.22)";
    c.fill();
    c.strokeStyle = "#245edb";
    c.lineWidth = 4;
    c.stroke();

    c.textAlign = "left";
    c.fillStyle = "#173d78";
    c.font = '700 22px "Malgun Gothic",Arial,sans-serif';
    c.fillText("날짜별 성장 · 꺾은선", 465, 260);
    const trendItems = [...selectedRecords].reverse().slice(-8),
      chartLeft = 475,
      chartTop = 315,
      chartWidth = 340,
      chartHeight = 245;
    c.strokeStyle = "#d7e3f2";
    c.lineWidth = 1;
    for (const value of [0, 25, 50, 75, 100]) {
      const y = chartTop + chartHeight - (chartHeight * value) / 100;
      c.beginPath();
      c.moveTo(chartLeft, y);
      c.lineTo(chartLeft + chartWidth, y);
      c.stroke();
      c.fillStyle = "#718198";
      c.font = '11px "Malgun Gothic",Arial,sans-serif';
      c.fillText(String(value), chartLeft - 28, y + 4);
    }
    const trendPoints = trendItems.map((item, index) => ({
      x:
        trendItems.length === 1
          ? chartLeft + chartWidth / 2
          : chartLeft + (index * chartWidth) / (trendItems.length - 1),
      y: chartTop + chartHeight - (recordAverage(item) * chartHeight) / 100,
      value: recordAverage(item),
      date: item.studyDate.slice(5),
    }));
    if (trendPoints.length) {
      c.beginPath();
      trendPoints.forEach((point, index) =>
        index ? c.lineTo(point.x, point.y) : c.moveTo(point.x, point.y),
      );
      c.strokeStyle = "#178767";
      c.lineWidth = 4;
      c.stroke();
    }
    trendPoints.forEach((point) => {
      c.beginPath();
      c.arc(point.x, point.y, 6, 0, Math.PI * 2);
      c.fillStyle = "#178767";
      c.fill();
      c.textAlign = "center";
      c.fillStyle = "#173d78";
      c.font = '700 12px "Malgun Gothic",Arial,sans-serif';
      c.fillText(`${point.value}%`, point.x, point.y - 12);
      c.fillStyle = "#62738a";
      c.fillText(point.date, point.x, chartTop + chartHeight + 25);
    });

    c.textAlign = "left";
    c.fillStyle = "white";
    c.fillRect(35, 680, 830, 430);
    c.fillStyle = "#173d78";
    c.font = '700 22px "Malgun Gothic",Arial,sans-serif';
    c.fillText("항목별 상세 분석", 60, 725);
    let y = 775;
    for (const [metricIndex, item] of detailedMetrics.entries()) {
      c.fillStyle = "#14233d";
      c.font = '700 17px "Malgun Gothic",Arial,sans-serif';
      c.fillText(item.label, 65, y);
      c.fillStyle = "#dbe5f2";
      c.fillRect(200, y - 16, 490, 18);
      c.fillStyle = academyPastels[metricIndex % academyPastels.length];
      c.fillRect(200, y - 16, (490 * item.value) / 100, 18);
      c.fillStyle = "#14233d";
      c.fillText(`${item.value}% · ${item.status}`, 710, y);
      y += 52;
    }
    c.fillStyle = "white";
    c.fillRect(35, 1140, 830, 235);
    c.fillStyle = "#14233d";
    c.font = '700 22px "Malgun Gothic",Arial,sans-serif';
    c.fillText("상세 학습 피드백", 60, 1182);
    c.font = '17px "Malgun Gothic",Arial,sans-serif';
    wrapText(c, detailedFeedback.replace(/\n+/g, " "), 60, 1220, 780, 27, 5);
    c.fillStyle = "#188567";
    c.fillRect(35, 1410, 830, 55);
    c.fillStyle = "white";
    c.textAlign = "center";
    c.font = '700 20px "Malgun Gothic",Arial,sans-serif';
    c.fillText("따뜻하게 격려하고 정확하게 분석합니다.", 450, 1445);
    return solapiReadyJpeg(canvas);
  }
  async function createFullReportImage() {
    if (!student) return null;
    const graphBlob = await createReportImage();
    if (!graphBlob) return null;
    const graphImage = await createImageBitmap(graphBlob);
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    const measure = canvas.getContext("2d");
    if (!measure) return null;
    measure.font = '19px "Malgun Gothic",Arial,sans-serif';
    const feedbackLines = wrappedLines(measure, text, 750),
      feedbackHeight = Math.max(300, feedbackLines.length * 31 + 105);
    canvas.height = 1500 + feedbackHeight + 125;
    const c = canvas.getContext("2d");
    if (!c) return null;
    c.fillStyle = "#f4f8ff";
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.drawImage(graphImage, 0, 0, 900, 1500);
    graphImage.close();
    const cardTop = 1500;
    c.fillStyle = "white";
    c.fillRect(45, cardTop, 810, feedbackHeight);
    c.fillStyle = "#14233d";
    c.font = '700 23px "Malgun Gothic",Arial,sans-serif';
    c.fillText("학습 피드백 전체 내용", 75, cardTop + 50);
    c.font = '19px "Malgun Gothic",Arial,sans-serif';
    let lineY = cardTop + 95;
    for (const line of feedbackLines) {
      c.fillText(line, 75, lineY);
      lineY += 31;
    }
    const footerTop = cardTop + feedbackHeight + 35;
    c.fillStyle = "#188567";
    c.fillRect(45, footerTop, 810, 55);
    c.fillStyle = "white";
    c.textAlign = "center";
    c.font = '700 20px "Malgun Gothic",Arial,sans-serif';
    c.fillText("따뜻하게 격려하고 정확하게 분석합니다.", 450, footerTop + 35);
    let quality = 0.84,
      blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality));
    while (blob.size > 950000 && quality > 0.4) {
      quality -= 0.08;
      blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality));
    }
    return blob;
  }
  async function saveImage() {
    if (!student) return;
    setMessage("그래프 요약 이미지와 전체 피드백 이미지를 만들고 있습니다…");
    try {
      const [previewBlob, fullBlob] = await Promise.all([
        createReportImage(),
        createFullReportImage(),
      ]);
      if (!previewBlob || !fullBlob)
        throw new Error("리포트 이미지를 만들지 못했습니다.");
      const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
      if (!key || key.startsWith("eyJ"))
        throw new Error("카카오 JavaScript 키가 올바르게 설정되지 않았습니다.");
      const previewFile = new File(
          [previewBlob],
          `${student.name}_학습그래프_요약.jpg`,
          { type: "image/jpeg" },
        ),
        fullFile = new File([fullBlob], `${student.name}_학습피드백_전체.jpg`, {
          type: "image/jpeg",
        }),
        kakao = await loadKakaoSdk();
      if (!kakao.isInitialized()) kakao.init(key);
      const [previewUpload, fullUpload] = await Promise.all([
        kakao.Share.uploadImage({ file: [previewFile] }),
        kakao.Share.uploadImage({ file: [fullFile] }),
      ]);
      const previewUrl = previewUpload.infos.original.url,
        fullImageUrl = fullUpload.infos.original.url;
      if (!previewUrl || !fullImageUrl)
        throw new Error("카카오 이미지 업로드에 실패했습니다.");
      const linkResponse = await fetch("/api/admin/learning/share-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            studentName: student.name,
            imageUrl: fullImageUrl,
          }),
        }),
        linkResult = (await linkResponse.json().catch(() => ({}))) as {
          detailUrl?: string;
          error?: string;
        };
      if (!linkResponse.ok || !linkResult.detailUrl)
        throw new Error(
          linkResult.error || "전체 피드백 연결주소를 만들지 못했습니다.",
        );
      const detailUrl = linkResult.detailUrl;
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `${student.name} 학생 학습피드백`,
          description:
            "그래프를 크게 확인하고 자세히 보기에서 전체 피드백을 확인하세요.",
          imageUrl: previewUrl,
          imageWidth: 900,
          imageHeight: 1500,
          link: { mobileWebUrl: detailUrl, webUrl: detailUrl },
        },
        buttons: [
          {
            title: "자세히 보기",
            link: { mobileWebUrl: detailUrl, webUrl: detailUrl },
          },
        ],
      });
      setMessage(
        "카카오톡 친구·채팅 선택창을 열었습니다. 자세히 보기는 전체 피드백 이미지로 연결됩니다.",
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "다시 시도해 주세요.";
      setMessage(`카카오톡 공유 실패 · ${reason}`);
    }
  }
  function closeSendPreview() {
    try {
      sessionStorage.removeItem("solapi-pending-preview");
    } catch {}
    const current = sendPreview;
    if (current) URL.revokeObjectURL(current.imageUrl);
    setSendPreview(null);
  }
  async function requestSolapiPreview() {
    if (!student) {
      setMessage("학생이 선택되지 않았습니다.");
      return;
    }
    if (!text.trim()) {
      setMessage("전송할 문구가 없습니다.");
      return;
    }
    try {
      sessionStorage.setItem(
        "solapi-pending-preview",
        JSON.stringify({ studentId: student.id, createdAt: Date.now() }),
      );
    } catch {}
    setPreviewing(true);
    setMessage("전송할 그래프 이미지와 문자내용을 준비하고 있습니다...");
    try {
      const image = await createReportImage();
      if (!image) {
        setMessage("그래프 이미지를 만들 수 없습니다. 텍스트만 전송해 주세요.");
        return;
      }
      const imageUrl = URL.createObjectURL(image);
      setSendPreview({ phone: recipient.replace(/\D/g, ""), image, imageUrl });
      setMessage(
        "아래 미리보기에서 수신번호를 확인한 뒤 솔라피 전송 버튼을 눌러 주세요.",
      );
    } catch {
      setMessage("그래프 미리보기를 만들지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setPreviewing(false);
    }
  }
  async function send(includeImage: boolean, inlineImage?: Blob) {
    if (sendLock.current || sending || previewing) return;
    sendLock.current = true;
    const phone = recipient.replace(/\D/g, "");
    if (!student || !text.trim()) {
      sendLock.current = false;
      return;
    }
    if (!/^01\d{8,9}$/.test(phone)) {
      sendLock.current = false;
      setMessage("학부모 연락처를 01012345678 형식으로 확인해 주세요.");
      return;
    }
    setSending(true);
    setMessage(
      includeImage
        ? "솔라피로 실제 문자 전송 중입니다..."
        : "문자로만 즉시 전송합니다...",
    );
    try {
      const form = new FormData();
      form.set("studentId", String(studentId));
      form.set("channel", "sms");
      form.set("to", phone);
      form.set("text", text);
      if (includeImage && inlineImage)
        form.set("image", inlineImage, `${student.name}_학습피드백.jpg`);
      const response = await fetch("/api/admin/learning/send", {
          method: "POST",
          body: form,
        }),
        data = await response.json();
      setMessage(
        response.ok
          ? `✅ ${data.message}${data.messageId ? ` · 접수번호 ${data.messageId}` : ""}`
          : `전송 실패 · ${data.error || "발송에 실패했습니다."}`,
      );
      if (response.ok) closeSendPreview();
    } catch {
      setMessage(
        "네트워크 오류로 발송하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSending(false);
      window.setTimeout(() => {
        sendLock.current = false;
      }, 500);
    }
  }
  async function directSolapiSend() {
    if (sending || previewing) return;
    const phone = recipient.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(phone)) {
      setMessage("학부모 연락처를 01012345678 형식으로 입력해 주세요.");
      return;
    }
    setMessage("팝업 없이 그래프 이미지를 생성하고 있습니다…");
    try {
      const image = await createReportImage();
      if (!image) {
        setMessage("그래프 이미지를 만들 수 없습니다.");
        return;
      }
      await send(true, image);
    } catch {
      setMessage("이미지 준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }
  const previewModal =
    sendPreview && typeof document !== "undefined"
      ? createPortal(
          <div
            className="solapi-preview-overlay"
            role="presentation"
            data-preview-version="2026-09-07"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeSendPreview();
            }}
          >
            <section
              className="solapi-preview-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="solapi-preview-title"
            >
              <header>
                <div>
                  <b id="solapi-preview-title">그래프 이미지 문자 미리보기</b>
                  <span>
                    수신번호를 확인하고 초록색 버튼을 누르면 실제 문자가
                    전송됩니다.
                  </span>
                </div>
                <div className="solapi-preview-header-actions">
                  <button
                    type="button"
                    className="confirm top-confirm"
                    onClick={() => send(true, sendPreview.image)}
                    disabled={sending}
                  >
                    {sending ? "전송 중…" : "솔라피 문자 보내기"}
                  </button>
                  <button
                    type="button"
                    aria-label="미리보기 닫기"
                    onClick={closeSendPreview}
                  >
                    ×
                  </button>
                </div>
              </header>
              <div className="solapi-preview-body">
                <img
                  src={sendPreview.imageUrl}
                  alt={`${student?.name || "학생"} 학습 그래프 이미지`}
                />
                <article className="solapi-phone-preview">
                  <label>
                    <span>받는 사람 {student?.name} 학부모</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="01012345678"
                      aria-label="팝업 학부모 수신번호"
                    />
                  </label>
                  <pre>{text}</pre>
                </article>
              </div>
              <footer aria-label="문자 전송 작업">
                <button type="button" onClick={closeSendPreview}>
                  취소
                </button>
              </footer>
            </section>
          </div>,
          document.body,
        )
      : null;
  return (
    <>
      <section className="feedback-tools feedback-formation">
        <header>
          <div>
            <span>REPORT & MESSAGE</span>
            <h2>학습 피드백 형성</h2>
            <p>
              학생별 실시간 학습량과 직접 작성한 숙제·제출 기록을 그래프로
              분석해 문자로 전송합니다.
            </p>
          </div>
          <strong>{student?.name || "학생 선택"}</strong>
        </header>
        <div className="feedback-controls">
          <select
            aria-label="학생 선택"
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value))}
          >
            {students.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.grade}
              </option>
            ))}
          </select>
          <label className="feedback-recipient">
            <span>학부모 수신번호</span>
            <input
              type="tel"
              inputMode="numeric"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="01012345678"
              aria-label="학부모 수신번호"
            />
          </label>
          <button
            onClick={() => setPeriod("daily")}
            className={period === "daily" ? "on" : ""}
          >
            데일리
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={period === "weekly" ? "on" : ""}
          >
            주간
          </button>
          <button onClick={() => setText(finalizedText)}>
            학습 피드백 다시 형성
          </button>
          <label className="feedback-makeup-time">
            <span>보강시간 안내</span>
            <input
              type="text"
              value={makeupNotice}
              onChange={(e) => setMakeupNotice(e.target.value)}
              aria-label="보강시간 안내"
              placeholder="예: 9월 8일 오후 5시"
            />
          </label>
        </div>
        <div className="feedback-dashboard">
          <article className="feedback-overall">
            <div
              className="feedback-ring"
              style={
                { "--rate": `${clamp(overall) * 3.6}deg` } as CSSProperties
              }
            >
              <b>{overall}%</b>
              <small>종합 학습량</small>
            </div>
            <p>
              내신 준비율 <b>{studyRate}%</b>
              <br />
              퀴즈 정답률 <b>{quizRate}%</b>
              <br />
              숙제 활동률 <b>{homeworkRate}%</b>
            </p>
          </article>
          <div className="feedback-quiz-rings">
            {quizMetrics.map((item) => (
              <article key={item.label}>
                <div
                  className="mini-ring"
                  style={
                    {
                      "--rate": `${clamp(item.rate) * 3.6}deg`,
                    } as CSSProperties
                  }
                >
                  <b>{item.rate}%</b>
                </div>
                <strong>{item.label}</strong>
                <small>{item.total}문항 학습</small>
              </article>
            ))}
          </div>
          <section className="feedback-learning-trend">
            <h3>날짜별 학습량 · 꺾은선 그래프</h3>
            {trendPoints.length ? (
              <div className="feedback-trend-scroll">
                <svg
                  viewBox="0 0 610 255"
                  role="img"
                  aria-label={`${student?.name || "학생"} 날짜별 학습량 꺾은선 그래프`}
                >
                  {[0, 25, 50, 75, 100].map((value) => (
                    <g key={value}>
                      <line x1="48" y1={215 - value * 1.6} x2="570" y2={215 - value * 1.6} />
                      <text x="40" y={219 - value * 1.6} textAnchor="end">{value}</text>
                    </g>
                  ))}
                  <polyline points={trendPoints.map((point) => `${point.x},${point.y}`).join(" ")} />
                  {trendPoints.map((point) => (
                    <g key={`${point.date}-${point.x}`}>
                      <circle cx={point.x} cy={point.y} r="6" />
                      <text className="trend-value" x={point.x} y={point.y - 12} textAnchor="middle">{point.value}%</text>
                      <text x={point.x} y="238" textAnchor="middle">{point.date}</text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <p>선택한 시험과 주차에 저장된 학습기록이 없습니다.</p>
            )}
            <div className="feedback-learning-content">
              <strong>학생이 기록한 학습내용</strong>
              {learningContentMetrics.length ? (
                learningContentMetrics.map((item, index) => (
                  <div key={item.label} style={{ "--content-color": academyPastels[index % academyPastels.length] } as CSSProperties}>
                    <span>{item.label}</span><i><em style={{ width: `${clamp(item.value)}%` }} /></i><b>{item.value}%</b>
                  </div>
                ))
              ) : (
                <small>세부 학습내용을 기록하면 여기에 자동 반영됩니다.</small>
              )}
            </div>
          </section>
          <div className="feedback-bars">
            {fields.map(([label, key], index) => (
              <div
                key={key}
                style={
                  {
                    "--area-color": academyPastels[index],
                  } as CSSProperties
                }
              >
                <span>{label}</span>
                <i>
                  <em style={{ width: `${clamp(latest?.[key] || 0)}%` }} />
                </i>
                <b>{latest?.[key] || 0}%</b>
              </div>
            ))}
          </div>
        </div>
        {!latest &&
          !studiedQuiz.length &&
          !homework.length &&
          !submissions.length && (
            <p className="feedback-empty">
              선택한 학생의 기록이 아직 없습니다. 기록이 쌓이면 그래프와 문구가
              자동으로 갱신됩니다.
            </p>
          )}
        <label className="feedback-text">
          <span>자동 형성된 학습 피드백</span>
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="feedback-direct-send">
          <strong>팝업 없이 전송</strong>
          <span>
            학생과 학부모 번호, 문구를 확인한 뒤 아래 버튼을 한 번만 누르세요.
          </span>
          <button
            type="button"
            disabled={sending || previewing}
            onClick={directSolapiSend}
          >
            {sending ? "솔라피 전송 중…" : "솔라피 이미지 문자 바로 전송"}
          </button>
        </div>
        <div className="feedback-actions">
          <button onClick={saveImage}>그래프 이미지 저장·공유</button>
          <button disabled={sending || previewing} onClick={() => send(false)}>
            문자만 전송
          </button>
          <button
            className="primary"
            disabled={sending || previewing}
            onClick={requestSolapiPreview}
          >
            미리보기 팝업 열기
          </button>
        </div>
        {message && (
          <p className="feedback-message" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </section>
      {previewModal}
    </>
  );
}
