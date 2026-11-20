/**
 * @file PolicyDetailDrawer.jsx
 * @description Slide-over inspection drawer and document reader for Company Policies.
 */

import React from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  Calendar,
  Paperclip,
  Download,
  History,
  CheckSquare,
  Edit,
  Send
} from 'lucide-react';

const statusConfigs = {
  Published: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-[#00C471]',
    border: 'border-emerald-500/30',
    icon: CheckCircle2
  },
  Draft: {
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    icon: Clock
  },
  'Pending Approval': {
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    icon: AlertTriangle
  },
  Approved: {
    bg: 'bg-teal-500/10 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
    icon: ShieldCheck
  },
  Rejected: {
    bg: 'bg-rose-500/10 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    icon: AlertTriangle
  },
  Archived: {
    bg: 'bg-slate-500/10 dark:bg-slate-900/40',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-500/30',
    icon: Clock
  }
};

export const PolicyDetailDrawer = ({
  isOpen,
  onClose,
  policy,
  canManage = false,
  canApprove = false,
  onEdit,
  onSubmitApproval,
  onApprove,
  onPublish,
  onViewHistory,
  onViewRoster,
  onAcknowledge,
  userAcknowledged = false
}) => {
  if (!isOpen || !policy) return null;

  const statusCfg = statusConfigs[policy.status] || statusConfigs.Draft;
  const StatusIcon = statusCfg.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-start justify-between bg-slate-50/50 dark:bg-[#0C1712]/50">
            <div className="space-y-1.5 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: `${policy.categoryId?.color || '#00C471'}15`,
                    color: policy.categoryId?.color || '#00C471',
                    borderColor: `${policy.categoryId?.color || '#00C471'}30`
                  }}
                >
                  {policy.categoryId?.name || 'General'}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-[#7E9E8F] bg-slate-100 dark:bg-[#162820] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#1A3125]">
                  {policy.policyCode}
                </span>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                  v{policy.version}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{policy.status}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {policy.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              {onViewHistory && (
                <button
                  type="button"
                  onClick={() => onViewHistory(policy)}
                  className="h-8 px-3 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] flex items-center gap-1.5 transition font-semibold"
                >
                  <History className="w-3.5 h-3.5 text-purple-500" />
                  <span>Version History</span>
                </button>
              )}

              {canManage && policy.requiresAcknowledgement && onViewRoster && (
                <button
                  type="button"
                  onClick={() => onViewRoster(policy)}
                  className="h-8 px-3 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] flex items-center gap-1.5 transition font-semibold"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Compliance Roster</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canManage && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(policy)}
                  className="h-8 px-3 rounded-lg border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1.5 transition font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Policy</span>
                </button>
              )}

              {canManage && (policy.status === 'Draft' || policy.status === 'Rejected') && onSubmitApproval && (
                <button
                  type="button"
                  onClick={() => onSubmitApproval(policy)}
                  className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Approval</span>
                </button>
              )}

              {canApprove && policy.status === 'Pending Approval' && onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(policy)}
                  className="h-8 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review & Approve</span>
                </button>
              )}

              {canManage && policy.status === 'Approved' && onPublish && (
                <button
                  type="button"
                  onClick={() => onPublish(policy)}
                  className="h-8 px-3.5 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Scope
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {policy.scope}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Effective Date
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  {policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'Pending'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Review Date
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {policy.reviewDate ? new Date(policy.reviewDate).toLocaleDateString() : 'Annual'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Sign-off Mandate
                </span>
                <span className={`font-semibold flex items-center gap-1 ${
                  policy.requiresAcknowledgement ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {policy.requiresAcknowledgement ? `Mandatory (${policy.gracePeriodDays || 7}d)` : 'Optional'}
                </span>
              </div>
            </div>

            {/* Description */}
            {policy.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-[#7E9E8F] uppercase tracking-wider mb-1">
                  Overview
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-[#162820]/30 p-3 rounded-xl border border-slate-200/50 dark:border-[#1A3125]">
                  {policy.description}
                </p>
              </div>
            )}

            {/* Attached File Card if any */}
            {policy.fileUrl && (
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {policy.fileName || 'Attached Documentation'}
                    </span>
                    <span className="text-[11px] text-slate-500 uppercase">
                      {policy.fileType || 'PDF'} Document
                    </span>
                  </div>
                </div>
                <a
                  href={policy.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {/* Policy Full Content Reader */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-[#7E9E8F] uppercase tracking-wider mb-2">
                Policy Document
              </h4>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {policy.content}
              </div>
            </div>

            {/* Acknowledgement Status / Action Box */}
            {policy.requiresAcknowledgement && (
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/20 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Digital Employee Acknowledgement
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">
                      {userAcknowledged
                        ? 'You have digitally signed and confirmed this policy version.'
                        : 'Review this document and confirm your acknowledgement.'}
                    </p>
                  </div>
                </div>

                {onAcknowledge && (
                  <button
                    type="button"
                    disabled={userAcknowledged}
                    onClick={() => onAcknowledge(policy)}
                    className={`h-9 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-xs ${
                      userAcknowledged
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 cursor-default'
                        : 'bg-[#00C471] hover:bg-emerald-600 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {userAcknowledged ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Sign Acknowledgement</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712]/50 flex justify-between items-center text-xs text-slate-400">
            <span>Last updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
    </div>
  );
};

export default PolicyDetailDrawer;
