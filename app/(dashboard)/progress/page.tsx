import { createClient } from "@/lib/supabaseServer";
import { ProgressUI } from "./ProgressUI";
import { ImprovementPlan } from "@/components/ImprovementPlan";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }



  // Fetch evaluation messages for this user
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "evaluation")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[progress] FETCH ERROR:", error);
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-400">Failed to load analytics data. {error.message}</p>
      </div>
    );
  }

  // Extract weak areas and elo for improvement plan
  const evaluations = data || [];
  const weaknesses: string[] = [];
  let elo = 1200;
  for (const ev of evaluations) {
    if (ev.metadata?.weaknesses) weaknesses.push(...ev.metadata.weaknesses);
    elo = Math.round(elo + 20 * ((ev.score || 0) / 10 - 0.5));
  }
  // Deduplicate and take top 5
  const uniqueWeaknesses = [...new Set(weaknesses.map((w: string) => w.replace(/The candidate /gi, "")))].slice(0, 5);

  return (
    <div className="px-4 py-8">
      <ProgressUI evaluations={evaluations} />
      <ImprovementPlan weakAreas={uniqueWeaknesses} eloScore={elo} />
    </div>
  );
}
