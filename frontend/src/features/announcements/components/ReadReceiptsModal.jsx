/**
 * @file ReadReceiptsModal.jsx
 * @description Executive Audience Engagement & Read Receipts Docket with KPI metrics, department breakdown, and searchable reader roster.
 */

import React, { useState } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Search
} from 'lucide-react';
import { useGetReadReceiptsQuery } from '../announcementsApi.js';

export function ReadReceiptsModal({ announcementId, isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error } = useGetReadReceiptsQuery(announcementId, {
    skip: !isOpen || !announcementId
  });

  if (!isOpen) return null;

  const result = data?.data || {};
  const readers = result.readers || [];
  const totalTargeted = result.totalTargeted || 0;
  const seenCount = result.seenCount !== undefined ? result.seenCount : result.totalReads || readers.length;
  const unseenCount = result.unseenCount !== undefined ? result.unseenCount : Math.max(0, totalTargeted - seenCount);
  const compliancePercentage =
    result.compliancePercentage !== undefined
      ? result.compliancePercentage
      : totalTargeted > 0
      ? Math.round((seenCount / totalTargeted) * 100)
      : 100;
  const departmentBreakdown = result.departmentBreakdown || [];
  const announcementTitle = result.title || 'Announcement Engagement Analytics';

  const filteredReaders = readers.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.employeeCode && r.employeeCode.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#0C1712]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00C471] border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Audience Engagement & Read Receipts
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] line-clamp-1">
                {announcementTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 pb-3">
          {/* Target Audience */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Targeted Staff</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {totalTargeted}
            </div>
            <span className="text-[10px] text-slate-400">Eligible recipients</span>
          </div>

          {/* Verified Readers */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-[#162820]/40 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Verified Readers</span>
              <span className="text-xs font-bold text-[#00C471] font-mono">{compliancePercentage}%</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00C471] mt-1">
              {seenCount}
            </div>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Read & confirmed</span>
          </div>

          {/* Pending Readers */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Pending / Unseen</span>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {unseenCount}
            </div>
            <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Yet to review</span>
          </div>
        </div>

        {/* Department Breakdown Strip if available */}
        {departmentBreakdown.length > 0 && (
          <div className="px-6 py-2">
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-[#0C1712]/50 border border-slate-200 dark:border-[#1A3125] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Department Engagement
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {departmentBreakdown.map((dept, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-[#162820] px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-[#1A3125]">
                    <span className="truncate pr-1 text-slate-700 dark:text-slate-300 font-medium">
                      {dept.departmentName}
                    </span>
                    <span className="font-mono font-bold text-[#00C471] shrink-0">
                      {dept.signedCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar for Readers */}
        <div className="px-6 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter readers by name, email, department, or employee code..."
              className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:border-[#00C471]"
            />
          </div>
        </div>

        {/* Reader List Body */}
        <div className="p-6 pt-2 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Loading engagement roster...
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs text-center border border-rose-200 dark:border-rose-900/50">
              {error?.data?.message || 'Failed to load reader engagement records.'}
            </div>
          ) : filteredReaders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {searchTerm ? 'No readers matching search filter.' : 'No employees have viewed this announcement yet.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1A3125]/70">
              {filteredReaders.map((reader, idx) => {
                const formattedTime = reader.readAt
                  ? new Date(reader.readAt).toLocaleString('en-US', {
                      timeZone: 'Asia/Karachi',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : 'Recorded';

                return (
                  <div key={reader.userId || idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471] border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center font-bold text-xs shrink-0">
                        {reader.name ? reader.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{reader.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-[#162820] px-1.5 py-0.2 rounded border border-slate-200 dark:border-[#1A3125]">
                            {reader.employeeCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1.5 mt-0.5">
                          <span>{reader.department}</span>
                          <span>·</span>
                          <span>{reader.designation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-[#00C471] font-semibold justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </div>
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712]/50 flex justify-between items-center text-xs text-slate-400">
          <span>Showing {filteredReaders.length} of {readers.length} readers</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#162820] text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReadReceiptsModal;
