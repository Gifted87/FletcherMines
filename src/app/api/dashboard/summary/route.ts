import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboardData";
import { getRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let identifier = searchParams.get("user") || searchParams.get("username") || undefined;

    if (!identifier) {
      const session = getRequestSession(req);
      if (session) {
        identifier = String(session.userId);
      }
    }

    if (!identifier) {
      return NextResponse.json({ error: "Unauthorized. Please log in to view dashboard." }, { status: 401 });
    }

    const data = getDashboardData(identifier);

    if (!data) {
      return NextResponse.json({ error: "Failed to load dashboard data from database." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
