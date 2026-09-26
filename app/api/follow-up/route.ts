import { createClient } from "@/lib/supabaseServer";
import { generateEmbedding } from "@/lib/ai/gemini";
import { generateFollowUp } from "@/services/ai.service";
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

    const { question, answer, sessionId } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Both question and answer are required" },
        { status: 400 }
      );
    }

    const activeSessionId = sessionId || crypto.randomUUID();

    // Context retrieval for deeper follow up
    let ragContext = "";
    try {
      if (answer.trim().length > 20) {
        const queryVector = await generateEmbedding(answer.substring(0, 1000));
        const { data: chunks } = await supabase.rpc("match_resume_chunks", {
          query_embedding: queryVector,
          match_threshold: 0.3,
          match_count: 2,
          auth_user_id: user.id,
        });

        if (chunks && chunks.length > 0) {
          ragContext = chunks.map((c: { content: string }) => c.content).join("\n---\n");
        }
      }
    } catch {
      // Best-effort
    }

    const result = await generateFollowUp(question, answer, ragContext);

    // Save follow-up to messages
    await supabase.from("interview_messages").insert({
      session_id: activeSessionId,
      user_id: user.id,
      type: "question",
      content: truncate(result.follow_up_question, 2000),
      score: null,
      metadata: {
        isFollowUp: true,
        parentQuestion: truncate(question, 500),
      },
    });

    await pruneOldMessages(supabase, user.id);

    return NextResponse.json({
      follow_up_question: result.follow_up_question,
      sessionId: activeSessionId,
    });
  } catch (error: any) {
    console.error("[follow-up] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate follow-up" },
      { status: 500 }
    );
  }
}
