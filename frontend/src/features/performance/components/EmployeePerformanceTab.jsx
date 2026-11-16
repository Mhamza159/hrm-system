/**
 * @file EmployeePerformanceTab.jsx
 * @description Performance history timeline tab for employee profiles.
 * Strictly adheres to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.8)
 */

import React from 'react';
import { Award, Star, TrendingUp, Calendar } from 'lucide-react';
import { useGetEmployeePerformanceHistoryQuery } from '../performanceApi.js';

export const EmployeePerformanceTab = ({ employeeId }) => {
  const { data: historyData, isLoading } = useGetEmployeePerformanceHistoryQuery(employeeId, {
    skip: !employeeId
  });
  const history = historyData?.data || [];

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
        Loading historical appraisal timeline...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2.5">
          <Award className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Past Appraisals</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
          Historical finalized performance evaluations, ratings progression, and approved salary increments will be archived here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-600" />
          Appraisal History Timeline ({history.length})
        </h3>
        <span className="text-xs text-slate-500">Chronological performance progression</span>
      </div>

      <div className="space-y-3.5">
        {history.map((rev) => {
          const finalRating = rev.finalAppraisal?.finalRating || 'N/A';
          const increment = rev.finalAppraisal?.approvedIncrementPercent || 0;

          return (
            <div
              key={rev._id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {rev.cycleId?.title}
                  </h4>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    Year {rev.cycleId?.periodYear} · {rev.designationId?.title || 'Designation'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold font-mono">
                    <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                    Rating: {finalRating} / 5
                  </span>

                  {increment > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold font-mono shadow-xs">
                      <TrendingUp className="h-3.5 w-3.5" /> +{increment}%
                    </span>
                  )}
                </div>
              </div>

              {rev.finalAppraisal?.finalComments && (
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    Appraisal Decision Remarks:
                  </span>
                  "{rev.finalAppraisal.finalComments}"
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span>Evaluated KPIs: {rev.kpis?.length || 0} rubrics</span>
                {rev.finalAppraisal?.finalizedAt && (
                  <span>
                    Finalized on {new Date(rev.finalAppraisal.finalizedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
