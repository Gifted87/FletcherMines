import { NextResponse } from "next/server";
import { getDropsList, createNewDrop, updateDropStatus, addSupplyToDrop } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const list = getDropsList();
    return NextResponse.json(list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load drops";
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
    const { batchName, hardwareModel, totalBlocks, pricePerBlock, minMaturityDays, opensAt, closesAt, status } = body;

    if (!batchName || !hardwareModel || !totalBlocks || !pricePerBlock) {
      return NextResponse.json({ error: "Missing required fields for new drop" }, { status: 400 });
    }

    const now = new Date();
    const ok = createNewDrop({
      batchName,
      hardwareModel,
      totalBlocks: Number(totalBlocks),
      pricePerBlock: Number(pricePerBlock),
      minMaturityDays: Number(minMaturityDays || 14),
      opensAt: opensAt || now.toISOString(),
      closesAt: closesAt || new Date(now.getTime() + 86400000 * 3).toISOString(),
      status: status || "active",
    });

    return NextResponse.json({ success: ok, message: `Drop ${batchName} created successfully.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Drop creation error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { batchId, action, additionalBlocks } = body;

    if (!batchId || !action) {
      return NextResponse.json({ error: "batchId and action required" }, { status: 400 });
    }

    if (action === "add_supply") {
      const ok = addSupplyToDrop(Number(batchId), Number(additionalBlocks || 0));
      return NextResponse.json({ success: ok, message: `Added ${additionalBlocks} blocks to Batch #${batchId}` });
    }

    const ok = updateDropStatus(Number(batchId), action);
    return NextResponse.json({ success: ok, message: `Batch #${batchId} status updated to ${action}.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Drop patch error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
