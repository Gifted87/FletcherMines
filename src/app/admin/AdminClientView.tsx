"use client";

import { useState } from "react";
import AdminSidebar, { AdminTab } from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileBottomNav from "@/components/admin/AdminMobileBottomNav";
import CommandCenterTab from "@/components/admin/tabs/CommandCenterTab";
import TreasuryTab from "@/components/admin/tabs/TreasuryTab";
import DropsTab from "@/components/admin/tabs/DropsTab";
import UsersTab from "@/components/admin/tabs/UsersTab";
import TaskEngineTab from "@/components/admin/tabs/TaskEngineTab";
import SettingsTab from "@/components/admin/tabs/SettingsTab";
import AnalyticsTab from "@/components/admin/tabs/AnalyticsTab";
import BroadcastModal from "@/components/admin/modals/BroadcastModal";
import AdjustBalanceModal from "@/components/admin/modals/AdjustBalanceModal";
import CreateDropModal from "@/components/admin/modals/CreateDropModal";
import UserDetailModal from "@/components/admin/modals/UserDetailModal";
import { AdminOverviewData } from "@/lib/adminData";

interface AdminClientViewProps {
  initialData: AdminOverviewData;
}

export default function AdminClientView({ initialData }: AdminClientViewProps) {
  const [data, setData] = useState<AdminOverviewData>(initialData);
  const [activeTab, setActiveTab] = useState<AdminTab>("command-center");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCreateDropModal, setShowCreateDropModal] = useState(false);
  const [detailUserId, setDetailUserId] = useState<number | null>(null);

  const refreshOverview = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.error("Failed to refresh overview", err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setActiveTab("users");
    }
  };

  const handleToggleMaintenance = async () => {
    const nextVal = !data.systemState.maintenanceMode;
    const confirm = window.confirm(
      nextVal
        ? "CAUTION: Are you sure you want to trigger Maintenance Mode? This will pause all user actions."
        : "Restore normal operations and exit Maintenance Mode?"
    );
    if (!confirm) return;

    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_mode: nextVal ? 1 : 0 }),
      });
      refreshOverview();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWithdrawals = async () => {
    const nextVal = !data.systemState.pauseWithdrawals;
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause_withdrawals: nextVal ? 1 : 0 }),
      });
      refreshOverview();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-shell">
      {/* Responsive Left Sidebar Drawer */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingDepositsCount={data.operations.pendingDepositsCount}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Body */}
      <div className="admin-body">
        {/* Global Header */}
        <AdminHeader
          onSearch={handleSearch}
          pendingDepositsCount={data.operations.pendingDepositsCount}
          maintenanceMode={data.systemState.maintenanceMode}
          pauseWithdrawals={data.systemState.pauseWithdrawals}
          onOpenBroadcast={() => setShowBroadcastModal(true)}
          onToggleMaintenance={handleToggleMaintenance}
          onToggleWithdrawals={handleToggleWithdrawals}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        {/* Content Canvas */}
        <main className="admin-content">
          {activeTab === "command-center" && (
            <CommandCenterTab
              data={data}
              onSelectTab={setActiveTab}
              onSelectUser={(uId) => setDetailUserId(uId)}
            />
          )}

          {activeTab === "treasury" && (
            <TreasuryTab
              onOpenAdjust={() => setShowAdjustModal(true)}
              onSelectUser={(uId) => setDetailUserId(uId)}
            />
          )}

          {activeTab === "drops" && (
            <DropsTab onOpenCreateDrop={() => setShowCreateDropModal(true)} />
          )}

          {activeTab === "users" && (
            <UsersTab
              onSelectUser={(uId) => setDetailUserId(uId)}
              externalSearch={searchQuery}
            />
          )}

          {activeTab === "tasks" && <TaskEngineTab />}

          {activeTab === "settings" && <SettingsTab />}

          {activeTab === "analytics" && (
            <AnalyticsTab onOpenBroadcast={() => setShowBroadcastModal(true)} />
          )}
        </main>

        {/* Mobile Sticky Bottom Nav Bar */}
        <AdminMobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingDepositsCount={data.operations.pendingDepositsCount}
          onOpenMenu={() => setIsMobileNavOpen(true)}
        />
      </div>

      {/* Modals */}
      {showBroadcastModal && (
        <BroadcastModal
          onClose={() => setShowBroadcastModal(false)}
          onSuccess={refreshOverview}
        />
      )}

      {showAdjustModal && (
        <AdjustBalanceModal
          onClose={() => setShowAdjustModal(false)}
          onSuccess={refreshOverview}
        />
      )}

      {showCreateDropModal && (
        <CreateDropModal
          onClose={() => setShowCreateDropModal(false)}
          onSuccess={refreshOverview}
        />
      )}

      {detailUserId !== null && (
        <UserDetailModal
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
          onRefresh={refreshOverview}
        />
      )}
    </div>
  );
}
