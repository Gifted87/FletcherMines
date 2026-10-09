import { NextResponse } from "next/server";
import { getAdminOverviewData } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Master Admin credentials required." }, { status: 401 });
  }

  try {
    const data = getAdminOverviewData();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load admin overview";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
