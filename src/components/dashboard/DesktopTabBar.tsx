"use client";

import {
  LayoutDashboard,
  Cpu,
  Layers,
  Wallet,
  CheckCircle2,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { DashboardTab, UserDashboardData } from "@/lib/types/dashboard";

interface DesktopTabBarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  data: UserDashboardData;
}

export default function DesktopTabBar({
  activeTab,
  onSelectTab,
  data,
}: DesktopTabBarProps) {
  const tabs = [
    {
      id: "dashboard" as DashboardTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "buy-blocks" as DashboardTab,
      label: "Buy Blocks",
      icon: Cpu,
      badge: { text: "88% Sold", type: "gold" },
    },
    {
      id: "portfolio" as DashboardTab,
      label: "Portfolio",
      icon: Layers,
      badge: { text: "1 Matures Soon", type: "cyan" },
    },
    {
      id: "wallet" as DashboardTab,
      label: "Wallet",
      icon: Wallet,
      badge: { text: "1 Pending", type: "amber" },
    },
    {
      id: "daily-tasks" as DashboardTab,
      label: "Daily Tasks",
      icon: CheckCircle2,
      badge: !data.dailyTask.completedToday ? { text: "1", type: "danger" } : null,
    },
    {
      id: "referrals" as DashboardTab,
      label: "Referrals",
      icon: Gift,
      badge: null,
    },
    {
      id: "settings" as DashboardTab,
      label: "Settings",
      icon: ShieldCheck,
      badge: null,
    },
  ];

  return (
    <nav className="dash-desktop-nav desktop-only" aria-label="Dashboard Navigation">
      <div className="dash-desktop-nav__inner container">
        <div className="dash-tabs-bar" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                type="button"
                className={`dash-tab ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectTab(tab.id)}
              >
                <Icon size={16} className="dash-tab__icon" />
                <span className="dash-tab__label">{tab.label}</span>
                {tab.badge && (
                  <span className={`dash-tab__badge badge--${tab.badge.type}`}>
                    {tab.badge.text}
                  </span>
                )}
                {isActive && <span className="dash-tab__indicator" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
