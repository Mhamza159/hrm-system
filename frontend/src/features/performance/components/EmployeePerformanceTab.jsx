/**
 * @file EmployeePerformanceTab.jsx
 * @description Performance history timeline tab for employee profiles.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.8)
 */

import React from 'react';
import { Target, Award, Star, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { useGetEmployeePerformanceHistoryQuery } from '../performanceApi.js';

export const EmployeePerformanceTab = ({ employeeId }) => {
  const { data: historyData, isLoading } = useGetEmployeePerformanceHistoryQuery(employeeId, {
    skip: !employeeId
  });
  const history = historyData?.data || [];

  if (isLoading) {
    return <div className="py-8 text-center text-xs text-slate-500">Loading appraisal history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
        <Target className="mx-auto h-10 w-10 text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Past Appraisals</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
          Historical finalized performance reviews and approved increments will be archived here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-600" />
          Appraisal History Timeline ({history.length})
        </h3>
      </div>

      <div className="space-y-4">
        {history.map((rev) => {
          const finalRating = rev.finalAppraisal?.finalRating || 'N/A';
          const increment = rev.finalAppraisal?.approvedIncrementPercent || 0;

          return (
            <div
              key={rev._id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {rev.cycleId?.title}
                  </h4>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" /> Year {rev.cycleId?.periodYear} · {rev.designationId?.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold font-mono">
                    Rating: {finalRating} / 5
                  </span>
                  {increment > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-mono">
                      <TrendingUp className="h-3.5 w-3.5" /> +{increment}%
                    </span>
                  )}
                </div>
              </div>

              {rev.finalAppraisal?.finalComments && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  "{rev.finalAppraisal.finalComments}"
                </p>
              )}

              {/* KPI Scores Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="text-slate-500">
                  Self-Score: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{rev.selfReview?.calculatedScore || '—'}</span>
                </div>
                <div className="text-slate-500">
                  Manager Score: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{rev.managerReview?.calculatedScore || '—'}</span>
                </div>
                <div className="text-slate-500">
                  Finalized: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(rev.finalAppraisal?.finalizedAt || rev.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

