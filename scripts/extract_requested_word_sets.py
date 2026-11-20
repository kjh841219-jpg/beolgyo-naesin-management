import json
import re
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (Path(r"C:\Users\Main\Desktop\천재소영순2학기기말\(2022개정)2026년_중2_천재(소영순)_8과_[03]WORD TEST.pdf"), "천재교육 · 소영순", "중학교 2학년", "8과"),
    (Path(r"C:\Users\Main\Desktop\비상황종배2학기기말\(2022개정)2026년_중2_비상(황종배)_8과_[03]WORD TEST.pdf"), "비상교육 · 황종배", "중학교 2학년", "8과"),
    (Path(r"C:\Users\Main\Desktop\미래엔최연희\2021년_중3_미래엔(최연희)_7과_[04]WORD TEST_OK (1).pdf"), "미래엔 · 최연희", "중학교 3학년", "7과"),
]
POS = re.compile(r"\s+(?:n|v|a|adv|prep|pron|conj|aux|exclam)\.\s*")
KOREAN = re.compile(r"[가-힣]")

def clean_entry(raw: str):
    raw = re.sub(r"\([^가-힣)]*[-–][^가-힣)]*\)", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip(" ·Ÿ□")
    match = KOREAN.search(raw)
    if not match:
        return None
    left, meaning = raw[:match.start()].strip(), raw[match.start():].strip()
    pos = POS.search(left + " ")
    word = (left[:pos.start()] if pos else left).strip(" -*·")
    meaning = re.split(r"\s{2,}|\b(?:You|He|She|They|We|I|The|A|An|Please|There|This|That|My|Our|Can|Do|What|When|If)\b", meaning)[0]
    meaning = re.sub(r"\s+", " ", meaning).strip()
    if not re.search(r"[A-Za-z]", word) or not meaning or len(word) > 55 or len(meaning) > 90:
        return None
    return {"word": word, "meaning": meaning}

def extract(path: Path):
    items, seen = [], set()
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[:6]:
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
            text = re.split(r"(?:Test 1|TEST 1|필수 단어 예문)", text)[0]
            for line in text.splitlines():
                if "□" not in line and "Ÿ" not in line:
                    continue
                for raw in re.split(r"[□Ÿ]", line):
                    item = clean_entry(raw)
                    if not item:
                        continue
                    key = re.sub(r"[^a-z]", "", item["word"].lower())
                    if len(key) < 2 or key in seen:
                        continue
                    seen.add(key)
                    items.append(item)
    return items

sets = []
for path, publisher, grade, lesson in TARGETS:
    words = extract(path)
    print(path.name, len(words))
    sets.append({"publisher": publisher, "grade": grade, "lesson": lesson, "source": path.name, "words": words})

payload = json.dumps(sets, ensure_ascii=False, indent=2)
(ROOT / "app" / "word-quiz" / "requestedNovemberWordSets.ts").write_text(
    "import type {WordSet} from './wordQuizData';\n\nexport const requestedNovemberWordSets:WordSet[]=" + payload + ";\n",
    encoding="utf-8",
)
