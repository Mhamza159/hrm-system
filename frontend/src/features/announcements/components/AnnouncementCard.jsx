/**
 * @file AnnouncementCard.jsx
 * @description Linear Dark Announcement Card Component with Pinning & Read Receipts (Slices 8.6, 8.7, 8.8).
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
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Can } from '../../../components/common/Can.jsx';
import { useSelector } from 'react-redux';
import {
  useTogglePinAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useRecordReadReceiptMutation
} from '../announcementsApi.js';
import { ReadReceiptsModal } from './ReadReceiptsModal.jsx';

const PRIORITY_STYLES = {
  urgent: {
    border: 'border-[#EF4444]/40',
    badge: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    label: 'Urgent'
  },
  high: {
    border: 'border-[#F59E0B]/35',
    badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    label: 'High Priority'
  },
  normal: {
    border: 'border-[#1E2235]',
    badge: 'bg-[#5E6AD2]/10 text-[#5E6AD2] border-[#5E6AD2]/20',
    label: 'General'
  },
  low: {
    border: 'border-[#1E2235]',
    badge: 'bg-[#62677B]/15 text-[#8F94A8] border-[#1E2235]',
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
        className={`relative group bg-[#0F111A] rounded-xl border ${
          isPinned ? 'border-[#EAB308]/40 shadow-lg shadow-[#EAB308]/5' : priorityInfo.border
        } p-5 transition-all duration-200 hover:border-[#5E6AD2]/50 hover:bg-[#121421]`}
      >
        {/* Pinned Ribbon Indicator */}
        {isPinned && (
          <div className="absolute -top-2.5 left-5 inline-flex items-center space-x-1 bg-[#EAB308] text-[#090A0F] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned Notice</span>
          </div>
        )}

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 pt-1">
          {/* Author & Target Info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#1E2235] border border-[#2A2E45] flex items-center justify-center font-semibold text-xs text-white">
              {announcement.authorId?.name ? announcement.authorId.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>{announcement.authorId?.name || 'Administrator'}</span>
                {announcement.hasRead && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" title="You have read this" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#62677B] mt-0.5">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate} (PKT)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Audience & Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Target Audience Pill */}
            {isCompany ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#5E6AD2]/10 text-[#5E6AD2] border border-[#5E6AD2]/20">
                <Globe2 className="w-3 h-3" />
                <span>Company</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20">
                <Building2 className="w-3 h-3" />
                <span>{announcement.departmentId?.name || 'Department'}</span>
              </span>
            )}

            {/* Priority Badge */}
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${priorityInfo.badge}`}
            >
              {priorityInfo.label}
            </span>

            {/* Pin Action Button */}
            <Can I="announcement.pin" a="Announcement">
              <button
                onClick={handleTogglePin}
                disabled={isPinning}
                title={isPinned ? 'Unpin Announcement' : 'Pin to Notice Board'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isPinned
                    ? 'bg-[#EAB308]/15 border-[#EAB308]/40 text-[#EAB308] hover:bg-[#EAB308]/25'
                    : 'bg-[#141724] border-[#1E2235] text-[#8F94A8] hover:text-white hover:border-[#2A2E45]'
                }`}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            </Can>

            {/* Edit Action Button */}
            <Can I="announcement.edit" a="Announcement">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(announcement);
                }}
                className="p-1.5 rounded-lg bg-[#141724] border border-[#1E2235] text-[#8F94A8] hover:text-white hover:border-[#2A2E45] transition-colors"
                title="Edit Announcement"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </Can>

            {/* Delete Action Button */}
            <Can I="announcement.delete" a="Announcement">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg bg-[#141724] border border-[#1E2235] text-[#8F94A8] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors"
                title="Delete Announcement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Can>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-4">
          <h4 className="text-base font-semibold text-white tracking-tight mb-2">
            {announcement.title}
          </h4>
          <p className="text-xs text-[#8F94A8] leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        {/* Footer Strip: Engagement / Read Receipts */}
        <div className="mt-4 pt-3 border-t border-[#1E2235]/60 flex items-center justify-between text-xs">
          {canViewReceipts ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReceipts(true);
              }}
              className="inline-flex items-center space-x-1.5 text-[#8F94A8] hover:text-[#5E6AD2] transition-colors cursor-pointer"
              title="View readers list"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Seen by {announcement.readCount || 0} staff</span>
            </button>
          ) : (
            <span className="inline-flex items-center space-x-1.5 text-[#8F94A8]">
              <Eye className="w-3.5 h-3.5 text-[#62677B]" />
              <span>Seen by {announcement.readCount || 0} staff</span>
            </span>
          )}

          <span className="text-[11px] text-[#62677B]">
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
