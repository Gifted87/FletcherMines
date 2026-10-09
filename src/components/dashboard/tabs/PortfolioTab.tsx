"use client";

import { Box, Layers } from "lucide-react";
import { UserDashboardData, DashboardTab } from "@/lib/types/dashboard";

interface PortfolioTabProps {
  data: UserDashboardData;
  onSelectTab: (tab: DashboardTab) => void;
}

export default function PortfolioTab({ data, onSelectTab }: PortfolioTabProps) {
  const blocks = data.activeBlocks || [];

  return (
    <div className="dash-subtab-view">
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-cyan">
            <Layers size={13} /> ACTIVE MINING CONTRACTS
          </div>
          <h2>Portfolio &amp; Maturity Schedules</h2>
          <p>
            Review active mining blocks, hardware provisioning, daily yields, and contractual maturity schedules.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => onSelectTab("buy-blocks")}
        >
          Purchase More Blocks
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="dash-card dash-empty-state">
          <Box size={44} className="dash-empty-icon" />
          <h3>No Active Mining Contracts</h3>
          <p>You have not deployed capital into any mining blocks yet.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onSelectTab("buy-blocks")}
          >
            Deploy Mining Blocks
          </button>
        </div>
      ) : (
        <div className="dash-portfolio-list">
          {blocks.map((b) => (
            <div className="dash-card dash-contract-card" key={b.id}>
              <div className="dash-contract-card__head">
                <div>
                  <span className="dash-contract-batch font-mono">{b.batchName}</span>
                  <h3 className="dash-contract-title">{b.blockCount} Blocks (Antminer S21 Pro)</h3>
                </div>
                <div className="dash-contract-status">
                  <span className="dash-chip is-good">
                    <span className="pulse-dot" /> Contract Active
                  </span>
                </div>
              </div>

              <div className="dash-contract-meta-grid">
                <div>
                  <span className="dash-lbl">Committed Capital</span>
                  <strong className="font-mono">{b.totalInvested.toLocaleString()} USDT</strong>
                </div>
                <div>
                  <span className="dash-lbl">Daily Yield Rate</span>
                  <strong className="font-mono text-success">+{b.dailyRatePct}% / day</strong>
                </div>
                <div>
                  <span className="dash-lbl">Daily Return</span>
                  <strong className="font-mono text-success">+{b.dailyYieldUsdt.toFixed(2)} USDT</strong>
                </div>
                <div>
                  <span className="dash-lbl">Contract Term</span>
                  <strong className="font-mono">{b.maturityDays} Days</strong>
                </div>
                <div>
                  <span className="dash-lbl">Days Remaining</span>
                  <strong className="font-mono text-cyan">{b.daysRemaining} Days</strong>
                </div>
                <div>
                  <span className="dash-lbl">Maturity Date</span>
                  <strong className="font-mono">
                    {new Date(b.maturityDate).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              </div>

              {/* Progress bar */}
              <div className="dash-progress-box">
                <div className="dash-progress-box__head">
                  <span>Maturity Completion</span>
                  <span className="font-mono text-emerald">{b.progressPct}%</span>
                </div>
                <div className="dash-progress-track">
                  <div
                    className="dash-progress-fill"
                    style={{ width: `${b.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
