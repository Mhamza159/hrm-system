/**
 * @file DepartmentRiskChart.jsx
 * @description Native SVG Responsive Stacked Bar Chart for Department Attrition Analytics.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Row 17.3)
 * - Zero external charting dependency: 100% resilient, responsive, accessible SVG.
 * - Stacked distribution of High (Red), Medium (Amber), and Low (Green) risk headcounts per department.
 */

import React, { useState } from 'react';
import { Building2, AlertCircle } from 'lucide-react';

export const DepartmentRiskChart = ({ data = [], isLoading = false }) => {
  const [hoveredDept, setHoveredDept] = useState(null);

  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="text-xs text-slate-500">Loading department attrition trends...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
        <Building2 className="h-10 w-10 text-slate-400 mb-2" />
        <p className="font-medium">No department attrition statistics recorded yet.</p>
        <p className="text-slate-400">Trigger calculation to evaluate employee attrition scores.</p>
      </div>
    );
  }

  // Find max total employees across departments for Y-scale
  const maxTotal = Math.max(1, ...data.map((d) => d.totalEmployees || 0));

  // Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const barWidth = Math.min(36, Math.max(16, (plotWidth / data.length) * 0.55));

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Department Retention Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparative flight risk profile across company departments
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            <span className="text-slate-600 dark:text-slate-400">High Risk (&ge;70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">Medium Risk (40-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Low Risk (&lt;40)</span>
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
                  className="text-slate-100 dark:text-slate-800"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
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

            return (
              <g
                key={dept.departmentId || idx}
                onMouseEnter={() => setHoveredDept(dept)}
                onMouseLeave={() => setHoveredDept(null)}
                className="cursor-pointer transition-opacity duration-150"
                opacity={hoveredDept && !isHovered ? 0.45 : 1}
              >
                {/* High Risk (Bottom Segment) */}
                {highH > 0 && (
                  <rect
                    x={x}
                    y={highY}
                    width={barWidth}
                    height={highH}
                    fill="#ef4444"
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
                    fill="#f59e0b"
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
                    fill="#10b981"
                    rx={2}
                    className="transition-all"
                  />
                )}

                {/* Total label above bar */}
                <text
                  x={x + barWidth / 2}
                  y={lowY - 4}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-400 text-[10px] font-semibold"
                >
                  {dept.totalEmployees}
                </text>

                {/* X-Axis Department Name */}
                <text
                  x={x + barWidth / 2}
                  y={baseBottom + 16}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  {(dept.departmentName || dept.departmentCode || '').slice(0, 10)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={baseBottom + 28}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px]"
                >
                  Avg {dept.averageRiskScore}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredDept && (
          <div className="absolute top-2 right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-3 text-xs z-10 min-w-[200px] pointer-events-none">
            <p className="font-bold text-slate-900 dark:text-slate-100 border-b pb-1">
              {hoveredDept.departmentName} ({hoveredDept.departmentCode})
            </p>
            <div className="mt-1.5 space-y-1">
              <p className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Staff:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{hoveredDept.totalEmployees}</span>
              </p>
              <p className="flex justify-between text-red-600 dark:text-red-400">
                <span>High Flight Risk:</span>
                <span className="font-bold">{hoveredDept.highRisk}</span>
              </p>
              <p className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Medium Risk:</span>
                <span className="font-semibold">{hoveredDept.mediumRisk}</span>
              </p>
              <p className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Low Risk:</span>
                <span className="font-semibold">{hoveredDept.lowRisk}</span>
              </p>
              <div className="pt-1 border-t text-[11px] text-slate-500 flex justify-between font-bold">
                <span>Average Risk:</span>
                <span className="text-primary">{hoveredDept.averageRiskScore}/100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentRiskChart;
