/**
 * @file LeaveApprovalsPage.jsx
 * @description Supervisor & HR Multi-Tier Leave Approval Queue & Comprehensive History with Delegation Support.
 * 
 * SPECIFICATION & THEME:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Rows 6.6 & 6.7)
 * - Features: Status tabs (Pending, All, Approved, Rejected, Cancelled), Live search by employee name or email,
 *             Applicant Dossier Audit, Quick Approve/Reject, Attachment Inspector, Decision Notes & Audit Trail.
 * - Theme: ELVARA Emerald Design System (100% Light & Dark Mode Compatible)
 */

import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  BarChart3,
  Search,
  Mail,
  History,
  Filter
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LeaveDecideModal } from '../components/LeaveDecideModal.jsx';
import { useGetPendingApprovalsQuery } from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';
import { openSecureFile } from '../../../utils/fileHelper.js';

const STATUS_TABS = [
  { id: 'pending', label: 'Pending Queue', icon: Clock },
  { id: 'all', label: 'All History', icon: History },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
  { id: 'cancelled', label: 'Cancelled', icon: AlertCircle }
];

const STATUS_BADGES = {
  approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    icon: CheckCircle2,
    label: 'Approved'
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    icon: Clock,
    label: 'Pending'
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    icon: XCircle,
    label: 'Rejected'
  },
  cancelled: {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: AlertCircle,
    label: 'Cancelled'
  }
};

export function LeaveApprovalsPage() {
  const user = useSelector((state) => state.auth?.user);
  const userRoles = (user?.roles || []).map((r) => (typeof r === 'string' ? r : r?.name));
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalAction, setModalAction] = useState('approve');
  const [isDecideModalOpen, setIsDecideModalOpen] = useState(false);

  // 1. Live counter for Pending queue badge
  const { data: pendingBadgeRes } = useGetPendingApprovalsQuery({ status: 'pending' });
  const pendingCount = pendingBadgeRes?.data?.length ?? 0;

  // 2. Active data query with selected status filter and search
  const {
    data: response,
    isLoading,
    isError,
    refetch
  } = useGetPendingApprovalsQuery({
    status: activeTab,
    search: searchTerm.trim() || undefined
  });
  const leavesList = response?.data || [];

  const handleOpenDecision = (leave, action = 'approve') => {
    setSelectedLeave(leave);
    setModalAction(action);
    setIsDecideModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Leave Approvals & History"
        subtitle="Manage pending employee time-off requests, multi-tier approvals, and search complete leave histories."
        badge={`${pendingCount} Pending Review`}
      />

      {/* Main Approvals Table Container */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
        {/* Top Control Bar: Status Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl shrink-0">
            {STATUS_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === 'pending' && pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white leading-none">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search & Refresh */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or code..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Refresh Queue & Records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content Table / States */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse text-xs">
            Loading leave requests and histories...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-rose-500 text-xs">
            Failed to load leave records. Please check permissions or network connection.
          </div>
        ) : leavesList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {searchTerm ? <Search className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchTerm
                ? `No leaves found matching "${searchTerm}"`
                : activeTab === 'pending'
                ? 'All caught up!'
                : `No ${activeTab} leave records found.`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? 'Try searching with a different employee name, email address, or leave type code.'
                : activeTab === 'pending'
                ? 'There are no pending leave requests requiring your review.'
                : 'No historical leave applications recorded for this status.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Applicant & Email</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Window & Duration</th>
                  <th className="py-3 px-3">Reason & Proof</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Decision / Chain</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {leavesList.map((leave) => {
                  const applicant = leave.employeeId || {};
                  const type = leave.leaveTypeId || {};
                  const startStr = leave.startDate ? leave.startDate.split('T')[0] : '—';
                  const endStr = leave.endDate ? leave.endDate.split('T')[0] : '—';

                  const badge = STATUS_BADGES[leave.status] || STATUS_BADGES.pending;
                  const StatusIcon = badge.icon;

                  // Identify active pending step and step 1 status
                  const currentStep = (leave.approvalChain || []).find((s) => s.status === 'pending');
                  const step1 = (leave.approvalChain || []).find((s) => s.step === 1);
                  const isDelegated = Boolean(currentStep?.delegatedFrom);
                  const isPending = leave.status === 'pending';

                  return (
                    <tr
                      key={leave._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Applicant & Email Column */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {applicant.avatar ? (
                              <img
                                src={applicant.avatar}
                                alt={applicant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (applicant.name || 'EM').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {applicant.name || 'Employee'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {applicant.employeeCode || '—'}
                              </span>
                              {applicant.email && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Mail className="w-3 h-3" />
                                  <span>{applicant.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {type.name || 'Leave'}
                        </span>
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          {type.code}
                        </span>
                      </td>

                      {/* Window & Days */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-600 dark:text-slate-300 block font-medium">
                          {startStr === endStr ? startStr : `${startStr} → ${endStr}`}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {leave.days} day{leave.days > 1 ? 's' : ''}
                          </span>
                          {leave.halfDay && leave.halfDay !== 'none' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                              {leave.halfDay === 'first_half' ? '1st Half' : '2nd Half'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reason & Medical Attachment */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-slate-600 dark:text-slate-300 truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                        {leave.attachmentUrl && (
                          <button
                            type="button"
                            onClick={() => openSecureFile(leave.attachmentUrl)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 cursor-pointer bg-transparent border-none p-0"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Medical Proof</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                            badge.bg
                          )}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Chain Step or Decision Record */}
                      <td className="py-3.5 px-3 text-center">
                        {isPending ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              Step {currentStep?.step || 1}: {currentStep?.approverRole || 'Approver'}
                            </span>
                            {step1?.status === 'approved' && currentStep?.step > 1 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Step 1 Approved
                              </span>
                            )}
                            {isDelegated && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                                <UserCheck className="w-2.5 h-2.5" />
                                <span>Delegated</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                            {leave.decisionBy?.name && (
                              <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px] mx-auto">
                                By {leave.decisionBy.name}
                              </div>
                            )}
                            {leave.decisionAt && (
                              <div className="text-[10px] text-slate-400">
                                {new Date(leave.decisionAt).toLocaleDateString()}
                              </div>
                            )}
                            {!leave.decisionBy?.name && !leave.decisionAt && <span>—</span>}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            !isSuperAdmin && !isHR && step1?.status === 'approved' ? (
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-not-allowed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>In HR Phase</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenDecision(leave, 'approve')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Inspect Audit & Decide"
                                >
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  <span>Audit & Decide</span>
                                </button>
                                <button
                                  onClick={() => handleOpenDecision(leave, 'reject')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Reject Leave"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )
                          ) : (
                            <button
                              onClick={() => handleOpenDecision(leave, 'approve')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Inspect Attendance & Leave Audit Dossier"
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Audit Dossier</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Decision Modal Component */}
      <LeaveDecideModal
        isOpen={isDecideModalOpen}
        onClose={() => {
          setIsDecideModalOpen(false);
          refetch();
        }}
        leave={selectedLeave}
        initialAction={modalAction}
      />
    </div>
  );
}

export default LeaveApprovalsPage;
