/**
 * @file PayrollRunsPage.jsx
 * @description Monthly Batch Payroll Runs dashboard with 4-stage release lifecycle tracking and Archive Bucket.
 * 
 * SPECIFICATION & CRAFT:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.7 & 9.8)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Theme: ELVARA Emerald Design System (Strict adherence to DESIGN.md & docs/UI-REFERENCE.md)
 * - Features: Active Runs vs Archive Bucket switcher tabs, 4 financial overview stat cards,
 *             1px hairline precision data table, soft-archival, revert, permanent delete,
 *             and polished ConfirmDialog modals with zero window.confirm calls.
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
  Lock,
  Trash2,
  Archive,
  RotateCcw,
  Search,
  ShieldCheck
} from 'lucide-react';
import {
  useGetPayrollRunsQuery,
  useDeletePayrollRunMutation,
  useRestorePayrollRunMutation,
  usePermanentDeletePayrollRunMutation
} from '../payrollApi.js';
import { PrePayrollAuditModal } from '../components/PrePayrollAuditModal.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { cn } from '../../../lib/utils.js';

export function PayrollRunsPage() {
  const { can, isSuperAdmin } = usePermission();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState('');

  // Generation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lifecycle Dialog Targets
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [revertTarget, setRevertTarget] = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);

  // Mutations
  const [deletePayrollRun, { isLoading: isArchiving }] = useDeletePayrollRunMutation();
  const [restorePayrollRun, { isLoading: isRestoring }] = useRestorePayrollRunMutation();
  const [permanentDeletePayrollRun, { isLoading: isPermanentDeleting }] = usePermanentDeletePayrollRunMutation();

  const { data, isLoading, isFetching, refetch } = useGetPayrollRunsQuery({
    page,
    limit: 20,
    status: activeTab === 'active' && statusFilter ? statusFilter : undefined,
    year: yearFilter ? parseInt(yearFilter, 10) : undefined,
    archived: activeTab === 'archived' ? 'true' : 'false'
  });

  const runs = data?.data || [];
  const meta = data?.meta || { totalDocs: 0, totalPages: 1 };
  const activeCount = data?.activeCount ?? (activeTab === 'active' ? (meta.totalDocs || runs.length) : 0);
  const archivedCount = data?.archivedCount ?? (activeTab === 'archived' ? (meta.totalDocs || runs.length) : 0);

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

  // Soft Archive Handler
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    const mName = months.find((m) => m.value === archiveTarget.month)?.label || `M${archiveTarget.month}`;
    try {
      await deletePayrollRun(archiveTarget._id).unwrap();
      toast.success(`Payroll run for ${mName} ${archiveTarget.year} moved to Archive.`);
      setArchiveTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to archive payroll run');
    }
  };

  // Revert Handler
  const handleRevertConfirm = async () => {
    if (!revertTarget) return;
    const mName = months.find((m) => m.value === revertTarget.month)?.label || `M${revertTarget.month}`;
    try {
      await restorePayrollRun(revertTarget._id).unwrap();
      toast.success(`Payroll run for ${mName} ${revertTarget.year} restored to active runs.`);
      setRevertTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to restore payroll run');
    }
  };

  // Permanent Delete Handler
  const handlePermanentDeleteConfirm = async () => {
    if (!permanentDeleteTarget) return;
    const mName = months.find((m) => m.value === permanentDeleteTarget.month)?.label || `M${permanentDeleteTarget.month}`;
    try {
      await permanentDeletePayrollRun(permanentDeleteTarget._id).unwrap();
      toast.success(`Payroll run for ${mName} ${permanentDeleteTarget.year} permanently deleted.`);
      setPermanentDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to permanently delete payroll run');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50">
            <Clock className="w-3 h-3 text-amber-600" /> Draft
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/50">
            <Eye className="w-3 h-3 text-blue-600" /> Under Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50">
            <FileCheck2 className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disbursed (Paid)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-[#15231C] dark:text-slate-300 border border-slate-200/80 dark:border-[#1A3125]">
            {status}
          </span>
        );
    }
  };

  // Quick aggregate metrics
  if (isLoading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const totalDisbursedPaisa = runs
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + (r.totalNetPay || 0), 0);

  const activeReviewRuns = runs.filter((r) => r.status === 'review' || r.status === 'draft').length;

  const filteredRuns = searchQuery.trim()
    ? runs.filter((run) => {
        const mName = months.find((m) => m.value === run.month)?.label || '';
        const searchStr = `${mName} ${run.year} ${run.status}`.toLowerCase();
        return searchStr.includes(searchQuery.toLowerCase());
      })
    : runs;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Monthly Payroll Runs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              End-to-end 4-stage batch compensation calculation, tax withholding & salary disbursement
            </p>
          </div>
        </div>

        {/* Right Aligned Controls Bar (All h-9) */}
        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />

          {(isSuperAdmin || can('payroll.run')) && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-9 px-4 inline-flex items-center gap-2 bg-[#00C471] hover:bg-[#049856] text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Generate Payroll Run</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Recorded Runs
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {activeCount}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Draft / Under Review
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums mt-0.5">
              {activeReviewRuns}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Disbursed (Selected Year)
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
              PKR {(totalDisbursedPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 dark:bg-[#15231C] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125] rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compliance Standard
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              FBR / EOBI / PESSI
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top View Switcher Tabs: Active Runs vs Archive Bucket */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-[#1A3125] pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('active');
            setPage(1);
          }}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'active'
              ? 'bg-[#00C471] text-white shadow-xs shadow-emerald-600/20'
              : 'bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-[#1A3125]'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Active Runs</span>
          <span className={cn(
            'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono',
            activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#15231C] text-slate-600 dark:text-slate-400'
          )}>
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('archived');
            setPage(1);
          }}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'archived'
              ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/20'
              : 'bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-[#1A3125]'
          )}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archive Bucket</span>
          <span className={cn(
            'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono',
            activeTab === 'archived' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#15231C] text-slate-600 dark:text-slate-400'
          )}>
            {archivedCount}
          </span>
        </button>
      </div>

      {/* 4. Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Year:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
            >
              <option value="">All Years</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {activeTab === 'active' && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 bg-slate-50 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
              >
                <option value="">All Stages</option>
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="paid">Disbursed (Paid)</option>
              </select>
            </div>
          )}
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search month or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
          />
        </div>
      </div>

      {/* 5. Runs Table */}
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4">
            <ScreenSkeleton variant="table" title="Payroll Run Batches" message="Loading payroll run history and stage lifecycles..." rows={5} />
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] flex items-center justify-center text-slate-400">
              {activeTab === 'archived' ? <Archive className="w-6 h-6 text-rose-500" /> : <Calendar className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {activeTab === 'archived' ? 'Archive Bucket is Empty' : 'No Payroll Runs Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {activeTab === 'archived'
                ? 'No archived payroll runs found. Soft-deleted payroll runs appear here and can be reverted or permanently removed.'
                : 'There are no payroll calculation runs generated for this filter. Click "Generate Payroll Run" to initiate batch calculation.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-[#1A3125]">
                <tr>
                  <th className="py-3.5 px-6">Payroll Period</th>
                  <th className="py-3.5 px-6">Stage / Status</th>
                  <th className="py-3.5 px-6 text-center">Headcount</th>
                  <th className="py-3.5 px-6 text-right">Gross Pay</th>
                  <th className="py-3.5 px-6 text-right">Tax Withheld</th>
                  <th className="py-3.5 px-6 text-right">Net Disbursement</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {filteredRuns.map((run) => {
                  const monthName = months.find((m) => m.value === run.month)?.label || `M${run.month}`;
                  return (
                    <tr
                      key={run._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#15231C]/50 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs font-mono',
                            activeTab === 'archived'
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40 text-rose-700 dark:text-rose-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
                          )}>
                            {run.month < 10 ? `0${run.month}` : run.month}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {monthName} {run.year}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              Created {new Date(run.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        {getStatusBadge(run.status)}
                      </td>

                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {run.totalEmployees ?? run.employeeCount ?? 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right font-medium text-slate-800 dark:text-slate-200 font-mono tabular-nums text-xs">
                        PKR {((run.totalGrossPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-right font-medium text-rose-600 dark:text-rose-400 font-mono tabular-nums text-xs">
                        PKR {(((run.totalTaxWithheld ?? run.totalIncomeTax) || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums text-xs">
                        PKR {((run.totalNetPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === 'active' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/payroll/runs/${run._id}`)}
                                className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#15231C] hover:bg-slate-200 dark:hover:bg-[#1A3125] border border-slate-200/60 dark:border-[#1A3125] rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Details</span>
                              </button>
                              {(isSuperAdmin || can('payroll.manage')) && (
                                <button
                                  type="button"
                                  onClick={() => setArchiveTarget(run)}
                                  className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-800/40 rounded-lg transition-colors cursor-pointer"
                                  title="Move to Archive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Archive</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {(isSuperAdmin || can('payroll.manage')) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setRevertTarget(run)}
                                    className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg transition-colors cursor-pointer"
                                    title="Restore to Active Policies"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Revert</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPermanentDeleteTarget(run)}
                                    className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-800/40 rounded-lg transition-colors cursor-pointer"
                                    title="Permanently Delete Run"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Pre-Payroll Attendance & Leave Audit Console Modal */}
      <PrePayrollAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(createdRunId) => {
          refetch();
          if (createdRunId) {
            navigate(`/payroll/runs/${createdRunId}`);
          }
        }}
      />

      {/* 7. Confirm Dialog: Move Run to Archive */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Payroll Run?"
        message={`Are you sure you want to move the payroll run for ${months.find((m) => m.value === archiveTarget?.month)?.label || ''} ${archiveTarget?.year} to the Archive? Its payslips will be disabled and hidden from employee self-service, but historical figures remain safely preserved.`}
        confirmText={isArchiving ? 'Archiving...' : 'Archive Run'}
        isDestructive={true}
        confirmVariant="danger"
        isLoading={isArchiving}
      />

      {/* 8. Confirm Dialog: Revert Archived Run to Active */}
      <ConfirmDialog
        isOpen={Boolean(revertTarget)}
        onCancel={() => setRevertTarget(null)}
        onConfirm={handleRevertConfirm}
        title="Revert Payroll Run to Active?"
        message={`Are you sure you want to restore the payroll run for ${months.find((m) => m.value === revertTarget?.month)?.label || ''} ${revertTarget?.year} back to active runs? Its payslips will be restored to employee self-service immediately.`}
        confirmText={isRestoring ? 'Restoring...' : 'Revert Run'}
        isDestructive={false}
        confirmVariant="default"
        isLoading={isRestoring}
      />

      {/* 9. Confirm Dialog: Permanently Delete Run from Archive */}
      <ConfirmDialog
        isOpen={Boolean(permanentDeleteTarget)}
        onCancel={() => setPermanentDeleteTarget(null)}
        onConfirm={handlePermanentDeleteConfirm}
        title="Permanently Delete Payroll Run?"
        message={`Are you sure you want to PERMANENTLY delete the payroll run for ${months.find((m) => m.value === permanentDeleteTarget?.month)?.label || ''} ${permanentDeleteTarget?.year}? All child payslips and financial ledger records will be permanently expunged from the database. This action CANNOT be undone.`}
        confirmText={isPermanentDeleting ? 'Deleting Permanently...' : 'Permanently Delete'}
        isDestructive={true}
        confirmVariant="danger"
        isLoading={isPermanentDeleting}
      />
    </div>
  );
}
