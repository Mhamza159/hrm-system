/**
 * @file AttritionRiskDonutChart.jsx
 * @description Lightweight Native SVG Donut Chart displaying overall workforce risk tier distribution.
 * Implements interactive drill-down filtering, central health gauge, and Forest & Emerald Enterprise styling.
 */

import React, { useState } from 'react';
import { PieChart, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';

export const AttritionRiskDonutChart = ({
  highRisk = 0,
  mediumRisk = 0,
  lowRisk = 0,
  averageScore = 0,
  onSelectRiskLevel,
  selectedRiskLevel = '',
  isLoading = false
}) => {
  const [hoveredTier, setHoveredTier] = useState(null);

  const total = highRisk + mediumRisk + lowRisk;

  // Segment percentages and stroke calculations
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const tiers = [
    {
      id: 'High',
      label: 'High Flight Risk',
      count: highRisk,
      color: '#EF4444',
      hoverColor: '#DC2626',
      icon: ShieldAlert,
      pct: total > 0 ? (highRisk / total) * 100 : 0
    },
    {
      id: 'Medium',
      label: 'Moderate Risk',
      count: mediumRisk,
      color: '#F59E0B',
      hoverColor: '#D97706',
      icon: AlertTriangle,
      pct: total > 0 ? (mediumRisk / total) * 100 : 0
    },
    {
      id: 'Low',
      label: 'Stable Retention',
      count: lowRisk,
      color: '#00C471',
      hoverColor: '#00B064',
      icon: Sparkles,
      pct: total > 0 ? (lowRisk / total) * 100 : 0
    }
  ];

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const segments = tiers.map((tier) => {
    const strokeDasharray = `${(tier.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += tier.pct;
    return {
      ...tier,
      strokeDasharray,
      strokeDashoffset
    };
  });

  const getHealthBadge = () => {
    if (averageScore >= 70) {
      return { text: 'Elevated Risk', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    if (averageScore >= 40) {
      return { text: 'Caution Required', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }
    return { text: 'Healthy Workforce', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  };

  const health = getHealthBadge();

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Risk Tier Breakdown</h3>
            <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Workforce proportion by flight risk</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${health.color}`}>
          {health.text}
        </span>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
          Loading risk distribution...
        </div>
      ) : total === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
          No evaluated employees available
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-between py-3 gap-4">
          {/* Centered Donut SVG */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center my-auto">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 180 180"
            >
              {/* Background Track */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-[#162820]"
              />

              {/* Segments */}
              {segments.map((s) => {
                if (s.count === 0) return null;
                const isHovered = hoveredTier === s.id;
                const isSelected = selectedRiskLevel === s.id;

                return (
                  <circle
                    key={s.id}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="transparent"
                    stroke={isHovered || isSelected ? s.hoverColor : s.color}
                    strokeWidth={isHovered || isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={s.strokeDasharray}
                    strokeDashoffset={s.strokeDashoffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredTier(s.id)}
                    onMouseLeave={() => setHoveredTier(null)}
                    onClick={() => onSelectRiskLevel && onSelectRiskLevel(isSelected ? '' : s.id)}
                  />
                );
              })}
            </svg>

            {/* Central Score Gauge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {Math.round(averageScore)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] uppercase tracking-wider font-semibold mt-0.5">
                Avg Risk Score
              </span>
            </div>
          </div>

          {/* Interactive Legend List - Full width at bottom, clean stack */}
          <div className="w-full space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#1A3125]/60">
            {tiers.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedRiskLevel === t.id;
              const isHovered = hoveredTier === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectRiskLevel && onSelectRiskLevel(isSelected ? '' : t.id)}
                  onMouseEnter={() => setHoveredTier(t.id)}
                  onMouseLeave={() => setHoveredTier(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#00C471] bg-emerald-500/10 dark:bg-[#162820]'
                      : isHovered
                      ? 'border-slate-300 dark:border-[#1A3125] bg-slate-50 dark:bg-[#061A14]'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-[#061A14]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.label}
                    </span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs pl-2 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t.count}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#7E9E8F] ml-1.5 font-normal">
                      ({t.pct.toFixed(0)}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttritionRiskDonutChart;
