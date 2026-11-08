/**
 * @file AIScreeningBadge.jsx
 * @description Match Score & Fit Reasoning Badge Component (Module M15 / Row 15.6).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.6)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle, X } from 'lucide-react';

export const AIScreeningBadge = ({ score, reason, strengths = [], missing = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
        <HelpCircle className="w-2.5 h-2.5" />
        Pending AI Screen
      </span>
    );
  }

  const numericScore = Number(score);

  // Badge styling
  let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/50';
  if (numericScore < 60) {
    badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
  } else if (numericScore < 80) {
    badgeColor = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer hover:scale-105 transition ${badgeColor}`}
        title="Click to view AI screening rationale"
      >
        <Sparkles className="w-3 h-3 text-[#00C471]" />
        {numericScore}% Match
      </button>

      {/* Rationale Popover Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#162820] text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-[#1A3125]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    AI Match Score: {numericScore}/100
                  </h4>
                  <p className="text-[10px] text-slate-500">Automated Job Fit Rationale</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reason && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#162820]/70 border border-slate-200 dark:border-[#1A3125] text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                  Screening Summary:
                </p>
                {reason}
              </div>
            )}

            {strengths.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-[#00C471] mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Matching Strengths ({strengths.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {strengths.map((str, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]"
                    >
                      {str}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {missing.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Missing Job Criteria ({missing.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((mis, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                    >
                      {mis}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIScreeningBadge;
