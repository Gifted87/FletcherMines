import { NextResponse } from "next/server";
import { manualWalletAdjustment } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, type, amount, reason } = body;

    if (!userId || !type || !amount || amount <= 0 || !reason) {
      return NextResponse.json({ error: "Missing required fields: userId, type, amount, reason" }, { status: 400 });
    }

    const ok = manualWalletAdjustment(Number(userId), type, Number(amount), String(reason));
    if (!ok) {
      return NextResponse.json({ error: "User not found or adjustment failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Successfully applied ${type.toUpperCase()} of ${amount} USDT.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Adjustment error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
