"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Cpu,
  Flame,
  Gift,
  Layers,
  LifeBuoy,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import { UserDashboardData, DashboardTab } from "@/lib/types/dashboard";

interface OverviewTabProps {
  data: UserDashboardData;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenSupport: () => void;
  onCompleteTask: () => void;
  taskLoading: boolean;
}

export default function OverviewTab({
  data,
  onSelectTab,
  onOpenSupport,
  onCompleteTask,
  taskLoading,
}: OverviewTabProps) {
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "ALL">("7D");
  const [copiedLink, setCopiedLink] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.floor(data.batchDrop.closesInMs / 1000)
  );

  // Live countdown ticker for Batch 05 closing
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const copyReferral = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(data.user.referralCode);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Active chart series
  const activeSeries =
    chartRange === "7D"
      ? data.earnings.chartSeries7D
      : chartRange === "30D"
      ? data.earnings.chartSeries30D
      : data.earnings.chartSeriesAll;

  // Compute SVG chart curve
  const chartW = 540;
  const chartH = 140;
  const vals = activeSeries.map((s) => s.value);
  const minVal = Math.min(...vals) * 0.95;
  const maxVal = Math.max(...vals) * 1.05 || 100;

  const pts = activeSeries.map((s, idx) => {
    const x = (idx / (activeSeries.length - 1 || 1)) * chartW;
    const y = chartH - ((s.value - minVal) / (maxVal - minVal || 1)) * (chartH - 24) - 12;
    return [x, y] as const;
  });

  const chartPath = pts
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");

  const chartArea = `${chartPath} L${chartW},${chartH} L0,${chartH} Z`;

  // Dynamic alert banner logic
  const infoRequestedDeposit = data.recentTransactions.find(
    (t) => t.type === "deposit" && (t.status === "info_requested" || (t as { status?: string }).status === "info_requested")
  );
  const pendingDeposit = data.recentTransactions.find(
    (t) => t.type === "deposit" && t.status === "pending"
  );
  const hasPendingDeposit = Boolean(pendingDeposit);
  const hasNoBlocks = data.metrics.blocksOwned === 0;
  const hasTaskIncomplete = !data.dailyTask.completedToday;
  const hasMaturitySoon = data.metrics.nearestUnlockDays > 0 && data.metrics.nearestUnlockDays <= 20;

  return (
    <div className="dash-overview-view">
      {/* SECTION 1: WELCOME & ACCOUNT STATUS */}
      <section className="dash-sec-welcome">
        <div className="dash-welcome-header">
          <div>
            <div className="dash-greeting-row">
              <h1 className="dash-greeting-title">
                Welcome back, <span className="accent">{data.user.username}</span>
              </h1>
              <span className="dash-greeting-tag font-mono">NODE OPERATOR</span>
            </div>
            <p className="dash-greeting-sub">
              Your physical hash-rate allocation is online. Daily yields settled automatically at 00:00 UTC.
            </p>
          </div>

          {/* Account Status Chips */}
          <div className="dash-status-chips">
            <span className="dash-chip is-good">
              <span className="pulse-dot" /> Account Active
            </span>
            <span className="dash-chip is-good">
              <Check size={12} /> Email Verified
            </span>
            <span className="dash-chip is-good">
              <ShieldCheck size={12} /> 2FA Protected
            </span>
            <span className="dash-chip is-good">
              <Coins size={12} /> KYC Verified
            </span>
          </div>
        </div>

        {/* Contextual Priority Alert Banner */}
        {infoRequestedDeposit ? (
          <div className="dash-alert-banner alert--pending" style={{ borderColor: "rgba(245, 158, 11, 0.5)", background: "rgba(245, 158, 11, 0.08)" }}>
            <div className="dash-alert-icon text-amber">
              <Clock size={18} />
            </div>
            <div className="dash-alert-body">
              <strong style={{ color: "#fbbf24" }}>Deposit Action Required: Verification Requested</strong>
              <p>The treasury team requested clarification or updated TX confirmation for your ${infoRequestedDeposit.amount.toFixed(2)} USDT deposit.</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={onOpenSupport}
              >
                Open Support Ticket
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onSelectTab("wallet")}
              >
                View Ledger
              </button>
            </div>
          </div>
        ) : hasPendingDeposit ? (
          <div className="dash-alert-banner alert--pending">
            <div className="dash-alert-icon">
              <Clock size={18} />
            </div>
            <div className="dash-alert-body">
              <strong>Manual USDT Deposit Awaiting Verification</strong>
              <p>Your {pendingDeposit?.amount.toFixed(2)} USDT transfer is currently undergoing on-chain treasury verification.</p>
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onSelectTab("wallet")}
            >
              View Deposit Log
            </button>
          </div>
        ) : hasTaskIncomplete ? (
          <div className="dash-alert-banner alert--task">
            <div className="dash-alert-icon">
              <Flame size={18} />
            </div>
            <div className="dash-alert-body">
              <strong>Daily Hashrate Ping Required</strong>
              <p>Ping your node today to maintain your 4-day streak and guarantee 00:00 UTC yield calculation.</p>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={onCompleteTask}
              disabled={taskLoading}
            >
              {taskLoading ? "Pinging..." : "Complete Task Now"}
            </button>
          </div>
        ) : hasMaturitySoon ? (
          <div className="dash-alert-banner alert--info">
            <div className="dash-alert-icon">
              <Lock size={18} />
            </div>
            <div className="dash-alert-body">
              <strong>Mining Contract Approaching Maturity</strong>
              <p>
                Your {data.metrics.nearestBatchName} allocation unlocks in {data.metrics.nearestUnlockDays} days on{" "}
                {data.metrics.nearestUnlockDate}.
              </p>
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onSelectTab("portfolio")}
            >
              View Portfolio
            </button>
          </div>
        ) : hasNoBlocks ? (
          <div className="dash-alert-banner alert--action">
            <div className="dash-alert-icon">
              <Box size={18} />
            </div>
            <div className="dash-alert-body">
              <strong>Welcome Allocation Credited</strong>
              <p>Your 50.00 USDT signup balance is ready. Purchase your first mining block to activate daily yields.</p>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => onSelectTab("buy-blocks")}
            >
              Buy Blocks Now
            </button>
          </div>
        ) : null}
      </section>

      {/* SECTION 2: PRIMARY FINANCIAL COMMAND CENTER */}
      <section className="dash-sec-metrics" aria-label="Financial Balances">
        <div className="dash-command-center">
          {/* Card 1: HOW MUCH HE HAS (Total Account Capital) */}
          <div
            className="dash-command-card dash-command-card--has cursor-pointer"
            onClick={() => onSelectTab("wallet")}
            role="button"
            tabIndex={0}
          >
            <div className="dash-command-card__header">
              <span className="dash-command-card__eyebrow">
                <Wallet size={14} className="text-gold" /> Total Capital Balance
              </span>
              <span className="dash-live-badge">Liquid + Locked</span>
            </div>
            <div className="dash-command-card__main-val">
              ${data.metrics.totalPortfolioValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <small>USDT</small>
            </div>
            <div className="dash-command-card__breakdown">
              <div className="dash-breakdown-row">
                <span>Available Liquid:</span>
                <strong className="text-gold font-mono">
                  ${data.metrics.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                </strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Locked in Hardware:</span>
                <strong className="text-white font-mono">
                  ${data.metrics.lockedBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: HOW MUCH HE HAS MADE SO FAR (IN FULL) */}
          <div
            className="dash-command-card dash-command-card--earned cursor-pointer"
            onClick={() => onSelectTab("portfolio")}
            role="button"
            tabIndex={0}
          >
            <div className="dash-command-card__header">
              <span className="dash-command-card__eyebrow">
                <Coins size={14} className="text-emerald" /> Total Made So Far
              </span>
              <span className="dash-live-badge">100% Realized</span>
            </div>
            <div className="dash-command-card__main-val text-emerald">
              +${data.metrics.totalEarnedSoFar.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <small>USDT</small>
            </div>
            <div className="dash-command-card__breakdown">
              <div className="dash-breakdown-row">
                <span>Mining Yields:</span>
                <strong className="text-emerald font-mono">
                  +${data.metrics.accumulatedMiningYield.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                </strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Referral Commissions:</span>
                <strong className="text-gold font-mono">
                  +${data.metrics.referralEarningsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                </strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Welcome Voucher:</span>
                <strong className="text-white font-mono">
                  +${data.metrics.bonusCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                </strong>
              </div>
            </div>
          </div>

          {/* Card 3: HOW MUCH HE WILL MAKE THE NEXT DAY (TOP & CLEAR) */}
          <div className="dash-command-card dash-command-card--nextday">
            <div className="dash-command-card__header">
              <span className="dash-command-card__eyebrow">
                <TrendingUp size={14} className="text-cyan" /> Next 24h Payout (Tomorrow)
              </span>
              <span className="dash-live-badge"><span className="pulse-dot" /> 00:00 UTC</span>
            </div>
            <div className="dash-command-card__main-val text-gold">
              +${data.metrics.nextDayPayout.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <small>USDT/day</small>
            </div>
            <div className="dash-command-card__breakdown">
              <div className="dash-breakdown-row">
                <span>Batch 03 (25 Blks @ 16%):</span>
                <strong className="text-emerald font-mono">+400.00 USDT</strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Batch 04 (25 Blks @ 14%):</span>
                <strong className="text-emerald font-mono">+350.00 USDT</strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Next Settlement:</span>
                <strong className="text-cyan font-mono">Tonight at 00:00 UTC</strong>
              </div>
            </div>
          </div>

          {/* Card 4: BLOCKS OWNED & MATURITY */}
          <div
            className="dash-command-card dash-command-card--maturity cursor-pointer"
            onClick={() => onSelectTab("portfolio")}
            role="button"
            tabIndex={0}
          >
            <div className="dash-command-card__header">
              <span className="dash-command-card__eyebrow">
                <Box size={14} className="text-cyan" /> Mining Blocks Owned
              </span>
              <span className="dash-live-badge">{data.metrics.blocksOwned} Units</span>
            </div>
            <div className="dash-command-card__main-val text-white">
              {data.metrics.blocksOwned}
              <small>Blocks (${data.metrics.totalInvested.toLocaleString()} USDT)</small>
            </div>
            <div className="dash-command-card__breakdown">
              <div className="dash-breakdown-row">
                <span>Nearest Maturity:</span>
                <strong className="text-gold font-mono">{data.metrics.nearestBatchName} ({data.metrics.nearestUnlockDays}d)</strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Unlock Date:</span>
                <strong className="text-white font-mono">{data.metrics.nearestUnlockDate}</strong>
              </div>
              <div className="dash-breakdown-row">
                <span>Maturity Progress:</span>
                <strong className="text-emerald font-mono">{data.metrics.maturityProgressPct}% Completed</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: QUICK ACTIONS */}
      <section className="dash-sec-actions" aria-label="Quick Actions">
        <div className="dash-actions-grid">
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => onSelectTab("wallet")}
          >
            <div className="dash-action-btn__icon icon--gold">
              <Wallet size={20} />
            </div>
            <div>
              <strong>Deposit USDT</strong>
              <span>TRON Network (TRC-20)</span>
            </div>
          </button>

          <button
            type="button"
            className="dash-action-btn"
            onClick={() => onSelectTab("buy-blocks")}
          >
            <div className="dash-action-btn__icon icon--emerald">
              <Cpu size={20} />
            </div>
            <div>
              <strong>Buy Blocks</strong>
              <span>Batch 05 capacity</span>
            </div>
          </button>

          <button
            type="button"
            className={`dash-action-btn ${data.dailyTask.completedToday ? "is-completed" : ""}`}
            onClick={onCompleteTask}
            disabled={taskLoading || data.dailyTask.completedToday}
          >
            <div className="dash-action-btn__icon icon--flame">
              {data.dailyTask.completedToday ? <Check size={20} /> : <Flame size={20} />}
            </div>
            <div>
              <strong>{data.dailyTask.completedToday ? "Task Completed" : "Daily Task"}</strong>
              <span>{data.dailyTask.completedToday ? "Streak maintained" : "Ping hashrate node"}</span>
            </div>
          </button>

          <button
            type="button"
            className="dash-action-btn"
            onClick={copyReferral}
          >
            <div className="dash-action-btn__icon icon--purple">
              {copiedLink ? <Check size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <strong>{copiedLink ? "Link Copied!" : "Invite Friends"}</strong>
              <span>Earn 50 USDT on each</span>
            </div>
          </button>
        </div>
      </section>

      {/* TWO-COLUMN GRID: Left (Mining & Earnings) / Right (Tasks, Countdown & Drop) */}
      <div className="dash-split-grid">
        {/* LEFT COLUMN */}
        <div className="dash-split-col">
          {/* SECTION 4: MINING OVERVIEW CARD */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Layers size={18} className="text-emerald" />
                <h3>Mining Overview</h3>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onSelectTab("portfolio")}
              >
                View Portfolio <ArrowRight size={14} />
              </button>
            </div>

            {hasNoBlocks ? (
              <div className="dash-empty-state">
                <Box size={40} className="dash-empty-icon" />
                <h4>No Active Mining Blocks Yet</h4>
                <p>Deploy capital into hardware blocks to activate daily automated yields.</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => onSelectTab("buy-blocks")}
                >
                  Buy Your First Block
                </button>
              </div>
            ) : (
              <div className="dash-mining-summary">
                <div className="dash-mining-kpis">
                  <div className="dash-kpi">
                    <span>Total Invested</span>
                    <strong className="font-mono">{data.metrics.totalInvested.toLocaleString()} USDT</strong>
                  </div>
                  <div className="dash-kpi">
                    <span>Active Blocks</span>
                    <strong className="font-mono">{data.metrics.blocksOwned} Units</strong>
                  </div>
                  <div className="dash-kpi">
                    <span>Daily Return</span>
                    <strong className="font-mono text-success">+{data.metrics.projectedDailyReturn.toFixed(2)} USDT</strong>
                  </div>
                  <div className="dash-kpi">
                    <span>Next Unlock</span>
                    <strong className="font-mono">{data.metrics.nearestUnlockDate}</strong>
                  </div>
                </div>

                {/* Visual Maturity Progress Bar */}
                <div className="dash-progress-box">
                  <div className="dash-progress-box__head">
                    <span>Contract Maturity Progress</span>
                    <span className="font-mono text-emerald">{data.metrics.maturityProgressPct}% Completed</span>
                  </div>
                  <div className="dash-progress-track">
                    <div
                      className="dash-progress-fill"
                      style={{ width: `${data.metrics.maturityProgressPct}%` }}
                    />
                  </div>
                  <span className="dash-progress-sub">
                    Current contracts deployed against dedicated Antminer S21 Pro hardware in Hall B.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: EARNINGS SUMMARY CARD & INTERACTIVE CHART */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Coins size={18} className="text-gold" />
                <h3>Earnings Summary</h3>
              </div>
              {/* Range Toggle */}
              <div className="dash-pill-switcher">
                <button
                  type="button"
                  className={chartRange === "7D" ? "is-active" : ""}
                  onClick={() => setChartRange("7D")}
                >
                  7D
                </button>
                <button
                  type="button"
                  className={chartRange === "30D" ? "is-active" : ""}
                  onClick={() => setChartRange("30D")}
                >
                  30D
                </button>
                <button
                  type="button"
                  className={chartRange === "ALL" ? "is-active" : ""}
                  onClick={() => setChartRange("ALL")}
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Figures Breakdown */}
            <div className="dash-earnings-figures">
              <div>
                <span className="dash-earnings-lbl">Today&apos;s Yield</span>
                <span className="dash-earnings-val font-mono text-success">
                  +{data.earnings.today.toFixed(2)} USDT
                </span>
              </div>
              <div>
                <span className="dash-earnings-lbl">This Week</span>
                <span className="dash-earnings-val font-mono">
                  {data.earnings.thisWeek.toFixed(2)} USDT
                </span>
              </div>
              <div>
                <span className="dash-earnings-lbl">All-Time Yield</span>
                <span className="dash-earnings-val font-mono text-gold">
                  {data.earnings.allTime.toFixed(2)} USDT
                </span>
              </div>
              <div>
                <span className="dash-earnings-lbl">Withdrawable</span>
                <span className="dash-earnings-val font-mono text-success">
                  {data.earnings.withdrawable.toFixed(2)} USDT
                </span>
              </div>
              <div>
                <span className="dash-earnings-lbl">Locked Yield</span>
                <span className="dash-earnings-val font-mono">
                  {data.earnings.locked.toFixed(2)} USDT
                </span>
              </div>
            </div>

            {/* Interactive SVG Yield Chart */}
            <div className="dash-chart-wrap" aria-label="Earnings chart">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="earnings-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1={chartH * 0.25} x2={chartW} y2={chartH * 0.25} stroke="rgba(255,255,255,0.06)" />
                <line x1="0" y1={chartH * 0.5} x2={chartW} y2={chartH * 0.5} stroke="rgba(255,255,255,0.06)" />
                <line x1="0" y1={chartH * 0.75} x2={chartW} y2={chartH * 0.75} stroke="rgba(255,255,255,0.06)" />
                <path d={chartArea} fill="url(#earnings-grad)" />
                <path d={chartPath} fill="none" stroke="#34d399" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="dash-chart-sub">
              Fixed daily earning rates (10% to 20%) calculated continuously on physical hardware hash rates.
            </span>
          </div>

          {/* SECTION 9: RECENT TRANSACTIONS */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Clock size={18} className="text-cyan" />
                <h3>Recent Transactions</h3>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onSelectTab("wallet")}
              >
                View Full Ledger <ArrowRight size={14} />
              </button>
            </div>

            <div className="dash-tx-list">
              {data.recentTransactions.length === 0 ? (
                <div className="dash-empty-tx">No ledger transactions recorded yet.</div>
              ) : (
                data.recentTransactions.map((tx) => {
                  const isPositive = tx.type === "deposit" || tx.type === "daily_yield" || tx.type === "referral_bonus";

                  return (
                    <div className="dash-tx-row" key={tx.id}>
                      <div className="dash-tx-icon">
                        {tx.type === "deposit" ? (
                          <ArrowDownLeft size={16} className="text-success" />
                        ) : tx.type === "withdrawal" ? (
                          <ArrowUpRight size={16} className="text-danger" />
                        ) : tx.type === "daily_yield" ? (
                          <TrendingUp size={16} className="text-gold" />
                        ) : tx.type === "referral_bonus" ? (
                          <Gift size={16} className="text-emerald" />
                        ) : (
                          <Box size={16} className="text-cyan" />
                        )}
                      </div>
                      <div className="dash-tx-details">
                        <strong className="dash-tx-title">{tx.description}</strong>
                        <span className="dash-tx-date">
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="dash-tx-amount">
                        <strong className={`font-mono ${isPositive ? "text-success" : "text-white"}`}>
                          {isPositive ? "+" : "-"}
                          {tx.amount.toFixed(2)} USDT
                        </strong>
                        <span className={`dash-tx-status status--${tx.status}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-split-col">
          {/* SECTION 6: DAILY TASK TEASER */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Flame size={18} className="text-flame" />
                <h3>Daily Mining Task</h3>
              </div>
              <span className="dash-streak-badge font-mono">
                🔥 {data.dailyTask.streakDays} Day Streak
              </span>
            </div>

            <div className="dash-task-body">
              <div className="dash-task-status-row">
                <span>Task Status:</span>
                <span className={`dash-chip ${data.dailyTask.completedToday ? "is-good" : "is-pending"}`}>
                  {data.dailyTask.completedToday ? "Completed for Today" : "Action Pending"}
                </span>
              </div>
              <p className="dash-task-desc">
                {data.dailyTask.rewardDescription}. Ping your allocated mining node to maintain continuous hashrate confirmation.
              </p>
              <button
                type="button"
                className={`btn btn--block ${data.dailyTask.completedToday ? "btn--ghost" : "btn--primary"}`}
                onClick={onCompleteTask}
                disabled={taskLoading || data.dailyTask.completedToday}
              >
                {taskLoading ? (
                  "Verifying Ping..."
                ) : data.dailyTask.completedToday ? (
                  <>
                    <CheckCircle2 size={16} /> Streak Maintained
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Ping Mining Node Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 7: MATURITY COUNTDOWN */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Lock size={18} className="text-cyan" />
                <h3>Next Maturity Unlock</h3>
              </div>
              <span className="badge badge--cyan">{data.metrics.nearestBatchName}</span>
            </div>

            <div className="dash-maturity-body">
              <div className="dash-maturity-meta">
                <div>
                  <span className="dash-lbl">Locked Amount</span>
                  <strong className="font-mono">2,500.00 USDT</strong>
                </div>
                <div>
                  <span className="dash-lbl">Contract Term</span>
                  <strong className="font-mono">90 Days (16.0%)</strong>
                </div>
                <div>
                  <span className="dash-lbl">Unlocks On</span>
                  <strong className="font-mono">{data.metrics.nearestUnlockDate}</strong>
                </div>
              </div>

              {/* Countdown Ticker Boxes */}
              <div className="dash-countdown-row">
                <div className="dash-cd-box">
                  <span className="dash-cd-num font-mono">{data.metrics.nearestUnlockDays}</span>
                  <span className="dash-cd-lbl">Days</span>
                </div>
                <span className="dash-cd-sep">:</span>
                <div className="dash-cd-box">
                  <span className="dash-cd-num font-mono">04</span>
                  <span className="dash-cd-lbl">Hours</span>
                </div>
                <span className="dash-cd-sep">:</span>
                <div className="dash-cd-box">
                  <span className="dash-cd-num font-mono">12</span>
                  <span className="dash-cd-lbl">Mins</span>
                </div>
                <span className="dash-cd-sep">:</span>
                <div className="dash-cd-box">
                  <span className="dash-cd-num font-mono">30</span>
                  <span className="dash-cd-lbl">Secs</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn--secondary btn--block btn--sm"
                onClick={() => onSelectTab("portfolio")}
              >
                View All Maturity Schedules <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* SECTION 8: NEXT DROP / SCARCITY CARD (BATCH 05) */}
          <div className="dash-card dash-drop-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Sparkles size={18} className="text-gold" />
                <h3>{data.batchDrop.batchName} Allocation</h3>
              </div>
              <span className="badge badge--gold">
                <span className="pulse-dot" /> LIVE
              </span>
            </div>

            <div className="dash-drop-body">
              <p className="dash-drop-desc">
                Institutional high-density hardware allocation. Deployed Antminer S21 Pro units backing fixed daily earnings.
              </p>

              <div className="dash-drop-stats">
                <div>
                  <span>Price Per Block</span>
                  <strong className="font-mono text-gold">{data.batchDrop.pricePerBlock.toFixed(0)} USDT</strong>
                </div>
                <div>
                  <span>Blocks Remaining</span>
                  <strong className="font-mono text-white">{data.batchDrop.remainingBlocks} Blocks</strong>
                </div>
                <div>
                  <span>Closes In</span>
                  <strong className="font-mono text-emerald">{formatCountdown(secondsRemaining)}</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="dash-progress-box">
                <div className="dash-progress-box__head">
                  <span>Capacity Claimed</span>
                  <span className="font-mono text-gold">{data.batchDrop.percentClaimed}% Sold</span>
                </div>
                <div className="dash-progress-track">
                  <div
                    className="dash-progress-fill fill--gold"
                    style={{ width: `${data.batchDrop.percentClaimed}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => onSelectTab("buy-blocks")}
              >
                Buy Blocks Now <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* SECTION 10: REFERRAL TEASER */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Gift size={18} className="text-gold" />
                <h3>Invite Friends &amp; Earn</h3>
              </div>
              <span className="badge badge--gold">+50 USDT Each</span>
            </div>

            <div className="dash-ref-body">
              <p>Earn an instant 50.00 USDT credit added to your account for every investor who joins using your referral code.</p>

              <div className="dash-ref-input-box">
                <input
                  type="text"
                  readOnly
                  value={data.user.referralCode}
                  className="font-mono text-gold"
                  style={{ fontWeight: 700, letterSpacing: "0.08em" }}
                />
                <button type="button" onClick={copyReferral} className="btn btn--secondary btn--sm">
                  {copiedLink ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copiedLink ? "Code Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div className="dash-ref-stats-row">
                <div>
                  <span>Total Referrals:</span>
                  <strong className="font-mono">{data.user.referralCount} Miners</strong>
                </div>
                <div>
                  <span>Earned:</span>
                  <strong className="font-mono text-gold">+{data.user.referralEarnings.toFixed(2)} USDT</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 11: ANNOUNCEMENTS & SUPPORT */}
          <div className="dash-card">
            <div className="dash-card__head">
              <div className="dash-card__title-wrap">
                <Radio size={18} className="text-emerald" />
                <h3>Platform Bulletins</h3>
              </div>
            </div>

            <div className="dash-bulletin-list">
              {data.announcements.map((item) => (
                <div className="dash-bulletin-item" key={item.id}>
                  <strong className="dash-bulletin-title">{item.title}</strong>
                  <p className="dash-bulletin-content">{item.content}</p>
                </div>
              ))}
            </div>

            <div className="dash-support-callout">
              <div className="dash-support-icon">
                <LifeBuoy size={20} />
              </div>
              <div className="dash-support-text">
                <strong>Need priority assistance?</strong>
                <span>Our treasury team verifies deposits 24/7.</span>
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={onOpenSupport}
              >
                Contact Desk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
