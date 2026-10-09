import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { setSessionCookie, VAULT_COOKIE_NAME, SESSION_COOKIE_NAME, decodeSession, ensureUserInDb } from "@/lib/auth";

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

    let user = db.prepare(`
      SELECT id, email, username, password_hash, referral_code, usdt_balance, referral_count, referral_earnings, created_at
      FROM users
      WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
    `).get(cleanIdentifier, cleanIdentifier) as DbUser | undefined;

    // If user is not present in this serverless container's SQLite, check vault/session cookie
    if (!user) {
      const cookieHeader = req.headers.get("cookie") || "";
      const vaultMatch = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${VAULT_COOKIE_NAME}=`) || c.startsWith(`${SESSION_COOKIE_NAME}=`));

      if (vaultMatch) {
        const cName = vaultMatch.split("=")[0];
        const rawVault = vaultMatch.substring(cName.length + 1).split(";")[0].replace(/^"|"$/g, "");
        const vaultPayload = decodeSession(rawVault);
        if (
          vaultPayload &&
          (vaultPayload.email.toLowerCase() === cleanIdentifier.toLowerCase() ||
            vaultPayload.username.toLowerCase() === cleanIdentifier.toLowerCase())
        ) {
          ensureUserInDb(vaultPayload);
          user = db.prepare(`
            SELECT id, email, username, password_hash, referral_code, usdt_balance, referral_count, referral_earnings, created_at
            FROM users
            WHERE id = ?
          `).get(vaultPayload.userId) as DbUser | undefined;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your details and try again." },
        { status: 401 }
      );
    }

    // Verify password
    let passwordValid = false;
    if (user.password_hash === "session_restored") {
      passwordValid = true;
    } else {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    }

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
      referralCode: user.referral_code,
      usdtBalance: user.usdt_balance,
      passwordHash: user.password_hash,
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
