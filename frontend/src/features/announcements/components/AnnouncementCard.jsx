/**
 * @file AnnouncementCard.jsx
 * @description Enterprise Announcement Card Component with Pinning, Archiving, Read Status & Engagement Tracking.
 */

import React from 'react';
import {
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Building2,
  Globe2,
  Eye,
  CheckCircle2,
  Paperclip,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { Can } from '../../../components/common/Can.jsx';
import {
  useTogglePinAnnouncementMutation,
  useRecordReadReceiptMutation
} from '../announcementsApi.js';

const PRIORITY_STYLES = {
  urgent: {
    border: 'border-rose-400 dark:border-rose-700/80',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
    label: 'Urgent'
  },
  high: {
    border: 'border-amber-300 dark:border-amber-600/70',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    label: 'High Priority'
  },
  normal: {
    border: 'border-slate-200 dark:border-[#1A3125]',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    label: 'Standard'
  },
  low: {
    border: 'border-slate-200 dark:border-[#1A3125]',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    label: 'FYI'
  }
};

export function AnnouncementCard({
  announcement,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onOpenReceipts
}) {
  const user = useSelector((state) => state.auth?.user);
  const [togglePin, { isLoading: isPinning }] = useTogglePinAnnouncementMutation();
  const [recordRead] = useRecordReadReceiptMutation();

  const isPinned = Boolean(announcement.pinned);
  const isArchived = Boolean(announcement.isArchived);
  const priorityInfo = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.normal;
  const isCompany = announcement.targetAudience === 'company';

  // Only author, HR Manager, or Super Admin can view read receipts
  const authorUserId = announcement.authorId?._id || announcement.authorId?.id || announcement.authorId;
  const currentUserId = user?._id || user?.id;
  const isAuthor = Boolean(authorUserId && currentUserId && authorUserId.toString() === currentUserId.toString());
  const isSuperAdminOrHR = user?.roles?.some((r) => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName === 'Super Admin' || roleName === 'HR Manager';
  });
  const canViewReceipts = isAuthor || isSuperAdminOrHR;

  const targetDepts = announcement.departmentIds?.length > 0
    ? announcement.departmentIds
    : announcement.departmentId
    ? [announcement.departmentId]
    : [];

  const handleCardClick = () => {
    if (!announcement.hasRead) {
      recordRead(announcement._id).catch(() => {});
    }
    if (onView) onView(announcement);
  };

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    try {
      await togglePin({ id: announcement._id, pinned: !isPinned }).unwrap();
      toast.success(isPinned ? 'Announcement unpinned' : 'Announcement pinned to notice board');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update pin status');
    }
  };

  const formattedDate = announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleDateString('en-US', {
        timeZone: 'Asia/Karachi',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  return (
    <div
      onClick={handleCardClick}
      className={`relative group bg-white dark:bg-[#111D17] rounded-3xl border ${
        isPinned
          ? 'border-amber-400 dark:border-amber-500/60 shadow-sm'
          : priorityInfo.border
      } p-5 sm:p-6 transition-all duration-200 hover:border-[#00C471]/60 shadow-xs cursor-pointer flex flex-col justify-between`}
    >
      {/* Top Tag Badges & Ribbon */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Unread Indicator Pulse */}
          {!announcement.hasRead ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs animate-pulse">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Unread</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#162820] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
              <span>Read</span>
            </span>
          )}

          {/* Pinned Ribbon Indicator */}
          {isPinned && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
              <Pin className="w-2.5 h-2.5 fill-current" />
              <span>Pinned</span>
            </span>
          )}

          {/* Target Audience Pill */}
          {isCompany ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
              <Globe2 className="w-3 h-3" />
              <span>Company</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
              <Building2 className="w-3 h-3" />
              <span>
                {targetDepts.length === 1 ? targetDepts[0].name : `${targetDepts.length} Depts`}
              </span>
            </span>
          )}

          {/* Priority Badge */}
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${priorityInfo.badge}`}
          >
            {priorityInfo.label}
          </span>

          {/* Attachments Indicator */}
          {announcement.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Paperclip className="w-3 h-3 text-emerald-500" />
              <span>{announcement.attachments.length}</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Pin/Unpin */}
          {!isArchived && (
            <Can I="announcement.pin" a="Announcement">
              <button
                type="button"
                onClick={handleTogglePin}
                disabled={isPinning}
                title={isPinned ? 'Unpin Notice' : 'Pin Notice to Top'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isPinned
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-[#162820] text-slate-400 hover:text-slate-800 dark:hover:text-white border-slate-200 dark:border-[#1A3125]'
                }`}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            </Can>
          )}

          {/* Edit */}
          {!isArchived && onEdit && (
            <Can I="announcement.edit" a="Announcement">
              <button
                type="button"
                onClick={() => onEdit(announcement)}
                title="Edit Announcement"
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#162820] text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-[#1A3125] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </Can>
          )}

          {/* Archive / Restore */}
          {isArchived ? (
            onRestore && (
              <Can I="announcement.delete" a="Announcement">
                <button
                  type="button"
                  onClick={() => onRestore(announcement)}
                  title="Restore to Active Feed"
                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </Can>
            )
          ) : (
            onArchive && (
              <Can I="announcement.delete" a="Announcement">
                <button
                  type="button"
                  onClick={() => onArchive(announcement)}
                  title="Archive Announcement"
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#162820] text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-[#1A3125] transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </Can>
            )
          )}

          {/* Delete */}
          {onDelete && (
            <Can I="announcement.delete" a="Announcement">
              <button
                type="button"
                onClick={() => onDelete(announcement)}
                title="Delete Announcement"
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#162820] text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-[#1A3125] hover:border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Can>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-2">
        <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2">
          {announcement.title}
        </h4>
        <p className="text-xs text-slate-600 dark:text-[#7E9E8F] leading-relaxed line-clamp-3">
          {announcement.content}
        </p>
      </div>

      {/* Footer Strip */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471] font-bold text-[10px] flex items-center justify-center">
            {announcement.authorId?.name ? announcement.authorId.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {announcement.authorId?.name || 'Administrator'}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            · {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {canViewReceipts && onOpenReceipts ? (
            <button
              type="button"
              onClick={() => onOpenReceipts(announcement)}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#00C471] dark:text-slate-400 dark:hover:text-[#00C471] transition-colors"
              title="Inspect reader engagement list"
            >
              <Eye className="w-3.5 h-3.5 text-[#00C471]" />
              <span className="font-semibold font-mono">{announcement.readCount || 0} reads</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono">
              <Eye className="w-3.5 h-3.5" />
              <span>{announcement.readCount || 0}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementCard;
