"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronDown,
  CheckCircle,
  Circle,
  MessageSquare,
  BookOpen,
  Mic,
  Loader2,
  Target,
  Sparkles,
  Download,
  Building2,
  Briefcase,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { parseAIContent } from "@/utils/parseAI";

interface Task {
  title: string;
  type: "practice" | "review" | "live";
  duration: string;
  description: string;
}

interface DayPlan {
  day: number;
  focus: string;
  tasks: Task[];
  goal: string;
}

interface PlanData {
  days: DayPlan[];
  summary: string;
  targetElo: number;
  role?: string;
  targetCompany?: string;
}

const TASK_ICONS: Record<string, { icon: typeof MessageSquare; color: string }> = {
  practice: { icon: MessageSquare, color: "text-indigo-400" },
  review: { icon: BookOpen, color: "text-amber-400" },
  live: { icon: Mic, color: "text-cyan-400" },
};

const TYPE_LABELS: Record<string, string> = {
  practice: "Practice",
  review: "Review",
  live: "Live Exercise",
};

/**
 * Strip HTML tags for plain-text output (used in PDF and .txt fallback)
 */
function stripHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Generate structured plain text from plan data
 */
function planToText(plan: PlanData): string {
  const lines: string[] = [];
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  lines.push("═══════════════════════════════════════════════");
  lines.push("        YOUR 7-DAY IMPROVEMENT PLAN");
  lines.push("═══════════════════════════════════════════════");
  lines.push("");
  lines.push(`Generated: ${dateStr}`);
  lines.push(`Target ELO: ${plan.targetElo}`);
  if (plan.role) lines.push(`Target Role: ${plan.role}`);
  if (plan.targetCompany) lines.push(`Target Company: ${plan.targetCompany}`);
  lines.push(`Powered by Prepzo — AI Interview Preparation`);
  lines.push("");
  lines.push("───────────────────────────────────────────────");
  lines.push("OVERVIEW");
  lines.push("───────────────────────────────────────────────");
  lines.push(stripHtml(plan.summary));
  lines.push("");

  for (const day of plan.days) {
    lines.push("───────────────────────────────────────────────");
    lines.push(`DAY ${day.day}: ${day.focus}`);
    lines.push(`Goal: ${day.goal}`);
    lines.push("───────────────────────────────────────────────");
    lines.push("");

    for (let i = 0; i < day.tasks.length; i++) {
      const task = day.tasks[i];
      const typeLabel = TYPE_LABELS[task.type] || task.type;
      lines.push(`  ${i + 1}. ${task.title}`);
      lines.push(`     Type: ${typeLabel}  |  Duration: ${task.duration}`);
      lines.push(`     ${stripHtml(task.description)}`);
      lines.push("");
    }
  }

  lines.push("═══════════════════════════════════════════════");
  lines.push("  © Prepzo — Crack your next interview.");
  lines.push("═══════════════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Download fallback as .txt file
 */
function downloadAsText(plan: PlanData) {
  const text = planToText(plan);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Prepzo_Improvement_Plan_${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download PDF using jspdf with zero text overlapping
 */
async function downloadAsPdf(plan: PlanData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const addPageIfNeeded = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
  };

  // ─── Header Banner ──────────────────────────────
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("7-Day Interview Improvement Plan", margin, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  const metaParts = [
    `Date: ${dateStr}`,
    `Target ELO: ${plan.targetElo}`,
    plan.role ? `Role: ${plan.role}` : null,
    plan.targetCompany ? `Target: ${plan.targetCompany}` : null,
  ].filter(Boolean);
  doc.text(metaParts.join("   •   "), margin, 27);

  doc.setFontSize(8);
  doc.setTextColor(165, 180, 252);
  doc.text("Prepzo AI Career Coach — Adaptive curriculum tailored to real hiring standards.", margin, 35);

  y = 52;

  // ─── Summary / Overview ─────────────────────────
  addPageIfNeeded(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Executive Diagnostic Overview", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const summaryText = stripHtml(plan.summary);
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 4);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 8;

  // ─── Day-by-Day Plan ─────────────────────────────
  for (const day of plan.days) {
    const focusText = `Day ${day.day}: ${day.focus}`;
    const focusLines = doc.splitTextToSize(focusText, contentWidth - 10);
    const goalText = `Target Milestone: ${day.goal}`;
    const goalLines = doc.splitTextToSize(goalText, contentWidth - 12);

    const headerHeight = focusLines.length * 5 + goalLines.length * 4 + 7;
    addPageIfNeeded(headerHeight + 25);

    // Day Header Box
    doc.setFillColor(243, 244, 246); // Light slate
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y - 2, contentWidth, headerHeight, 2, 2, "FD");

    // Day Title (Line 1+)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text(focusLines, margin + 4, y + 4);

    const goalY = y + 4 + focusLines.length * 5;

    // Day Goal (Dedicated row below Title - NEVER overlaps!)
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(goalLines, margin + 4, goalY);

    y += headerHeight + 5;

    // Tasks under this day
    for (let i = 0; i < day.tasks.length; i++) {
      const task = day.tasks[i];
      const typeLabel = TYPE_LABELS[task.type] || task.type;
      const descText = stripHtml(task.description);
      const descLines = doc.splitTextToSize(descText, contentWidth - 12);
      const taskSpaceNeeded = 7 + 5 + descLines.length * 4 + 6;

      addPageIfNeeded(taskSpaceNeeded);

      // Task number and Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${task.title}`, margin + 3, y);

      // Badge: Type & Duration
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(99, 102, 241);
      doc.text(`[${typeLabel.toUpperCase()}]`, margin + 5, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Duration: ${task.duration}`, margin + 30, y + 4.5);

      // Description
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(descLines, margin + 5, y + 9);

      y += 9 + descLines.length * 4 + 4;
    }

    y += 4; // Space between days
  }

  // ─── Add Running Page Numbers & Footer ───────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Prepzo AI Career Coach — https://prepzo.com", margin, pageHeight - 7);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 7);
  }

  doc.save(`Prepzo_7Day_Curriculum_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function ImprovementPlan({
  weakAreas,
  eloScore,
  initialRole,
  initialCompany,
}: {
  weakAreas: string[];
  eloScore: number;
  initialRole?: string;
  initialCompany?: string;
}) {
  const [role, setRole] = useState(initialRole || "Full-Stack Software Engineer");
  const [targetCompany, setTargetCompany] = useState(initialCompany || "");
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      const savedCompany = localStorage.getItem("prepzo_target_company");
      if (savedCompany && !initialCompany) setTargetCompany(savedCompany);
      const savedRole = localStorage.getItem("prepzo_role");
      if (savedRole && !initialRole) setRole(savedRole);
    } catch {}
  }, [initialCompany, initialRole]);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/improvement-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weakAreas, eloScore, role, targetCompany }),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [weakAreas, eloScore, role, targetCompany]);

  const handleDownload = useCallback(async () => {
    if (!plan || downloading) return;
    setDownloading(true);
    try {
      await downloadAsPdf(plan);
    } catch (pdfError) {
      console.error("PDF generation failed, falling back to .txt:", pdfError);
      try {
        downloadAsText(plan);
      } catch (txtError) {
        console.error("Text fallback also failed:", txtError);
      }
    } finally {
      setDownloading(false);
    }
  }, [plan, downloading]);

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleTask = (taskKey: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskKey)) next.delete(taskKey);
      else next.add(taskKey);
      return next;
    });
  };

  const popularCompanies = [
    { label: "Google", value: "Google" },
    { label: "Amazon", value: "Amazon" },
    { label: "Meta", value: "Meta" },
    { label: "Microsoft", value: "Microsoft" },
    { label: "Stripe", value: "Stripe" },
    { label: "TCS / Infosys", value: "TCS / Infosys" },
    { label: "High-Growth Startup", value: "High-Growth Startup" },
  ];

  if (!plan) {
    if (loading) {
      return (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-indigo-500/20 p-6 mt-7 shadow-[var(--shadow-elevated)] relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Architecting 7-Day Curriculum
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Analyzing performance, DSA patterns, SQL drills, and target company standards
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3.5 pl-1">
              <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)] animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Synthesizing diagnostic weaknesses & telemetry...
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)] animate-pulse" style={{ animationDelay: "0.4s" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Structuring LeetCode algorithms, SQL challenges, and core CS fundamentals...
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)] animate-pulse" style={{ animationDelay: "0.8s" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Tailoring resume architectural defense and company-specific behavioral drills...
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 mt-7 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="h-4 w-4" />
              Adaptive 7-Day Study Track
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Personalized Engineering Curriculum
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
              Construct a tailored, high-yield preparation schedule focused on your diagnosed gaps, real interview questions, and target company hiring expectations.
            </p>
          </div>
        </div>

        {/* Customization Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Role Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Target Role
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  try { localStorage.setItem("prepzo_role", e.target.value); } catch {}
                }}
                placeholder="e.g. Software Engineer, Backend SDE, Full-Stack"
                className="input-icon-left text-xs"
              />
            </div>
          </div>

          {/* Company Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Target Company (Optional)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => {
                  setTargetCompany(e.target.value);
                  try { localStorage.setItem("prepzo_target_company", e.target.value); } catch {}
                }}
                placeholder="e.g. Google, Amazon, Meta, TCS, Stripe"
                className="input-icon-left text-xs"
              />
            </div>
          </div>
        </div>

        {/* Quick Company Chips */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
            Quick Select Target Standards:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {popularCompanies.map((c) => {
              const isSelected = targetCompany.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setTargetCompany(c.value);
                    try { localStorage.setItem("prepzo_target_company", c.value); } catch {}
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-indigo-500/40 hover:text-[var(--text-primary)]"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={generatePlan}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-all shadow-[var(--shadow-glow)] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Generate Tailored 7-Day Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-5 animate-fadeInUp">
      {/* Summary header */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
                <Briefcase className="h-3 w-3" />
                {plan.role || role}
              </span>
              {(plan.targetCompany || targetCompany) && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
                  <Building2 className="h-3 w-3" />
                  {plan.targetCompany || targetCompany}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <Target className="h-3 w-3" />
                Target ELO: {plan.targetElo}
              </span>
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Your 7-Day Interview Master Plan
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPlan(null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
              title="Change target role or company"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Adjust Targets
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-all shadow-[var(--shadow-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download structured PDF without any text overlapping"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloading ? "Exporting PDF..." : "Export PDF"}
            </button>
          </div>
        </div>

        <div 
          className="text-xs text-[var(--text-secondary)] leading-relaxed pt-3 border-t border-[var(--border-subtle)]"
          dangerouslySetInnerHTML={{ __html: parseAIContent(plan.summary) }}
        />
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {plan.days.map((day) => {
          const isExpanded = expandedDays.has(day.day);
          const dayTaskKeys = day.tasks.map((_, i) => `${day.day}-${i}`);
          const completedCount = dayTaskKeys.filter((k) => completedTasks.has(k)).length;
          const allDone = completedCount === day.tasks.length;

          return (
            <div
              key={day.day}
              className={`rounded-[var(--radius-xl)] border transition-all duration-200 ${
                allDone
                  ? "bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-200 dark:border-emerald-500/30"
                  : "bg-[var(--bg-card)] border-[var(--border-default)]"
              }`}
            >
              {/* Day header */}
              <button
                type="button"
                onClick={() => toggleDay(day.day)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold ${
                    allDone
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-indigo-500/10 text-indigo-400"
                  }`}>
                    D{day.day}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white">{day.focus}</h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
                      {completedCount}/{day.tasks.length} tasks • {day.goal}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {/* Tasks */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {day.tasks.map((task, taskIdx) => {
                    const taskKey = `${day.day}-${taskIdx}`;
                    const isDone = completedTasks.has(taskKey);
                    const taskMeta = TASK_ICONS[task.type] || TASK_ICONS.practice;
                    const TaskIcon = taskMeta.icon;

                    return (
                      <button
                        key={taskKey}
                        type="button"
                        onClick={() => toggleTask(taskKey)}
                        className={`cursor-pointer flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                          isDone
                            ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <TaskIcon className={`h-3 w-3 ${taskMeta.color}`} />
                            <span className={`text-[12px] font-semibold ${isDone ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                              {task.title}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-600">{task.duration}</span>
                          </div>
                          <div 
                            className={`text-[11px] leading-relaxed ${isDone ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}
                            dangerouslySetInnerHTML={{ __html: parseAIContent(task.description) }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
