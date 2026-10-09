import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Admin session cleared" });
  clearAdminSessionCookie(res);
  return res;
}
