import { callGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabaseServer";

export async function generateImprovementPlan(userId: string) {
  const supabase = await createClient();

  // Fetch skill metrics (tiny table — one row per skill per user)
  const { data: skillMetrics } = await supabase
    .from("skill_metrics")
    .select("*")
    .eq("user_id", userId);

  // Fetch recent evaluations from interview_messages instead of the feedback table.
  // This avoids maintaining a duplicate table; the same data lives in metadata.
  const { data: recentEvals } = await supabase
    .from("interview_messages")
    .select("score, metadata, created_at")
    .eq("user_id", userId)
    .eq("type", "evaluation")
    .order("created_at", { ascending: false })
    .limit(10);

  // Shape the data to match what the AI prompt expects
  const feedback = (recentEvals || []).map((msg) => ({
    question: msg.metadata?.question ?? "",
    clarity_score: msg.metadata?.score_breakdown?.clarity ?? 0,
    technical_score: msg.metadata?.score_breakdown?.technical ?? 0,
    structure_score: msg.metadata?.score_breakdown?.communication ?? msg.metadata?.score_breakdown?.structure ?? 0,
    strengths: msg.metadata?.strengths ?? [],
    weaknesses: msg.metadata?.weaknesses ?? [],
    created_at: msg.created_at,
  }));

  const prompt = `
You are an AI career coach.

Analyze this user's interview performance.

Skill Metrics:
${JSON.stringify(skillMetrics)}

Recent Feedback:
${JSON.stringify(feedback)}

Generate:

1. Top Strengths (3 points)
2. Weak Areas (3 points)
3. 7-Day Improvement Plan
4. Recommended Topics to Focus

Return JSON:
{
  "strengths": [],
  "weak_areas": [],
  "plan": [],
  "recommended_topics": []
}
`;

  const response = await callGemini(prompt);
  return JSON.parse(response.replace(/```json\n?|```\n?/g, "").trim());
}
