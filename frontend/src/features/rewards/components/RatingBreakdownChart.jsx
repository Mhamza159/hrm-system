/**
 * @file RatingBreakdownChart.jsx
 * @description Native SVG Responsive Rating & Feedback Breakdown for Survey Analytics (BUILD-GUIDE Row 20.5).
 */

import React from "react";
import { Star, BarChart3, ShieldCheck } from "lucide-react";

export const RatingBreakdownChart = ({ analytics }) => {
  if (!analytics) return null;

  const {
    totalResponses = 0,
    totalEligible = 0,
    participationRate = 0,
    questionBreakdown = [],
    departmentBreakdown = [],
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Participation Rate Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
            Total Responses
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC] mt-1">
            {totalResponses}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">
            out of {totalEligible} eligible workforce
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
            Participation Rate
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#00C471] mt-1">
            {participationRate}%
          </p>
          <div className="w-full bg-slate-100 dark:bg-[#1A3125] h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#00C471] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, participationRate)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
            Departments Represented
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-violet-500 mt-1">
            {departmentBreakdown.length}
          </p>
          <span className="text-[11px] text-slate-400">
            across operational units
          </span>
        </div>
      </div>

      {/* Question by Question Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#00C471]" />
            <span>Question Response Distributions</span>
          </h4>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00C471]" />
            Confidential Responses
          </span>
        </div>

        {questionBreakdown.map((q, idx) => {
          if (q.questionType === "rating_5") {
            const counts = q.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            return (
              <div
                key={q.questionId || idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
                  <div>
                    <span className="text-xs font-bold font-mono text-[#00C471] mr-2">
                      Q{idx + 1}.
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] inline">
                      {q.questionText}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-medium text-slate-500 dark:text-[#7E9E8F]">
                      Average:
                    </span>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold border border-amber-500/20">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-mono">{q.averageScore} / 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution Bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = counts[stars] || 0;
                    const pct =
                      q.totalAnswers > 0
                        ? Math.round((count / q.totalAnswers) * 100)
                        : 0;

                    return (
                      <div
                        key={stars}
                        className="flex items-center gap-3 text-xs"
                      >
                        <span className="w-14 text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1 font-mono text-[11px]">
                          {stars}{" "}
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-[#1A3125] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#00C471] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-20 text-right font-mono tabular-nums text-[11px] text-slate-600 dark:text-[#CBD5E1]">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (q.questionType === "multiple_choice") {
            const counts = q.optionCounts || {};
            const total = q.totalAnswers || 1;

            return (
              <div
                key={q.questionId || idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] space-y-4 shadow-sm"
              >
                <div className="pb-3 border-b border-slate-100 dark:border-[#1A3125]">
                  <span className="text-xs font-bold font-mono text-[#00C471] mr-2">
                    Q{idx + 1}.
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] inline">
                    {q.questionText}
                  </h5>
                </div>

                <div className="space-y-2">
                  {Object.entries(counts).map(([option, count]) => {
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={option} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-800 dark:text-[#CBD5E1]">
                            {option}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-[#7E9E8F]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#1A3125] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#00C471] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (q.questionType === "text") {
            const textResponses = q.textResponses || [];

            return (
              <div
                key={q.questionId || idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] space-y-3 shadow-sm"
              >
                <div className="pb-3 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold font-mono text-[#00C471] mr-2">
                      Q{idx + 1}.
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] inline">
                      {q.questionText}
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {textResponses.length} comments
                  </span>
                </div>

                {textResponses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No qualitative feedback entered.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {textResponses.map((comment, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-100 dark:border-[#1A3125] text-xs space-y-1"
                      >
                        <p className="text-slate-700 dark:text-[#CBD5E1] italic leading-relaxed">
                          "{comment}"
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-[#00C471]" />
                          Anonymous Employee
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
