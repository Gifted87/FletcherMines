import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getRequestSession, ensureUserExists } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId") ? Number(searchParams.get("userId")) : undefined;

    const session = getRequestSession(req);
    if (!userId && session) {
      userId = session.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. User identification required." }, { status: 401 });
    }

    ensureUserExists(userId, session?.email, session?.username);

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Task record for user
    const task = db.prepare("SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = ?").get(userId, todayStr) as {
      id: number;
      streak_count: number;
      completed: number;
      completed_at: string | null;
    } | undefined;

    // 2. System settings
    const settings = db.prepare(`
      SELECT task_mode, streak_mult_1_3, streak_mult_4_7, streak_mult_8_plus, streak_penalty, catchup_cost 
      FROM system_settings WHERE id = 1
    `).get() as {
      task_mode: string;
      streak_mult_1_3: number;
      streak_mult_4_7: number;
      streak_mult_8_plus: number;
      streak_penalty: string;
      catchup_cost: number;
    } | undefined;

    const streak = task ? task.streak_count : 1;
    const completed = task ? Boolean(task.completed) : false;

    // Calculate current multiplier
    let multiplier = settings?.streak_mult_1_3 || 1.0;
    if (streak >= 8) {
      multiplier = settings?.streak_mult_8_plus || 1.2;
    } else if (streak >= 4) {
      multiplier = settings?.streak_mult_4_7 || 1.1;
    }

    // 3. If quiz mode, fetch active question
    let activeQuestion = null;
    if (settings?.task_mode === "quiz") {
      const q = db.prepare("SELECT id, question_text, option_a, option_b, option_c, option_d FROM daily_task_questions WHERE is_active = 1 ORDER BY id ASC LIMIT 1").get();
      if (q) activeQuestion = q;
    }

    return NextResponse.json({
      success: true,
      taskMode: settings?.task_mode || "ping",
      completedToday: completed,
      streakDays: streak,
      multiplier,
      catchupCost: settings?.catchup_cost || 5.0,
      streakPenalty: settings?.streak_penalty || "reset_zero",
      activeQuestion,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching task configuration";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId } = body;

    if (action === "catchup") {
      let targetUserId = userId ? Number(userId) : undefined;
      if (!targetUserId) {
        const session = getRequestSession(req);
        if (session) {
          targetUserId = session.userId;
        }
      }

      if (!targetUserId) {
        return NextResponse.json({ error: "Unauthorized. User identification required." }, { status: 401 });
      }

      ensureUserExists(targetUserId);

      const user = db.prepare("SELECT id, usdt_balance FROM users WHERE id = ?").get(targetUserId) as {
        id: number;
        usdt_balance: number;
      } | undefined;

      const settings = db.prepare("SELECT catchup_cost FROM system_settings WHERE id = 1").get() as {
        catchup_cost: number;
      } | undefined;

      const cost = settings?.catchup_cost || 5.0;

      if (!user || user.usdt_balance < cost) {
        return NextResponse.json({ error: `Insufficient balance for Retroactive Sync (${cost} USDT required).` }, { status: 400 });
      }

      const todayStr = new Date().toISOString().split("T")[0];

      const runTx = db.transaction(() => {
        db.prepare("UPDATE users SET usdt_balance = usdt_balance - ? WHERE id = ?").run(cost, targetUserId);

        const txHash = `TX-REC-${Math.floor(100000 + Math.random() * 900000)}`;
        db.prepare(`
          INSERT INTO transactions (user_id, tx_hash, type, amount, currency, status, description)
          VALUES (?, ?, 'withdrawal', ?, 'USDT', 'completed', 'Retroactive Task Sync (Streak Healed)')
        `).run(targetUserId, txHash, cost);

        db.prepare(`
          INSERT INTO daily_tasks (user_id, task_date, task_type, streak_count, completed, completed_at)
          VALUES (?, ?, 'catchup_sync', 5, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id, task_date) DO UPDATE SET streak_count = streak_count + 1, completed = 1, completed_at = CURRENT_TIMESTAMP
        `).run(targetUserId, todayStr);
      });

      runTx();

      return NextResponse.json({
        success: true,
        message: "Retroactive Sync successful! Streak healed and yield multiplier restored.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Catchup sync error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
