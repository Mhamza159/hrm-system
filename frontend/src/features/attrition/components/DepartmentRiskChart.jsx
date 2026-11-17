/**
 * @file DepartmentRiskChart.jsx
 * @description Native SVG Responsive Stacked Bar Chart for Department Attrition Analytics.
 * Styled in Forest & Emerald Enterprise theme with click-to-filter drill-down support.
 */

import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

export const DepartmentRiskChart = ({
  data = [],
  isLoading = false,
  selectedDepartmentId = '',
  onSelectDepartment
}) => {
  const [hoveredDept, setHoveredDept] = useState(null);

  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C471] border-t-transparent" />
          <span className="text-xs text-slate-500 dark:text-[#7E9E8F]">Loading department attrition trends...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center bg-white dark:bg-[#111D17] rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] text-slate-500 dark:text-[#7E9E8F] text-xs p-6 text-center">
        <Building2 className="h-10 w-10 text-slate-400 dark:text-[#7E9E8F] mb-2 opacity-50" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">No department attrition statistics recorded</p>
        <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] mt-0.5">
          Trigger recalculation above to evaluate workforce attrition scores.
        </p>
      </div>
    );
  }

  // Find max total employees across departments for Y-scale
  const maxTotal = Math.max(1, ...data.map((d) => d.totalEmployees || 0));

  // Chart dimensions
  const svgWidth = 640;
  const svgHeight = 230;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 24;
  const padBottom = 48;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const barWidth = Math.min(38, Math.max(18, (plotWidth / data.length) * 0.55));

  return (
    <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-sm space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-[#1A3125]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Department Retention Distribution
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">
              Comparative flight risk across departments (Click bar to drill down)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#EF4444]" />
            <span className="text-slate-600 dark:text-[#7E9E8F] text-[11px]">High Risk (&ge;70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
            <span className="text-slate-600 dark:text-[#7E9E8F] text-[11px]">Moderate (40-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#00C471]" />
            <span className="text-slate-600 dark:text-[#7E9E8F] text-[11px]">Stable (&lt;40)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 overflow-visible"
        >
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padTop + plotHeight * (1 - ratio);
            const val = Math.round(maxTotal * ratio);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#1A3125]"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-[#7E9E8F] text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Department Bars */}
          {data.map((dept, idx) => {
            const step = plotWidth / data.length;
            const x = padLeft + idx * step + (step - barWidth) / 2;

            const highH = (Number(dept.highRisk || 0) / maxTotal) * plotHeight;
            const medH = (Number(dept.mediumRisk || 0) / maxTotal) * plotHeight;
            const lowH = (Number(dept.lowRisk || 0) / maxTotal) * plotHeight;

            const baseBottom = padTop + plotHeight;
            const highY = baseBottom - highH;
            const medY = highY - medH;
            const lowY = medY - lowH;

            const isHovered = hoveredDept?.departmentId === dept.departmentId;
            const isSelected = selectedDepartmentId === dept.departmentId;

            return (
              <g
                key={dept.departmentId || idx}
                onMouseEnter={() => setHoveredDept(dept)}
                onMouseLeave={() => setHoveredDept(null)}
                onClick={() => onSelectDepartment && onSelectDepartment(isSelected ? '' : dept.departmentId)}
                className="cursor-pointer transition-all duration-150"
                opacity={hoveredDept && !isHovered ? 0.45 : 1}
              >
                {/* Selection Highlight Track */}
                {isSelected && (
                  <rect
                    x={x - 4}
                    y={padTop}
                    width={barWidth + 8}
                    height={plotHeight + 36}
                    fill="currentColor"
                    className="text-[#00C471]/10 rounded-lg"
                    rx={6}
                  />
                )}

                {/* High Risk (Bottom Segment) */}
                {highH > 0 && (
                  <rect
                    x={x}
                    y={highY}
                    width={barWidth}
                    height={highH}
                    fill="#EF4444"
                    className="transition-all"
                  />
                )}

                {/* Medium Risk (Middle Segment) */}
                {medH > 0 && (
                  <rect
                    x={x}
                    y={medY}
                    width={barWidth}
                    height={medH}
                    fill="#F59E0B"
                    className="transition-all"
                  />
                )}

                {/* Low Risk (Top Segment) */}
                {lowH > 0 && (
                  <rect
                    x={x}
                    y={lowY}
                    width={barWidth}
                    height={lowH}
                    fill="#00C471"
                    rx={3}
                    className="transition-all"
                  />
                )}

                {/* Total label above bar */}
                <text
                  x={x + barWidth / 2}
                  y={lowY - 5}
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-[#F8FAFC] text-[10px] font-bold font-mono"
                >
                  {dept.totalEmployees}
                </text>

                {/* X-Axis Department Name */}
                <text
                  x={x + barWidth / 2}
                  y={baseBottom + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold transition ${
                    isSelected
                      ? 'fill-[#00C471] font-bold'
                      : 'fill-slate-600 dark:fill-slate-300'
                  }`}
                >
                  {(dept.departmentName || dept.departmentCode || '').slice(0, 10)}
                </text>

                {/* Average Risk Tag */}
                <text
                  x={x + barWidth / 2}
                  y={baseBottom + 28}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-[#7E9E8F] text-[9px] font-mono"
                >
                  Avg {dept.averageRiskScore}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredDept && (
          <div className="absolute top-2 right-4 bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] shadow-2xl rounded-xl p-3 text-xs z-10 min-w-[210px] pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1A3125] pb-1.5 flex items-center justify-between">
              <span>{hoveredDept.departmentName}</span>
              <span className="font-mono text-[10px] text-slate-400">({hoveredDept.departmentCode})</span>
            </p>
            <div className="mt-2 space-y-1.5">
              <p className="flex justify-between text-slate-600 dark:text-[#7E9E8F]">
                <span>Total Staff:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{hoveredDept.totalEmployees}</span>
              </p>
              <p className="flex justify-between text-red-500">
                <span>High Flight Risk:</span>
                <span className="font-mono font-bold">{hoveredDept.highRisk}</span>
              </p>
              <p className="flex justify-between text-amber-500">
                <span>Moderate Risk:</span>
                <span className="font-mono font-bold">{hoveredDept.mediumRisk}</span>
              </p>
              <p className="flex justify-between text-[#00C471]">
                <span>Stable Retention:</span>
                <span className="font-mono font-bold">{hoveredDept.lowRisk}</span>
              </p>
              <div className="pt-1.5 border-t border-slate-100 dark:border-[#1A3125] text-[11px] flex justify-between font-bold">
                <span className="text-slate-500 dark:text-[#7E9E8F]">Average Risk:</span>
                <span className="text-[#00C471] font-mono">{hoveredDept.averageRiskScore}/100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentRiskChart;
