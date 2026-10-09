import { NextResponse } from "next/server";
import { getSystemSettingsData, updateSystemSettings, addFaq, deleteFaq } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = getSystemSettingsData();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load system settings";
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
    updateSystemSettings(body);
    return NextResponse.json({ success: true, message: "System settings updated successfully." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update settings";
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
    const { action, question, answer, category, sortOrder } = body;
    if (action === "add_faq") {
      if (!question || !answer) {
        return NextResponse.json({ error: "Question and answer required" }, { status: 400 });
      }
      addFaq(question, answer, category || "general", sortOrder || 0);
      return NextResponse.json({ success: true, message: "FAQ created successfully." });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "FAQ action error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const faqId = searchParams.get("faqId");
    if (!faqId) return NextResponse.json({ error: "faqId required" }, { status: 400 });
    deleteFaq(Number(faqId));
    return NextResponse.json({ success: true, message: "FAQ removed." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete FAQ";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
