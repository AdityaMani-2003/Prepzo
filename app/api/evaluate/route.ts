import { createClient } from "@/lib/supabaseServer";
import { generateEmbedding } from "@/lib/ai/gemini";
import { evaluateAnswer } from "@/services/ai.service";
import { saveFeedback } from "@/services/feedback.service";
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

    const { question, answer, topic = "General Technical", sessionId } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Both question and answer are required" },
        { status: 400 }
      );
    }

    const activeSessionId = sessionId || crypto.randomUUID();

    // 1. RAG Context Retrieval from user's resume embeddings
    let ragContext = "";
    try {
      if (answer.trim().length > 20) {
        const queryVector = await generateEmbedding(answer.substring(0, 1000));
        const { data: chunks, error: rpcError } = await supabase.rpc(
          "match_resume_chunks",
          {
            query_embedding: queryVector,
            match_threshold: 0.3,
            match_count: 3,
            auth_user_id: user.id,
          }
        );

        if (!rpcError && chunks && chunks.length > 0) {
          ragContext = chunks.map((c: { content: string }) => c.content).join("\n---\n");
        }
      }
    } catch (ragErr) {
      console.warn("[evaluate] RAG retrieval skipped or failed:", ragErr);
    }

    // 2. AI Evaluation via Gemini
    const evalResult = await evaluateAnswer(question, answer, ragContext);

    const breakdown = evalResult.score_breakdown || {
      clarity: 7,
      technical: 7,
      communication: 7,
    };

    const clarity = Number(breakdown.clarity) || 7;
    const technical = Number(breakdown.technical) || 7;
    const communication = Number(breakdown.communication || breakdown.structure) || 7;

    const overallScore = Math.round(((clarity + technical + communication) / 3) * 10) / 10;

    // 3. Save Candidate Answer to interview_messages
    await supabase.from("interview_messages").insert({
      session_id: activeSessionId,
      user_id: user.id,
      type: "answer",
      content: truncate(answer.trim(), 4000),
      score: null,
      metadata: { question: truncate(question, 500), topic },
    });

    // 4. Save Evaluation to interview_messages
    const whyThisScore = evalResult.why_this_score || "Evaluation based on clarity, technical accuracy, and structure.";
    const improvedAnswer = evalResult.improved_answer || "";

    await supabase.from("interview_messages").insert({
      session_id: activeSessionId,
      user_id: user.id,
      type: "evaluation",
      content: truncate(whyThisScore, 2000),
      score: overallScore,
      metadata: {
        score_breakdown: { clarity, technical, communication },
        strengths: evalResult.strengths || [],
        weaknesses: evalResult.weaknesses || [],
        improved_answer: truncate(improvedAnswer, 1500),
        why_this_score: truncate(whyThisScore, 1000),
        topic,
        question: truncate(question, 500),
      },
    });

    // 5. Update skill metrics & auto prune
    try {
      await saveFeedback(
        {
          user_id: user.id,
          question,
          user_answer: answer,
          clarity_score: clarity,
          technical_score: technical,
          structure_score: communication,
          strengths: evalResult.strengths || [],
          weaknesses: evalResult.weaknesses || [],
          improved_answer: improvedAnswer,
        },
        topic
      );
    } catch (saveErr) {
      console.warn("[evaluate] saveFeedback failed:", saveErr);
    }

    await pruneOldMessages(supabase, user.id);

    return NextResponse.json({
      success: true,
      score: overallScore,
      score_breakdown: { clarity, technical, communication },
      strengths: evalResult.strengths || [],
      weaknesses: evalResult.weaknesses || [],
      improved_answer: improvedAnswer,
      optimal_solution: evalResult.optimal_solution || "",
      why_this_score: whyThisScore,
      sessionId: activeSessionId,
    });
  } catch (error: any) {
    console.error("[evaluate] Error during evaluation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
