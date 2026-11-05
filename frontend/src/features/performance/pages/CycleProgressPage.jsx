/**
 * @file CycleProgressPage.jsx
 * @description Review Cycle progress tracking, department completion breakdowns, and overdue alerts.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.9)
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Users, Building, ShieldAlert } from 'lucide-react';
import { useGetCycleProgressQuery } from '../performanceApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';

export const CycleProgressPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: progressData, isLoading, isFetching, refetch } = useGetCycleProgressQuery(id);
  const progress = progressData?.data;

  if (isLoading && !progress) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Progress metrics not found.</p>
        <button
          onClick={() => navigate('/performance/cycles')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs"
        >
          Back to Cycles
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/performance/cycles')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {progress.title} — Progress
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cycle Year {progress.periodYear} · Organization-wide completion telemetry
            </p>
          </div>
        </div>
        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Total Reviews</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {progress.totalReviews}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Self-Reviews Done</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {progress.selfSubmittedCount}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Manager Reviews</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
            {progress.managerSubmittedCount}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Finalized</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {progress.finalizedCount}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              ({progress.completionRatePercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Department Completion Breakdown
          </h2>
        </div>

        <div className="space-y-4">
          {progress.departmentBreakdown?.map((dept, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {dept.department}
                </span>
                <span className="text-slate-500 font-mono">
                  {dept.completed} / {dept.total} ({dept.percent}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${dept.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Delinquent Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue Self-Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-950 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-bold text-sm">
              Overdue Self-Reviews ({progress.overdueSelfReviewers?.length || 0})
            </h3>
          </div>

          {progress.overdueSelfReviewers?.length === 0 ? (
            <p className="text-xs text-slate-500">No overdue self-evaluations.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {progress.overdueSelfReviewers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {item.department || 'No Dept'} · {item.employee?.email}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                    Overdue
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Manager Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-950 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold text-sm">
              Pending Manager Evaluations ({progress.overdueManagerReviewers?.length || 0})
            </h3>
          </div>

          {progress.overdueManagerReviewers?.length === 0 ? (
            <p className="text-xs text-slate-500">No pending manager appraisals past deadline.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {progress.overdueManagerReviewers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Manager: {item.manager?.firstName || 'Not Assigned'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-white dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Awaiting Manager
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

