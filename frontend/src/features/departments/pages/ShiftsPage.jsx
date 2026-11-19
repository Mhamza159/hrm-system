/**
 * @file ShiftsPage.jsx
 * @description Master Work Shifts & Cross-Midnight Rosters enterprise page.
 * 
 * SPECIFICATION & FEATURES:
 * - BUILD-GUIDE ID 4.4: Shifts Master & Cross-Midnight Night Shift Support
 * - 7-metric live KPI statistics header (ShiftStatsCards.jsx)
 * - Interactive visual analytics: Horizontal progress bars & SVG Donut chart (ShiftAnalyticsSection.jsx)
 * - Dual View Switcher: High-density Table View vs. Visual Card Grid View (ShiftCardView.jsx)
 * - Comprehensive multi-dimensional filtering toolbar (ShiftFilterBar.jsx)
 * - Dual View Tabs: Active Shifts vs. Archived Shifts with live counts
 * - Full suite of modals: Create/Edit (ShiftModal), Deep Inspection (ShiftDetailModal),
 *   Roster Assignment (ShiftAssignModal), Archive (ShiftArchiveModal),
 *   Restore (ShiftRestoreModal), and Permanent Delete (ShiftPermanentDeleteModal)
 * - Strict Non-Negotiable Guard: Permanent delete is locked while ≥1 employee is assigned
 * - CASL Protected: Can I="org.manage" a="Organization"
 * - Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471)
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Users,
  Moon,
  Archive,
  RotateCcw,
  Eye,
  UserPlus,
  BarChart2
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetShiftsQuery,
  useGetArchivedShiftsQuery,
  useGetShiftStatsQuery,
  useGetShiftAnalyticsQuery,
  useGetDepartmentsQuery
} from '../departmentsApi.js';

// Subcomponents
import { ShiftStatsCards } from '../components/ShiftStatsCards.jsx';
import { ShiftAnalyticsSection } from '../components/ShiftAnalyticsSection.jsx';
import { ShiftFilterBar } from '../components/ShiftFilterBar.jsx';
import { ShiftCardView } from '../components/ShiftCardView.jsx';
import { ShiftModal } from '../components/ShiftModal.jsx';
import { ShiftDetailModal } from '../components/ShiftDetailModal.jsx';
import { ShiftAssignModal } from '../components/ShiftAssignModal.jsx';
import { ShiftArchiveModal } from '../components/ShiftArchiveModal.jsx';
import { ShiftRestoreModal } from '../components/ShiftRestoreModal.jsx';
import { ShiftPermanentDeleteModal } from '../components/ShiftPermanentDeleteModal.jsx';

export function ShiftsPage() {
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'ARCHIVED'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [overnightFilter, setOvernightFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [headcountFilter, setHeadcountFilter] = useState('ALL'); // 'ALL' | 'STAFFED' | 'EMPTY'

  // Archive Pagination
  const [archivePage, setArchivePage] = useState(1);
  const archiveLimit = 10;

  // Active Shifts Pagination
  const [activePage, setActivePage] = useState(1);
  const activeLimit = 20;

  // Wrapped Filter State Handlers with Automatic Pagination Reset
  const handleSearchChange = (val) => {
    setSearch(val);
    setActivePage(1);
    setArchivePage(1);
  };

  const handleTypeChange = (val) => {
    setTypeFilter(val);
    setActivePage(1);
    setArchivePage(1);
  };

  const handleDepartmentChange = (val) => {
    setDepartmentFilter(val);
    setActivePage(1);
    setArchivePage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setActivePage(1);
  };

  const handleOvernightChange = (val) => {
    setOvernightFilter(val);
    setActivePage(1);
  };

  const handleHeadcountChange = (val) => {
    setHeadcountFilter(val);
    setActivePage(1);
  };

  // Modals state
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState(null);

  const [inspectShiftId, setInspectShiftId] = useState(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  const [assignShift, setAssignShift] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [archiveTargetShift, setArchiveTargetShift] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const [restoreTargetShift, setRestoreTargetShift] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const [deleteTargetShift, setDeleteTargetShift] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Queries
  const { data: statsResponse, isLoading: isStatsLoading } = useGetShiftStatsQuery();
  const stats = statsResponse?.data || {};

  const { data: analyticsResponse, isLoading: isAnalyticsLoading } = useGetShiftAnalyticsQuery();
  const analytics = analyticsResponse?.data || {};

  const { data: deptsResponse } = useGetDepartmentsQuery({ limit: 100 });
  const departmentOptions = deptsResponse?.data || [];

  // Active Shifts Query
  const {
    data: activeResponse,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching
  } = useGetShiftsQuery({
    search: search.trim() || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    departmentId: departmentFilter !== 'ALL' ? departmentFilter : undefined,
    isActive: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
    isCrossMidnight: overnightFilter === 'overnight' ? true : overnightFilter === 'day' ? false : undefined,
    page: activePage,
    limit: activeLimit
  });

  const activeShiftsRaw = activeResponse?.data || [];
  const activePagination = activeResponse?.meta || activeResponse?.pagination || {
    page: activePage,
    limit: activeLimit,
    total: activeShiftsRaw.length,
    totalPages: Math.ceil(activeShiftsRaw.length / activeLimit) || 1
  };

  // Client-side guard for overnight & headcount filters
  const activeShifts = useMemo(() => {
    let list = activeShiftsRaw;
    if (overnightFilter === 'overnight') {
      list = list.filter((s) => s.isCrossMidnight || s.type === 'night');
    } else if (overnightFilter === 'day') {
      list = list.filter((s) => !s.isCrossMidnight && s.type !== 'night');
    }

    if (headcountFilter === 'STAFFED') {
      list = list.filter((s) => (s.headcount || 0) > 0);
    } else if (headcountFilter === 'EMPTY') {
      list = list.filter((s) => !s.headcount || s.headcount === 0);
    }

    return list;
  }, [activeShiftsRaw, overnightFilter, headcountFilter]);

  // Archived Shifts Query
  const {
    data: archivedResponse,
    isLoading: isArchivedLoading,
    isFetching: isArchivedFetching
  } = useGetArchivedShiftsQuery(
    {
      page: archivePage,
      limit: archiveLimit,
      search: search.trim() || undefined,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      departmentId: departmentFilter !== 'ALL' ? departmentFilter : undefined
    },
    { skip: activeTab !== 'ARCHIVED' }
  );

  const archivedShifts = archivedResponse?.data || [];
  const archivedTotal = archivedResponse?.meta?.total ?? archivedShifts.length;
  const archivedPages = (archivedResponse?.meta?.totalPages ?? Math.ceil(archivedTotal / archiveLimit)) || 1;

  // KPI card click filter handler
  const handleStatCardClick = (cardId) => {
    if (cardId === 'ARCHIVED') {
      setActiveTab('ARCHIVED');
      setArchivePage(1);
    } else if (cardId === 'ACTIVE') {
      setActiveTab('ACTIVE');
      setStatusFilter('ACTIVE');
      setActivePage(1);
    } else if (cardId === 'NIGHT') {
      setActiveTab('ACTIVE');
      setOvernightFilter('overnight');
      setActivePage(1);
    } else if (cardId === 'STAFFED') {
      setActiveTab('ACTIVE');
      setHeadcountFilter('STAFFED');
      setActivePage(1);
    } else if (cardId === 'EMPTY') {
      setActiveTab('ACTIVE');
      setHeadcountFilter('EMPTY');
      setActivePage(1);
    } else if (cardId === 'TOTAL') {
      setActiveTab('ACTIVE');
      handleResetFilters();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setDepartmentFilter('ALL');
    setOvernightFilter('ALL');
    setStatusFilter('ALL');
    setHeadcountFilter('ALL');
    setActivePage(1);
    setArchivePage(1);
  };

  // Modal Triggers
  const handleOpenCreate = () => {
    setSelectedShiftForEdit(null);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenEdit = (shift) => {
    setSelectedShiftForEdit(shift);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenInspect = (shift) => {
    setInspectShiftId(shift._id || shift.id);
    setIsInspectModalOpen(true);
  };

  const handleOpenAssign = (shift) => {
    setAssignShift(shift);
    setIsAssignModalOpen(true);
  };

  const handleOpenArchive = (shift) => {
    setArchiveTargetShift(shift);
    setIsArchiveModalOpen(true);
  };

  const handleOpenRestore = (shift) => {
    setRestoreTargetShift(shift);
    setIsRestoreModalOpen(true);
  };

  const handleOpenDelete = (shift) => {
    setDeleteTargetShift(shift);
    setIsDeleteModalOpen(true);
  };

  // Format timestamps
  const formatDateTime = (ts) => {
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

  // Table Columns: Active Shifts
  const activeColumns = [
    {
      header: 'Shift Name & Code',
      accessor: 'name',
      cell: (row) => {
        const isOvernight = row.isCrossMidnight || row.type === 'night';
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${row.color || '#00C471'}15`,
                borderColor: `${row.color || '#00C471'}30`,
                color: row.color || '#00C471'
              }}
            >
              {isOvernight ? <Moon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span
                  onClick={() => handleOpenInspect(row)}
                  className="hover:text-[#00C471] cursor-pointer transition-colors"
                >
                  {row.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                  {row.code}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {row.departmentId?.name || 'All Departments'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => {
        const isOvernight = row.isCrossMidnight || row.type === 'night';
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border w-fit ${
                row.type === 'night'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60'
                  : row.type === 'flexible'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60'
              }`}
            >
              {isOvernight && <Moon className="w-3 h-3 text-indigo-400" />}
              <span className="capitalize">{row.type}</span>
            </span>
          </div>
        );
      }
    },
    {
      header: 'Operational Hours',
      accessor: 'startTime',
      cell: (row) => {
        const netHours = Math.floor(row.durationMinutes / 60);
        const netMins = row.durationMinutes % 60;
        return (
          <div>
            <div className="font-mono font-semibold text-slate-800 dark:text-slate-100 text-xs">
              {row.startTime} → {row.endTime}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{netHours}h {netMins > 0 ? `${netMins}m` : ''} net</span>
              <span>•</span>
              <span>{row.breakMinutes}m break</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Grace',
      accessor: 'graceMinutes',
      cell: (row) => (
        <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
          {row.graceMinutes}m
        </span>
      )
    },
    {
      header: 'Work Days',
      accessor: 'workDays',
      cell: (row) => {
        const days = row.workDays || [];
        const isStandard = days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday');
        return (
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {isStandard ? 'Mon – Fri' : `${days.length} days / wk`}
          </span>
        );
      }
    },
    {
      header: 'Rostered Staff',
      accessor: 'headcount',
      cell: (row) => {
        const staff = row.headcount || 0;
        const cap = row.capacity || 0;
        return (
          <button
            type="button"
            onClick={() => handleOpenAssign(row)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-100 transition-colors text-xs font-semibold cursor-pointer"
            title="Manage assigned personnel"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{staff}</span>
            {cap > 0 && <span className="text-[10px] text-slate-400 font-normal">/ {cap}</span>}
          </button>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} size="sm" />
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleOpenInspect(row)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Inspect Shift"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={() => handleOpenAssign(row)}
              className="p-1.5 text-[#00C471] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
              title="Assign Staff"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 text-slate-400 hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Edit Shift"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenArchive(row)}
              className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
              title="Archive Shift"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  // Table Columns: Archived Shifts
  const archivedColumns = [
    {
      header: 'Shift Name & Code',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span onClick={() => handleOpenInspect(row)} className="hover:text-[#00C471] cursor-pointer">
                {row.name}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 font-semibold uppercase">
                {row.code}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {row.departmentId?.name || 'All Departments'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Type & Hours',
      accessor: 'type',
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
            {row.type} Schedule
          </span>
          <p className="text-[11px] text-slate-400 font-mono">
            {row.startTime} → {row.endTime}
          </p>
        </div>
      )
    },
    {
      header: 'Archived Date',
      accessor: 'archivedAt',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {formatDateTime(row.archivedAt)}
        </span>
      )
    },
    {
      header: 'Archived By',
      accessor: 'archivedBy',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.archivedBy?.name || 'System Admin'}
        </span>
      )
    },
    {
      header: 'Assigned Staff',
      accessor: 'headcount',
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            (row.headcount || 0) > 0
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>{row.headcount || 0}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenInspect(row)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Inspect Archived Shift"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <Can I="org.manage" a="Organization">
            <button
              type="button"
              onClick={() => handleOpenRestore(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200/50"
              title="Restore to Active"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenDelete(row)}
              className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Permanently Delete Shift"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Work Shifts & Rosters"
        subtitle="Configure shift timings, overnight cross-midnight rosters, grace rules, and employee assignments."
      >
        <Can I="org.manage" a="Organization">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00B065] rounded-xl transition-all shadow-sm hover:shadow-emerald-950/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shift</span>
          </button>
        </Can>
      </PageHeader>

      {/* KPI Stats Header (7 Cards) */}
      <ShiftStatsCards
        stats={stats}
        isLoading={isStatsLoading}
        onFilterClick={handleStatCardClick}
        activeTab={activeTab.toLowerCase()}
      />

      {/* Visual Analytics Section (Collapsible) */}
      {showAnalytics && (
        <ShiftAnalyticsSection
          analytics={analytics}
          isLoading={isAnalyticsLoading}
        />
      )}

      {/* Tab Switcher & Secondary Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Left: Tab Switcher (Active vs Archived) */}
        <div className="inline-flex items-center p-1 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
          <button
            type="button"
            onClick={() => { setActiveTab('ACTIVE'); setActivePage(1); }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-500/10 text-[#00C471] border border-emerald-500/20 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Shifts</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#00C471] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {stats.active || activeShifts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ARCHIVED'); setArchivePage(1); }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ARCHIVED'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived Shifts</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'ARCHIVED'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {stats.archived || 0}
            </span>
          </button>
        </div>

        {/* Right: Analytics Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] transition-colors cursor-pointer ${
              showAnalytics
                ? 'text-[#00C471] border-emerald-500/30'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
            title="Toggle Visual Analytics"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <ShiftFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        departmentFilter={departmentFilter}
        onDepartmentChange={handleDepartmentChange}
        headcountFilter={headcountFilter}
        onHeadcountChange={handleHeadcountChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        overnightFilter={overnightFilter}
        onOvernightChange={handleOvernightChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        departmentOptions={departmentOptions}
        onReset={handleResetFilters}
        showStatusFilter={activeTab === 'ACTIVE'}
      />

      {/* Tab 1: Active Shifts Content */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-4">
          {viewMode === 'table' ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs overflow-hidden">
              <DataTable
                columns={activeColumns}
                data={activeShifts}
                isLoading={isActiveLoading}
                emptyTitle="No shifts registered"
                emptyMessage="No active shifts match your current search and filter settings. Click '+ Create Shift' to add one."
              />
            </div>
          ) : (
            <ShiftCardView
              shifts={activeShifts}
              onInspect={handleOpenInspect}
              onEdit={handleOpenEdit}
              onAssign={handleOpenAssign}
              onArchive={handleOpenArchive}
            />
          )}

          {/* Shared Active Shifts Pagination (Both Table & Card Grid Views) */}
          {activePagination.totalPages > 1 && (
            <div className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {activePagination.page} of {activePagination.totalPages} ({activePagination.total} shifts total)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activePagination.page <= 1 || isActiveFetching}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#15241C] disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activePagination.page >= activePagination.totalPages || isActiveFetching}
                  onClick={() => setActivePage((p) => p + 1)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#15241C] disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Archived Shifts Content */}
      {activeTab === 'ARCHIVED' && (
        <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs overflow-hidden">
          <DataTable
            columns={archivedColumns}
            data={archivedShifts}
            isLoading={isArchivedLoading}
            emptyTitle="Archive is empty"
            emptyMessage="There are currently no work shifts in cold storage."
          />

          {archivedPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {archivePage} of {archivedPages} ({archivedTotal} total archived)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={archivePage <= 1 || isArchivedFetching}
                  onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#15241C] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={archivePage >= archivedPages || isArchivedFetching}
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

      {/* Modals Suite */}
      <ShiftModal
        isOpen={isCreateEditModalOpen}
        onClose={() => setIsCreateEditModalOpen(false)}
        shift={selectedShiftForEdit}
      />

      <ShiftDetailModal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        shiftId={inspectShiftId}
        onEdit={handleOpenEdit}
        onAssign={handleOpenAssign}
      />

      <ShiftAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        shift={assignShift}
      />

      <ShiftArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        shift={archiveTargetShift}
      />

      <ShiftRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        shift={restoreTargetShift}
      />

      <ShiftPermanentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        shift={deleteTargetShift}
        onOpenAssign={handleOpenAssign}
      />
    </div>
  );
}

export default ShiftsPage;
