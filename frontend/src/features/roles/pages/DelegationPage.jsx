/**
 * @file DelegationPage.jsx
 * @description Approvals Delegation Management Screen (Slice 26.14).
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.14)
 * - Layer: Frontend Feature Page
 * - Supports temporary authority handover, active date windows, and cancellation.
 */

import React, { useState } from 'react';
import {
  CalendarRange,
  UserCheck,
  Send,
  XCircle,
  Clock,
  Shield,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { useGetUsersQuery } from '../../auth/authApi.js';
import {
  useGetDelegationsQuery,
  useCreateDelegationMutation,
  useCancelDelegationMutation
} from '../rolesApi.js';

export default function DelegationPage() {
  const { user: currentUser } = useAuth();
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersQuery();
  const { data: delegationsResponse, isLoading: isLoadingDelegations } = useGetDelegationsQuery();

  const [createDelegation, { isLoading: isCreating }] = useCreateDelegationMutation();
  const [cancelDelegation, { isLoading: isCancelling }] = useCancelDelegationMutation();

  const users = usersResponse?.data || [];
  const delegations = delegationsResponse?.data || [];

  // Filter peers (exclude self)
  const peerUsers = users.filter((u) => u._id !== currentUser?._id && u.isActive);

  // Form state
  const [toUserId, setToUserId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [selectedActions, setSelectedActions] = useState(['leave.approve']);

  const delegatableActions = [
    { action: 'leave.approve', label: 'Leave Approvals', subject: 'Leave', scope: 'department' },
    { action: 'expense.approve', label: 'Expense Approvals', subject: 'Expense', scope: 'department' },
    { action: 'attendance.approve', label: 'Attendance Overrides', subject: 'Attendance', scope: 'department' }
  ];

  const handleToggleAction = (act) => {
    setSelectedActions((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleCreateDelegation = async (e) => {
    e.preventDefault();

    if (!toUserId) {
      toast.error('Please select a colleague to delegate authority to.');
      return;
    }

    if (selectedActions.length === 0) {
      toast.error('Select at least one approval action to delegate.');
      return;
    }

    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(`${endDate}T23:59:59.999Z`).toISOString();

    const permissionsPayload = delegatableActions
      .filter((a) => selectedActions.includes(a.action))
      .map((a) => ({
        action: a.action,
        subject: a.subject,
        scope: a.scope
      }));

    try {
      await createDelegation({
        toUserId,
        startDate: startISO,
        endDate: endISO,
        permissions: permissionsPayload,
        reason: reason.trim()
      }).unwrap();

      toast.success('Approval authority delegated successfully.');
      setToUserId('');
      setReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create delegation.');
    }
  };

  const handleCancelDelegation = async (id) => {
    try {
      await cancelDelegation(id).unwrap();
      toast.success('Delegation cancelled successfully.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel delegation.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Approvals Delegation"
        description="Temporarily transfer your departmental sign-off privileges to a designated colleague during scheduled absences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delegation Creation Form Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#00C471]" />
            New Delegation Order
          </h3>

          <form onSubmit={handleCreateDelegation} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Delegate Recipient <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471]"
              >
                <option value="">Select a colleague...</option>
                {peerUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.email} ({u.roles?.map((r) => r.name || r).join(', ') || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Delegated Powers <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5">
                {delegatableActions.map((act) => {
                  const isChecked = selectedActions.includes(act.action);
                  return (
                    <label
                      key={act.action}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#14261D] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAction(act.action)}
                        className="h-3.5 w-3.5 rounded text-[#00C471] focus:ring-[#00C471]"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {act.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Annual Leave coverage"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00B065] text-white font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Delegating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Authorize Delegation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Delegations History List Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#00C471]" />
            Active & Historic Delegations
          </h3>

          {isLoadingDelegations ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
              <span className="text-xs">Loading delegation records...</span>
            </div>
          ) : delegations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No approval delegations on record.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1A3125]">
              {delegations.map((item) => {
                const isFromMe = item.fromUserId?._id === currentUser?._id;
                const isActive = item.status === 'active';
                const now = new Date();
                const isWithinWindow =
                  new Date(item.startDate) <= now && now <= new Date(item.endDate);

                return (
                  <div
                    key={item._id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isFromMe ? `Delegated to: ${item.toUserId?.email}` : `Received from: ${item.fromUserId?.email}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive && isWithinWindow
                              ? 'bg-emerald-50 text-[#00C471] border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : isActive
                              ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                          }`}
                        >
                          {isActive && isWithinWindow
                            ? 'Currently Active'
                            : isActive
                            ? 'Upcoming / Scheduled'
                            : item.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.permissions?.map((p, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300"
                          >
                            {p.action}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>
                          Window: {new Date(item.startDate).toLocaleDateString()} &rarr; {new Date(item.endDate).toLocaleDateString()}
                        </span>
                        {item.reason && <span>&bull; Reason: {item.reason}</span>}
                      </div>
                    </div>

                    {isActive && (isFromMe || currentUser?.roles?.some((r) => r.name === 'Super Admin' || r === 'Super Admin')) && (
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => handleCancelDelegation(item._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-semibold shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
