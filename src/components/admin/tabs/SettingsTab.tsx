"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Sliders,
  Trash2,
  X,
} from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

export default function SettingsTab() {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // System toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [pauseWithdrawals, setPauseWithdrawals] = useState(false);
  const [pauseDeposits, setPauseDeposits] = useState(false);
  const [referralActive, setReferralActive] = useState(true);

  // Financial parameters
  const [minDeposit, setMinDeposit] = useState(10.0);
  const [minWithdrawal, setMinWithdrawal] = useState(20.0);
  const [withdrawalFeePct, setWithdrawalFeePct] = useState(1.0);

  // CMS
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");

  // FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("general");
  const [faqLoading, setFaqLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (active && res.ok) {
          const s = json.settings;
          if (s) {
            setMaintenanceMode(Boolean(s.maintenance_mode));
            setPauseWithdrawals(Boolean(s.pause_withdrawals));
            setPauseDeposits(Boolean(s.pause_deposits));
            setReferralActive(Boolean(s.referral_active ?? 1));
            setMinDeposit(Number(s.min_deposit || 10.0));
            setMinWithdrawal(Number(s.min_withdrawal || 20.0));
            setWithdrawalFeePct(Number(s.withdrawal_fee_pct || 1.0));
            setHeadline(String(s.homepage_headline || ""));
            setSubheadline(String(s.homepage_subheadline || ""));
          }
          if (json.faqs) {
            setFaqs(json.faqs);
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

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenance_mode: maintenanceMode ? 1 : 0,
          pause_withdrawals: pauseWithdrawals ? 1 : 0,
          pause_deposits: pauseDeposits ? 1 : 0,
          referral_active: referralActive ? 1 : 0,
          min_deposit: minDeposit,
          min_withdrawal: minWithdrawal,
          withdrawal_fee_pct: withdrawalFeePct,
          homepage_headline: headline,
          homepage_subheadline: subheadline,
        }),
      });
      if (res.ok) {
        setFeedback("Global parameters and CMS text saved directly to SQLite.");
        handleRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    setFaqLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_faq",
          question: faqQuestion,
          answer: faqAnswer,
          category: faqCategory,
          sortOrder: faqs.length,
        }),
      });
      if (res.ok) {
        setFeedback("New FAQ entry saved to platform knowledge base.");
        setFaqQuestion("");
        setFaqAnswer("");
        setShowAddFaq(false);
        handleRefresh();
      }
    } finally {
      setFaqLoading(false);
    }
  };

  const handleDeleteFaq = async (faqId: number) => {
    if (!confirm("Are you sure you want to delete this FAQ entry?")) return;
    setFaqLoading(true);
    try {
      const res = await fetch(`/api/admin/settings?faqId=${faqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback("FAQ entry removed.");
        handleRefresh();
      }
    } finally {
      setFaqLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Sliders size={13} /> PLATFORM GOVERNANCE
          </div>
          <h2>Content CMS &amp; Global System Settings</h2>
          <p className="dash-subtab-desc">
            Emergency kill-switches, withdrawal/deposit circuit breakers, financial minimum limits, and public homepage copy configuration.
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

      <form onSubmit={handleSaveAll} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ROW 1: GLOBAL CIRCUIT BREAKERS / SWITCHES */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={16} className="text-danger" />
              <h3>Global System Toggles &amp; Emergency Switches</h3>
            </div>
          </div>

          <div className="admin-grid-4">
            {/* Maintenance Mode */}
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: maintenanceMode ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.08)",
                background: maintenanceMode ? "rgba(239, 68, 68, 0.06)" : "rgba(255, 255, 255, 0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <strong className="text-white text-sm block">Maintenance Mode</strong>
                <p className="text-muted text-xs mt-1">Pauses all non-admin routes and displays maintenance shield.</p>
              </div>
              <button
                type="button"
                className={`btn btn--sm ${maintenanceMode ? "btn--danger" : "btn--secondary"}`}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                {maintenanceMode ? "ACTIVE (Site Locked)" : "Normal Operations"}
              </button>
            </div>

            {/* Pause Withdrawals */}
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: pauseWithdrawals ? "rgba(245, 158, 11, 0.4)" : "rgba(255, 255, 255, 0.08)",
                background: pauseWithdrawals ? "rgba(245, 158, 11, 0.06)" : "rgba(255, 255, 255, 0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <strong className="text-white text-sm block">Pause Withdrawals</strong>
                <p className="text-muted text-xs mt-1">Freezes outbound user cashout requests during treasury audits.</p>
              </div>
              <button
                type="button"
                className={`btn btn--sm ${pauseWithdrawals ? "btn--danger" : "btn--secondary"}`}
                onClick={() => setPauseWithdrawals(!pauseWithdrawals)}
              >
                {pauseWithdrawals ? "Withdrawals Locked" : "Withdrawals Enabled"}
              </button>
            </div>

            {/* Pause Deposits */}
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: pauseDeposits ? "rgba(245, 158, 11, 0.4)" : "rgba(255, 255, 255, 0.08)",
                background: pauseDeposits ? "rgba(245, 158, 11, 0.06)" : "rgba(255, 255, 255, 0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <strong className="text-white text-sm block">Pause Deposits</strong>
                <p className="text-muted text-xs mt-1">Disables submission of new manual TRC-20 deposit tickets.</p>
              </div>
              <button
                type="button"
                className={`btn btn--sm ${pauseDeposits ? "btn--danger" : "btn--secondary"}`}
                onClick={() => setPauseDeposits(!pauseDeposits)}
              >
                {pauseDeposits ? "Deposits Paused" : "Deposits Active"}
              </button>
            </div>

            {/* Referral Program */}
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: referralActive ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.08)",
                background: referralActive ? "rgba(16, 185, 129, 0.06)" : "rgba(255, 255, 255, 0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <strong className="text-white text-sm block">Referral Program</strong>
                <p className="text-muted text-xs mt-1">Controls issuance of 50 USDT signup and referral vouchers.</p>
              </div>
              <button
                type="button"
                className={`btn btn--sm ${referralActive ? "btn--secondary" : "btn--ghost"}`}
                onClick={() => setReferralActive(!referralActive)}
              >
                {referralActive ? "Affiliates Active" : "Affiliates Paused"}
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: FINANCIAL PARAMETERS & CMS */}
        <div className="admin-split-2">
          {/* Financial Parameters */}
          <div className="dash-card">
            <h3 className="text-sm font-bold text-white mb-3">Treasury Financial Limits</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Minimum Manual Deposit (USDT)</label>
                <input
                  type="number"
                  step="1"
                  className="dash-input font-mono"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(parseFloat(e.target.value))}
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Minimum Withdrawal Amount (USDT)</label>
                <input
                  type="number"
                  step="1"
                  className="dash-input font-mono"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(parseFloat(e.target.value))}
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Withdrawal Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="dash-input font-mono"
                  value={withdrawalFeePct}
                  onChange={(e) => setWithdrawalFeePct(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* CMS: Homepage Copy Editor */}
          <div className="dash-card">
            <h3 className="text-sm font-bold text-white mb-3">CMS Homepage Text Editor</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Main Hero Headline</label>
                <input
                  type="text"
                  className="dash-input font-bold"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Institutional Hash-Rate. Guaranteed Fixed Daily Yield."
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Hero Sub-Headline / Proposition</label>
                <textarea
                  className="dash-input"
                  rows={3}
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Access enterprise ASIC mining power through tokenized mining blocks with automated daily settlements."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn--secondary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save All System Parameters</span>
          </button>
        </div>
      </form>

      {/* ROW 3: FAQ KNOWLEDGE BASE CMS */}
      <div className="dash-card">
        <div className="dash-card__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HelpCircle size={16} className="text-cyan" />
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>FAQ &amp; Platform Knowledge Base</h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>Configure entries displayed across institutional customer help centers.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setShowAddFaq(true)}
          >
            <Plus size={14} />
            <span>Add FAQ Entry</span>
          </button>
        </div>

        {/* Add FAQ form if open */}
        {showAddFaq && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #3f3f46", borderRadius: "8px", padding: "16px", marginTop: "14px" }}>
            <form onSubmit={handleAddFaq} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>Draft New FAQ Entry</h4>
                <button type="button" onClick={() => setShowAddFaq(false)} className="btn btn--ghost btn--sm">
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div className="dash-field-group">
                  <label className="dash-lbl">Question</label>
                  <input
                    type="text"
                    className="dash-input"
                    placeholder="e.g. How are daily hash payouts calculated and credited?"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    required
                  />
                </div>
                <div className="dash-field-group">
                  <label className="dash-lbl">Category</label>
                  <select
                    className="dash-input"
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="yields">Yields &amp; Mining</option>
                    <option value="wallet">Deposits &amp; Withdrawals</option>
                    <option value="security">Security &amp; KYC</option>
                  </select>
                </div>
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Answer / Markdown Explanation</label>
                <textarea
                  className="dash-input"
                  rows={3}
                  placeholder="Detailed explanation displayed in accordion..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setShowAddFaq(false)} className="btn btn--ghost btn--sm" disabled={faqLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--secondary btn--sm" disabled={faqLoading}>
                  {faqLoading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  <span>Save FAQ to Database</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="admin-table-wrap" style={{ marginTop: "14px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Question</th>
                <th style={{ width: "45%" }}>Answer</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted">
                    No FAQs currently stored in system database.
                  </td>
                </tr>
              ) : (
                faqs.map((f) => (
                  <tr key={f.id}>
                    <td className="font-semibold text-white">{f.question}</td>
                    <td className="text-muted text-xs" style={{ maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.answer}
                    </td>
                    <td>
                      <span className="dash-badge dash-badge--cyan uppercase font-mono" style={{ fontSize: "10px" }}>
                        {f.category}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        style={{ padding: "4px 8px" }}
                        onClick={() => handleDeleteFaq(f.id)}
                        disabled={faqLoading}
                        title="Delete FAQ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
