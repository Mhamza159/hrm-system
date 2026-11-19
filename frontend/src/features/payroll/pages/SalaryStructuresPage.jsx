/**
 * @file SalaryStructuresPage.jsx
 * @description Main dashboard page for managing employee salary structures and revisions.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.1 & 9.2)
 * - Layer: Feature Page (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  TrendingUp,
  History,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  X,
  Briefcase,
  Shield
} from 'lucide-react';
import {
  useGetSalaryStructuresQuery,
  useGetEmployeeSalaryStructureQuery
} from '../payrollApi.js';
import { SalaryFormModal } from '../components/SalaryFormModal.jsx';
import { SalaryRevisionModal } from '../components/SalaryRevisionModal.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { RoleBadge } from '../../../components/common/RoleBadge.jsx';
import { DesignationBadge } from '../../../components/common/DesignationBadge.jsx';
import { cn } from '../../../lib/utils.js';

export function SalaryStructuresPage() {
  const { can, isSuperAdmin } = usePermission();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedForRevision, setSelectedForRevision] = useState(null);
  const [selectedForHistoryId, setSelectedForHistoryId] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetSalaryStructuresQuery({
    page,
    limit: 20,
    search: search ? search : undefined,
    status: statusFilter ? statusFilter : undefined
  });

  const { data: historyData, isLoading: isLoadingHistory } = useGetEmployeeSalaryStructureQuery(
    selectedForHistoryId,
    { skip: !selectedForHistoryId }
  );

  const structures = data?.data || [];
  const meta = data?.meta || { totalDocs: 0, totalPages: 1 };

  if (isLoading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Salary Structures
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure employee compensation breakdowns, statutory EOBI/PESSI flags, and revisions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          {(isSuperAdmin || can('payroll.manage')) && (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="h-9 px-4 inline-flex items-center gap-2 bg-[#00C471] hover:bg-[#049856] text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Salary Structure</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#111D17] rounded-2xl p-4 border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-4 text-xs font-medium bg-slate-50 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white placeholder:text-slate-400 transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="p-2 bg-slate-50 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs font-semibold bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 shadow-xs cursor-pointer"
          >
            <option value="active">Active Structures</option>
            <option value="superseded">Superseded / Historical</option>
            <option value="">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Main Structures Table */}
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-[#1A3125] font-semibold">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department & Role</th>
                <th className="px-5 py-3.5">Effective Date</th>
                <th className="px-5 py-3.5 text-right">Basic Pay</th>
                <th className="px-5 py-3.5 text-right">Gross Salary</th>
                <th className="px-5 py-3.5 text-center">Statutory</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-[#1A3125]">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <ScreenSkeleton variant="table" />
                  </td>
                </tr>
              ) : structures.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 dark:bg-[#15231C] text-slate-400 rounded-2xl">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        No Salary Structures Found
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No compensation records match the current filter. Click "Assign Salary Structure" to create one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                structures.map((s) => {
                  const emp = s.employeeId || {};
                  const basicPkr = (s.basicSalary || 0) / 100;
                  const grossPkr = (s.grossSalary || 0) / 100;
                  const effective = new Date(s.effectiveFrom).toLocaleDateString('en-PK', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  const hasStatutory = s.eobiEnabled || s.pessiEnabled || s.providentFundEnabled;

                  const userRoles = emp.userId?.roles || [];
                  const role = userRoles.length > 0 ? userRoles[0] : null;
                  const initials = (emp.name || 'EM')
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-[#15231C]/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471] dark:text-[#05D87D] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {emp.name || 'Unnamed'}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {emp.employeeCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{emp.departmentId?.name || 'General Department'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <DesignationBadge designation={emp.designationId} />
                          {role && <RoleBadge role={role} size="sm" />}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {effective}
                      </td>

                      <td className="px-5 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-200">
                        PKR {basicPkr.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-4 text-right font-mono font-bold text-[#00C471] dark:text-[#05D87D]">
                        PKR {grossPkr.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {hasStatutory ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {s.eobiEnabled && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200/80 dark:border-emerald-800/50 uppercase tracking-wider">
                                EOBI
                              </span>
                            )}
                            {s.pessiEnabled && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-md border border-teal-200/80 dark:border-teal-800/50 uppercase tracking-wider">
                                PESSI
                              </span>
                            )}
                            {s.providentFundEnabled && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200/80 dark:border-amber-800/50 uppercase tracking-wider">
                                PF {s.providentFundRate}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                            s.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-[#15231C] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A3125]'
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', s.status === 'active' ? 'bg-[#00C471]' : 'bg-slate-400')} />
                          <span className="capitalize">{s.status}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(isSuperAdmin || can('payroll.manage')) && (
                            <button
                              type="button"
                              onClick={() => setSelectedForRevision(s)}
                              title="Revise / Increment Salary"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs cursor-pointer active:scale-95"
                            >
                              <TrendingUp className="w-3.5 h-3.5 text-[#00C471]" />
                              <span>Revise</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedForHistoryId(emp._id)}
                            title="View Compensation History"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1A3125] transition-colors shadow-2xs cursor-pointer active:scale-95"
                          >
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <span>History</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-[#1A3125] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-[#0E1A14]">
            <span>
              Showing {structures.length} of {meta.totalDocs} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-[#1A3125] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-semibold text-slate-800 dark:text-slate-200">
                Page {page} of {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-[#1A3125] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revision History Drawer / Modal */}
      {selectedForHistoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-white dark:bg-[#111D17] shadow-2xl p-6 sm:p-8 overflow-y-auto border-l border-slate-200/80 dark:border-[#1A3125] flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-200/80 dark:border-[#1A3125]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Compensation History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Audit trail of salary increments and base pay adjustments
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedForHistoryId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-12">
                  <ScreenSkeleton variant="cards" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Employee Hero Card */}
                  <div className="p-4 bg-slate-50/70 dark:bg-[#0E1A14] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 font-bold text-sm flex items-center justify-center shrink-0">
                      {(historyData?.data?.employee?.name || 'EMP')
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {historyData?.data?.employee?.name || 'Employee'}
                        </h3>
                        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#15231C] px-2 py-0.5 rounded border border-slate-200/80 dark:border-[#1A3125]">
                          {historyData?.data?.employee?.employeeCode || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {historyData?.data?.employee?.designation || 'Staff'} • {historyData?.data?.employee?.department || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Active Structure */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Current Active Structure
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Effective: {historyData?.data?.current ? new Date(historyData.data.current.effectiveFrom).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </div>

                    {historyData?.data?.current ? (
                      <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-4">
                        <div className="flex justify-between items-baseline pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Gross Monthly Pay
                            </span>
                            <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                              PKR {((historyData.data.current.grossSalary || 0) / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#111D17] px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                            Active
                          </span>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500">Basic Pay:</span>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              PKR {((historyData.data.current.basicSalary || 0) / 100).toLocaleString('en-PK')}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500">House Rent:</span>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              PKR {((historyData.data.current.houseRentAllowance || 0) / 100).toLocaleString('en-PK')}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500">Medical:</span>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              PKR {((historyData.data.current.medicalAllowance || 0) / 100).toLocaleString('en-PK')}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500">Conveyance:</span>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              PKR {((historyData.data.current.conveyanceAllowance || 0) / 100).toLocaleString('en-PK')}
                            </p>
                          </div>
                        </div>

                        {historyData.data.current.revisionReason && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Justification: </span>
                            {historyData.data.current.revisionReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-[#0E1A14] rounded-2xl border border-slate-200 dark:border-[#1A3125] text-xs text-slate-400 text-center">
                        No active structure found.
                      </div>
                    )}
                  </div>

                  {/* History Timeline */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Superseded History ({historyData?.data?.history?.length || 0})
                    </span>

                    {historyData?.data?.history && historyData.data.history.length > 0 ? (
                      <div className="relative pl-6 space-y-4 border-l-2 border-emerald-200/60 dark:border-emerald-900/40 ml-2">
                        {historyData.data.history.map((h) => (
                          <div key={h._id} className="relative">
                            <div className="absolute -left-[31px] top-2 w-3 h-3 rounded-full bg-[#00C471] border-2 border-white dark:border-[#111D17]" />
                            <div className="p-4 bg-slate-50/70 dark:bg-[#0E1A14] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] space-y-2">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                  Gross: PKR {((h.grossSalary || 0) / 100).toLocaleString('en-PK')}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                                  {new Date(h.effectiveFrom).toLocaleDateString('en-PK')}
                                </span>
                              </div>
                              {h.revisionReason && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                                  "{h.revisionReason}"
                                </p>
                              )}
                              {h.revisedBy && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  Revised by: <span className="text-slate-600 dark:text-slate-300 font-medium">{h.revisedBy.name || h.revisedBy.email}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50/50 dark:bg-[#0E1A14] rounded-2xl border border-slate-200/60 dark:border-[#1A3125] text-center space-y-1.5">
                        <Clock className="w-5 h-5 mx-auto text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Initial Baseline Structure
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                          This employee is on their initial compensation plan. Mid-cycle revisions and promotions will appear here in chronological order.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Close */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-[#1A3125] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedForHistoryId(null)}
                className="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1A3125] shadow-xs cursor-pointer transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SalaryFormModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <SalaryRevisionModal
        isOpen={Boolean(selectedForRevision)}
        currentStructure={selectedForRevision}
        onClose={() => setSelectedForRevision(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
