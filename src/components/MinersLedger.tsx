"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, BadgeCheck, ChevronDown, Filter, Hexagon, Users, Lock, Coins, Gauge } from "lucide-react";
import CountUp from "./CountUp";
import { TERMS, type Term } from "@/lib/yieldRules";
import type { NetworkMinerRow, NetworkStats } from "@/lib/networkData";

type SortKey = "amount" | "term" | "newest";

const PAGE = 50;

const DEFAULT_STATS: NetworkStats = {
  totalLockedUsdt: 4286450,
  activeMiners: 4812,
  totalPaidOutUsdt: 30914220,
  hashratePH: 186.4,
  facilityUptime: 99.98,
  activeAsics: 6240,
  powerDrawMW: 18.6,
  taskCompletion: 94,
};

const usd = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function timeLabel(minutesAgo: number): string {
  if (minutesAgo <= 0) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const h = Math.floor(minutesAgo / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface MinersLedgerProps {
  initialMiners?: NetworkMinerRow[];
  initialStats?: NetworkStats;
}

export default function MinersLedger({ initialMiners = [], initialStats = DEFAULT_STATS }: MinersLedgerProps) {
  const [miners, setMiners] = useState<NetworkMinerRow[]>(initialMiners);
  const [stats, setStats] = useState<NetworkStats>(initialStats);
  const [sort, setSort] = useState<SortKey>("newest");
  const [term, setTerm] = useState<Term | "all">("all");
  const [visible, setVisible] = useState(PAGE);
  const [fresh] = useState<Set<number>>(new Set());

  // Fetch live network participants from SQLite database API
  useEffect(() => {
    async function loadMiners() {
      try {
        const res = await fetch("/api/network/miners");
        if (res.ok) {
          const json = await res.json();
          if (json.miners && json.miners.length > 0) {
            setMiners(json.miners);
          }
          if (json.stats) {
            setStats(json.stats);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live miners from database:", err);
      }
    }

    if (initialMiners.length === 0) {
      loadMiners();
    }

    // Refresh every 30 seconds from database
    const interval = setInterval(loadMiners, 30000);
    return () => clearInterval(interval);
  }, [initialMiners.length]);

  const rows = useMemo(() => {
    const list = term === "all" ? miners : miners.filter((m) => m.term === term);
    const sorted = [...list];
    if (sort === "amount") sorted.sort((a, b) => b.amount - a.amount);
    else if (sort === "term") sorted.sort((a, b) => b.term - a.term || b.amount - a.amount);
    else sorted.sort((a, b) => a.minutesAgo - b.minutesAgo || b.id - a.id);
    return sorted;
  }, [miners, sort, term]);

  const shown = rows.slice(0, visible);

  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="stat__label">
            <Lock /> Total Value Locked
          </div>
          <div className="stat__value">
            <CountUp value={stats.totalLockedUsdt} prefix="$" />
            <small>USDT</small>
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Users /> Active Miners
          </div>
          <div className="stat__value">
            <CountUp value={stats.activeMiners} />
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Coins /> Total Yield Paid
          </div>
          <div className="stat__value">
            <CountUp value={stats.totalPaidOutUsdt} prefix="$" />
            <small>USDT</small>
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Gauge /> Deployed Hashrate
          </div>
          <div className="stat__value">
            <CountUp value={stats.hashratePH} decimals={1} />
            <small>PH/s</small>
          </div>
        </div>
      </div>

      <div className="ledger">
        <div className="ledger__toolbar">
          <div className="ledger__group">
            <span className="ledger__group-label">
              <ArrowDownWideNarrow /> Sort
            </span>
            <div className="seg" role="group" aria-label="Sort ledger">
              {(
                [
                  ["amount", "Highest Locked"],
                  ["term", "Longest Term"],
                  ["newest", "Newest"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  id={`ledger-sort-${key}`}
                  type="button"
                  className={sort === key ? "is-active" : ""}
                  aria-pressed={sort === key}
                  onClick={() => {
                    setSort(key);
                    setVisible(PAGE);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="ledger__group">
            <span className="ledger__group-label">
              <Filter /> Term
            </span>
            <div className="chips" role="group" aria-label="Filter by term">
              <button
                id="ledger-term-all"
                type="button"
                className={`chip ${term === "all" ? "is-active" : ""}`}
                onClick={() => {
                  setTerm("all");
                  setVisible(PAGE);
                }}
              >
                All
              </button>
              {TERMS.map((t) => (
                <button
                  key={t}
                  id={`ledger-term-${t}`}
                  type="button"
                  className={`chip ${term === t ? "is-active" : ""}`}
                  onClick={() => {
                    setTerm(t);
                    setVisible(PAGE);
                  }}
                >
                  {t}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tbl" aria-label="Active miners ledger">
            <thead>
              <tr>
                <th scope="col">Participant</th>
                <th scope="col" className="is-right">
                  Locked Capital
                </th>
                <th scope="col">Maturity</th>
                <th scope="col">Daily Return</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id} className={fresh.has(m.id) ? "is-fresh" : ""}>
                  <td className="c-miner">
                    <div className="miner-cell">
                      <div className="miner-avatar">
                        <Hexagon size={16} />
                      </div>
                      <div>
                        <div className="miner-handle">
                          <span>{m.handle}</span>
                          {m.verified && (
                            <span className="miner-v" title="KYC Verified Institutional Miner">
                              <BadgeCheck size={14} />
                            </span>
                          )}
                        </div>
                        <div className="miner-time">{timeLabel(m.minutesAgo)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="c-amount is-right">
                    <span className="amount">
                      ${usd(m.amount)}
                      <span>USDT</span>
                    </span>
                  </td>
                  <td className="c-term">
                    <span className={`term-badge term-${m.term}`}>{m.term} Days</span>
                  </td>
                  <td className="c-yield">
                    <div className="yield">
                      <div className="yield__rate">${usd(m.dailyUsd)} / day</div>
                      <div className="yield__usd">{m.dailyRate.toFixed(1)}% / day</div>
                    </div>
                  </td>
                  <td className="c-status">
                    <span className={`status ${m.status === "Locked" ? "status--locked" : ""}`}>
                      <span className="dot" />
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ledger__footer">
          <span>
            Showing <span className="num">{shown.length.toLocaleString("en-US")}</span> of{" "}
            <span className="num">{rows.length.toLocaleString("en-US")}</span> database records
          </span>
          <span className="ledger__live">
            <span className="pulse-dot" /> Verified Database Ledger
          </span>
          {visible < rows.length ? (
            <button
              id="ledger-load-more"
              type="button"
              className="btn btn--ghost"
              onClick={() => setVisible((v) => v + PAGE)}
            >
              Load More <ChevronDown />
            </button>
          ) : (
            <span>End of public registry</span>
          )}
        </div>
      </div>
    </>
  );
}
