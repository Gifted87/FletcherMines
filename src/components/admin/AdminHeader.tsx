"use client";

import { useState } from "react";
import {
  ChevronDown,
  Database,
  Megaphone,
  Menu,
  Pause,
  Play,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface AdminHeaderProps {
  onSearch: (q: string) => void;
  pendingDepositsCount: number;
  maintenanceMode: boolean;
  onOpenBroadcast: () => void;
  onToggleMaintenance: () => void;
  onToggleWithdrawals: () => void;
  pauseWithdrawals: boolean;
  onToggleMobileNav?: () => void;
}

export default function AdminHeader({
  onSearch,
  pendingDepositsCount,
  maintenanceMode,
  onOpenBroadcast,
  onToggleMaintenance,
  onToggleWithdrawals,
  pauseWithdrawals,
  onToggleMobileNav,
}: AdminHeaderProps) {
  const [searchVal, setSearchVal] = useState("");
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal.trim());
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        {onToggleMobileNav && (
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={onToggleMobileNav}
            aria-label="Toggle Navigation Drawer"
          >
            <Menu size={18} />
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="admin-search-box">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search User ID, Username, Email, or TX Hash..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearch(e.target.value);
            }}
          />
        </form>
      </div>

      <div className="admin-header__right">
        {/* Status Indicators */}
        <span className="admin-status-pill is-emerald font-mono">
          <Database size={12} />
          <span>SQLite WAL</span>
        </span>

        {pendingDepositsCount > 0 && (
          <span className="admin-status-pill is-gold font-mono">
            <span className="pulse-dot" />
            <span>{pendingDepositsCount} Pending</span>
          </span>
        )}

        {maintenanceMode && (
          <span className="admin-status-pill is-danger font-mono">
            <ShieldAlert size={12} />
            <span>MAINTENANCE</span>
          </span>
        )}

        {pauseWithdrawals && (
          <span className="admin-status-pill is-gold font-mono">
            <Pause size={12} />
            <span>WITHDRAWALS LOCKED</span>
          </span>
        )}

        {/* Broadcast Trigger */}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onOpenBroadcast}
          title="Broadcast Announcement to All Operators"
        >
          <Megaphone size={14} />
          <span>Broadcast</span>
        </button>

        {/* Quick Actions Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
          >
            <Zap size={13} />
            <span>Quick Actions</span>
            <ChevronDown size={13} />
          </button>

          {quickMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "250px",
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.7)",
                padding: "6px",
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <button
                type="button"
                className="admin-nav-item"
                style={{ fontSize: "12px", padding: "8px 10px" }}
                onClick={() => {
                  setQuickMenuOpen(false);
                  onToggleMaintenance();
                }}
              >
                <ShieldAlert size={14} className={maintenanceMode ? "text-emerald" : "text-danger"} />
                <span>{maintenanceMode ? "Exit Maintenance Mode" : "Trigger Maintenance Mode"}</span>
              </button>

              <button
                type="button"
                className="admin-nav-item"
                style={{ fontSize: "12px", padding: "8px 10px" }}
                onClick={() => {
                  setQuickMenuOpen(false);
                  onToggleWithdrawals();
                }}
              >
                {pauseWithdrawals ? (
                  <>
                    <Play size={14} className="text-emerald" />
                    <span>Resume Withdrawals</span>
                  </>
                ) : (
                  <>
                    <Pause size={14} className="text-danger" />
                    <span>Emergency Pause Withdrawals</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="admin-nav-item"
                style={{ fontSize: "12px", padding: "8px 10px" }}
                onClick={() => {
                  setQuickMenuOpen(false);
                  onOpenBroadcast();
                }}
              >
                <Megaphone size={14} className="text-gold" />
                <span>Dispatch Global Broadcast</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
