import { NextResponse } from "next/server";

type HolidayApiItem = {
  date?: string;
  localName?: string;
  name?: string;
};

const YEAR_PATTERN = /^\d{4}$/;

export async function GET(request: Request) {
  const yearValue = new URL(request.url).searchParams.get("year") ?? "";
  if (!YEAR_PATTERN.test(yearValue)) {
    return NextResponse.json({ holidays: [] }, { status: 400 });
  }
  const year = Number(yearValue);
  if (year < 2020 || year > 2035) {
    return NextResponse.json({ holidays: [] }, { status: 400 });
  }

  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`, {
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Holiday API ${response.status}`);
    const items = (await response.json()) as HolidayApiItem[];
    const apiHolidays = items.flatMap((item) => {
      if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return [];
      const originalName = item.localName || item.name || "공휴일";
      const name = originalName === "광복절" && item.date !== `${year}-08-15`
        ? "광복절 대체공휴일"
        : originalName;
      return [{ date: item.date, name }];
    });
    const requiredFixedHolidays = [
      { date: `${year}-01-01`, name: "신정" },
      { date: `${year}-03-01`, name: "삼일절" },
      { date: `${year}-05-05`, name: "어린이날" },
      { date: `${year}-06-06`, name: "현충일" },
      { date: `${year}-08-15`, name: "광복절 연휴" },
      { date: `${year}-10-03`, name: "개천절" },
      { date: `${year}-10-09`, name: "한글날" },
      { date: `${year}-12-25`, name: "성탄절" },
    ];
    const holidayMap = new Map(apiHolidays.map((holiday) => [holiday.date, holiday]));
    requiredFixedHolidays.forEach((holiday) => holidayMap.set(holiday.date, holiday));
    const holidays = [...holidayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ holidays }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    const fixed = [
      [`${year}-01-01`, "신정"],
      [`${year}-03-01`, "삼일절"],
      [`${year}-05-05`, "어린이날"],
      [`${year}-06-06`, "현충일"],
      [`${year}-08-15`, "광복절"],
      [`${year}-10-03`, "개천절"],
      [`${year}-10-09`, "한글날"],
      [`${year}-12-25`, "성탄절"],
    ].map(([date, name]) => ({ date, name }));
    return NextResponse.json({ holidays: fixed }, {
      headers: { "Cache-Control": "public, s-maxage=3600" },
    });
  }
}
