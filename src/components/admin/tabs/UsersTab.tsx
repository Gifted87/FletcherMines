"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { AdminUserRecord } from "@/lib/adminData";

interface UsersTabProps {
  onSelectUser: (userId: number) => void;
  externalSearch?: string;
}

export default function UsersTab({ onSelectUser, externalSearch }: UsersTabProps) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [typedSearch, setTypedSearch] = useState<string | null>(null);
  const searchTerm = typedSearch !== null ? typedSearch : (externalSearch || "");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (filter !== "all") params.set("filter", filter);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const json = await res.json();
        if (active && res.ok) setUsers(json || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filter, searchTerm, refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-gold">
            <Users size={13} /> OPERATOR DIRECTORY
          </div>
          <h2>Operator Account Directory &amp; Governance</h2>
          <p className="dash-subtab-desc">
            Granular oversight over customer balances, KYC compliance, hardware block contracts, streaks, and account security controls.
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={handleRefresh}>
          <RefreshCw size={14} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div className="dash-pill-switcher" style={{ flexWrap: "wrap" }}>
          <button
            type="button"
            className={filter === "all" ? "is-active" : ""}
            onClick={() => setFilter("all")}
          >
            All Accounts ({users.length})
          </button>
          <button
            type="button"
            className={filter === "high_rollers" ? "is-active" : ""}
            onClick={() => setFilter("high_rollers")}
          >
            High Rollers (&gt;$2k)
          </button>
          <button
            type="button"
            className={filter === "pending_deposits" ? "is-active" : ""}
            onClick={() => setFilter("pending_deposits")}
          >
            Pending Deposits
          </button>
          <button
            type="button"
            className={filter === "kyc_pending" ? "is-active" : ""}
            onClick={() => setFilter("kyc_pending")}
          >
            KYC Review
          </button>
          <button
            type="button"
            className={filter === "frozen" ? "is-active" : ""}
            onClick={() => setFilter("frozen")}
          >
            Frozen Accounts
          </button>
          <button
            type="button"
            className={filter === "inactive_7d" ? "is-active" : ""}
            onClick={() => setFilter("inactive_7d")}
          >
            Inactive (7d+)
          </button>
        </div>

        <div className="admin-search-box" style={{ flex: 1, minWidth: "220px", maxWidth: "360px" }}>
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Filter by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setTypedSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Liquid Balance</th>
              <th>Locked Capital</th>
              <th>Blocks</th>
              <th>Streak</th>
              <th>Status</th>
              <th>Registered</th>
              <th style={{ textAlign: "right" }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-muted">
                  Loading user accounts from SQLite database...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-muted">
                  No accounts matched your query or filter.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isFrozen = u.accountStatus === "frozen";
                return (
                  <tr
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => onSelectUser(u.id)}
                  >
                    <td className="font-mono text-xs text-white">#{u.id}</td>
                    <td>
                      <strong className="text-white hover:text-emerald">{u.username}</strong>
                    </td>
                    <td className="font-mono text-xs text-muted">{u.email}</td>
                    <td className="font-mono font-bold text-emerald">
                      ${u.usdtBalance.toFixed(2)} USDT
                    </td>
                    <td className="font-mono text-white">
                      ${u.lockedBalance.toFixed(2)} USDT
                    </td>
                    <td className="font-mono text-gold">{u.totalBlocks} Blocks</td>
                    <td className="font-mono text-gold">🔥 {u.streakCount}d</td>
                    <td>
                      <span
                        className={`dash-badge ${
                          isFrozen ? "dash-badge--danger" : "dash-badge--emerald"
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(u.id);
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
