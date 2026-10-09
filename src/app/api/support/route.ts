import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Email, subject, and message are required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSubject = String(subject).trim();
    const cleanMessage = String(message).trim();

    const result = db.prepare(`
      INSERT INTO support_tickets (email, subject, message)
      VALUES (?, ?, ?)
    `).run(cleanEmail, cleanSubject, cleanMessage);

    const ticketNumber = `TKT-${1000 + Number(result.lastInsertRowid)}`;

    return NextResponse.json({
      success: true,
      ticketNumber,
      message: `Your support inquiry (${ticketNumber}) has been registered. Our institutional desk will respond within 4 business hours.`,
    });
  } catch (error) {
    console.error("Support ticket error:", error);
    return NextResponse.json({ error: "Failed to submit support inquiry." }, { status: 500 });
  }
}
