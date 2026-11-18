/**
 * @file ShiftAnalyticsSection.jsx
 * @description Interactive visual analytics dashboard for work shifts and roster scheduling.
 * Features Horizontal Bar Chart for staff allocation per shift and native SVG Donut Chart for shift type & day/night distribution.
 * Styled strictly in the Forest & Emerald Enterprise theme with zero external chart libraries.
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Clock,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun
} from 'lucide-react';

const SHIFT_TYPE_COLORS = {
  fixed: '#00C471',     // Emerald
  flexible: '#F59E0B',  // Amber
  night: '#818CF8'      // Indigo
};

const RADIUS = 54;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ShiftAnalyticsSection({ analytics = {}, isLoading = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const {
    summary = {},
    typeDistribution = [],
    shiftHeadcounts = [],
    dayNightRatio = {}
  } = analytics;

  const totalAssigned = summary.totalAssignedEmployees || 0;
  const maxHeadcount = Math.max(1, ...shiftHeadcounts.map((s) => s.headcount || 0));

  // Compute donut slices based on active typeDistribution
  const activeTypes = useMemo(() => {
    return typeDistribution.filter((t) => (t.shiftCount || 0) > 0);
  }, [typeDistribution]);

  const totalShiftsInTypes = useMemo(() => {
    return activeTypes.reduce((acc, curr) => acc + curr.shiftCount, 0);
  }, [activeTypes]);

  const donutSlices = useMemo(() => {
    const result = [];
    let runningPercent = 0;
    for (let idx = 0; idx < activeTypes.length; idx++) {
      const item = activeTypes[idx];
      const sharePct = totalShiftsInTypes > 0 ? (item.shiftCount / totalShiftsInTypes) * 100 : 0;
      const strokeDasharray = `${(sharePct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
      const strokeDashoffset = -((runningPercent / 100) * CIRCUMFERENCE);
      const color = SHIFT_TYPE_COLORS[item.type] || item.color || '#64748B';

      result.push({
        ...item,
        color,
        sharePct,
        strokeDasharray,
        strokeDashoffset
      });
      runningPercent += sharePct;
    }
    return result;
  }, [activeTypes, totalShiftsInTypes]);

  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-[#111D17]/80 rounded-2xl p-6 border border-slate-200/60 dark:border-[#1A3125] mb-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // If no shifts are registered yet
  if (!summary.totalShifts || summary.totalShifts === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 dark:bg-[#111D17]/90 backdrop-blur-md rounded-2xl border border-slate-200/70 dark:border-[#1A3125] shadow-sm mb-6 transition-all duration-300">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer select-none border-b border-transparent hover:border-slate-100 dark:hover:border-[#1A3125]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Work Shifts & Roster Analytics
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/40 dark:border-emerald-800/40">
                Live Distribution
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Staff allocation, cross-midnight overnight schedules, and shift type compositions
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'Collapse Shift Analytics' : 'Expand Shift Analytics'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 pt-2 border-t border-slate-100 dark:border-[#1A3125]/60 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Horizontal Progress Flex-Bars */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Staff Distribution by Shift
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                Top {Math.min(5, shiftHeadcounts.length)} of {shiftHeadcounts.length} Active Shifts
              </span>
            </div>

            <div className="space-y-3.5">
              {shiftHeadcounts.slice(0, 5).map((shift) => {
                const percentOfMax = maxHeadcount > 0 ? (shift.headcount / maxHeadcount) * 100 : 0;
                const percentOfTotal = totalAssigned > 0 ? ((shift.headcount / totalAssigned) * 100).toFixed(1) : 0;
                const isOvernight = shift.isCrossMidnight || shift.type === 'night';

                return (
                  <div key={shift._id} className="group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: shift.color || '#00C471' }}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {shift.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {shift.code}
                        </span>
                        {isOvernight && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40">
                            <Moon className="w-2.5 h-2.5" />
                            Overnight
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                          {shift.headcount}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({percentOfTotal}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                        style={{
                          width: `${Math.max(4, percentOfMax)}%`,
                          backgroundColor: shift.color || '#00C471'
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>{shift.startTime} → {shift.endTime} ({Math.round(shift.durationMinutes / 60)}h net)</span>
                      <span>{shift.capacity > 0 ? `Cap: ${shift.headcount}/${shift.capacity}` : 'Unlimited cap'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Native SVG Donut Chart */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#00C471]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Shift Schedule & Day/Night Ratio
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {totalShiftsInTypes} Active Configurations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* SVG Donut */}
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                  />
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.type}
                      cx="70"
                      cy="70"
                      r={RADIUS}
                      stroke={slice.color}
                      strokeWidth={hoveredSlice === slice.type ? STROKE_WIDTH + 4 : STROKE_WIDTH}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(slice.type)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </svg>

                {/* Donut Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {totalAssigned}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Rostered Staff
                  </span>
                </div>
              </div>

              {/* Legend & Day/Night Stats */}
              <div className="space-y-2.5">
                {donutSlices.map((slice) => {
                  const isHovered = hoveredSlice === slice.type;
                  return (
                    <div
                      key={slice.type}
                      onMouseEnter={() => setHoveredSlice(slice.type)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`
                        flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer
                        ${isHovered ? 'bg-slate-100 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                      `}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {slice.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {slice.shiftCount} shifts
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({slice.sharePct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Day vs Night Ratio Card */}
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Day: <strong>{dayNightRatio.day?.shiftCount || 0}</strong></span>
                  </div>
                  <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Night: <strong>{dayNightRatio.night?.shiftCount || 0}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShiftAnalyticsSection;
