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
  AlertTriangle,
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
  const depositNetwork = "TRC20";
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
  const withdrawNetwork = "TRC20";
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("1000");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const minWithdrawalAmount = 1000;
  const isWithdrawalLocked = (data.metrics.lockedBalance > 0) || ((data.metrics.activeContractsCount ?? 0) > 0);

  // Filter state for ledger
  const [txFilter, setTxFilter] = useState<string>("all");

  const depositAddressTRC20 = "TKesHy9pJLnK3HkdZkREJzwuo9by1CYXEr";
  const activeDepositAddress = depositAddressTRC20;

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

    if (isWithdrawalLocked) {
      setWithdrawError(
        `Withdrawals restricted: You currently have $${data.metrics.lockedBalance.toFixed(2)} USDT locked in active mining contracts. You cannot withdraw until all allocations reach full maturity at the end of the run.`
      );
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < minWithdrawalAmount) {
      setWithdrawError(`Minimum withdrawal amount is ${minWithdrawalAmount.toLocaleString()} USDT ($1,000.00).`);
      return;
    }

    if (!withdrawAddress.trim() || withdrawAddress.length < 10) {
      setWithdrawError("Please enter a valid recipient wallet address.");
      return;
    }

    if (!withdrawAddress.trim().startsWith("T")) {
      setWithdrawError("Invalid TRON address. All TRC-20 addresses must begin with 'T' (No ERC-20 supported).");
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
            {isWithdrawalLocked ? <Lock size={14} className="text-gold" /> : <ArrowUpRight size={14} />}
            <span>{isWithdrawalLocked ? "Withdrawals Locked" : "Withdraw USDT"}</span>
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
            {isWithdrawalLocked
              ? `Notice: Withdrawals are locked while you have $${data.metrics.lockedBalance.toFixed(2)} USDT in active contracts until the end of the run.`
              : "Fully liquid and available for instant block allocation or payout withdrawal (min. $1,000.00 USDT)."}
          </p>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setShowWithdrawModal(true)}
            >
              {isWithdrawalLocked ? "Withdraw (Locked)" : "Withdraw"}
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
              {/* Exclusive TRC-20 Network Badge */}
              <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "14px" }}>
                <span className="badge badge--gold" style={{ fontSize: "11px", letterSpacing: "0.08em" }}>
                  TRON NETWORK (TRC-20) EXCLUSIVE
                </span>
              </div>

              {/* QR Code Barcode Presentation */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" }}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "10px",
                    borderRadius: "16px",
                    border: "2px solid #f5a623",
                    boxShadow: "0 0 24px rgba(245, 166, 35, 0.25)",
                  }}
                >
                  <img
                    src="/trx_deposit_qr.png"
                    alt="TRON Network Deposit QR Code"
                    style={{ width: "160px", height: "160px", display: "block", borderRadius: "8px" }}
                  />
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "999px",
                    padding: "4px 12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fca5a5",
                    letterSpacing: "0.06em",
                  }}
                >
                  <AlertTriangle size={13} className="text-danger" />
                  <span>TRON NETWORK (TRC-20) ONLY — NO ERC-20</span>
                </div>
              </div>

              {/* Network Warning Alert Box */}
              <div
                style={{
                  width: "100%",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "14px",
                  fontSize: "12px",
                  lineHeight: 1.45,
                  color: "rgba(255, 255, 255, 0.85)",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#f87171", marginBottom: "3px" }}>
                  <AlertCircle size={14} />
                  <span>CRITICAL NETWORK NOTICE</span>
                </div>
                This deposit vault operates exclusively on the <strong>TRON (TRC-20) network</strong>. Do NOT send funds via Ethereum (ERC-20), BNB Smart Chain, Polygon, or Arbitrum. Non-TRC20 transfers are unrecoverable.
              </div>

              <span className="dash-lbl">TRC-20 Treasury Vault Address</span>
              <div className="dash-ref-input-box">
                <input
                  type="text"
                  readOnly
                  value={activeDepositAddress}
                  className="font-mono text-center text-xs text-gold"
                  style={{ fontWeight: 600, letterSpacing: "0.03em" }}
                />
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
              {/* Exclusive TRC-20 Withdrawal Network Badge */}
              <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "14px" }}>
                <span className="badge badge--gold" style={{ fontSize: "11px", letterSpacing: "0.06em" }}>
                  DISBURSEMENT NETWORK: TRON (TRC-20) EXCLUSIVE
                </span>
              </div>

              {/* Locked Active Run Warning Banner */}
              {isWithdrawalLocked && (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <Lock size={20} className="text-gold" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "12.5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      WITHDRAWALS LOCKED — ACTIVE RUN IN PROGRESS
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", lineHeight: "1.5", color: "var(--text-2)" }}>
                      You currently have <strong className="font-mono text-white">${data.metrics.lockedBalance.toFixed(2)} USDT</strong> locked across {data.metrics.activeContractsCount || 1} active mining contract(s). 
                      Under platform policy, accounts with locked contract capital cannot execute withdrawals until all active allocations reach full maturity at the end of the run.
                    </p>
                  </div>
                </div>
              )}

              {/* Available Balance Minimum Notice */}
              {data.metrics.availableBalance < 1000 && !isWithdrawalLocked && (
                <div
                  style={{
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <AlertCircle size={16} className="text-cyan-400" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
                    Minimum withdrawal threshold is <strong>1,000.00 USDT</strong>. Your current available liquid balance is <strong className="font-mono text-white">${data.metrics.availableBalance.toFixed(2)} USDT</strong>.
                  </span>
                </div>
              )}

              <div className="dash-field-group">
                <label className="dash-lbl">Recipient TRC-20 Wallet Address (Must start with 'T')</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  disabled={isWithdrawalLocked}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="dash-input font-mono text-xs"
                  placeholder="e.g. TKesHy9pJLnK3HkdZkREJzwuo9by1CYXEr"
                  required
                />
              </div>

              <div className="dash-field-group">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label className="dash-lbl">Amount to Withdraw (USDT - Min. 1,000.00)</label>
                  <span className="text-muted text-xs">
                    Available: <strong className="font-mono text-white">{data.metrics.availableBalance.toFixed(2)} USDT</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1000"
                  step="1"
                  disabled={isWithdrawalLocked}
                  max={data.metrics.availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="dash-input font-mono"
                  placeholder="e.g. 1000"
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
                Minimum withdrawal threshold is 1,000.00 USDT. If any capital is locked in active mining contracts, withdrawals are prohibited until the end of the run. Outbound payouts are processed exclusively via TRON (TRC-20) treasury batches.
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
                  disabled={submittingWithdraw || isWithdrawalLocked || data.metrics.availableBalance < 1000}
                >
                  {submittingWithdraw ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting Cashout...
                    </>
                  ) : isWithdrawalLocked ? (
                    "Withdrawals Locked (Run in Progress)"
                  ) : data.metrics.availableBalance < 1000 ? (
                    "Minimum 1,000.00 USDT Required"
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

