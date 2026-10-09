"use client";

import { CheckCircle2, ShieldCheck, ArrowRight, X, ExternalLink } from "lucide-react";

export interface ConfirmationDetailItem {
  label: string;
  value: string;
  highlight?: boolean;
  isMono?: boolean;
}

export interface SuccessConfirmationModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: "emerald" | "gold" | "cyan";
  icon?: React.ReactNode;
  details: ConfirmationDetailItem[];
  note?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onClose: () => void;
}

export default function SuccessConfirmationModal({
  isOpen,
  title,
  subtitle,
  badge = "Transaction Confirmed",
  badgeType = "emerald",
  icon,
  details,
  note,
  primaryActionLabel = "Acknowledge & Continue",
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onClose,
}: SuccessConfirmationModalProps) {
  if (!isOpen) return null;

  const badgeColorClass =
    badgeType === "gold"
      ? "badge--gold"
      : badgeType === "cyan"
      ? "badge--cyan"
      : "badge--emerald";

  return (
    <div className="auth-modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "520px",
          border: "1px solid rgba(245, 166, 35, 0.35)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 35px rgba(245, 166, 35, 0.12)",
          padding: "28px 24px",
        }}
      >
        {/* Close button in top-right */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          <X size={18} />
        </button>

        {/* Header with animated icon */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background:
                badgeType === "emerald"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(245, 166, 35, 0.15)",
              border:
                badgeType === "emerald"
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid rgba(245, 166, 35, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: badgeType === "emerald" ? "#10b981" : "#f5a623",
              boxShadow: "0 0 24px rgba(245, 166, 35, 0.15)",
            }}
          >
            {icon || <CheckCircle2 size={30} />}
          </div>

          <div style={{ marginBottom: "8px" }}>
            <span className={`badge ${badgeColorClass}`} style={{ fontSize: "11px", letterSpacing: "0.08em" }}>
              {badge}
            </span>
          </div>

          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#ffffff",
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>

          {subtitle && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Detailed Breakdown Box */}
        <div
          style={{
            background: "rgba(10, 13, 16, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "16px 18px",
            marginBottom: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {details.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                borderBottom:
                  idx === details.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
                paddingBottom: idx === details.length - 1 ? "0" : "10px",
              }}
            >
              <span style={{ color: "rgba(255, 255, 255, 0.55)" }}>{item.label}</span>
              <span
                className={item.isMono !== false ? "font-mono" : ""}
                style={{
                  fontWeight: 600,
                  color: item.highlight ? "#f5a623" : "#ffffff",
                  textAlign: "right",
                  maxWidth: "60%",
                  wordBreak: "break-all",
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Reassurance note */}
        {note && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              background: "rgba(245, 166, 35, 0.08)",
              border: "1px solid rgba(245, 166, 35, 0.2)",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "20px",
              lineHeight: 1.45,
            }}
          >
            <ShieldCheck size={16} style={{ color: "#f5a623", flexShrink: 0, marginTop: "1px" }} />
            <span>{note}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {secondaryActionLabel && (
            <button
              type="button"
              className="btn btn--ghost"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => {
                if (onSecondaryAction) onSecondaryAction();
                onClose();
              }}
            >
              {secondaryActionLabel}
            </button>
          )}

          <button
            type="button"
            className="btn btn--primary"
            style={{ flex: 1, justifyContent: "center", gap: "6px" }}
            onClick={() => {
              if (onPrimaryAction) onPrimaryAction();
              onClose();
            }}
          >
            <span>{primaryActionLabel}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
