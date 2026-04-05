import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { generateQuestion } from "@/services/ai.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role } = body;

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'role' field" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    // Fetch latest resume for the authenticated user
    let resumeText = "";
    try {
      const { data: resume } = await supabase
        .from("resumes")
        .select("parsed_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (resume?.parsed_text) {
        resumeText = resume.parsed_text;

      }
    } catch (resumeErr) {

    }

    const result = await generateQuestion(role, resumeText);
    
    // Log robust session persistence to backend exclusively
    try {
      // 1. Instantiate multi-turn Interview Session
      const { data: sessionData, error: sessionErr } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          role: role
        })
        .select("id")
        .single();
        
      if (!sessionErr && sessionData) {
        // 2. Log first generated structural question
        await supabase.from("interview_messages").insert({
          session_id: sessionData.id,
          user_id: user.id,
          type: "question",
          content: result.question,
          metadata: { difficulty: result.difficulty, topic: result.topic }
        });
      }
    } catch (dbErr) {
      console.error("Failed to log architectural session structure:", dbErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[/api/question] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate question" },
      { status: 500 }
    );
  }
}
