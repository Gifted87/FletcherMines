"use client";

import { useState } from "react";
import { Cpu, Loader2, X, Calendar, Clock, CheckSquare, Square } from "lucide-react";

interface CreateDropModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const MATURITY_TIERS = [
  { days: 14, rate: "10.0%", label: "14 Days" },
  { days: 30, rate: "12.0%", label: "30 Days" },
  { days: 60, rate: "15.0%", label: "60 Days" },
  { days: 90, rate: "18.0%", label: "90 Days" },
  { days: 180, rate: "20.0%", label: "180 Days" },
];

export default function CreateDropModal({ onClose, onSuccess }: CreateDropModalProps) {
  const [batchName, setBatchName] = useState("Batch 06 - High Density ASIC");
  const [hardwareModel, setHardwareModel] = useState("Antminer S21 Pro (234 TH/s)");
  const [totalBlocks, setTotalBlocks] = useState("500");
  const [pricePerBlock, setPricePerBlock] = useState("100.00");
  const [minMaturityDays, setMinMaturityDays] = useState("14");
  const [selectedTiers, setSelectedTiers] = useState<number[]>([14, 30, 60, 90, 180]);
  
  const nowStr = new Date().toISOString().slice(0, 16);
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
  const [opensAt, setOpensAt] = useState(nowStr);
  const [closesAt, setClosesAt] = useState(nextWeekStr);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTier = (days: number) => {
    setSelectedTiers((prev) => {
      if (prev.includes(days)) {
        if (prev.length === 1) return prev; // Keep at least one
        const next = prev.filter((d) => d !== days);
        if (!next.includes(Number(minMaturityDays))) {
          setMinMaturityDays(String(next[0]));
        }
        return next;
      } else {
        return [...prev, days].sort((a, b) => a - b);
      }
    });
  };

  const handleCreate = async (status: "active" | "draft") => {
    if (!batchName.trim() || !hardwareModel.trim()) {
      setError("Please fill all required drop specifications.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName,
          hardwareModel,
          totalBlocks: parseInt(totalBlocks),
          pricePerBlock: parseFloat(pricePerBlock),
          minMaturityDays: parseInt(minMaturityDays),
          opensAt: new Date(opensAt).toISOString(),
          closesAt: new Date(closesAt).toISOString(),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create drop");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Cpu size={18} className="text-cyan" />
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Configure Hardware Mining Drop</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn--ghost btn--sm">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleCreate("active"); }}>
          <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Batch Allocation Name</label>
                <input
                  type="text"
                  className="dash-input"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Batch 06 - Immersion Genesis"
                  required
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Physical ASIC Model</label>
                <input
                  type="text"
                  className="dash-input"
                  value={hardwareModel}
                  onChange={(e) => setHardwareModel(e.target.value)}
                  placeholder="e.g. Antminer S21 Pro (234 TH/s)"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Block Supply (Units)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  className="dash-input font-mono"
                  value={totalBlocks}
                  onChange={(e) => setTotalBlocks(e.target.value)}
                  required
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Price / Block (USDT)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  className="dash-input font-mono"
                  value={pricePerBlock}
                  onChange={(e) => setPricePerBlock(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Allowed Maturity Tiers */}
            <div className="dash-field-group">
              <label className="dash-lbl">Supported Maturity Tiers & Fixed Yield Rates</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "4px" }}>
                {MATURITY_TIERS.map((tier) => {
                  const isChecked = selectedTiers.includes(tier.days);
                  return (
                    <button
                      key={tier.days}
                      type="button"
                      onClick={() => toggleTier(tier.days)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "6px",
                        border: isChecked ? "1px solid var(--admin-cyan, #06b6d4)" : "1px solid #27272a",
                        background: isChecked ? "rgba(6, 182, 212, 0.08)" : "#18181b",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {isChecked ? <CheckSquare size={13} className="text-cyan" /> : <Square size={13} className="text-muted" />}
                        <span style={{ fontSize: "11px", fontWeight: 600, color: isChecked ? "#fff" : "#71717a" }}>{tier.label}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: isChecked ? "#34d399" : "#52525b", fontFamily: "var(--font-mono)" }}>
                        {tier.rate}/d
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Window */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={13} className="text-cyan" /> Drop Opens (UTC)
                </label>
                <input
                  type="datetime-local"
                  className="dash-input font-mono"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                  required
                />
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={13} className="text-cyan" /> Drop Closes / Caps (UTC)
                </label>
                <input
                  type="datetime-local"
                  className="dash-input font-mono"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #27272a", borderRadius: "6px", padding: "10px 12px" }}>
              <p className="text-muted text-xs" style={{ margin: 0, lineHeight: 1.4 }}>
                <strong>Lifecycle Notice:</strong> Publishing as <span style={{ color: "#34d399" }}>Active</span> immediately opens block subscriptions on the User Dashboard. Saving as <span style={{ color: "#fbbf24" }}>Draft</span> keeps the drop hidden in admin custody for testing or scheduled announcements.
              </p>
            </div>

            {error && <div className="dash-alert dash-alert--amber text-xs">{error}</div>}
          </div>

          <div className="admin-modal__footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => handleCreate("draft")}
                disabled={submitting}
                style={{ border: "1px solid #3f3f46" }}
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : "Save as Draft"}
              </button>
              <button type="submit" className="btn btn--secondary btn--sm" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Processing...
                  </>
                ) : (
                  "Deploy Live Drop"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
