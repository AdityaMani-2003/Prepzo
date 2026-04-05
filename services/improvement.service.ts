import { callGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabaseServer";

export async function generateImprovementPlan(userId: string) {
  const supabase = await createClient();

  // Fetch skill metrics
  const { data: skillMetrics } = await supabase
    .from("skill_metrics")
    .select("*")
    .eq("user_id", userId);

  // Fetch recent feedback
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

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
