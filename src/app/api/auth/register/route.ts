import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

function generateRefCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, referralCode, termsAgreed } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }

    if (!termsAgreed) {
      return NextResponse.json(
        { error: "You must agree to the Terms of Service and Risk Disclosure." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate username format (min 3 chars, alphanumeric or underscores)
    if (cleanUsername.length < 3 || cleanUsername.length > 20 || !/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters long and alphanumeric." },
        { status: 400 }
      );
    }

    // Validate password (min 8 chars, 1 uppercase, 1 number, 1 symbol)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)").get(cleanUsername);
    if (existingUser) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    interface DbReferrer {
      id: number;
      username: string;
      referral_code: string;
    }

    // Check referrer if provided
    let verifiedReferrer: DbReferrer | null = null;
    if (referralCode) {
      verifiedReferrer = db.prepare("SELECT id, username, referral_code FROM users WHERE referral_code = ?").get(referralCode.trim()) as DbReferrer | undefined ?? null;
    }

    // Generate unique referral code for this new user
    let newRefCode = generateRefCode();
    while (db.prepare("SELECT id FROM users WHERE referral_code = ?").get(newRefCode)) {
      newRefCode = generateRefCode();
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into SQLite database
    const insertStmt = db.prepare(`
      INSERT INTO users (email, username, password_hash, referral_code, referred_by, usdt_balance, bonus_claimed)
      VALUES (?, ?, ?, ?, ?, 50.0, 1)
    `);

    const result = insertStmt.run(
      cleanEmail,
      cleanUsername,
      passwordHash,
      newRefCode,
      verifiedReferrer ? verifiedReferrer.referral_code : null
    );

    // Credit 50 USDT to referrer if valid referral code was used
    if (verifiedReferrer) {
      const updateReferrerStmt = db.prepare(`
        UPDATE users 
        SET usdt_balance = usdt_balance + 50.0,
             referral_count = referral_count + 1,
             referral_earnings = referral_earnings + 50.0
        WHERE id = ?
      `);
      updateReferrerStmt.run(verifiedReferrer.id);
    }

    // Record the 50 USDT welcome credit in the transaction ledger
    const newUserId = Number(result.lastInsertRowid);
    db.prepare(`
      INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description)
      VALUES (?, ?, 'referral_bonus', 50.0, 'USDT', 'completed', 'Welcome Allocation Voucher (50 USDT)')
    `).run(newUserId, `BONUS-${newRefCode}`);

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        email: cleanEmail,
        username: cleanUsername,
        referralCode: newRefCode,
        referredBy: verifiedReferrer ? verifiedReferrer.referral_code : null,
        usdtBalance: 50.0,
        bonusClaimed: true,
      },
      message: "Account created successfully. 50 USDT welcome bonus credited.",
    });

    setSessionCookie(response, {
      userId: newUserId,
      email: cleanEmail,
      username: cleanUsername,
      createdAt: Date.now(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error during account creation.";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
