/**
 * @file PinnedNoticeBoard.jsx
 * @description Executive Pinned Notice Board Widget for Dashboard (Module M8 / Slice 8.7).
 */

import React from 'react';
import { Pin, Megaphone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetAnnouncementsQuery } from '../announcementsApi.js';

export function PinnedNoticeBoard() {
  const { data, isLoading } = useGetAnnouncementsQuery({ pinnedOnly: true, limit: 3 });

  const pinnedItems = data?.data || [];

  if (isLoading || pinnedItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0F111A] border border-[#EAB308]/30 rounded-xl p-5 shadow-lg shadow-[#EAB308]/5 mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2235]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EAB308]/15 text-[#EAB308] flex items-center justify-center">
            <Pin className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Notice Board</span>
              <span className="text-[10px] font-bold bg-[#EAB308]/20 text-[#EAB308] px-2 py-0.5 rounded-full border border-[#EAB308]/30">
                {pinnedItems.length} Pinned
              </span>
            </h3>
            <p className="text-xs text-[#8F94A8]">Crucial organizational notices & company updates</p>
          </div>
        </div>
        <Link
          to="/announcements"
          className="text-xs font-medium text-[#5E6AD2] hover:text-[#7B86E8] flex items-center space-x-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pinnedItems.map((item) => (
          <div
            key={item._id}
            className="bg-[#141724] border border-[#1E2235] hover:border-[#EAB308]/50 rounded-lg p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-[#EAB308] font-semibold uppercase tracking-wider">
                  {item.targetAudience === 'company' ? 'Company' : item.departmentId?.name || 'Department'}
                </span>
                <span className="text-[#62677B]">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1.5">{item.title}</h4>
              <p className="text-xs text-[#8F94A8] line-clamp-2 leading-relaxed">{item.content}</p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1E2235]/60 flex items-center justify-between text-[11px] text-[#62677B]">
              <span>By {item.authorId?.name || 'Admin'}</span>
              <Link to="/announcements" className="text-[#5E6AD2] hover:underline">
                Read notice →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PinnedNoticeBoard;
