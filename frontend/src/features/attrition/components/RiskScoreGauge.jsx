/**
 * @file RiskScoreGauge.jsx
 * @description Numerical and Visual Risk Progress Indicator with Color Gradient Interpolation.
 * Styled in Forest & Emerald Enterprise theme with dynamic risk threshold coloring.
 */

import React from 'react';

export const RiskScoreGauge = ({ score = 0, size = 'md', showBar = true }) => {
  const clampedScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));

  // Color interpolation based on risk tiers
  const getColors = () => {
    if (clampedScore >= 70) {
      return {
        text: 'text-red-500 dark:text-red-400',
        bar: 'bg-red-500',
        track: 'bg-red-500/10'
      };
    }
    if (clampedScore >= 40) {
      return {
        text: 'text-amber-500 dark:text-amber-400',
        bar: 'bg-amber-500',
        track: 'bg-amber-500/10'
      };
    }
    return {
      text: 'text-emerald-500 dark:text-[#00C471]',
      bar: 'bg-[#00C471]',
      track: 'bg-emerald-500/10'
    };
  };

  const colors = getColors();
  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono font-bold w-12 shrink-0 ${isSmall ? 'text-xs' : 'text-sm'} ${colors.text}`}>
        {clampedScore}
        <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] font-normal">/100</span>
      </span>

      {showBar && (
        <div className={`rounded-full overflow-hidden ${colors.track} ${isSmall ? 'w-16 h-1.5' : 'w-20 h-2'} shrink-0`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${clampedScore}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default RiskScoreGauge;
