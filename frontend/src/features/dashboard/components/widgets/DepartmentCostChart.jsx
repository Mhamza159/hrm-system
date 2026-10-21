/**
 * @file DepartmentCostChart.jsx
 * @description Department-wise payroll cost distribution bar chart using native responsive SVG.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.5)
 * - Layer: Component (React 18 / Tailwind / Pure SVG)
 * - Zero external dependencies: High performance, accessible, responsive
 */

import React, { useState } from 'react';

export function DepartmentCostChart({ data = [], title = 'Department Payroll Costs' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const formattedData = data.map((d) => ({
    departmentName: d.departmentName || 'Dept',
    grossPkr: Number(d.grossPkr) || 0,
    grossInThousands: Math.round((Number(d.grossPkr) || 0) / 1000),
    employeeCount: Number(d.employeeCount) || 0
  }));

  const width = 560;
  const height = 200;
  const paddingX = 45;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const maxVal = Math.max(1, ...formattedData.map((d) => d.grossInThousands));
  const numItems = formattedData.length;
  const barSlotWidth = numItems > 0 ? chartW / numItems : chartW;
  const barWidth = Math.min(42, barSlotWidth * 0.6);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monthly gross allocation by department</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
          PKR (Thousands)
        </span>
      </div>

      <div className="relative w-full h-56">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
            No finalized payroll data available yet.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.33, 0.66, 1].map((pct, i) => {
                const y = height - paddingY - pct * chartH;
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="#94a3b8"
                      strokeOpacity="0.18"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-medium"
                    >
                      {Math.round(pct * maxVal)}k
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {formattedData.map((d, i) => {
                const slotCenter = paddingX + i * barSlotWidth + barSlotWidth / 2;
                const barX = slotCenter - barWidth / 2;
                const barHeight = (d.grossInThousands / maxVal) * chartH;
                const barY = height - paddingY - barHeight;
                const isHovered = hoveredIdx === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    {/* Bar background highlight */}
                    {isHovered && (
                      <rect
                        x={slotCenter - barSlotWidth / 2}
                        y={paddingY}
                        width={barSlotWidth}
                        height={chartH}
                        fill="#3b82f6"
                        opacity="0.06"
                        rx="6"
                      />
                    )}

                    {/* Colored bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={Math.max(2, barHeight)}
                      rx="5"
                      fill={isHovered ? '#2563eb' : '#3b82f6'}
                      className="transition-colors"
                    />

                    {/* Department name label */}
                    <text
                      x={slotCenter}
                      y={height - paddingY + 16}
                      textAnchor="middle"
                      className={`text-[10px] transition-colors truncate ${
                        isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-400 font-medium'
                      }`}
                    >
                      {d.departmentName.length > 9 ? `${d.departmentName.slice(0, 8)}…` : d.departmentName}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Popover */}
            {hoveredIdx !== null && formattedData[hoveredIdx] && (
              <div
                className="absolute -top-3 pointer-events-none transform -translate-x-1/2 bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl shadow-xl text-[11px] space-y-0.5 z-20"
                style={{
                  left: `${((paddingX + hoveredIdx * barSlotWidth + barSlotWidth / 2) / width) * 100}%`
                }}
              >
                <p className="font-semibold text-slate-200">{formattedData[hoveredIdx].departmentName}</p>
                <p className="text-blue-400">
                  Cost: PKR {formattedData[hoveredIdx].grossPkr.toLocaleString()}
                </p>
                <p className="text-slate-400">
                  Employees: {formattedData[hoveredIdx].employeeCount}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
