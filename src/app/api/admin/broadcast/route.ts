import { NextResponse } from "next/server";
import { broadcastAnnouncement } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, urgency, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    broadcastAnnouncement(
      String(title),
      String(content),
      urgency || "high",
      category || "security"
    );

    return NextResponse.json({ success: true, message: "Announcement broadcasted to all users." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to broadcast announcement";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
