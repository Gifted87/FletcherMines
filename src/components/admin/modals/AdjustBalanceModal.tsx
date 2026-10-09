"use client";

import { useState } from "react";
import { Loader2, Sliders, X } from "lucide-react";

interface AdjustBalanceModalProps {
  userId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdjustBalanceModal({
  userId: initialUserId,
  onClose,
  onSuccess,
}: AdjustBalanceModalProps) {
  const [userId, setUserId] = useState(initialUserId ? String(initialUserId) : "1");
  const [type, setType] = useState<"credit" | "debit" | "bonus">("credit");
  const [amount, setAmount] = useState("100");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const uId = parseInt(userId);

    if (!uId || !amt || amt <= 0 || !reason.trim()) {
      setError("Please fill all fields with valid amounts and an audit reason.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/treasury/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uId, type, amount: amt, reason }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Adjustment failed");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sliders size={18} className="text-emerald" />
            <h3>Manual Treasury Wallet Adjustment</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn--ghost btn--sm">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p className="text-muted text-xs">
              Execute a verified ledger adjustment directly into the user&apos;s SQLite wallet record. All modifications require an audit justification note.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Target User ID</label>
                <input
                  type="number"
                  className="dash-input font-mono"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 1"
                  required
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Adjustment Action</label>
                <select
                  className="dash-input"
                  value={type}
                  onChange={(e) => setType(e.target.value as "credit" | "debit" | "bonus")}
                >
                  <option value="credit">Credit Balance (+USDT)</option>
                  <option value="debit">Debit Balance (-USDT)</option>
                  <option value="bonus">Inject Bonus Credit (+USDT)</option>
                </select>
              </div>
            </div>

            <div className="dash-field-group">
              <label className="dash-lbl">Amount (USDT)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="dash-input font-mono"
                placeholder="e.g. 500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="dash-field-group">
              <label className="dash-lbl">Mandatory Audit Justification Reason</label>
              <textarea
                className="dash-input"
                rows={3}
                placeholder="e.g. Manual OTC deposit match, system reconciliation, or compensation voucher..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {error && <div className="dash-alert dash-alert--amber text-xs">{error}</div>}
          </div>

          <div className="admin-modal__footer">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn--secondary btn--sm" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Applying to SQLite...
                </>
              ) : (
                "Commit Wallet Adjustment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
