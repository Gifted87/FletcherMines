"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Cpu,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { DashboardTab, UserDashboardData } from "@/lib/types/dashboard";
import SuccessConfirmationModal from "../modals/SuccessConfirmationModal";

interface BuyBlocksTabProps {
  data: UserDashboardData;
  onRefresh: () => void;
  onSelectTab?: (tab: DashboardTab) => void;
}

const TERMS = [
  { days: 14, rate: 10.0, label: "14 Days (10% Daily)" },
  { days: 30, rate: 12.0, label: "30 Days (12% Daily)" },
  { days: 60, rate: 15.0, label: "60 Days (15% Daily)" },
  { days: 90, rate: 18.0, label: "90 Days (18% Daily)" },
  { days: 180, rate: 20.0, label: "180 Days (20% Daily)" },
];

export default function BuyBlocksTab({ data, onRefresh, onSelectTab }: BuyBlocksTabProps) {
  const [blockCount, setBlockCount] = useState<number>(5);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation dialog state
  const [confirmedAllocation, setConfirmedAllocation] = useState<{
    blockCount: number;
    totalCost: number;
    days: number;
    rate: number;
    dailyYield: number;
    totalReturn: number;
    batchName: string;
  } | null>(null);

  const pricePerBlock = data.batchDrop.pricePerBlock || 100;
  const totalCost = blockCount * pricePerBlock;
  const dailyYield = Number(((totalCost * selectedTerm.rate) / 100).toFixed(2));
  const totalReturn = Number((dailyYield * selectedTerm.days).toFixed(2));
  const netProfit = Number((totalReturn - totalCost).toFixed(2));

  const hasSufficientBalance = data.user.usdtBalance >= totalCost;

  const handleBuy = async () => {
    setErrorMsg("");
    if (!hasSufficientBalance) {
      setErrorMsg(`Insufficient available balance. You need ${totalCost} USDT, but have ${data.user.usdtBalance.toFixed(2)} USDT.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/blocks/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          blockCount,
          maturityDays: selectedTerm.days,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to purchase mining blocks.");
      }

      // Pop up institutional confirmation dialog box
      setConfirmedAllocation({
        blockCount,
        totalCost,
        days: selectedTerm.days,
        rate: selectedTerm.rate,
        dailyYield,
        totalReturn,
        batchName: data.batchDrop.batchName,
      });

      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Purchase failed.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-subtab-view">
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Sparkles size={13} /> {data.batchDrop.batchName} ALLOCATION
          </div>
          <h2>Purchase Mining Blocks</h2>
          <p>
            Allocate capital into physical Antminer S21 Pro units deployed in Hall B. Daily earnings settled automatically at 00:00 UTC.
          </p>
        </div>
        <div className="dash-subtab-badge">
          <span>Remaining:</span>
          <strong className="font-mono text-gold">{data.batchDrop.remainingBlocks} Blocks</strong>
        </div>
      </div>

      {errorMsg && (
        <div className="auth-error-box">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="dash-buy-grid">
        {/* Left: Configuration form */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div className="dash-card__title-wrap">
              <Cpu size={18} className="text-emerald" />
              <h3>Block Configuration</h3>
            </div>
            <span className="badge badge--gold">100 USDT / Block</span>
          </div>

          <div className="dash-buy-form">
            {/* Step 1: Number of blocks */}
            <div className="dash-field-group">
              <label>Number of Mining Blocks</label>
              <div className="dash-block-selector">
                {[1, 5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`dash-pill-btn ${blockCount === num ? "is-selected" : ""}`}
                    onClick={() => setBlockCount(num)}
                  >
                    {num} {num === 1 ? "Block" : "Blocks"}
                  </button>
                ))}
              </div>
              <span className="dash-field-helper">
                Total Commitment: <strong className="font-mono text-white">{totalCost} USDT</strong>
              </span>
            </div>

            {/* Step 2: Term duration */}
            <div className="dash-field-group">
              <label>Select Maturity Term</label>
              <div className="dash-term-list">
                {TERMS.map((t) => (
                  <button
                    key={t.days}
                    type="button"
                    className={`dash-term-card ${selectedTerm.days === t.days ? "is-selected" : ""}`}
                    onClick={() => setSelectedTerm(t)}
                  >
                    <div>
                      <strong>{t.days} Days Lock-Up</strong>
                      <span>Fixed rate guaranteed</span>
                    </div>
                    <span className="dash-term-rate font-mono text-success">
                      +{t.rate}% / day
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Checkout button */}
            <div className="dash-buy-action-box">
              <button
                type="button"
                className="btn btn--primary btn--block btn--lg"
                disabled={loading || !hasSufficientBalance}
                onClick={handleBuy}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Deploying Mining Units...</span>
                  </>
                ) : hasSufficientBalance ? (
                  <>Purchase {blockCount} Blocks ({totalCost} USDT)</>
                ) : (
                  <>Insufficient Available Balance (Deposit USDT)</>
                )}
              </button>
              <span className="dash-micro-trust">
                <ShieldCheck size={13} /> Backed by operational Antminer S21 Pro capacity in Hall B.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Projected Yield Card */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div className="dash-card__title-wrap">
              <TrendingUp size={18} className="text-gold" />
              <h3>Projected Return Summary</h3>
            </div>
          </div>

          <div className="dash-projected-summary">
            <div className="dash-proj-row">
              <span>Hardware Allocation</span>
              <strong className="font-mono">{blockCount} Blocks (Antminer S21 Pro)</strong>
            </div>
            <div className="dash-proj-row">
              <span>Committed Principal</span>
              <strong className="font-mono text-white">{totalCost.toLocaleString()} USDT</strong>
            </div>
            <div className="dash-proj-row">
              <span>Lock-Up Maturity</span>
              <strong className="font-mono">{selectedTerm.days} Days</strong>
            </div>
            <div className="dash-proj-row">
              <span>Daily Rate</span>
              <strong className="font-mono text-success">+{selectedTerm.rate}% / day</strong>
            </div>

            <div className="dash-proj-divider" />

            <div className="dash-proj-total-box">
              <div className="dash-proj-kpi">
                <span>Daily Payout</span>
                <strong className="font-mono text-success">+{dailyYield.toFixed(2)} USDT</strong>
              </div>
              <div className="dash-proj-kpi">
                <span>Total Yield Return</span>
                <strong className="font-mono text-gold">+{totalReturn.toLocaleString()} USDT</strong>
              </div>
              <div className="dash-proj-kpi">
                <span>Net Protocol Profit</span>
                <strong className="font-mono text-emerald">+{netProfit.toLocaleString()} USDT</strong>
              </div>
            </div>

            <p className="dash-proj-note">
              Earnings are credited automatically to your account at 00:00 UTC daily. Upon reaching {selectedTerm.days} days, the principal unlocks in full.
            </p>
          </div>
        </div>
      </div>

      {/* Success Confirmation Dialog Modal */}
      {confirmedAllocation && (
        <SuccessConfirmationModal
          isOpen={true}
          title="Mining Allocation Deployed"
          subtitle={`Successfully allocated ${confirmedAllocation.blockCount} Antminer S21 Pro units to ${confirmedAllocation.batchName}.`}
          badge="Contract Active & Hashing"
          badgeType="emerald"
          icon={<Cpu size={28} />}
          details={[
            {
              label: "Allocated Units",
              value: `${confirmedAllocation.blockCount} Blocks (${confirmedAllocation.totalCost.toFixed(2)} USDT)`,
            },
            {
              label: "Maturity Lock-Up",
              value: `${confirmedAllocation.days} Days`,
            },
            {
              label: "Guaranteed Daily Yield",
              value: `+${confirmedAllocation.rate.toFixed(1)}% / day`,
              highlight: true,
            },
            {
              label: "Daily Payout Settlement",
              value: `+${confirmedAllocation.dailyYield.toFixed(2)} USDT / day`,
              highlight: true,
            },
            {
              label: "Total Projected Return",
              value: `${confirmedAllocation.totalReturn.toFixed(2)} USDT`,
            },
            {
              label: "First Distribution Cycle",
              value: "Next 00:00 UTC Settlement",
            },
          ]}
          note="Your Antminer units have been linked to your operator node. Daily mining rewards distribute automatically into your liquid balance."
          primaryActionLabel="View in Portfolio"
          onPrimaryAction={() => {
            if (onSelectTab) {
              onSelectTab("portfolio");
            }
          }}
          secondaryActionLabel="Allocate More Blocks"
          onSecondaryAction={() => {
            setConfirmedAllocation(null);
          }}
          onClose={() => setConfirmedAllocation(null)}
        />
      )}
    </div>
  );
}
