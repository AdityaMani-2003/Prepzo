import { NextResponse } from "next/server";
import { generateFollowUp } from "@/services/ai.service";
import { generateEmbedding } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'question' field" },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'answer' field" },
        { status: 400 }
      );
    }

    // --- Vector Semantic RAG Retrieval ---
    let ragContext = "";
    try {
      const vectorQuery = await generateEmbedding(answer);
      
      const { data: similarChunks, error: rpcError } = await supabase.rpc("match_resume_chunks", {
        query_embedding: vectorQuery,
        match_threshold: 0.3,
        match_count: 3, 
        auth_user_id: user.id
      });
      
      if (!rpcError && similarChunks && similarChunks.length > 0) {
        ragContext = similarChunks.map((chunk: any) => chunk.content).join("\n\n---\n\n");
      }
    } catch (ragErr) {
       console.error("[RAG Semantic Fetch] Follow-up RAG block failed, skipping gracefully.", ragErr);
    }

    const result = await generateFollowUp(question, answer, ragContext);

    try {
      // Find latest active session for this user
      const { data: session } = await supabase
        .from("interview_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (session && result.follow_up_question) {
        // Log AI Follow-up Question
        await supabase.from("interview_messages").insert({
          session_id: session.id,
          user_id: user.id,
          type: "question",
          content: result.follow_up_question
        });
      }
    } catch (sessionErr) {
       console.error("Failed to map follow-up to active session:", sessionErr);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/follow-up] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate follow-up question" },
      { status: 500 }
    );
  }
}
