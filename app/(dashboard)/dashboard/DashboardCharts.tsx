"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";

interface DashboardChartsProps {
  skillMetrics: {
    skill_name: string;
    score: number;
  }[];
  progressData: {
    date: string;
    average_score: number;
    topic: string;
  }[];
}

export default function DashboardCharts({ skillMetrics, progressData }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 mt-8">
      {/* Skill Performance Chart */}
      <Card className="flex flex-col">
        <h3 className="mb-6 text-lg font-semibold text-white">Skill Performance</h3>
        {skillMetrics.length === 0 ? (
           <div className="flex-1 flex items-center justify-center min-h-[300px] text-gray-500 bg-[#111111] rounded-xl border border-gray-800 border-dashed text-sm">
             No analytics available yet
           </div>
        ) : (
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="skill_name" 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#71717a' }}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 10]}
                  tick={{ fill: '#71717a' }}
                />
                <Tooltip 
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#111111', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="score" fill="#ffffff" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Progress Over Time Chart */}
      <Card className="flex flex-col">
        <h3 className="mb-6 text-lg font-semibold text-white">Progress Over Time</h3>
        {progressData.length === 0 ? (
           <div className="flex-1 flex items-center justify-center min-h-[300px] text-gray-500 bg-[#111111] rounded-xl border border-gray-800 border-dashed text-sm">
             No analytics available yet
           </div>
        ) : (
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#71717a' }}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 10]}
                  tick={{ fill: '#71717a' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average_score" 
                  stroke="#ffffff" 
                  strokeWidth={3}
                  dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#d4d4d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
