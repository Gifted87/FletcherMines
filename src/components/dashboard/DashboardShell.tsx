"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import TopAppHeader from "./TopAppHeader";
import DesktopTabBar from "./DesktopTabBar";
import MobileBottomNav from "./MobileBottomNav";
import OverviewTab from "./tabs/OverviewTab";
import BuyBlocksTab from "./tabs/BuyBlocksTab";
import PortfolioTab from "./tabs/PortfolioTab";
import WalletTab from "./tabs/WalletTab";
import DailyTasksTab from "./tabs/DailyTasksTab";
import ReferralsTab from "./tabs/ReferralsTab";
import SettingsTab from "./tabs/SettingsTab";
import ReferralBonusPopup from "./ReferralBonusPopup";
import { DashboardTab, UserDashboardData } from "@/lib/types/dashboard";

interface DashboardShellProps {
  initialData: UserDashboardData;
}

export default function DashboardShell({ initialData }: DashboardShellProps) {
  const [data, setData] = useState<UserDashboardData>(initialData);
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [taskLoading, setTaskLoading] = useState(false);

  // Support modal states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportEmail, setSupportEmail] = useState(initialData.user.email);
  const [supportSubject, setSupportSubject] = useState("Institutional Mining Inquiry");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);

  // Refresh data from database
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/dashboard/summary?user=${data.user.id}`);
      const resData = await res.json();
      if (res.ok && resData.data) {
        setData(resData.data);
      }
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
    }
  };

  // Complete daily task directly in SQLite
  const handleCompleteTask = async () => {
    setTaskLoading(true);
    try {
      const res = await fetch("/api/dashboard/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });
      await res.json();
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          dailyTask: {
            ...prev.dailyTask,
            completedToday: true,
            streakDays: prev.dailyTask.streakDays + 1,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  // Handle Support Ticket Submission
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportEmail || !supportMessage) return;
    setSupportLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: supportEmail,
          subject: supportSubject,
          message: supportMessage,
        }),
      });
      const resData = await res.json();
      setSupportSuccess(resData.message || "Support ticket submitted. Ticket ID generated.");
    } catch {
      setSupportSuccess("Inquiry dispatched to our desk.");
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="dash-root">
      {/* 1. Global Sticky Top Header */}
      <TopAppHeader
        data={data}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSupport={() => setShowSupportModal(true)}
      />

      {/* 2. Desktop Tabbed Navigation Bar */}
      <DesktopTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        data={data}
      />

      {/* 3. Main Dashboard Workspace Content */}
      <main className="dash-workspace container">
        {activeTab === "dashboard" && (
          <OverviewTab
            data={data}
            onSelectTab={setActiveTab}
            onOpenSupport={() => setShowSupportModal(true)}
            onCompleteTask={handleCompleteTask}
            taskLoading={taskLoading}
          />
        )}

        {activeTab === "buy-blocks" && (
          <BuyBlocksTab data={data} onRefresh={refreshData} onSelectTab={setActiveTab} />
        )}

        {activeTab === "portfolio" && (
          <PortfolioTab data={data} onSelectTab={setActiveTab} />
        )}

        {activeTab === "wallet" && (
          <WalletTab data={data} onRefresh={refreshData} />
        )}

        {activeTab === "daily-tasks" && (
          <DailyTasksTab
            data={data}
            onCompleteTask={handleCompleteTask}
            taskLoading={taskLoading}
          />
        )}

        {activeTab === "referrals" && <ReferralsTab data={data} />}

        {activeTab === "settings" && <SettingsTab data={data} />}
      </main>

      {/* 4. Active Referral Bonus Promo Floating Popup */}
      <ReferralBonusPopup
        referralCode={data.user.referralCode}
        onGoToReferrals={() => setActiveTab("referrals")}
      />

      {/* 5. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        data={data}
      />

      {/* 5. Contact Support Modal */}
      {showSupportModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowSupportModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__head">
              <h3>Institutional Support Desk</h3>
              <p>Direct priority support for mining blocks, treasury deposits, and contract maturities.</p>
            </div>
            {supportSuccess ? (
              <div className="auth-modal__success">
                <CheckCircle2 size={36} />
                <p>{supportSuccess}</p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => {
                    setShowSupportModal(false);
                    setSupportSuccess("");
                  }}
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="auth-modal__form">
                <div className="auth-field">
                  <label htmlFor="sup-email">Registered Email</label>
                  <div className="auth-input-wrap">
                    <div className="auth-input-icon-box">
                      <Mail size={16} />
                    </div>
                    <input
                      id="sup-email"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="sup-subject">Subject</label>
                  <div className="auth-input-wrap">
                    <input
                      id="sup-subject"
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="sup-msg">Message</label>
                  <textarea
                    id="sup-msg"
                    rows={4}
                    className="auth-textarea"
                    placeholder="Describe your inquiry..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setShowSupportModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={supportLoading} className="btn btn--primary">
                    {supportLoading ? <Loader2 size={14} className="spin" /> : "Submit Ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
