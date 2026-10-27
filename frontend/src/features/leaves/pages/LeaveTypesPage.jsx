/**
 * @file LeaveTypesPage.jsx
 * @description Master Leave Types & Quotas Configuration Screen with Table & Card View Modes.
 * 
 * SPECIFICATION & THEME:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 * - Features: Dual View (Table & Card Grid), Category Filter Pills, Live Search,
 *             Add/Edit/Deactivate Modals, Statutory Medical Certificate Rules.
 * - Theme: ELVARA Emerald Design System (100% Light & Dark Mode Compatible)
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  List,
  LayoutGrid,
  Search,
  X,
  RefreshCw,
  Coins,
  ShieldCheck,
  ArrowRightLeft,
  Users
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetLeaveTypesQuery,
  useDeleteLeaveTypeMutation
} from '../leavesApi.js';
import { LeaveTypeModal } from '../components/LeaveTypeModal.jsx';
import { cn } from '../../../lib/utils.js';

export function LeaveTypesPage() {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'paid' | 'unpaid' | 'medical' | 'carry'
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: response, isLoading, refetch } = useGetLeaveTypesQuery({});
  const rawTypes = response?.data || [];

  const [deleteLeaveType, { isLoading: isDeleting }] = useDeleteLeaveTypeMutation();

  // Metric Aggregates
  const totalTypes = rawTypes.length;
  const activeTypes = rawTypes.filter((t) => t.isActive).length;
  const paidTypes = rawTypes.filter((t) => t.isPaid).length;
  const unpaidTypes = totalTypes - paidTypes;
  const requiresProofTypes = rawTypes.filter((t) => t.requiresAttachment).length;
  const carryForwardTypes = rawTypes.filter((t) => t.carryForwardMax > 0).length;

  // Filtered dataset
  const filteredTypes = useMemo(() => {
    return rawTypes.filter((t) => {
      // Type Filter
      if (typeFilter === 'paid' && !t.isPaid) return false;
      if (typeFilter === 'unpaid' && t.isPaid) return false;
      if (typeFilter === 'medical' && !t.requiresAttachment) return false;
      if (typeFilter === 'carry' && (!t.carryForwardMax || t.carryForwardMax <= 0)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name?.toLowerCase().includes(q);
        const matchesCode = t.code?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });
  }, [rawTypes, typeFilter, searchQuery]);

  const handleCreate = () => {
    setSelectedLeaveType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type) => {
    setSelectedLeaveType(type);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLeaveType(deleteTarget._id).unwrap();
      setFeedback({ type: 'success', message: `Leave category '${deleteTarget.name}' deactivated successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.data?.message || err?.message || 'Failed to deactivate leave type' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Leave Category & Code',
      accessor: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {row.name}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
              {row.code}
            </span>
          </div>
          {row.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
              {row.description}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Yearly Quota',
      accessor: (row) => (
        <span className="font-bold text-slate-900 dark:text-white tabular-nums text-xs">
          {row.daysPerYear} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">days / yr</span>
        </span>
      )
    },
    {
      header: 'Remuneration',
      accessor: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border',
            row.isPaid
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
          )}
        >
          <span>{row.isPaid ? 'Paid' : 'Unpaid'}</span>
        </span>
      )
    },
    {
      header: 'Carry-Forward Limit',
      accessor: (row) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {row.carryForwardMax > 0 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
              <ArrowRightLeft className="w-3 h-3" />
              <span>Max {row.carryForwardMax} days</span>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">None</span>
          )}
        </span>
      )
    },
    {
      header: 'Medical Certificate',
      accessor: (row) =>
        row.requiresAttachment ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300">
            <FileCheck className="w-3 h-3 text-blue-600" />
            <span>&ge; {row.minDaysForAttachment} days</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">Not mandatory</span>
        )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
            row.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', row.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
          <span>{row.isActive ? 'Active' : 'Disabled'}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Can I="leave.settings" a="Leave">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
              title="Edit Leave Category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              disabled={!row.isActive}
              className={cn(
                'p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer',
                row.isActive
                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'text-slate-400 cursor-not-allowed opacity-50'
              )}
              title="Deactivate Leave Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Leave Types & Quotas"
        subtitle="Manage statutory leave allowances, carry-forward limits, and medical certificate requirements."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leaves', href: '/leaves/my' },
          { label: 'Leave Types' }
        ]}
        actions={
          <Can I="leave.settings" a="Leave">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Leave Type</span>
            </button>
          </Can>
        }
      />

      {/* 2. Feedback Alert */}
      {feedback.message && (
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl border text-xs shadow-xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Categories"
          value={totalTypes}
          caption={`${activeTypes} active policies`}
          variant="emerald"
        />
        <StatCard
          icon={Sparkles}
          label="Paid Quotas"
          value={paidTypes}
          caption={`${unpaidTypes} unpaid categories`}
          variant="blue"
        />
        <StatCard
          icon={FileCheck}
          label="Medical Proof Required"
          value={requiresProofTypes}
          caption="Enforces doctor certificate"
          variant="purple"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Policies"
          value={activeTypes}
          caption="Available in applications"
          variant="rose"
        />
      </div>

      {/* 4. Filter & View Switcher Bar */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'all', label: 'All Policies', count: totalTypes },
              { id: 'paid', label: 'Paid Quotas', count: paidTypes },
              { id: 'unpaid', label: 'Unpaid', count: unpaidTypes },
              { id: 'medical', label: 'Medical Proof Required', count: requiresProofTypes },
              { id: 'carry', label: 'Carry-Forward', count: carryForwardTypes }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setTypeFilter(st.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shadow-2xs cursor-pointer',
                  typeFilter === st.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span>{st.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    typeFilter === st.id
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right Controls: Search, View Mode, Refresh */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category or code..."
                className="w-full pl-9 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-0.5 shadow-2xs shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="p-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Leave Types"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Main Content: Table or Card Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse text-xs">
            Loading leave categories & quotas...
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery ? `No leave categories match "${searchQuery}"` : 'No leave categories configured'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching with a different category name, code, or clear filters.'
                : 'Click "Add Leave Type" above to configure your organization statutory and custom leave quotas.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredTypes}
              isLoading={isLoading}
              emptyMessage="No leave types found matching filters."
            />
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 pt-1">
            {filteredTypes.map((type) => (
              <div
                key={type._id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Name, Code & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {type.name}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
                        {type.code}
                      </span>
                    </div>
                    {type.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {type.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full border shrink-0',
                      type.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', type.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                    <span>{type.isActive ? 'Active' : 'Disabled'}</span>
                  </span>
                </div>

                {/* Main Quota Stat Block */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Annual Allowance
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {type.daysPerYear}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Days / Year
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-xl border',
                      type.isPaid
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    )}
                  >
                    {type.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                  </span>
                </div>

                {/* Policy Specs List */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Carry-Forward:</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {type.carryForwardMax > 0 ? `Max ${type.carryForwardMax} days` : 'None'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span>Medical Proof:</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {type.requiresAttachment ? `Required if ≥ ${type.minDaysForAttachment} days` : 'Not required'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>Eligibility:</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                      {type.genderConstraint === 'any' ? 'All active staff' : `${type.genderConstraint} only`}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Code: {type.code}
                  </span>

                  <Can I="leave.settings" a="Leave">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
                        title="Edit Leave Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(type)}
                        disabled={!type.isActive}
                        className={cn(
                          'p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer',
                          type.isActive
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-slate-400 cursor-not-allowed opacity-50'
                        )}
                        title="Deactivate Leave Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Can>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Create / Edit Modal */}
      <LeaveTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaveType={selectedLeaveType}
      />

      {/* 7. Confirm Deactivation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Leave Category?"
        message={`Are you sure you want to deactivate '${deleteTarget?.name}'? It will be hidden from new leave applications, but historical records will remain preserved.`}
        confirmText={isDeleting ? 'Deactivating...' : 'Deactivate Category'}
        isDestructive={true}
      />
    </div>
  );
}

export default LeaveTypesPage;
