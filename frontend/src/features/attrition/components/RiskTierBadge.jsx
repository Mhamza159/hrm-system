/**
 * @file RiskTierBadge.jsx
 * @description Color-Coded Flight Risk Status Badge with Pulsing Live Indicator.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Row 17.2)
 * - Tiers: High Risk (70-100, Red), Medium Risk (40-69, Amber), Low Risk (0-39, Green)
 */

import React from 'react';

export const RiskTierBadge = ({ level, score, showScore = true, size = 'md' }) => {
  const normalizedLevel = level || (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low');

  const configs = {
    High: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
      label: 'High Risk'
    },
    Medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      label: 'Medium Risk'
    },
    Low: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      label: 'Low Risk'
    }
  };

  const current = configs[normalizedLevel] || configs.Low;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {normalizedLevel === 'High' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      <span>{current.label}</span>
      {showScore && typeof score === 'number' && (
        <span className="font-semibold opacity-90">({Math.round(score)})</span>
      )}
    </span>
  );
};

export default RiskTierBadge;

