/**
 * @file AnnouncementCard.jsx
 * @description Enterprise Announcement Card Component with Pinning & Read Receipts.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import {
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Building2,
  Globe2,
  Clock,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { Can } from '../../../components/common/Can.jsx';
import {
  useTogglePinAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useRecordReadReceiptMutation
} from '../announcementsApi.js';
import { ReadReceiptsModal } from './ReadReceiptsModal.jsx';

const PRIORITY_STYLES = {
  urgent: {
    border: 'border-rose-300/80 dark:border-rose-800/60',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
    label: 'Urgent'
  },
  high: {
    border: 'border-amber-300/80 dark:border-amber-800/60',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    label: 'High Priority'
  },
  normal: {
    border: 'border-slate-200 dark:border-[#1A3125]',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    label: 'General'
  },
  low: {
    border: 'border-slate-200 dark:border-[#1A3125]',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    label: 'FYI'
  }
};

export function AnnouncementCard({ announcement, onEdit }) {
  const [showReceipts, setShowReceipts] = useState(false);
  const user = useSelector((state) => state.auth?.user);

  const [togglePin, { isLoading: isPinning }] = useTogglePinAnnouncementMutation();
  const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation();
  const [recordRead] = useRecordReadReceiptMutation();

  const isPinned = Boolean(announcement.pinned);
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

  const handleCardClick = () => {
    if (!announcement.hasRead) {
      recordRead(announcement._id).catch(() => {});
    }
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

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${announcement.title}"?`)) return;

    try {
      await deleteAnnouncement(announcement._id).unwrap();
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete announcement');
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
    <>
      <div
        onClick={handleCardClick}
        className={`relative group bg-white dark:bg-[#111D17] rounded-2xl border ${
          isPinned
            ? 'border-amber-300 dark:border-amber-500/50 shadow-sm'
            : priorityInfo.border
        } p-5 transition-all duration-200 hover:border-[#00C471]/50 shadow-xs cursor-pointer`}
      >
        {/* Pinned Ribbon Indicator */}
        {isPinned && (
          <div className="absolute -top-2.5 left-5 inline-flex items-center gap-1 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned Notice</span>
          </div>
        )}

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 pt-1">
          {/* Author & Target Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
              {announcement.authorId?.name ? announcement.authorId.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{announcement.authorId?.name || 'Administrator'}</span>
                {announcement.hasRead && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="You have read this" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate} (PKT)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Audience & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Target Audience Pill */}
            {isCompany ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                <Globe2 className="w-3 h-3" />
                <span>Company</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                <Building2 className="w-3 h-3" />
                <span>{announcement.departmentId?.name || 'Department'}</span>
              </span>
            )}

            {/* Priority Badge */}
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${priorityInfo.badge}`}
            >
              {priorityInfo.label}
            </span>

            {/* Pin Action Button */}
            <Can I="announcement.pin" a="Announcement">
              <button
                type="button"
                onClick={handleTogglePin}
                disabled={isPinning}
                title={isPinned ? 'Unpin Announcement' : 'Pin to Notice Board'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isPinned
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border-slate-200 dark:border-[#1A3125]'
                }`}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            </Can>

            {/* Edit Action Button */}
            <Can I="announcement.edit" a="Announcement">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(announcement);
                }}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-[#1A3125] transition-colors"
                title="Edit Announcement"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </Can>

            {/* Delete Action Button */}
            <Can I="announcement.delete" a="Announcement">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 dark:bg-[#13221B] dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-[#1A3125] hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
                title="Delete Announcement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Can>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-4">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
            {announcement.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        {/* Footer Strip: Engagement / Read Receipts */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-xs">
          {canViewReceipts ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReceipts(true);
              }}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#00C471] dark:text-slate-400 dark:hover:text-[#00C471] transition-colors cursor-pointer"
              title="View readers list"
            >
              <Eye className="w-3.5 h-3.5 text-[#00C471]" />
              <span>Seen by {announcement.readCount || 0} staff</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span>Seen by {announcement.readCount || 0} staff</span>
            </span>
          )}

          <span className="text-[11px] text-slate-400 font-medium">
            {announcement.hasRead ? 'Read' : 'Click card to mark as read'}
          </span>
        </div>
      </div>

      {/* Read Receipts Modal - Only for authorized viewers */}
      {canViewReceipts && (
        <ReadReceiptsModal
          announcementId={announcement._id}
          isOpen={showReceipts}
          onClose={() => setShowReceipts(false)}
        />
      )}
    </>
  );
}

export default AnnouncementCard;
