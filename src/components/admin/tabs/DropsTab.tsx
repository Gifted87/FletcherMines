"use client";

import { useEffect, useState } from "react";
import {
  AlertOctagon,
  Cpu,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminBatchRecord } from "@/lib/adminData";

interface DropsTabProps {
  onOpenCreateDrop: () => void;
}

export default function DropsTab({ onOpenCreateDrop }: DropsTabProps) {
  const [drops, setDrops] = useState<AdminBatchRecord[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/drops");
        const json = await res.json();
        if (active && res.ok) setDrops(json || []);
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

  const handleStatusAction = async (batchId: number, action: "pause" | "resume" | "halt") => {
    if (action === "halt") {
      const ok = confirm("Are you sure you want to trigger an Emergency Stop on this batch? This will immediately halt block sales.");
      if (!ok) return;
    }
    setActionLoading(batchId);
    try {
      const res = await fetch("/api/admin/drops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || `Drop status updated to ${action}.`);
        handleRefresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSupply = async (batchId: number) => {
    const qtyStr = prompt("Enter additional block units to inject into this batch:");
    if (!qtyStr) return;
    const additionalBlocks = parseInt(qtyStr);
    if (!additionalBlocks || additionalBlocks <= 0) return;

    setActionLoading(batchId);
    try {
      const res = await fetch("/api/admin/drops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, action: "add_supply", additionalBlocks }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message);
        handleRefresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const activeDrop = drops.find((d) => d.status === "active") || drops[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Cpu size={13} /> HARDWARE INVENTORY &amp; DROPS
          </div>
          <h2>Hardware Allocation Drops &amp; Inventory</h2>
          <p className="dash-subtab-desc">
            Deploy tokenized mining block inventory, configure fixed daily earning tiers, and monitor real-time capacity claim rates.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--secondary" onClick={onOpenCreateDrop}>
            <Plus size={14} />
            <span>Create New Drop</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleRefresh} title="Refresh Drops">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="dash-alert dash-alert--emerald text-xs">
          {feedback}
        </div>
      )}

      {/* LIVE DROP MONITOR HERO */}
      {activeDrop && (
        <div className="dash-card">
          <div className="dash-card__head">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={18} className="text-gold" />
              <h3>Live Drop Monitor: {activeDrop.batchName}</h3>
            </div>
            <span
              className={`badge ${
                activeDrop.status === "active"
                  ? "badge--gold"
                  : activeDrop.status === "paused"
                  ? "badge--amber"
                  : "badge--danger"
              }`}
            >
              <span className="pulse-dot" /> {activeDrop.status.toUpperCase()}
            </span>
          </div>

          <div className="admin-grid-4" style={{ marginBottom: "20px" }}>
            <div className="dash-kpi">
              <span>Blocks Sold</span>
              <strong className="font-mono text-white">
                {activeDrop.claimedBlocks} / {activeDrop.totalBlocks}
              </strong>
            </div>
            <div className="dash-kpi">
              <span>Blocks Remaining</span>
              <strong className="font-mono text-gold">{activeDrop.remainingBlocks} Units</strong>
            </div>
            <div className="dash-kpi">
              <span>Revenue Collected</span>
              <strong className="font-mono text-emerald">
                ${activeDrop.revenueCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
              </strong>
            </div>
            <div className="dash-kpi">
              <span>Hardware Model</span>
              <strong className="text-xs text-muted font-normal">{activeDrop.hardwareModel}</strong>
            </div>
          </div>

          {/* Large Capacity Progress Bar */}
          <div className="dash-progress-box">
            <div className="dash-progress-box__head">
              <span>Allocation Claimed Capacity</span>
              <span className="font-mono text-gold">{activeDrop.percentClaimed}% Claimed</span>
            </div>
            <div className="dash-progress-track">
              <div
                className="dash-progress-fill fill--gold"
                style={{ width: `${Math.min(100, activeDrop.percentClaimed)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            {activeDrop.status === "active" ? (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => handleStatusAction(activeDrop.id, "pause")}
                disabled={actionLoading === activeDrop.id}
              >
                <Pause size={14} />
                <span>Pause Drop</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => handleStatusAction(activeDrop.id, "resume")}
                disabled={actionLoading === activeDrop.id}
              >
                <Play size={14} />
                <span>Resume Drop</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => handleAddSupply(activeDrop.id)}
              disabled={actionLoading === activeDrop.id}
            >
              <Plus size={14} />
              <span>Inject Supply (+Blocks)</span>
            </button>

            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => handleStatusAction(activeDrop.id, "halt")}
              disabled={actionLoading === activeDrop.id}
            >
              <AlertOctagon size={14} />
              <span>Emergency Stop</span>
            </button>
          </div>
        </div>
      )}

      {/* ALL BATCHES DIRECTORY */}
      <div className="dash-card">
        <h3 className="text-sm font-bold text-white mb-3">All Mining Batch Allocations</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Hardware Model</th>
                <th>Total Blocks</th>
                <th>Claimed</th>
                <th>Price / Unit</th>
                <th>Status</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drops.map((b) => (
                <tr key={b.id}>
                  <td className="font-bold text-white">{b.batchName}</td>
                  <td className="text-xs text-muted">{b.hardwareModel}</td>
                  <td className="font-mono">{b.totalBlocks}</td>
                  <td className="font-mono text-gold">{b.claimedBlocks} ({b.percentClaimed}%)</td>
                  <td className="font-mono text-emerald">${b.pricePerBlock.toFixed(2)} USDT</td>
                  <td>
                    <span
                      className={`dash-badge ${
                        b.status === "active"
                          ? "dash-badge--emerald"
                          : b.status === "paused"
                          ? "dash-badge--amber"
                          : "dash-badge--danger"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="font-mono text-white">${b.revenueCollected.toLocaleString()} USDT</td>
                  <td>
                    <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                        onClick={() => handleAddSupply(b.id)}
                        disabled={actionLoading === b.id}
                      >
                        +Supply
                      </button>
                      {b.status === "active" ? (
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => handleStatusAction(b.id, "pause")}
                          disabled={actionLoading === b.id}
                        >
                          Pause
                        </button>
                      ) : b.status === "paused" ? (
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => handleStatusAction(b.id, "resume")}
                          disabled={actionLoading === b.id}
                        >
                          Resume
                        </button>
                      ) : null}
                      {b.status !== "halted" && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => handleStatusAction(b.id, "halt")}
                          disabled={actionLoading === b.id}
                        >
                          Halt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
