/**
 * @file ChangeRequestTable.jsx
 * @description Enterprise DataTable for Change Request records with deep actor presentation.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React from 'react';
import {
  User,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Paperclip
} from 'lucide-react';
import {
  getStatusBadge,
  getCategoryBadge,
  getPriorityBadge
} from './changeRequestTheme.js';
import { formatDate } from '../../../../lib/formatters.js';

export function ChangeRequestTable({
  requests = [],
  isLoading,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  onInspect,
  onApprove,
  onReject,
  onReturn,
  canApprove = true
}) {
  if (isLoading && requests.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] flex items-center justify-center mx-auto mb-3">
          <FileCheck2 className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Change Requests Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          No records match your selected filter criteria. Try adjusting your search query, status, or category.
        </p>
      </div>
    );
  }

  const renderDeltaPreview = (req) => {
    const cat = req.category;
    const requested = req.requestedValue;

    if (cat === 'bank_details') {
      return (
        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
          {requested?.bankName ? `${requested.bankName}: ` : ''}
          {requested?.iban || requested?.accountNumber || 'Bank Coordinates Update'}
        </span>
      );
    }
    if (cat === 'department') {
      return (
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
          Target Department Transfer
        </span>
      );
    }
    if (cat === 'designation') {
      return (
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
          Proposed Role / Designation Change
        </span>
      );
    }
    if (cat === 'address') {
      return (
        <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
          {requested?.city ? `${requested.city}, ` : ''}{requested?.street || 'New Address'}
        </span>
      );
    }
    if (cat === 'emergency_contact') {
      return (
        <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
          {requested?.name} ({requested?.relationship || 'Contact'})
        </span>
      );
    }
    if (typeof requested === 'string') {
      return <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">{requested}</span>;
    }
    return <span className="text-[11px] text-slate-500 font-mono">Updates to {req.field}</span>;
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0A110D] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Proposed Change</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Submitted</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
            {requests.map((req) => {
              const statusCfg = getStatusBadge(req.status);
              const categoryCfg = getCategoryBadge(req.category);
              const priorityCfg = getPriorityBadge(req.priority);
              const StatusIcon = statusCfg.icon;
              const CategoryIcon = categoryCfg.icon;

              const employee = req.employeeId || {};
              const empName = employee.name || 'Employee';
              const empCode = employee.employeeCode || '—';
              const deptName = employee.departmentId?.name || '—';
              const hasAttachments = Array.isArray(req.attachments) && req.attachments.length > 0;

              return (
                <tr
                  key={req._id}
                  className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Employee Identity Cell */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
                        {employee.avatar ? (
                          <img
                            src={employee.avatar}
                            alt={empName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {empName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          <span>{empCode}</span>
                          <span>•</span>
                          <span className="truncate">{deptName}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category Pill */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${categoryCfg.colorClass}`}
                    >
                      <CategoryIcon className="w-3 h-3 shrink-0" />
                      {categoryCfg.shortLabel}
                    </span>
                  </td>

                  {/* Proposed Change Preview */}
                  <td className="py-3 px-3 max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate">{renderDeltaPreview(req)}</div>
                      {hasAttachments && (
                        <span
                          className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title={`${req.attachments.length} attachment(s)`}
                        >
                          <Paperclip className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
                      "{req.reason}"
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priorityCfg.badgeClass}`}
                    >
                      {priorityCfg.label}
                    </span>
                  </td>

                  {/* Submitted Date & Requester */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {formatDate(req.createdAt)}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                      {req.requestedBy?.email || 'System'}
                    </div>
                  </td>

                  {/* Status Pill */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.badgeClass}`}
                    >
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Inspect Details Button */}
                      <button
                        type="button"
                        onClick={() => onInspect(req)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Inspect full request diff and timeline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>

                      {/* Pending Action Buttons (if user has approval permission) */}
                      {canApprove && (req.status === 'pending' || req.status === 'under_review') && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(req)}
                            className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
                            title="Approve & Apply"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReturn(req)}
                            className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/40 transition-colors cursor-pointer"
                            title="Return for Correction"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(req)}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/40 transition-colors cursor-pointer"
                            title="Reject Request"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startRecord}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{endRecord}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> requests
          </span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="px-3 py-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
