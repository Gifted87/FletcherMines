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

  const initials = data.user.username.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
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

          {/* Support Icon */}
          <button
            type="button"
            className="dash-icon-btn desktop-only"
            onClick={onOpenSupport}
            title="Contact Support"
            aria-label="Support Desk"
          >
            <LifeBuoy size={18} />
          </button>

          {/* Notifications Center */}
          <div className="dash-popover-anchor">
            <button
              type="button"
              className="dash-icon-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="dash-notif-badge">2</span>
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="dash-notif-popover">
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
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="User Account Menu"
              aria-label="User Account"
            >
              <span className="dash-avatar-initials">{initials}</span>
              <span className="dash-avatar-badge">Tier 1</span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="dash-profile-menu">
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
  );
}
