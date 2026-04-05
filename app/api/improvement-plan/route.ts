import { callGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }

    const body = await request.json();
    const { targetRole, weakAreas, eloScore } = body;

    const prompt = `You are an expert interview coach. Based on the user's weak areas and ELO score, generate a structured 7-day interview improvement plan.

User Context:
- Target Role: ${targetRole || "Software Engineer"}
- Current ELO Score: ${eloScore || 1200}
- Weak Areas: ${weakAreas && weakAreas.length > 0 ? weakAreas.join(", ") : "General improvement needed"}

Return ONLY valid JSON, no explanation, no markdown wrapping:
{
  "days": [
    {
      "day": 1,
      "focus": "string describing the focus area for this day",
      "tasks": [
        {
          "title": "string task title",
          "type": "practice" | "review" | "live",
          "duration": "string like 30 min",
          "description": "string detailed description"
        }
      ],
      "goal": "string daily goal"
    }
  ],
  "summary": "string overall plan summary",
  "targetElo": number
}

Make the plan:
- Highly personalized to their weak areas
- Progressive (easier days first, harder later)
- Actionable with specific tasks (not generic advice)
- Each day should have 2-3 tasks
- Include a mix of practice, review, and live exercise types`;

    const response = await callGemini(prompt);
    const cleaned = response.replace(/```json|```/g, "").trim();

    try {
      const plan = JSON.parse(cleaned);
      return Response.json(plan);
    } catch {
      console.error("[improvement-plan] Parse failed:", cleaned.substring(0, 200));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500 });
    }
  } catch (error: any) {
    console.error("[improvement-plan] FATAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
