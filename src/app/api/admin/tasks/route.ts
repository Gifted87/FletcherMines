import { NextResponse } from "next/server";
import { getTaskEngineData, updateTaskSettings, addDailyTaskQuestion, deleteDailyTaskQuestion } from "@/lib/adminData";
import { getAdminRequestSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = getTaskEngineData();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load task engine data";
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
    updateTaskSettings(body);
    return NextResponse.json({ success: true, message: "Task engine settings saved." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update task settings";
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
    const { questionText, optionA, optionB, optionC, optionD, correctOption, explanation } = body;

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return NextResponse.json({ error: "All question options and correct answer required." }, { status: 400 });
    }

    addDailyTaskQuestion({
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation: explanation || "",
    });

    return NextResponse.json({ success: true, message: "Daily question added successfully." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add question";
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
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Question ID required" }, { status: 400 });

    deleteDailyTaskQuestion(Number(id));
    return NextResponse.json({ success: true, message: "Question removed." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
