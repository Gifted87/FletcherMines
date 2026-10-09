import { NextResponse } from "next/server";
import { getNetworkMiners, getNetworkStats } from "@/lib/networkData";
import db from "@/lib/db";

export async function GET() {
  try {
    const miners = getNetworkMiners(100);
    const stats = getNetworkStats();
    return NextResponse.json({
      success: true,
      miners,
      stats,
    });
  } catch (error) {
    console.error("API /api/network/miners error:", error);
    return NextResponse.json({ error: "Failed to fetch network miners from database." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { handle, amount, term, dailyRate } = body;

    if (!handle || !amount || !term || !dailyRate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dailyUsd = Number(((amount * dailyRate) / 100).toFixed(2));
    const totalYield = Number((dailyUsd * term).toFixed(2));

    const result = db.prepare(`
      INSERT INTO network_miners (handle, verified, amount, term, daily_rate, daily_usd, total_yield, status, minutes_ago)
      VALUES (?, 1, ?, ?, ?, ?, ?, 'Active', 0)
    `).run(handle, amount, term, dailyRate, dailyUsd, totalYield);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("API /api/network/miners POST error:", error);
    return NextResponse.json({ error: "Failed to insert network miner" }, { status: 500 });
  }
}
