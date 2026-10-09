import { NextResponse } from "next/server";
import { getUsersDirectory, updateUserAccountStatus, forceUnlockMaturity, resetDailyTask, initiateKycReview, sendUserMessage } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const filter = searchParams.get("filter") || undefined;

    const users = getUsersDirectory(search, filter);
    return NextResponse.json(users);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load users directory";
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
    const { userId, action, blockId, reason, message } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    if (action === "freeze" || action === "unfreeze") {
      const ok = updateUserAccountStatus(Number(userId), action);
      return NextResponse.json({ success: ok, message: `User #${userId} account ${action}d.` });
    } else if (action === "force_unlock") {
      if (!blockId || !reason) {
        return NextResponse.json({ error: "blockId and reason required for force unlock" }, { status: 400 });
      }
      const ok = forceUnlockMaturity(Number(userId), Number(blockId), String(reason));
      return NextResponse.json({ success: ok, message: `Block #${blockId} maturity unlocked.` });
    } else if (action === "reset_task") {
      const ok = resetDailyTask(Number(userId), body.taskAction || "reset");
      return NextResponse.json({ success: ok, message: `Task status updated for User #${userId}.` });
    } else if (action === "initiate_kyc") {
      const ok = initiateKycReview(Number(userId));
      return NextResponse.json({ success: ok, message: `User #${userId} moved to KYC queue.` });
    } else if (action === "send_message") {
      const ok = sendUserMessage(Number(userId), message || "Notice from Fletcher Mines Administration");
      return NextResponse.json({ success: ok, message: `Message dispatched to User #${userId}.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "User action error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
