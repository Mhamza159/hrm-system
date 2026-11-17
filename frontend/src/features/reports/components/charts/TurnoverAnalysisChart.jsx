/**
 * @file TurnoverAnalysisChart.jsx
 * @description Native SVG Separation Reason Donut + Monthly Exit Trend Chart for Turnover Analytics.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React, { useState } from 'react';
import { UserMinus, TrendingDown } from 'lucide-react';

export const TurnoverAnalysisChart = ({ chartData = {}, summary = {}, isLoading = false }) => {
  const [hoveredType, setHoveredType] = useState(null);

  const exitTypeDistribution = chartData.exitTypeDistribution || [];
  const monthlyExitTrend = chartData.monthlyExitTrend || [];
  const totalExits = summary.totalExits || 0;
  const turnoverRate = summary.turnoverRate || '0%';

  const maxExits = Math.max(1, ...monthlyExitTrend.map((m) => m.exits || 0));

  // Donut SVG calculations
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const segments = exitTypeDistribution.reduce((acc, t) => {
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
        Loading turnover analytics...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Separation Reason Donut */}
      <div className="lg:col-span-5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <UserMinus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Separation Distribution</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Voluntary vs involuntary attrition</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-500 bg-amber-500/10">
            {turnoverRate} Rate
          </span>
        </div>

        {totalExits === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No workforce exits recorded in selected period
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
                  {totalExits}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Exits
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 w-full">
              {segments.map((t) => (
                <div
                  key={t.type}
                  onMouseEnter={() => setHoveredType(t.type)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
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
        )}
      </div>

      {/* 2. Monthly Exit Trajectory */}
      <div className="lg:col-span-7 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Monthly Exit Trajectory</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Separations recorded over time</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Avg Tenure: {summary.averageTenureMonths || 0}m
          </span>
        </div>

        {monthlyExitTrend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No monthly turnover trends logged
          </div>
        ) : (
          <div className="py-3 flex-1 flex flex-col justify-end">
            <div className="flex items-end gap-3 h-36 w-full pt-4">
              {monthlyExitTrend.map((m) => {
                const heightPct = Math.max(10, (m.exits / maxExits) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div
                      className="w-full max-w-[32px] rounded-t-md bg-amber-500/80 group-hover:bg-amber-500 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center mt-2 block">
                      {m.month}
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

export default TurnoverAnalysisChart;
