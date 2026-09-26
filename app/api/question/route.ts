import { createClient } from "@/lib/supabaseServer";
import { generateQuestion } from "@/services/ai.service";
import { pruneOldMessages, truncate } from "@/utils/pruneMessages";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role = "Fullstack Engineer", resumeText, sessionId } = await req.json();

    let context = resumeText;
    if (!context) {
      const { data: resumeRow } = await supabase
        .from("resumes")
        .select("parsed_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeRow?.parsed_text) {
        context = resumeRow.parsed_text;
      }
    }

    const result = await generateQuestion(role, context);
    const activeSessionId = sessionId || crypto.randomUUID();

    await supabase.from("interview_messages").insert({
      session_id: activeSessionId,
      user_id: user.id,
      type: "question",
      content: truncate(result.question, 2000),
      score: null,
      metadata: { role, topic: result.topic },
    });

    await pruneOldMessages(supabase, user.id);

    return NextResponse.json({ ...result, sessionId: activeSessionId });
  } catch (error: any) {
    console.error("[api/question] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate question" },
      { status: 500 }
    );
  }
}
