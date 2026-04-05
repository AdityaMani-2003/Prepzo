import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, key);

async function injectData() {
  const { data: { users } } = await db.auth.admin.listUsers();
  const userId = users[0].id;
  console.log("Injecting diagnostic data for:", userId);

  // 1. Session
  const { data: session } = await db.from("interview_sessions").insert({
    user_id: userId,
    role: "Diagnostic Assessment"
  }).select().single();

  if (session) {
    // 2. Evaluation
    const { data: evalMsg, error } = await db.from("interview_messages").insert({
      session_id: session.id,
      user_id: userId,
      type: "evaluation",
      content: "Excellent structured answer showing true technical competence.",
      score: 8,
      metadata: {
        score_breakdown: { clarity: 8, technical: 9, communication: 7 },
        strengths: ["Clean syntax", "Good error handling"],
        weaknesses: ["Could be slightly more performant"],
        improved_answer: "Use memoization to optimize the render loop."
      }
    }).select();

    console.log("Inject status:", error ? error.message : "SUCCESS - Row visible for ELO Tracking");
  }
}

injectData();
