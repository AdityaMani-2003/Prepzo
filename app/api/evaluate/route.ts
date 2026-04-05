import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/services/ai.service";
import { generateEmbedding } from "@/lib/ai/gemini";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = await createClient();

  // AUTH CHECK
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    console.error("[evaluate] AUTH FAILED:", userError);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // PARSE BODY
  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { question, answer, topic } = body;
  if (!question || !answer) {
    return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
  }

  // RAG (non-blocking)
  let ragContext = "";
  try {
    const vec = await generateEmbedding(answer);
    const { data: chunks } = await supabase.rpc("match_resume_chunks", {
      query_embedding: vec, match_threshold: 0.3, match_count: 3, auth_user_id: user.id,
    });
    if (chunks?.length) ragContext = chunks.map((c: any) => c.content).join("\n\n---\n\n");
  } catch (e: any) { console.warn("[evaluate] RAG skipped:", e.message); }

  // AI EVALUATION
  let result: any;
  try {
    result = await evaluateAnswer(question, answer, ragContext);
  } catch (aiErr: any) {
    console.error("[evaluate] AI FAILED:", aiErr.message);
    return NextResponse.json({ error: "AI evaluation failed: " + aiErr.message }, { status: 500 });
  }

  // STORE EVALUATION — skip interview_sessions (PGRST204 bug), write directly to messages
  const commScore = result.score_breakdown?.communication || (result.score_breakdown as any)?.structure || 0;
  const avgScore = Math.round(
    ((result.score_breakdown?.clarity || 0) + (result.score_breakdown?.technical || 0) + commScore) / 3
  );

  // Use a deterministic "virtual session" UUID based on user+topic to group evals
  const virtualSessionId = crypto.randomUUID();

  const { data: insertData, error: insertErr } = await supabase
    .from("interview_messages")
    .insert({
      session_id: virtualSessionId,
      user_id: user.id,
      type: "evaluation",
      content: result.why_this_score || "Evaluation complete.",
      score: avgScore || 5,
      metadata: {
        score_breakdown: result.score_breakdown,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        improved_answer: result.improved_answer,
        topic: topic || "General",
      },
    })
    .select();

  if (insertErr) {
    console.error("[evaluate] Insert failed:", insertErr);
  }

  revalidatePath("/progress");

  return NextResponse.json(result);
}
