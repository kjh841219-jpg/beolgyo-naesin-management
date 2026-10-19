import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Definition = { definition: string; example?: string; synonyms?: string[] };
type Meaning = { partOfSpeech: string; definitions: Definition[] };
type Entry = { word: string; correctedFrom?: string; koreanMeanings?: Record<string, string[]>; phonetic?: string; phonetics?: { text?: string; audio?: string }[]; meanings: Meaning[] };

const REQUEST_TIMEOUT_MS = 7_000;
const EXCLUDED_SENSE_PATTERN = /\b(slang|vulgar|offensive|derogatory|informal|colloquial|prostitut|sexual|obscene|curse word|obsolete|archaic|spiteful woman|malicious woman)\b|속어|슬랭|비속어|구어체|비격식|욕설|모욕|비하|경멸|매춘|성적 의미|음란|사어|고어|독하거나 화난 여자|재즈의 팬/i;

function isGeneralLearningSense(value = "") {
  return !EXCLUDED_SENSE_PATTERN.test(value);
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "application/json", "User-Agent": "BeolgyoMiraenEnglish/1.0" },
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  return response.json();
}

function plainText(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fromFreeDictionary(word: string): Promise<Entry[]> {
  const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!Array.isArray(data) || !data.length) throw new Error("empty primary result");
  const entries = data.map((entry: Entry) => ({
    ...entry,
    meanings: (entry.meanings || []).map(meaning => ({
      ...meaning,
      definitions: (meaning.definitions || []).filter(definition => isGeneralLearningSense(`${definition.definition} ${definition.example || ""}`)),
    })).filter(meaning => meaning.definitions.length),
  })).filter((entry: Entry) => entry.meanings.length);
  if (!entries.length) throw new Error("no general-learning senses");
  return entries;
}

async function fromWiktionary(word: string): Promise<Entry[]> {
  const data = await fetchJson(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
  const english = Array.isArray(data?.en)
    ? data.en.filter((item: { language?: string }) => item.language === "English")
    : [];
  const meanings: Meaning[] = english
    .map((item: { partOfSpeech?: string; definitions?: { definition?: string; parsedExamples?: { example?: string }[] }[] }) => ({
      partOfSpeech: item.partOfSpeech || "Other",
      definitions: (item.definitions || [])
        .map(definition => ({
          definition: plainText(definition.definition),
          example: plainText(definition.parsedExamples?.[0]?.example),
        }))
        .filter(definition => definition.definition && isGeneralLearningSense(`${definition.definition} ${definition.example || ""}`)),
    }))
    .filter((meaning: Meaning) => meaning.definitions.length);
  if (!meanings.length) throw new Error("empty fallback result");
  return [{ word, meanings }];
}

function cleanKoreanWiktionaryText(value: string) {
  return value
    .replace(/<!--.*?-->/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/[㉶㉹]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fromKoreanWiktionary(word: string) {
  const url = new URL("https://ko.wiktionary.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", word);
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const data = await fetchJson(url.toString());
  const source = String(data?.parse?.wikitext?.["*"] || "");
  const englishSection = source.match(/==\s*영어\s*==([\s\S]*?)(?=\n==[^=]|$)/)?.[1] || "";
  const headingPattern = /===\s*(동사|명사|형용사|부사|대명사|전치사|접속사|감탄사|관사|수사)\s*===([\s\S]*?)(?=\n===|$)/g;
  const partMap: Record<string, string> = { 동사: "verb", 명사: "noun", 형용사: "adjective", 부사: "adverb", 대명사: "pronoun", 전치사: "preposition", 접속사: "conjunction", 감탄사: "interjection", 관사: "article", 수사: "numeral" };
  const meanings: Record<string, string[]> = {};
  for (const match of englishSection.matchAll(headingPattern)) {
    const key = partMap[match[1]];
    const definitions = match[2].split("\n")
      .filter(line => /^#{1,2}(?![#:*])\s*/.test(line))
      .map(line => cleanKoreanWiktionaryText(line.replace(/^#{1,2}\s*/, "")))
      .filter(definition => definition && isGeneralLearningSense(definition))
      .slice(0, 8);
    if (definitions.length) meanings[key] = [...(meanings[key] || []), ...definitions];
  }
  return meanings;
}

async function lookup(word: string) {
  return Promise.any([fromFreeDictionary(word), fromWiktionary(word)]);
}

async function suggestedSpelling(word: string) {
  const suggestions = await fetchJson(`https://api.datamuse.com/sug?s=${encodeURIComponent(word)}&max=5`);
  return Array.isArray(suggestions)
    ? suggestions.map((item: { word?: string }) => item.word).find((candidate: string | undefined) => candidate && /^[a-z'-]+$/i.test(candidate))
    : undefined;
}

export async function GET(request: NextRequest) {
  const word = (request.nextUrl.searchParams.get("word") || "").trim().toLowerCase();
  if (!/^[a-z][a-z '-]{0,48}$/i.test(word)) {
    return NextResponse.json({ error: "영어 단어를 정확히 입력해 주세요." }, { status: 400 });
  }
  console.log("[api/dictionary] search started", { word });
  try {
    const [data, koreanMeanings] = await Promise.all([lookup(word), fromKoreanWiktionary(word).catch(() => ({}))]);
    data[0] = { ...data[0], koreanMeanings };
    console.log("[api/dictionary] search completed", { word, entries: data.length });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.warn("[api/dictionary] exact lookup failed", { word, error: String(error) });
    try {
      const correction = await suggestedSpelling(word);
      if (!correction || correction === word) throw new Error("no spelling suggestion");
      const [data, koreanMeanings] = await Promise.all([lookup(correction), fromKoreanWiktionary(correction).catch(() => ({}))]);
      data[0] = { ...data[0], correctedFrom: word, koreanMeanings };
      console.log("[api/dictionary] corrected search completed", { word, correction, entries: data.length });
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
      });
    } catch (correctionError) {
      console.error("[api/dictionary] all providers failed", { word, error: String(correctionError) });
      return NextResponse.json({ error: "사전에서 단어를 찾지 못했습니다. 철자를 확인해 주세요." }, { status: 404 });
    }
  }
}
