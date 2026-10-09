import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getRequestSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, amount, txHash } = body;

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json({ error: "Invalid deposit amount." }, { status: 400 });
    }

    const hash = (txHash && String(txHash).trim()) || `TX-DEP-${Math.floor(10000 + Math.random() * 90000)}`;

    let targetUserId = Number(userId);
    if (!targetUserId || isNaN(targetUserId)) {
      const session = getRequestSession(req);
      if (session) {
        targetUserId = session.userId;
      }
    }

    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ error: "Unauthorized. User identification required." }, { status: 401 });
    }

    // Insert pending deposit into SQLite transactions
    const result = db.prepare(`
      INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description)
      VALUES (?, ?, 'deposit', ?, 'USDT', 'pending', ?)
    `).run(
      targetUserId,
      hash,
      depositAmount,
      `Manual USDT Deposit (${hash.substring(0, 16)})`
    );

    return NextResponse.json({
      success: true,
      transactionId: result.lastInsertRowid,
      txHash: hash,
      status: "pending",
      message: "Deposit submitted for manual treasury verification.",
    });
  } catch (error) {
    console.error("Deposit submission error:", error);
    return NextResponse.json({ error: "Failed to submit deposit transaction to database." }, { status: 500 });
  }
}
