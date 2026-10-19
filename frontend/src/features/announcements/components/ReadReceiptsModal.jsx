/**
 * @file ReadReceiptsModal.jsx
 * @description Modal showing Audience Engagement & Read Receipts for Announcements (Slice 8.8).
 */

import React from 'react';
import { X, Users, CheckCircle, Clock } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F111A] border border-[#1E2235] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2235] bg-[#141724]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/15 flex items-center justify-center text-[#5E6AD2]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Read Receipts & Engagement</h3>
              <p className="text-xs text-[#8F94A8] line-clamp-1">{announcementTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8F94A8] hover:text-white hover:bg-[#1E2235] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Counter Strip */}
        <div className="px-6 py-3 bg-[#0A0B10] border-b border-[#1E2235] flex items-center justify-between text-xs">
          <span className="text-[#8F94A8]">Verified Readers:</span>
          <span className="inline-flex items-center font-semibold text-[#5E6AD2] bg-[#5E6AD2]/10 px-2.5 py-0.5 rounded-full border border-[#5E6AD2]/20">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-[#22C55E]" />
            {totalReads} Staff Members
          </span>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
              {error?.data?.message || 'You do not have permission to inspect reader analytics for this announcement.'}
            </div>
          ) : readers.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#8F94A8]">
              No readers have viewed this announcement yet.
            </div>
          ) : (
            <div className="divide-y divide-[#1E2235]/60">
              {readers.map((receipt, idx) => {
                const user = receipt.userId;
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
                  <div key={user?._id || idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-[#1E2235] flex items-center justify-center font-medium text-white border border-[#2A2E45]">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user?.name || 'Staff Member'}</div>
                        <div className="text-[11px] text-[#62677B]">{user?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[#8F94A8]">
                      <Clock className="w-3 h-3 text-[#62677B]" />
                      <span>{formattedTime} (PKT)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1E2235] bg-[#0A0B10] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-[#1E2235] hover:bg-[#2A2E45] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReadReceiptsModal;
