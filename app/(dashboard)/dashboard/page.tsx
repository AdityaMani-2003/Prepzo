import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  Award,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import { StreakCard } from "@/components/StreakCard";
import { DashboardClientExtras } from "@/components/DashboardClientExtras";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard — Prepzo",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user resume
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, file_name, created_at, parsed_text")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Fetch all evaluations for real ELO & stats calculation
  const { data: evals } = await supabase
    .from("interview_messages")
    .select("id, session_id, score, content, metadata, created_at")
    .eq("user_id", user.id)
    .eq("type", "evaluation")
    .order("created_at", { ascending: true });

  // 3. Fetch all messages to identify sessions & streak dates
  const { data: allMessages } = await supabase
    .from("interview_messages")
    .select("id, session_id, type, created_at, metadata")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(150);

  // 4. Fetch skill metrics
  const { data: skillMetrics } = await supabase
    .from("skill_metrics")
    .select("*")
    .eq("user_id", user.id)
    .order("score", { ascending: false });

  // Calculations
  const totalEvaluations = evals?.length || 0;
  let currentElo = 1200; // Baseline
  let totalScoreSum = 0;

  evals?.forEach((e) => {
    if (e.score != null) {
      const numericScore = Number(e.score);
      totalScoreSum += numericScore;
      currentElo += 20 * (numericScore / 10 - 0.5);
    }
  });

  currentElo = Math.max(800, Math.round(currentElo));
  const averageScore = totalEvaluations > 0 ? (totalScoreSum / totalEvaluations).toFixed(1) : "—";

  // Unique session aggregation
  const sessionMap = new Map<string, {
    sessionId: string;
    role: string;
    date: string;
    scores: number[];
  }>();

  allMessages?.forEach((msg) => {
    const sId = msg.session_id;
    if (!sessionMap.has(sId)) {
      sessionMap.set(sId, {
        sessionId: sId,
        role: msg.metadata?.role || msg.metadata?.topic || "Technical Interview",
        date: msg.created_at,
        scores: [],
      });
    }
    const session = sessionMap.get(sId)!;
    if (msg.type === "evaluation" && msg.metadata?.score_breakdown) {
      const breakdown = msg.metadata.score_breakdown;
      const avg = ((breakdown.clarity || 7) + (breakdown.technical || 7) + (breakdown.communication || 7)) / 3;
      session.scores.push(avg);
    }
  });

  const recentSessions = Array.from(sessionMap.values()).slice(0, 5);

  // Distinct dates for streak tracker
  const evalDates = allMessages?.map((m) => m.created_at) || [];

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Candidate";

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      <DashboardClientExtras hasResume={!!resume} />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
            <Zap className="h-3.5 w-3.5" />
            Interview Readiness Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {totalEvaluations > 0
              ? `You've completed ${totalEvaluations} evaluated interview responses. Keep practicing to boost your ELO.`
              : "Get ready to ace your technical interview. Start by completing your profile or launching a mock interview."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/interview">
            <Button variant="primary" className="h-10 px-5 shadow-[var(--shadow-glow)]">
              <MessageSquare className="h-4 w-4" />
              New Interview
            </Button>
          </Link>
          <Link href="/interview/live">
            <Button variant="outline" className="h-10 px-4">
              Live Voice Mode
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ELO Rating Card */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 flex flex-col justify-between card-interactive">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-medium uppercase tracking-wider">Current ELO</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{currentElo}</span>
            <span className="text-xs text-[var(--text-muted)]">baseline 1200</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Updated with every verified answer</span>
          </div>
        </div>

        {/* Avg Performance */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 flex flex-col justify-between card-interactive">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Answer Score</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <BarChart2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{averageScore}</span>
            <span className="text-xs text-[var(--text-muted)]">/ 10.0</span>
          </div>
          <div className="mt-3 text-xs text-[var(--text-secondary)]">
            {totalEvaluations} evaluated answers
          </div>
        </div>

        {/* Resume RAG Status */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 flex flex-col justify-between card-interactive">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-medium uppercase tracking-wider">Resume Context</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            {resume ? (
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  RAG Vectorized
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-2 truncate max-w-[200px]">
                  {resume.file_name}
                </p>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No Resume
                </span>
                <Link
                  href="/resume"
                  className="block text-xs font-medium text-[var(--accent)] hover:underline mt-2"
                >
                  Upload now for targeted questions →
                </Link>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-[var(--text-muted)]">
            {resume ? "Powering personalized questions" : "Generic questions active"}
          </div>
        </div>

        {/* Streak Component */}
        <StreakCard evalDates={evalDates} />
      </div>

      {/* Main Grid: Quick Practice + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick Interview Presets */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Launch Quick Practice
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Select a domain to start an AI mock interview tailored to industry standards.
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { title: "Frontend Developer", desc: "React, Next.js, Web Vitals, DOM" },
                { title: "Backend Engineer", desc: "APIs, PostgreSQL, Microservices, Caching" },
                { title: "Full Stack Engineer", desc: "End-to-end architectures & data flow" },
                { title: "System Design", desc: "Scalability, load balancing, distributed DBs" },
                { title: "DevOps & Cloud", desc: "CI/CD, Kubernetes, Docker, AWS" },
                { title: "Behavioral & Leadership", desc: "STAR method, conflict, ownership" },
              ].map((rolePreset) => (
                <Link
                  key={rolePreset.title}
                  href={`/interview?role=${encodeURIComponent(rolePreset.title)}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {rolePreset.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                      {rolePreset.desc}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                    Start session <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Interview History */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Recent Practice Sessions
              </h2>
              <Link
                href="/history"
                className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="rounded-xl bg-[var(--bg-surface)] p-3 border border-[var(--border-subtle)] mb-3">
                  <Clock className="h-6 w-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No interview sessions yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                  Complete your first interview to track your response quality and answer progression.
                </p>
                <Link href="/interview" className="mt-4">
                  <Button variant="primary" className="h-9 px-4 text-xs">
                    Start Your First Interview
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {recentSessions.map((session) => {
                  const avgScore =
                    session.scores.length > 0
                      ? (
                          session.scores.reduce((a, b) => a + b, 0) /
                          session.scores.length
                        ).toFixed(1)
                      : null;

                  return (
                    <div
                      key={session.sessionId}
                      className="py-3.5 flex items-center justify-between hover:bg-[var(--bg-card-hover)] px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[var(--accent-subtle)] p-2 text-[var(--accent)]">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {session.role}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(session.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {avgScore ? (
                          <div className="text-right">
                            <span className="text-xs font-semibold text-[var(--green)]">
                              {avgScore} / 10
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)]">Score</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">In progress</span>
                        )}
                        <Link href="/history">
                          <Button variant="ghost" className="h-8 px-2">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Skill Strength & 7-Day Coach Snapshot */}
        <div className="flex flex-col gap-6">
          {/* Skill Performance Widget */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              Skill Metrics
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Real evaluation scores aggregated by role and domain.
            </p>

            {skillMetrics && skillMetrics.length > 0 ? (
              <div className="space-y-3">
                {skillMetrics.slice(0, 5).map((metric) => (
                  <div key={metric.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[var(--text-primary)]">
                        {metric.skill_name}
                      </span>
                      <span className="font-semibold text-[var(--accent)]">
                        {metric.score} / 10
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                        style={{ width: `${Math.min(100, (metric.score / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Complete interview evaluations to generate granular skill benchmarks.
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
              <Link
                href="/progress"
                className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center justify-between"
              >
                <span>Full Skill Analytics & Radar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 7-Day Plan CTA Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-[var(--bg-card)] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Target className="h-4 w-4" />
              7-Day Improvement Plan
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Targeted Curriculum
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              Generate a personalized study roadmap targeting your diagnosed weak areas, complete with PDF and plain-text export.
            </p>

            <Link href="/progress" className="mt-4 block">
              <Button variant="primary" className="w-full justify-center h-9 text-xs">
                View & Generate Plan
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
