import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export const SESSION_COOKIE_NAME = "fm_session";

export interface SessionPayload {
  userId: number;
  email: string;
  username: string;
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
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = decodeSession(token);
  if (!payload) return null;

  // Verify user still exists in database
  const user = db.prepare("SELECT id, email, username, account_status FROM users WHERE id = ?").get(payload.userId) as
    | { id: number; email: string; username: string; account_status: string }
    | undefined;

  if (!user || user.account_status === "frozen") {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    createdAt: payload.createdAt,
  };
}

/**
 * Retrieves session from an API Request object.
 */
export function getRequestSession(req: Request): SessionPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!match) return null;
  const rawToken = match.substring(SESSION_COOKIE_NAME.length + 1).split(";")[0].replace(/^"|"$/g, "");
  const payload = decodeSession(rawToken);
  if (!payload) return null;

  const user = db.prepare("SELECT id, email, username, account_status FROM users WHERE id = ?").get(payload.userId) as
    | { id: number; email: string; username: string; account_status: string }
    | undefined;

  if (!user || user.account_status === "frozen") {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
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

