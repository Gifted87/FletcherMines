"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  Copy,
  Gift,
  Lock,
  QrCode,
  TrendingUp,
  Wallet,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { UserDashboardData } from "@/lib/types/dashboard";
import SuccessConfirmationModal from "../modals/SuccessConfirmationModal";

interface WalletTabProps {
  data: UserDashboardData;
  onRefresh: () => void;
}

export default function WalletTab({ data, onRefresh }: WalletTabProps) {
  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositNetwork, setDepositNetwork] = useState<"TRC20" | "ERC20">("TRC20");
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500");
  const [txHashInput, setTxHashInput] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Confirmation modals state
  const [confirmedDeposit, setConfirmedDeposit] = useState<{
    amount: number;
    network: string;
    vaultAddress: string;
    txHash: string;
  } | null>(null);

  const [confirmedWithdrawal, setConfirmedWithdrawal] = useState<{
    amount: number;
    fee: number;
    netPayout: number;
    address: string;
    network: string;
  } | null>(null);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawNetwork, setWithdrawNetwork] = useState<"TRC20" | "ERC20">("TRC20");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("100");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Filter state for ledger
  const [txFilter, setTxFilter] = useState<string>("all");

  const depositAddressTRC20 = "TFletcherMinesTreasuryVault99214Xk";
  const depositAddressERC20 = "0x89205A3A3b2A5538804eD664619d854cEb245906";
  const activeDepositAddress = depositNetwork === "TRC20" ? depositAddressTRC20 : depositAddressERC20;

  const copyDeposit = () => {
    navigator.clipboard.writeText(activeDepositAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      setDepositError("Please enter a valid USDT amount.");
      return;
    }
    setSubmittingDeposit(true);
    setDepositError(null);
    setDepositSuccess(null);

    try {
      const res = await fetch("/api/dashboard/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          amount: amt,
          network: depositNetwork,
          txHash: txHashInput || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || "Failed to submit deposit.");
      }

      setConfirmedDeposit({
        amount: amt,
        network: depositNetwork,
        vaultAddress: activeDepositAddress,
        txHash: resData.txHash,
      });
      setShowDepositModal(false);
      setTxHashInput("");
      onRefresh();
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawError("Please enter a valid withdrawal amount.");
      return;
    }

    if (!withdrawAddress.trim() || withdrawAddress.length < 10) {
      setWithdrawError("Please enter a valid recipient wallet address.");
      return;
    }

    if (amt > data.metrics.availableBalance) {
      setWithdrawError(`Insufficient liquid balance. Available: ${data.metrics.availableBalance.toFixed(2)} USDT.`);
      return;
    }

    setSubmittingWithdraw(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      const res = await fetch("/api/dashboard/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          amount: amt,
          address: withdrawAddress,
          network: withdrawNetwork,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || "Failed to process withdrawal.");
      }

      setConfirmedWithdrawal({
        amount: amt,
        fee: amt * 0.01,
        netPayout: Number(resData.netPayout),
        address: withdrawAddress,
        network: withdrawNetwork,
      });
      setShowWithdrawModal(false);
      setWithdrawAddress("");
      onRefresh();
    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : "Withdrawal error.");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Filter transactions
  const filteredTxs = data.recentTransactions.filter((tx) => {
    if (txFilter === "all") return true;
    if (txFilter === "deposits") return tx.type === "deposit";
    if (txFilter === "withdrawals") return tx.type === "withdrawal";
    if (txFilter === "yields") return tx.type === "daily_yield";
    if (txFilter === "blocks") return tx.type === "block_purchase";
    return true;
  });

  return (
    <div className="dash-subtab-view">
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Wallet size={13} /> TREASURY &amp; LEDGER
          </div>
          <h2>Multi-Asset Wallet &amp; Balances</h2>
          <p className="dash-subtab-desc">
            Manage your liquid available balance, locked capital in mining blocks, manual deposit requests, and full ledger history.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setShowWithdrawModal(true)}
          >
            <ArrowUpRight size={14} />
            <span>Withdraw USDT</span>
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setShowDepositModal(true)}
          >
            <ArrowDownLeft size={14} />
            <span>Deposit USDT</span>
          </button>
        </div>
      </div>

      {/* Financial Health Cards */}
      <div className="dash-wallet-cards">
        <div className="dash-wallet-card">
          <div className="dash-wallet-card__label">
            <Wallet size={16} /> Available Balance (Liquid)
          </div>
          <div className="dash-wallet-card__val font-mono">
            ${data.metrics.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="dash-wallet-card__hint">
            Fully liquid and available for instant block allocation or payout withdrawal.
          </p>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setShowDepositModal(true)}
            >
              + Deposit
            </button>
          </div>
        </div>

        <div className="dash-wallet-card">
          <div className="dash-wallet-card__label">
            <Lock size={16} /> Locked in Mining Contracts
          </div>
          <div className="dash-wallet-card__val font-mono text-emerald">
            ${data.metrics.lockedBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="dash-wallet-card__hint">
            Committed to active ASIC hardware. Principal unlocks upon contract maturity schedule.
          </p>
        </div>

        <div className="dash-wallet-card">
          <div className="dash-wallet-card__label">
            <TrendingUp size={16} /> Projected Daily Yield
          </div>
          <div className="dash-wallet-card__val font-mono text-gold">
            +${data.metrics.projectedDailyReturn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="dash-wallet-card__hint">
            Credited automatically at 00:00 UTC daily across your active physical hardware blocks.
          </p>
        </div>
      </div>

      {/* Complete Ledger History with Filter Switcher */}
      <div className="dash-card">
        <div className="dash-card__head">
          <div>
            <h3>Complete Ledger History</h3>
            <p className="text-muted text-sm">All cryptographic deposits, yield releases, and block allocations.</p>
          </div>
          <div className="dash-pill-switcher">
            <button
              type="button"
              className={txFilter === "all" ? "is-active" : ""}
              onClick={() => setTxFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={txFilter === "deposits" ? "is-active" : ""}
              onClick={() => setTxFilter("deposits")}
            >
              Deposits
            </button>
            <button
              type="button"
              className={txFilter === "withdrawals" ? "is-active" : ""}
              onClick={() => setTxFilter("withdrawals")}
            >
              Withdrawals
            </button>
            <button
              type="button"
              className={txFilter === "yields" ? "is-active" : ""}
              onClick={() => setTxFilter("yields")}
            >
              Yields
            </button>
            <button
              type="button"
              className={txFilter === "blocks" ? "is-active" : ""}
              onClick={() => setTxFilter("blocks")}
            >
              Blocks
            </button>
          </div>
        </div>

        <div className="dash-tx-table-wrap">
          <table className="dash-tx-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Transaction Hash</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-muted">
                    No ledger entries match this category.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const isPositive = tx.type === "deposit" || tx.type === "daily_yield" || tx.type === "referral_bonus";
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="dash-tx-type">
                          {tx.type === "deposit" ? (
                            <span className="dash-tx-icon dash-tx-icon--in"><ArrowDownLeft size={14} /></span>
                          ) : tx.type === "block_purchase" ? (
                            <span className="dash-tx-icon dash-tx-icon--out"><Box size={14} /></span>
                          ) : tx.type === "referral_bonus" ? (
                            <span className="dash-tx-icon dash-tx-icon--bonus"><Gift size={14} /></span>
                          ) : (
                            <span className="dash-tx-icon dash-tx-icon--in"><ArrowUpRight size={14} /></span>
                          )}
                          <span className="capitalize">{tx.type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-muted">{tx.txHash}</td>
                      <td>{tx.description}</td>
                      <td>
                        <span className={`dash-badge ${tx.status === "completed" ? "dash-badge--emerald" : "dash-badge--amber"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`text-right font-mono font-bold ${isPositive ? "text-emerald" : "text-danger"}`}>
                        {isPositive ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowDepositModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__head">
              <h3>Manual USDT Deposit</h3>
              <p>Transfer USDT to the designated Fletcher Mines cold treasury address below.</p>
            </div>
            <div className="dash-deposit-box">
              {/* Network Selector */}
              <div style={{ display: "flex", gap: "8px", width: "100%", marginBottom: "14px" }}>
                <button
                  type="button"
                  className={`btn btn--sm flex-1 ${depositNetwork === "TRC20" ? "btn--primary" : "btn--secondary"}`}
                  onClick={() => setDepositNetwork("TRC20")}
                >
                  TRC-20 (Tron) - Fast
                </button>
                <button
                  type="button"
                  className={`btn btn--sm flex-1 ${depositNetwork === "ERC20" ? "btn--primary" : "btn--secondary"}`}
                  onClick={() => setDepositNetwork("ERC20")}
                >
                  ERC-20 (Ethereum)
                </button>
              </div>

              <div className="dash-deposit-qr-wrap">
                <QrCode size={110} />
              </div>
              <span className="dash-lbl">{depositNetwork} Treasury Vault Address</span>
              <div className="dash-ref-input-box">
                <input type="text" readOnly value={activeDepositAddress} className="font-mono text-center text-xs" />
                <button type="button" onClick={copyDeposit} className="btn btn--secondary btn--sm">
                  {copiedAddr ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedAddr ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="dash-deposit-form">
                <div className="dash-field-group">
                  <label htmlFor="deposit-amount" className="dash-lbl">Deposit Amount (USDT)</label>
                  <input
                    id="deposit-amount"
                    type="number"
                    min="10"
                    step="10"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="dash-input font-mono"
                    placeholder="e.g. 500"
                    required
                  />
                </div>

                <div className="dash-field-group">
                  <label htmlFor="deposit-txhash" className="dash-lbl">Blockchain TX Hash / TxID (Optional)</label>
                  <input
                    id="deposit-txhash"
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    className="dash-input font-mono text-xs"
                    placeholder="e.g. 0x8f2a... or leave blank for auto-tag"
                  />
                </div>

                {depositError && (
                  <div className="dash-alert dash-alert--amber text-xs">{depositError}</div>
                )}

                {depositSuccess && (
                  <div className="dash-alert dash-alert--emerald text-xs">{depositSuccess}</div>
                )}

                <p className="dash-deposit-note">
                  Manual deposits are verified by the treasury team. Average turnaround is under 45 minutes.
                </p>

                <div className="auth-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setShowDepositModal(false)}
                    disabled={submittingDeposit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={submittingDeposit}
                  >
                    {submittingDeposit ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Submitting to Database...
                      </>
                    ) : (
                      "Submit Deposit Record"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowWithdrawModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__head">
              <h3>Withdraw USDT to External Wallet</h3>
              <p>Disburse liquid USDT from your available balance directly to your cold storage or exchange address.</p>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="dash-deposit-form">
              {/* Network Selector */}
              <div style={{ display: "flex", gap: "8px", width: "100%", marginBottom: "12px" }}>
                <button
                  type="button"
                  className={`btn btn--sm flex-1 ${withdrawNetwork === "TRC20" ? "btn--primary" : "btn--secondary"}`}
                  onClick={() => setWithdrawNetwork("TRC20")}
                >
                  TRC-20 (Tron)
                </button>
                <button
                  type="button"
                  className={`btn btn--sm flex-1 ${withdrawNetwork === "ERC20" ? "btn--primary" : "btn--secondary"}`}
                  onClick={() => setWithdrawNetwork("ERC20")}
                >
                  ERC-20 (Ethereum)
                </button>
              </div>

              <div className="dash-field-group">
                <label className="dash-lbl">Destination Wallet Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="dash-input font-mono text-xs"
                  placeholder={withdrawNetwork === "TRC20" ? "e.g. T..." : "e.g. 0x..."}
                  required
                />
              </div>

              <div className="dash-field-group">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label className="dash-lbl">Amount to Withdraw (USDT)</label>
                  <span className="text-muted text-xs">
                    Available: <strong className="font-mono text-white">{data.metrics.availableBalance.toFixed(2)} USDT</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="20"
                  step="1"
                  max={data.metrics.availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="dash-input font-mono"
                  placeholder="e.g. 100"
                  required
                />
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span className="text-muted">Network Processing Fee (1.0%):</span>
                  <span className="font-mono text-white">${((parseFloat(withdrawAmount) || 0) * 0.01).toFixed(2)} USDT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Net Payout to Address:</span>
                  <strong className="font-mono text-emerald">
                    ${Math.max(0, (parseFloat(withdrawAmount) || 0) * 0.99).toFixed(2)} USDT
                  </strong>
                </div>
              </div>

              {withdrawError && (
                <div className="dash-alert dash-alert--amber text-xs">{withdrawError}</div>
              )}

              {withdrawSuccess && (
                <div className="dash-alert dash-alert--emerald text-xs">{withdrawSuccess}</div>
              )}

              <p className="dash-deposit-note">
                <ShieldCheck size={12} className="inline mr-1 text-emerald" />
                Minimum withdrawal threshold is 20.00 USDT. Outbound payouts are processed by institutional treasury batches.
              </p>

              <div className="auth-modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={submittingWithdraw}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submittingWithdraw || data.metrics.availableBalance < 20}
                >
                  {submittingWithdraw ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting Cashout...
                    </>
                  ) : (
                    "Authorize Withdrawal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Confirmation Dialog Modal */}
      {confirmedDeposit && (
        <SuccessConfirmationModal
          isOpen={true}
          title="Deposit Submitted for Verification"
          subtitle={`Your ${confirmedDeposit.amount.toFixed(2)} USDT transfer has been recorded and submitted to the Treasury desk.`}
          badge="Treasury Verification Pending"
          badgeType="gold"
          icon={<ArrowDownLeft size={28} />}
          details={[
            {
              label: "Deposit Amount",
              value: `${confirmedDeposit.amount.toFixed(2)} USDT`,
              highlight: true,
            },
            {
              label: "Network Standard",
              value: `${confirmedDeposit.network} (USDT)`,
            },
            {
              label: "Receiving Vault",
              value: `${confirmedDeposit.vaultAddress.substring(0, 10)}...${confirmedDeposit.vaultAddress.slice(-6)}`,
            },
            {
              label: "Reference / TX Hash",
              value: confirmedDeposit.txHash,
            },
            {
              label: "Settlement SLA",
              value: "2-10 Minutes (3 Confirmations)",
            },
          ]}
          note="Our automated treasury engine continuously reconciles incoming blockchain transactions. Once confirmed, your liquid balance is automatically updated."
          primaryActionLabel="View Transaction History"
          onPrimaryAction={() => {
            setTxFilter("deposits");
            setConfirmedDeposit(null);
          }}
          secondaryActionLabel="Close Window"
          onSecondaryAction={() => setConfirmedDeposit(null)}
          onClose={() => setConfirmedDeposit(null)}
        />
      )}

      {/* Withdrawal Confirmation Dialog Modal */}
      {confirmedWithdrawal && (
        <SuccessConfirmationModal
          isOpen={true}
          title="Withdrawal Request Dispatched"
          subtitle={`Withdrawal request for ${confirmedWithdrawal.amount.toFixed(2)} USDT has been queued for security clearance.`}
          badge="Clearance Queued"
          badgeType="cyan"
          icon={<ArrowUpRight size={28} />}
          details={[
            {
              label: "Gross Amount",
              value: `${confirmedWithdrawal.amount.toFixed(2)} USDT`,
            },
            {
              label: "Protocol Fee (1%)",
              value: `${confirmedWithdrawal.fee.toFixed(2)} USDT`,
            },
            {
              label: "Net Payout Amount",
              value: `${confirmedWithdrawal.netPayout.toFixed(2)} USDT`,
              highlight: true,
            },
            {
              label: "Network Standard",
              value: `${confirmedWithdrawal.network} (USDT)`,
            },
            {
              label: "Destination Address",
              value: `${confirmedWithdrawal.address.substring(0, 10)}...${confirmedWithdrawal.address.slice(-6)}`,
            },
            {
              label: "Security SLA",
              value: "Processed within 24 Hours",
            },
          ]}
          note="Withdrawals undergo multi-signature cold storage authorization and automated AML validation before on-chain dispatch."
          primaryActionLabel="Acknowledge & Close"
          onPrimaryAction={() => {
            setTxFilter("withdrawals");
            setConfirmedWithdrawal(null);
          }}
          onClose={() => setConfirmedWithdrawal(null)}
        />
      )}
    </div>
  );
}

