/**
 * @file RolesListPage.jsx
 * @description Enterprise Roles Management Screen for Module M26.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.7, 26.10, 26.13)
 * - Layer: Frontend Feature Page
 * - Components: DataTable, PageHeader, StatusBadge, ConfirmDialog, Can permission wrapper
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  Lock,
  Edit2,
  Copy,
  Trash2,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useCloneRoleMutation
} from '../rolesApi.js';

export default function RolesListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');

  // Delete modal state
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

  const { data: rolesResponse, isLoading, isFetching } = useGetRolesQuery({
    page,
    limit,
    search
  });

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [cloneRole, { isLoading: isCloning }] = useCloneRoleMutation();

  const roles = rolesResponse?.data || [];
  const meta = rolesResponse?.meta || { total: 0, totalPages: 1 };

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
      // Navigate to edit cloned role directly
      if (res?.data?._id) {
        navigate(`/roles/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clone role.');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Role Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              row.isSystem
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471]'
            }`}
          >
            {row.isSystem ? <Lock className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {row.name}
              </span>
              {row.isSystem && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-2.5 h-2.5" />
                  System Core
                </span>
              )}
            </div>
            {row.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                {row.description}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'permissions',
      label: 'Permissions Count',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.permissions?.length || 0}
          </span>
          <span className="text-[11px] text-slate-400">rules</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* View / Edit Matrix Button */}
          <button
            type="button"
            onClick={() => navigate(`/roles/${row._id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14261D] transition-colors"
            title={row.isSystem ? 'View Permissions Matrix' : 'Edit Role & Matrix'}
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
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#00C471] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              title="Clone Role Template"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </Can>

          {/* Delete Role Button (Protected by 26.13) */}
          <Can I="role.manage">
            {row.isSystem ? (
              <span
                className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                title="System core roles cannot be deleted"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteModalState({ isOpen: true, role: row })}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete Custom Role"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Call-to-action */}
      <PageHeader
        title="Roles & Access Governance"
        description="Author enterprise security roles, configure CASL matrix boundaries, and monitor active assignments."
        actions={
          <Can I="role.manage">
            <button
              type="button"
              onClick={() => navigate('/roles/new')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00C471] hover:bg-[#00B065] text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </Can>
        }
      />

      {/* Roles Data Table */}
      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading || isFetching}
        searchPlaceholder="Search roles by name..."
        emptyMessage="No roles found matching query."
        pagination={{
          page,
          totalPages: meta.totalPages,
          totalRecords: meta.total,
          limit,
          onPageChange: (p) => setPage(p),
          onLimitChange: (l) => setLimit(l)
        }}
      />

      {/* Delete Confirmation Modal (26.7 & 26.13) */}
      <ConfirmDialog
        isOpen={deleteModalState.isOpen}
        title={`Delete Role: ${deleteModalState.role?.name}`}
        message={`Are you sure you want to permanently delete custom role '${deleteModalState.role?.name}'? Users assigned this role will lose its inherited capabilities.`}
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
              <div className="p-2 rounded-xl bg-emerald-50 text-[#00C471] border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clone Role
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCloneModalState({ isOpen: false, role: null, newName: '' })
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#14261D] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCloning || !cloneModalState.newName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00B065] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
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
