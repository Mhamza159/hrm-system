/**
 * @file DesignationsPage.jsx
 * @description Master Designation Hierarchy, Archival Lifecycle & Corporate Job Catalog console.
 * 
 * SPECIFICATION & FEATURES (Phase 26):
 * - BUILD-GUIDE ID 4.3: Designations & Grade Tiers Master, Archive Management & Employee Lock
 * - 7 KPI Summary Stat Cards backed by live database aggregation (`GET /designations/stats`)
 * - Interactive Analytics Section with visual grade distribution and department breakdown
 * - Dual View Switcher: High-density Table View vs. Visual Card Grid View
 * - Comprehensive multi-dimensional filtering (search, department, grade tier, status, headcount range)
 * - Dual View Tabs: Active Designations vs. Archived Designations
 * - Full suite of modals: Create/Edit, Detailed Inspection, Archive, Restore, and Permanent Delete
 * - Strict Non-Negotiable Guard: Permanent delete is locked while employees are assigned
 * - Permissions: Protected by Can I="org.manage" a="Organization"
 * - Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471)
 */

import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Users,
  Archive,
  RotateCcw,
  Eye,
  LayoutGrid,
  List,
  Building2,
  AlertOctagon,
  BarChart3
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import {
  useGetDesignationsQuery,
  useGetArchivedDesignationsQuery,
  useGetDesignationStatsQuery,
  useGetDesignationAnalyticsQuery,
  useGetDepartmentsQuery,
  useDeleteDesignationMutation
} from '../departmentsApi.js';
import { DesignationStatsCards } from '../components/DesignationStatsCards.jsx';
import { DesignationAnalyticsSection } from '../components/DesignationAnalyticsSection.jsx';
import { DesignationFilterBar } from '../components/DesignationFilterBar.jsx';
import { DesignationCardView } from '../components/DesignationCardView.jsx';
import { DesignationModal } from '../components/DesignationModal.jsx';
import { DesignationDetailModal } from '../components/DesignationDetailModal.jsx';
import { DesignationArchiveModal } from '../components/DesignationArchiveModal.jsx';
import { DesignationRestoreModal } from '../components/DesignationRestoreModal.jsx';
import { DesignationPermanentDeleteModal } from '../components/DesignationPermanentDeleteModal.jsx';
import { toast } from 'sonner';

