import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../admin-auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}
