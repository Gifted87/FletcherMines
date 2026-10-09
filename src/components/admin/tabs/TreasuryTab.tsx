"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Landmark,
  Loader2,
  RefreshCw,
  Sliders,
  X,
} from "lucide-react";
import { AdminDepositRecord } from "@/lib/adminData";

interface TreasuryTabProps {
  onOpenAdjust: () => void;
  onSelectUser?: (userId: number) => void;
}

export default function TreasuryTab({ onOpenAdjust, onSelectUser }: TreasuryTabProps) {
  const [subTab, setSubTab] = useState<"pending" | "history">("pending");
  const [pending, setPending] = useState<AdminDepositRecord[]>([]);
  const [history, setHistory] = useState<AdminDepositRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/treasury/deposits");
        const json = await res.json();
        if (active && res.ok) {
          setPending(json.pending || []);
          setHistory(json.history || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleApprove = async (txId: number) => {
    setActionLoading(txId);
    try {
      const res = await fetch("/api/admin/treasury/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", txId }),
      });
      await res.json();
      if (res.ok) {
        setFeedback("Deposit approved and credited directly into user balance!");
        handleRefresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (txId: number) => {
    const reason = prompt("Enter rejection reason (e.g. Invalid TxHash, Wrong Network, Unconfirmed):");
    if (!reason) return;

    setActionLoading(txId);
    try {
      const res = await fetch("/api/admin/treasury/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", txId, reason }),
      });
      if (res.ok) {
        setFeedback("Deposit rejected.");
        handleRefresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestInfo = async (txId: number) => {
    const promptMsg = prompt("Enter prompt to operator (e.g. Please upload uncropped screenshot showing recipient address and TXID):");
    if (!promptMsg) return;

    setActionLoading(txId);
    try {
      const res = await fetch("/api/admin/treasury/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_info", txId, prompt: promptMsg }),
      });
      if (res.ok) {
        setFeedback("Requested additional verification proof from operator.");
        handleRefresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/treasury/deposits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txIds: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`Bulk approved ${data.count} deposits.`);
        setSelectedIds([]);
        handleRefresh();
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pending.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pending.map((p) => p.id));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Landmark size={13} /> TREASURY DESK
          </div>
          <h2>Treasury Deposit Queue &amp; Reconciliation</h2>
          <p className="dash-subtab-desc">
            Verify blockchain deposit submissions against cold-storage vault logs. Approvals immediately credit the user&apos;s available USDT balance in SQLite.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--ghost" onClick={onOpenAdjust}>
            <Sliders size={14} />
            <span>Adjust Balance</span>
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleRefresh}>
            <RefreshCw size={14} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="dash-alert dash-alert--emerald text-xs" style={{ margin: "0" }}>
          {feedback}
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="dash-pill-switcher">
          <button
            type="button"
            className={subTab === "pending" ? "is-active" : ""}
            onClick={() => setSubTab("pending")}
          >
            Pending Verification ({pending.length})
          </button>
          <button
            type="button"
            className={subTab === "history" ? "is-active" : ""}
            onClick={() => setSubTab("history")}
          >
            Verification Ledger ({history.length})
          </button>
        </div>

        {subTab === "pending" && selectedIds.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="text-muted text-xs font-mono">{selectedIds.length} selected</span>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleBulkApprove}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              <span>Approve Selected ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Table view */}
      {subTab === "pending" ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}>
                  <input
                    type="checkbox"
                    checked={pending.length > 0 && selectedIds.length === pending.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Request ID</th>
                <th>User Account</th>
                <th>Requested Amount</th>
                <th>Network</th>
                <th>Blockchain TX Hash</th>
                <th>Receipt Proof</th>
                <th>Submitted</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted">
                    Loading pending treasury submissions...
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-muted">
                    <CheckCircle size={28} className="text-emerald mx-auto mb-2" />
                    <div>All pending manual deposits have been verified. Zero backlog!</div>
                  </td>
                </tr>
              ) : (
                pending.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(req.id)}
                        onChange={() => toggleSelect(req.id)}
                      />
                    </td>
                    <td className="font-mono text-xs text-white">#{req.id}</td>
                    <td>
                      <button
                        type="button"
                        className="text-left font-bold text-white hover:text-emerald"
                        onClick={() => onSelectUser?.(req.userId)}
                      >
                        {req.username}
                        <div className="text-muted text-xs font-mono font-normal">{req.email}</div>
                      </button>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-emerald text-sm">
                        +${req.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                      </span>
                    </td>
                    <td>
                      <span className="badge badge--cyan font-mono text-xs">{req.network}</span>
                    </td>
                    <td>
                      <a
                        href={`https://tronscan.org/#/transaction/${req.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-gold inline-flex items-center gap-1 hover:underline"
                        title="Inspect on blockchain explorer"
                      >
                        {req.txHash} <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                        onClick={() =>
                          setPreviewImage(
                            req.receiptImage ||
                              "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80"
                          )
                        }
                      >
                        <ImageIcon size={12} />
                        <span>View Receipt</span>
                      </button>
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn--sm"
                          style={{
                            fontSize: "11px",
                            padding: "5px 10px",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                          }}
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          {actionLoading === req.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Check size={12} />
                          )}
                          <span>Approve &amp; Credit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          style={{
                            fontSize: "11px",
                            padding: "5px 9px",
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#fbbf24",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                          onClick={() => handleRequestInfo(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          <HelpCircle size={12} />
                          <span>Request Info</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm text-danger"
                          style={{ fontSize: "11px", padding: "5px 8px" }}
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          <X size={12} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* History Ledger */
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Operator</th>
                <th>Amount</th>
                <th>Network</th>
                <th>TX Hash</th>
                <th>Status</th>
                <th>Audit Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs">#{tx.id}</td>
                  <td>
                    <strong className="text-white">{tx.username}</strong>
                    <div className="text-muted text-xs font-mono">{tx.email}</div>
                  </td>
                  <td className="font-mono font-bold text-emerald">
                    ${tx.amount.toFixed(2)} USDT
                  </td>
                  <td>
                    <span className="badge badge--cyan text-xs">{tx.network}</span>
                  </td>
                  <td className="font-mono text-xs text-muted">{tx.txHash}</td>
                  <td>
                    <span
                      className={`dash-badge ${
                        tx.status === "completed"
                          ? "dash-badge--emerald"
                          : "dash-badge--amber"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="text-xs text-muted">{tx.adminNote || "—"}</td>
                  <td className="font-mono text-xs text-muted">{tx.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Proof Lightbox */}
      {previewImage && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="admin-modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__head">
              <h3>Deposit Proof of Transfer</h3>
              <button type="button" onClick={() => setPreviewImage(null)} className="btn btn--ghost btn--sm">
                <X size={16} />
              </button>
            </div>
            <div className="admin-modal__body text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Deposit Receipt"
                style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
