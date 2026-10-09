"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Coins,
  Flame,
  Gauge,
  Megaphone,
  Users,
} from "lucide-react";

interface AnalyticsTabProps {
  onOpenBroadcast: () => void;
}

interface AdminAnnouncement {
  id: number;
  title: string;
  category: string;
  urgency: string;
  content: string;
  created_at: string;
}

export default function AnalyticsTab({ onOpenBroadcast }: AnalyticsTabProps) {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (json.announcements) setAnnouncements(json.announcements);
      } catch (err) {
        console.error(err);
      }
    }
    loadAnnouncements();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <BarChart3 size={13} /> PLATFORM TELEMETRY
          </div>
          <h2>Usage Analytics &amp; Global Broadcasts</h2>
          <p className="dash-subtab-desc">
            Monitor investor cohort expansion, daily settlement velocity, ASIC farm capacity utilization, and dispatch urgent alerts across all user dashboards.
          </p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={onOpenBroadcast}>
          <Megaphone size={14} />
          <span>New Global Broadcast</span>
        </button>
      </div>

      {/* KPI GRID */}
      <div className="admin-grid-4">
        <div className="admin-card">
          <div className="admin-card__head">
            <span className="admin-card__title">
              <Users size={14} className="text-gold" /> 30-Day Growth
            </span>
            <span className="dash-live-badge">+24.5%</span>
          </div>
          <div className="admin-card__val font-mono">4,812 <small>Miners</small></div>
          <div className="admin-card__sub">Network participants in pool</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__head">
            <span className="admin-card__title">
              <Coins size={14} className="text-emerald" /> 24h Yield Volume
            </span>
            <span className="font-mono text-xs text-muted">00:00 UTC</span>
          </div>
          <div className="admin-card__val font-mono text-emerald">$52,480 <small>USDT</small></div>
          <div className="admin-card__sub">Settled directly into user balances</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__head">
            <span className="admin-card__title">
              <Flame size={14} className="text-gold" /> Avg. Streak
            </span>
            <span className="font-mono text-xs text-gold">🔥 5.8 Days</span>
          </div>
          <div className="admin-card__val font-mono">94.2%</div>
          <div className="admin-card__sub">Daily hashrate ping retention</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__head">
            <span className="admin-card__title">
              <Gauge size={14} className="text-gold" /> Power Draw
            </span>
            <span className="dash-live-badge">Hall B</span>
          </div>
          <div className="admin-card__val font-mono">18.6 <small>MW</small></div>
          <div className="admin-card__sub">Hydro-powered immersion cooling</div>
        </div>
      </div>

      {/* RECENT BROADCAST BULLETINS */}
      <div className="dash-card">
        <div className="dash-card__head">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Megaphone size={16} className="text-gold" />
            <h3>Published Broadcast Bulletins</h3>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Urgency Level</th>
                <th>Message Content</th>
                <th>Broadcast Time</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id}>
                  <td className="font-bold text-white">{a.title}</td>
                  <td>
                    <span className="badge badge--cyan capitalize text-xs">{a.category}</span>
                  </td>
                  <td>
                    <span
                      className={`dash-badge ${
                        a.urgency === "critical"
                          ? "dash-badge--danger"
                          : a.urgency === "high"
                          ? "dash-badge--amber"
                          : "dash-badge--emerald"
                      }`}
                    >
                      {a.urgency}
                    </span>
                  </td>
                  <td className="text-xs text-muted" style={{ maxWidth: "340px" }}>{a.content}</td>
                  <td className="font-mono text-xs text-muted">{a.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
