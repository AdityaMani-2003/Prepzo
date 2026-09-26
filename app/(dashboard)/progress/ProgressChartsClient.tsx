"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

interface Props {
  eloData: { date: string; elo: number; score: number }[];
  breakdown: { clarity: number; technical: number; communication: number };
}

export default function ProgressChartsClient({ eloData, breakdown }: Props) {
  const chartData =
    eloData.length > 0
      ? eloData
      : [
          { date: "Day 1", elo: 1200, score: 6 },
          { date: "Day 2", elo: 1210, score: 7 },
        ];

  const barData = [
    { name: "Clarity", score: breakdown.clarity },
    { name: "Technical", score: breakdown.technical },
    { name: "Communication", score: breakdown.communication },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ELO Progression Line Chart */}
      <div className="lg:col-span-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              ELO Trajectory Over Time
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Calculated based on verified answer evaluations
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--accent)] bg-[var(--accent-subtle)] px-2.5 py-1 rounded-md">
            Interactive
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="eloGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-strong)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                }}
              />
              <Area
                type="monotone"
                dataKey="elo"
                stroke="#7c3aed"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#eloGlow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dimensional Breakdown Bar Chart */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Skill Dimension Breakdown
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Average score across all sessions
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 10]}
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-strong)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                }}
              />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
