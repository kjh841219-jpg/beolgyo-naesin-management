"use client";

import { FormEvent, useEffect, useState } from "react";
import { speakEnglish } from "../lib/speakEnglish";

type Definition = { definition: string; definitionKo?: string; example?: string; exampleKo?: string; synonyms?: string[] };
type Meaning = { partOfSpeech: string; definitions: Definition[] };
type Entry = { word: string; correctedFrom?: string; koreanHeadword?: string; koreanMeanings?: Record<string, string[]>; phonetic?: string; phonetics?: { text?: string; audio?: string }[]; meanings?: Meaning[] };
type StudyWord = { word: string; koreanHeadword?: string; koreanMeanings?: Record<string, string[]>; phonetic?: string; meanings: Meaning[]; savedAt: string };

const STORAGE_KEY = "beolgyo-dictionary-study-words-v1";
const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "명사", verb: "동사", adjective: "형용사", adverb: "부사",
  pronoun: "대명사", preposition: "전치사", conjunction: "접속사",
  interjection: "감탄사", determiner: "한정사", article: "관사",
  auxiliary: "조동사", numeral: "수사", particle: "불변화사",
  symbol: "기호", phrase: "구", abbreviation: "약어", other: "기타",
};

function partOfSpeechLabel(value: string) {
  return PART_OF_SPEECH_LABELS[value.toLowerCase()] || "기타";
}

function conciseTranslation(value = "") {
  const firstSentence = value.split(/[.;。]/)[0]?.trim() || value.trim();
  if (firstSentence.length <= 34) return firstSentence;
  return firstSentence.split(/[,，]/)[0]?.trim() || firstSentence;
}

function cleanInlineMeaning(value = "") {
  return value
    .replace(/^\([^)]*\)\s*/, "")
    .replace(/\(\)/g, "")
    .replace(/^([가-힣]+)과의 동물.*$/, "$1")
    .replace(/[.]$/g, "")
    .trim();
}

function inlineKoreanMeaning(entry: Entry | undefined, meanings: Meaning[]) {
  const translatedHeadword = cleanInlineMeaning(entry?.koreanHeadword);
  if (translatedHeadword && /[가-힣]/.test(translatedHeadword)) return translatedHeadword;
  const labels = meanings.flatMap(meaning => {
    const dictionaryMeanings = entry?.koreanMeanings?.[meaning.partOfSpeech.toLowerCase()] || [];
    const best = cleanInlineMeaning(dictionaryMeanings[0]);
    return best ? [best] : [];
  });
  if (labels.length) return [...new Set(labels)].slice(0, 3).join(" · ");
  return conciseTranslation(meanings[0]?.definitions[0]?.definitionKo);
}

function koreanMeaningForDefinition(entry: Entry | undefined, meaning: Meaning, definition: Definition, definitionIndex: number) {
  const dictionaryMeanings = entry?.koreanMeanings?.[meaning.partOfSpeech.toLowerCase()] || [];
  const exactMeaning = cleanInlineMeaning(dictionaryMeanings[definitionIndex] || dictionaryMeanings[0]);
  if (exactMeaning && /[가-힣]/.test(exactMeaning)) return exactMeaning;
  return conciseTranslation(definition.definitionKo);
}

function mergeMeanings(entries: Entry[]) {
  const grouped = new Map<string, Definition[]>();
  for (const entry of entries) {
    for (const meaning of entry.meanings || []) {
      const key = meaning.partOfSpeech || "Other";
      const definitions = grouped.get(key) || [];
      for (const definition of meaning.definitions || []) {
        if (definition.definition && !definitions.some(item => item.definition === definition.definition)) definitions.push(definition);
      }
      grouped.set(key, definitions);
    }
  }
  return [...grouped].map(([partOfSpeech, definitions]) => ({ partOfSpeech, definitions: definitions.slice(0, 3) }));
}

