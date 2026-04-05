"use client";

import { useState, useEffect } from "react";
import { BrainCircuit, TrendingUp, AlertCircle, CalendarClock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ImprovementPlan {
  strengths: string[];
  weak_areas: string[];
  plan: string[];
  recommended_topics: string[];
}

export default function ImprovementPlanClient() {
  const [plan, setPlan] = useState<ImprovementPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/improvement");
        if (!res.ok) throw new Error("Failed to load improvement plan.");
        const data = await res.json();
        
        if (!data || (!data.strengths?.length && !data.weak_areas?.length)) {
            setPlan(null);
        } else {
            setPlan(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 space-y-8 animate-pulse duration-700">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
          <div className="h-6 w-6 rounded-full bg-purple-500/20" />
          <div className="h-8 w-64 rounded-md bg-gray-700" />
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Skeleton Strengths */}
          <Card className="relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
             <div className="flex items-center gap-2 mb-6">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20" />
                <div className="h-6 w-32 rounded-md bg-gray-700" />
             </div>
             <div className="space-y-4">
                <div className="h-4 w-full rounded-md bg-gray-700" />
                <div className="h-4 w-5/6 rounded-md bg-gray-700" />
                <div className="h-4 w-4/5 rounded-md bg-gray-700" />
             </div>
          </Card>
          {/* Skeleton Weaknesses */}
          <Card className="relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
             <div className="flex items-center gap-2 mb-6">
                <div className="h-5 w-5 rounded-full bg-red-500/20" />
                <div className="h-6 w-40 rounded-md bg-gray-700" />
             </div>
             <div className="space-y-4">
                <div className="h-4 w-full rounded-md bg-gray-700" />
                <div className="h-4 w-4/5 rounded-md bg-gray-700" />
                <div className="h-4 w-5/6 rounded-md bg-gray-700" />
             </div>
          </Card>
        </div>

        {/* Skeleton Timeline */}
        <Card className="mt-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <div className="flex items-center gap-2 mb-8">
             <div className="h-5 w-5 rounded-full bg-blue-500/20" />
             <div className="h-6 w-48 rounded-md bg-gray-700" />
          </div>
          <div className="space-y-8 pl-4 border-l-2 border-gray-700 ml-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="relative pl-6">
                <div className="absolute -left-[30px] top-0.5 h-4 w-4 rounded-full border-4 border-gray-900 bg-gray-700" />
                <div className="h-4 w-full rounded-md bg-gray-700 mb-3" />
                <div className="h-4 w-2/3 rounded-md bg-gray-700" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mt-8 text-center border-red-500/50 bg-red-500/10">
        <p className="text-red-400">Failed to generate improvement plan: {error}</p>
      </Card>
    );
  }

  if (!plan) return null;

  return (
    <div className="mt-8 space-y-8 animate-in slide-in-from-bottom-6 duration-1000 ease-out">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
          <BrainCircuit className="h-5 w-5 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent tracking-tight">
          AI Improvement Matrix
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Core Strengths */}
        <Card className="group transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-emerald-400 tracking-wide uppercase text-sm">Core Strengths</h3>
          </div>
          <ul className="space-y-4">
            {plan.strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="leading-relaxed text-sm font-medium text-emerald-400">{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Target Weaknesses */}
        <Card className="group transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-red-400 tracking-wide uppercase text-sm">Target Weaknesses</h3>
          </div>
          <ul className="space-y-4">
            {plan.weak_areas.map((weak, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="leading-relaxed text-sm font-medium text-red-400">{weak}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Dynamic Master Timeline */}
      <Card>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <CalendarClock className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-white">7-Day Action Plan</h3>
        </div>
        
        <div className="relative border-l-2 border-gray-700 ml-4 pb-4 space-y-10">
          {plan.plan.map((step, i) => {
            const isObject = typeof step !== "string";
            const focus = isObject ? ((step as any).focus || `Day ${(step as any).day}`) : `Day ${i + 1}`;
            const activities = isObject ? ((step as any).activities || JSON.stringify(step)) : step;

            return (
              <div key={i} className="relative pl-8 group">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-gray-900 bg-blue-500 transition-transform duration-300 group-hover:scale-125 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 transition-all duration-300 hover:bg-gray-800">
                  <strong className="block text-blue-400 text-sm font-semibold tracking-wide uppercase mb-2">
                    {focus}
                  </strong>
                  <p className="text-sm leading-relaxed text-gray-300">{activities}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Intelligent Topics */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 blur-[80px] -z-10 rounded-full" />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700 text-gray-300">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Focus Index</h3>
            <p className="text-xs text-gray-400 mt-1">AI-Recommended topics to tackle next.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          {plan.recommended_topics.map((topic, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 tracking-wide cursor-default shadow-[0_0_10px_rgba(168,85,247,0.1)]">
              {topic}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
