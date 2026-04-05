import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, FileText, MessageSquare, Mic,
  Target, Award, AlertCircle, ArrowUpRight, Sparkles,
} from "lucide-react";
import { DashboardClientExtras } from "@/components/DashboardClientExtras";
import { StreakCard } from "@/components/StreakCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let latestResume: any = null;
  let evals: any[] | null = null;
  try {
    const { data, error } = await supabase
      .from("resumes")
      .select("file_name, parsed_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error("Resume fetch error:", error);
    latestResume = data;
  } catch (err) {
    console.error("Resume fetch exception:", err);
  }

  try {
    const { data, error } = await supabase
      .from("interview_messages")
      .select("score, metadata, created_at")
      .eq("user_id", user.id)
      .eq("type", "evaluation")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) console.error("Evals fetch error:", error);
    evals = data;
  } catch (err) {
    console.error("Evals fetch exception:", err);
  }

  // Skills extraction
  const techList = ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "AWS", "Docker", "SQL", "Next.js", "GraphQL", "Tailwind", "Kubernetes", "Azure", "Go", "Rust"];
  const extractedSkills = techList.filter((s) => {
    if (typeof latestResume?.parsed_text !== "string") return false;
    try { return new RegExp(`\\b${s}\\b`, "i").test(latestResume.parsed_text); } catch { return false; }
  }).slice(0, 8);

  // Performance metrics
  const total = evals?.length || 0;
  const lastScore = evals?.[0]?.score || 0;

  let elo = 1200;
  const sorted = [...(evals || [])].reverse();
  for (const ev of sorted) elo = Math.round(elo + 20 * ((ev.score || 0) / 10 - 0.5));

  let strongest = "—", weakest = "—";
  if (total > 0) {
    const sums = { clarity: 0, technical: 0, communication: 0 };
    let count = 0;
    for (const ev of evals!) {
      const b = ev.metadata?.score_breakdown;
      if (b) { sums.clarity += b.clarity || 0; sums.technical += b.technical || 0; sums.communication += b.communication || b.structure || 0; count++; }
    }
    if (count > 0) {
      const avgs = { Clarity: sums.clarity / count, Technical: sums.technical / count, Communication: sums.communication / count };
      const entries = Object.entries(avgs);
      strongest = entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
      weakest = entries.reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    }
  }

  const resumeDate = latestResume?.created_at
    ? new Date(latestResume.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl flex flex-col gap-7 animate-fadeInUp">
      {/* Onboarding modal (client) */}
      <DashboardClientExtras hasResume={!!latestResume} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h1>
        <p className="text-[13px] text-gray-500 mt-1">Your interview preparation at a glance.</p>
      </div>

      {/* Performance Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {[
          { label: "Career ELO", value: total > 0 ? elo : "—", icon: TrendingUp, color: "indigo" },
          { label: "Last Score", value: lastScore || "—", suffix: lastScore ? "/10" : "", icon: Target, color: "emerald" },
          { label: "Strongest", value: strongest, icon: Award, color: "blue" },
          { label: "Needs Work", value: weakest, icon: AlertCircle, color: "orange" },
        ].map((item) => (
          <div key={item.label} className={`card-interactive rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-default)] p-4 hover:border-${item.color}-500/20 transition-all duration-200`}>
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</span>
              <item.icon className={`h-3.5 w-3.5 text-${item.color}-400`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</span>
              {item.suffix && <span className="text-[11px] text-gray-400 dark:text-gray-600">{item.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Streak (Left) & Resume (Right) */}
      <div className="grid gap-5 lg:grid-cols-5">
        
        {/* Left Column Stack: Quick Actions */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-default)] p-5 h-full">
            <h2 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-3 stagger">
              {[
                { href: "/interview", label: "Practice Interview", desc: "AI-powered text evaluation", icon: MessageSquare, color: "indigo" },
                { href: "/interview/live", label: "Live Interview", desc: "Voice-activated mock session", icon: Mic, color: "emerald" },
                { href: "/resume", label: latestResume ? "Update Resume" : "Upload Resume", desc: "Personalize your coaching", icon: FileText, color: "purple" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className={`card-premium flex flex-col items-start gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-all duration-200 hover:border-${item.color}-500/25 hover:shadow-lg hover:shadow-${item.color}-500/5 group`}
                >
                  <div className={`rounded-lg bg-${item.color}-500/10 p-2 text-${item.color}-400 group-hover:bg-${item.color}-500/20 transition-colors`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-semibold text-gray-900 dark:text-white mb-0.5">{item.label}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-600 leading-snug">{item.desc}</span>
                  </div>
                  <ArrowUpRight className={`h-3 w-3 text-gray-400 dark:text-gray-700 group-hover:text-${item.color}-400 transition-colors mt-auto`} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Stack: Resume */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Resume Card */}
          <div className="card-interactive rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-default)] p-5 flex flex-col h-full">
            <h2 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Resume</h2>
            {latestResume ? (
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate mb-0.5" title={latestResume.file_name}>{latestResume.file_name}</p>
                  {resumeDate && <p className="text-[11px] text-gray-500 dark:text-gray-600 mb-3">Updated {resumeDate}</p>}
                  <div className="flex flex-wrap gap-1">
                    {extractedSkills.map((s) => (
                      <span key={s} className="rounded-md border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] px-2 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href="/resume" className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all">
                    Update Resume
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-start justify-center">
                <div className="rounded-lg bg-gray-100 dark:bg-white/[0.03] p-2.5 mb-3">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-0.5">No resume yet</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-600 mb-4">Upload your resume for personalized coaching</p>
                <Link href="/resume" className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-[12px] font-semibold text-white hover:bg-indigo-400 transition-all">
                  Upload Resume
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Streak Card spanning across the entire layout */}
      <StreakCard evalDates={evals?.map(e => e.created_at) || []} />

      {/* Analytics CTA */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500/[0.07] to-purple-500/[0.07] border border-indigo-500/[0.1] p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Performance Analytics</h3>
          </div>
          <p className="text-[12px] text-gray-500 dark:text-gray-400">Track your ELO trajectory and skill distribution.</p>
        </div>
        <Link href="/progress" className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-[12px] font-semibold text-white hover:bg-indigo-400 transition-all">
          View Progress <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