async function addKoreanTranslations(word: string, meanings: Meaning[]) {
  const items: { id: string; text: string; kind?: "word" | "sentence" }[] = [{ id: "headword", text: word, kind: "word" }];
  meanings.forEach((meaning, meaningIndex) => meaning.definitions.forEach((definition, definitionIndex) => {
    items.push({ id: `d-${meaningIndex}-${definitionIndex}`, text: definition.definition });
    if (definition.example) items.push({ id: `e-${meaningIndex}-${definitionIndex}`, text: definition.example });
  }));
  const response = await fetch("/api/dictionary/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) return { meanings, koreanHeadword: "" };
  const data = await response.json();
  const translations: Record<string, string> = data.translations || {};
  const translatedMeanings = meanings.map((meaning, meaningIndex) => ({
    ...meaning,
    definitions: meaning.definitions.map((definition, definitionIndex) => ({
      ...definition,
      definitionKo: translations[`d-${meaningIndex}-${definitionIndex}`],
      exampleKo: translations[`e-${meaningIndex}-${definitionIndex}`],
    })),
  }));
  return { meanings: translatedMeanings, koreanHeadword: translations.headword || "" };
}

function csvCell(value = "") {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function DictionaryClient() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("영어 단어를 입력하고 검색해 보세요.");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [savedWords, setSavedWords] = useState<StudyWord[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedWords(JSON.parse(stored));
    } catch { /* 손상된 저장 데이터는 무시 */ }
  }, []);

  function persist(words: StudyWord[]) {
    setSavedWords(words);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    const word = query.trim();
    if (!word) return;
    setLoading(true); setEntries([]); setMessage("뜻과 발음을 찾고 있습니다…");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, { cache: "no-store", signal: controller.signal });
      const data: Entry[] | { error?: string } = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        setMessage(!Array.isArray(data) && data.error ? data.error : "단어를 찾지 못했습니다.");
        return;
      }
      const merged = mergeMeanings(data);
      const baseEntry: Entry = { ...data[0], meanings: merged };
      setEntries([baseEntry]);
      setMessage(baseEntry.correctedFrom
        ? `${baseEntry.correctedFrom} → ${baseEntry.word}로 철자를 바로잡았습니다. 한국어 뜻을 불러오는 중입니다…`
        : `${baseEntry.word}의 한국어 뜻을 불러오는 중입니다…`);
      setTranslating(true);
      const translated = await addKoreanTranslations(baseEntry.word, merged);
      setEntries([{ ...baseEntry, koreanHeadword: translated.koreanHeadword, meanings: translated.meanings }]);
      setMessage(baseEntry.correctedFrom
        ? `${baseEntry.correctedFrom} → ${baseEntry.word}로 바로잡아 검색했습니다.`
        : `${baseEntry.word} 검색 결과입니다.`);
    } catch (error) {
      setMessage(error instanceof DOMException && error.name === "AbortError" ? "검색 시간이 길어졌습니다. 다시 한 번 검색해 주세요." : "인터넷 연결을 확인한 뒤 다시 검색해 주세요.");
    } finally {
      window.clearTimeout(timeout); setLoading(false); setTranslating(false);
    }
  }

  function pronounce(entry: Entry) {
    const played = speakEnglish(entry.word);
    setMessage(played
      ? `${entry.word} 발음을 재생합니다. 소리가 작으면 기기의 미디어 음량을 확인해 주세요.`
      : "이 기기에서는 발음 재생을 지원하지 않습니다.");
  }

  function saveCurrentWord() {
    const entry = entries[0];
    if (!entry?.meanings?.length) return;
    const studyWord: StudyWord = {
      word: entry.word,
      koreanHeadword: entry.koreanHeadword,
      koreanMeanings: entry.koreanMeanings,
      phonetic: entry.phonetic || entry.phonetics?.find(item => item.text)?.text,
      meanings: entry.meanings,
      savedAt: new Date().toISOString(),
    };
    persist([studyWord, ...savedWords.filter(item => item.word.toLowerCase() !== entry.word.toLowerCase())]);
    setMessage(`${entry.word}을(를) 학습목록에 저장했습니다.`);
  }

  function removeSavedWord(word: string) {
    persist(savedWords.filter(item => item.word !== word));
  }

  function downloadStudyFile() {
    const header = ["단어", "발음", "품사", "한국어 뜻", "영영풀이", "영영풀이 해석", "영어 예문", "예문 해석"];
    const rows = savedWords.flatMap(item => item.meanings.flatMap(meaning => meaning.definitions.map((definition, definitionIndex) => [
      item.word, item.phonetic || "", `${partOfSpeechLabel(meaning.partOfSpeech)} (${meaning.partOfSpeech})`,
      koreanMeaningForDefinition(item, meaning, definition, definitionIndex), definition.definition, definition.definitionKo || "", definition.example || "", definition.exampleKo || "",
    ])));
    const csv = `\uFEFF${[header, ...rows].map(row => row.map(value => csvCell(value)).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `영어사전-학습파일-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`${savedWords.length}개 단어의 학습파일을 내려받았습니다.`);
  }

  const entry = entries[0];
  const meanings = entry?.meanings || [];
  const inlineMeaning = inlineKoreanMeaning(entry, meanings);
  const alreadySaved = !!entry && savedWords.some(item => item.word.toLowerCase() === entry.word.toLowerCase());

  return <main className="dictionary-page">
    <header><a href="/naesin"><span>M</span><b>벌교미래엔영어</b></a><nav><a href="/naesin">내신학습</a><a href="/study-log">학생 로그인</a><a href="/naesin-admin">관리자 로그인</a></nav></header>
    <section className="dictionary-hero"><p>ENGLISH DICTIONARY</p><h1>영어 단어를 찾고<br/><strong>한국어 뜻까지 학습하세요.</strong></h1><form onSubmit={search}><input autoFocus value={query} onChange={event => setQuery(event.target.value.replace(/[^a-zA-Z '-]/g, ""))} placeholder="예: achievement" aria-label="검색할 영어 단어"/><button disabled={loading}>{loading ? "검색 중…" : "단어 검색"}</button></form><small role="status" aria-live="polite">{message}</small></section>

    {entry && <section className="dictionary-result">
      <div className="dictionary-word"><div><span>검색 단어</span><div className="word-title-line"><h2>{entry.word}</h2><strong>{inlineMeaning || (translating ? "뜻 불러오는 중…" : "")}</strong></div><p>{entry.phonetic || entry.phonetics?.find(item => item.text)?.text || "발음기호 없음"}</p></div><div className="dictionary-word-actions"><button onClick={() => pronounce(entry)} aria-label={`${entry.word} 발음 듣기`}>🔊 발음 듣기</button><button className="save-word-button" onClick={saveCurrentWord} disabled={translating}>{alreadySaved ? "✓ 다시 저장" : translating ? "번역 중…" : "＋ 학습목록 저장"}</button></div></div>
      <div className="korean-summary"><span>한눈에 보는 정확한 한국어 뜻</span><div>{meanings.map((meaning, index) => { const dictionaryMeaning = cleanInlineMeaning(entry.koreanMeanings?.[meaning.partOfSpeech.toLowerCase()]?.[0]); const directMeaning = index === 0 ? cleanInlineMeaning(entry.koreanHeadword) : ""; return <article key={`summary-${meaning.partOfSpeech}-${index}`}><b>{partOfSpeechLabel(meaning.partOfSpeech)}</b><p>{directMeaning || dictionaryMeaning || conciseTranslation(meaning.definitions[0]?.definitionKo) || (translating ? "번역 중…" : "뜻을 불러오지 못했습니다.")}</p></article>; })}</div></div>
      <div className="dictionary-meanings">{meanings.map((meaning, index) => <article key={`${meaning.partOfSpeech}-${index}`}><b>{partOfSpeechLabel(meaning.partOfSpeech)} ({meaning.partOfSpeech})</b>{meaning.definitions.map((item, definitionIndex) => <div key={definitionIndex} className="meaning-card"><p className="korean-meaning"><em>{definitionIndex + 1}</em><strong>한국어 뜻</strong>{koreanMeaningForDefinition(entry, meaning, item, definitionIndex) || (translating ? "뜻 불러오는 중…" : "뜻을 불러오지 못했습니다.")}</p><p className="english-definition"><strong>영영풀이</strong>{item.definition}</p><p className="definition-translation"><strong>영영풀이 해석</strong>{item.definitionKo || (translating ? "번역 중…" : "번역을 불러오지 못했습니다.")}</p>{item.example && <small><strong>영어 예문</strong>{item.example}</small>}{item.example && <small className="korean-example"><strong>예문 해석</strong>{item.exampleKo || (translating ? "번역 중…" : "번역을 불러오지 못했습니다.")}</small>}{item.synonyms?.length ? <span>유의어: {item.synonyms.slice(0, 5).join(", ")}</span> : null}</div>)}</article>)}</div>
    </section>}

    {!entry && !loading && <section className="dictionary-guide"><b>이렇게 활용하세요</b><p>영영풀이와 한국어 뜻을 함께 익히고, 필요한 단어를 저장해 나만의 학습파일을 만들어 보세요.</p></section>}

    <section className="dictionary-study-list">
      <div className="study-list-heading"><div><span>MY STUDY WORDS</span><h2>저장한 학습 단어</h2><p>{savedWords.length}개 단어가 이 기기에 저장되어 있습니다.</p></div><button onClick={downloadStudyFile} disabled={!savedWords.length}>⬇ CSV 학습파일 내려받기</button></div>
      {savedWords.length ? <div className="saved-word-grid">{savedWords.map(item => <article key={item.word}><div><b>{item.word}</b><small>{item.phonetic || "발음기호 없음"}</small></div><p>{item.meanings.map(meaning => partOfSpeechLabel(meaning.partOfSpeech)).join(" · ")}</p><button onClick={() => removeSavedWord(item.word)} aria-label={`${item.word} 학습목록에서 삭제`}>삭제</button></article>)}</div> : <p className="empty-study-list">검색 결과에서 ‘학습목록 저장’을 누르면 이곳에 모입니다.</p>}
    </section>
  </main>;
}
