from pathlib import Path
import pdfplumber

FILES = [
 r"C:\Users\Main\Desktop\천재소영순2학기기말\(2022개정)2026년_중2_천재(소영순)_8과_[01]내용정리 플러스.pdf",
 r"C:\Users\Main\Desktop\천재소영순2학기기말\(2022개정)2026년_중2_천재(소영순)_8과_[03]WORD TEST.pdf",
 r"C:\Users\Main\Desktop\비상황종배2학기기말\(2022개정)2026년_중2_비상(황종배)_8과_[01]내용정리 플러스.pdf",
 r"C:\Users\Main\Desktop\비상황종배2학기기말\(2022개정)2026년_중2_비상(황종배)_8과_[03]WORD TEST.pdf",
 r"C:\Users\Main\Desktop\동아윤2학기말파일\중3\2021년_중3_동아(윤정미)_8과_[01]내용정리_OK.pdf",
 r"C:\Users\Main\Desktop\동아윤2학기말파일\중3\2021년_중3_동아(윤정미)_8과_[04]WORD TEST_OK.pdf",
 r"C:\Users\Main\Desktop\동아윤2학기말파일\중2\(2022개정)2026년_중2_동아(윤정미)_8과_[01]내용정리 플러스.pdf",
 r"C:\Users\Main\Desktop\동아윤2학기말파일\중2\(2022개정)2026년_중2_동아(윤정미)_8과_[03]WORD TEST.pdf",
 r"C:\Users\Main\Desktop\동아윤2학기말파일\중1\(2022개정)2025년_중1_동아(윤정미)_8과_[01]내용정리 플러스 (1).pdf",
 r"C:\Users\Main\Desktop\동아윤2학기말파일\중1\(2022개정)2025년_중1_동아(윤정미)_8과_[03]WORD TEST.pdf",
 r"C:\Users\Main\Desktop\미래엔최연희\2021년_중3_미래엔(최연희)_7과_[01]내용정리_OK (1).pdf",
 r"C:\Users\Main\Desktop\미래엔최연희\2021년_중3_미래엔(최연희)_7과_[04]WORD TEST_OK (1).pdf",
]

out = Path(__file__).resolve().parents[1] / "tmp" / "pdfs"
out.mkdir(parents=True, exist_ok=True)
for raw in FILES:
    path = Path(raw)
    if not path.exists():
        print("MISSING", path)
        continue
    pages = []
    with pdfplumber.open(path) as pdf:
        for index, page in enumerate(pdf.pages, 1):
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
            pages.append(f"\n===== PAGE {index} =====\n{text}")
    target = out / f"{path.stem}.txt"
    target.write_text("".join(pages), encoding="utf-8")
    print(f"{path.name}\tpages={len(pages)}\tchars={sum(map(len,pages))}\t{target}")
