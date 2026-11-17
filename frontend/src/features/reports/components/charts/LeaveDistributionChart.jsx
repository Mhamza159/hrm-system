/**
 * @file LeaveDistributionChart.jsx
 * @description Native SVG Leave Type Breakdown Donut + Approval Status Funnel for Leave Analytics.
 * Styled in Forest & Emerald Enterprise theme with zero external charting dependencies.
 */

import React, { useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

export const LeaveDistributionChart = ({ chartData = {}, summary = {}, isLoading = false }) => {
  const [hoveredType, setHoveredType] = useState(null);

  const typeBreakdown = chartData.typeBreakdown || [];
  const statusDistribution = chartData.statusDistribution || [];
  const totalLeaveDays = summary.totalLeaveDays || 0;

  // Donut SVG calculations
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const segments = typeBreakdown.reduce((acc, t) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].cumulativePct : 0;
    acc.push({
      ...t,
      cumulativePct: prevOffset + t.pct,
      strokeDasharray: `${(t.pct / 100) * circumference} ${circumference}`,
      strokeDashoffset: -((prevOffset / 100) * circumference)
    });
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 h-72 flex items-center justify-center text-xs text-slate-400">
        Loading leave analytics...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Leave Category Breakdown Donut */}
      <div className="lg:col-span-6 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Leave Type Distribution</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Approved days by quota category</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#1A3125] text-slate-400">
            {totalLeaveDays} Days Total
          </span>
        </div>

        {typeBreakdown.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No approved leaves taken in selected period
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
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
                  if (s.days === 0) return null;
                  const isHovered = hoveredType === s.code;
                  return (
                    <circle
                      key={s.code}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={s.strokeDasharray}
                      strokeDashoffset={s.strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredType(s.code)}
                      onMouseLeave={() => setHoveredType(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {totalLeaveDays}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Days
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              {segments.map((t) => (
                <div
                  key={t.code}
                  onMouseEnter={() => setHoveredType(t.code)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                    hoveredType === t.code
                      ? 'border-[#00C471] bg-emerald-500/10'
                      : 'border-transparent bg-slate-50 dark:bg-[#061A14]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t.name}</span>
                  </div>
                  <div className="font-mono text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">{t.days}d</span>
                    <span className="text-[10px] text-slate-400 ml-1">({t.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Approval Status Distribution */}
      <div className="lg:col-span-6 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Request Processing Funnel</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Application status distribution</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {summary.totalApplications || 0} Submissions
          </span>
        </div>

        <div className="space-y-3 py-3 flex-1 flex flex-col justify-around">
          {statusDistribution.map((s) => (
            <div key={s.status} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{s.status}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {s.count} <span className="text-[10px] text-slate-400 font-normal">({s.pct}%)</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#162820] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveDistributionChart;
