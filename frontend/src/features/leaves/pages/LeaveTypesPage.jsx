/**
 * @file LeaveTypesPage.jsx
 * @description Master Leave Types & Quotas Administration Screen.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 * - Layer: Frontend Feature Page
 * - Role Access: Super Admin & HR Manager have full management; Managers & Employees view.
 */

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetLeaveTypesQuery,
  useDeleteLeaveTypeMutation
} from '../leavesApi.js';
import { LeaveTypeModal } from '../components/LeaveTypeModal.jsx';

export function LeaveTypesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: response, isLoading } = useGetLeaveTypesQuery();
  const leaveTypes = response?.data || [];

  const [deleteLeaveType, { isLoading: isDeleting }] = useDeleteLeaveTypeMutation();

  // Metric aggregates
  const totalTypes = leaveTypes.length;
  const paidTypes = leaveTypes.filter((t) => t.isPaid).length;
  const requiresProofTypes = leaveTypes.filter((t) => t.requiresAttachment).length;
  const activeTypes = leaveTypes.filter((t) => t.isActive).length;

  const handleCreate = () => {
    setSelectedLeaveType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type) => {
    setSelectedLeaveType(type);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLeaveType(deleteTarget._id).unwrap();
      setFeedback({ type: 'success', message: `Leave type '${deleteTarget.name}' deactivated successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.data?.message || err?.message || 'Failed to deactivate leave type' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Leave Type',
      accessor: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{row.name}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold bg-[#1E2235] text-[#5E6AD2] border border-[#262B40] rounded">
              {row.code}
            </span>
          </div>
          {row.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      )
    },
    {
      header: 'Yearly Quota',
      accessor: (row) => (
        <span className="font-semibold text-slate-200">
          {row.daysPerYear} <span className="text-xs text-slate-400 font-normal">days</span>
        </span>
      )
    },
    {
      header: 'Type',
      accessor: (row) => (
        <span
          className={`px-2 py-0.5 text-xs rounded-full border ${
            row.isPaid
              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
              : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
          }`}
        >
          {row.isPaid ? 'Paid' : 'Unpaid'}
        </span>
      )
    },
    {
      header: 'Carry Forward',
      accessor: (row) => (
        <span className="text-sm text-slate-300">
          {row.carryForwardMax > 0 ? (
            <span>Max {row.carryForwardMax} days</span>
          ) : (
            <span className="text-slate-500">None</span>
          )}
        </span>
      )
    },
    {
      header: 'Medical Proof',
      accessor: (row) =>
        row.requiresAttachment ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-950/40 border border-blue-800/40 text-blue-400">
            <FileCheck className="w-3 h-3" />
            <span>&ge; {row.minDaysForAttachment} days</span>
          </span>
        ) : (
          <span className="text-xs text-slate-500">Not required</span>
        )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          label={row.isActive ? 'Active' : 'Disabled'}
        />
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Can I="leave.settings" a="Leave">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Edit Leave Type"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              disabled={!row.isActive}
              className={`p-1.5 rounded-lg transition-colors ${
                row.isActive
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Deactivate Leave Type"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Leave Types & Quotas"
        subtitle="Manage statutory leave allowances, carry-forward limits, and medical certificate requirements."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leaves', href: '/leaves/my' },
          { label: 'Leave Types' }
        ]}
        actions={
          <Can I="leave.settings" a="Leave">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5E6AD2] hover:bg-[#4E59BD] rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Leave Type</span>
            </button>
          </Can>
        }
      />

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
              : 'bg-red-950/30 border-red-800/40 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Categories"
          value={totalTypes}
          trend={`${activeTypes} currently active`}
        />
        <StatCard
          icon={Sparkles}
          label="Paid Quotas"
          value={paidTypes}
          trend={`${totalTypes - paidTypes} unpaid categories`}
        />
        <StatCard
          icon={FileCheck}
          label="Medical Proof Required"
          value={requiresProofTypes}
          trend="Enforces doctor certificate"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Policies"
          value={activeTypes}
          trend="Available in application forms"
        />
      </div>

      {/* Leave Types DataTable */}
      <div className="bg-[#0F111A] border border-[#1E2235] rounded-xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={leaveTypes}
          isLoading={isLoading}
          emptyMessage="No leave types configured yet. Click 'Add Leave Type' to establish standard policies."
        />
      </div>

      {/* Create / Edit Modal */}
      <LeaveTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaveType={selectedLeaveType}
      />

      {/* Confirm Deactivation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Deactivate Leave Type?"
        message={`Are you sure you want to deactivate '${deleteTarget?.name}'? It will be hidden from new leave applications, but historical balances and records will be preserved.`}
        confirmText="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
}
export default LeaveTypesPage;
