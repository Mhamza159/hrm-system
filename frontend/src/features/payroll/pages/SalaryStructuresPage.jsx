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
  X
} from 'lucide-react';
import {
  useGetSalaryStructuresQuery,
  useGetEmployeeSalaryStructureQuery
} from '../payrollApi.js';
import { SalaryFormModal } from '../components/SalaryFormModal.jsx';
import { SalaryRevisionModal } from '../components/SalaryRevisionModal.jsx';

export function SalaryStructuresPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedForRevision, setSelectedForRevision] = useState(null);
  const [selectedForHistoryId, setSelectedForHistoryId] = useState(null);

  const { data, isLoading, refetch } = useGetSalaryStructuresQuery({
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Salary Structures
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure employee compensation breakdowns, statutory EOBI/PESSI flags, and revisions
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          Assign Salary Structure
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="active">Active Structures</option>
            <option value="superseded">Superseded / Historical</option>
            <option value="">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Main Structures Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
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
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    Loading salary structures...
                  </td>
                </tr>
              ) : structures.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No salary structures found. Click "Assign Salary Structure" to create one.
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

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {emp.name || 'Unnamed'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {emp.employeeCode || 'N/A'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-800 dark:text-slate-200">
                          {emp.departmentId?.name || '—'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {emp.designationId?.title || '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {effective}
                      </td>

                      <td className="px-5 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-200">
                        PKR {basicPkr.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        PKR {grossPkr.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {s.eobiEnabled && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">
                              EOBI
                            </span>
                          )}
                          {s.pessiEnabled && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800">
                              PESSI
                            </span>
                          )}
                          {s.providentFundEnabled && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800">
                              PF {s.providentFundRate}%
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            s.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {s.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="capitalize">{s.status}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedForRevision(s)}
                            title="Revise / Increment Salary"
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedForHistoryId(emp._id)}
                            title="View Revision History"
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {structures.length} of {meta.totalDocs} records
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
                Page {page} of {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revision History Drawer / Modal */}
      {selectedForHistoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Compensation History
                </h2>
              </div>
              <button
                onClick={() => setSelectedForHistoryId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingHistory ? (
              <p className="text-sm text-slate-400">Loading revision timeline...</p>
            ) : (
              <div className="space-y-6">
                {/* Employee Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {historyData?.data?.employee?.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {historyData?.data?.employee?.employeeCode} • {historyData?.data?.employee?.designation} • {historyData?.data?.employee?.department}
                  </p>
                </div>

                {/* Active Structure */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Current Active Structure
                  </h4>
                  {historyData?.data?.current ? (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Gross Monthly Pay</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-base">
                          PKR {((historyData.data.current.grossSalary || 0) / 100).toLocaleString('en-PK')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Effective Date</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(historyData.data.current.effectiveFrom).toLocaleDateString('en-PK')}
                        </span>
                      </div>
                      {historyData.data.current.revisionReason && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                          <span className="font-semibold">Reason: </span>
                          {historyData.data.current.revisionReason}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No active structure found.</p>
                  )}
                </div>

                {/* History Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Superseded History ({historyData?.data?.history?.length || 0})
                  </h4>

                  <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800">
                    {historyData?.data?.history?.map((h) => (
                      <div key={h._id} className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Gross: PKR {((h.grossSalary || 0) / 100).toLocaleString('en-PK')}
                            </span>
                            <span className="text-slate-400">
                              {new Date(h.effectiveFrom).toLocaleDateString('en-PK')}
                            </span>
                          </div>
                          {h.revisionReason && (
                            <p className="text-xs text-slate-500 italic">
                              "{h.revisionReason}"
                            </p>
                          )}
                          {h.revisedBy && (
                            <p className="text-[11px] text-slate-400">
                              By: {h.revisedBy.name || h.revisedBy.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
