/**
 * @file ShiftsPage.jsx
 * @description Master Work Shifts & Cross-Midnight Rosters page.
 * 
 * SPECIFICATION & FEATURES:
 * - BUILD-GUIDE ID 4.4: Shifts Master & Cross-Midnight Night Shift Support
 * - 24-hour schedules with Moon indicator for overnight shifts
 * - Real-time duration calculations & active employee deletion guard
 * - CASL Protected: Can I="org.manage" a="Organization"
 */

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Users,
  Moon,
  Sun,
  Calendar,
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
  useGetShiftsQuery,
  useDeleteShiftMutation
} from '../departmentsApi.js';
import { ShiftModal } from '../components/ShiftModal.jsx';

export function ShiftsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: response, isLoading } = useGetShiftsQuery({
    type: typeFilter || undefined
  });
  const shifts = response?.data || [];

  const [deleteShift, { isLoading: isDeleting }] = useDeleteShiftMutation();

  // Summary stats
  const totalShifts = shifts.length;
  const nightShiftsCount = shifts.filter((s) => s.isCrossMidnight || s.type === 'night').length;
  const totalAssignedStaff = shifts.reduce((acc, curr) => acc + (curr.headcount || 0), 0);

  const handleCreate = () => {
    setSelectedShift(null);
    setIsModalOpen(true);
  };

  const handleEdit = (shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (shift) => {
    setFeedback({ type: '', message: '' });
    setDeleteTarget(shift);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteShift(deleteTarget._id || deleteTarget.id).unwrap();
      setDeleteTarget(null);
      setFeedback({
        type: 'success',
        message: `Shift '${deleteTarget.name}' successfully deleted.`
      });
    } catch (err) {
      setDeleteTarget(null);
      setFeedback({
        type: 'error',
        message:
          err?.data?.message ||
          err?.message ||
          `Failed to delete shift '${deleteTarget.name}'. Ensure no active staff are currently rostered to it.`
      });
    }
  };

  const columns = [
    {
      header: 'Shift Name',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              row.isCrossMidnight
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                : 'bg-slate-100 text-slate-700 dark:bg-[#1A3125] dark:text-emerald-400'
            }`}
          >
            {row.isCrossMidnight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{row.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                {row.code}
              </span>
            </div>
            <span className="text-[11px] capitalize text-slate-400 font-medium">
              {row.type} Schedule
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Timings & Window',
      accessor: 'startTime',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span>{row.startTime}</span>
            <span className="text-slate-400">→</span>
            <span>{row.endTime}</span>
            {row.isCrossMidnight && (
              <span className="px-1 py-0.2 rounded text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-sans">
                +1 Day
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Net Duration: {Math.floor((row.durationMinutes || 0) / 60)}h{' '}
            {(row.durationMinutes || 0) % 60 > 0 ? `${(row.durationMinutes || 0) % 60}m` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Grace & Break',
      accessor: 'graceMinutes',
      cell: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <div>Grace: {row.graceMinutes || 0} mins</div>
          <div className="text-slate-400 text-[11px]">Break: {row.breakMinutes || 0} mins</div>
        </div>
      )
    },
    {
      header: 'Work Days',
      accessor: 'workDays',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {row.workDays?.map((d) => (
            <span
              key={d}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {d.slice(0, 3)}
            </span>
          ))}
        </div>
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
              title="Edit Shift"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeletePrompt(row)}
              className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete Shift"
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
        title="Work Shifts & Operational Rosters"
        subtitle="Manage daily shifts, overnight cross-midnight schedules, grace periods, and weekly work days."
        actions={
          <Can I="org.manage" a="Organization">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shift</span>
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
          title="Total Shifts"
          value={totalShifts}
          icon={Clock}
          description="Operational schedules configured"
        />
        <StatCard
          title="Night / Cross-Midnight"
          value={nightShiftsCount}
          icon={Moon}
          description="Overnight attendance windows"
        />
        <StatCard
          title="Assigned Personnel"
          value={totalAssignedStaff}
          icon={Users}
          description="Total employees assigned to shifts"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Shift Type:</span>
        {[
          { label: 'All Shifts', value: '' },
          { label: 'Fixed Hours', value: 'fixed' },
          { label: 'Flexible Window', value: 'flexible' },
          { label: 'Night Shift', value: 'night' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === tab.value
                ? 'bg-[#00C471] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={shifts}
          isLoading={isLoading}
          searchPlaceholder="Search shifts by name or code..."
          searchField="name"
          emptyMessage="No shifts found. Create your first work shift to schedule employee rosters."
        />
      </div>

      {/* Create / Edit Modal */}
      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shift={selectedShift}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete Shift '${deleteTarget?.name}'?`}
        message={`Are you sure you want to delete '${deleteTarget?.name}' (${deleteTarget?.code})? This action will be blocked if active employees are currently assigned to this shift.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Shift'}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default ShiftsPage;
