/**
 * @file ChangeRequestInspectModal.jsx
 * @description Forensic Diff Inspection Modal featuring side-by-side mutation delta,
 * supporting attachment gallery, complete actor profile card, and chronological timeline.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Briefcase,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';
import {
  getStatusBadge,
  getCategoryBadge,
  getPriorityBadge
} from './changeRequestTheme.js';
import { formatDate } from '../../../../lib/formatters.js';

export function ChangeRequestInspectModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onReturn,
  canApprove = true
}) {
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'timeline' | 'attachments'

  if (!isOpen || !request) return null;

  const employee = request.employeeId || {};
  const empName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
  const empCode = employee.employeeCode || '—';
  const deptName = employee.departmentId?.name || 'Unassigned';
  const desigTitle = employee.designationId?.title || 'Unassigned';

  const statusCfg = getStatusBadge(request.status);
  const categoryCfg = getCategoryBadge(request.category);
  const priorityCfg = getPriorityBadge(request.priority);
  const StatusIcon = statusCfg.icon;
  const CategoryIcon = categoryCfg.icon;

  const isPending = request.status === 'pending' || request.status === 'under_review';
  const attachments = Array.isArray(request.attachments) ? request.attachments : [];
  const timeline = Array.isArray(request.timeline) ? request.timeline : [];

  const renderSideBySideDiff = () => {
    const oldV = request.oldValue;
    const reqV = request.requestedValue;
    const cat = request.category;

    if (cat === 'bank_details') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Old Baseline */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Current Baseline Coordinates</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">Existing</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div><span className="text-slate-400">Bank:</span> <span className="font-semibold">{oldV?.bankName || '—'}</span></div>
              <div><span className="text-slate-400">Title:</span> <span className="font-semibold">{oldV?.accountTitle || '—'}</span></div>
              <div><span className="text-slate-400">Account #:</span> <span className="font-mono">{oldV?.accountNumber || '—'}</span></div>
              <div><span className="text-slate-400">IBAN:</span> <span className="font-mono">{oldV?.iban || '—'}</span></div>
            </div>
          </div>

          {/* Proposed Update */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>Requested New Coordinates</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00C471]/20 text-[#00C471] font-semibold">Proposed Delta</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-900 dark:text-white">
              <div><span className="text-slate-400">Bank:</span> <span className="font-semibold">{reqV?.bankName || '—'}</span></div>
              <div><span className="text-slate-400">Title:</span> <span className="font-semibold">{reqV?.accountTitle || '—'}</span></div>
              <div><span className="text-slate-400">Account #:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reqV?.accountNumber || '—'}</span></div>
              <div><span className="text-slate-400">IBAN:</span> <span className="font-mono font-bold text-[#00C471]">{reqV?.iban || '—'}</span></div>
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'address') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Address</div>
            <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div><span className="text-slate-400">Street:</span> {oldV?.street || '—'}</div>
              <div><span className="text-slate-400">City / State:</span> {oldV?.city || '—'}, {oldV?.state || '—'}</div>
              <div><span className="text-slate-400">Postal Code:</span> {oldV?.postalCode || '—'}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#00C471]">Requested Address</div>
            <div className="text-xs space-y-1 text-slate-900 dark:text-white font-medium">
              <div><span className="text-slate-400">Street:</span> {reqV?.street || '—'}</div>
              <div><span className="text-slate-400">City / State:</span> {reqV?.city || '—'}, {reqV?.state || '—'}</div>
              <div><span className="text-slate-400">Postal Code:</span> {reqV?.postalCode || '—'}</div>
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'emergency_contact') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Contact</div>
            <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div><span className="text-slate-400">Name:</span> {oldV?.name || '—'}</div>
              <div><span className="text-slate-400">Relationship:</span> {oldV?.relationship || '—'}</div>
              <div><span className="text-slate-400">Phone:</span> {oldV?.phone || '—'}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#00C471]">Requested Contact</div>
            <div className="text-xs space-y-1 text-slate-900 dark:text-white font-medium">
              <div><span className="text-slate-400">Name:</span> {reqV?.name || '—'}</div>
              <div><span className="text-slate-400">Relationship:</span> {reqV?.relationship || '—'}</div>
              <div><span className="text-slate-400">Phone:</span> {reqV?.phone || '—'}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Baseline Data</div>
          <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto p-2 rounded-xl bg-white/60 dark:bg-white/5">
            {JSON.stringify(oldV || 'No baseline captured', null, 2)}
          </pre>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#00C471]">Requested Values</div>
          <pre className="text-xs font-mono text-slate-900 dark:text-white overflow-x-auto p-2 rounded-xl bg-white/60 dark:bg-white/5">
            {JSON.stringify(reqV, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${categoryCfg.colorClass}`}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Change Request: {categoryCfg.label}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.badgeClass}`}>
                  {priorityCfg.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.badgeClass}`}>
                  <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                ID: {request._id} • Submitted {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Employee Identity Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={empName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{empName}</h4>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{empCode}</div>
                <div className="text-[10px] text-slate-400">{employee.email}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {deptName}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {desigTitle}
              </div>
            </div>
          </div>

          {/* Justification Statement */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Employee Justification & Reason
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-700 dark:text-slate-300 italic">
              "{request.reason}"
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`pb-1.5 px-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'diff'
                  ? 'border-[#00C471] text-[#00C471]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Side-by-Side Diff Comparison
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`pb-1.5 px-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'attachments'
                  ? 'border-[#00C471] text-[#00C471]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Supporting Attachments ({attachments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-1.5 px-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-[#00C471] text-[#00C471]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Lifecycle Timeline ({timeline.length})
            </button>
          </div>

          {/* Tab 1: Side by Side Diff */}
          {activeTab === 'diff' && renderSideBySideDiff()}

          {/* Tab 2: Supporting Attachments */}
          {activeTab === 'attachments' && (
            <div className="space-y-3">
              {attachments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                  No supporting documents were uploaded with this change request.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={att._id || idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {att.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Document'}
                          </div>
                        </div>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Timeline */}
          {activeTab === 'timeline' && (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#1A3125]">
              {timeline.length === 0 ? (
                <div className="text-xs text-slate-400">No historical events recorded</div>
              ) : (
                timeline.map((event, idx) => (
                  <div key={event._id || idx} className="relative flex items-start gap-3">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#00C471] ring-4 ring-white dark:ring-[#111D17]" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                          {event.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        By {event.actorName || 'System'} ({event.actorRole || 'Staff'})
                      </div>
                      {event.note && (
                        <div className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-[#0A110D] p-2 rounded-xl mt-1">
                          "{event.note}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Decision Notes Display if already resolved */}
          {request.decisionReason && (
            <div
              className={`p-4 rounded-2xl border text-xs ${
                request.status === 'approved'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : request.status === 'rejected'
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 text-rose-800 dark:text-rose-300'
                  : 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 text-purple-800 dark:text-purple-300'
              }`}
            >
              <div className="font-bold uppercase tracking-wider text-[10px] mb-1">
                Reviewer Rationale ({formatDate(request.decidedAt)})
              </div>
              <div>"{request.decisionReason}"</div>
            </div>
          )}
        </div>

        {/* Modal Footer / Reviewer Decision Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            Close Inspector
          </button>

          {canApprove && isPending && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReturn(request);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return for Revision
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReject(request);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(request);
                }}
                className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
