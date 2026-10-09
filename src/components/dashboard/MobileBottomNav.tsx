"use client";

import {
  LayoutDashboard,
  Cpu,
  Layers,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { DashboardTab, UserDashboardData } from "@/lib/types/dashboard";

interface MobileBottomNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  data: UserDashboardData;
}

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
  data,
}: MobileBottomNavProps) {
  const items = [
    {
      id: "dashboard" as DashboardTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badgeDot: false,
    },
    {
      id: "buy-blocks" as DashboardTab,
      label: "Buy Blocks",
      icon: Cpu,
      badgeDot: true,
    },
    {
      id: "portfolio" as DashboardTab,
      label: "Portfolio",
      icon: Layers,
      badgeDot: false,
    },
    {
      id: "wallet" as DashboardTab,
      label: "Wallet",
      icon: Wallet,
      badgeDot: true,
    },
    {
      id: "daily-tasks" as DashboardTab,
      label: "Tasks",
      icon: CheckCircle2,
      badgeDot: !data.dailyTask.completedToday,
    },
  ];

  return (
    <nav className="dash-mobile-nav" aria-label="Mobile Bottom Navigation">
      <div className="dash-mobile-nav__grid">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              className={`dash-mobile-nav__item ${isActive ? "is-active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
            >
              <div className="dash-mobile-nav__icon-wrap">
                <Icon size={20} />
                {item.badgeDot && <span className="dash-mobile-dot" />}
              </div>
              <span className="dash-mobile-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
