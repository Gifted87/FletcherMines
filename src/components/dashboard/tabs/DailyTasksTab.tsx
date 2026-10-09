"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Flame,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { UserDashboardData } from "@/lib/types/dashboard";

interface DailyTasksTabProps {
  data: UserDashboardData;
  onCompleteTask: () => void;
  taskLoading: boolean;
}

interface QuestionData {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export default function DailyTasksTab({
  data,
  onCompleteTask,
  taskLoading,
}: DailyTasksTabProps) {
  const [taskMode, setTaskMode] = useState<"ping" | "quiz">("ping");
  const [streakDays, setStreakDays] = useState(data.dailyTask.streakDays);
  const [completedToday, setCompletedToday] = useState(data.dailyTask.completedToday);
  const [multiplier, setMultiplier] = useState(1.1);
  const [catchupCost, setCatchupCost] = useState(5.0);
  const [activeQuestion, setActiveQuestion] = useState<QuestionData | null>(null);

  // Quiz submission state
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    correct: boolean;
    message: string;
    explanation?: string;
  } | null>(null);

  // Catchup sync state
  const [catchingUp, setCatchingUp] = useState(false);
  const [catchupMsg, setCatchupMsg] = useState<string | null>(null);

  const fetchTaskConfig = async () => {
    try {
      const res = await fetch(`/api/dashboard/tasks?userId=${data.user.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setTaskMode(json.taskMode || "ping");
        setStreakDays(json.streakDays);
        setCompletedToday(json.completedToday);
        setMultiplier(json.multiplier);
        setCatchupCost(json.catchupCost);
        if (json.activeQuestion) setActiveQuestion(json.activeQuestion);
      }
    } catch (err) {
      console.error("Failed to load task config:", err);
    }
  };

  useEffect(() => {
    fetchTaskConfig();
  }, [data.user.id]);

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !activeQuestion) return;

    setSubmittingQuiz(true);
    setQuizResult(null);

    try {
      const res = await fetch("/api/dashboard/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          questionId: activeQuestion.id,
          selectedOption,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.correct) {
        setQuizResult({
          correct: true,
          message: resData.message,
          explanation: resData.explanation,
        });
        setCompletedToday(true);
        setStreakDays((prev) => prev + 1);
        onCompleteTask();
      } else {
        setQuizResult({
          correct: false,
          message: resData.message || "Incorrect option. Try again!",
          explanation: resData.explanation,
        });
      }
    } catch {
      setQuizResult({
        correct: false,
        message: "Failed to evaluate answer. Try again.",
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleCatchupSync = async () => {
    setCatchingUp(true);
    setCatchupMsg(null);
    try {
      const res = await fetch("/api/dashboard/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "catchup", userId: data.user.id }),
      });
      const resData = await res.json();
      if (res.ok) {
        setCatchupMsg(resData.message || "Streak healed!");
        fetchTaskConfig();
        onCompleteTask();
      } else {
        setCatchupMsg(resData.error || "Failed to heal streak.");
      }
    } catch {
      setCatchupMsg("Failed to execute retroactive sync.");
    } finally {
      setCatchingUp(false);
    }
  };

  return (
    <div className="dash-subtab-view">
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-flame">
            <Flame size={13} /> HABIT TRACKING &amp; PROTOCOL INTEGRITY
          </div>
          <h2>Daily Mining Tasks &amp; Multipliers</h2>
          <p className="dash-subtab-desc">
            Verify daily hashrate connectivity to maintain your operator streak and unlock up to 1.2x boost on 00:00 UTC yield distributions.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="dash-streak-badge font-mono">
            🔥 {streakDays} Day Active Streak ({multiplier}x Multiplier)
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={fetchTaskConfig}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Streak Economics Overview */}
      <div className="dash-wallet-cards" style={{ marginBottom: "20px" }}>
        <div className="dash-wallet-card">
          <div className="dash-wallet-card__label">
            <Flame size={16} className="text-flame" /> Current Streak Level
          </div>
          <div className="dash-wallet-card__val font-mono text-gold">
            {streakDays} Consecutive Days
          </div>
          <p className="dash-wallet-card__hint">
            Active yield multiplier: <strong className="text-emerald">{multiplier}x</strong> applied to all mining blocks.
          </p>
        </div>

        <div className="dash-wallet-card">
          <div className="dash-wallet-card__label">
            <Sparkles size={16} className="text-gold" /> Streak Multiplier Curve
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <span className={`badge ${streakDays < 4 ? "badge--gold" : "badge--cyan"}`}>
              Days 1–3: 1.0x
            </span>
            <span className={`badge ${streakDays >= 4 && streakDays < 8 ? "badge--gold" : "badge--cyan"}`}>
              Days 4–7: 1.1x
            </span>
            <span className={`badge ${streakDays >= 8 ? "badge--gold" : "badge--cyan"}`}>
              Days 8+: 1.2x
            </span>
          </div>
          <p className="dash-wallet-card__hint" style={{ marginTop: "8px" }}>
            Reach Day 8+ to unlock maximum 20% compound acceleration on daily yields.
          </p>
        </div>

        <div className="dash-wallet-card">
          <div className="dash-wallet-card__label">
            <ShieldCheck size={16} className="text-emerald" /> Streak Recovery Tool
          </div>
          <div className="text-xs text-muted" style={{ marginTop: "6px" }}>
            Missed a day? Execute a Retroactive Sync for <strong className="text-white font-mono">{catchupCost} USDT</strong>.
          </div>
          <div style={{ marginTop: "12px" }}>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleCatchupSync}
              disabled={catchingUp || data.metrics.availableBalance < catchupCost}
            >
              {catchingUp ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>Retroactive Sync ({catchupCost} USDT)</span>
            </button>
          </div>
        </div>
      </div>

      {catchupMsg && (
        <div className="dash-alert dash-alert--emerald text-xs" style={{ marginBottom: "16px" }}>
          {catchupMsg}
        </div>
      )}

      {/* Main Task Card */}
      {taskMode === "quiz" ? (
        /* MODE 2: MULTIPLE CHOICE CHALLENGE */
        <div className="dash-card">
          <div className="dash-card__head">
            <div className="dash-card__title-wrap">
              <HelpCircle size={18} className="text-gold" />
              <h3>Hardware Question of the Day</h3>
            </div>
            <span className={`dash-chip ${completedToday ? "is-good" : "is-pending"}`}>
              {completedToday ? "Challenge Solved" : "Action Pending"}
            </span>
          </div>

          <div className="dash-task-details-body">
            {activeQuestion ? (
              <form onSubmit={handleQuizSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "15px", color: "var(--text)", fontWeight: 600, lineHeight: 1.5 }}>
                  {activeQuestion.question_text}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { key: "A", text: activeQuestion.option_a },
                    { key: "B", text: activeQuestion.option_b },
                    { key: "C", text: activeQuestion.option_c },
                    { key: "D", text: activeQuestion.option_d },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        background: selectedOption === opt.key ? "rgba(212, 169, 78, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        border: selectedOption === opt.key ? "1px solid var(--gold)" : "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: completedToday ? "default" : "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="quiz_opt"
                        value={opt.key}
                        checked={selectedOption === opt.key}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        disabled={completedToday || submittingQuiz}
                      />
                      <span className="font-mono text-xs text-gold font-bold">[{opt.key}]</span>
                      <span style={{ fontSize: "13.5px", color: "var(--text)" }}>{opt.text}</span>
                    </label>
                  ))}
                </div>

                {quizResult && (
                  <div className={`dash-alert ${quizResult.correct ? "dash-alert--emerald" : "dash-alert--amber"} text-xs`}>
                    <strong>{quizResult.message}</strong>
                    {quizResult.explanation && (
                      <p style={{ marginTop: "4px", opacity: 0.9 }}>{quizResult.explanation}</p>
                    )}
                  </div>
                )}

                {!completedToday ? (
                  <button
                    type="submit"
                    className="btn btn--primary btn--lg"
                    disabled={!selectedOption || submittingQuiz}
                  >
                    {submittingQuiz ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Verifying Challenge...
                      </>
                    ) : (
                      "Submit Verified Answer"
                    )}
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontSize: "14px", fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    <span>Today&apos;s mining challenge solved! 00:00 UTC yield calculation unlocked.</span>
                  </div>
                )}
              </form>
            ) : (
              <p className="text-muted">Loading question from platform knowledge bank...</p>
            )}
          </div>
        </div>
      ) : (
        /* MODE 1: ONE-CLICK HASHRATE PING */
        <div className="dash-card">
          <div className="dash-card__head">
            <div className="dash-card__title-wrap">
              <Zap size={18} className="text-emerald" />
              <h3>Operator Task: Hashrate Node Audit</h3>
            </div>
            <span className={`dash-chip ${completedToday ? "is-good" : "is-pending"}`}>
              {completedToday ? "Completed" : "Pending Today"}
            </span>
          </div>

          <div className="dash-task-details-body">
            <p>
              Each deployed mining block requires continuous active confirmation from the hardware cluster. By completing your daily audit ping, you confirm hardware allocation and maintain uninterrupted yield crediting.
            </p>

            <div className="dash-task-checklist-box">
              <div className="dash-check-line is-done">
                <CheckCircle2 size={16} />
                <span>Facility Hall B Connection Established</span>
              </div>
              <div className="dash-check-line is-done">
                <CheckCircle2 size={16} />
                <span>Antminer S21 Pro Hardware Verified</span>
              </div>
              <div className={`dash-check-line ${completedToday ? "is-done" : ""}`}>
                <CheckCircle2 size={16} />
                <span>Daily Operator Telemetry Ping ({completedToday ? "Verified" : "Pending"})</span>
              </div>
            </div>

            <button
              type="button"
              className={`btn btn--lg ${completedToday ? "btn--ghost" : "btn--primary"}`}
              onClick={onCompleteTask}
              disabled={taskLoading || completedToday}
            >
              {taskLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Executing Node Ping…
                </>
              ) : completedToday ? (
                <>
                  <CheckCircle2 size={16} /> Task Completed for Today
                </>
              ) : (
                <>
                  <Zap size={16} /> Execute Node Verification Ping
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
