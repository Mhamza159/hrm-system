/**
 * @file RefreshButton.jsx
 * @description Standardized data refresh button with active spinning indicator for Recruitment & ATS views.
 */

import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';

export const RefreshButton = ({
  onRefresh,
  isFetching = false,
  label = 'Refresh',
  className = ''
}) => {
  const [internalSpinning, setInternalSpinning] = useState(false);

  const handleClick = async () => {
    if (isFetching || internalSpinning) return;
    setInternalSpinning(true);
    try {
      if (typeof onRefresh === 'function') {
        await Promise.resolve(onRefresh());
      }
    } finally {
      // Ensure smooth visual spin feedback even if query is instant
      setTimeout(() => setInternalSpinning(false), 500);
    }
  };

  const isSpinning = isFetching || internalSpinning;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSpinning}
      title="Refresh data"
      className={`px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-200 hover:border-[#00C471]/60 hover:text-[#00C471] transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin text-[#00C471]' : 'text-slate-400'}`} />
      <span>{label}</span>
    </button>
  );
};