const GRADE_BADGE_STYLES = {
  Junior: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  Mid: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60',
  Senior: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[#00C471] border-emerald-200/60 dark:border-emerald-800/60',
  Lead: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60',
  Executive: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
};

export function DesignationsPage() {
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'ARCHIVED'
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'CARD'
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [headcountFilter, setHeadcountFilter] = useState('ALL'); // 'ALL' | 'STAFFED' | 'EMPTY'
  const [archivePage, setArchivePage] = useState(1);
  const archiveLimit = 10;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedDesig, setSelectedDesig] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailDesigId, setDetailDesigId] = useState(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);

  const [isPermanentDeleteOpen, setIsPermanentDeleteOpen] = useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // Queries
  const {
    data: statsResponse,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useGetDesignationStatsQuery();
  const stats = statsResponse?.data || {};

  const {
    data: analyticsResponse,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics
  } = useGetDesignationAnalyticsQuery();
  const analytics = analyticsResponse?.data || {};

  const activeQueryParams = {
    search: search.trim() || undefined,
    departmentId: departmentFilter !== 'ALL' ? departmentFilter : undefined,
    grade: gradeFilter !== 'ALL' ? gradeFilter : undefined,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE'
  };

  const {
    data: desigResponse,
    isLoading: isDesigLoading,
    isFetching: isDesigFetching,
    refetch: refetchDesig
  } = useGetDesignationsQuery(activeQueryParams);

  const activeDesignations = useMemo(() => desigResponse?.data || [], [desigResponse?.data]);

  const {
    data: deptResponse,
    refetch: refetchDepts
  } = useGetDepartmentsQuery();
  const departmentOptions = useMemo(() => deptResponse?.data || [], [deptResponse?.data]);

  const {
    data: archivedResponse,
    isLoading: isArchivedLoading,
    isFetching: isArchivedFetching,
    refetch: refetchArchived
  } = useGetArchivedDesignationsQuery(
    {
      page: archivePage,
      limit: archiveLimit,
      search: search.trim() || undefined,
      departmentId: departmentFilter !== 'ALL' ? departmentFilter : undefined,
      grade: gradeFilter !== 'ALL' ? gradeFilter : undefined
    },
    { skip: activeTab !== 'ARCHIVED' }
  );

  const [deleteDesignation, { isLoading: isDeleting }] = useDeleteDesignationMutation();

  // Client-side filtering for headcount
  const filteredActiveDesignations = useMemo(() => {
    return activeDesignations.filter((desig) => {
      const staff = desig.headcount || 0;
      if (headcountFilter === 'STAFFED' && staff === 0) return false;
      if (headcountFilter === 'EMPTY' && staff > 0) return false;
      return true;
    });
  }, [activeDesignations, headcountFilter]);

  const handleRefresh = () => {
    refetchStats();
    refetchAnalytics();
    refetchDepts();
    if (activeTab === 'ACTIVE') {
      refetchDesig();
    } else {
      refetchArchived();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentFilter('ALL');
    setGradeFilter('ALL');
    setStatusFilter('ALL');
    setHeadcountFilter('ALL');
  };

  const handleFilterCardClick = (id) => {
    if (id === 'TOTAL') {
      setActiveTab('ACTIVE');
      handleResetFilters();
    } else if (id === 'ACTIVE') {
      setActiveTab('ACTIVE');
      setStatusFilter('ACTIVE');
    } else if (id === 'ARCHIVED') {
      setActiveTab('ARCHIVED');
      handleResetFilters();
    } else if (id === 'ASSIGNED_STAFF' || id === 'STAFFED') {
      setActiveTab('ACTIVE');
      setHeadcountFilter('STAFFED');
    } else if (id === 'EMPTY') {
      setActiveTab('ACTIVE');
      setHeadcountFilter('EMPTY');
    } else if (id === 'DEPARTMENTS') {
      setActiveTab('ACTIVE');
    }
  };

  const handleCreate = () => {
    setSelectedDesig(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (desig) => {
    setSelectedDesig(desig);
    setIsFormModalOpen(true);
  };

  const handleInspect = (desig) => {
    setDetailDesigId(desig._id);
    setIsDetailModalOpen(true);
  };

  const handleArchive = (desig) => {
    setArchiveTarget(desig);
    setIsArchiveModalOpen(true);
  };

  const handleRestore = (desig) => {
    setRestoreTarget(desig);
    setIsRestoreModalOpen(true);
  };

  const handlePermanentDelete = (desig) => {
    setPermanentDeleteTarget(desig);
    setIsPermanentDeleteOpen(true);
  };

  const confirmSoftDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDesignation(deleteTarget._id || deleteTarget.id).unwrap();
      toast.success(`Designation '${deleteTarget.title}' successfully deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to delete designation.'
      );
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-GB', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(ts);
    }
  };

  // Columns for Active Table
  const activeColumns = [
    {
      header: 'Designation Title',
      accessorKey: 'title',
      cell: (desig) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {desig.title}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {desig.description || 'No corporate description defined.'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Code',
      accessorKey: 'code',
      cell: (desig) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300 font-semibold uppercase">
          {desig.code}
        </span>
      )
    },
    {
      header: 'Department',
      accessorKey: 'departmentId',
      cell: (desig) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {desig.departmentId?.name || 'Unassigned'}
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            ({desig.departmentId?.code || '—'})
          </span>
        </div>
      )
    },
    {
      header: 'Grade Tier',
      accessorKey: 'grade',
      cell: (desig) => {
        const style = GRADE_BADGE_STYLES[desig.grade] || GRADE_BADGE_STYLES.Junior;
        return (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
            {desig.grade}
          </span>
        );
      }
    },
    {
      header: 'Staff Headcount',
      accessorKey: 'headcount',
      cell: (desig) => {
        const count = desig.headcount || 0;
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className={`font-bold ${count > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              {count}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              {count === 1 ? 'member' : 'staff'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (desig) => (
        <StatusBadge status={desig.isActive ? 'Active' : 'Inactive'} size="sm" />
      )
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (desig) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleInspect(desig)}
            title="Inspect Details & Staff"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={() => handleEdit(desig)}
              title="Edit Designation"
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleArchive(desig)}
              title="Archive Designation"
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setDeleteTarget(desig)}
              title="Delete Designation"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  // Columns for Archived Table
  const archivedColumns = [
    {
      header: 'Archived Designation',
      accessorKey: 'title',
      cell: (desig) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {desig.title}
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              Code: {desig.code}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessorKey: 'departmentId',
      cell: (desig) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {desig.departmentId?.name || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Grade Tier',
      accessorKey: 'grade',
      cell: (desig) => {
        const style = GRADE_BADGE_STYLES[desig.grade] || GRADE_BADGE_STYLES.Junior;
        return (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
            {desig.grade}
          </span>
        );
      }
    },
    {
      header: 'Preserved Staff',
      accessorKey: 'headcount',
      cell: (desig) => {
        const count = desig.headcount || 0;
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className={`font-bold ${count > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {count}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              {count === 1 ? 'member' : 'staff'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Archived Metadata',
      accessorKey: 'archivedAt',
      cell: (desig) => (
        <div className="text-[11px] space-y-0.5">
          <div className="font-mono text-slate-700 dark:text-slate-300">
            {formatTime(desig.archivedAt)}
          </div>
          <div className="text-[10px] text-slate-400">
            By: {desig.archivedByName || 'Administrator'}
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      id: 'archived-actions',
      cell: (desig) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleInspect(desig)}
            title="Inspect Archived Profile"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={() => handleRestore(desig)}
              title="Restore to Active Catalog"
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handlePermanentDelete(desig)}
              title="Permanently Purge"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  const archivedDocs = archivedResponse?.data?.docs || archivedResponse?.data?.designations || [];
  const archivedPagination = {
    page: archivedResponse?.data?.page || 1,
    limit: archiveLimit,
    total: archivedResponse?.data?.total || 0,
    totalPages: archivedResponse?.data?.totalPages || 1
  };

  const isInitialLoading = isStatsLoading || (isDesigLoading && !desigResponse);

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Job Designations & Grade Tiers"
        subtitle="Manage corporate titles, grade seniority levels, employee allocations, and archival records."
        icon={Award}
      >
        <div className="flex items-center gap-2">
          <RefreshButton
            onClick={handleRefresh}
            isFetching={isDesigFetching || isArchivedFetching}
          />

          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#00C471] hover:bg-emerald-400 text-[#061A14] shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Designation</span>
            </button>
          </Can>
        </div>
      </PageHeader>

      {/* KPI Stats Cards */}
      <DesignationStatsCards
        stats={stats}
        isLoading={isStatsLoading}
        onFilterClick={handleFilterCardClick}
      />

      {/* Interactive Visual Analytics Dashboard */}
      {showAnalytics && (
        <DesignationAnalyticsSection
          analytics={analytics}
          isLoading={isAnalyticsLoading}
        />
      )}

      {/* Tabs and View Switcher Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1A3125] pb-3">
        {/* Left: Tab Switcher (Active vs Archived) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-[#00C471] text-[#061A14] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Active Titles</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'ACTIVE'
                  ? 'bg-black/20 text-[#061A14]'
                  : 'bg-slate-200 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300'
              }`}
            >
              {stats.active || activeDesignations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVED')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ARCHIVED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived Titles</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'ARCHIVED'
                  ? 'bg-black/20 text-white'
                  : 'bg-slate-200 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300'
              }`}
            >
              {stats.archived || 0}
            </span>
          </button>
        </div>

        {/* Right: Analytics Toggle & View Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            title="Toggle Analytics Overview"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              showAnalytics
                ? 'border-emerald-300 dark:border-emerald-800 text-[#00C471] bg-emerald-500/10'
                : 'border-slate-200 dark:border-[#1A3125] text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          {activeTab === 'ACTIVE' && (
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                title="Table View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARD')}
                title="Card Grid View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CARD'
                    ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <DesignationFilterBar
        search={search}
        onSearchChange={setSearch}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        gradeFilter={gradeFilter}
        onGradeChange={setGradeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        headcountFilter={headcountFilter}
        onHeadcountFilterChange={setHeadcountFilter}
        departmentOptions={departmentOptions}
        onReset={handleResetFilters}
        showStatusFilter={activeTab === 'ACTIVE'}
      />

      {/* Active Directory: Table View vs Card View */}
      {activeTab === 'ACTIVE' && (
        <>
          {viewMode === 'TABLE' ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs overflow-hidden">
              <DataTable
                columns={activeColumns}
                data={filteredActiveDesignations}
                isLoading={isDesigLoading}
                emptyTitle="No designations found"
                emptyMessage="No corporate job titles matched your current filters."
              />
            </div>
          ) : (
            <DesignationCardView
              designations={filteredActiveDesignations}
              onInspect={handleInspect}
              onEdit={handleEdit}
              onArchive={handleArchive}
            />
          )}
        </>
      )}

      {/* Archived Directory: Data Table with Pagination */}
      {activeTab === 'ARCHIVED' && (
        <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs overflow-hidden">
          <DataTable
            columns={archivedColumns}
            data={archivedDocs}
            isLoading={isArchivedLoading}
            emptyTitle="Archive is empty"
            emptyMessage="There are currently no archived designations in cold storage."
          />

          {archivedPagination.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {archivedPagination.page} of {archivedPagination.totalPages} ({archivedPagination.total} total archived)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={archivedPagination.page <= 1 || isArchivedFetching}
                  onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#15241C] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={archivedPagination.page >= archivedPagination.totalPages || isArchivedFetching}
                  onClick={() => setArchivePage((p) => p + 1)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#15241C] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <DesignationModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedDesig(null);
        }}
        designation={selectedDesig}
        departments={departmentOptions}
      />

      {/* Deep Inspection Details Modal */}
      <DesignationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailDesigId(null);
        }}
        designationId={detailDesigId}
      />

      {/* Soft Archive Confirmation Modal */}
      <DesignationArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setArchiveTarget(null);
        }}
        designation={archiveTarget}
      />

      {/* Restore Confirmation Modal */}
      <DesignationRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setRestoreTarget(null);
        }}
        designation={restoreTarget}
      />

      {/* Permanent Purge Confirmation Modal */}
      <DesignationPermanentDeleteModal
        isOpen={isPermanentDeleteOpen}
        onClose={() => {
          setIsPermanentDeleteOpen(false);
          setPermanentDeleteTarget(null);
        }}
        designation={permanentDeleteTarget}
      />

      {/* Standard Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Designation?"
        message={`Are you sure you want to delete '${deleteTarget?.title}'? If employees are assigned, deletion will be blocked.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={confirmSoftDelete}
        onCancel={() => setDeleteTarget(null)}
        isDestructive
      />
    </div>
  );
}

export default DesignationsPage;
