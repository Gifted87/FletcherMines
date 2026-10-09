"use client";

import { useState } from "react";
import { Check, Copy, Gift, UserPlus, Users, KeyRound, ShieldCheck } from "lucide-react";
import { UserDashboardData } from "@/lib/types/dashboard";

interface ReferralsTabProps {
  data: UserDashboardData;
}

export default function ReferralsTab({ data }: ReferralsTabProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(data.user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="dash-subtab-view">
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Gift size={13} /> AFFILIATE &amp; REFERRAL PROGRAM
          </div>
          <h2>Referral Network &amp; Bonus Blocks</h2>
          <p>
            Earn 50.00 USDT credited directly to your liquid ledger for each investor who joins with your referral code and activates a mining block.
          </p>
        </div>
        <span className="badge badge--gold">+50 USDT / Referral</span>
      </div>

      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-card__head">
            <span className="dash-metric-card__lbl">Total Active Referrals</span>
            <div className="dash-metric-card__icon icon--gold">
              <Users size={18} />
            </div>
          </div>
          <div className="dash-metric-card__num font-mono">
            {data.user.referralCount}{" "}
            <span className="dash-metric-card__unit">Miners</span>
          </div>
          <div className="dash-metric-card__foot">Registered with code {data.user.referralCode}</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-card__head">
            <span className="dash-metric-card__lbl">Referral Earnings</span>
            <div className="dash-metric-card__icon icon--emerald">
              <Gift size={18} />
            </div>
          </div>
          <div className="dash-metric-card__num font-mono text-gold">
            +{data.user.referralEarnings.toFixed(2)}{" "}
            <span className="dash-metric-card__unit">USDT</span>
          </div>
          <div className="dash-metric-card__foot">Credited automatically upon member registration</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__head">
          <div className="dash-card__title-wrap">
            <KeyRound size={18} className="text-gold" />
            <h3>Your Unique Referral Code</h3>
          </div>
          <span className="badge badge--cyan">Clearance Tier 1</span>
        </div>

        <div className="dash-ref-body">
          <p>
            Share your unique code with fellow miners. When they sign up on Fletcher Mines and input this code into the <strong>Referral Code (Optional)</strong> field, an instant 50.00 USDT welcome credit is unlocked for both accounts.
          </p>
          <div className="dash-ref-input-box">
            <input
              type="text"
              readOnly
              value={data.user.referralCode}
              className="font-mono text-gold"
              style={{ fontWeight: 700, letterSpacing: "0.08em", fontSize: "16px" }}
            />
            <button type="button" onClick={copyCode} className="btn btn--secondary btn--sm">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? "Code Copied!" : "Copy Code"}</span>
            </button>
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.55)",
            }}
          >
            <ShieldCheck size={14} className="text-gold" />
            <span>Referrals are tracked on-chain and credited to your liquid balance with zero lockup period.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
