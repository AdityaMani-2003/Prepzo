"use client";

import { useState, useCallback } from "react";
import { ChevronDown, CheckCircle, Circle, MessageSquare, BookOpen, Mic, Loader2, Target, Sparkles, Download } from "lucide-react";
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
 * Generate and download PDF using jspdf
 */
async function downloadAsPdf(plan: PlanData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
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

  // ─── Header ──────────────────────────────────────
  doc.setFillColor(45, 27, 105);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Your 7-Day Improvement Plan", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 230);
  doc.text(`Generated: ${dateStr}  |  Target ELO: ${plan.targetElo}`, margin, 30);
  doc.text("Prepzo — AI Interview Preparation Platform", margin, 37);

  y = 52;

  // ─── Summary ─────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 80);
  doc.text("Plan Overview", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 100);
  const summaryText = stripHtml(plan.summary);
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  addPageIfNeeded(summaryLines.length * 5 + 4);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  // ─── Day Cards ───────────────────────────────────
  for (const day of plan.days) {
    addPageIfNeeded(35);

    // Day header bar
    doc.setFillColor(238, 235, 255);
    doc.roundedRect(margin, y - 2, contentWidth, 12, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202);
    doc.text(`Day ${day.day}: ${day.focus}`, margin + 4, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 160);
    const goalWidth = doc.getTextWidth(`Goal: ${day.goal}`);
    doc.text(`Goal: ${day.goal}`, margin + contentWidth - goalWidth - 4, y + 5);

    y += 16;

    // Tasks
    for (let i = 0; i < day.tasks.length; i++) {
      const task = day.tasks[i];
      const typeLabel = TYPE_LABELS[task.type] || task.type;
      const descText = stripHtml(task.description);
      const descLines = doc.splitTextToSize(descText, contentWidth - 14);

      addPageIfNeeded(descLines.length * 4 + 16);

      // Task title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 60);
      doc.text(`${i + 1}. ${task.title}`, margin + 4, y);

      // Meta pill
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 155);
      doc.text(`${typeLabel}  •  ${task.duration}`, margin + 6, y + 5);
      y += 9;

      // Description
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 100);
      doc.text(descLines, margin + 6, y);
      y += descLines.length * 4 + 6;
    }

    y += 4;
  }

  // ─── Footer ──────────────────────────────────────
  addPageIfNeeded(20);
  doc.setDrawColor(200, 200, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 160);
  doc.text("© Prepzo — Crack your next interview with confidence.", margin, y);

  doc.save(`Prepzo_Improvement_Plan_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function ImprovementPlan({ weakAreas, eloScore }: { weakAreas: string[]; eloScore: number }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/improvement-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weakAreas, eloScore }),
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
  }, [weakAreas, eloScore]);

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

  if (!plan) {
    if (loading) {
      return (
        <div className="rounded-xl bg-[var(--bg-card)] border border-indigo-500/20 p-6 mt-7 shadow-[var(--shadow-elevated)] relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse rounded-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Engineering Improvement Plan</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Activating intelligence engine</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 pl-1">
              <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)] animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Analyzing weak areas and telemetry...
              </div>
              <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)] animate-pulse" style={{ animationDelay: "0.4s" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Generating daily task distribution...
              </div>
              <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)] animate-pulse" style={{ animationDelay: "0.8s" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Finalizing optimal preparation schedule...
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl bg-gradient-to-br from-indigo-500/[0.07] to-purple-500/[0.05] border border-indigo-500/15 p-6 mt-7">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">AI Improvement Plan</h3>
        </div>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">
          Get a personalized 7-day plan to boost your interview performance.
        </p>
        {error && (
          <p className="text-[12px] text-red-400 mb-3">{error}</p>
        )}
        <button
          type="button"
          onClick={generatePlan}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[13px] font-[600] text-white hover:bg-[var(--accent-hover)] transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          Generate 7-Day Plan
        </button>
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-5 animate-fadeInUp">
      {/* Summary header */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Your 7-Day Plan</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px]">
              <Target className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-gray-500 dark:text-gray-400">Target ELO:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-300">{plan.targetElo}</span>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/[0.15] hover:border-indigo-500/30 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download as PDF"
            >
              {downloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {downloading ? "Exporting..." : "Download Plan"}
            </button>
          </div>
        </div>
        <div 
          className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed"
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
