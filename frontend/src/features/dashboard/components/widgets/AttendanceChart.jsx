/**
 * @file AttendanceChart.jsx
 * @description 7-day responsive attendance trend visualization using native SVG.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.5)
 * - Layer: Component (React 18 / Tailwind / Pure SVG)
 * - Zero external charting dependency: 100% resilient, responsive, accessible SVG
 */

import React, { useState } from 'react';

export function AttendanceChart({ data = [], title = 'Attendance Trends' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Month abbreviations
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formattedData = data.map((d) => {
    const parts = (d.date || '').split('-');
    const m = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
    return {
      ...d,
      displayDate: parts.length === 3 ? `${m} ${parts[2]}` : d.date,
      present: Number(d.present) || 0,
      late: Number(d.late) || 0,
      absent: Number(d.absent) || 0,
      on_leave: Number(d.on_leave) || 0
    };
  });

  // SVG dimensions & scales
  const width = 560;
  const height = 200;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const maxVal = Math.max(
    1,
    ...formattedData.map((d) => Math.max(d.present, d.late, d.absent, d.on_leave))
  );

  const getX = (idx) => {
    if (formattedData.length <= 1) return paddingX + chartW / 2;
    return paddingX + (idx / (formattedData.length - 1)) * chartW;
  };

  const getY = (val) => {
    return height - paddingY - (val / maxVal) * chartH;
  };

  // Build SVG path string for an area series
  const buildPath = (key) => {
    if (formattedData.length === 0) return '';
    return formattedData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`)
      .join(' ');
  };

  const buildAreaPath = (key) => {
    if (formattedData.length === 0) return '';
    const linePath = buildPath(key);
    const lastX = getX(formattedData.length - 1).toFixed(1);
    const firstX = getX(0).toFixed(1);
    const baseY = (height - paddingY).toFixed(1);
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Daily presence and absence trajectory</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
          Last 7 Days
        </span>
      </div>

      {/* Series Legend */}
      <div className="flex items-center justify-end gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
        </span>
      </div>

      {/* Native SVG Visualization */}
      <div className="relative w-full h-56">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
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
                  {Math.round(pct * maxVal)}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={buildAreaPath('present')} fill="url(#presentGrad)" />
          <path d={buildAreaPath('late')} fill="url(#lateGrad)" />

          {/* Line Strokes */}
          <path
            d={buildPath('present')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={buildPath('late')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={buildPath('absent')}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Data Points and Interactivity */}
          {formattedData.map((d, i) => {
            const cx = getX(i);
            const cyPresent = getY(d.present);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={paddingY}
                    x2={cx}
                    y2={height - paddingY}
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Visible node circle */}
                <circle
                  cx={cx}
                  cy={cyPresent}
                  r={isHovered ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* X-Axis date label */}
                <text
                  x={cx}
                  y={height - paddingY + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered ? 'fill-emerald-600 font-bold' : 'fill-slate-400'
                  }`}
                >
                  {d.displayDate}
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
              left: `${(getX(hoveredIdx) / width) * 100}%`
            }}
          >
            <p className="font-semibold text-slate-300">{formattedData[hoveredIdx].displayDate}</p>
            <p className="text-emerald-400">Present: {formattedData[hoveredIdx].present}</p>
            <p className="text-amber-400">Late: {formattedData[hoveredIdx].late}</p>
            <p className="text-rose-400">Absent: {formattedData[hoveredIdx].absent}</p>
          </div>
        )}
      </div>
    </div>
  );
}
