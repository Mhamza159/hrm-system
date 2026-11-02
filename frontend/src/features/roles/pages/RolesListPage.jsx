/**
 * @file RolesListPage.jsx
 * @description Enterprise Roles & Access Governance Screen for Module M26.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.7, 26.10, 26.13)
 * - Design System: Elvara Forest & Emerald Enterprise Craft (DESIGN.md)
 * - Fixed: Dynamic pagination counts, pluralized rule counting, Super Admin unrestricted pill,
 *   role statistics row, assigned users avatar stack, filter chip group, and delete user impact dialog.
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
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MoreVertical,
  Crown,
  RefreshCw,
  Loader2,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useCloneRoleMutation
} from '../rolesApi.js';
import { cn } from '../../../lib/utils.js';

export default function RolesListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'system' | 'custom'

  // Delete modal state with affected users count
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    role: null
  });

  // Clone modal state (Slice 26.10)
  const [cloneModalState, setCloneModalState] = useState({
    isOpen: false,
    role: null,
    newName: ''
  });

  const {
    data: rolesResponse,
    isLoading,
    isFetching,
    isError,
    refetch
  } = useGetRolesQuery({
    page,
    limit,
    search: search.trim()
  });

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [cloneRole, { isLoading: isCloning }] = useCloneRoleMutation();

  const rawRoles = rolesResponse?.data || [];
  const meta = rolesResponse?.meta || { total: rawRoles.length, totalPages: 1 };

  // Filter roles based on activeTab
  const filteredRoles = useMemo(() => {
    if (activeTab === 'system') return rawRoles.filter((r) => r.isSystem);
    if (activeTab === 'custom') return rawRoles.filter((r) => !r.isSystem);
    return rawRoles;
  }, [rawRoles, activeTab]);

  // Overall Stats for the metric cards
  const stats = useMemo(() => {
    const total = rawRoles.length;
    const system = rawRoles.filter((r) => r.isSystem).length;
    const custom = total - system;
    const totalUsers = rawRoles.reduce((sum, r) => sum + (r.userCount || 0), 0);
    return { total, system, custom, totalUsers };
  }, [rawRoles]);

  // Handler: Confirm delete role
  const handleConfirmDelete = async () => {
    if (!deleteModalState.role) return;
    try {
      await deleteRole(deleteModalState.role._id).unwrap();
      toast.success(`Role '${deleteModalState.role.name}' deleted successfully.`);
      setDeleteModalState({ isOpen: false, role: null });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete role.');
    }
  };

  // Handler: Confirm clone role (Slice 26.10)
  const handleConfirmClone = async (e) => {
    e.preventDefault();
    if (!cloneModalState.role || !cloneModalState.newName.trim()) return;

    try {
      const res = await cloneRole({
        id: cloneModalState.role._id,
        newName: cloneModalState.newName.trim()
      }).unwrap();
      toast.success(`Role '${res?.data?.name || cloneModalState.newName}' cloned successfully.`);
      setCloneModalState({ isOpen: false, role: null, newName: '' });
      if (res?.data?._id) {
        navigate(`/roles/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clone role.');
    }
  };

  // Generate deterministic avatar gradient colors for users
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
      {/* Header with Call-to-action */}
      <PageHeader
        title="Roles & Access Governance"
        description="Author enterprise security roles, configure CASL matrix boundaries, and monitor active assignments."
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

      {/* 1. Compact Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Total Roles</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {isLoading ? <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : stats.total}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Defined in catalogue</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold tracking-wider uppercase">System Core</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {isLoading ? <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : stats.system}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Immutable identity</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Custom Roles</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-brand">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {isLoading ? <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : stats.custom}
          </div>
          <div className="text-[11px] text-brand/80 mt-0.5">Custom authorization</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Users Assigned</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {isLoading ? <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : stats.totalUsers}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Active user mappings</div>
        </div>
      </div>

      {/* 2. Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Filter Chip Group */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0E1A14] border border-slate-200 dark:border-[#1A3125] text-xs font-semibold w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'all'
                ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            All Roles <span className="ml-1 text-[11px] opacity-70">({stats.total})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'system'
                ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            System Core <span className="ml-1 text-[11px] opacity-70">({stats.system})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'custom'
                ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            Custom <span className="ml-1 text-[11px] opacity-70">({stats.custom})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search roles by name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Main Data Surface */}
      {isError ? (
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Failed to load roles</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Unable to connect to the authorization catalogue. Check your connection or retry.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0E1A14] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Role Name & Description</th>
                  <th className="py-3.5 px-4">Assigned Users</th>
                  <th className="py-3.5 px-4">Permissions Rule Set</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125] text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={`skeleton-${rIdx}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 bg-slate-200 dark:bg-[#1A3125] rounded w-1/3 animate-pulse" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 w-20 bg-slate-200 dark:bg-[#1A3125] rounded-full animate-pulse" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-5 w-24 bg-slate-200 dark:bg-[#1A3125] rounded-full animate-pulse" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-[#1A3125] rounded animate-pulse" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-7 w-20 ml-auto bg-slate-200 dark:bg-[#1A3125] rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <Shield className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {search.trim() ? 'No matching roles found' : activeTab === 'custom' ? 'No custom roles yet' : 'No roles available'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          {search.trim()
                            ? `No results for "${search}". Try searching by another keyword or clear search.`
                            : activeTab === 'custom'
                            ? 'Create specific customized operational roles with targeted CASL permissions.'
                            : 'All system roles are configured.'}
                        </p>
                        {search.trim() ? (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="mt-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Clear Search
                          </button>
                        ) : activeTab === 'custom' ? (
                          <Can I="role.manage">
                            <button
                              type="button"
                              onClick={() => navigate('/roles/new')}
                              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-[#049856] text-white text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create First Custom Role</span>
                            </button>
                          </Can>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((row) => {
                    const isSuperAdmin = row.name === 'Super Admin';
                    const rulesCount = row.permissions?.length || 0;
                    const ruleLabel = rulesCount === 1 ? '1 rule' : `${rulesCount} rules`;

                    return (
                      <tr
                        key={row._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* 1. Role Name & Hierarchy */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                                isSuperAdmin
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                                  : row.isSystem
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-brand border border-emerald-200/60 dark:border-emerald-800/60'
                              )}
                            >
                              {isSuperAdmin ? (
                                <Crown className="w-4 h-4" />
                              ) : row.isSystem ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Shield className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                  {row.name}
                                </span>
                                {isSuperAdmin ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                    <Crown className="w-2.5 h-2.5" />
                                    Super Admin
                                  </span>
                                ) : row.isSystem ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    <Lock className="w-2.5 h-2.5" />
                                    System Core
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-brand border border-emerald-200 dark:border-emerald-800/60">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Custom
                                  </span>
                                )}
                              </div>
                              <p
                                className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-md line-clamp-2"
                                title={row.description || 'No description provided'}
                              >
                                {row.description || 'Standard enterprise operational role.'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Users Assigned Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {row.userCount > 0 ? (
                              <div className="flex items-center -space-x-1.5 overflow-hidden">
                                {Array.from({ length: Math.min(row.userCount, 3) }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#111D17] flex items-center justify-center text-[10px] font-bold',
                                      getAvatarBg(i)
                                    )}
                                  >
                                    U{i + 1}
                                  </div>
                                ))}
                                {row.userCount > 3 && (
                                  <div className="inline-flex h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-[#111D17] items-center justify-center text-[9px] font-bold">
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

                        {/* 3. Permissions Rule Set */}
                        <td className="py-3.5 px-4">
                          {isSuperAdmin ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 shadow-2xs"
                              title="Full unbounded superuser privileges across all modules"
                            >
                              <Crown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              Unrestricted / All access
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-xs">
                                {rulesCount}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {ruleLabel}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 4. Created Date */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                            {new Date(row.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View / Edit Matrix Button */}
                            <button
                              type="button"
                              onClick={() => navigate(`/roles/${row._id}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14261D] transition-colors cursor-pointer"
                              title={row.isSystem ? 'View Permissions Matrix (Inspect)' : 'Edit Role & Matrix'}
                              aria-label="Edit or Inspect Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Clone Role Button (Slice 26.10) */}
                            <Can I="role.manage">
                              <button
                                type="button"
                                onClick={() =>
                                  setCloneModalState({
                                    isOpen: true,
                                    role: row,
                                    newName: `${row.name} (Copy)`
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                title="Duplicate / Clone Role Template"
                                aria-label="Clone Role"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </Can>

                            {/* Delete Role Button (Protected by 26.13) */}
                            <Can I="role.manage">
                              {row.isSystem ? (
                                <span
                                  className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed inline-flex items-center"
                                  title="System roles cannot be deleted (Core protection)"
                                  aria-label="System roles cannot be deleted"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteModalState({ isOpen: true, role: row })}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  title="Delete Custom Role"
                                  aria-label="Delete Role"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {/* Table Footer with Verified Count */}
          {!isLoading && filteredRoles.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-4 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1A14]/40">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  1
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {filteredRoles.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {filteredRoles.length}
                </span>{' '}
                {filteredRoles.length === 1 ? 'role' : 'roles'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                PBAC CASL Governance Engine Active
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (26.7 & 26.13) with Affected Users Notice */}
      <ConfirmDialog
        isOpen={deleteModalState.isOpen}
        title={`Delete Role: ${deleteModalState.role?.name}`}
        message={
          deleteModalState.role?.userCount > 0
            ? `Are you sure you want to delete '${deleteModalState.role?.name}'? Warning: ${deleteModalState.role.userCount} active ${
                deleteModalState.role.userCount === 1 ? 'user is' : 'users are'
              } currently assigned this role and will lose their inherited authorizations immediately.`
            : `Are you sure you want to permanently delete custom role '${deleteModalState.role?.name}'? This action cannot be undone.`
        }
        confirmText={isDeleting ? 'Deleting...' : 'Delete Role'}
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, role: null })}
      />

      {/* Clone Role Modal Dialog (Slice 26.10) */}
      {cloneModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-brand border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clone Role Template
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Duplicate '{cloneModalState.role?.name}' permissions into a new custom role.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmClone} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Cloned Role Name
                </label>
                <input
                  type="text"
                  required
                  value={cloneModalState.newName}
                  onChange={(e) =>
                    setCloneModalState((prev) => ({
                      ...prev,
                      newName: e.target.value
                    }))
                  }
                  placeholder="e.g. Assistant HR Manager"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCloneModalState({ isOpen: false, role: null, newName: '' })
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#14261D] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCloning || !cloneModalState.newName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-[#049856] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCloning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cloning...</span>
                    </>
                  ) : (
                    <span>Confirm Clone</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
