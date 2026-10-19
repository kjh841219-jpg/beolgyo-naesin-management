import { NextRequest, NextResponse } from "next/server";

type TranslationItem = { id: string; text: string; kind?: "word" | "sentence" };

function decodeTranslation(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function bestTranslation(data: any, item: TranslationItem) {
  const candidates = [
    data?.responseData?.translatedText,
    ...(Array.isArray(data?.matches) ? data.matches.map((match: { translation?: string }) => match.translation) : []),
  ]
    .map(value => decodeTranslation(String(value || "")))
    .filter((value, index, values) => value && values.indexOf(value) === index);
  if (item.kind !== "word") return candidates[0] || "";
  const koreanCandidates = candidates.filter(value => /[가-힣]/.test(value) && !/[.!?]/.test(value));
  return koreanCandidates.sort((a, b) => a.length - b.length)[0] || candidates[0] || "";
}

async function translateOne(item: TranslationItem) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", item.text.slice(0, 480));
  url.searchParams.set("langpair", "en|ko");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 2_592_000 },
    headers: { Accept: "application/json", "User-Agent": "BeolgyoMiraenEnglish/1.0" },
  });
  if (!response.ok) throw new Error(`translation upstream ${response.status}`);
  const data = await response.json();
  const translated = bestTranslation(data, item);
  if (!translated || !/[가-힣]/.test(translated) || translated.toLowerCase() === item.text.toLowerCase()) {
    throw new Error("invalid Korean translation");
  }
  return [item.id, translated] as const;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: TranslationItem[] = Array.isArray(body?.items)
      ? body.items
          .filter((item: TranslationItem) => typeof item?.id === "string" && typeof item?.text === "string" && item.text.trim())
          .slice(0, 30)
      : [];
    if (!items.length) return NextResponse.json({ translations: {} });

    console.log("[api/dictionary/translate] translation started", { count: items.length });
    const translations: Record<string, string> = {};
    for (let index = 0; index < items.length; index += 6) {
      const batch = await Promise.allSettled(items.slice(index, index + 6).map(translateOne));
      for (const result of batch) {
        if (result.status === "fulfilled") translations[result.value[0]] = result.value[1];
      }
    }
    console.log("[api/dictionary/translate] translation completed", { requested: items.length, translated: Object.keys(translations).length });
    return NextResponse.json({ translations });
  } catch (error) {
    console.error("[api/dictionary/translate] translation failed", { error: String(error) });
    return NextResponse.json({ translations: {}, error: "한국어 번역을 불러오지 못했습니다." }, { status: 502 });
  }
}
