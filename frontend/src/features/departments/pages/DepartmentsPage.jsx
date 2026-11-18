/**
 * @file DepartmentsPage.jsx
 * @description Master Department Hierarchy, Archival Lifecycle & Organizational Management console.
 * 
 * SPECIFICATION & FEATURES (Phase 25):
 * - BUILD-GUIDE ID 4.1: Departments Master, Archive Management & Employee Deletion Guard
 * - 7 KPI Summary Stat Cards backed by live database aggregation (`GET /departments/stats`)
 * - Interactive Analytics Section with visual distribution and headcount charts
 * - Dual View Switcher: High-density Table View vs. Visual Card Grid View
 * - Comprehensive multi-dimensional filtering (search, division, status, staff headcount, leadership assignment)
 * - Dual View Tabs: Active Departments vs. Archived Departments
 * - Full suite of modals: Create/Edit, Detailed Inspection, Archive, Restore, and Permanent Delete
 * - Strict Non-Negotiable Guard: Permanent delete is locked while employees are assigned
 * - Permissions: Protected by Can I="org.manage" a="Organization"
 */

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Network,
  Archive,
  RotateCcw,
  Eye,
  AlertTriangle,
  LayoutGrid,
  List,
  BarChart3
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import {
  useGetDepartmentsQuery,
  useGetArchivedDepartmentsQuery,
  useGetDepartmentStatsQuery,
  useGetDepartmentAnalyticsQuery
} from '../departmentsApi.js';
import { DepartmentStatsCards } from '../components/DepartmentStatsCards.jsx';
import { DepartmentAnalyticsSection } from '../components/DepartmentAnalyticsSection.jsx';
import { DepartmentFilterBar } from '../components/DepartmentFilterBar.jsx';
import { DepartmentCardView } from '../components/DepartmentCardView.jsx';
import { DepartmentModal } from '../components/DepartmentModal.jsx';
import { DepartmentDetailModal } from '../components/DepartmentDetailModal.jsx';
import { DepartmentArchiveModal } from '../components/DepartmentArchiveModal.jsx';
import { DepartmentRestoreModal } from '../components/DepartmentRestoreModal.jsx';
import { DepartmentPermanentDeleteModal } from '../components/DepartmentPermanentDeleteModal.jsx';

