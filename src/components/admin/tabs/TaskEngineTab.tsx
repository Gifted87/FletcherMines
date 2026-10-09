"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sliders,
} from "lucide-react";

interface TaskQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

export default function TaskEngineTab() {
  const [questions, setQuestions] = useState<TaskQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Settings state
  const [taskMode, setTaskMode] = useState("ping");
  const [mult1, setMult1] = useState(1.0);
  const [mult2, setMult2] = useState(1.1);
  const [mult3, setMult3] = useState(1.2);
  const [penalty, setPenalty] = useState("reset_zero");
  const [catchupCost, setCatchupCost] = useState(5.0);

  // New question form state
  const [showAddQ, setShowAddQ] = useState(false);
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOpt, setCorrectOpt] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [addingQ, setAddingQ] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/tasks");
        const json = await res.json();
        if (active && res.ok) {
          if (json.questions) setQuestions(json.questions);
          const s = json.settings;
          if (s) {
            setTaskMode(String(s.task_mode || "ping"));
            setMult1(Number(s.streak_mult_1_3 || 1.0));
            setMult2(Number(s.streak_mult_4_7 || 1.1));
            setMult3(Number(s.streak_mult_8_plus || 1.2));
            setPenalty(String(s.streak_penalty || "reset_zero"));
            setCatchupCost(Number(s.catchup_cost || 5.0));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [refreshIndex]);

  const handleRefresh = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskMode,
          streakMult1_3: mult1,
          streakMult4_7: mult2,
          streakMult8Plus: mult3,
          streakPenalty: penalty,
          catchupCost,
        }),
      });
      if (res.ok) {
        setFeedback("Streak multipliers & gamification rules updated in SQLite!");
        handleRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQ(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctOption: correctOpt,
          explanation,
        }),
      });
      if (res.ok) {
        setFeedback("New daily challenge question added to database.");
        setShowAddQ(false);
        setQText("");
        setOptA("");
        setOptB("");
        setOptC("");
        setOptD("");
        handleRefresh();
      }
    } finally {
      setAddingQ(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Flame size={13} /> GAMIFICATION &amp; STREAK ECONOMICS
          </div>
          <h2>Task Engine &amp; Retention Mechanics</h2>
          <p className="dash-subtab-desc">
            Configure the daily operator engagement challenge, tune multiplier curves, and establish streak penalty and catch-up recovery parameters.
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={handleRefresh}>
          <RefreshCw size={14} />
        </button>
      </div>

      {feedback && (
        <div className="dash-alert dash-alert--emerald text-xs">
          {feedback}
        </div>
      )}

      {/* Grid: Settings on Left, Questions & Analytics on Right */}
      <div className="admin-split-2">
        {/* Left: Economy & Multipliers */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={16} className="text-gold" />
              <h3>Streak Multiplier Curves</h3>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="dash-field-group">
              <label className="dash-lbl">Active Gameplay Challenge Mode</label>
              <select
                className="dash-input"
                value={taskMode}
                onChange={(e) => setTaskMode(e.target.value)}
              >
                <option value="ping">Mode 1: One-Click Hashrate Node Ping</option>
                <option value="quiz">Mode 2: Mining &amp; Hardware Multiple-Choice Quiz</option>
              </select>
              <span className="text-muted text-xs">
                In Mode 2, users must answer the question of the day correctly to claim their daily streak ping.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Days 1–3</label>
                <input
                  type="number"
                  step="0.05"
                  className="dash-input font-mono"
                  value={mult1}
                  onChange={(e) => setMult1(parseFloat(e.target.value))}
                />
              </div>
              <div className="dash-field-group">
                <label className="dash-lbl">Days 4–7</label>
                <input
                  type="number"
                  step="0.05"
                  className="dash-input font-mono text-gold"
                  value={mult2}
                  onChange={(e) => setMult2(parseFloat(e.target.value))}
                />
              </div>
              <div className="dash-field-group">
                <label className="dash-lbl">Days 8+</label>
                <input
                  type="number"
                  step="0.05"
                  className="dash-input font-mono text-emerald"
                  value={mult3}
                  onChange={(e) => setMult3(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Streak Break Penalty</label>
                <select
                  className="dash-input"
                  value={penalty}
                  onChange={(e) => setPenalty(e.target.value)}
                >
                  <option value="reset_zero">Reset streak to Day 0</option>
                  <option value="drop_50">Drop multiplier by 50%</option>
                  <option value="grace_1">1 Grace Day allowed</option>
                </select>
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Catch-up Sync Cost</label>
                <input
                  type="number"
                  step="0.5"
                  className="dash-input font-mono"
                  value={catchupCost}
                  onChange={(e) => setCatchupCost(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--secondary btn--sm"
              disabled={saving}
              style={{ marginTop: "8px" }}
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>Save Multiplier Curve</span>
            </button>
          </form>
        </div>

        {/* Right: Question Library */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <HelpCircle size={16} className="text-gold" />
              <h3>Daily Challenge Questions Pool</h3>
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setShowAddQ(!showAddQ)}
            >
              <Plus size={14} />
              <span>Add Question</span>
            </button>
          </div>

          {showAddQ && (
            <form
              onSubmit={handleAddQuestion}
              style={{
                background: "rgba(255,255,255,0.03)",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div className="dash-field-group">
                <label className="dash-lbl">Question Prompt</label>
                <input
                  type="text"
                  className="dash-input"
                  placeholder="e.g. What is the hash rate of Antminer S21 Pro?"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input
                  type="text"
                  className="dash-input text-xs"
                  placeholder="Option A"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="dash-input text-xs"
                  placeholder="Option B"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="dash-input text-xs"
                  placeholder="Option C"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="dash-input text-xs"
                  placeholder="Option D"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px" }}>
                <div className="dash-field-group">
                  <label className="dash-lbl">Correct Option</label>
                  <select
                    className="dash-input font-mono"
                    value={correctOpt}
                    onChange={(e) => setCorrectOpt(e.target.value)}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="dash-field-group">
                  <label className="dash-lbl">Explanation / Technical Rationale</label>
                  <input
                    type="text"
                    className="dash-input text-xs"
                    placeholder="Immersion cooling sustains 234 TH/s without throttling..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setShowAddQ(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={addingQ}>
                  {addingQ ? <Loader2 className="animate-spin" size={14} /> : "Save to Database"}
                </button>
              </div>
            </form>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <strong className="text-white text-xs" style={{ lineHeight: 1.4 }}>
                    {q.question_text}
                  </strong>
                  <span className="badge badge--cyan font-mono" style={{ fontSize: "10px" }}>
                    Answer: {q.correct_option}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", margin: "8px 0", fontSize: "11px" }} className="text-muted">
                  <div>A: {q.option_a}</div>
                  <div>B: {q.option_b}</div>
                  <div>C: {q.option_c}</div>
                  <div>D: {q.option_d}</div>
                </div>
                {q.explanation && (
                  <p className="text-muted text-xs font-mono" style={{ margin: 0, fontSize: "10.5px" }}>
                    Rationale: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
