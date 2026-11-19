/**
 * @file RolesListPage.jsx
 * @description Enterprise Roles & Access Governance Command Center for Module M26.
 * Features 8-KPI live analytics cards, workforce & permission SVG charts,
 * multi-dimensional filter toolbar, dual view mode (High-Density Table vs Visual Cards),
 * and complete guarded lifecycle modal suite.
 * 
 * Follows Elvara Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  Lock,
  Edit2,
  Copy,
  Trash2,
  Eye,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetRolesQuery,
  useGetRoleStatsQuery,
  useGetRoleAnalyticsQuery
} from '../rolesApi.js';
import { RoleStatsCards } from '../components/RoleStatsCards.jsx';
import { RoleAnalyticsSection } from '../components/RoleAnalyticsSection.jsx';
import { RoleFilterBar } from '../components/RoleFilterBar.jsx';
import { RoleCardView } from '../components/RoleCardView.jsx';
import { RoleDetailModal } from '../components/RoleDetailModal.jsx';
import { RoleCloneModal } from '../components/RoleCloneModal.jsx';
import { RoleDeleteModal } from '../components/RoleDeleteModal.jsx';
import { UserRoleAssignModal } from '../components/UserRoleAssignModal.jsx';
import { cn } from '../../../lib/utils.js';

export default function RolesListPage() {
  const navigate = useNavigate();

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [roleType, setRoleType] = useState('all'); // 'all' | 'system' | 'custom'
  const [status, setStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [headcount, setHeadcount] = useState('all'); // 'all' | 'staffed' | 'empty'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('roles_view_mode') || 'table';
    } catch {
      return 'table';
    }
  });

  // Active modal management
  const [detailModalState, setDetailModalState] = useState({ isOpen: false, roleId: null });
  const [cloneModalState, setCloneModalState] = useState({ isOpen: false, role: null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, role: null });
  const [assignModalState, setAssignModalState] = useState({ isOpen: false, user: null });

  // Update localStorage when viewMode changes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('roles_view_mode', mode);
    } catch {
      // Graceful fallback if storage restricted
    }
  };

  // Reset to page 1 whenever filters change
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleRoleTypeChange = (type) => {
    setRoleType(type);
    setPage(1);
  };

  const handleStatusChange = (st) => {
    setStatus(st);
    setPage(1);
  };

  const handleHeadcountChange = (hc) => {
    setHeadcount(hc);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleType('all');
    setStatus('all');
    setHeadcount('all');
    setPage(1);
  };

  // Handle KPI card click filter routing
  const handleKpiFilterClick = (cardId) => {
    setPage(1);
    switch (cardId) {
      case 'ALL':
        handleResetFilters();
        break;
      case 'ACTIVE':
        setStatus('active');
        break;
      case 'SYSTEM':
        setRoleType('system');
        break;
      case 'CUSTOM':
        setRoleType('custom');
        break;
      case 'ASSIGNED_STAFF':
        setHeadcount('staffed');
        break;
      default:
        break;
    }
  };

  // Queries
  const { data: statsResponse, isLoading: isLoadingStats } = useGetRoleStatsQuery();
  const { data: analyticsResponse, isLoading: isLoadingAnalytics } = useGetRoleAnalyticsQuery();

  const queryParams = useMemo(() => {
    const params = { page, limit };
    if (search.trim()) params.search = search.trim();
    if (roleType !== 'all') params.type = roleType;
    if (status !== 'all') params.status = status;
    if (headcount !== 'all') params.headcount = headcount;
    return params;
  }, [page, limit, search, roleType, status, headcount]);

  const {
    data: rolesResponse,
    isLoading: isLoadingRoles
  } = useGetRolesQuery(queryParams);

  const roles = rolesResponse?.data || [];
  const meta = rolesResponse?.meta || { total: 0, totalPages: 1 };
  const statsData = statsResponse?.data || {};
  const analyticsData = analyticsResponse?.data || {};

  const getAvatarBg = (index) => {
    const colors = [
      'bg-emerald-600 text-white',
      'bg-indigo-600 text-white',
      'bg-amber-600 text-white',
      'bg-teal-600 text-white',
      'bg-purple-600 text-white'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Roles & Access Governance"
        description="Enterprise RBAC and PBAC role catalog, CASL authorization policies, and active workforce access topology."
        compactClock={true}
        actions={
          <Can I="role.manage">
            <button
              type="button"
              onClick={() => navigate('/roles/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-[#049856] text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </Can>
        }
      />

      {/* 2. 8-KPI Summary Cards */}
      <RoleStatsCards
        stats={statsData}
        isLoading={isLoadingStats}
        onFilterClick={handleKpiFilterClick}
        activeFilter={
          roleType === 'system'
            ? 'SYSTEM'
            : roleType === 'custom'
            ? 'CUSTOM'
            : status === 'active'
            ? 'ACTIVE'
            : headcount === 'staffed'
            ? 'ASSIGNED_STAFF'
            : 'ALL'
        }
      />

      {/* 3. Visual Analytics Section (Role Distribution + Permission Topology) */}
      <RoleAnalyticsSection
        analytics={analyticsData}
        isLoading={isLoadingAnalytics}
      />

      {/* 4. Multi-Dimensional Filter Toolbar */}
      <RoleFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        roleType={roleType}
        onRoleTypeChange={handleRoleTypeChange}
        status={status}
        onStatusChange={handleStatusChange}
        headcount={headcount}
        onHeadcountChange={handleHeadcountChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onResetFilters={handleResetFilters}
        totalCount={meta.total}
      />

      {/* 5. Directory Content: Dual View Switcher */}
      {viewMode === 'cards' ? (
        <RoleCardView
          roles={roles}
          isLoading={isLoadingRoles}
          onViewDetails={(role) => setDetailModalState({ isOpen: true, roleId: role._id })}
          onEditRole={(role) => navigate(`/roles/${role._id}`)}
          onCloneRole={(role) => setCloneModalState({ isOpen: true, role })}
          onDeleteRole={(role) => setDeleteModalState({ isOpen: true, role })}
        />
      ) : (
        /* High-Density Enterprise Table View */
        <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/75 dark:bg-[#061A14] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Role & Identifier</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Staff Assigned</th>
                  <th className="py-3 px-4">Permissions Footprint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/60 text-xs">
                {isLoadingRoles ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-850 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No security roles matched active criteria
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Try clearing search terms or modifying type/headcount filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  roles.map((row) => {
                    const isSystem = Boolean(row.isSystem);
                    const isActive = row.isActive !== false;
                    const isSuper = isSystem && row.name === 'Super Admin';
                    const permCount = row.permissions?.length || 0;
                    const totalCatalogue = 127;
                    const permPercent = Math.min(Math.round((permCount / totalCatalogue) * 100), 100);

                    return (
                      <tr
                        key={row._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#1A3125]/20 transition-colors"
                      >
                        {/* 1. Role Name & Slug */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'p-2 rounded-xl shrink-0',
                                isSystem
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 ring-1 ring-amber-400/20'
                                  : 'bg-emerald-50 dark:bg-[#1A3125]/60 text-brand ring-1 ring-[#00C471]/20'
                              )}
                            >
                              {isSystem ? (
                                <Crown className="w-3.5 h-3.5" />
                              ) : (
                                <Shield className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{row.name}</span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                {row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Type */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                              isSystem
                                ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300/40'
                                : 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-300/40'
                            )}
                          >
                            {isSystem ? 'System Core' : 'Custom'}
                          </span>
                        </td>

                        {/* 3. Assigned Staff */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {row.userCount > 0 ? (
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {[...Array(Math.min(row.userCount, 3))].map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'inline-flex h-5 w-5 rounded-full ring-2 ring-white dark:ring-[#111D17] items-center justify-center text-[8px] font-bold',
                                      getAvatarBg(i)
                                    )}
                                  >
                                    U{i + 1}
                                  </div>
                                ))}
                                {row.userCount > 3 && (
                                  <div className="inline-flex h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-[#111D17] items-center justify-center text-[8px] font-bold">
                                    +{row.userCount - 3}
                                  </div>
                                )}
                              </div>
                            ) : null}
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                              {row.userCount || 0}{' '}
                              <span className="text-[11px] font-normal text-slate-400">
                                {row.userCount === 1 ? 'user' : 'users'}
                              </span>
                            </span>
                          </div>
                        </td>

                        {/* 4. Permissions Footprint */}
                        <td className="py-3 px-4">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-300/40">
                              <Crown className="w-3 h-3" />
                              Unrestricted (100%)
                            </span>
                          ) : (
                            <div className="space-y-1 max-w-[160px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {permCount} / {totalCatalogue}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {permPercent}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#00C471] to-[#10B981]"
                                  style={{ width: `${permPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 5. Status */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isActive ? 'bg-[#00C471]' : 'bg-slate-400'
                              )}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailModalState({ isOpen: true, roleId: row._id })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
                              title="Deep Role Profile Inspection"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <Can I="role.manage">
                              <button
                                type="button"
                                onClick={() => navigate(`/roles/${row._id}`)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#00C471] dark:hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
                                title="Edit Role & Permissions Matrix"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Can>

                            <Can I="role.manage">
                              <button
                                type="button"
                                onClick={() => setCloneModalState({ isOpen: true, role: row })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                title="Clone Role Template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </Can>

                            <Can I="role.manage">
                              <button
                                type="button"
                                disabled={isSystem || row.userCount > 0}
                                onClick={() => setDeleteModalState({ isOpen: true, role: row })}
                                title={
                                  isSystem
                                    ? 'System core roles cannot be deleted'
                                    : row.userCount > 0
                                    ? `Cannot delete role with ${row.userCount} assigned staff`
                                    : 'Delete Custom Role'
                                }
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors',
                                  isSystem || row.userCount > 0
                                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                                    : 'text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                                )}
                              >
                                {isSystem ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </Can>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Shared Pagination Controls */}
      {!isLoadingRoles && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {(page - 1) * limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {Math.min(page * limit, meta.total)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {meta.total}
            </span>{' '}
            roles
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#061A14] text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-slate-700 dark:text-slate-300 px-1 font-semibold">
              {page} / {meta.totalPages || 1}
            </span>

            <button
              type="button"
              disabled={page >= (meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 7. Modal Suite */}
      <RoleDetailModal
        isOpen={detailModalState.isOpen}
        roleId={detailModalState.roleId}
        onClose={() => setDetailModalState({ isOpen: false, roleId: null })}
      />

      <RoleCloneModal
        isOpen={cloneModalState.isOpen}
        role={cloneModalState.role}
        onClose={() => setCloneModalState({ isOpen: false, role: null })}
        onCloned={(newRoleId) => navigate(`/roles/${newRoleId}`)}
      />

      <RoleDeleteModal
        isOpen={deleteModalState.isOpen}
        role={deleteModalState.role}
        onClose={() => setDeleteModalState({ isOpen: false, role: null })}
      />

      {assignModalState.user && (
        <UserRoleAssignModal
          isOpen={assignModalState.isOpen}
          user={assignModalState.user}
          onClose={() => setAssignModalState({ isOpen: false, user: null })}
        />
      )}
    </div>
  );
}
