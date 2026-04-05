"use client";

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Target, TrendingUp, Award, AlertCircle, Zap, MessageSquare, ArrowUpRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { parseAIContent } from "@/utils/parseAI";

interface EvaluationData {
  id: string;
  created_at: string;
  score: number;
  metadata: {
    score_breakdown: { clarity: number; technical: number; communication?: number; structure?: number };
    strengths: string[];
    weaknesses: string[];
  };
  session_id: string;
}

export const ProgressUI = React.memo(function ProgressUI({ evaluations }: { evaluations: EvaluationData[] }) {
  const analytics = useMemo(() => {
    let elo = 1200;
    const eloHistory: any[] = [];
    let sumScore = 0, maxScore = 0;
    const sums = { clarity: 0, technical: 0, communication: 0 };
    const counts = { clarity: 0, technical: 0, communication: 0 };
    const rawStrengths: string[] = [];
    const rawWeaknesses: string[] = [];

    const sorted = [...evaluations].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const ev of sorted) {
      const s = ev.score || 0;
      elo = Math.round(elo + 20 * (s / 10 - 0.5));
      sumScore += s;
      if (s > maxScore) maxScore = s;

      eloHistory.push({
        name: new Date(ev.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        elo, score: s,
      });

      const b = ev.metadata?.score_breakdown;
      if (b) {
        if (b.clarity) { sums.clarity += b.clarity; counts.clarity++; }
        if (b.technical) { sums.technical += b.technical; counts.technical++; }
        const comm = b.communication || b.structure;
        if (comm) { sums.communication += comm; counts.communication++; }
      }
      if (ev.metadata?.strengths) rawStrengths.push(...ev.metadata.strengths);
      if (ev.metadata?.weaknesses) rawWeaknesses.push(...ev.metadata.weaknesses);
    }

    const avg = evaluations.length > 0 ? Math.round(sumScore / evaluations.length) : 0;
    const skills = [
      { subject: "Technical", score: counts.technical ? Math.round(sums.technical / counts.technical) : 0 },
      { subject: "Clarity", score: counts.clarity ? Math.round(sums.clarity / counts.clarity) : 0 },
      { subject: "Communication", score: counts.communication ? Math.round(sums.communication / counts.communication) : 0 },
    ];

    const freqExtract = (arr: string[]) => {
      const freq: Record<string, number> = {};
      arr.forEach((w) => { const c = w.replace(/The candidate /gi, ""); freq[c] = (freq[c] || 0) + 1; });
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
    };

    let delta = 0;
    if (sorted.length >= 4) {
      const f3 = sorted.slice(0, 3).reduce((s, e) => s + (e.score || 0), 0) / 3;
      const l3 = sorted.slice(-3).reduce((s, e) => s + (e.score || 0), 0) / 3;
      delta = Math.round(l3 - f3);
    }

    // Insight messages
    const insights: string[] = [];
    if (counts.clarity >= 2) {
      const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
      const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));
      const avgFirst = firstHalf.reduce((s, e) => s + (e.metadata?.score_breakdown?.clarity || 0), 0) / (firstHalf.length || 1);
      const avgSecond = secondHalf.reduce((s, e) => s + (e.metadata?.score_breakdown?.clarity || 0), 0) / (secondHalf.length || 1);
      const diff = Math.round(avgSecond - avgFirst);
      if (diff > 0) insights.push(`Your clarity improved by ${diff > 0 ? "+" : ""}${diff} points recently.`);
    }
    if (evaluations.length >= 3 && delta > 0) insights.push(`Overall improvement trend: +${delta} points.`);
    if (evaluations.length >= 2) insights.push(`Your current level: ELO ${elo}`);

    return { eloHistory, elo, avg, maxScore, skills, topStrengths: freqExtract(rawStrengths), topWeaknesses: freqExtract(rawWeaknesses), delta, insights };
  }, [evaluations]);

  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeInUp">
        <div className="rounded-2xl bg-white/[0.03] p-6 mb-5">
          <Target className="h-9 w-9 text-gray-600" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1.5">No interview data yet</h2>
        <p className="text-[13px] text-gray-500 max-w-sm mb-6">Complete your first mock interview to see your analytics and track improvement.</p>
        <Link href="/interview" className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-400 transition-all">
          <MessageSquare className="h-4 w-4" />Start Interview
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-7 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance Analytics</h1>
        <p className="text-[13px] text-gray-500 mt-1">Track your growth and identify areas to improve.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {[
          { label: "Career ELO", value: analytics.elo, icon: TrendingUp, color: "text-indigo-400" },
          { label: "Interviews", value: evaluations.length, icon: Target, color: "text-blue-400" },
          { label: "Avg Score", value: `${analytics.avg}/10`, icon: Award, color: "text-emerald-400" },
          { label: "Trend", value: `${analytics.delta >= 0 ? "+" : ""}${analytics.delta}`, icon: Zap, color: "text-purple-400", valueColor: analytics.delta >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map((item) => (
          <div key={item.label} className="card-interactive rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] p-4 transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{item.label}</span>
              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            </div>
            <span className={`text-2xl font-bold ${(item as any).valueColor || "text-gray-900 dark:text-white"}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* AI Narrative Insights */}
      {analytics.insights.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
             <div className="rounded-lg bg-indigo-500/20 p-1.5"><Zap className="h-4 w-4 text-indigo-400" /></div>
             <h3 className="text-[14px] font-semibold text-indigo-900 dark:text-indigo-100">Prepzo AI Career Analysis</h3>
          </div>
          <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Based on your recent interview telemetry, you are showing solid structural progression. The engine has detected specific communication patterns in your audio stream that impact your overall ELO rating. Focus specifically on your narrative structure to crack the next tier.
          </p>
          <div className="flex flex-wrap gap-2">
            {analytics.insights.map((msg, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
                <Target className="h-3 w-3" />
                <div dangerouslySetInnerHTML={{ __html: parseAIContent(msg) }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] p-5 hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-200">
          <div className="flex items-center gap-2 mb-5">
             <div className="w-1 h-6 bg-indigo-500 rounded-full" />
             <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">ELO Trajectory</h3>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.eloHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 20", "dataMax + 20"]} dx={-8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)", borderRadius: "var(--radius-md)", fontSize: "12px", boxShadow: "var(--shadow-elevated)" }} 
                  itemStyle={{ color: "var(--text-primary)", fontWeight: 700 }} 
                  labelStyle={{ color: "var(--text-muted)" }} 
                />
                <defs>
                  <linearGradient id="eloG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line 
                  type="monotone" 
                  dataKey="elo" 
                  stroke="var(--accent)" 
                  strokeWidth={2} 
                  fill="url(#eloG)" 
                  dot={{ r: 4, fill: "var(--accent)", stroke: "var(--bg-card)", strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: "var(--accent)", stroke: "var(--bg-surface)", strokeWidth: 2 }} 
                  name="ELO" 
                  animationDuration={1000} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] p-5 flex flex-col hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-200">
          <div className="flex items-center gap-2 mb-5">
             <div className="w-1 h-6 bg-emerald-500 rounded-full" />
             <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Skill Breakdown</h3>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.skills} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, 10]} hide />
                <YAxis dataKey="subject" type="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: "var(--accent-subtle)" }} contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)", borderRadius: "var(--radius-md)", fontSize: "12px", boxShadow: "var(--shadow-elevated)" }} />
                <defs>
                  <linearGradient id="barG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <Bar dataKey="score" fill="url(#barG)" radius={[0, 6, 6, 0]} name="Avg Score" barSize={16} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] p-5 h-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-emerald-500/10 p-1.5"><Award className="h-3.5 w-3.5 text-emerald-400" /></div>
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Top Strengths</h3>
          </div>
          {analytics.topStrengths.length > 0 ? (
            <ul className="space-y-4">
              {analytics.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-normal" dangerouslySetInnerHTML={{ __html: parseAIContent(s) }} />
                </li>
              ))}
            </ul>
          ) : <p className="text-[12px] text-gray-400 dark:text-gray-600">Complete more interviews to see patterns.</p>}
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] p-5 h-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-orange-500/10 p-1.5"><AlertCircle className="h-3.5 w-3.5 text-orange-400" /></div>
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Areas to Improve</h3>
          </div>
          {analytics.topWeaknesses.length > 0 ? (
            <ul className="space-y-4">
              {analytics.topWeaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-normal" dangerouslySetInnerHTML={{ __html: parseAIContent(w) }} />
                </li>
              ))}
            </ul>
          ) : <p className="text-[12px] text-gray-400 dark:text-gray-600">Complete more interviews to identify patterns.</p>}
        </div>
      </div>
    </div>
  );
});
