import { isAdminAuthenticated } from "../../../../admin-auth";
import { createExcelXml, excelResponse, getDailyResults } from "../../../../record-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return new Response("Unauthorized", { status: 401 });
  const rows = await getDailyResults();
  const xml = createExcelXml("DAILY 결과", ["응시일", "학생", "연락처", "단계", "총점", "듣기", "단어", "문법", "리딩"],
    rows.map((item) => [item.testDate, item.studentName, item.phone, item.levelLabel, `${item.score}/${item.total}`, `${item.listening}/${item.listeningTotal}`, `${item.vocabulary}/${item.vocabularyTotal}`, `${item.grammar ?? 0}/${item.grammarTotal ?? 0}`, `${item.reading}/${item.readingTotal}`]));
  return excelResponse(xml, `DAILY미니테스트_${new Date().toISOString().slice(0, 10)}.xls`);
}
