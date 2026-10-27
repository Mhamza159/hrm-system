/**
 * @file PinnedNoticeBoard.jsx
 * @description Executive Pinned Notice Board Widget for Dashboard (Module M8 / Slice 8.7).
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React from 'react';
import { Pin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetAnnouncementsQuery } from '../announcementsApi.js';

export function PinnedNoticeBoard() {
  const { data, isLoading } = useGetAnnouncementsQuery({ pinnedOnly: true, limit: 3 });

  const pinnedItems = data?.data || [];

  if (isLoading) {
    return null;
  }

  if (pinnedItems.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No active company notices pinned at this time.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111D17] border border-amber-300/80 dark:border-amber-600/40 rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center">
            <Pin className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Notice Board</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-mono">
                {pinnedItems.length} Pinned
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crucial organizational notices & company updates
            </p>
          </div>
        </div>
        <Link
          to="/announcements"
          className="text-xs font-semibold text-[#00C471] hover:text-[#049856] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pinnedItems.map((item) => (
          <div
            key={item._id}
            className="bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] hover:border-amber-300 dark:hover:border-amber-500 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider text-[10px]">
                  {item.targetAudience === 'company' ? 'Company' : item.departmentId?.name || 'Department'}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-mono">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 mb-1.5">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-[#1A3125] flex items-center justify-between text-[11px] text-slate-400">
              <span>By {item.authorId?.name || 'Admin'}</span>
              <Link to="/announcements" className="text-[#00C471] hover:underline font-medium">
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
