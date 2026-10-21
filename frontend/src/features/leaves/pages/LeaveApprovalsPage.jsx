/**
 * @file LeaveApprovalsPage.jsx
 * @description Supervisor & HR Multi-Tier Leave Approval Queue with Delegation Support (BUILD-GUIDE Rows 6.6 & 6.7).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Features: Multi-level stepper, Delegation indicator, Quick Approve/Reject, Attachment Inspector
 * - Theme: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2)
 */

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, FileText, ExternalLink, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LeaveDecideModal } from '../components/LeaveDecideModal.jsx';
import { useGetPendingApprovalsQuery } from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';
import { openSecureFile } from '../../../utils/fileHelper.js';

export function LeaveApprovalsPage() {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalAction, setModalAction] = useState('approve');
  const [isDecideModalOpen, setIsDecideModalOpen] = useState(false);

  const { data: response, isLoading, isError, refetch } = useGetPendingApprovalsQuery({});
  const pendingLeaves = response?.data || [];

  const handleOpenDecision = (leave, action) => {
    setSelectedLeave(leave);
    setModalAction(action);
    setIsDecideModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Leave Approvals"
        subtitle="Manage pending employee time-off requests, multi-tier approvals, and delegated substitute workflows."
        badge={`${pendingLeaves.length} Pending`}
      />

      {/* Main Approvals Table Container */}
      <section className="rounded-2xl border border-[#1E2235] bg-[#0F111A] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1E2235]">
          <div>
            <h3 className="text-sm font-semibold text-white">Pending Requests Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Evaluate leaves within your approval limit or active delegations</p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-[#5E6AD2] hover:underline font-semibold cursor-pointer"
          >
            Refresh Queue
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse">Loading approval queue...</div>
        ) : isError ? (
          <div className="py-12 text-center text-rose-400">Failed to load pending approvals.</div>
        ) : pendingLeaves.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/70 mb-3" />
            <h4 className="text-sm font-semibold text-white">All caught up!</h4>
            <p className="text-xs text-slate-400 mt-1">There are no pending leave requests requiring your review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2235] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Applicant</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Window & Duration</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3 text-center">Chain Step</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2235]/60 text-xs">
                {pendingLeaves.map((leave) => {
                  const applicant = leave.employeeId || {};
                  const type = leave.leaveTypeId || {};
                  const startStr = leave.startDate ? leave.startDate.split('T')[0] : '—';
                  const endStr = leave.endDate ? leave.endDate.split('T')[0] : '—';

                  // Identify active pending step
                  const currentStep = (leave.approvalChain || []).find((s) => s.status === 'pending');
                  const isDelegated = Boolean(currentStep?.delegatedFrom);

                  return (
                    <tr key={leave._id} className="hover:bg-[#161926]/40 transition-colors">
                      {/* Applicant Column */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-white block">{applicant.name || 'Employee'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{applicant.employeeCode || '—'}</span>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-200">{type.name || 'Leave'}</span>
                        <span className="block text-[10px] text-indigo-400 font-bold uppercase">{type.code}</span>
                      </td>

                      {/* Window & Days */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-300 block font-medium">
                          {startStr === endStr ? startStr : `${startStr} → ${endStr}`}
                        </span>
                        <span className="text-[11px] font-bold text-[#5E6AD2]">
                          {leave.days} day{leave.days > 1 ? 's' : ''}
                        </span>
                        {leave.halfDay && leave.halfDay !== 'none' && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-indigo-500/15 text-indigo-400 rounded">
                            Half Day
                          </span>
                        )}
                      </td>

                      {/* Reason & Attachment */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-slate-300 truncate" title={leave.reason}>{leave.reason}</p>
                        {leave.attachmentUrl && (
                          <button
                            type="button"
                            onClick={() => openSecureFile(leave.attachmentUrl)}
                            className="inline-flex items-center gap-1 text-[#5E6AD2] hover:underline text-[10px] mt-0.5 cursor-pointer bg-transparent border-none p-0"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Medical Proof</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>

                      {/* Step Progress & Delegation Indicator */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Step {currentStep?.step || 1}: {currentStep?.approverRole || 'Manager'}</span>
                        </span>
                        {isDelegated && (
                          <span className="block mt-1 text-[10px] text-purple-400 font-medium">
                            Delegated Authority
                          </span>
                        )}
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDecision(leave, 'approve')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenDecision(leave, 'reject')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
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

      {/* Decision Modal */}
      <LeaveDecideModal
        isOpen={isDecideModalOpen}
        onClose={() => setIsDecideModalOpen(false)}
        leave={selectedLeave}
        initialAction={modalAction}
      />
    </div>
  );
}

export default LeaveApprovalsPage;
