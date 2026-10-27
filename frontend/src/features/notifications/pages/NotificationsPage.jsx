/**
 * @file NotificationsPage.jsx
 * @description Dedicated Full-Page Notifications History with Category Filters & Pagination.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Notifications
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Feature Page (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BellOff
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation
} from '../notificationsApi.js';
import { NotificationItem } from '../components/NotificationItem.jsx';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'leave', label: 'Leaves & Vacations' },
  { value: 'attendance', label: 'Attendance & Shifts' },
  { value: 'payroll', label: 'Payroll & Compensation' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'security', label: 'Security & Access' },
  { value: 'profile', label: 'Profile Updates' },
  { value: 'system', label: 'System Directives' }
];

export const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [selectedType, setSelectedType] = useState('');

  const { data: notificationsData, isLoading } = useGetNotificationsQuery({
    page,
    limit: 15,
    unreadOnly: filterTab === 'unread' ? 'true' : 'false',
    type: selectedType || undefined
  });

  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const items = notificationsData?.data?.items || [];
  const total = notificationsData?.data?.total || 0;
  const unreadCount = notificationsData?.data?.unreadCount || 0;
  const totalPages = notificationsData?.data?.totalPages || 1;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Notifications & Activity Log"
        description="Review your historical alerts, approval updates, and operational notices."
      >
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#00C471]" />
            <span>Mark all as read</span>
          </button>
        )}
      </PageHeader>

      {/* 2. Filter Toolbar */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Segmented Tabs */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#13221B] border border-slate-200/80 dark:border-[#1A3125] p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterTab('all');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All Notifications</span>
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-[#111D17] text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded-md">
                {total}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('unread');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'unread'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="font-mono text-[10px] bg-[#00C471] text-white px-1.5 py-0.2 rounded-md font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 gap-3 shadow-xs">
            <Loader2 className="w-7 h-7 animate-spin text-[#00C471]" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Synchronizing notification stream...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl py-20 px-6 flex flex-col items-center justify-center text-center shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-[#00C471]">
              <BellOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                No notifications found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed mx-auto">
                {filterTab === 'unread'
                  ? 'All caught up! You have read all recent alerts and action items.'
                  : 'You have no historical notifications matching the selected category.'}
              </p>
            </div>
          </div>
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))
        )}
      </div>

      {/* 4. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Showing page <span className="font-semibold text-slate-900 dark:text-white font-mono">{page}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white font-mono">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#13221B] rounded-lg border border-slate-200 dark:border-[#1A3125] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#13221B] rounded-lg border border-slate-200 dark:border-[#1A3125] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