export function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'CARD'
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [headcountFilter, setHeadcountFilter] = useState('ALL'); // 'ALL' | 'STAFFED' | 'EMPTY'
  const [leadershipFilter, setLeadershipFilter] = useState('ALL'); // 'ALL' | 'HEAD_ASSIGNED' | 'NO_HEAD'
  const [archivePage, setArchivePage] = useState(1);
  const archiveLimit = 10;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailDeptId, setDetailDeptId] = useState(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);

  const [isPermanentDeleteOpen, setIsPermanentDeleteOpen] = useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);

  // Queries
  const {
    data: statsResponse,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useGetDepartmentStatsQuery();
  const stats = statsResponse?.data || {};

  const {
    data: analyticsResponse,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics
  } = useGetDepartmentAnalyticsQuery();
  const analytics = analyticsResponse?.data || {};

  const activeQueryParams = {
    search: search || undefined,
    parentId:
      parentFilter !== 'ALL'
        ? parentFilter === 'TOP'
          ? 'null'
          : parentFilter
        : undefined,
    isActive: statusFilter !== 'ALL' ? statusFilter === 'ACTIVE' : undefined
  };

  const {
    data: activeResponse,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching,
    refetch: refetchActive
  } = useGetDepartmentsQuery(activeQueryParams);

  const archivedQueryParams = {
    search: search || undefined,
    page: archivePage,
    limit: archiveLimit
  };

  const {
    data: archivedResponse,
    isLoading: isArchivedLoading,
    isFetching: isArchivedFetching,
    refetch: refetchArchived
  } = useGetArchivedDepartmentsQuery(archivedQueryParams, {
    skip: activeTab !== 'ARCHIVED'
  });

  const rawActiveDepartments = activeResponse?.data || [];
  const archivedData = archivedResponse?.data || {};
  const archivedDepartments = archivedData?.docs || archivedData?.departments || [];

  // Client-side multi-filtering for Headcount & Leadership on active departments
  const displayedActiveDepartments = useMemo(() => {
    return rawActiveDepartments.filter((dept) => {
      // Headcount filter
      if (headcountFilter === 'STAFFED' && (!dept.headcount || dept.headcount <= 0)) {
        return false;
      }
      if (headcountFilter === 'EMPTY' && (dept.headcount && dept.headcount > 0)) {
        return false;
      }

      // Leadership filter
      const hasHead = Boolean(dept.headName || dept.headId);
      if (leadershipFilter === 'HEAD_ASSIGNED' && !hasHead) {
        return false;
      }
      if (leadershipFilter === 'NO_HEAD' && hasHead) {
        return false;
      }

      return true;
    });
  }, [rawActiveDepartments, headcountFilter, leadershipFilter]);

  const handleRefresh = () => {
    refetchStats();
    refetchAnalytics();
    if (activeTab === 'ACTIVE') refetchActive();
    else refetchArchived();
  };

  const handleResetFilters = () => {
    setSearch('');
    setParentFilter('ALL');
    setStatusFilter('ALL');
    setHeadcountFilter('ALL');
    setLeadershipFilter('ALL');
    setArchivePage(1);
  };

  // Quick filter shortcuts from KPI Stat Cards
  const handleStatCardClick = (cardId) => {
    switch (cardId) {
      case 'TOTAL':
        setActiveTab('ACTIVE');
        handleResetFilters();
        break;
      case 'ACTIVE':
        setActiveTab('ACTIVE');
        setStatusFilter('ACTIVE');
        break;
      case 'ARCHIVED':
        setActiveTab('ARCHIVED');
        handleResetFilters();
        break;
      case 'ASSIGNED_STAFF':
      case 'STAFFED':
        setActiveTab('ACTIVE');
        setHeadcountFilter('STAFFED');
        break;
      case 'EMPTY':
        setActiveTab('ACTIVE');
        setHeadcountFilter('EMPTY');
        break;
      case 'UNASSIGNED_HEADS':
        setActiveTab('ACTIVE');
        setLeadershipFilter('NO_HEAD');
        break;
      default:
        break;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(ts);
    }
  };

  // Top parent division options for dropdown
  const parentOptions = rawActiveDepartments.filter((d) => !d.parentId);

  // Columns for Active Departments Table
  const activeColumns = [
    {
      header: 'Department',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-[#1A3125] dark:text-emerald-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{row.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                {row.code}
              </span>
            </div>
            {row.description && (
              <p className="text-xs text-slate-400 truncate max-w-xs">{row.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Parent Division',
      accessor: 'parentId',
      cell: (row) =>
        row.parentId ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-[#15241C] dark:text-slate-300">
            <Network className="w-3 h-3 text-[#00C471]" />
            <span>{row.parentId.name || 'Parent Directorate'}</span>
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400">Top-Level Directorate</span>
        )
    },
    {
      header: 'Department Head',
      accessor: 'headName',
      cell: (row) =>
        row.headName ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00C471] dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
              {row.headName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
              {row.headName}
            </span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400">Not Assigned</span>
        )
    },
    {
      header: 'Staff Headcount',
      accessor: 'headcount',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
          <Users className="w-3 h-3" />
          <span className="tabular-nums font-mono">{row.headcount || 0}</span> members
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          label={row.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {formatTime(row.createdAt)}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setDetailDeptId(row._id || row.id);
              setIsDetailModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
            title="Inspect Department"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={() => {
                setSelectedDept(row);
                setIsFormModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
              title="Edit Department"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setArchiveTarget(row);
                setIsArchiveModalOpen(true);
              }}
              className="p-1.5 text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              title="Archive Department"
            >
              <Archive className="w-4 h-4" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  // Columns for Archived Departments Table
  const archivedColumns = [
    {
      header: 'Department',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-400 dark:bg-[#1A3125]/60 dark:text-slate-500">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>{row.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#234232]">
                {row.code}
              </span>
            </div>
            {row.description && (
              <p className="text-xs text-slate-400 truncate max-w-xs">{row.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Personnel',
      accessor: 'headcount',
      cell: (row) => {
        const count = row.headcount || 0;
        if (count > 0) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60" title="Employees still assigned — must reassign before deleting">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>{count} staff assigned (Lock)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-[#15241C] dark:text-slate-400 border border-slate-200 dark:border-[#1A3125]">
            <Users className="w-3 h-3" />
            <span>0 staff (Eligible)</span>
          </span>
        );
      }
    },
    {
      header: 'Archived Date',
      accessor: 'archivedAt',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-mono text-slate-700 dark:text-slate-300 block">
            {formatTime(row.archivedAt)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
            By {row.archivedByName || 'Administrator'}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setDetailDeptId(row._id || row.id);
              setIsDetailModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
            title="Inspect Department Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={() => {
                setRestoreTarget(row);
                setIsRestoreModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-[#00C471] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
              title="Restore Department"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPermanentDeleteTarget(row);
                setIsPermanentDeleteOpen(true);
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Permanently Delete Department"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Departments & Corporate Hierarchy"
        subtitle="Manage business units, divisional reporting lines, and organizational structure."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAnalytics((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                showAnalytics
                  ? 'border-emerald-200 dark:border-[#1A3125] text-[#00C471] bg-emerald-50/50 dark:bg-[#15241C]'
                  : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#15241C]'
              }`}
              title="Toggle Workforce Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            </button>
            <RefreshButton
              onRefresh={handleRefresh}
              isFetching={activeTab === 'ACTIVE' ? isActiveFetching : isArchivedFetching}
            />
            <Can I="org.manage" a="Organization">
              <button
                type="button"
                onClick={() => {
                  setSelectedDept(null);
                  setIsFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </Can>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <DepartmentStatsCards
        stats={stats}
        isLoading={isStatsLoading}
        onFilterClick={handleStatCardClick}
      />

      {/* Visual Analytics Section */}
      {showAnalytics && (
        <DepartmentAnalyticsSection
          analytics={analytics}
          isLoading={isAnalyticsLoading}
        />
      )}

      {/* Segmented View Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1A3125] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ACTIVE');
              handleResetFilters();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-slate-900 text-white dark:bg-[#1A3125] dark:text-[#00C471] shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Active Departments</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 dark:bg-[#234232] text-slate-200">
              {stats.active || rawActiveDepartments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ARCHIVED');
              handleResetFilters();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ARCHIVED'
                ? 'bg-slate-900 text-white dark:bg-[#1A3125] dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived Units</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 dark:bg-[#234232] text-slate-200">
              {stats.archived || 0}
            </span>
          </button>
        </div>

        {/* View Mode Switcher (Active Tab only) */}
        {activeTab === 'ACTIVE' && (
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0E1712] border border-slate-200/80 dark:border-[#1A3125] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARD')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'CARD'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Card Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <DepartmentFilterBar
        search={search}
        onSearchChange={setSearch}
        parentId={parentFilter}
        onParentChange={setParentFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        headcountFilter={headcountFilter}
        onHeadcountFilterChange={activeTab === 'ACTIVE' ? setHeadcountFilter : null}
        leadershipFilter={leadershipFilter}
        onLeadershipFilterChange={activeTab === 'ACTIVE' ? setLeadershipFilter : null}
        parentOptions={parentOptions}
        onReset={handleResetFilters}
        showStatusFilter={activeTab === 'ACTIVE'}
      />

      {/* Main Content Area */}
      {activeTab === 'ACTIVE' ? (
        isActiveLoading && !activeResponse ? (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs">
            <ScreenSkeleton variant="table" />
          </div>
        ) : viewMode === 'TABLE' ? (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs">
            <DataTable
              columns={activeColumns}
              data={displayedActiveDepartments}
              isLoading={isActiveLoading}
              searchPlaceholder="Filter current view..."
              searchField="name"
              emptyMessage="No active departments found matching your criteria."
            />
          </div>
        ) : (
          <DepartmentCardView
            departments={displayedActiveDepartments}
            onInspect={(id) => {
              setDetailDeptId(id);
              setIsDetailModalOpen(true);
            }}
            onEdit={(dept) => {
              setSelectedDept(dept);
              setIsFormModalOpen(true);
            }}
            onArchive={(dept) => {
              setArchiveTarget(dept);
              setIsArchiveModalOpen(true);
            }}
          />
        )
      ) : isArchivedLoading && !archivedResponse ? (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs">
          <ScreenSkeleton variant="table" />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs">
          <DataTable
            columns={archivedColumns}
            data={archivedDepartments}
            isLoading={isArchivedLoading}
            searchPlaceholder="Filter archived view..."
            searchField="name"
            emptyMessage="No archived departments found. Inactive or retired units will appear here."
          />
        </div>
      )}

      {/* Suite of Modals */}
      <DepartmentModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        department={selectedDept}
        allDepartments={rawActiveDepartments}
      />

      <DepartmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        departmentId={detailDeptId}
      />

      <DepartmentArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setArchiveTarget(null);
        }}
        department={archiveTarget}
      />

      <DepartmentRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setRestoreTarget(null);
        }}
        department={restoreTarget}
      />

      <DepartmentPermanentDeleteModal
        isOpen={isPermanentDeleteOpen}
        onClose={() => {
          setIsPermanentDeleteOpen(false);
          setPermanentDeleteTarget(null);
        }}
        department={permanentDeleteTarget}
      />
    </div>
  );
}

export default DepartmentsPage;
