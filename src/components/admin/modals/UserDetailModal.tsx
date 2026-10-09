"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Coins,
  ExternalLink,
  Flame,
  Lock,
  MessageSquare,
  Send,
  Shield,
  ShieldCheck,
  Unlock,
  User,
  Users,
  X,
} from "lucide-react";

interface UserDetailModalProps {
  userId: number;
  onClose: () => void;
  onRefresh: () => void;
}

interface UserDeepDiveData {
  user: {
    id: number;
    email: string;
    username: string;
    referral_code: string;
    referred_by: string | null;
    usdt_balance: number;
    locked_balance: number;
    referral_count: number;
    email_verified: number;
    two_factor_enabled: number;
    kyc_status: string;
    account_status: string;
    created_at: string;
  };
  blocks: Array<{
    id: number;
    batch_name: string;
    block_count: number;
    total_invested: number;
    maturity_days: number;
    daily_rate_pct: number;
    maturity_date: string;
    status: string;
  }>;
  transactions: Array<{
    id: number;
    type: string;
    tx_hash: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
  tasks: Array<{
    id: number;
    task_date: string;
    task_type: string;
    streak_count: number;
    completed: number;
    completed_at: string | null;
  }>;
  referrals: Array<{
    id: number;
    username: string;
    email: string;
    created_at: string;
  }>;
}

export default function UserDetailModal({ userId, onClose, onRefresh }: UserDetailModalProps) {
  const [profileTab, setProfileTab] = useState<"overview" | "wallet" | "portfolio" | "tasks" | "referrals">("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDeepDiveData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [adminNotice, setAdminNotice] = useState("");

  const handleInitiateKyc = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "initiate_kyc" }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMsg(`KYC verification initiated for User #${userId}. Status flagged as pending.`);
        setData((prev) =>
          prev ? { ...prev, user: { ...prev.user, kyc_status: "pending" } } : null
        );
        onRefresh();
      } else {
        setActionMsg(json.error || "Failed to initiate KYC review.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNotice.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "send_message", message: adminNotice }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMsg(`Official dispatch delivered to User #${userId}. Logged to system audit trail.`);
        setAdminNotice("");
        setShowMsgInput(false);
      } else {
        setActionMsg(json.error || "Failed to deliver message.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  const handleToggleFreeze = async () => {
    if (!data?.user) return;
    const isFrozen = data.user.account_status === "frozen";
    const action = isFrozen ? "unfreeze" : "freeze";
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      await res.json();
      if (res.ok) {
        setActionMsg(`Account ${action}d successfully.`);
        setData((prev) =>
          prev
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  account_status: isFrozen ? "active" : "frozen",
                },
              }
            : null
        );
        onRefresh();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTask = async (taskAction: "complete" | "reset") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reset_task", taskAction }),
      });
      if (res.ok) {
        setActionMsg(`Daily task ${taskAction === "complete" ? "marked complete" : "reset"} for user.`);
        onRefresh();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceUnlock = async (blockId: number) => {
    const reason = prompt("Enter administrative reason to force unlock this maturity contract early:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "force_unlock", blockId, reason }),
      });
      if (res.ok) {
        setActionMsg("Mining block maturity unlocked early and capital returned to liquid balance.");
        onRefresh();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-modal-backdrop" onClick={onClose}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="admin-modal__body text-center p-8">Loading operator profile from SQLite...</div>
        </div>
      </div>
    );
  }

