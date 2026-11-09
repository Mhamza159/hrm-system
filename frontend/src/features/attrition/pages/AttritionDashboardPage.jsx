/**
 * @file AttritionDashboardPage.jsx
 * @description Executive Flight Risk Intelligence & Retention Management Dashboard.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1 to 17.5)
 * - Design: Anti-generic, executive SaaS aesthetics with KPI cards, department charts, and factor pills.
 */

import React, { useState } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Users,
  Building2,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  MessageSquare,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  useGetAttritionScoresQuery,
  useGetDepartmentRiskAnalyticsQuery,
  useRecalculateAttritionScoresMutation
} from '../attritionApi.js';
import { RiskTierBadge } from '../components/RiskTierBadge.jsx';
import { DepartmentRiskChart } from '../components/DepartmentRiskChart.jsx';
import { RetentionNotesModal } from '../components/RetentionNotesModal.jsx';

export const AttritionDashboardPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [selectedScore, setSelectedScore] = useState(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const {
    data: scoresResponse,
    isLoading: isScoresLoading,
    isFetching: isScoresFetching,
    refetch: refetchScores
  } = useGetAttritionScoresQuery({
    page,
    limit: 10,
    search: search || undefined,
    riskLevel: riskLevel || undefined
  });

  const {
    data: deptAnalyticsResponse,
    isLoading: isDeptLoading
  } = useGetDepartmentRiskAnalyticsQuery();

  const [recalculateMutation, { isLoading: isRecalculating }] = useRecalculateAttritionScoresMutation();

  const scores = scoresResponse?.data || [];
  const pagination = scoresResponse?.meta || { page: 1, limit: 10, total: 0, pages: 1 };
  const departmentStats = deptAnalyticsResponse?.data || [];

  // Summary Metrics
  const totalAssessed = pagination.total || 0;
  const highRiskTotal = departmentStats.reduce((sum, d) => sum + (d.highRisk || 0), 0);
  const mediumRiskTotal = departmentStats.reduce((sum, d) => sum + (d.mediumRisk || 0), 0);
  const lowRiskTotal = departmentStats.reduce((sum, d) => sum + (d.lowRisk || 0), 0);

  const handleRecalculate = async () => {
    try {
      await recalculateMutation().unwrap();
      refetchScores();
    } catch (err) {
      console.error('Failed to trigger recalculation:', err);
    }
  };

  const handleOpenNotes = (score) => {
    setSelectedScore(score);
    setIsNotesModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Attrition Risk Intelligence
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  AI & Predictive Signal
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Early flight-risk detection synthesizing attendance, compensation, and performance trajectories
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Evaluating Signals...' : 'Recalculate Scores'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Evaluated */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Evaluated Staff</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalAssessed}</p>
            <span className="text-[11px] text-slate-400">Active workforce</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* High Flight Risk */}
        <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200/60 dark:border-red-900/40 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">High Flight Risk</span>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{highRiskTotal}</p>
            <span className="text-[11px] text-red-500">Score &ge; 70 / 100</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Medium Risk */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Moderate Risk</span>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{mediumRiskTotal}</p>
            <span className="text-[11px] text-amber-500">Score 40 – 69</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Stable Retention</span>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{lowRiskTotal}</p>
            <span className="text-[11px] text-emerald-500">Score &lt; 40 / 100</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Department Trends Chart */}
      <DepartmentRiskChart data={departmentStats} isLoading={isDeptLoading} />

      {/* Main Scored Employee Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Evaluated Employees & Contributing Factors</h3>
            <p className="text-xs text-slate-500">Inspect individual signal contributions and log confidential action notes</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search employee..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary w-44"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={riskLevel}
                onChange={(e) => {
                  setRiskLevel(e.target.value);
                  setPage(1);
                }}
                className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Risk Tiers</option>
                <option value="High">High Risk (70+)</option>
                <option value="Medium">Medium Risk (40-69)</option>
                <option value="Low">Low Risk (&lt;40)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border rounded-xl border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4">Score Breakdown & Top Factors</th>
                <th className="py-3 px-4">Last Evaluated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isScoresLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      <span>Loading attrition risk scores...</span>
                    </div>
                  </td>
                </tr>
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    <p className="font-medium">No employee attrition records match criteria.</p>
                  </td>
                </tr>
              ) : (
                scores.map((item) => {
                  const emp = item.employeeId || {};
                  const factors = item.topFactors || [];
                  const notesCount = item.notes?.length || 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{emp.name || 'Unknown'}</p>
                            <p className="text-[11px] text-slate-400">{emp.employeeCode || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        {item.departmentId?.name || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4">
                        <RiskTierBadge level={item.riskLevel} score={item.riskScore} />
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        {factors.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No significant flight drivers identified</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {factors.slice(0, 3).map((factor, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {factor}
                              </span>
                            ))}
                            {factors.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded text-slate-400">
                                +{factors.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(item.calculatedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenNotes(item)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Action Notes</span>
                          {notesCount > 0 && (
                            <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                              {notesCount}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-slate-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isScoresFetching}
                className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages || isScoresFetching}
                className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Retention Intervention Notes Modal */}
      <RetentionNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedScore(null);
        }}
        scoreData={selectedScore}
      />
    </div>
  );
};

export default AttritionDashboardPage;

