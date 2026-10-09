import { NextResponse } from "next/server";
import { getDepositQueue, approveDeposit, rejectDeposit, requestInfoDeposit, bulkApproveDeposits } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queue = getDepositQueue();
    return NextResponse.json(queue);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load deposit queue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, txId, reason, adminNote, prompt } = body;

    if (!txId) {
      return NextResponse.json({ error: "Missing txId" }, { status: 400 });
    }

    if (action === "approve") {
      const ok = approveDeposit(Number(txId), adminNote);
      if (!ok) return NextResponse.json({ error: "Transaction not found or not pending" }, { status: 400 });
      return NextResponse.json({ success: true, message: "Deposit approved and credited to user." });
    } else if (action === "reject") {
      const ok = rejectDeposit(Number(txId), reason || "Rejected by administrator");
      if (!ok) return NextResponse.json({ error: "Transaction not found or not pending" }, { status: 400 });
      return NextResponse.json({ success: true, message: "Deposit rejected." });
    } else if (action === "request_info") {
      const ok = requestInfoDeposit(Number(txId), prompt || "Please upload a clearer receipt screenshot with confirmed TX Hash.");
      if (!ok) return NextResponse.json({ error: "Transaction not found" }, { status: 400 });
      return NextResponse.json({ success: true, message: "Additional information requested from user." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process deposit action";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { txIds } = body;
    if (!Array.isArray(txIds) || txIds.length === 0) {
      return NextResponse.json({ error: "txIds array required" }, { status: 400 });
    }

    const count = bulkApproveDeposits(txIds.map(Number));
    return NextResponse.json({ success: true, count, message: `Approved ${count} deposit requests.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to bulk approve deposits";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
