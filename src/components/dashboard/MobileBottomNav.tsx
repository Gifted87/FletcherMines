"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  Wallet,
  CheckCircle2,
  Menu,
  X,
  Layers,
  User,
  ShieldCheck,
  LifeBuoy,
  Send,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { DashboardTab, UserDashboardData } from "@/lib/types/dashboard";

interface MobileBottomNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  data: UserDashboardData;
  onOpenSupport?: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
  data,
  onOpenSupport,
}: MobileBottomNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isMoreActive =
    activeTab === "portfolio" ||
    activeTab === "referrals" ||
    activeTab === "settings";

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <nav className="dash-mobile-nav" aria-label="Mobile Bottom Navigation">
        <div className="dash-mobile-nav__grid">
          {/* 1. Dashboard (Overview) */}
          <button
            type="button"
            className={`dash-mobile-nav__item ${activeTab === "dashboard" ? "is-active" : ""}`}
            onClick={() => onSelectTab("dashboard")}
            aria-label="Dashboard Overview"
          >
            <div className="dash-mobile-nav__icon-wrap">
              <LayoutDashboard size={20} />
            </div>
            <span className="dash-mobile-nav__label">Overview</span>
          </button>

          {/* 2. Buy Blocks */}
          <button
            type="button"
            className={`dash-mobile-nav__item ${activeTab === "buy-blocks" ? "is-active" : ""}`}
            onClick={() => onSelectTab("buy-blocks")}
            aria-label="Buy Mining Blocks"
          >
            <div className="dash-mobile-nav__icon-wrap">
              <Cpu size={20} />
              <span className="dash-mobile-dot" />
            </div>
            <span className="dash-mobile-nav__label">Buy Blocks</span>
          </button>

          {/* 3. Wallet */}
          <button
            type="button"
            className={`dash-mobile-nav__item ${activeTab === "wallet" ? "is-active" : ""}`}
            onClick={() => onSelectTab("wallet")}
            aria-label="Wallet & Ledger"
          >
            <div className="dash-mobile-nav__icon-wrap">
              <Wallet size={20} />
            </div>
            <span className="dash-mobile-nav__label">Wallet</span>
          </button>

          {/* 4. Daily Tasks */}
          <button
            type="button"
            className={`dash-mobile-nav__item ${activeTab === "daily-tasks" ? "is-active" : ""}`}
            onClick={() => onSelectTab("daily-tasks")}
            aria-label="Daily Node Tasks"
          >
            <div className="dash-mobile-nav__icon-wrap">
              <CheckCircle2 size={20} />
              {!data.dailyTask.completedToday && (
                <span className="dash-mobile-dot bg-amber pulse-anim" />
              )}
            </div>
            <span className="dash-mobile-nav__label">Daily Ping</span>
          </button>

          {/* 5. More Hub */}
          <button
            type="button"
            className={`dash-mobile-nav__item ${isMoreActive || showMoreMenu ? "is-active" : ""}`}
            onClick={() => setShowMoreMenu(true)}
            aria-label="More Features & Settings"
          >
            <div className="dash-mobile-nav__icon-wrap">
              <Menu size={20} />
            </div>
            <span className="dash-mobile-nav__label">More</span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          DEDICATED MOBILE "MORE" QUICK ACTION SHEET (< 769px)
          ========================================================================= */}
      {showMoreMenu && (
        <div className="mobile-sheet-backdrop" onClick={() => setShowMoreMenu(false)}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet__handle" />
            <div className="mobile-sheet__head">
              <div className="mobile-sheet__title-wrap">
                <Menu size={18} className="text-gold" />
                <h3>Navigation &amp; Services</h3>
              </div>
              <button
                type="button"
                className="mobile-sheet__close"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet__body">
              <div className="mobile-sheet-nav-list">
                {/* Portfolio */}
                <button
                  type="button"
                  className={`mobile-sheet-nav-item ${activeTab === "portfolio" ? "is-current" : ""}`}
                  onClick={() => {
                    onSelectTab("portfolio");
                    setShowMoreMenu(false);
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--cyan">
                    <Layers size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Mining Portfolio</strong>
                    <span>Review contract terms, maturity &amp; yields</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                {/* Referrals */}
                <button
                  type="button"
                  className={`mobile-sheet-nav-item ${activeTab === "referrals" ? "is-current" : ""}`}
                  onClick={() => {
                    onSelectTab("referrals");
                    setShowMoreMenu(false);
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--gold">
                    <User size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Affiliate Network (+50 USDT)</strong>
                    <span>Share referral link &amp; track earnings</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                {/* Security & 2FA */}
                <button
                  type="button"
                  className={`mobile-sheet-nav-item ${activeTab === "settings" ? "is-current" : ""}`}
                  onClick={() => {
                    onSelectTab("settings");
                    setShowMoreMenu(false);
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--emerald">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Security &amp; Credentials</strong>
                    <span>Update password, 2FA &amp; KYC verification</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                {/* Support Desk */}
                {onOpenSupport && (
                  <button
                    type="button"
                    className="mobile-sheet-nav-item"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenSupport();
                    }}
                  >
                    <div className="mobile-sheet-nav-icon icon--blue">
                      <LifeBuoy size={18} />
                    </div>
                    <div className="mobile-sheet-nav-info">
                      <strong>Priority Support Desk</strong>
                      <span>Direct ticket submission to treasury</span>
                    </div>
                    <ChevronRight size={16} className="text-muted" />
                  </button>
                )}

                {/* Telegram */}
                <a
                  href="https://t.me/fletchermines"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-sheet-nav-item"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <div className="mobile-sheet-nav-icon icon--blue">
                    <Send size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Official Telegram Channel</strong>
                    <span>Real-time announcements &amp; ASIC telemetry</span>
                  </div>
                  <ExternalLink size={14} className="text-muted" />
                </a>
              </div>
            </div>

            <div className="mobile-sheet__footer">
              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn--block btn--danger"
                style={{ justifyContent: "center", gap: "8px" }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
