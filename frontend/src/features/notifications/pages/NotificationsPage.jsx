/**
 * @file NotificationsPage.jsx
 * @description Dedicated Full-Page Notification Command Center with Module Filtering, Priority Badges & Archival Lifecycle.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Notifications (Phase 23)
 * - Design: Forest & Emerald Enterprise theme
 * - Layer: Feature Page (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BellOff,
  Archive,
  Search,
  Flame,
  Inbox
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useArchiveAllNotificationsMutation
} from '../notificationsApi.js';
import { NotificationItem } from '../components/NotificationItem.jsx';
import { toast } from 'sonner';

const MODULE_FILTERS = [
  { value: 'all', label: 'All Modules' },
  { value: 'leaves', label: 'Leaves' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'loans', label: 'Loans' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'assets', label: 'Assets' },
  { value: 'recruitment', label: 'Recruitment & ATS' },
  { value: 'projects', label: 'Projects & Timesheets' },
  { value: 'performance', label: 'Performance' },
  { value: 'lifecycle', label: 'Lifecycle & Tasks' },
  { value: 'policies', label: 'Company Policies' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'rewards', label: 'Rewards & Kudos' },
  { value: 'feedback', label: 'Grievance & Feedback' },
  { value: 'chat', label: 'Internal Chat' },
  { value: 'system', label: 'System Directives' }
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent Only' },
  { value: 'high', label: 'High Priority' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low Priority' }
];

export const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: notificationsData,
    isLoading,
    isFetching,
    refetch
  } = useGetNotificationsQuery({
    page,
    limit: 15,
    isArchived: activeTab === 'archived' ? 'true' : 'false',
    unreadOnly: unreadOnly ? 'true' : 'false',
    module: selectedModule !== 'all' ? selectedModule : undefined,
    priority: selectedPriority !== 'all' ? selectedPriority : undefined,
    search: searchQuery ? searchQuery.trim() : undefined
  });

  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [archiveAllNotifications, { isLoading: isArchivingAll }] = useArchiveAllNotificationsMutation();

  const items = notificationsData?.items || notificationsData?.data?.items || [];
  const total = notificationsData?.total ?? notificationsData?.data?.total ?? 0;
  const unreadCount = notificationsData?.unreadCount ?? notificationsData?.data?.unreadCount ?? 0;
  const archivedCount = notificationsData?.archivedCount ?? notificationsData?.data?.archivedCount ?? 0;
  const totalPages = notificationsData?.totalPages ?? notificationsData?.data?.totalPages ?? 1;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleArchiveAllRead = async () => {
    try {
      await archiveAllNotifications().unwrap();
      toast.success('All read notifications archived');
    } catch {
      toast.error('Failed to archive read notifications');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & Actions */}
      <PageHeader
        title="Notification Center"
        description="Comprehensive real-time activity feed, system alerts, and operational approvals across all 16 HRMS domains."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          {unreadCount > 0 && activeTab === 'active' && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[#00C471]" />
              <span>Mark all read</span>
            </button>
          )}
          {activeTab === 'active' && (
            <button
              type="button"
              onClick={handleArchiveAllRead}
              disabled={isArchivingAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#1A3125] rounded-xl border border-slate-200 dark:border-[#1A3125] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              <span>Archive read</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* 2. Operational Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Filtered</span>
            <Inbox className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {total}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unread Alerts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C471] ring-4 ring-emerald-500/20 animate-pulse" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#00C471] mt-1">
            {unreadCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Urgent Required</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-500 mt-1">
            {items.filter((i) => i.priority === 'urgent' && !i.isRead).length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Archived Stream</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
            {archivedCount}
          </p>
        </div>
      </div>

      {/* 3. Top-Level Feed Tabs (Active vs Archived) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1A3125] pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('active');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-[#00C471] text-white shadow-[0_2px_10px_rgba(0,196,113,0.3)]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Active Notifications</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'active'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#00C471] text-white'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('archived');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-[#00C471] text-white shadow-[0_2px_10px_rgba(0,196,113,0.3)]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125]'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archived Notifications</span>
          {archivedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300">
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications by title or keyword..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Unread Toggle (Active Tab only) */}
            {activeTab === 'active' && (
              <button
                type="button"
                onClick={() => {
                  setUnreadOnly((prev) => !prev);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  unreadOnly
                    ? 'bg-[#00C471]/15 text-[#00C471] border-[#00C471]/30'
                    : 'bg-slate-50 dark:bg-[#13221B] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A3125] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${unreadOnly ? 'bg-[#00C471]' : 'bg-slate-400'}`} />
                <span>Unread Only</span>
              </button>
            )}

            {/* Priority Selector */}
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Module Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MODULE_FILTERS.map((mod) => (
            <button
              key={mod.value}
              type="button"
              onClick={() => {
                setSelectedModule(mod.value);
                setPage(1);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedModule === mod.value
                  ? 'bg-emerald-500/20 text-[#00C471] font-semibold border border-emerald-500/30'
                  : 'bg-slate-50 dark:bg-[#13221B] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-[#1A3125] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Notifications List */}
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
                {activeTab === 'archived'
                  ? 'Your archive is empty. Archived notifications will appear here.'
                  : unreadOnly
                  ? 'All caught up! You have zero unread alerts.'
                  : 'No operational notifications match your search or filters.'}
              </p>
            </div>
          </div>
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              showActions={true}
            />
          ))
        )}
      </div>

      {/* 6. Pagination Controls */}
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
