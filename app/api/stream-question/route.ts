import { createClient } from "@/lib/supabaseServer";
import { streamQuestion } from "@/services/ai.service";
import { pruneOldMessages, truncate } from "@/utils/pruneMessages";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { role, targetCompany, roundType, experienceLevel, sessionId } = body;

    if (!role || typeof role !== "string") {
      return new Response(JSON.stringify({ error: "Role is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user's resume text if available
    let resumeText = "";
    try {
      const { data: resumeRow } = await supabase
        .from("resumes")
        .select("parsed_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeRow?.parsed_text) {
        resumeText = resumeRow.parsed_text;
      }
    } catch (err) {
      console.warn("[stream-question] Could not retrieve resume:", err);
    }

    const currentSessionId = sessionId || crypto.randomUUID();
    let accumulatedQuestion = "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamQuestion({
            role,
            resumeText,
            targetCompany,
            roundType,
            experienceLevel,
          });

          for await (const chunk of generator) {
            if (chunk) {
              accumulatedQuestion += chunk;
              const payload = JSON.stringify({ text: chunk });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
          }

          // Complete signal
          const donePayload = JSON.stringify({
            done: true,
            topic: role,
            difficulty: "intermediate/advanced",
            sessionId: currentSessionId,
          });
          controller.enqueue(encoder.encode(`data: ${donePayload}\n\n`));

          // Save generated question to DB asynchronously
          if (accumulatedQuestion.trim()) {
            try {
              await supabase.from("interview_messages").insert({
                session_id: currentSessionId,
                user_id: user.id,
                type: "question",
                content: truncate(accumulatedQuestion.trim(), 2000),
                score: null,
                metadata: {
                  role,
                  targetCompany: targetCompany || null,
                  hasResumeContext: !!resumeText,
                },
              });

              // Best-effort pruning
              await pruneOldMessages(supabase, user.id);
            } catch (dbErr) {
              console.error("[stream-question] Message save error:", dbErr);
            }
          }

          controller.close();
        } catch (streamErr: any) {
          console.error("[stream-question] Generation error:", streamErr);
          const errPayload = JSON.stringify({
            error: streamErr?.message || "Failed to stream interview question.",
          });
          controller.enqueue(encoder.encode(`event: error\ndata: ${errPayload}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[stream-question] Endpoint exception:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
