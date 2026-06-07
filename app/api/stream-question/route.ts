import { createClient } from "@/lib/supabaseServer";
import { streamQuestion } from "@/services/ai.service";
import { pruneOldMessages, truncate } from "@/utils/pruneMessages";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, targetCompany } = body;

    if (!role || typeof role !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'role' field" }), { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("[stream-question] AUTH FAILED");
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }



    // Fetch resume (non-blocking)
    let resumeText = "";
    try {
      const { data: resume } = await supabase
        .from("resumes").select("parsed_text").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1).single();
      if (resume?.parsed_text) resumeText = resume.parsed_text;
    } catch { /* no resume yet */ }

    // SSE Stream — skip session creation (PGRST204 bug on interview_sessions)
    const encoder = new TextEncoder();
    let completeText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamQuestion(role, resumeText, targetCompany)) {
            if (chunk) {
              completeText += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, topic: role, difficulty: "hard" })}\n\n`));
          controller.close();

          // Log question to messages (skip session FK)
          if (completeText.trim()) {
            await supabase.from("interview_messages").insert({
              session_id: crypto.randomUUID(),
              user_id: user.id,
              type: "question",
              content: truncate(completeText, 2000),
              metadata: { difficulty: "hard", topic: role },
            });
            // Prune oldest rows if user exceeds cap (non-blocking)
            pruneOldMessages(supabase, user.id);
          }
        } catch (err: any) {
          console.error("[stream-question] ERROR:", err.message);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "Unable to generate question, please try again" })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, topic: role, difficulty: "hard" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (error: any) {
    console.error("[stream-question] FATAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
