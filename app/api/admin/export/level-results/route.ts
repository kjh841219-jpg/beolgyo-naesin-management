import { isAdminAuthenticated } from "../../../../admin-auth";
import { createExcelXml, excelResponse, getLevelResults } from "../../../../record-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return new Response("Unauthorized", { status: 401 });
  const records = await getLevelResults();
  const xml = createExcelXml(
    "레벨테스트 결과",
    ["응시일시", "학생 이름", "연락처", "응시 레벨", "총점", "어휘", "문법", "리딩"],
    records.map((item) => [
      new Date(item.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      item.studentName,
      item.phone,
      item.trackLabel,
      `${item.score}/${item.total}`,
      `${item.vocabulary}/${item.vocabularyTotal}`,
      `${item.grammar}/${item.grammarTotal}`,
      `${item.reading}/${item.readingTotal}`,
    ]),
  );
  return excelResponse(xml, `레벨테스트결과_${new Date().toISOString().slice(0, 10)}.xls`);
}
