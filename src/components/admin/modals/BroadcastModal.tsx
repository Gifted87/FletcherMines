"use client";

import { useState } from "react";
import { Loader2, Megaphone, X } from "lucide-react";

interface BroadcastModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BroadcastModal({ onClose, onSuccess }: BroadcastModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "high" | "critical">("high");
  const [category, setCategory] = useState<"drop" | "treasury" | "maintenance" | "security">("security");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill in both title and announcement message.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, urgency, category }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Broadcast failed");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Megaphone size={18} className="text-gold" />
            <h3>Broadcast Platform Announcement</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn--ghost btn--sm">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p className="text-muted text-xs">
              This notice will immediately appear as a banner bulletin on all authenticated operator dashboards.
            </p>

            <div className="dash-field-group">
              <label className="dash-lbl">Announcement Title</label>
              <input
                type="text"
                className="dash-input"
                placeholder="e.g. Scheduled Network Upgrade at 00:00 UTC"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="dash-field-group">
                <label className="dash-lbl">Category</label>
                <select
                  className="dash-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "drop" | "treasury" | "maintenance" | "security")}
                >
                  <option value="security">Security & SLA</option>
                  <option value="drop">Drop & Allocation</option>
                  <option value="treasury">Treasury Settlement</option>
                  <option value="maintenance">Maintenance Notice</option>
                </select>
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Urgency Level</label>
                <select
                  className="dash-input"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as "normal" | "high" | "critical")}
                >
                  <option value="normal">Normal (Standard Bulletin)</option>
                  <option value="high">High (Yellow Notice)</option>
                  <option value="critical">Critical (Red Emergency)</option>
                </select>
              </div>
            </div>

            <div className="dash-field-group">
              <label className="dash-lbl">Detailed Message Body</label>
              <textarea
                className="dash-input"
                rows={4}
                placeholder="Provide clear instructions for node operators..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
                  <Loader2 className="animate-spin" size={14} /> Broadcasting...
                </>
              ) : (
                "Dispatch to All Dashboards"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
