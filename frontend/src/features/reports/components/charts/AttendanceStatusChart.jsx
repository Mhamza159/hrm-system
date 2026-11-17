/**
 * @file AttendanceStatusChart.jsx
 * @description Native SVG Status Distribution Donut + Daily Trajectory Chart for Attendance Analytics.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React, { useState } from 'react';
import { PieChart, TrendingUp } from 'lucide-react';

export const AttendanceStatusChart = ({ chartData = {}, summary = {}, isLoading = false }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const statusDistribution = chartData.statusDistribution || [];
  const dailyTrend = chartData.dailyTrend || [];

  const totalPunches = statusDistribution.reduce((acc, s) => acc + (s.count || 0), 0);
  const attendanceRate = summary.attendanceRate || 0;

  // Donut SVG calculations
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const segments = statusDistribution.reduce((acc, s) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].cumulativePct : 0;
    const pct = totalPunches > 0 ? (s.count / totalPunches) * 100 : 0;
    acc.push({
      ...s,
      pct,
      cumulativePct: prevOffset + pct,
      strokeDasharray: `${(pct / 100) * circumference} ${circumference}`,
      strokeDashoffset: -((prevOffset / 100) * circumference)
    });
    return acc;
  }, []);

  // Daily Trend Bar Chart calculations
  const maxDailyTotal = Math.max(1, ...dailyTrend.map((d) => d.total || 0));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 h-72 flex items-center justify-center text-xs text-slate-400">
        Loading attendance analytics...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Status Distribution Donut */}
      <div className="lg:col-span-5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Status Distribution</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Workforce punctuality breakdown</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 text-[#00C471] bg-emerald-500/10">
            {attendanceRate}% Rate
          </span>
        </div>

        {totalPunches === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No attendance records logged in selected period
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
            {/* Donut SVG */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-slate-100 dark:text-[#162820]"
                />
                {segments.map((s) => {
                  if (s.count === 0) return null;
                  const isHovered = hoveredSegment === s.status;
                  return (
                    <circle
                      key={s.status}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={s.strokeDasharray}
                      strokeDashoffset={s.strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredSegment(s.status)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {totalPunches}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Punches
                </span>
              </div>
            </div>

            {/* Legend Stack */}
            <div className="flex-1 space-y-1.5 w-full">
              {segments.map((s) => (
                <div
                  key={s.status}
                  onMouseEnter={() => setHoveredSegment(s.status)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                    hoveredSegment === s.status
                      ? 'border-[#00C471] bg-emerald-500/10'
                      : 'border-transparent bg-slate-50 dark:bg-[#061A14]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{s.status}</span>
                  </div>
                  <div className="font-mono text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">{s.count}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({s.pct.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Daily Attendance Trajectory Stacked Bars */}
      <div className="lg:col-span-7 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Daily Attendance Trajectory</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Timeline activity across selected range</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {dailyTrend.length} days plotted
          </span>
        </div>

        {dailyTrend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No daily trends recorded for this range
          </div>
        ) : (
          <div className="py-3 flex-1 flex flex-col justify-end">
            <div className="flex items-end gap-1.5 h-36 w-full pt-4">
              {dailyTrend.map((d, idx) => {
                const heightPct = Math.max(8, (d.total / maxDailyTotal) * 100);
                const isHovered = hoveredBar === idx;

                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 z-20 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-[#061A14] text-white border border-slate-700 dark:border-[#1A3125] text-[10px] whitespace-nowrap shadow-lg">
                        <p className="font-bold font-mono">{d.date}</p>
                        <p className="text-emerald-400">Present: {d.present}</p>
                        <p className="text-amber-400">Late: {d.late}</p>
                        <p className="text-blue-400">Half-Day: {d.halfDay}</p>
                        <p className="text-rose-400">Absent: {d.absent}</p>
                      </div>
                    )}

                    {/* Bar Stack */}
                    <div
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 flex flex-col-reverse overflow-hidden ${
                        isHovered ? 'ring-2 ring-[#00C471]' : ''
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Present segment */}
                      <div
                        style={{ height: `${d.total > 0 ? (d.present / d.total) * 100 : 0}%` }}
                        className="bg-[#00C471] w-full"
                      />
                      {/* Late segment */}
                      <div
                        style={{ height: `${d.total > 0 ? (d.late / d.total) * 100 : 0}%` }}
                        className="bg-[#F59E0B] w-full"
                      />
                      {/* Half-Day segment */}
                      <div
                        style={{ height: `${d.total > 0 ? (d.halfDay / d.total) * 100 : 0}%` }}
                        className="bg-[#3B82F6] w-full"
                      />
                      {/* Absent segment */}
                      <div
                        style={{ height: `${d.total > 0 ? (d.absent / d.total) * 100 : 0}%` }}
                        className="bg-[#EF4444] w-full"
                      />
                    </div>

                    <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center mt-1.5 block">
                      {d.label?.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceStatusChart;
