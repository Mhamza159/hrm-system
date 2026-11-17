/**
 * @file PolicyCard.jsx
 * @description Card View Presentation for Company Policies in Forest & Emerald Enterprise theme.
 */

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Paperclip,
  ChevronRight,
  ShieldCheck,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  BookOpen
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

export const PolicyCard = ({
  policy,
  onView,
  onEdit,
  onSubmitApproval,
  onPublish,
  onDelete,
  canManage = false
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const statusCfg = statusConfigs[policy.status] || statusConfigs.Draft;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-xs hover:border-[#00C471]/50 dark:hover:border-[#00C471]/40 transition-all flex flex-col justify-between group relative">
      {/* Top Section */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2.5">
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
            <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F] bg-slate-100 dark:bg-[#162820] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#1A3125]">
              {policy.policyCode}
            </span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              v{policy.version}
            </span>
          </div>

          <div className="relative">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{policy.status}</span>
            </span>
            {canManage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] text-slate-400 ml-1 transition"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-40 w-44 rounded-xl bg-white dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] shadow-lg py-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onView(policy);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    <span>View Policy</span>
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(policy);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-500" />
                      <span>Edit Policy</span>
                    </button>
                  )}
                  {onSubmitApproval && (policy.status === 'Draft' || policy.status === 'Rejected') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSubmitApproval(policy);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1A3125] flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-500" />
                      <span>Submit Approval</span>
                    </button>
                  )}
                  {onPublish && policy.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onPublish(policy);
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
                        setMenuOpen(false);
                        onDelete(policy);
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
          </div>
        </div>

        <div>
          <h4
            onClick={() => onView(policy)}
            className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors cursor-pointer line-clamp-1"
          >
            {policy.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 line-clamp-2 leading-relaxed">
            {policy.description || 'No description provided.'}
          </p>
        </div>

        {/* Scope and Attachment Badges */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-[#162820] px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-[#1A3125]">
            <Users className="w-3 h-3 text-slate-400" />
            <span>{policy.scope}</span>
          </span>
          {policy.fileUrl && (
            <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-[#162820] px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-[#1A3125]">
              <Paperclip className="w-3 h-3 text-emerald-500" />
              <span className="uppercase">{policy.fileType || 'Doc'}</span>
            </span>
          )}
          {policy.requiresAcknowledgement && (
            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Sign-off Required</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
        <div className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
          {policy.effectiveDate ? (
            <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
          ) : (
            <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onView(policy)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#00C471] hover:text-emerald-400 transition cursor-pointer"
        >
          <span>View Policy</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PolicyCard;

