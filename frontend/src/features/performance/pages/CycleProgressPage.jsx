/**
 * @file CycleProgressPage.jsx
 * @description Review Cycle progress tracking, department completion telemetry, and overdue alerts.
 * Strictly adheres to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.9)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Building } from 'lucide-react';
import { useGetCycleProgressQuery } from '../performanceApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';

export const CycleProgressPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'overdueSelf' | 'overdueMgr'

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
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Cycle Telemetry Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">The requested review cycle progress data could not be retrieved.</p>
        <button
          onClick={() => navigate('/performance/cycles')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          Back to Cycles
        </button>
      </div>
    );
  }

  const overdueSelfCount = progress.overdueSelfReviewers?.length || 0;
  const overdueMgrCount = progress.overdueManagerReviewers?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/performance/cycles')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Cycles"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {progress.title} — Telemetry
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {progress.periodYear} Cycle
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time organization-wide evaluation progress, department-level completion meters, and overdue reviewer tracking.
            </p>
          </div>
        </div>

        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Reviews
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {progress.totalReviews}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Instantiated records</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Self-Submitted
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400 mt-1.5 block">
            {progress.selfSubmittedCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Employee appraisals</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Manager-Submitted
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1.5 block">
            {progress.managerSubmittedCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Manager evaluations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Finalized Reviews
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5 block">
            {progress.finalizedCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Approved & signed off</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Completion Rate
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1.5 block">
            {progress.completionRatePercent}%
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Overall target progress</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building className="h-4 w-4" />
          Department Breakdown ({progress.departmentBreakdown?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('overdueSelf')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'overdueSelf'
              ? 'border-rose-600 text-rose-700 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          Overdue Self-Reviews
          {overdueSelfCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              {overdueSelfCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('overdueMgr')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'overdueMgr'
              ? 'border-rose-600 text-rose-700 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Overdue Manager Reviews
          {overdueMgrCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              {overdueMgrCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Department Breakdown */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(progress.departmentBreakdown || []).map((dept, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {dept.department}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {dept.completed} of {dept.total} completed
                    </span>
                  </div>
                </div>

                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                    dept.percent === 100
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : dept.percent >= 50
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                  }`}
                >
                  {dept.percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dept.percent === 100
                      ? 'bg-emerald-500'
                      : dept.percent >= 50
                      ? 'bg-sky-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${dept.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Overdue Self-Reviews */}
      {activeTab === 'overdueSelf' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {overdueSelfCount === 0 ? (
            <div className="text-center py-16 p-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Self-Reviews On Track</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No employees are currently past the self-review submission deadline for this cycle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {progress.overdueSelfReviewers.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold text-[11px]">
                            {item.employee?.firstName?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.employee?.firstName} {item.employee?.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.employee?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {item.department || 'Unassigned'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                          <Clock className="h-3 w-3" /> Overdue Self-Review
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Overdue Manager Reviews */}
      {activeTab === 'overdueMgr' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {overdueMgrCount === 0 ? (
            <div className="text-center py-16 p-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Manager Evaluations On Track</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No managers are currently past the evaluation deadline for submitted self-reviews.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Assigned Manager</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {progress.overdueManagerReviewers.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.manager ? `${item.manager.firstName} ${item.manager.lastName}` : 'Unassigned'}
                        </div>
                        {item.manager?.email && (
                          <div className="text-[11px] text-slate-400 font-mono">{item.manager.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {item.department || 'Unassigned'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                          <AlertTriangle className="h-3 w-3" /> Overdue Manager Review
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
