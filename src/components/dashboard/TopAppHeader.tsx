"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  User,
  Wallet,
  X,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Send,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Cpu,
} from "lucide-react";
import Logo from "@/components/Logo";
import { UserDashboardData, DashboardTab } from "@/lib/types/dashboard";

interface TopAppHeaderProps {
  data: UserDashboardData;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenSupport: () => void;
}

export default function TopAppHeader({
  data,
  onSelectTab,
  onOpenSupport,
}: TopAppHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const initials = data.user.username.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  const copyReferralCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(data.user.referralCode);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <>
      <header className="dash-header">
        <div className="dash-header__inner container">
          {/* Left: Logo & Telemetry Pill */}
          <div className="dash-header__left">
            <Logo href="/dashboard" />
            <div className="dash-status-pill desktop-only">
              <span className="pulse-dot" />
              <span>FM-NODE-01 · 99.98% Uptime</span>
            </div>
          </div>

          {/* Right: Balance Chip, Notifications, Support, Profile */}
          <div className="dash-header__right">
            {/* Interactive Wallet Balance Chip */}
            <button
              type="button"
              className="dash-balance-chip"
              onClick={() => onSelectTab("wallet")}
              title="Click to view Wallet details"
            >
              <div className="dash-balance-chip__icon">
                <Wallet size={16} />
              </div>
              <div className="dash-balance-chip__info">
                <span className="dash-balance-chip__label desktop-only">Available</span>
                <span className="dash-balance-chip__val font-mono">
                  {data.metrics.availableBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-gold">USDT</span>
                </span>
              </div>
              <div className="dash-balance-chip__locked desktop-only">
                <span>Locked:</span>
                <span className="font-mono">
                  {data.metrics.lockedBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  USDT
                </span>
              </div>
            </button>

            {/* Support Icon (Desktop) */}
            <button
              type="button"
              className="dash-icon-btn desktop-only"
              onClick={onOpenSupport}
              title="Contact Support"
              aria-label="Support Desk"
            >
              <LifeBuoy size={18} />
            </button>

            {/* Notifications Anchor */}
            <div className="dash-popover-anchor">
              <button
                type="button"
                className="dash-icon-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="dash-notif-badge">2</span>
              </button>

              {/* Desktop Floating Notifications Popover */}
              {showNotifications && (
                <div className="dash-notif-popover desktop-only">
                  <div className="dash-notif-popover__head">
                    <h4>Account Alerts</h4>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="dash-close-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="dash-notif-list">
                    <div className="dash-notif-item">
                      <span className="dash-notif-dot bg-amber" />
                      <div>
                        <strong>Pending Deposit Verification</strong>
                        <p>Your 1,000.00 USDT manual deposit is being audited by treasury.</p>
                        <span className="dash-notif-time">35m ago</span>
                      </div>
                    </div>
                    <div className="dash-notif-item">
                      <span className="dash-notif-dot bg-emerald" />
                      <div>
                        <strong>Batch 05 Live Allocation</strong>
                        <p>887 / 1,000 blocks claimed. Limited remaining capacity.</p>
                        <span className="dash-notif-time">1h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown */}
            <div className="dash-popover-anchor">
              <button
                type="button"
                className="dash-avatar-btn"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                title="User Account Menu"
                aria-label="User Account"
              >
                <span className="dash-avatar-initials">{initials}</span>
                <span className="dash-avatar-badge">Tier 1</span>
              </button>

              {/* Desktop Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="dash-profile-menu desktop-only">
                  <div className="dash-profile-menu__user">
                    <strong>{data.user.username}</strong>
                    <span>{data.user.email}</span>
                  </div>
                  <div className="dash-profile-menu__divider" />
                  <button
                    type="button"
                    className="dash-menu-item"
                    onClick={() => {
                      onSelectTab("settings");
                      setShowProfileMenu(false);
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Security &amp; 2FA</span>
                  </button>
                  <button
                    type="button"
                    className="dash-menu-item"
                    onClick={() => {
                      onSelectTab("referrals");
                      setShowProfileMenu(false);
                    }}
                  >
                    <User size={16} />
                    <span>Affiliate Network</span>
                  </button>
                  <Link href="/terms" target="_blank" className="dash-menu-item">
                    <ExternalLink size={16} />
                    <span>Terms &amp; Risk</span>
                  </Link>
                  <div className="dash-profile-menu__divider" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="dash-menu-item text-danger"
                    style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          DEDICATED MOBILE NOTIFICATIONS BOTTOM SHEET (< 769px)
          ========================================================================= */}
      {showNotifications && (
        <div className="mobile-sheet-backdrop mobile-only" onClick={() => setShowNotifications(false)}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet__handle" />
            <div className="mobile-sheet__head">
              <div className="mobile-sheet__title-wrap">
                <Bell size={20} className="text-gold" />
                <h3>Account Alerts</h3>
                <span className="dash-chip is-good" style={{ padding: "2px 8px", fontSize: "10px" }}>
                  2 Unread
                </span>
              </div>
              <button
                type="button"
                className="mobile-sheet__close"
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet__body">
              <div className="mobile-notif-cards">
                {/* Notification Item 1: Pending Deposit */}
                <div className="mobile-notif-card is-pending">
                  <div className="mobile-notif-card__icon text-amber">
                    <Clock size={20} />
                  </div>
                  <div className="mobile-notif-card__content">
                    <div className="mobile-notif-card__top">
                      <strong>Manual Deposit Under Audit</strong>
                      <span className="mobile-notif-card__time">35m ago</span>
                    </div>
                    <p>Your 1,000.00 USDT transfer has been submitted to the treasury engine and is undergoing multi-sig confirmation.</p>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectTab("wallet");
                      }}
                    >
                      <Wallet size={14} /> View Ledger Record
                    </button>
                  </div>
                </div>

                {/* Notification Item 2: Batch 05 Allocation */}
                <div className="mobile-notif-card is-info">
                  <div className="mobile-notif-card__icon text-emerald">
                    <Cpu size={20} />
                  </div>
                  <div className="mobile-notif-card__content">
                    <div className="mobile-notif-card__top">
                      <strong>Batch 05 Allocation Open</strong>
                      <span className="mobile-notif-card__time">1h ago</span>
                    </div>
                    <p>887 of 1,000 Antminer S21 Pro immersion blocks claimed. Fixed daily settlement rate guaranteed.</p>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectTab("buy-blocks");
                      }}
                    >
                      <Sparkles size={14} /> Allocate Mining Blocks
                    </button>
                  </div>
                </div>

                {/* Notification Item 3: Daily Streak */}
                <div className="mobile-notif-card is-good">
                  <div className="mobile-notif-card__icon text-cyan">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="mobile-notif-card__content">
                    <div className="mobile-notif-card__top">
                      <strong>Daily Telemetry Ping Active</strong>
                      <span className="mobile-notif-card__time">Today</span>
                    </div>
                    <p>Streak bonus multiplier active. Ping your allocated ASIC node daily to preserve full yield tier.</p>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectTab("daily-tasks");
                      }}
                    >
                      Check Streak Multiplier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mobile-sheet__footer">
              <button
                type="button"
                className="btn btn--block btn--ghost"
                onClick={() => setShowNotifications(false)}
              >
                Dismiss Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DEDICATED MOBILE USER PROFILE BOTTOM SHEET (< 769px)
          ========================================================================= */}
      {showProfileMenu && (
        <div className="mobile-sheet-backdrop mobile-only" onClick={() => setShowProfileMenu(false)}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet__handle" />
            <div className="mobile-sheet__head">
              <div className="mobile-sheet__title-wrap">
                <div className="dash-avatar-initials" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
                  {initials}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>{data.user.username}</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{data.user.email}</span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-sheet__close"
                onClick={() => setShowProfileMenu(false)}
                aria-label="Close profile menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet__body">
              {/* Account Status Card */}
              <div className="mobile-profile-status-card">
                <div className="mobile-profile-status-row">
                  <span>Operator Tier</span>
                  <span className="dash-chip is-good">Tier 1 Institutional</span>
                </div>
                <div className="mobile-profile-status-row">
                  <span>2FA Security</span>
                  <span className="dash-chip is-good">Protected</span>
                </div>
                <div className="mobile-profile-status-row">
                  <span>Referral Code</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <code className="text-gold font-mono" style={{ fontSize: "12px" }}>
                      {data.user.referralCode}
                    </code>
                    <button
                      type="button"
                      onClick={copyReferralCode}
                      className="btn btn--ghost btn--xs"
                      style={{ padding: "2px 6px" }}
                    >
                      {copiedRef ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="mobile-sheet-nav-list">
                <button
                  type="button"
                  className="mobile-sheet-nav-item"
                  onClick={() => {
                    onSelectTab("portfolio");
                    setShowProfileMenu(false);
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--cyan">
                    <Layers size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Mining Portfolio</strong>
                    <span>Review active Antminer allocations &amp; contracts</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                <button
                  type="button"
                  className="mobile-sheet-nav-item"
                  onClick={() => {
                    onSelectTab("settings");
                    setShowProfileMenu(false);
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--emerald">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Security &amp; 2FA</strong>
                    <span>Manage password, KYC &amp; TOTP authentication</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                <button
                  type="button"
                  className="mobile-sheet-nav-item"
                  onClick={() => {
                    onSelectTab("referrals");
                    setShowProfileMenu(false);
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--gold">
                    <User size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Affiliate Network</strong>
                    <span>Invite miners &amp; earn 50 USDT commissions</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                <button
                  type="button"
                  className="mobile-sheet-nav-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSupport();
                  }}
                >
                  <div className="mobile-sheet-nav-icon icon--blue">
                    <LifeBuoy size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Institutional Support Desk</strong>
                    <span>Direct priority assistance from treasury</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>

                <a
                  href="https://t.me/fletchermines"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-sheet-nav-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="mobile-sheet-nav-icon icon--blue">
                    <Send size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Official Telegram Channel</strong>
                    <span>Live ASIC telemetry drops &amp; network updates</span>
                  </div>
                  <ExternalLink size={14} className="text-muted" />
                </a>

                <Link
                  href="/terms"
                  target="_blank"
                  className="mobile-sheet-nav-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="mobile-sheet-nav-icon icon--gray">
                    <ExternalLink size={18} />
                  </div>
                  <div className="mobile-sheet-nav-info">
                    <strong>Terms &amp; Risk Disclosure</strong>
                    <span>Legal structure, audit notes &amp; compliance</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              </div>
            </div>

            <div className="mobile-sheet__footer">
              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn--block btn--danger"
                style={{ justifyContent: "center", gap: "8px" }}
              >
                <LogOut size={16} /> Sign Out of Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
