import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.trim();

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, message: "Username must be at least 3 characters." });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ available: false, message: "Only letters, numbers, and underscores allowed." });
    }

    const existing = db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)").get(username);

    return NextResponse.json({
      available: !existing,
      message: existing ? "This username is already taken." : "Username is available.",
    });
  } catch {
    return NextResponse.json({ available: false, error: "Database check failed." }, { status: 500 });
  }
}
