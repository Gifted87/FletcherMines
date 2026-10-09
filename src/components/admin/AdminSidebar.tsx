"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Cpu,
  Flame,
  Landmark,
  LogOut,
  Sliders,
  Terminal,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export type AdminTab =
  | "command-center"
  | "treasury"
  | "drops"
  | "users"
  | "tasks"
  | "settings"
  | "analytics";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingDepositsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  pendingDepositsCount,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const menuItems: Array<{
    id: AdminTab;
    label: string;
    icon: typeof Activity;
    badge?: number;
  }> = [
    { id: "command-center", label: "Command Center", icon: Activity },
    {
      id: "treasury",
      label: "Treasury & Finance",
      icon: Landmark,
      badge: pendingDepositsCount > 0 ? pendingDepositsCount : undefined,
    },
    { id: "drops", label: "Drops & Inventory", icon: Cpu },
    { id: "users", label: "User Management", icon: Users },
    { id: "tasks", label: "Task Engine", icon: Flame },
    { id: "settings", label: "Content & Settings", icon: Sliders },
    { id: "analytics", label: "Usage & Broadcast", icon: BarChart3 },
  ];

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`admin-sidebar-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__logo">
            <div className="admin-sidebar__brand-wrap">
              <div className="admin-sidebar__logo-icon">
                <Terminal size={17} />
              </div>
              <div className="admin-sidebar__brand">
                <h1>Fletcher Mines</h1>
                <span>ADMIN OS</span>
              </div>
            </div>

            {/* Mobile close toggle */}
            <button
              type="button"
              className="admin-sidebar-close"
              onClick={onClose}
              aria-label="Close Admin Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="admin-sidebar__nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="admin-nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar__bottom">
          <div className="admin-profile-badge">
            <div className="admin-profile-avatar">
              <UserCheck size={16} />
            </div>
            <div className="admin-profile-meta">
              <strong>Institutional Admin</strong>
              <span>Secured Root Clearance</span>
            </div>
          </div>

          <Link
            href="/dashboard?user=1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost btn--sm btn--block"
            style={{ justifyContent: "center" }}
            onClick={onClose}
          >
            <span>Switch to User View</span>
          </Link>

          <button
            type="button"
            className="btn btn--ghost btn--sm btn--block text-danger"
            style={{ justifyContent: "center", gap: "6px" }}
            onClick={async () => {
              if (onClose) onClose();
              try {
                await fetch("/api/admin/auth/logout", { method: "POST" });
              } catch (e) {
                console.error(e);
              }
              window.location.href = "/admin";
            }}
          >
            <LogOut size={14} />
            <span>Lock & Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
