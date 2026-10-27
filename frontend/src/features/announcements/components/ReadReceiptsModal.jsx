/**
 * @file ReadReceiptsModal.jsx
 * @description Modal showing Audience Engagement & Read Receipts for Announcements.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React from 'react';
import { X, Users, CheckCircle2, Clock } from 'lucide-react';
import { useGetReadReceiptsQuery } from '../announcementsApi.js';

export function ReadReceiptsModal({ announcementId, isOpen, onClose }) {
  const { data, isLoading, isError, error } = useGetReadReceiptsQuery(announcementId, {
    skip: !isOpen || !announcementId
  });

  if (!isOpen) return null;

  const readers = data?.data?.readers || [];
  const totalReads = data?.data?.totalReads || 0;
  const announcementTitle = data?.data?.title || 'Announcement';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#13221B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Read Receipts & Engagement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {announcementTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Counter Strip */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-[#13221B] border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Verified Staff Readers:</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-mono text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C471]" />
            {totalReads} Staff Members
          </span>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-[#00C471] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4">
              {error?.data?.message || 'You do not have permission to inspect reader analytics for this announcement.'}
            </div>
          ) : readers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              No staff members have viewed this announcement yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1A3125]/70">
              {readers.map((receipt, idx) => {
                const readerUser = receipt.userId;
                const formattedTime = receipt.readAt
                  ? new Date(receipt.readAt).toLocaleString('en-US', {
                      timeZone: 'Asia/Karachi',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : 'Just now';

                return (
                  <div key={readerUser?._id || idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-[10px]">
                        {readerUser?.name ? readerUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {readerUser?.name || 'Staff Member'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {readerUser?.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formattedTime} (PKT)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReadReceiptsModal;
