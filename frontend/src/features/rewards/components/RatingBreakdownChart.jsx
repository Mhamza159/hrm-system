/**
 * @file RatingBreakdownChart.jsx
 * @description Native SVG Responsive Rating & Feedback Breakdown for Survey Analytics (BUILD-GUIDE Row 20.5).
 */

import React from 'react';
import { Star, BarChart3, Users } from 'lucide-react';

export const RatingBreakdownChart = ({ analytics }) => {
  if (!analytics) return null;

  const {
    totalResponses = 0,
    totalEligible = 0,
    participationRate = 0,
    questionBreakdown = [],
    departmentBreakdown = []
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Participation Rate Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Responses</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {totalResponses}
          </p>
          <span className="text-[11px] text-slate-400">out of {totalEligible} eligible staff</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Participation Rate</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {participationRate}%
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, participationRate)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Departments Represented</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {departmentBreakdown.length}
          </p>
          <span className="text-[11px] text-slate-400">across operational units</span>
        </div>
      </div>

      {/* Question by Question Breakdown */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span>Question Score Breakdown</span>
        </h4>

        {questionBreakdown.map((q, idx) => {
          if (q.questionType === 'rating_5') {
            const counts = q.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const maxCount = Math.max(1, ...Object.values(counts));

            return (
              <div
                key={q.questionId}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-400 mr-2">Q{idx + 1}.</span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 inline">
                      {q.questionText}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-medium text-slate-500">Average:</span>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{q.averageScore} / 5</span>
                    </div>
                  </div>
                </div>

                {/* Native SVG Rating Distribution Bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = counts[stars] || 0;
                    const pct = q.totalAnswers > 0 ? Math.round((count / q.totalAnswers) * 100) : 0;
                    const barWidthPct = Math.round((count / maxCount) * 100);

                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                          {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </span>

                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 dark:bg-amber-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${barWidthPct}%` }}
                          />
                        </div>

                        <span className="w-14 text-right text-slate-400 text-[11px]">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Free text responses
          return (
            <div
              key={q.questionId}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 mr-2">Q{idx + 1}.</span>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 inline">
                  {q.questionText}
                </h5>
                <span className="ml-2 text-[11px] text-slate-400">({q.totalAnswers} comments)</span>
              </div>

              <div className="space-y-2 pt-2">
                {(q.sampleAnswers || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No text comments recorded yet.</p>
                ) : (
                  q.sampleAnswers.map((ans, aIdx) => (
                    <div
                      key={aIdx}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80 leading-relaxed italic"
                    >
                      "{ans}"
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

