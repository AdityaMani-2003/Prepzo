import { redirect } from "next/navigation";
import { TrendingUp, Target, Award, BarChart3, AlertCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import { ImprovementPlan } from "@/components/ImprovementPlan";
import ProgressChartsClient from "./ProgressChartsClient";

export const metadata = {
  title: "Progress & Analytics — Prepzo",
};

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all evaluations for real metrics
  const { data: evaluations } = await supabase
    .from("interview_messages")
    .select("id, score, metadata, created_at")
    .eq("user_id", user.id)
    .eq("type", "evaluation")
    .order("created_at", { ascending: true });

  // Calculate ELO progression
  let runningElo = 1200;
  const eloTrajectory: { date: string; elo: number; score: number }[] = [];
  let sumClarity = 0;
  let sumTechnical = 0;
  let sumComm = 0;
  let validBreakdownCount = 0;

  const weaknessCountMap = new Map<string, number>();

  evaluations?.forEach((ev, idx) => {
    const score = Number(ev.score) || 7;
    runningElo += 20 * (score / 10 - 0.5);

    eloTrajectory.push({
      date: new Date(ev.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      elo: Math.round(runningElo),
      score,
    });

    if (ev.metadata?.score_breakdown) {
      const b = ev.metadata.score_breakdown;
      sumClarity += Number(b.clarity) || 7;
      sumTechnical += Number(b.technical) || 7;
      sumComm += Number(b.communication || b.structure) || 7;
      validBreakdownCount++;
    }

    if (Array.isArray(ev.metadata?.weaknesses)) {
      ev.metadata.weaknesses.forEach((w: string) => {
        const clean = w.trim();
        if (clean) {
          weaknessCountMap.set(clean, (weaknessCountMap.get(clean) || 0) + 1);
        }
      });
    }
  });

  const finalElo = Math.round(runningElo);
  const avgClarity = validBreakdownCount > 0 ? (sumClarity / validBreakdownCount).toFixed(1) : "—";
  const avgTechnical = validBreakdownCount > 0 ? (sumTechnical / validBreakdownCount).toFixed(1) : "—";
  const avgComm = validBreakdownCount > 0 ? (sumComm / validBreakdownCount).toFixed(1) : "—";

  // Top weak areas sorted by frequency
  const sortedWeakAreas = Array.from(weaknessCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto pb-16 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
          <TrendingUp className="h-4 w-4" />
          Analytics & Skill Progression
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Performance Analytics & ELO History
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track your interview rating trajectory, identify recurring communication gaps, and execute your personalized 7-day study curriculum.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-interactive">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Current ELO
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{finalElo}</span>
            <span className="text-xs text-[var(--text-muted)]">baseline 1200</span>
          </div>
          <div className="mt-2 text-xs text-indigo-400">
            {finalElo >= 1200 ? `+${finalElo - 1200} points earned` : `${finalElo - 1200} points`}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-interactive">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Clarity Average
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{avgClarity}</span>
            <span className="text-xs text-[var(--text-muted)]">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">Structure & conciseness</div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-interactive">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Technical Depth
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{avgTechnical}</span>
            <span className="text-xs text-[var(--text-muted)]">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">Accuracy & complexity</div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 card-interactive">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Communication
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{avgComm}</span>
            <span className="text-xs text-[var(--text-muted)]">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">Delivery & rationale</div>
        </div>
      </div>

      {/* Visual Chart Component */}
      <ProgressChartsClient
        eloData={eloTrajectory}
        breakdown={{
          clarity: Number(avgClarity) || 7,
          technical: Number(avgTechnical) || 7,
          communication: Number(avgComm) || 7,
        }}
      />

      {/* Top Diagnosed Weaknesses */}
      {sortedWeakAreas.length > 0 && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
            <AlertCircle className="h-4 w-4" />
            Diagnosed Focus Areas
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedWeakAreas.map((w, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Personalized 7-Day Improvement Coach */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Personalized 7-Day Curriculum
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Generated directly from your past evaluations. Check off tasks as you complete them, or export as PDF.
          </p>
        </div>

        <ImprovementPlan weakAreas={sortedWeakAreas} eloScore={finalElo} />
      </div>
    </div>
  );
}
