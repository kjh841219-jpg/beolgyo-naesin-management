import "server-only";

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

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
  const rows = await sql`SELECT payload FROM academy_records WHERE kind = ${kind} ORDER BY created_at DESC LIMIT 1000`;
  return rows.map((row) => row.payload as T);
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
  return listJsonRecords<DailyResultRecord>("daily-result");
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
