/**
 * @file DepartmentsPage.jsx
 * @description Master Department Hierarchy & Organizational Management page.
 * 
 * SPECIFICATION & FEATURES:
 * - BUILD-GUIDE ID 4.1: Departments Master & Active Employee Deletion Guard
 * - Visual Hierarchy, Code pills, Parent badges, Headcounts
 * - Permissions: Protected by Can I="org.manage" a="Organization"
 */

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Network,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetDepartmentsQuery,
  useDeleteDepartmentMutation
} from '../departmentsApi.js';
import { DepartmentModal } from '../components/DepartmentModal.jsx';

export function DepartmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: response, isLoading, refetch } = useGetDepartmentsQuery();
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const departments = response?.data || [];

  // Compute summary stats
  const totalDepartments = departments.length;
  const topLevelCount = departments.filter((d) => !d.parentId).length;
  const totalHeadcount = departments.reduce((acc, curr) => acc + (curr.headcount || 0), 0);

  const handleCreate = () => {
    setSelectedDept(null);
    setIsModalOpen(true);
  };

  const handleEdit = (dept) => {
    setSelectedDept(dept);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (dept) => {
    setFeedback({ type: '', message: '' });
    setDeleteTarget(dept);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteDepartment(deleteTarget._id || deleteTarget.id).unwrap();
      setDeleteTarget(null);
      setFeedback({
        type: 'success',
        message: `Department '${deleteTarget.name}' successfully deleted.`
      });
    } catch (err) {
      setDeleteTarget(null);
      setFeedback({
        type: 'error',
        message:
          err?.data?.message ||
          err?.message ||
          `Failed to delete department '${deleteTarget.name}'. Ensure no active staff or sub-departments are assigned.`
      });
    }
  };

  const columns = [
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Network className="w-3 h-3 text-emerald-500" />
            {row.parentId.name || 'Parent Division'}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400">Top-Level Division</span>
        )
    },
    {
      header: 'Department Head',
      accessor: 'headName',
      cell: (row) =>
        row.headName ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00C471] dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
              {row.headName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
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
          {row.headcount || 0} members
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
      header: 'Actions',
      accessor: '_id',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Can I="org.manage" a="Organization">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
              title="Edit Department"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeletePrompt(row)}
              className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete Department"
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
      <PageHeader
        title="Departments & Corporate Hierarchy"
        subtitle="Manage company business units, parent divisions, and assigned staff headcounts."
        actions={
          <Can I="org.manage" a="Organization">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </Can>
        }
      />

      {feedback.message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Departments"
          value={totalDepartments}
          icon={Building2}
          description="Registered organizational units"
        />
        <StatCard
          title="Top-Level Divisions"
          value={topLevelCount}
          icon={Network}
          description="Independent parent directorates"
        />
        <StatCard
          title="Assigned Personnel"
          value={totalHeadcount}
          icon={Users}
          description="Active staff across all units"
        />
      </div>

      {/* Departments Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={departments}
          isLoading={isLoading}
          searchPlaceholder="Search departments by name or code..."
          searchField="name"
          emptyMessage="No departments found. Create your first department to establish corporate hierarchy."
        />
      </div>

      {/* Add / Edit Department Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        department={selectedDept}
        allDepartments={departments}
      />

      {/* Delete Confirmation Dialog with Active Staff Guard warning */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete Department '${deleteTarget?.name}'?`}
        message={`Are you sure you want to delete '${deleteTarget?.name}' (${deleteTarget?.code})? This action will fail if active employees or child departments are currently assigned.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Department'}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default DepartmentsPage;
