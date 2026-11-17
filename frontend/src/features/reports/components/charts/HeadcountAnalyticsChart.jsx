/**
 * @file HeadcountAnalyticsChart.jsx
 * @description Department Headcount Distribution + Employment Type Composition for Demographics.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React, { useState } from 'react';
import { Users, Briefcase } from 'lucide-react';

export const HeadcountAnalyticsChart = ({ chartData = {}, summary = {}, isLoading = false }) => {
  const [hoveredType, setHoveredType] = useState(null);

  const departmentBreakdown = chartData.departmentBreakdown || [];
  const employmentTypeBreakdown = chartData.employmentTypeBreakdown || [];
  const totalHeadcount = summary.totalHeadcount || 0;

  const maxDeptCount = Math.max(1, ...departmentBreakdown.map((d) => d.count || 0));

  // Employment Type Donut calculations
  const typeColors = {
    Permanent: '#00C471',
    Contract: '#3B82F6',
    Probation: '#F59E0B',
    Intern: '#8B5CF6'
  };

  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const segments = employmentTypeBreakdown.reduce((acc, t) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].cumulativePct : 0;
    acc.push({
      ...t,
      color: typeColors[t.type] || '#10B981',
      cumulativePct: prevOffset + t.pct,
      strokeDasharray: `${(t.pct / 100) * circumference} ${circumference}`,
      strokeDashoffset: -((prevOffset / 100) * circumference)
    });
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 h-72 flex items-center justify-center text-xs text-slate-400">
        Loading headcount analytics...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Department Workforce Allocation */}
      <div className="lg:col-span-7 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Department Headcount Allocation</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Active personnel per organizational unit</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {departmentBreakdown.length} Departments
          </span>
        </div>

        {departmentBreakdown.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No department allocations found
          </div>
        ) : (
          <div className="space-y-3 py-3 flex-1 flex flex-col justify-around">
            {departmentBreakdown.slice(0, 5).map((d) => (
              <div key={d.departmentName} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {d.departmentName}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {d.count} <span className="text-[10px] text-slate-400 font-normal">({d.pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#162820] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00C471] transition-all duration-500"
                    style={{ width: `${(d.count / maxDeptCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Employment Type Composition Donut */}
      <div className="lg:col-span-5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Employment Type</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Contractual composition</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 text-[#00C471] bg-emerald-500/10">
            {totalHeadcount} Staff
          </span>
        </div>

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
                if (s.count === 0) return null;
                const isHovered = hoveredType === s.type;
                return (
                  <circle
                    key={s.type}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={s.strokeDasharray}
                    strokeDashoffset={s.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredType(s.type)}
                    onMouseLeave={() => setHoveredType(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {totalHeadcount}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Staff
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full">
            {segments.map((t) => (
              <div
                key={t.type}
                onMouseEnter={() => setHoveredType(t.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                  hoveredType === t.type
                    ? 'border-[#00C471] bg-emerald-500/10'
                    : 'border-transparent bg-slate-50 dark:bg-[#061A14]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.type}</span>
                </div>
                <div className="font-mono text-right shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">{t.count}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({t.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadcountAnalyticsChart;
