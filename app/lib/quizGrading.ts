export const normalizeQuizText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9가-힣]/g, "");

export const englishWords = (value: string) =>
  value.match(/[A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)*/g) || [];

export const isExactEnglishAnswer = (answer: string, target: string) =>
  Boolean(answer.trim()) && normalizeQuizText(answer) === normalizeQuizText(target);

export const isCorrectWordOrder = (answerWords: string[], target: string) => {
  const expected = englishWords(target).map(normalizeQuizText);
  const submitted = answerWords.map(normalizeQuizText).filter(Boolean);
  return (
    expected.length > 0 &&
    submitted.length === expected.length &&
    submitted.every((word, index) => word === expected[index])
  );
};

const koreanTokens = (value: string) =>
  value
    .split(/[\s,./!?;:()[\]{}"'“”‘’·]+/)
    .map(normalizeQuizText)
    .filter((token) => token.length >= 2);

export const isAcceptableTranslation = (
  answer: string,
  target: string,
  keywords: string[] = [],
) => {
  const submitted = normalizeQuizText(answer);
  if (!submitted) return false;

  const candidates = [...new Set(
    (keywords.length ? keywords : koreanTokens(target))
      .map(normalizeQuizText)
      .filter((token) => token.length >= 2),
  )];
  if (!candidates.length) return submitted === normalizeQuizText(target);

  const matched = candidates.filter((token) => submitted.includes(token)).length;
  return matched >= Math.max(1, Math.ceil(candidates.length * 0.6));
};

export const shuffleQuizItems = <T,>(items: T[]) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const stableShuffleEnglishWords = (sentence: string) => {
  const items = englishWords(sentence).map((word, index) => ({
    word,
    key: `${index}-${word}`,
  }));
  let seed = Array.from(sentence).reduce(
    (value, character) => ((value * 31) ^ character.charCodeAt(0)) >>> 0,
    2166136261,
  );
  for (let index = items.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  const original = englishWords(sentence);
  if (
    items.length > 1 &&
    items.every((item, index) => item.word === original[index])
  ) {
    items.push(items.shift()!);
  }
  return items;
};
