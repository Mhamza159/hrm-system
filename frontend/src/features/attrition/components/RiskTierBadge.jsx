/**
 * @file RiskTierBadge.jsx
 * @description Color-Coded Flight Risk Status Badge with Pulsing Live Indicator.
 * Styled in Forest & Emerald Enterprise palette with high contrast tiers.
 */

import React from 'react';

export const RiskTierBadge = ({ level, score, showScore = true, size = 'md' }) => {
  const normalizedLevel = level || (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low');

  const configs = {
    High: {
      bg: 'bg-red-500/10 dark:bg-red-950/40',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/30 dark:border-red-800/60',
      dot: 'bg-red-500',
      label: 'High Flight Risk'
    },
    Medium: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30 dark:border-amber-800/60',
      dot: 'bg-amber-500',
      label: 'Moderate Risk'
    },
    Low: {
      bg: 'bg-emerald-500/10 dark:bg-[#162820]',
      text: 'text-emerald-600 dark:text-[#00C471]',
      border: 'border-emerald-500/30 dark:border-emerald-800/60',
      dot: 'bg-[#00C471]',
      label: 'Stable Retention'
    }
  };

  const current = configs[normalizedLevel] || configs.Low;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border transition-all ${current.bg} ${current.text} ${current.border} ${
        isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
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
        <span className="font-mono text-[11px] opacity-90">({Math.round(score)})</span>
      )}
    </span>
  );
};

export default RiskTierBadge;
