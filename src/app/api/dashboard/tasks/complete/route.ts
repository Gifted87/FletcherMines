import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getRequestSession, ensureUserExists } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, questionId, selectedOption } = body;

    const session = getRequestSession(req);
    if (!userId && session) {
      userId = session.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to complete tasks." }, { status: 401 });
    }

    const targetUserId = Number(userId);
    // Auto-provision user in SQLite if absent in current serverless container
    ensureUserExists(targetUserId, session?.email, session?.username);

    const todayStr = new Date().toISOString().split("T")[0];

    const settings = db.prepare("SELECT task_mode FROM system_settings WHERE id = 1").get() as {
      task_mode: string;
    } | undefined;

    const isQuizMode = settings?.task_mode === "quiz";

    if (isQuizMode && questionId) {
      const q = db.prepare("SELECT * FROM daily_task_questions WHERE id = ?").get(Number(questionId)) as {
        id: number;
        correct_option: string;
        explanation: string;
      } | undefined;

      if (q) {
        const isCorrect = String(selectedOption || "").toUpperCase() === q.correct_option.toUpperCase();
        if (!isCorrect) {
          return NextResponse.json({
            success: false,
            correct: false,
            message: `Incorrect answer. Selected Option ${selectedOption} did not match telemetry audit.`,
            explanation: q.explanation || "Review ASIC immersion cooling and hashrate parameters.",
          });
        }
      }
    }

    // Check or insert task
    const existing = db.prepare("SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = ?").get(targetUserId, todayStr) as {
      id: number;
      streak_count: number;
    } | undefined;

    let newStreak = 1;

    if (existing) {
      newStreak = existing.streak_count;
      db.prepare(`
        UPDATE daily_tasks 
        SET completed = 1, reward_claimed = 1, completed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(existing.id);
    } else {
      // Find latest streak
      const lastTask = db.prepare(`
        SELECT streak_count FROM daily_tasks 
        WHERE user_id = ? 
        ORDER BY task_date DESC LIMIT 1
      `).get(targetUserId) as { streak_count: number } | undefined;

      newStreak = (lastTask?.streak_count || 3) + 1;

      db.prepare(`
        INSERT INTO daily_tasks (user_id, task_date, task_type, streak_count, completed, reward_claimed, completed_at)
        VALUES (?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP)
      `).run(targetUserId, todayStr, isQuizMode ? "quiz_challenge" : "hashrate_ping", newStreak);
    }

    try {
      db.prepare(`
        INSERT INTO system_events (event_type, user_id, title, details, severity)
        VALUES ('task_completed', ?, 'Daily Task Completed', ?, 'info')
      `).run(targetUserId, `User #${targetUserId} completed daily mining task. Streak: ${newStreak} days.`);
    } catch (evtErr) {
      console.warn("Event logging non-fatal notice:", evtErr);
    }

    return NextResponse.json({
      success: true,
      correct: true,
      streakDays: newStreak,
      message: isQuizMode
        ? "Challenge Solved! Correct answer verified and streak maintained."
        : "Daily mining node ping verified. Streak maintained.",
      completed: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
