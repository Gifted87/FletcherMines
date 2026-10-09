import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getRequestSession, ensureUserExists } from "@/lib/auth";

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

    if (!address.trim().startsWith("T")) {
      return NextResponse.json(
        { error: "Invalid TRON address. Withdrawals are supported exclusively via TRON (TRC-20) and must start with 'T'." },
        { status: 400 }
      );
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

    const minAmount = Math.max(1000.0, settings?.min_withdrawal || 1000.0);
    if (withdrawAmount < minAmount) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${minAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT ($1,000.00).` },
        { status: 400 }
      );
    }

    let targetUserId = Number(userId);
    const session = getRequestSession(req);
    if (!targetUserId || isNaN(targetUserId)) {
      if (session) {
        targetUserId = session.userId;
      }
    }

    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ error: "Unauthorized. User identification required." }, { status: 401 });
    }

    ensureUserExists(targetUserId, session?.email, session?.username);

    const user = db.prepare("SELECT id, username, usdt_balance, locked_balance, account_status FROM users WHERE id = ?").get(targetUserId) as {
      id: number;
      username: string;
      usdt_balance: number;
      locked_balance: number;
      account_status: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    if (user.account_status === "frozen") {
      return NextResponse.json({ error: "Your account is currently locked. Please contact support." }, { status: 403 });
    }

    // Check if the user has any amounts locked in active mining contracts
    const activeBlocks = db.prepare(`
      SELECT count(*) as count, coalesce(sum(total_invested), 0) as lockedTotal 
      FROM mining_blocks 
      WHERE user_id = ? AND status = 'active'
    `).get(targetUserId) as { count: number; lockedTotal: number } | undefined;

    const lockedAmount = Math.max(Number(user.locked_balance || 0), Number(activeBlocks?.lockedTotal || 0));
    const hasActiveContracts = lockedAmount > 0 || ((activeBlocks?.count || 0) > 0);

    if (hasActiveContracts) {
      return NextResponse.json(
        {
          error: `Withdrawal restricted: You currently have ${lockedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT locked in active mining allocations. Under platform protocol, accounts with locked contract capital cannot execute withdrawals until all active contracts reach maturity at the end of the run.`,
        },
        { status: 403 }
      );
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
