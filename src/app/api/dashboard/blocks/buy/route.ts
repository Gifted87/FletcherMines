import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getRequestSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, blockCount = 1, maturityDays = 14 } = body;

    if (!userId) {
      const session = getRequestSession(req);
      if (session) {
        userId = session.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to acquire blocks." }, { status: 401 });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as {
      id: number;
      usdt_balance: number;
      locked_balance: number;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activeBatch = db.prepare("SELECT * FROM mining_batches WHERE status = 'active' ORDER BY id DESC LIMIT 1").get() as {
      id: number;
      batch_name: string;
      price_per_block: number;
      total_blocks: number;
      claimed_blocks: number;
    } | undefined;

    const batchName = activeBatch?.batch_name || "Batch 05";
    const pricePerBlock = activeBatch?.price_per_block || 100.0;
    const totalCost = Number(blockCount) * pricePerBlock;

    if (activeBatch && activeBatch.claimed_blocks + Number(blockCount) > activeBatch.total_blocks) {
      return NextResponse.json(
        { error: `Insufficient allocation remaining. Only ${activeBatch.total_blocks - activeBatch.claimed_blocks} blocks left in ${batchName}.` },
        { status: 400 }
      );
    }

    if (user.usdt_balance < totalCost) {
      return NextResponse.json(
        { error: `Insufficient available balance. Required: ${totalCost} USDT, Available: ${user.usdt_balance} USDT.` },
        { status: 400 }
      );
    }

    // Determine rate based on maturity days (matching advertised homepage yield rules)
    const rateMap: Record<number, number> = {
      14: 10.0,
      30: 12.0,
      60: 15.0,
      90: 18.0,
      180: 20.0,
    };
    const dailyRatePct = rateMap[maturityDays] || 10.0;
    const dailyYieldUsdt = Number(((totalCost * dailyRatePct) / 100).toFixed(2));

    const maturityDate = new Date(Date.now() + maturityDays * 86400000);

    // Run transaction
    const executeBuy = db.transaction(() => {
      // 1. Deduct balance and add to locked
      db.prepare(`
        UPDATE users 
        SET usdt_balance = usdt_balance - ?,
            locked_balance = locked_balance + ?
        WHERE id = ?
      `).run(totalCost, totalCost, userId);

      // 2. Insert mining block
      db.prepare(`
        INSERT INTO mining_blocks (user_id, batch_name, block_count, total_invested, maturity_days, daily_rate_pct, daily_yield_usdt, maturity_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(userId, batchName, blockCount, totalCost, maturityDays, dailyRatePct, dailyYieldUsdt, maturityDate.toISOString());

      // 3. Update claimed blocks in batch
      if (activeBatch) {
        db.prepare(`
          UPDATE mining_batches 
          SET claimed_blocks = claimed_blocks + ? 
          WHERE id = ?
        `).run(blockCount, activeBatch.id);
      } else {
        db.prepare(`
          UPDATE mining_batches 
          SET claimed_blocks = claimed_blocks + ? 
          WHERE batch_name = 'Batch 05'
        `).run(blockCount);
      }

      // 4. Record transaction in ledger
      const txHash = `TX-BLK-${Math.floor(100000 + Math.random() * 900000)}`;
      db.prepare(`
        INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description)
        VALUES (?, ?, 'block_purchase', ?, 'USDT', 'completed', ?)
      `).run(userId, txHash, totalCost, `Mining Block Purchase (Batch 05 · ${blockCount} Blocks)`);
    });

    executeBuy();

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${blockCount} mining blocks in Batch 05.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
