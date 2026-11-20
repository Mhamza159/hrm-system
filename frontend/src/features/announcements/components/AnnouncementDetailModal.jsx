/**
 * @file AnnouncementDetailModal.jsx
 * @description Inspection & Reader Modal for Announcements with attachment previews and auto-read trigger.
 */

import React, { useEffect } from 'react';
import {
  X,
  Clock,
  Globe2,
  Building2,
  Paperclip,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';
import { useRecordReadReceiptMutation } from '../announcementsApi.js';

const PRIORITY_BADGES = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
  high: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
  low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
};

export function AnnouncementDetailModal({
  announcement,
  isOpen,
  onClose,
  onOpenReceipts,
  canViewReceipts = false
}) {
  const [recordRead] = useRecordReadReceiptMutation();

  useEffect(() => {
    if (isOpen && announcement?._id && !announcement.hasRead) {
      recordRead(announcement._id).catch(() => {});
    }
  }, [isOpen, announcement, recordRead]);

  if (!isOpen || !announcement) return null;

  const isCompany = announcement.targetAudience === 'company';
  const targetDepts = announcement.departmentIds?.length > 0
    ? announcement.departmentIds
    : announcement.departmentId
    ? [announcement.departmentId]
    : [];

  const formattedDate = announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '';

  const formattedExpiry = announcement.expiryDate
    ? new Date(announcement.expiryDate).toLocaleDateString('en-US', {
        timeZone: 'Asia/Karachi',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712]/50 flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Audience Pill */}
              {isCompany ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                  <Globe2 className="w-3 h-3" />
                  <span>Company-Wide Broadcast</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                  <Building2 className="w-3 h-3" />
                  <span>
                    {targetDepts.length === 1 ? targetDepts[0].name : `${targetDepts.length} Targeted Departments`}
                  </span>
                </span>
              )}

              {/* Priority Badge */}
              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                  PRIORITY_BADGES[announcement.priority] || PRIORITY_BADGES.normal
                }`}
              >
                {announcement.priority}
              </span>

              {announcement.pinned && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Pinned Notice
                </span>
              )}

              {announcement.isArchived && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Archived Record
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {announcement.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Author & Meta Bar */}
        <div className="px-6 py-3 bg-slate-50/40 dark:bg-[#13221B]/40 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#00C471] font-bold text-[11px] flex items-center justify-center shrink-0">
              {announcement.authorId?.name ? announcement.authorId.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {announcement.authorId?.name || 'Administrator'}
              </span>
              <span className="text-slate-400 dark:text-slate-500 ml-1.5 font-mono text-[11px]">
                ({announcement.authorId?.email || 'System Authority'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate} (PKT)</span>
            </span>

            {formattedExpiry && (
              <span className="flex items-center gap-1 text-amber-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expires: {formattedExpiry}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          {/* Target Departments Detail Chips if multiple */}
          {targetDepts.length > 1 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Targeted Departments:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {targetDepts.map((d) => (
                  <span
                    key={d._id || d}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    {d.name || 'Department'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Announcement Message */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-slate-800 dark:text-slate-200 bg-white dark:bg-[#111D17] p-1 rounded-xl">
            {announcement.content}
          </div>

          {/* Attachments Section */}
          {announcement.attachments?.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] space-y-2.5">
              <h5 className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                <span>Associated Reference Documents ({announcement.attachments.length})</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {announcement.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#0C1712] hover:border-[#00C471]/50 hover:bg-emerald-50/20 dark:hover:bg-[#162820] flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {file.name || 'Notice Attachment'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {file.fileType || 'Document'}
                        </div>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00C471] transition shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Strip */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712]/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-[#00C471] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledged & Marked as Read</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {canViewReceipts && onOpenReceipts && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceipts(announcement);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#162820] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold transition shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-[#00C471]" />
                <span>Engagement Roster</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#1A3125] dark:hover:bg-[#223F30] text-slate-800 dark:text-slate-200 font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementDetailModal;
