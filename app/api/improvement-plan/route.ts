import { createClient } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";
import { getCompanyProfile } from "@/lib/companyData";
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

    const body = await req.json().catch(() => ({}));
    const { weakAreas = [], eloScore = 1200, role: requestedRole, targetCompany: requestedCompany } = body;

    // Fetch user's real skill metrics from database
    const { data: metrics } = await supabase
      .from("skill_metrics")
      .select("skill_name, score")
      .eq("user_id", user.id);

    // Fetch user's recent evaluations
    const { data: evals } = await supabase
      .from("interview_messages")
      .select("metadata, score, role")
      .eq("user_id", user.id)
      .eq("type", "evaluation")
      .order("created_at", { ascending: false })
      .limit(8);

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
      console.warn("[improvement-plan] Could not load resume:", err);
    }

    // Determine effective role & company
    const effectiveRole = requestedRole || evals?.[0]?.role || "Software Engineer";
    const effectiveCompany = requestedCompany || "";
    const companyProfile = effectiveCompany ? getCompanyProfile(effectiveCompany) : null;

    const detectedWeaknesses = new Set<string>(weakAreas);
    evals?.forEach((e) => {
      if (Array.isArray(e.metadata?.weaknesses)) {
        e.metadata.weaknesses.forEach((w: string) => detectedWeaknesses.add(w));
      }
    });

    const targetElo = Math.max(1300, Math.round((eloScore + 100) / 10) * 10);
    const weaknessList = Array.from(detectedWeaknesses).slice(0, 5).join(", ") || "Technical depth, DSA edge cases, SQL window functions, STAR structure";

    // Build rich, practical prompt
    let contextPrompt = `
You are a Principal Engineering Career Coach at Prepzo, an interview preparation platform designed specifically for students and engineers to crack real-world technical interviews.

Candidate Profile:
- Target Role: ${effectiveRole}
- Target Company: ${effectiveCompany || "Top Tech Companies / Industry Standard"}
- Current ELO Rating: ${eloScore}
- Target ELO: ${targetElo}
- Diagnosed Improvement Areas: ${weaknessList}
- Skill Breakdown: ${JSON.stringify(metrics || [])}
`;

    if (companyProfile) {
      contextPrompt += `
COMPANY INTERVIEW INTELLIGENCE (${companyProfile.name} - ${companyProfile.category}):
- Interview Focus: ${companyProfile.interviewFocus}
- Core DSA Topics: ${companyProfile.dsaTopics.join(", ")}
- SQL Focus: ${companyProfile.sqlFocus}
- Behavioral Style: ${companyProfile.behavioralStyle}
${companyProfile.systemDesignFocus ? `- System Architecture: ${companyProfile.systemDesignFocus}` : ""}
`;
    }

    if (resumeText) {
      contextPrompt += `
CANDIDATE RESUME HIGHLIGHTS (excerpt):
${resumeText.slice(0, 1200)}
`;
    }

    contextPrompt += `
PEDAGOGICAL & CURRICULUM REQUIREMENTS:
1. PRACTICAL AND REALISTIC: DO NOT create vague, abstract scenario-only tasks like "Practice Problem Clarification in the abstract".
2. ACTIONABLE & SPECIFIC:
   - Include concrete Data Structures & Algorithms patterns (e.g., Two Pointers, Sliding Window, Binary Search, BFS/DFS, Top K elements) with named example problems to solve.
   - Include practical SQL query writing drills (e.g., Window Functions like ROW_NUMBER()/DENSE_RANK(), Self-Joins, Aggregate filtering with HAVING, CTEs).
   - Include Core CS & OOPs fundamentals (e.g., Polymorphism vs Abstraction, DBMS Indexing B-Trees vs Hash, OS Process vs Thread concurrency).
   - Include Resume Project Defense tasks: have the candidate rehearse explaining technical trade-offs, database choices, or caching in projects mentioned on their resume.
   - Include Behavioral STAR format drills mapped to the target company's culture.
3. STRUCTURE:
   - Provide exactly 7 days of training.
   - Each day must have a focused theme, a concise measurable goal, and 2-3 specific, bite-sized tasks.
   - Each task must have a title, type ("practice" | "review" | "live"), realistic duration ("30 mins", "45 mins", "60 mins"), and a step-by-step description.

Return ONLY a valid JSON object matching this exact TypeScript structure without any Markdown fences:
{
  "role": "${effectiveRole}",
  "targetCompany": "${effectiveCompany}",
  "days": [
    {
      "day": 1,
      "focus": "...",
      "goal": "...",
      "tasks": [
        {
          "title": "...",
          "type": "practice",
          "duration": "45 mins",
          "description": "..."
        }
      ]
    }
  ],
  "summary": "...",
  "targetElo": ${targetElo}
}
`;

    const aiText = await callGemini(contextPrompt);
    const cleaned = aiText.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleaned);

    // Attach role and company if missing
    plan.role = plan.role || effectiveRole;
    plan.targetCompany = plan.targetCompany || effectiveCompany;

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error("[improvement-plan] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate improvement plan" },
      { status: 500 }
    );
  }
}
