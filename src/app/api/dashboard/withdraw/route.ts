import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getRequestSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, amount, address, network = "TRC20" } = body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount." }, { status: 400 });
    }

    if (!address || typeof address !== "string" || address.trim().length < 10) {
      return NextResponse.json({ error: "Please enter a valid recipient wallet address." }, { status: 400 });
    }

    // Check system settings
    const settings = db.prepare("SELECT pause_withdrawals, min_withdrawal, withdrawal_fee_pct FROM system_settings WHERE id = 1").get() as {
      pause_withdrawals: number;
      min_withdrawal: number;
      withdrawal_fee_pct: number;
    } | undefined;

    if (settings && settings.pause_withdrawals) {
      return NextResponse.json(
        { error: "Withdrawals are temporarily paused during scheduled treasury audit. Please try again shortly." },
        { status: 403 }
      );
    }

    const minAmount = settings?.min_withdrawal || 20.0;
    if (withdrawAmount < minAmount) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${minAmount} USDT.` },
        { status: 400 }
      );
    }

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

    const user = db.prepare("SELECT id, username, usdt_balance, account_status FROM users WHERE id = ?").get(targetUserId) as {
      id: number;
      username: string;
      usdt_balance: number;
      account_status: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    if (user.account_status === "frozen") {
      return NextResponse.json({ error: "Your account is currently locked. Please contact support." }, { status: 403 });
    }

    if (user.usdt_balance < withdrawAmount) {
      return NextResponse.json(
        { error: `Insufficient liquid balance. Available: ${user.usdt_balance.toFixed(2)} USDT, Requested: ${withdrawAmount.toFixed(2)} USDT.` },
        { status: 400 }
      );
    }

    const feePct = settings?.withdrawal_fee_pct || 1.0;
    const feeAmount = Number(((withdrawAmount * feePct) / 100).toFixed(2));
    const netPayout = Number((withdrawAmount - feeAmount).toFixed(2));
    const txHash = `TX-WTH-${Math.floor(100000 + Math.random() * 900000)}`;

    const runTx = db.transaction(() => {
      db.prepare("UPDATE users SET usdt_balance = usdt_balance - ? WHERE id = ?").run(withdrawAmount, targetUserId);

      db.prepare(`
        INSERT INTO transactions (user_id, tx_hash, type, amount, currency, network, status, description, admin_note)
        VALUES (?, ?, 'withdrawal', ?, 'USDT', ?, 'pending', ?, ?)
      `).run(
        targetUserId,
        txHash,
        withdrawAmount,
        network,
        `USDT Withdrawal to ${address.substring(0, 10)}… (${network})`,
        `Net Payout: ${netPayout} USDT (Processing Fee: ${feeAmount} USDT)`
      );

      db.prepare(`
        INSERT INTO system_events (event_type, user_id, title, details, severity)
        VALUES ('withdrawal_requested', ?, 'Withdrawal Queued', ?, 'info')
      `).run(
        targetUserId,
        `User #${targetUserId} (${user.username}) requested cashout of ${withdrawAmount} USDT (${network}). Net: ${netPayout} USDT.`
      );
    });

    runTx();

    return NextResponse.json({
      success: true,
      txHash,
      netPayout,
      feeAmount,
      message: `Withdrawal request for ${withdrawAmount} USDT submitted for treasury batch dispatch.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process withdrawal.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
