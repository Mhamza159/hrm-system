/**
 * @file LeaveTypesPage.jsx
 * @description Master Leave Types & Quotas Configuration Screen with Active Policies and Archive Bucket Tabs.
 * 
 * SPECIFICATION & THEME:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 * - Features: Dual View (Table & Card Grid), Category Filter Pills, Live Search,
 *             Add/Edit Modals, Soft-Archival, Revert to Active, and Permanent Delete.
 * - Theme: ELVARA Emerald Design System (100% Light & Dark Mode Compatible)
 * - Reference: DESIGN.md & docs/UI-REFERENCE.md
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
  Users,
  Archive,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetLeaveTypesQuery,
  useDeleteLeaveTypeMutation,
  useRestoreLeaveTypeMutation,
  usePermanentDeleteLeaveTypeMutation
} from '../leavesApi.js';
import { LeaveTypeModal } from '../components/LeaveTypeModal.jsx';
import { cn } from '../../../lib/utils.js';
import { toast } from 'sonner';

export function LeaveTypesPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'paid' | 'unpaid' | 'medical' | 'carry'
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);

  // Modal Targets for Lifecycle Transitions
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [revertTarget, setRevertTarget] = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);

  // Queries & Mutations
  const { data: response, isLoading, isFetching, refetch } = useGetLeaveTypesQuery({});
  const rawTypes = response?.data || [];

  const [deleteLeaveType, { isLoading: isArchiving }] = useDeleteLeaveTypeMutation();
  const [restoreLeaveType, { isLoading: isRestoring }] = useRestoreLeaveTypeMutation();
  const [permanentDeleteLeaveType, { isLoading: isPermanentDeleting }] = usePermanentDeleteLeaveTypeMutation();

  // Active vs Archived Lists
  const activeTypesList = useMemo(() => {
    return rawTypes.filter((t) => !t.isArchived && t.isActive !== false);
  }, [rawTypes]);

  const archivedTypesList = useMemo(() => {
    return rawTypes.filter((t) => t.isArchived || t.isActive === false);
  }, [rawTypes]);

  // Metric Aggregates (calculated against active policies)
  const activeCount = activeTypesList.length;
  const archivedCount = archivedTypesList.length;
  const paidTypes = activeTypesList.filter((t) => t.isPaid).length;
  const unpaidTypes = activeCount - paidTypes;
  const requiresProofTypes = activeTypesList.filter((t) => t.requiresAttachment).length;
  const carryForwardTypes = activeTypesList.filter((t) => t.carryForwardMax > 0).length;

  // Source list determined by active tab
  const currentList = activeTab === 'active' ? activeTypesList : archivedTypesList;

  // Filtered dataset for the active view
  const filteredTypes = useMemo(() => {
    return currentList.filter((t) => {
      // Category Remuneration / Proof Filter
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
  }, [currentList, typeFilter, searchQuery]);

  // Handlers
  const handleCreate = () => {
    setSelectedLeaveType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type) => {
    setSelectedLeaveType(type);
    setIsModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await deleteLeaveType(archiveTarget._id).unwrap();
      toast.success(`Leave category '${archiveTarget.name}' moved to Archive successfully.`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to archive leave category');
    } finally {
      setArchiveTarget(null);
    }
  };

  const handleRevertConfirm = async () => {
    if (!revertTarget) return;
    try {
      await restoreLeaveType(revertTarget._id).unwrap();
      toast.success(`Leave category '${revertTarget.name}' restored to active policies.`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to revert leave category');
    } finally {
      setRevertTarget(null);
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!permanentDeleteTarget) return;
    try {
      await permanentDeleteLeaveType(permanentDeleteTarget._id).unwrap();
      toast.success(`Leave category '${permanentDeleteTarget.name}' permanently deleted.`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to permanently delete leave category');
    } finally {
      setPermanentDeleteTarget(null);
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
            !row.isArchived && row.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400'
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', !row.isArchived && row.isActive ? 'bg-emerald-500' : 'bg-amber-500')} />
          <span>{!row.isArchived && row.isActive ? 'Active' : 'Archived'}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Can I="leave.settings" a="Leave">
            {activeTab === 'active' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleEdit(row)}
                  className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Edit Leave Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveTarget(row)}
                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Move to Archive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRevertTarget(row)}
                  className="p-1.5 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs"
                  title="Revert to Active Policies"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Revert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPermanentDeleteTarget(row)}
                  className="p-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs"
                  title="Permanently Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
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
        subtitle="Manage statutory leave allowances, carry-forward limits, and category lifecycle archives."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leaves', href: '/leaves/my' },
          { label: 'Leave Types' }
        ]}
        actions={
          <Can I="leave.settings" a="Leave">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-4 h-9 text-xs font-bold text-white bg-[#00C471] hover:bg-[#049856] rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Leave Type</span>
            </button>
          </Can>
        }
      />

      {/* 2. Top View Switcher Tabs: Active Policies vs Archive Bucket */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('active');
              setTypeFilter('all');
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              activeTab === 'active'
                ? 'bg-[#00C471] text-white border-emerald-500 shadow-xs shadow-emerald-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Policies</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none',
                activeTab === 'active'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('archived');
              setTypeFilter('all');
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              activeTab === 'archived'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs shadow-amber-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Bucket</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none',
                activeTab === 'archived'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}
            >
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Global Refresh Button */}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer text-xs font-semibold"
          title="Reload Leave Types"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
          <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-4">
          <ScreenSkeleton
            variant={viewMode === 'card' ? 'cards' : 'table'}
            title="Leave Categories & Quotas"
            message="Configuring policy allowances, paid leave ratios, and carry-forward limits..."
            rows={5}
            cards={6}
          />
        </div>
      ) : (
        <>
          {/* 3. Stat Cards (Shown for Active Tab Context) */}
          {activeTab === 'active' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Calendar}
                label="Total Categories"
                value={activeCount}
                caption={`${activeCount} active in system`}
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
                icon={Archive}
                label="Archived Policies"
                value={archivedCount}
                caption="In archive bucket"
                variant="amber"
              />
            </div>
          )}

          {/* Archive Informational Banner */}
          {activeTab === 'archived' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-300 block">
                  Archived Leave Categories
                </span>
                <p className="text-amber-800/90 dark:text-amber-400/90 leading-relaxed text-[11px]">
                  These leave categories are currently archived and disabled from employee applications. You can <strong>Revert</strong> a category to restore it to active policies, or <strong>Permanently Delete</strong> it from the system if no active or approved leave applications depend on it.
                </p>
              </div>
            </div>
          )}

          {/* 4. Filter & View Switcher Bar */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-slate-100/80 dark:bg-[#0A1610] rounded-2xl border border-slate-200/60 dark:border-emerald-950/40">
                {[
                  {
                    id: 'all',
                    label: activeTab === 'active' ? 'All Active' : 'All Archived',
                    count: currentList.length,
                    activeCls: 'bg-[#00C471] text-white shadow-xs shadow-emerald-500/20'
                  },
                  {
                    id: 'paid',
                    label: 'Paid Quotas',
                    count: currentList.filter((t) => t.isPaid).length,
                    activeCls: 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
                  },
                  {
                    id: 'unpaid',
                    label: 'Unpaid',
                    count: currentList.filter((t) => !t.isPaid).length,
                    activeCls: 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                  },
                  {
                    id: 'medical',
                    label: 'Medical Proof Required',
                    count: currentList.filter((t) => t.requiresAttachment).length,
                    activeCls: 'bg-purple-600 text-white shadow-xs shadow-purple-500/20'
                  },
                  {
                    id: 'carry',
                    label: 'Carry-Forward',
                    count: currentList.filter((t) => t.carryForwardMax > 0).length,
                    activeCls: 'bg-sky-600 text-white shadow-xs shadow-sky-500/20'
                  }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTypeFilter(st.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                      typeFilter === st.id
                        ? st.activeCls
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span>{st.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-none',
                        typeFilter === st.id
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Controls: Search & View Mode */}
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
              </div>
            </div>

            {/* 5. Main Content: Table or Card Grid */}
            {filteredTypes.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                  {activeTab === 'archived' ? (
                    <Archive className="w-7 h-7" />
                  ) : (
                    <Calendar className="w-7 h-7" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {searchQuery
                    ? `No leave categories match "${searchQuery}"`
                    : activeTab === 'archived'
                    ? 'Archive Bucket Is Empty'
                    : 'No active leave categories configured'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try searching with a different category name, code, or clear filters.'
                    : activeTab === 'archived'
                    ? 'There are currently no archived or deactivated leave categories in the system.'
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
                  emptyMessage={activeTab === 'archived' ? 'No archived leave types found.' : 'No leave types found matching filters.'}
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
                          !type.isArchived && type.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', !type.isArchived && type.isActive ? 'bg-emerald-500' : 'bg-amber-500')} />
                        <span>{!type.isArchived && type.isActive ? 'Active' : 'Archived'}</span>
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
                        <div className="flex items-center gap-1.5">
                          {activeTab === 'active' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(type)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
                                title="Edit Leave Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setArchiveTarget(type)}
                                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
                                title="Move to Archive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setRevertTarget(type)}
                                className="p-1.5 px-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                                title="Revert to Active Policies"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Revert</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPermanentDeleteTarget(type)}
                                className="p-1.5 px-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                                title="Permanently Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* 6. Create / Edit Modal */}
      <LeaveTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaveType={selectedLeaveType}
      />

      {/* 7. Confirm Dialog: Move Active Category to Archive */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Leave Category?"
        message={`Are you sure you want to move '${archiveTarget?.name}' to the Archive? It will be disabled and hidden from new leave applications, but historical records will remain preserved.`}
        confirmText={isArchiving ? 'Archiving...' : 'Archive Category'}
        isDestructive={true}
        confirmVariant="danger"
        isLoading={isArchiving}
      />

      {/* 8. Confirm Dialog: Revert Archived Category to Active */}
      <ConfirmDialog
        isOpen={Boolean(revertTarget)}
        onCancel={() => setRevertTarget(null)}
        onConfirm={handleRevertConfirm}
        title="Revert Leave Category?"
        message={`Are you sure you want to restore '${revertTarget?.name}' to active policies? It will be re-enabled and employee leave balances will be synchronized immediately.`}
        confirmText={isRestoring ? 'Restoring...' : 'Revert Category'}
        isDestructive={false}
        confirmVariant="default"
        isLoading={isRestoring}
      />

      {/* 9. Confirm Dialog: Permanently Delete Category from Archive */}
      <ConfirmDialog
        isOpen={Boolean(permanentDeleteTarget)}
        onCancel={() => setPermanentDeleteTarget(null)}
        onConfirm={handlePermanentDeleteConfirm}
        title="Permanently Delete Leave Category?"
        message={`Are you sure you want to PERMANENTLY delete '${permanentDeleteTarget?.name}' (${permanentDeleteTarget?.code})? This action cannot be undone and will permanently remove this category from the database.`}
        confirmText={isPermanentDeleting ? 'Deleting Permanently...' : 'Permanently Delete'}
        isDestructive={true}
        confirmVariant="danger"
        isLoading={isPermanentDeleting}
      />
    </div>
  );
}

export default LeaveTypesPage;
