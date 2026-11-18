/**
 * @file DesignationAnalyticsSection.jsx
 * @description Interactive visual analytics dashboard for corporate job designations and workforce structure.
 * Features Horizontal Bar Chart for staff allocation per designation and native SVG Donut Chart for department distribution.
 * Styled strictly in the Forest & Emerald Enterprise theme with zero external chart libraries.
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Award,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

// Color palette for Donut Chart slices (Emerald & Forest complementary palette)
const SLICE_COLORS = [
  '#00C471', // Primary Emerald
  '#3B82F6', // Cobalt Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B'  // Slate Others
];

// Donut SVG Calculations
const RADIUS = 54;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DesignationAnalyticsSection({ analytics = {}, isLoading = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const {
    summary = {},
    gradeBreakdown = [],
    departmentDistribution = [],
    designationBreakdown = [],
    topDesignation = null,
    lowestDesignation = null
  } = analytics;

  const totalAssigned = summary.totalAssignedEmployees || 0;
  const maxHeadcount = Math.max(1, ...designationBreakdown.map((d) => d.headcount || 0));

  // Compute leadership / executive tier count (Lead + Executive)
  const leadershipHeadcount = gradeBreakdown
    .filter((g) => g.grade === 'Lead' || g.grade === 'Executive')
    .reduce((acc, curr) => acc + (curr.headcount || 0), 0);

  // Semantic Grade Badges colors
  const gradeColors = {
    Junior: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700'
    },
    Mid: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/40'
    },
    Senior: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-[#00C471]',
      border: 'border-emerald-200 dark:border-emerald-800/40'
    },
    Lead: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800/40'
    },
    Executive: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/40'
    }
  };

  const activeDistribution = useMemo(() => {
    return departmentDistribution.filter((item) => (item.designationCount || 0) > 0);
  }, [departmentDistribution]);

  const totalDesignationsInDepts = useMemo(() => {
    return activeDistribution.reduce((acc, curr) => acc + curr.designationCount, 0);
  }, [activeDistribution]);

  const donutSlices = useMemo(() => {
    const result = [];
    let runningPercent = 0;
    for (let idx = 0; idx < activeDistribution.length; idx++) {
      const item = activeDistribution[idx];
      const sharePct = totalDesignationsInDepts > 0 ? (item.designationCount / totalDesignationsInDepts) * 100 : 0;
      const strokeDasharray = `${(sharePct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
      const strokeDashoffset = -((runningPercent / 100) * CIRCUMFERENCE);
      const color = SLICE_COLORS[idx % SLICE_COLORS.length];
      runningPercent += sharePct;

      result.push({
        ...item,
        sharePct: Number(sharePct.toFixed(1)),
        color,
        strokeDasharray,
        strokeDashoffset
      });
    }
    return result;
  }, [activeDistribution, totalDesignationsInDepts]);

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

  // If no designations exist yet
  if (designationBreakdown.length === 0) {
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
              Designation Workforce & Structure Analytics
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time headcount distribution across {designationBreakdown.length} active corporate job titles
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Expand Analytics</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Top Key Highlights Bar (3 tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top Designation */}
            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#0E1712] p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00C471] flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Largest Title by Staff</span>
                  <ArrowUpRight className="w-3 h-3 text-[#00C471]" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {topDesignation ? topDesignation.title : 'None'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {topDesignation ? `${topDesignation.headcount} Staff` : '—'}
                  </span>
                  {topDesignation && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-[#00C471] font-mono">
                      {topDesignation.percentage}% of workforce
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Leadership Tier */}
            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#0E1712] p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lead & Executive Tier
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {leadershipHeadcount} Leaders
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {totalAssigned > 0
                    ? `${((leadershipHeadcount / totalAssigned) * 100).toFixed(1)}% leadership ratio`
                    : 'No assigned staff'}
                </div>
              </div>
            </div>

            {/* Smallest Staffed Title */}
            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#0E1712] p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Specialized Niche Role
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {lowestDesignation ? lowestDesignation.title : 'All roles filled evenly'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {lowestDesignation ? `${lowestDesignation.headcount} Staff` : '—'}
                  </span>
                  {lowestDesignation && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                      {lowestDesignation.departmentName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grade Tier Distribution Pills */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Grade Tier Hierarchy Distribution
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {gradeBreakdown.map((tier) => {
                const colors = gradeColors[tier.grade] || gradeColors.Junior;
                return (
                  <div
                    key={tier.grade}
                    className={`rounded-lg border ${colors.border} ${colors.bg} p-2.5 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                        {tier.grade}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {tier.count} Titles
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {tier.headcount} Staff
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {tier.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Charts Grid: Horizontal Bar Chart + SVG Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Left Column: Horizontal Bar Chart (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1712]/60 p-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#00C471]" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Staff Allocation by Designation
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    Max: {maxHeadcount} Staff
                  </span>
                </div>

                {/* Bars list */}
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {designationBreakdown.slice(0, 8).map((desig) => {
                    const barWidth = maxHeadcount > 0 ? Math.round((desig.headcount / maxHeadcount) * 100) : 0;
                    const gradeColor = gradeColors[desig.grade] || gradeColors.Junior;

                    return (
                      <div key={desig._id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {desig.title}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400">
                              {desig.code}
                            </span>
                            <span className={`text-[9px] font-semibold px-1 rounded ${gradeColor.text}`}>
                              {desig.grade}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {desig.headcount}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-[10px] w-9 text-right">
                              {desig.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-2 w-full bg-slate-200 dark:bg-[#15241C] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00C471] to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(desig.headcount > 0 ? 4 : 0, barWidth)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {designationBreakdown.length > 8 && (
                <div className="pt-2 text-[10px] text-center text-slate-600 dark:text-slate-400 font-mono">
                  Showing top 8 of {designationBreakdown.length} designations
                </div>
              )}
            </div>

            {/* Right Column: Native SVG Donut Chart (5 Cols) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1712]/60 p-4 flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#00C471]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Designations by Department
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  {totalDesignationsInDepts} Titles
                </span>
              </div>

              {/* Donut SVG with Interactive Center Display */}
              <div className="relative my-2">
                <svg width="150" height="150" viewBox="0 0 140 140" className="transform -rotate-90">
                  {/* Background Track Circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    stroke="currentColor"
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                    className="text-slate-200 dark:text-[#15241C]"
                  />

                  {/* Slices */}
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.departmentId || slice.name}
                      cx="70"
                      cy="70"
                      r={RADIUS}
                      stroke={slice.color}
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      fill="transparent"
                      strokeLinecap="butt"
                      className="transition-all duration-300 cursor-pointer hover:opacity-85"
                      onMouseEnter={() => setHoveredSlice(slice)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </svg>

                {/* Central Stat Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {hoveredSlice ? (
                    <>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                        {hoveredSlice.code}
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {hoveredSlice.designationCount}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-500">
                        {hoveredSlice.sharePct}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Titles
                      </span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {totalDesignationsInDepts}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full space-y-1.5 mt-2 max-h-[110px] overflow-y-auto">
                {donutSlices.slice(0, 5).map((slice) => (
                  <div
                    key={slice.departmentId || slice.name}
                    onMouseEnter={() => setHoveredSlice(slice)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="flex items-center justify-between text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200/50 dark:hover:bg-[#1A3125] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate text-[11px]">
                        {slice.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {slice.designationCount}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        ({slice.sharePct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
