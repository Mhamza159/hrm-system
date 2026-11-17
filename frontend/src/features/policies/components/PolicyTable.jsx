/**
 * @file PolicyTable.jsx
 * @description Tabular Presentation for Company Policies with column constraints and row actions.
 */

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  BookOpen,
  History,
  Archive,
  Eye
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
    icon: Archive
  }
};

export const PolicyTable = ({
  policies = [],
  onView,
  onEdit,
  onSubmitApproval,
  onPublish,
  onViewHistory,
  onDelete,
  canManage = false
}) => {
  const [activeMenuId, setActiveMenuId] = useState(null);

  if (!policies || policies.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-12 text-center shadow-xs">
        <FileText className="w-12 h-12 text-slate-300 dark:text-[#1A3125] mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Policies Found</h4>
        <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-sm mx-auto">
          No corporate policies match your current search and filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[1150px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712]/50 text-slate-500 dark:text-[#7E9E8F] uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3.5 px-4 whitespace-nowrap">Policy Code & Title</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Category</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Scope</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Version</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Effective Date</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Acknowledgement</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
            {policies.map((p) => {
              const statusCfg = statusConfigs[p.status] || statusConfigs.Draft;
              const StatusIcon = statusCfg.icon;
              const isMenuOpen = activeMenuId === p._id;

              return (
                <tr
                  key={p._id}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#162820]/40 transition group cursor-pointer"
                  onClick={() => onView && onView(p)}
                >
                  {/* Code & Title */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">
                            {p.policyCode}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white block group-hover:text-[#00C471] transition truncate">
                          {p.title}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${p.categoryId?.color || '#00C471'}15`,
                        color: p.categoryId?.color || '#00C471',
                        borderColor: `${p.categoryId?.color || '#00C471'}30`
                      }}
                    >
                      {p.categoryId?.name || 'General'}
                    </span>
                  </td>

                  {/* Scope */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#162820] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#1A3125]">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{p.scope}</span>
                    </span>
                  </td>

                  {/* Version */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-[11px]">
                      v{p.version}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{p.status}</span>
                    </span>
                  </td>

                  {/* Effective Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-[#7E9E8F]">
                    {p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : 'Pending'}
                  </td>

                  {/* Acknowledgement */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {p.requiresAcknowledgement ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-[#162820] rounded-full h-1.5 overflow-hidden border border-slate-200/50 dark:border-[#1A3125]">
                          <div
                            className="bg-[#00C471] h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  ((p.stats?.totalAcknowledged || 0) /
                                    Math.max(1, p.stats?.totalRequired || 1)) *
                                    100
                                )
                              )}%`
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          {p.stats?.totalAcknowledged || 0}/{p.stats?.totalRequired || 0}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Not Mandatory</span>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1 relative">
                      <button
                        type="button"
                        onClick={() => onView && onView(p)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#00C471] hover:bg-emerald-500/10 transition"
                        title="View Policy"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : p._id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 top-9 z-40 w-44 rounded-xl bg-white dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] shadow-lg py-1.5 text-xs text-slate-700 dark:text-slate-300">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onView(p);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>View Content</span>
                                </button>
                                {onEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onEdit(p);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Edit Policy</span>
                                  </button>
                                )}
                                {onViewHistory && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onViewHistory(p);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                                  >
                                    <History className="w-3.5 h-3.5 text-purple-500" />
                                    <span>Version History</span>
                                  </button>
                                )}
                                {onSubmitApproval &&
                                  (p.status === 'Draft' || p.status === 'Rejected') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onSubmitApproval(p);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                                    >
                                      <Send className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Submit Approval</span>
                                    </button>
                                  )}
                                {onPublish && p.status === 'Approved' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onPublish(p);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Publish Now</span>
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onDelete(p);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] text-rose-500 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Archive Policy</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
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
    </div>
  );
};

export default PolicyTable;
