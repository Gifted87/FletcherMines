import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export const SESSION_COOKIE_NAME = "fm_session";
export const VAULT_COOKIE_NAME = "fm_vault";

export interface SessionPayload {
  userId: number;
  email: string;
  username: string;
  referralCode?: string;
  usdtBalance?: number;
  passwordHash?: string;
  createdAt: number;
}

/**
 * Creates an encoded session token.
 */
export function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decodes an encoded session token.
 */
export function decodeSession(token: string): SessionPayload | null {
  try {
    const cleanToken = decodeURIComponent(token.trim());
    const raw = Buffer.from(cleanToken, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === "number") {
      return parsed as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ensures user exists in SQLite database across ephemeral serverless lambdas.
 */
export function ensureUserInDb(payload: SessionPayload): void {
  try {
    const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(payload.userId);
    if (!existing) {
      db.prepare(`
        INSERT OR IGNORE INTO users (
          id, email, username, password_hash, referral_code,
          usdt_balance, locked_balance, bonus_claimed, referral_count,
          referral_earnings, email_verified, two_factor_enabled,
          kyc_status, account_status, telegram_joined
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, 0.0, 1, 0,
          0.0, 1, 1,
          'verified', 'active', 1
        )
      `).run(
        payload.userId,
        payload.email,
        payload.username,
        payload.passwordHash || "session_restored",
        payload.referralCode || `REF-${Math.abs(payload.userId).toString(36).toUpperCase().padStart(5, "0")}`,
        payload.usdtBalance ?? 50.0
      );
    }
  } catch (err) {
    console.warn("ensureUserInDb notice:", err);
  }
}

/**
 * Sets the session cookie on a NextResponse object.
 */
export function setSessionCookie(response: NextResponse, payload: SessionPayload) {
  const token = encodeSession(payload);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Also maintain long-lived vault cookie so accounts persist across serverless restarts
  try {
    response.cookies.set({
      name: VAULT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60, // 90 days
    });
  } catch (err) {
    console.warn("Vault cookie set notice:", err);
  }
}

/**
 * Clears the session cookie on a NextResponse object.
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Retrieves the session from server-side cookies (for Server Components and Server Actions).
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get(VAULT_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = decodeSession(token);
  if (!payload || !payload.userId) return null;

  ensureUserInDb(payload);

  // Verify user in database
  const user = db.prepare("SELECT id, email, username, account_status FROM users WHERE id = ?").get(payload.userId) as
    | { id: number; email: string; username: string; account_status: string }
    | undefined;

  if (user && user.account_status === "frozen") {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    referralCode: payload.referralCode,
    usdtBalance: payload.usdtBalance,
    createdAt: payload.createdAt,
  };
}

/**
 * Retrieves session from an API Request object.
 */
export function getRequestSession(req: Request): SessionPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match =
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`)) ||
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${VAULT_COOKIE_NAME}=`));

  if (!match) return null;
  const cookieName = match.split("=")[0];
  const rawToken = match.substring(cookieName.length + 1).split(";")[0].replace(/^"|"$/g, "");
  const payload = decodeSession(rawToken);
  if (!payload || !payload.userId) return null;

  ensureUserInDb(payload);

  const user = db.prepare("SELECT id, email, username, account_status FROM users WHERE id = ?").get(payload.userId) as
    | { id: number; email: string; username: string; account_status: string }
    | undefined;

  if (user && user.account_status === "frozen") {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    referralCode: payload.referralCode,
    usdtBalance: payload.usdtBalance,
    createdAt: payload.createdAt,
  };
}

export const ADMIN_SESSION_COOKIE = "fm_admin_session";

export interface AdminSessionPayload {
  role: "admin";
  authenticatedAt: number;
}

export function verifyAdminPassword(password: string): boolean {
  const masterPassword = process.env.ADMIN_PASSWORD || "Gifted87";
  return password === masterPassword;
}

export function encodeAdminSession(payload: AdminSessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeAdminSession(token: string): AdminSessionPayload | null {
  try {
    const cleanToken = decodeURIComponent(token.trim());
    const raw = Buffer.from(cleanToken, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && parsed.role === "admin") {
      return parsed as AdminSessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(response: NextResponse) {
  const payload: AdminSessionPayload = {
    role: "admin",
    authenticatedAt: Date.now(),
  };
  const token = encodeAdminSession(payload);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminServerSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeAdminSession(token);
}

export function getAdminRequestSession(req: Request): AdminSessionPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!match) return null;
  const rawToken = match.substring(ADMIN_SESSION_COOKIE.length + 1).split(";")[0].replace(/^"|"$/g, "");
  return decodeAdminSession(rawToken);
}

