import glob
import json
import os
import re
from pathlib import Path

import pdfplumber

DOWNLOADS = r"C:\Users\Main\Desktop\Downloads"
OUTPUT = Path(__file__).resolve().parents[1] / "app" / "word-quiz" / "wordQuizData.ts"

TARGETS = [
    ("중1_동아", "5과"), ("중1_동아", "6과"),
    ("중1_천재", "5과"), ("중1_천재", "6과"),
    ("중2_비상", "5과"), ("중2_천재", "5과"),
    ("중3_동아", "5과"), ("중3_동아", "6과"),
    ("중3_미래엔", "5과"), ("중3_미래엔", "6과"),
]

PUBLISHERS = {
    "동아": "동아출판 · 윤정미",
    "천재": "천재교육 · 소영순",
    "비상": "비상교육 · 황종배",
    "미래엔": "미래엔 · 최연희",
}

POS = re.compile(r"\s+(?:n|v|a|adv|prep|pron|conj|aux|exclam)\.\s*")
KOREAN = re.compile(r"[가-힣]")


def target_file(key: str, lesson: str) -> str | None:
    grade, publisher = key.split("_")
    candidates = []
    for path in glob.glob(os.path.join(DOWNLOADS, "*WORD TEST*.pdf")):
        name = os.path.basename(path)
        if grade in name and publisher in name and lesson in name and "(1)" not in name:
            candidates.append(path)
    return sorted(candidates, key=lambda p: ("OK" not in p, len(os.path.basename(p))))[0] if candidates else None


def clean_entry(raw: str) -> tuple[str, str] | None:
    raw = re.sub(r"\([^가-힣)]*[-–][^가-힣)]*\)", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip(" ·Ÿ□")
    match = KOREAN.search(raw)
    if not match:
        return None
    left, meaning = raw[:match.start()].strip(), raw[match.start():].strip()
    pos = POS.search(left + " ")
    if pos:
        term = left[:pos.start()].strip()
    else:
        term = left.strip()
    term = re.sub(r"\s+", " ", term).strip(" -*·")
    meaning = re.split(r"\s{2,}|\b(?:You|He|She|They|We|I|The|A|An|Please|There|This|That|My|Our|Can|Do|What|When|If)\b", meaning)[0]
    meaning = re.sub(r"\s+", " ", meaning).strip()
    if left.endswith("~") and not meaning.startswith("~"):
        meaning = "~" + meaning
    if not term or len(term) > 55 or not meaning or len(meaning) > 90:
        return None
    if not re.search(r"[A-Za-z]", term):
        return None
    return term, meaning


def extract(path: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    seen: set[str] = set()
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[:5]:
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
            if "Test 1" in text or "TEST 1" in text:
                text = re.split(r"(?:Test 1|TEST 1)", text)[0]
            if "필수 단어 예문" in text:
                text = text.split("필수 단어 예문")[0]
            for line in text.splitlines():
                if "□" not in line and "Ÿ" not in line:
                    continue
                for raw in re.split(r"[□Ÿ]", line):
                    item = clean_entry(raw)
                    if not item:
                        continue
                    word, meaning = item
                    key = re.sub(r"[^a-z]", "", word.lower())
                    if len(key) < 2 or key in seen:
                        continue
                    seen.add(key)
                    entries.append({"word": word, "meaning": meaning})
    return entries


def main() -> None:
    sets = []
    for key, lesson in TARGETS:
        path = target_file(key, lesson)
        if not path:
            continue
        grade, publisher_key = key.split("_")
        words = extract(path)
        sets.append({
            "publisher": PUBLISHERS[publisher_key],
            "grade": f"중학교 {grade[-1]}학년",
            "lesson": lesson,
            "source": os.path.basename(path),
            "words": words,
        })
        print(f"{key} {lesson}: {len(words)} words")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(sets, ensure_ascii=False, indent=2)
    OUTPUT.write_text(
        "export type WordItem={word:string;meaning:string};\n"
        "export type WordSet={publisher:string;grade:string;lesson:string;source:string;words:WordItem[]};\n\n"
        f"export const wordSets:WordSet[]={payload};\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
