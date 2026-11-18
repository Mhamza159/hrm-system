/**
 * @file DepartmentAnalyticsSection.jsx
 * @description Interactive visual analytics dashboard for department organizational structures.
 * Features Horizontal Bar Chart for department headcounts and native SVG Donut Chart for workforce distribution.
 * Styled strictly in the Forest & Emerald Enterprise theme with zero external chart libraries.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

export function DepartmentAnalyticsSection({ analytics = {}, isLoading = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const {
    summary = {},
    departmentBreakdown = [],
    workforceDistribution = [],
    topDepartment = null,
    lowestDepartment = null
  } = analytics;

  const totalAssigned = summary.totalAssignedEmployees || 0;
  const maxHeadcount = Math.max(1, ...departmentBreakdown.map((d) => d.headcount || 0));

  // Color palette for Donut Chart slices (Emerald & Forest complementary palette)
  const sliceColors = [
    '#00C471', // Primary Emerald
    '#3B82F6', // Cobalt Blue
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#64748B'  // Slate Others
  ];

  // Donut SVG Calculations
  const radius = 54;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const donutSlices = workforceDistribution.map((item, idx) => {
    const pct = item.percentage || 0;
    const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    const color = sliceColors[idx % sliceColors.length];
    cumulativePercent += pct;

    return {
      ...item,
      color,
      strokeDasharray,
      strokeDashoffset
    };
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 animate-pulse">
        <div className="h-4 w-48 bg-slate-100 dark:bg-[#1A3125] rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 h-48 bg-slate-50 dark:bg-[#15241C] rounded-xl" />
          <div className="lg:col-span-5 h-48 bg-slate-50 dark:bg-[#15241C] rounded-xl" />
        </div>
      </div>
    );
  }

  // If no departments exist yet
  if (departmentBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs overflow-hidden transition-all">
      {/* Analytics Section Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1712]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Department Workforce & Analytics Intelligence
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time headcount distribution across {departmentBreakdown.length} active divisions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand Analytics'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Top Key Insights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top Department */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#15241C]/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  Largest Workforce Unit
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block truncate max-w-[180px]">
                  {topDepartment ? topDepartment.name : '—'}
                </span>
                <span className="text-[11px] font-mono text-[#00C471] font-semibold block mt-0.5">
                  {topDepartment ? `${topDepartment.headcount} members (${topDepartment.percentage}%)` : '0 members'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
            </div>

            {/* Smallest / Focus Unit */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#15241C]/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  Smallest Staffed Unit
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block truncate max-w-[180px]">
                  {lowestDepartment ? lowestDepartment.name : 'All Equal / 0'}
                </span>
                <span className="text-[11px] font-mono text-blue-500 font-semibold block mt-0.5">
                  {lowestDepartment ? `${lowestDepartment.headcount} members (${lowestDepartment.percentage}%)` : '—'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {/* Leadership Ratio */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#15241C]/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  Leadership Coverage
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {summary.headAssignmentRatio || 0}% Appointed
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {summary.unassignedHeads || 0} unit(s) without head
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Visual Charts: Horizontal Bar Chart + Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Horizontal Bar Chart (7 Cols) */}
            <div className="lg:col-span-7 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1A3125]/80 mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#00C471]" />
                  <span>Employee Allocation by Division</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {totalAssigned} Total Staff
                </span>
              </div>

              <div className="space-y-3">
                {departmentBreakdown.map((dept) => {
                  const barWidthPercent = Math.max(4, Math.round((dept.headcount / maxHeadcount) * 100));

                  return (
                    <div key={dept._id} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 truncate max-w-[240px]">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {dept.name}
                          </span>
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#234232]">
                            {dept.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {dept.headcount}
                          </span>
                          <span className="text-[10px] text-slate-400 w-9 text-right">
                            {dept.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#1A3125] overflow-hidden">
                        <div
                          style={{ width: `${barWidthPercent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            dept.headcount === maxHeadcount && dept.headcount > 0
                              ? 'bg-[#00C471]'
                              : dept.headcount > 0
                              ? 'bg-[#00C471]/80 hover:bg-[#00C471]'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut Chart: Workforce Share (5 Cols) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1A3125]/80 mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-blue-500" />
                  <span>Workforce Distribution Share</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Share %
                </span>
              </div>

              {totalAssigned > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 my-auto">
                  {/* SVG Donut */}
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                      {/* Background circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        className="stroke-slate-100 dark:stroke-[#15241C]"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      {/* Slices */}
                      {donutSlices.map((slice, idx) => (
                        <circle
                          key={idx}
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke={slice.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          fill="transparent"
                          strokeLinecap="round"
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                          onMouseEnter={() => setHoveredSlice(slice)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      ))}
                    </svg>

                    {/* Central Readout */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {hoveredSlice ? hoveredSlice.count : totalAssigned}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                        {hoveredSlice ? hoveredSlice.code : 'Members'}
                      </span>
                    </div>
                  </div>

                  {/* Slices Legend */}
                  <div className="w-full space-y-1.5 overflow-hidden">
                    {donutSlices.map((slice, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredSlice(slice)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          hoveredSlice?.code === slice.code
                            ? 'bg-slate-100 dark:bg-[#1A3125]'
                            : 'hover:bg-slate-50 dark:hover:bg-[#15241C]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="text-slate-700 dark:text-slate-300 truncate text-[11px] font-medium">
                            {slice.name}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white tabular-nums shrink-0 ml-2">
                          {slice.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <span>No employees currently assigned to active divisions.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
