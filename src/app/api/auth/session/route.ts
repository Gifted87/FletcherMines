import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = db.prepare(`
      SELECT id, email, username, referral_code, usdt_balance, locked_balance, referral_count, referral_earnings, kyc_status, account_status, created_at
      FROM users WHERE id = ?
    `).get(session.userId) as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Session error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
