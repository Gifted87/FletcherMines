import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("ref")?.trim();

    if (!code) {
      return NextResponse.json({ valid: false, message: "No referral code provided." });
    }

    interface DbReferrer {
      username: string;
      referral_code: string;
    }

    const referrer = db.prepare("SELECT username, referral_code FROM users WHERE referral_code = ?").get(code) as DbReferrer | undefined;

    if (referrer) {
      return NextResponse.json({
        valid: true,
        referrer: referrer.username,
        code: referrer.referral_code,
        message: "Referral code applied. Bonus blocks will be credited after account activation.",
      });
    }

    // Also support default promo code like REF-84927 or system genesis codes
    if (code.toUpperCase() === "REF-84927" || code.toUpperCase() === "FLETCHER50") {
      return NextResponse.json({
        valid: true,
        referrer: "Fletcher Mining Reserve",
        code: code.toUpperCase(),
        message: "Referral code applied. Bonus blocks will be credited after account activation.",
      });
    }

    return NextResponse.json({
      valid: false,
      message: "Invalid referral code. Please check and try again.",
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Validation failed." }, { status: 500 });
  }
}
