"use client";

import {
  Activity,
  Cpu,
  Landmark,
  Menu,
  Users,
} from "lucide-react";
import { AdminTab } from "./AdminSidebar";

interface AdminMobileBottomNavProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingDepositsCount: number;
  onOpenMenu: () => void;
}

export default function AdminMobileBottomNav({
  activeTab,
  onSelectTab,
  pendingDepositsCount,
  onOpenMenu,
}: AdminMobileBottomNavProps) {
  return (
    <nav className="admin-mobile-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`admin-mobile-nav__btn ${activeTab === "command-center" ? "is-active" : ""}`}
        onClick={() => onSelectTab("command-center")}
      >
        <Activity size={18} />
        <span>Cockpit</span>
      </button>

      <button
        type="button"
        className={`admin-mobile-nav__btn ${activeTab === "treasury" ? "is-active" : ""}`}
        onClick={() => onSelectTab("treasury")}
      >
        <Landmark size={18} />
        <span>Treasury</span>
        {pendingDepositsCount > 0 && (
          <span className="admin-mobile-nav__badge">{pendingDepositsCount}</span>
        )}
      </button>

      <button
        type="button"
        className={`admin-mobile-nav__btn ${activeTab === "drops" ? "is-active" : ""}`}
        onClick={() => onSelectTab("drops")}
      >
        <Cpu size={18} />
        <span>Drops</span>
      </button>

      <button
        type="button"
        className={`admin-mobile-nav__btn ${activeTab === "users" ? "is-active" : ""}`}
        onClick={() => onSelectTab("users")}
      >
        <Users size={18} />
        <span>Users</span>
      </button>

      <button
        type="button"
        className="admin-mobile-nav__btn"
        onClick={onOpenMenu}
        aria-label="Open More Admin Navigation"
      >
        <Menu size={18} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
