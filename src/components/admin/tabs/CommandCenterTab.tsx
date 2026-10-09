"use client";

import {
  Activity,
  Clock,
  Coins,
  Cpu,
  Flame,
  Gauge,
  Landmark,
  Lock,
  Radio,
  Users,
  Wallet,
} from "lucide-react";
import { AdminOverviewData } from "@/lib/adminData";
import { AdminTab } from "../AdminSidebar";

interface CommandCenterTabProps {
  data: AdminOverviewData;
  onSelectTab: (tab: AdminTab) => void;
  onSelectUser?: (userId: number) => void;
}

export default function CommandCenterTab({
  data,
  onSelectTab,
  onSelectUser,
}: CommandCenterTabProps) {
  const f = data.financials;
  const o = data.operations;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Radio size={13} /> GOVERNANCE &amp; LIQUIDITY OVERVIEW
          </div>
          <h2>Platform Command Center</h2>
          <p className="dash-subtab-desc">
            Consolidated liquidity balances, ASIC hardware allocations, treasury reserves, and audit trail.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onSelectTab("treasury")}
          >
            Review Deposits ({o.pendingDepositsCount})
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onSelectTab("drops")}
          >
            Manage Drops
          </button>
        </div>
      </div>

      {/* ROW 1: CAPITAL & TREASURY RESERVES */}
      <div>
        <div className="text-muted text-xs font-bold uppercase tracking-wider mb-3">
          Capital &amp; Treasury Reserves (All-Time)
        </div>
        <div className="admin-grid-4">
          <div
            className="admin-card cursor-pointer"
            onClick={() => onSelectTab("treasury")}
            role="button"
            tabIndex={0}
          >
            <div className="admin-card__head">
              <span className="admin-card__title">
                <Landmark size={14} className="text-emerald" /> Total Inflow
              </span>
              <span className="badge badge--emerald text-xs">Settled</span>
            </div>
            <div className="admin-card__val">
              ${f.totalDeposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <small>USDT</small>
            </div>
            <div className="admin-card__sub">
              <span>Cumulative confirmed operator deposits</span>
            </div>
          </div>

          <div
            className="admin-card cursor-pointer"
            onClick={() => onSelectTab("drops")}
            role="button"
            tabIndex={0}
          >
            <div className="admin-card__head">
              <span className="admin-card__title">
                <Lock size={14} className="text-gold" /> Active Value Locked
              </span>
              <span className="badge badge--gold text-xs">ASIC Mining</span>
            </div>
            <div className="admin-card__val text-gold">
              ${f.activeLockedCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <small>USDT</small>
            </div>
            <div className="admin-card__sub">
              <span>Secured in active batch allocations</span>
            </div>
          </div>

          <div
            className="admin-card cursor-pointer"
            onClick={() => onSelectTab("treasury")}
            role="button"
            tabIndex={0}
          >
            <div className="admin-card__head">
              <span className="admin-card__title">
                <Coins size={14} className="text-gold" /> Yields Settled
              </span>
              <span className="badge badge--gold text-xs">00:00 UTC</span>
            </div>
            <div className="admin-card__val">
              ${f.totalYieldPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <small>USDT</small>
            </div>
            <div className="admin-card__sub">
              <span>Cumulative distributed earnings</span>
            </div>
          </div>

          <div
            className="admin-card cursor-pointer"
            onClick={() => onSelectTab("treasury")}
            role="button"
            tabIndex={0}
          >
            <div className="admin-card__head">
              <span className="admin-card__title">
                <Wallet size={14} className="text-emerald" /> Liquid Treasury Reserve
              </span>
              <span className="badge badge--emerald text-xs">Liquid</span>
            </div>
            <div className="admin-card__val text-emerald">
              ${f.treasuryReserves.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <small>USDT</small>
            </div>
            <div className="admin-card__sub">
              <span>Operator available wallet balances</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: OPERATIONAL VELOCITY & AUDIT FEED SPLIT */}
      <div className="admin-split-2">
        {/* Operational Metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="text-muted text-xs font-bold uppercase tracking-wider">
            24-Hour Operational Velocity
          </div>
          <div className="admin-grid-2">
            <div className="admin-card">
              <div className="admin-card__head">
                <span className="admin-card__title">
                  <Users size={14} /> Active Accounts
                </span>
                <span className="font-mono text-xs text-muted">24h</span>
              </div>
              <div className="admin-card__val">{o.activeUsers24h}</div>
              <div className="admin-card__sub">Registered operator profiles</div>
            </div>

            <div
              className="admin-card cursor-pointer"
              onClick={() => onSelectTab("treasury")}
              style={{
                borderColor: o.pendingDepositsCount > 0 ? "rgba(212, 169, 78, 0.4)" : undefined,
              }}
            >
              <div className="admin-card__head">
                <span className="admin-card__title">
                  <Clock size={14} className="text-gold" /> Pending Approvals
                </span>
                {o.pendingDepositsCount > 0 && <span className="pulse-dot" />}
              </div>
              <div className="admin-card__val text-gold">{o.pendingDepositsCount}</div>
              <div className="admin-card__sub">Awaiting treasury verification</div>
            </div>

            <div className="admin-card">
              <div className="admin-card__head">
                <span className="admin-card__title">
                  <Flame size={14} className="text-gold" /> Daily Task Rate
                </span>
                <span className="font-mono text-xs text-emerald">{o.taskCompletionRatePct}%</span>
              </div>
              <div className="admin-card__val">{o.taskCompletionRatePct}%</div>
              <div className="admin-card__sub">Node pings verified today</div>
            </div>

            <div className="admin-card">
              <div className="admin-card__head">
                <span className="admin-card__title">
                  <Gauge size={14} /> Operational Hashrate
                </span>
                <span className="badge badge--emerald text-xs">Immersion</span>
              </div>
              <div className="admin-card__val">{o.totalHashratePH} <small>PH/s</small></div>
              <div className="admin-card__sub">Facility uptime: {o.facilityUptime}%</div>
            </div>
          </div>
        </div>

        {/* Live System Activity Feed */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} className="text-gold" />
              <h3>Live System Audit Trail</h3>
            </div>
            <span className="text-muted text-xs font-mono">SQLite WAL Engine</span>
          </div>

          <div className="dash-card__body">
            <div className="admin-feed">
              {!data.liveEvents || data.liveEvents.length === 0 ? (
                <div className="text-muted text-center py-6 text-xs">No recent ledger events.</div>
              ) : (
                data.liveEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`admin-feed-item ${evt.userId && onSelectUser ? "cursor-pointer hover:bg-white/5" : ""}`}
                    onClick={() => {
                      if (evt.userId && onSelectUser) {
                        onSelectUser(evt.userId);
                      }
                    }}
                    style={{ borderRadius: "6px", padding: "8px", margin: "2px -8px" }}
                  >
                    <div style={{ marginTop: "2px" }}>
                      {evt.eventType === "deposit" ? (
                        <Landmark size={14} className="text-emerald" />
                      ) : evt.eventType === "task" ? (
                        <Flame size={14} className="text-gold" />
                      ) : evt.eventType === "batch" ? (
                        <Cpu size={14} className="text-gold" />
                      ) : (
                        <Activity size={14} className="text-muted" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong style={{ fontSize: "12px", color: "var(--text)" }}>{evt.title}</strong>
                          {evt.userId && (
                            <span className="dash-badge dash-badge--cyan font-mono" style={{ fontSize: "10px", padding: "1px 5px" }}>
                              User #{evt.userId}
                            </span>
                          )}
                        </div>
                        <span className="text-muted font-mono" style={{ fontSize: "10.5px", whiteSpace: "nowrap" }}>
                          {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0 0", color: "var(--text-3)", fontSize: "11.5px", lineHeight: "1.4" }}>
                        {evt.details}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
