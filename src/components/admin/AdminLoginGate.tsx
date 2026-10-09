"use client";

import { useState } from "react";
import { Lock, ShieldAlert, KeyRound, Loader2, Terminal, ArrowRight } from "lucide-react";

interface AdminLoginGateProps {
  onSuccess?: () => void;
}

export default function AdminLoginGate({ onSuccess }: AdminLoginGateProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Please enter the Master Admin Security Key.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Access denied.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 20%, rgba(245, 166, 35, 0.08) 0%, #0d0f12 70%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "rgba(18, 22, 28, 0.95)",
          border: "1px solid rgba(245, 166, 35, 0.25)",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 166, 35, 0.08)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(245, 166, 35, 0.12)",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#f5a623",
            }}
          >
            <Terminal size={28} />
          </div>
          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5a623",
              background: "rgba(245, 166, 35, 0.1)",
              padding: "4px 10px",
              borderRadius: "999px",
              marginBottom: "8px",
            }}
          >
            RESTRICTED INFRASTRUCTURE ACCESS
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#ffffff",
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
            }}
          >
            Fletcher Mines Admin OS
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
            Master clearance terminal for mining drops, treasury balances, and operator management.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "22px" }}>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Master Admin Security Key
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(10, 13, 16, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "0 14px",
                height: "48px",
                transition: "border-color 0.2s ease",
              }}
            >
              <KeyRound size={17} style={{ color: "#f5a623", marginRight: "10px", flexShrink: 0 }} />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master admin password..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  width: "100%",
                  fontFamily: "monospace",
                }}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "10px",
              background: "#f5a623",
              color: "#0a0d10",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.15s ease, opacity 0.15s ease",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Verifying Security Key...</span>
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>Unlock Command Terminal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "18px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "monospace" }}>
            SECURITY LOG: ENCRYPTED HTTPS CLEARANCE LEVEL 4
          </span>
        </div>
      </div>
    </div>
  );
}
