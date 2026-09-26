import { callGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabaseServer";
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

    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Resume text required" }, { status: 400 });
    }

    const prompt = `
You are an expert technical recruiter and resume evaluator.
Analyze this candidate resume:
"""
${text.substring(0, 4000)}
"""

Extract structured intelligence. Return ONLY valid JSON, no markdown formatting, no code fencing:
{
  "skills": ["Skill1", "Skill2", "Skill3"],
  "suggestedRoles": ["Role 1", "Role 2"],
  "summary": "2-3 sentence executive summary of the candidate's core strengths and technical domain",
  "experienceLevel": "Junior" | "Mid-Level" | "Senior" | "Lead/Staff"
}
`;

    const aiResponse = await callGemini(prompt);
    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      skills: parsed.skills || [],
      suggestedRoles: parsed.suggestedRoles || [],
      summary: parsed.summary || "",
      experienceLevel: parsed.experienceLevel || "Mid-Level",
    });
  } catch (error: any) {
    console.error("[resume/analyze] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
