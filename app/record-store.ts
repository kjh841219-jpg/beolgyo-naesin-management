import "server-only";

import { neon } from "@neondatabase/serverless";
import { get, list } from "@vercel/blob";
import { randomUUID, createHash } from "node:crypto";

export type ConsultationRecord = {
  id: string;
  createdAt: string;
  studentName: string;
  phone: string;
  grade: string;
  consultationAt: string;
  learningExperience: string;
  desiredDirection: string;
};

export type LevelResultRecord = {
  id: string;
  createdAt: string;
  studentName: string;
  phone: string;
  trackId: string;
  trackLabel: string;
  score: number;
  total: number;
  vocabulary: number;
  vocabularyTotal: number;
  grammar: number;
  grammarTotal: number;
  reading: number;
  readingTotal: number;
};

export type DailyResultRecord = {
  id: string;
  createdAt: string;
  testDate: string;
  studentName: string;
  phone: string;
  levelId: string;
  levelLabel: string;
  score: number;
  total: number;
  listening: number;
  listeningTotal: number;
  vocabulary: number;
  vocabularyTotal: number;
  grammar: number;
  grammarTotal: number;
  reading: number;
  readingTotal: number;
};

type RecordKind = "consultation" | "level-result" | "daily-result";

function database() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = database();
      await sql`
        CREATE TABLE IF NOT EXISTS academy_records (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS academy_records_kind_created_idx ON academy_records (kind, created_at DESC)`;
      await sql`
        CREATE TABLE IF NOT EXISTS academy_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function saveJsonRecord<T extends { id: string; createdAt: string }>(kind: RecordKind, record: T) {
  await ensureSchema();
  const sql = database();
  await sql`
    INSERT INTO academy_records (id, kind, created_at, payload)
    VALUES (${record.id}, ${kind}, ${record.createdAt}, ${JSON.stringify(record)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload
  `;
}

async function listJsonRecords<T>(kind: RecordKind): Promise<T[]> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`SELECT payload FROM academy_records WHERE kind = ${kind} ORDER BY created_at DESC`;
  return rows.map((row) => row.payload as T);
}

async function listLegacyBlobRecords<T>(prefix: string): Promise<T[]> {
  try {
    const records: T[] = [];
    let cursor: string | undefined;
    do {
      const result = await list({ prefix, limit: 1000, cursor });
      const page = await Promise.all(result.blobs.map(async (blob) => {
        const response = await get(blob.pathname, { access: "private", useCache: false });
        if (!response || response.statusCode !== 200 || !response.stream) return null;
        return (await new Response(response.stream).json()) as T;
      }));
      records.push(...page.filter((record) => record !== null) as T[]);
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
    return records;
  } catch (error) {
    console.error("[record-store] legacy Blob records could not be loaded", error);
    return [];
  }
}

export async function getJsonSetting<T>(key: string): Promise<T | null> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`SELECT value FROM academy_settings WHERE key = ${key} LIMIT 1`;
  return rows.length ? (rows[0].value as T) : null;
}

export async function setJsonSetting<T>(key: string, value: T) {
  await ensureSchema();
  const sql = database();
  await sql`
    INSERT INTO academy_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export async function getKakaoRoomSettings(): Promise<Record<string, string>> {
  await ensureSchema();
  const rows = await database()`SELECT value FROM academy_settings WHERE key LIKE 'kakao-room-v1:%'`;
  const rooms: Record<string, string> = Object.create(null);
  for (const row of rows) {
    const value = row.value as { contactKey?: unknown; room?: unknown };
    if (typeof value?.contactKey === "string" && typeof value.room === "string" && !["__proto__", "constructor", "prototype"].includes(value.contactKey)) rooms[value.contactKey] = value.room;
  }
  return rooms;
}

export async function saveKakaoRoomSettings(rooms: Record<string, string>, replace: boolean) {
  await ensureSchema();
  const sql = database();
  // One row per contact avoids unrelated bindings being lost to concurrent saves.
  for (const [contactKey, room] of Object.entries(rooms)) {
    const key = `kakao-room-v1:${createHash("sha256").update(contactKey).digest("hex")}`;
    const value = JSON.stringify({ contactKey, room });
    if (replace) {
      await sql`INSERT INTO academy_settings (key,value,updated_at) VALUES (${key},${value}::jsonb,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`;
    } else {
      // Importing an old browser never silently changes an existing recipient.
      await sql`INSERT INTO academy_settings (key,value,updated_at) VALUES (${key},${value}::jsonb,NOW()) ON CONFLICT (key) DO NOTHING`;
    }
  }
  return getKakaoRoomSettings();
}

export function cleanText(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function createConsultation(
  input: Omit<ConsultationRecord, "id" | "createdAt">,
) {
  const record: ConsultationRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await saveJsonRecord("consultation", record);
  return record;
}

export async function getConsultations() {
  return listJsonRecords<ConsultationRecord>("consultation");
}

export async function createLevelResult(
  input: Omit<LevelResultRecord, "id" | "createdAt">,
) {
  const record: LevelResultRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await saveJsonRecord("level-result", record);
  return record;
}

export async function getLevelResults() {
  return listJsonRecords<LevelResultRecord>("level-result");
}

export async function createDailyResult(input: Omit<DailyResultRecord, "id" | "createdAt">) {
  const record: DailyResultRecord = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await saveJsonRecord("daily-result", record);
  return record;
}

export async function getDailyResults() {
  const [databaseRecords, legacyRecords] = await Promise.all([
    listJsonRecords<DailyResultRecord>("daily-result"),
    listLegacyBlobRecords<DailyResultRecord>("records/daily-results/"),
  ]);
  const merged = new Map<string, DailyResultRecord>();
  legacyRecords.forEach((record) => {
    // The recovered 2026-08-31 batch was once stored as 2026-09-01 during the
    // legacy-to-database restore. Keep the original August assessment month.
    const restoredAugustDate = record.testDate === "2026-09-01"
      ? "2026-08-31"
      : record.testDate;
    merged.set(record.id, {
      ...record,
      testDate: restoredAugustDate,
      grammar: Number(record.grammar ?? 0),
      grammarTotal: Number(record.grammarTotal ?? 0),
    });
  });
  databaseRecords.forEach((record) => merged.set(record.id, {
    ...record,
    grammar: Number(record.grammar ?? 0),
    grammarTotal: Number(record.grammarTotal ?? 0),
  }));
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createExcelXml(sheetName: string, headers: string[], rows: unknown[][]) {
  const rowXml = [headers, ...rows]
    .map(
      (row, index) =>
        `<Row>${row
          .map(
            (cell) =>
              `<Cell${index === 0 ? ' ss:StyleID="Header"' : ""}><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`,
          )
          .join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="맑은 고딕" ss:Size="10"/></Style>
  <Style ss:ID="Header"><Font ss:FontName="맑은 고딕" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#DCEFE7" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>${rowXml}</Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

export function excelResponse(xml: string, filename: string) {
  return new Response(`\uFEFF${xml}`, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="export.xls"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
