import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user exists
    const user = db.prepare("SELECT id, username FROM users WHERE email = ?").get(cleanEmail);

    if (!user) {
      // Don't leak user existence for security, return generic confirmation
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, password reset instructions have been dispatched.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.prepare(`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (?, ?, ?)
    `).run(cleanEmail, token, expiresAt);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been dispatched.",
      // For development mockup demonstration
      demoResetToken: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
