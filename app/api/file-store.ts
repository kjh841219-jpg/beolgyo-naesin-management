import { env } from "cloudflare:workers";
import type { VercelDatabase } from "@/app/vercel-database";

type Bucket = { put(key: string, value: ArrayBuffer, options: unknown): Promise<void>; get(key: string): Promise<{ body: BodyInit } | null>; delete(key: string): Promise<void> };
function uploads(): Bucket | null { try { return (env as unknown as { UPLOADS?: Bucket }).UPLOADS ?? null; } catch { return null; } }

export async function saveFile(db: VercelDatabase, kind: string, ownerId: number, file: File, prefix: string) {
  const bytes = Buffer.from(await file.arrayBuffer()), chunkSize = 512 * 1024;
  await db.prepare("DELETE FROM uploaded_file_chunks WHERE owner_kind=? AND owner_id=?").bind(kind, ownerId).run();
  for (let offset = 0, index = 0; offset < bytes.length; offset += chunkSize, index++) await db.prepare("INSERT INTO uploaded_file_chunks(owner_kind,owner_id,chunk_index,data_base64) VALUES(?,?,?,?)").bind(kind, ownerId, index, bytes.subarray(offset, offset + chunkSize).toString("base64")).run();
  return `db:${kind}:${ownerId}`;
}
export async function readFile(db: VercelDatabase, kind: string, ownerId: number, key: string) {
  const fromDatabase = async () => { const { results } = await db.prepare('SELECT data_base64 AS "data" FROM uploaded_file_chunks WHERE owner_kind=? AND owner_id=? ORDER BY chunk_index').bind(kind, ownerId).all<{ data: string }>(); if (!results?.length) return null; return new Blob([Buffer.from(results.map(row => row.data).join(""), "base64")]); };
  if (key.startsWith("db:")) return fromDatabase();
  if (!key) return null;
  try { return (await uploads()?.get(key))?.body ?? await fromDatabase(); }
  catch (error) { console.error("[file-store] legacy object storage read failed; checking database copy", { kind, ownerId, error: String(error) }); return fromDatabase(); }
}
export async function removeFile(db: VercelDatabase, kind: string, ownerId: number, key: string) {
  if (key.startsWith("db:")) await db.prepare("DELETE FROM uploaded_file_chunks WHERE owner_kind=? AND owner_id=?").bind(kind, ownerId).run();
  else if (key) await uploads()?.delete(key).catch(() => undefined);
}
