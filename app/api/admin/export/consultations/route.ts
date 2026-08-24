import { isAdminAuthenticated } from "../../../../admin-auth";
import { createExcelXml, excelResponse, getConsultations } from "../../../../record-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return new Response("Unauthorized", { status: 401 });
  const records = await getConsultations();
  const xml = createExcelXml(
    "상담 신청자",
    ["신청일시", "학생 이름", "연락처", "학년", "희망 상담일시", "학습 경험", "상담 내용"],
    records.map((item) => [
      new Date(item.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      item.studentName,
      item.phone,
      item.grade,
      item.consultationAt,
      item.learningExperience,
      item.desiredDirection,
    ]),
  );
  return excelResponse(xml, `상담신청자_${new Date().toISOString().slice(0, 10)}.xls`);
}
