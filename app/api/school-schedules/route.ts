import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const NEIS_BASE_URL = "https://open.neis.go.kr/hub";
const SCHOOL_NAME_PATTERN = /^[가-힣a-zA-Z0-9\s().·\-_]{2,40}$/;
const CODE_PATTERN = /^[A-Z0-9]{3,10}$/;

type NeisDataset<T> = Array<
  | { head?: Array<{ list_total_count?: number; RESULT?: { CODE?: string; MESSAGE?: string } }> }
  | { row?: T[] }
>;

type NeisSchool = {
  ATPT_OFCDC_SC_CODE?: string;
  ATPT_OFCDC_SC_NM?: string;
  SD_SCHUL_CODE?: string;
  SCHUL_NM?: string;
  SCHUL_KND_SC_NM?: string;
  LCTN_SC_NM?: string;
  ORG_RDNMA?: string;
  HMPG_ADRES?: string;
};

type NeisSchedule = {
  AA_YMD?: string;
  EVENT_NM?: string;
  EVENT_CNTNT?: string;
  SBTR_DD_SC_NM?: string;
  ONE_GRADE_EVENT_YN?: string;
  TW_GRADE_EVENT_YN?: string;
  THREE_GRADE_EVENT_YN?: string;
  FR_GRADE_EVENT_YN?: string;
  FIV_GRADE_EVENT_YN?: string;
  SIX_GRADE_EVENT_YN?: string;
};

function readRows<T>(payload: unknown, key: string): T[] {
  if (!payload || typeof payload !== "object") return [];
  const dataset = (payload as Record<string, unknown>)[key] as NeisDataset<T> | undefined;
  if (!Array.isArray(dataset)) return [];
  const rowBlock = dataset.find((block) => "row" in block);
  return rowBlock && "row" in rowBlock && Array.isArray(rowBlock.row) ? rowBlock.row : [];
}

async function fetchNeis<T>(dataset: string, parameters: Record<string, string>) {
  const search = new URLSearchParams({
    Type: "json",
    pIndex: "1",
    pSize: "100",
    ...parameters,
  });
  const apiKey = process.env.NEIS_API_KEY?.trim();
  if (apiKey) search.set("KEY", apiKey);

  const response = await fetch(`${NEIS_BASE_URL}/${dataset}?${search.toString()}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`NEIS request failed: ${response.status}`);
  return readRows<T>(await response.json(), dataset);
}

function ymdToDate(value = "") {
  return /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  try {
    if (action === "schools") {
      const query = (searchParams.get("q") ?? "").trim();
      const region = (searchParams.get("region") ?? "").trim();
      if (!SCHOOL_NAME_PATTERN.test(query)) {
        return NextResponse.json({ error: "학교명을 두 글자 이상 정확히 입력해 주세요." }, { status: 400 });
      }
      if (region && !CODE_PATTERN.test(region)) {
        return NextResponse.json({ error: "지역 값을 확인해 주세요." }, { status: 400 });
      }

      const rows = await fetchNeis<NeisSchool>("schoolInfo", {
        SCHUL_NM: query,
        ...(region ? { ATPT_OFCDC_SC_CODE: region } : {}),
      });
      const schools = rows.flatMap((school) => {
        if (!school.ATPT_OFCDC_SC_CODE || !school.SD_SCHUL_CODE || !school.SCHUL_NM) return [];
        return [{
          officeCode: school.ATPT_OFCDC_SC_CODE,
          officeName: school.ATPT_OFCDC_SC_NM ?? "",
          schoolCode: school.SD_SCHUL_CODE,
          name: school.SCHUL_NM,
          kind: school.SCHUL_KND_SC_NM ?? "",
          region: school.LCTN_SC_NM ?? "",
          address: school.ORG_RDNMA ?? "",
          homepage: school.HMPG_ADRES ?? "",
        }];
      });
      return NextResponse.json(
        { schools },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
      );
    }

    if (action === "schedule") {
      const officeCode = (searchParams.get("office") ?? "").trim();
      const schoolCode = (searchParams.get("school") ?? "").trim();
      const year = Number(searchParams.get("year"));
      const month = Number(searchParams.get("month"));
      if (!CODE_PATTERN.test(officeCode) || !/^\d{7,10}$/.test(schoolCode)) {
        return NextResponse.json({ error: "학교 정보를 다시 선택해 주세요." }, { status: 400 });
      }
      if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
        return NextResponse.json({ error: "조회할 연월을 확인해 주세요." }, { status: 400 });
      }

      const lastDay = new Date(year, month, 0).getDate();
      const prefix = `${year}${String(month).padStart(2, "0")}`;
      const rows = await fetchNeis<NeisSchedule>("SchoolSchedule", {
        ATPT_OFCDC_SC_CODE: officeCode,
        SD_SCHUL_CODE: schoolCode,
        AA_FROM_YMD: `${prefix}01`,
        AA_TO_YMD: `${prefix}${lastDay}`,
      });
      const events = rows.flatMap((event) => {
        const date = ymdToDate(event.AA_YMD);
        const title = event.EVENT_NM?.trim();
        if (!date || !title) return [];
        const gradeFlags = [
          event.ONE_GRADE_EVENT_YN,
          event.TW_GRADE_EVENT_YN,
          event.THREE_GRADE_EVENT_YN,
          event.FR_GRADE_EVENT_YN,
          event.FIV_GRADE_EVENT_YN,
          event.SIX_GRADE_EVENT_YN,
        ];
        const grades = gradeFlags
          .map((flag, index) => flag === "Y" ? index + 1 : null)
          .filter((grade): grade is number => grade !== null);
        return [{
          date,
          title,
          description: event.EVENT_CNTNT?.trim() ?? "",
          type: event.SBTR_DD_SC_NM?.trim() ?? "",
          grades,
        }];
      });
      return NextResponse.json(
        { events, limited: !process.env.NEIS_API_KEY && events.length >= 5 },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
      );
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch (error) {
    console.error("NEIS schedule request failed", error);
    return NextResponse.json(
      { error: "학교 일정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
