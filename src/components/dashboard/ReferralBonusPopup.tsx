"use client";

import { useEffect, useState } from "react";
import { Gift, X, Copy, Check, Users, Sparkles, ArrowRight } from "lucide-react";

interface ReferralBonusPopupProps {
  referralCode: string;
  onGoToReferrals: () => void;
}

export default function ReferralBonusPopup({
  referralCode,
  onGoToReferrals,
}: ReferralBonusPopupProps) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if dismissed during current session
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem("fm_ref_promo_dismissed");
      if (isDismissed) {
        setClosed(true);
        return;
      }
    }

    // Trigger floating promo after 1.5s
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fm_ref_promo_dismissed", "true");
    }
    setTimeout(() => setClosed(true), 350);
  };

  const handleCopyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNavigate = () => {
    handleDismiss();
    onGoToReferrals();
  };

  if (closed) return null;

  return (
    <div
      className="dash-ref-popup"
      style={{
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(24, 28, 36, 0.98) 0%, rgba(14, 17, 22, 0.98) 100%)",
          border: "1px solid rgba(245, 166, 35, 0.35)",
          borderRadius: "16px",
          padding: "24px 20px 20px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(245, 166, 35, 0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss referral notification"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        {/* Header Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(245, 166, 35, 0.15)",
              border: "1px solid rgba(245, 166, 35, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f5a623",
              flexShrink: 0,
            }}
          >
            <Gift size={18} />
          </div>
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#f5a623",
              }}
            >
              <Sparkles size={11} /> AFFILIATE REWARD
            </span>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#ffffff",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Earn +50.00 USDT per Referral
            </h4>
          </div>
        </div>

        {/* Promo Body */}
        <p
          style={{
            fontSize: "12.5px",
            lineHeight: 1.5,
            color: "rgba(255, 255, 255, 0.7)",
            margin: "0 0 14px",
          }}
        >
          Share your operator code with fellow miners. When they register and deploy hardware, an instant{" "}
          <strong style={{ color: "#f5a623" }}>50.00 USDT</strong> is credited directly to your liquid balance.
        </p>

        {/* Code Box */}
        <div
          style={{
            background: "rgba(10, 13, 16, 0.8)",
            border: "1px solid rgba(245, 166, 35, 0.25)",
            borderRadius: "10px",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.45)" }}>
              Your Referral Code
            </span>
            <strong
              className="font-mono"
              style={{ fontSize: "15px", color: "#f5a623", letterSpacing: "0.05em" }}
            >
              {referralCode}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn--secondary btn--sm"
            style={{ fontSize: "12px", padding: "6px 10px" }}
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        {/* Action Row */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleNavigate}
            className="btn btn--primary btn--sm"
            style={{ flex: 1, justifyContent: "center", fontSize: "12px", height: "36px" }}
          >
            <Users size={13} />
            <span>Referrals Hub</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn--ghost btn--sm"
            style={{ fontSize: "12px", height: "36px", padding: "0 12px" }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
