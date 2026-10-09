import db from "@/lib/db";
import { DbBatchRecord } from "./types/dashboard";

export interface NetworkMinerRow {
  id: number;
  uid: number;
  handle: string;
  verified: boolean;
  amount: number;
  term: number;
  dailyRate: number;
  dailyUsd: number;
  totalYield: number;
  status: "Active" | "Locked";
  minutesAgo: number;
}

export interface NetworkStats {
  totalLockedUsdt: number;
  activeMiners: number;
  totalPaidOutUsdt: number;
  hashratePH: number;
  facilityUptime: number;
  activeAsics: number;
  powerDrawMW: number;
  taskCompletion: number;
}

export function getNetworkMiners(limit = 100): NetworkMinerRow[] {
  try {
    const rows = db.prepare(`
      SELECT * FROM network_miners 
      ORDER BY minutes_ago ASC, id DESC 
      LIMIT ?
    `).all(limit) as Array<{
      id: number;
      handle: string;
      verified: number;
      amount: number;
      term: number;
      daily_rate: number;
      daily_usd: number;
      total_yield: number;
      status: string;
      minutes_ago: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      uid: r.id,
      handle: r.handle,
      verified: Boolean(r.verified),
      amount: r.amount,
      term: r.term,
      dailyRate: r.daily_rate,
      dailyUsd: r.daily_usd,
      totalYield: r.total_yield,
      status: (r.status as "Active" | "Locked") || "Active",
      minutesAgo: r.minutes_ago,
    }));
  } catch (err) {
    console.error("Failed to query network_miners:", err);
    return [];
  }
}

export function getNetworkStats(): NetworkStats {
  try {
    // Derive live stats from database
    const totalUsers = (db.prepare("SELECT count(*) as c FROM users").get() as { c: number }).c;
    const totalLockedRow = db.prepare("SELECT COALESCE(SUM(total_invested), 0) as locked FROM mining_blocks WHERE status = 'active'").get() as { locked: number };
    const totalPaidRow = db.prepare("SELECT COALESCE(SUM(accumulated_earnings), 0) as paid FROM mining_blocks").get() as { paid: number };

    const baseLocked = 4286450;
    const basePaid = 30914220;
    const baseMiners = 4812;

    return {
      totalLockedUsdt: baseLocked + (totalLockedRow.locked || 0),
      activeMiners: baseMiners + (totalUsers || 0),
      totalPaidOutUsdt: basePaid + (totalPaidRow.paid || 0),
      hashratePH: 186.4,
      facilityUptime: 99.98,
      activeAsics: 6240,
      powerDrawMW: 18.6,
      taskCompletion: 94,
    };
  } catch (err) {
    console.error("Failed to query network stats:", err);
    return {
      totalLockedUsdt: 4286450,
      activeMiners: 4812,
      totalPaidOutUsdt: 30914220,
      hashratePH: 186.4,
      facilityUptime: 99.98,
      activeAsics: 6240,
      powerDrawMW: 18.6,
      taskCompletion: 94,
    };
  }
}

export function getCurrentBatchFromDb() {
  try {
    const batch = db.prepare("SELECT * FROM mining_batches WHERE status = 'active' ORDER BY id DESC LIMIT 1").get() as DbBatchRecord | undefined;
    if (batch) {
      return {
        code: batch.batch_name.replace("Batch ", "").trim(),
        name: batch.batch_name,
        vaultLabel: `${batch.hardware_model} — Institutional Allocation`,
        totalBlocks: batch.total_blocks,
        claimedBlocks: batch.claimed_blocks,
        blockPriceUsdt: batch.price_per_block,
        minTermDays: batch.min_maturity_days,
        closesInMs: 5025000,
        closesAt: batch.closes_at,
      };
    }
  } catch (err) {
    console.error("Failed to query current batch:", err);
  }

  return {
    code: "05",
    name: "Batch 05",
    vaultLabel: "Ridgeline Hall B — 500 PH/s Expansion",
    totalBlocks: 1000,
    claimedBlocks: 887,
    blockPriceUsdt: 100,
    minTermDays: 14,
    closesInMs: 5025000,
    closesAt: "2026-10-09T04:08:36.528Z",
  };
}

export function buildDatabaseTickerItems(): string[] {
  const miners = getNetworkMiners(10);
  const stats = getNetworkStats();
  const batch = getCurrentBatchFromDb();

  const fmt = (n: number) => n.toLocaleString("en-US");
  const claimed = ((batch.claimedBlocks / batch.totalBlocks) * 100).toFixed(1);

  const statsItems = [
    `Batch ${batch.code} Allocation: ${claimed}% Claimed`,
    `Daily Task Completion Rate: ${stats.taskCompletion}%`,
    `Network Hashrate: ${stats.hashratePH} PH/s`,
    `Yield Settlement 00:00 UTC: ${fmt(41276)} USDT Distributed`,
    `Facility Uptime (30d): ${stats.facilityUptime}%`,
  ];

  const minerItems = miners.map(
    (m) => `${m.handle} locked ${fmt(m.amount)} USDT for ${m.term} Days`
  );

  const out: string[] = [];
  minerItems.forEach((m, i) => {
    out.push(m);
    if (statsItems[i]) out.push(statsItems[i]);
  });
  return out.length > 0 ? out : statsItems;
}
