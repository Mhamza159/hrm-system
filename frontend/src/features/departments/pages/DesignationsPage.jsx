/**
 * @file DesignationsPage.jsx
 * @description Master Designations & Grade Tiers Management page.
 * 
 * SPECIFICATION & FEATURES:
 * - BUILD-GUIDE ID 4.3: Designations & Grade Tiers Master
 * - Filter by department & grade tier
 * - Active employee deletion guard feedback
 * - CASL Permission guarded: Can I="org.manage" a="Organization"
 */

import React, { useState } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Users,
  Building2,
  Layers,
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
  useGetDesignationsQuery,
  useGetDepartmentsQuery,
  useDeleteDesignationMutation
} from '../departmentsApi.js';
import { DesignationModal } from '../components/DesignationModal.jsx';

const GRADE_BADGE_STYLES = {
  Junior: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  Mid: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60',
  Senior: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
  Lead: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60',
  Executive: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
};

export function DesignationsPage() {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesig, setSelectedDesig] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: deptResponse } = useGetDepartmentsQuery();
  const departments = deptResponse?.data || [];

  const { data: desigResponse, isLoading } = useGetDesignationsQuery({
    departmentId: selectedDeptFilter || undefined,
    grade: selectedGradeFilter || undefined
  });
  const designations = desigResponse?.data || [];

  const [deleteDesignation, { isLoading: isDeleting }] = useDeleteDesignationMutation();

  // Stats
  const totalDesignations = designations.length;
  const executiveCount = designations.filter((d) => d.grade === 'Executive' || d.grade === 'Lead').length;
  const totalAssignedStaff = designations.reduce((acc, curr) => acc + (curr.headcount || 0), 0);

  const handleCreate = () => {
    setSelectedDesig(null);
    setIsModalOpen(true);
  };

  const handleEdit = (desig) => {
    setSelectedDesig(desig);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (desig) => {
    setFeedback({ type: '', message: '' });
    setDeleteTarget(desig);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteDesignation(deleteTarget._id || deleteTarget.id).unwrap();
      setDeleteTarget(null);
      setFeedback({
        type: 'success',
        message: `Designation '${deleteTarget.title}' successfully deleted.`
      });
    } catch (err) {
      setDeleteTarget(null);
      setFeedback({
        type: 'error',
        message:
          err?.data?.message ||
          err?.message ||
          `Failed to delete designation '${deleteTarget.title}'. Reassign active staff first.`
      });
    }
  };

  const columns = [
    {
      header: 'Job Title',
      accessor: 'title',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-[#1A3125] dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{row.title}</span>
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
      header: 'Department',
      accessor: 'departmentId',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Building2 className="w-3 h-3 text-emerald-500" />
          {row.departmentId?.name || 'Assigned Department'}
        </span>
      )
    },
    {
      header: 'Grade Tier',
      accessor: 'grade',
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            GRADE_BADGE_STYLES[row.grade] || GRADE_BADGE_STYLES.Junior
          }`}
        >
          <Layers className="w-3 h-3" />
          {row.grade}
        </span>
      )
    },
    {
      header: 'Staff Count',
      accessor: 'headcount',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
          <Users className="w-3 h-3" />
          {row.headcount || 0} staff
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
              title="Edit Designation"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeletePrompt(row)}
              className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete Designation"
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
        title="Designations & Career Ladders"
        subtitle="Manage standardized job titles, organizational grade levels, and department staff capacities."
        actions={
          <Can I="org.manage" a="Organization">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Designation</span>
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
          title="Total Designations"
          value={totalDesignations}
          icon={Award}
          description="Defined job positions"
        />
        <StatCard
          title="Lead & Executive Roles"
          value={executiveCount}
          icon={Layers}
          description="Leadership tier positions"
        />
        <StatCard
          title="Total Assigned Staff"
          value={totalAssignedStaff}
          icon={Users}
          description="Active headcount in positions"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Department:</span>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id || dept.id} value={dept._id || dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Grade Tier:</span>
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
          >
            <option value="">All Grades</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Executive">Executive</option>
          </select>
        </div>
      </div>

      {/* Designations Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={designations}
          isLoading={isLoading}
          searchPlaceholder="Search designations by title or code..."
          searchField="title"
          emptyMessage="No designations found matching the criteria."
        />
      </div>

      {/* Create / Edit Modal */}
      <DesignationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        designation={selectedDesig}
        departments={departments}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete Designation '${deleteTarget?.title}'?`}
        message={`Are you sure you want to delete '${deleteTarget?.title}' (${deleteTarget?.code})? This action will be blocked if active employees are currently assigned to this title.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Designation'}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default DesignationsPage;
