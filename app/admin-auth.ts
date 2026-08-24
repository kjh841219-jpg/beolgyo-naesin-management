import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "beolgyo_admin_session";

export function createAdminSession(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", secret).update("beolgyo-admin-session").digest("hex");
}

export function isValidAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !password) return false;
  const left = Buffer.from(password);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const expected = createAdminSession();
  return Boolean(token && expected && token === expected);
}

export { COOKIE_NAME };
