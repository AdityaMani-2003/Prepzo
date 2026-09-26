"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StreakCard({ evalDates = [] }: { evalDates?: string[] }) {
  const { streak, weekDots, practicedToday } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const sessionDates = evalDates.map((d: any) => new Date(d).toISOString().split("T")[0]);
    const dateSet = new Set(sessionDates);
    const practiced = dateSet.has(todayStr);

    let count = 0;
    const check = new Date(today);
    if (!practiced) {
      check.setDate(check.getDate() - 1);
    }
    while (dateSet.has(check.toISOString().split("T")[0])) {
      count++;
      check.setDate(check.getDate() - 1);
    }

    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dots = DAY_LABELS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return { label, filled: dateSet.has(dateStr) };
    });

    return { streak: count, weekDots: dots, practicedToday: practiced };
  }, [evalDates]);

  return (
    <div className="card-interactive rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-default)] p-5 flex flex-col justify-between transition-all duration-200 hover:border-orange-500/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-orange-500/10 p-1.5">
          <Flame className="h-4 w-4 text-orange-400" />
        </div>
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Daily Streak</h3>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{streak}</span>
        <span className="text-[12px] text-gray-500 font-medium">day streak</span>
      </div>

      {/* 7-day fully horizontal timeline track */}
      <div className="flex items-center justify-between w-full mt-6 mb-5 relative z-0">
        {weekDots.map((dot, i) => (
          <div key={dot.label} className="flex flex-col items-center gap-2.5 flex-1 relative">
            {/* Connector Line behind the dots */}
            {i > 0 && (
              <div 
                className={`absolute top-[7px] right-[50%] w-full h-[2px] -z-10 transition-colors duration-300 ${
                  dot.filled ? "bg-indigo-500/70" : "bg-[var(--border-subtle)]"
                }`} 
              />
            )}
            <div
              className={`h-3.5 w-3.5 rounded-full z-10 transition-all duration-300 ${
                dot.filled
                  ? "bg-indigo-500 shadow-sm shadow-indigo-500/40 ring-4 ring-indigo-500/20"
                  : "bg-gray-200 dark:bg-[var(--border-default)]"
              }`}
            />
            <span className={`text-[10px] font-semibold transition-colors duration-300 ${
              dot.filled ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-gray-600"
            }`}>
              {dot.label}
            </span>
          </div>
        ))}
      </div>

      {!practicedToday && (
        <p className="text-[11px] text-orange-400/80 mt-2">
          🔥 Practice today to maintain your streak!
        </p>
      )}
      {practicedToday && (
        <p className="text-[11px] text-emerald-400/80 mt-2">
          ✅ Great work! You&apos;ve practiced today.
        </p>
      )}
    </div>
  );
}
