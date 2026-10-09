import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please enter your email or username and password." },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim();

    interface DbUser {
      id: number;
      email: string;
      username: string;
      password_hash: string;
      referral_code: string;
      usdt_balance: number;
      referral_count: number;
      referral_earnings: number;
      created_at: string;
    }

    const user = db.prepare(`
      SELECT id, email, username, password_hash, referral_code, usdt_balance, referral_count, referral_earnings, created_at
      FROM users
      WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
    `).get(cleanIdentifier, cleanIdentifier) as DbUser | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your details and try again." },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your details and try again." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        referralCode: user.referral_code,
        usdtBalance: user.usdt_balance,
        referralCount: user.referral_count,
        referralEarnings: user.referral_earnings,
        createdAt: user.created_at,
      },
      message: "Authentication successful.",
    });

    setSessionCookie(response, {
      userId: user.id,
      email: user.email,
      username: user.username,
      createdAt: Date.now(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
