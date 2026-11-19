/**
 * @file UsersPage.jsx
 * @description Enterprise User Accounts, Identity Governance & Access Security Management Center.
 * 
 * MODULE: M1 Authentication & Access Control (BUILD-GUIDE Section 4 · Row 1.13 & Section 26 · Row 26.11/26.12)
 * Strictly conforms to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import {
  useGetUsersQuery,
  useGetUserStatsQuery
} from '../usersApi.js';
import { useGetRolesQuery } from '../../roles/rolesApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

// Modular User Access Sub-Components
import { UserAccessDashboard } from '../components/user-access/UserAccessDashboard.jsx';
import { UserAccessFilterBar } from '../components/user-access/UserAccessFilterBar.jsx';
import { UserAccessTable } from '../components/user-access/UserAccessTable.jsx';
import { UserInspectModal } from '../components/user-access/UserInspectModal.jsx';
import { UserRoleAssignModal } from '../components/user-access/UserRoleAssignModal.jsx';
import { UserStatusActionModal } from '../components/user-access/UserStatusActionModal.jsx';
import { UserSecurityActionsModal } from '../components/user-access/UserSecurityActionsModal.jsx';

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin, isHR } = useAuth();

  // Permission guards
  const canManageUsers = isSuperAdmin || isHR;
  const canAssignRoles = isSuperAdmin || isHR;

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAccessStatus, setSelectedAccessStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Construct query params
  const queryParams = useMemo(() => {
    const params = {
      page,
      limit
    };
    if (search.trim()) params.search = search.trim();
    if (selectedRoleId !== 'all') params.roleId = selectedRoleId;
    if (selectedDepartmentId !== 'all') params.departmentId = selectedDepartmentId;
    if (selectedStatus !== 'all') params.status = selectedStatus;
    if (selectedAccessStatus !== 'all') params.accessStatus = selectedAccessStatus;
    return params;
  }, [page, limit, search, selectedRoleId, selectedDepartmentId, selectedStatus, selectedAccessStatus]);

  // RTK Queries
  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    refetch: refetchUsers,
    isError: isUsersError,
    error: usersError
  } = useGetUsersQuery(queryParams);

  const {
    data: statsResponse,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useGetUserStatsQuery();

  const { data: rolesResponse } = useGetRolesQuery({ limit: 100 });
  const { data: deptsResponse } = useGetDepartmentsQuery({ limit: 100 });

  const roles = Array.isArray(rolesResponse?.data) ? rolesResponse.data : [];
  const departments = Array.isArray(deptsResponse?.data) ? deptsResponse.data : [];
  const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
  const meta = usersResponse?.meta || {
    total: users.length,
    page,
    limit,
    totalPages: Math.ceil(users.length / limit) || 1
  };
  const stats = statsResponse?.data || null;

  // Modals Management State
  const [inspectUserId, setInspectUserId] = useState(null);
  const [roleAssignUser, setRoleAssignUser] = useState(null);
  const [statusActionUser, setStatusActionUser] = useState(null);
  const [statusActionNext, setStatusActionNext] = useState(true);
  const [securityActionUser, setSecurityActionUser] = useState(null);
  const [securityActionType, setSecurityActionType] = useState('unlock');

  const handleRefresh = useCallback(() => {
    refetchUsers();
    refetchStats();
  }, [refetchUsers, refetchStats]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedRoleId('all');
    setSelectedDepartmentId('all');
    setSelectedStatus('all');
    setSelectedAccessStatus('all');
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((newRoleId) => {
    setSelectedRoleId(newRoleId);
    setPage(1);
  }, []);

  const handleDepartmentChange = useCallback((newDeptId) => {
    setSelectedDepartmentId(newDeptId);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((newStatus) => {
    setSelectedStatus(newStatus);
    setPage(1);
  }, []);

  const handleAccessStatusChange = useCallback((newAccessStatus) => {
    setSelectedAccessStatus(newAccessStatus);
    setPage(1);
  }, []);

  // Modal Triggers
  const handleInspect = useCallback((targetUser) => {
    setInspectUserId(targetUser._id);
  }, []);

  const handleAssignRole = useCallback((targetUser) => {
    setRoleAssignUser(targetUser);
  }, []);

  const handleToggleStatus = useCallback((targetUser, nextStatus) => {
    setStatusActionUser(targetUser);
    const resolvedNextStatus = typeof nextStatus === 'boolean' ? nextStatus : !targetUser.isActive;
    setStatusActionNext(resolvedNextStatus);
  }, []);

  const handleUnlockAccount = useCallback((targetUser) => {
    setSecurityActionUser(targetUser);
    setSecurityActionType('unlock');
  }, []);

  const handleRevokeSessions = useCallback((targetUser) => {
    setSecurityActionUser(targetUser);
    setSecurityActionType('revoke_sessions');
  }, []);

  const handleResetPassword = useCallback((targetUser) => {
    setSecurityActionUser(targetUser);
    setSecurityActionType('reset_password');
  }, []);

  const handleResetDevice = useCallback((targetUser) => {
    setSecurityActionUser(targetUser);
    setSecurityActionType('reset_device');
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="User Accounts & Access Control"
        subtitle="Forensic identity governance, role delegations, account security, and active session monitoring."
        icon={Users}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isUsersFetching}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14261D] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh users and security posture metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUsersFetching ? 'animate-spin text-[#00C471]' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC / PBAC Enforced</span>
            </div>
          </div>
        }
      />

      {/* KPI Dashboard & Analytics */}
      <UserAccessDashboard
        stats={stats}
        isLoading={isStatsLoading}
        selectedStatus={selectedStatus}
        onSelectStatus={handleStatusChange}
        selectedAccessStatus={selectedAccessStatus}
        onSelectAccessStatus={handleAccessStatusChange}
      />

      {/* Multi-Criteria Filter Bar */}
      <UserAccessFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        roles={roles}
        selectedRoleId={selectedRoleId}
        onRoleChange={handleRoleChange}
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        onDepartmentChange={handleDepartmentChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        selectedAccessStatus={selectedAccessStatus}
        onAccessStatusChange={handleAccessStatusChange}
        onResetFilters={handleResetFilters}
      />

      {/* High-Density Users DataTable or Error Recovery View */}
      {isUsersError && users.length === 0 ? (
        <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-6 shadow-xs">
          <ErrorState
            error={usersError}
            title="Failed to Load Users"
            description="Unable to fetch user access directory from the server."
            onRetry={handleRefresh}
            isRetrying={isUsersFetching}
          />
        </div>
      ) : (
        <UserAccessTable
          users={users}
          isLoading={isUsersLoading}
          page={meta.page || page}
          limit={meta.limit || limit}
          total={meta.total || 0}
          totalPages={meta.totalPages || 1}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          currentUser={currentUser}
          canManage={canManageUsers}
          canAssignRole={canAssignRoles}
          onInspect={handleInspect}
          onAssignRole={handleAssignRole}
          onToggleStatus={handleToggleStatus}
          onUnlockAccount={handleUnlockAccount}
          onRevokeSessions={handleRevokeSessions}
          onResetPassword={handleResetPassword}
          onResetDevice={handleResetDevice}
        />
      )}

      {/* 5-Tab Forensic Inspection Modal */}
      <UserInspectModal
        userId={inspectUserId}
        isOpen={Boolean(inspectUserId)}
        onClose={() => setInspectUserId(null)}
        onAssignRole={(u) => {
          setInspectUserId(null);
          setRoleAssignUser(u);
        }}
        onUnlockAccount={(u) => {
          setInspectUserId(null);
          handleUnlockAccount(u);
        }}
        onToggleStatus={(u, next) => {
          setInspectUserId(null);
          handleToggleStatus(u, next);
        }}
      />

      {/* Guarded Role Assignment Modal */}
      <UserRoleAssignModal
        user={roleAssignUser}
        isOpen={Boolean(roleAssignUser)}
        onClose={() => setRoleAssignUser(null)}
        onSuccess={handleRefresh}
      />

      {/* Account Status Action Confirmation Modal */}
      <UserStatusActionModal
        user={statusActionUser}
        nextStatus={statusActionNext}
        isOpen={Boolean(statusActionUser)}
        onClose={() => setStatusActionUser(null)}
        onSuccess={handleRefresh}
      />

      {/* Multi-Action Security Center Modal */}
      <UserSecurityActionsModal
        user={securityActionUser}
        initialAction={securityActionType}
        isOpen={Boolean(securityActionUser)}
        onClose={() => setSecurityActionUser(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