  const u = data?.user;
  const isFrozen = u?.account_status === "frozen";

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal__head">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="admin-profile-avatar" style={{ width: "38px", height: "38px" }}>
              <User size={20} />
            </div>
            <div>
              <h3>
                {u?.username}{" "}
                <span className="font-mono text-xs text-muted">ID: #{u?.id}</span>
              </h3>
              <p className="text-muted text-xs font-mono">{u?.email}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className={`btn btn--sm ${isFrozen ? "btn--secondary" : "btn--danger"}`}
              onClick={handleToggleFreeze}
              disabled={actionLoading}
            >
              {isFrozen ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{isFrozen ? "Unfreeze Account" : "Freeze Account"}</span>
            </button>
            <button type="button" onClick={onClose} className="btn btn--ghost btn--sm">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            padding: "0 16px",
            background: "var(--surface-2)",
            gap: "4px",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {[
            { id: "overview", label: "Overview", icon: Shield },
            { id: "wallet", label: "Wallet & Ledger", icon: Coins },
            { id: "portfolio", label: "Portfolio Blocks", icon: Box },
            { id: "tasks", label: "Daily Tasks", icon: Flame },
            { id: "referrals", label: "Referrals", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = profileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                style={{
                  borderRadius: "0",
                  borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                  width: "auto",
                  padding: "10px 14px",
                }}
                onClick={() => setProfileTab(tab.id as "overview" | "wallet" | "portfolio" | "tasks" | "referrals")}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {actionMsg && (
          <div className="dash-alert dash-alert--emerald text-xs m-4" style={{ margin: "14px 20px 0" }}>
            {actionMsg}
          </div>
        )}

        {/* Body content */}
        <div className="admin-modal__body">
          {profileTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="admin-grid-4">
                <div className="admin-card" style={{ padding: "14px" }}>
                  <span className="text-muted text-xs">Liquid Balance</span>
                  <div className="admin-card__val font-mono" style={{ fontSize: "20px" }}>
                    ${u?.usdt_balance?.toFixed(2)}
                  </div>
                </div>
                <div className="admin-card" style={{ padding: "14px" }}>
                  <span className="text-muted text-xs">Locked Hardware</span>
                  <div className="admin-card__val font-mono text-emerald" style={{ fontSize: "20px" }}>
                    ${u?.locked_balance?.toFixed(2)}
                  </div>
                </div>
                <div className="admin-card" style={{ padding: "14px" }}>
                  <span className="text-muted text-xs">Referral Code</span>
                  <div className="admin-card__val font-mono text-gold" style={{ fontSize: "16px" }}>
                    {u?.referral_code}
                  </div>
                </div>
                <div className="admin-card" style={{ padding: "14px" }}>
                  <span className="text-muted text-xs">Account Status</span>
                  <div className="admin-card__val font-mono capitalize" style={{ fontSize: "16px", color: isFrozen ? "#f87171" : "#34d399" }}>
                    {u?.account_status}
                  </div>
                </div>
              </div>

              <div className="dash-card">
                <h4 className="text-sm font-bold text-white mb-3">Security &amp; Verification Attributes</h4>
                <div className="admin-grid-2" style={{ gap: "12px", fontSize: "12.5px" }}>
                  <div>Email Status: <strong className="text-emerald">Verified (Level 1)</strong></div>
                  <div>KYC Status: <strong className="text-emerald font-mono uppercase">{u?.kyc_status}</strong></div>
                  <div>Two-Factor Auth: <strong className="text-emerald">{u?.two_factor_enabled ? "Enabled (TOTP)" : "Disabled"}</strong></div>
                  <div>Registered On: <strong className="font-mono">{u?.created_at}</strong></div>
                  <div>Referred By: <strong className="font-mono">{u?.referred_by || "Organic (Direct Signup)"}</strong></div>
                  <div>Invited Friends: <strong className="font-mono">{u?.referral_count} accounts</strong></div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleResetTask("complete")}
                  disabled={actionLoading}
                >
                  <Flame size={14} className="text-gold" />
                  <span>Mark Today&apos;s Task Complete</span>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleResetTask("reset")}
                  disabled={actionLoading}
                >
                  <span>Reset Streak to 0</span>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={handleInitiateKyc}
                  disabled={actionLoading}
                  style={{ border: "1px solid #3f3f46" }}
                >
                  <ShieldCheck size={14} className="text-cyan" />
                  <span>Initiate KYC Verification</span>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setShowMsgInput(true)}
                  disabled={actionLoading}
                  style={{ border: "1px solid #3f3f46" }}
                >
                  <MessageSquare size={14} className="text-gold" />
                  <span>Send Direct Notice</span>
                </button>
                <a
                  href={`/dashboard?user=${userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary btn--sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ExternalLink size={14} />
                  <span>Inspect Dashboard as User</span>
                </a>
              </div>

              {showMsgInput && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #3f3f46", borderRadius: "8px", padding: "14px", marginTop: "4px" }}>
                  <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="dash-lbl" style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
                        Dispatch Official Notice to {u?.username}
                      </label>
                      <button type="button" onClick={() => setShowMsgInput(false)} className="btn btn--ghost btn--sm" style={{ padding: "2px 6px" }}>
                        <X size={14} />
                      </button>
                    </div>
                    <textarea
                      className="dash-input"
                      rows={3}
                      placeholder="e.g. Please provide additional proof of hash verification for your recent deposit, or contact support."
                      value={adminNotice}
                      onChange={(e) => setAdminNotice(e.target.value)}
                      required
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button type="button" onClick={() => setShowMsgInput(false)} className="btn btn--ghost btn--sm">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn--secondary btn--sm" disabled={actionLoading || !adminNotice.trim()}>
                        <Send size={13} />
                        <span>Dispatch Notice</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {profileTab === "wallet" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>TX Hash</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.transactions?.map((t) => (
                    <tr key={t.id}>
                      <td className="capitalize font-semibold text-white">{t.type.replace("_", " ")}</td>
                      <td className="font-mono text-xs text-muted">{t.tx_hash}</td>
                      <td className="font-mono font-bold text-emerald">
                        ${t.amount?.toFixed(2)} USDT
                      </td>
                      <td>
                        <span className={`dash-badge ${t.status === "completed" ? "dash-badge--emerald" : "dash-badge--amber"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-muted">{t.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {profileTab === "portfolio" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Blocks</th>
                    <th>Invested</th>
                    <th>Daily Rate</th>
                    <th>Maturity Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.blocks?.map((b) => (
                    <tr key={b.id}>
                      <td className="font-bold text-white">{b.batch_name}</td>
                      <td className="font-mono">{b.block_count} Blocks</td>
                      <td className="font-mono text-emerald">${b.total_invested?.toFixed(2)} USDT</td>
                      <td className="font-mono text-gold">{b.daily_rate_pct}% / day</td>
                      <td className="font-mono text-xs">{b.maturity_date}</td>
                      <td>
                        <span className={`dash-badge ${b.status === "active" ? "dash-badge--emerald" : "dash-badge--amber"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === "active" && (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => handleForceUnlock(b.id)}
                            disabled={actionLoading}
                          >
                            Force Unlock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {profileTab === "tasks" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Streak</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.tasks?.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-white">{t.task_date}</td>
                      <td>{t.task_type}</td>
                      <td className="font-mono font-bold text-gold">🔥 {t.streak_count} Days</td>
                      <td>
                        <span className={`dash-badge ${t.completed ? "dash-badge--emerald" : "dash-badge--amber"}`}>
                          {t.completed ? "Completed" : "Missed"}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-muted">{t.completed_at || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {profileTab === "referrals" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invited User</th>
                    <th>Email</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.referrals?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-muted">
                        No direct referrals registered under code {u?.referral_code}.
                      </td>
                    </tr>
                  ) : (
                    data?.referrals?.map((r) => (
                      <tr key={r.id}>
                        <td className="font-bold text-white">{r.username}</td>
                        <td className="font-mono text-xs text-muted">{r.email}</td>
                        <td className="font-mono text-xs">{r.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
