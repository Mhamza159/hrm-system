/**
 * @file UsersPage.jsx
 * @description Administrative User Accounts & Access Control Management Page.
 * 
 * MODULE: M1 Authentication & Access Control (BUILD-GUIDE Section 4 · Row 1.13)
 * 
 * CORE RESPONSIBILITIES:
 * 1. Fetch system users via `useGetUsersQuery` with real-time RTK Query cache synchronization.
 * 2. Display users in an enterprise high-density `DataTable` with search and column sorting.
 * 3. Render semantic status badges (`active` in Emerald, `inactive` in Slate).
 * 4. Provide administrative account activation and deactivation toggle controls.
 * 5. Safeguard deactivation with `ConfirmDialog` warning modal to prevent accidental employee lockout.
 * 6. Invalidate sessions in real-time when deactivated (backend clears refresh token hash immediately).
 */

import React, { useState } from 'react';
import { Shield, UserCheck, UserX, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  useAdminResetPasswordMutation
} from '../../auth/authApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

export default function UsersPage() {
  // 1. Current user authorization status (Super Admin / HR Manager only)
  const { user: currentUser, isHR, isSuperAdmin } = useAuth();

  // 2. Query system users with auto-polling/tag-based invalidation
  const { data: usersResponse, isLoading, isFetching, refetch } = useGetUsersQuery();

  // 3. Status mutation hook
  const [updateUserStatus, { isLoading: isUpdating }] = useUpdateUserStatusMutation();

  // 4. Emergency password reset mutation hook (Slice 1.14)
  const [adminResetPassword, { isLoading: isResetting }] = useAdminResetPasswordMutation();

  // 5. State for deactivation confirmation modal dialog
  const [targetUser, setTargetUser] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // 6. State for emergency password reset confirmation modal dialog (Slice 1.14)
  const [resetUser, setResetUser] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Extract users list from standardized ApiResponse envelope
  const users = usersResponse?.data || [];

  /**
   * Handle user status toggle action
   * @param {Object} rowUser - Selected user record
   */
  const handleToggleClick = (rowUser) => {
    // Prevent admin from deactivating their own currently logged-in account
    if (rowUser._id === currentUser?._id) {
      toast.error('You cannot deactivate your own administrative account.');
      return;
    }

    if (rowUser.isActive) {
      // If active, open confirmation modal before revoking access
      setTargetUser(rowUser);
      setIsConfirmOpen(true);
    } else {
      // If inactive, re-activate directly with positive toast confirmation
      handleStatusChange(rowUser._id, true);
    }
  };

  /**
   * Dispatch status update to backend API
   * @param {string} userId - Target user MongoDB ObjectId
   * @param {boolean} nextStatus - Desired active flag
   */
  const handleStatusChange = async (userId, nextStatus) => {
    try {
      const response = await updateUserStatus({
        id: userId,
        isActive: nextStatus,
        reason: nextStatus
          ? 'Account re-activated by HR Administrator'
          : 'Account deactivated by HR Administrator'
      }).unwrap();

      toast.success(
        response?.message ||
          (nextStatus ? 'User account activated successfully.' : 'User account deactivated successfully.')
      );
    } catch (err) {
      const errorMsg =
        err?.data?.message ||
        err?.error ||
        'Failed to update user status. Please check permissions.';
      toast.error(errorMsg);
    } finally {
      setIsConfirmOpen(false);
      setTargetUser(null);
    }
  };

  /**
   * Execute emergency password reset for target user (Slice 1.14)
   */
  const handleAdminReset = async () => {
    if (!resetUser) return;
    try {
      const response = await adminResetPassword(resetUser._id).unwrap();
      toast.success(
        response?.message || 'Temporary password generated and sent to user email.'
      );
    } catch (err) {
      const errorMsg =
        err?.data?.message || err?.error || 'Failed to trigger emergency password reset.';
      toast.error(errorMsg);
    } finally {
      setIsResetConfirmOpen(false);
      setResetUser(null);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'email',
      label: 'User Account',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-[#00C471]">
            {row.email ? row.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 block">{row.email}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
              ID: {row._id ? String(row._id).slice(-8) : 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'roles',
      label: 'Assigned Roles',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((r, idx) => {
              const roleName = typeof r === 'string' ? r : r.name || 'Role';
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-[#15241C] border border-slate-200 dark:border-[#1E362A] text-slate-700 dark:text-slate-300"
                >
                  {roleName}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-slate-400">Employee</span>
          )}
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Account Status',
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          label={row.isActive ? 'Active' : 'Deactivated'}
        />
      )
    },
    {
      key: 'createdAt',
      label: 'Registered On',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium font-mono">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Access Control',
      className: 'text-right',
      render: (row) => {
        const isSelf = row._id === currentUser?._id;
        const canManage = isHR || isSuperAdmin;

        if (!canManage) {
          return <span className="text-[11px] text-slate-400 font-medium">Read Only</span>;
        }

        if (isSelf) {
          return (
            <span className="text-[11px] text-slate-400 italic">Current Account</span>
          );
        }

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isResetting}
              onClick={(e) => {
                e.stopPropagation();
                setResetUser(row);
                setIsResetConfirmOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer"
              title="Dispatch temporary credentials to employee email"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Reset Pass</span>
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleClick(row);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                row.isActive
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
                  : 'bg-emerald-50 text-[#00C471] border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
              }`}
            >
              {row.isActive ? (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Activate</span>
                </>
              )}
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="User Access & Security"
        description="Oversee company system users, enforce security statuses, and manage account access"
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Primary Data Grid */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchPlaceholder="Search by email or role..."
        emptyMessage="No system users found"
      />

      {/* Confirmation Dialog for Deactivation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Deactivate User Account"
        message={`Are you sure you want to deactivate ${targetUser?.email}? Their active session will be terminated immediately, and subsequent login attempts will be blocked.`}
        confirmText="Deactivate Account"
        cancelText="Keep Active"
        isDestructive={true}
        onConfirm={() => handleStatusChange(targetUser?._id, false)}
        onCancel={() => {
          setIsConfirmOpen(false);
          setTargetUser(null);
        }}
      />

      {/* Confirmation Dialog for Emergency Password Reset (Slice 1.14) */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Emergency Password Reset"
        message={`Are you sure you want to reset credentials for ${resetUser?.email}? A new temporary password will be dispatched to their email address, existing sessions will be invalidated, and they must choose a new password upon login.`}
        confirmText="Reset Password"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleAdminReset}
        onCancel={() => {
          setIsResetConfirmOpen(false);
          setResetUser(null);
        }}
      />
    </div>
  );
}
