/**
 * @file NotificationsPage.jsx
 * @description Dedicated Full-Page Notifications History with Category Filters & Pagination (Module M8 / Slice 8.2).
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
import { Card } from '../../../components/common/Card.jsx';
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation
} from '../notificationsApi.js';
import { NotificationItem } from '../components/NotificationItem.jsx';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'leave', label: 'Leaves' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'security', label: 'Security' },
  { value: 'profile', label: 'Profile' },
  { value: 'system', label: 'System' }
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
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        subtitle="Review your historical alerts, approval updates, and operational notices"
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-indigo-400" />
              Mark all as read
            </button>
          ) : null
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 bg-[#0F111A] border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterTab('all');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              All Notifications ({total})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('unread');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterTab === 'unread'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-[#141824] border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <Card className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm">Loading your notifications...</span>
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-400">
              <BellOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-200">No notifications found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {filterTab === 'unread'
                  ? 'Great job! You have read all of your recent alerts.'
                  : 'You have no historical notifications matching the current criteria.'}
              </p>
            </div>
          </Card>
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-medium text-slate-300">{page}</span> of{' '}
            <span className="font-medium text-slate-300">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
