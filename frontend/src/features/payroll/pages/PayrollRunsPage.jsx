/**
 * @file PayrollRunsPage.jsx
 * @description Monthly Batch Payroll Runs dashboard with 4-stage release lifecycle tracking.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.7 & 9.8)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Features: Batch run initiation, real-time socket progress, status filter, financial cards.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Plus,
  Play,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  FileCheck2,
  Layers,
  X,
  Lock
} from 'lucide-react';
import {
  useGetPayrollRunsQuery,
  useGeneratePayrollRunMutation
} from '../payrollApi.js';
import { PayrollProgressBar } from '../components/PayrollProgressBar.jsx';
import { Can } from '../../../components/common/Can.jsx';

export function PayrollRunsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  // Generation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const { data, isLoading, refetch } = useGetPayrollRunsQuery({
    page,
    limit: 20,
    status: statusFilter || undefined,
    year: yearFilter ? parseInt(yearFilter, 10) : undefined
  });

  const [generatePayrollRun] = useGeneratePayrollRunMutation();

  const runs = data?.data || [];
  const meta = data?.meta || { totalDocs: 0, totalPages: 1 };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const handleStartGeneration = async (e) => {
    e.preventDefault();
    setGenError('');
    setIsGenerating(true);

    try {
      await generatePayrollRun({
        month: parseInt(genMonth, 10),
        year: parseInt(genYear, 10)
      }).unwrap();
    } catch (err) {
      setIsGenerating(false);
      setGenError(err?.data?.message || err?.message || 'Failed to trigger batch payroll generation');
    }
  };

  const handleGenerationComplete = () => {
    setIsGenerating(false);
    setIsModalOpen(false);
    refetch();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Eye className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <FileCheck2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed (Paid)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {status}
          </span>
        );
    }
  };

  // Quick aggregate metrics
  const totalDisbursedPaisa = runs
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + (r.totalNetPay || 0), 0);

  const activeReviewRuns = runs.filter((r) => r.status === 'review' || r.status === 'draft').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Monthly Payroll Runs
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                End-to-end 4-stage batch compensation calculation, tax withholding & salary disbursement
              </p>
            </div>
          </div>
        </div>

        <Can I="payroll.create" a="Payroll" fallback={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-white" />
            Generate Payroll Run
          </button>
        }>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-white" />
            Generate Payroll Run
          </button>
        </Can>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Recorded Runs
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {meta.totalDocs || runs.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Draft / Under Review
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeReviewRuns}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Disbursed (Selected Year)
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              PKR {(totalDisbursedPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compliance Standard
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              FBR / EOBI / PESSI
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Year:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Years</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Stages</option>
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="paid">Disbursed (Paid)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading payroll runs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Payroll Runs Found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              There are no payroll calculation runs generated for this filter. Click "Generate Payroll Run" to initiate batch calculation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Payroll Period</th>
                  <th className="px-6 py-4">Stage / Status</th>
                  <th className="px-6 py-4 text-center">Headcount</th>
                  <th className="px-6 py-4 text-right">Gross Pay</th>
                  <th className="px-6 py-4 text-right">Tax Withheld</th>
                  <th className="px-6 py-4 text-right">Net Disbursement</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {runs.map((run) => {
                  const monthName = months.find((m) => m.value === run.month)?.label || `M${run.month}`;
                  return (
                    <tr
                      key={run._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            {run.month < 10 ? `0${run.month}` : run.month}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {monthName} {run.year}
                            </div>
                            <div className="text-xs text-slate-400">
                              Created {new Date(run.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(run.status)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {run.employeeCount || 0}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-200">
                        PKR {((run.totalGrossPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400">
                        PKR {((run.totalIncomeTax || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        PKR {((run.totalNetPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/payroll/runs/${run._id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Play className="w-5 h-5 fill-indigo-600 dark:fill-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Generate Monthly Payroll
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculates gross, tax, EOBI, unpaid leaves, and overtime
                  </p>
                </div>
              </div>

              {!isGenerating && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Attendance MonthLock Alert */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong>Precondition:</strong> Attendance records for the selected month must be locked by HR before payroll calculation can proceed.
              </div>
            </div>

            {genError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{genError}</span>
              </div>
            )}

            {/* Socket Real-Time Progress Bar */}
            <PayrollProgressBar
              isGenerating={isGenerating}
              onComplete={handleGenerationComplete}
            />

            {!isGenerating && (
              <form onSubmit={handleStartGeneration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Payroll Month
                    </label>
                    <select
                      value={genMonth}
                      onChange={(e) => setGenMonth(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Payroll Year
                    </label>
                    <select
                      value={genYear}
                      onChange={(e) => setGenYear(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Batch Run
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
