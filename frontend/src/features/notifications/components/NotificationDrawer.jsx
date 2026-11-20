/**
 * @file NotificationDrawer.jsx
 * @description Slide-Out Drawer Panel for Notifications with Live Filtering & Mark All Action.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Notifications
 * - Design: Forest & Emerald Enterprise theme
 * - Layer: Component (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, BellOff, ExternalLink, Loader2, Archive, Flame } from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useArchiveAllNotificationsMutation
} from '../notificationsApi.js';
import { NotificationItem } from './NotificationItem.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { toast } from 'sonner';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'urgent'

  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch
  } = useGetNotificationsQuery(
    {
      page: 1,
      limit: 30,
      unreadOnly: filterTab === 'unread' ? 'true' : 'false',
      priority: filterTab === 'urgent' ? 'urgent' : undefined
    },
    { skip: !isOpen }
  );

  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [archiveAllNotifications, { isLoading: isArchivingAll }] = useArchiveAllNotificationsMutation();

  if (!isOpen) return null;

  const items = notificationsData?.items || notificationsData?.data?.items || [];
  const unreadCount = notificationsData?.unreadCount ?? notificationsData?.data?.unreadCount ?? 0;

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
      toast.error('Failed to archive notifications');
    }
  };

  const handleViewAllPage = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Centered Modal Container */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/80 dark:bg-[#111D17]">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 font-mono">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#00C471] hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="p-3 border-b border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
            <div className="inline-flex w-full items-center gap-1 bg-slate-100 dark:bg-[#13221B] border border-slate-200/80 dark:border-[#1A3125] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 rounded-lg font-semibold transition-all text-center cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unread')}
                className={`flex-1 py-1 rounded-lg font-semibold transition-all text-center cursor-pointer ${
                  filterTab === 'unread'
                    ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('urgent')}
                className={`flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-lg font-semibold transition-all text-center cursor-pointer ${
                  filterTab === 'urgent'
                    ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-500" />
                <span>Urgent</span>
              </button>
            </div>
          </div>

          {/* Notifications Scroll Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : isError ? (
              <ErrorState error={error} onRetry={refetch} className="py-6 my-2" />
            ) : items.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-2.5 px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-[#00C471]">
                  <BellOff className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  No notifications
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filterTab === 'unread'
                    ? 'You have zero unread notifications.'
                    : filterTab === 'urgent'
                    ? 'No urgent action items requiring immediate attention.'
                    : 'Your notification stream is currently clear.'}
                </p>
              </div>
            ) : (
              items.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onCloseDrawer={onClose}
                  compact={false}
                />
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 p-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#111D17] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleArchiveAllRead}
              disabled={isArchivingAll}
              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              title="Archive all read items"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive read</span>
            </button>

            <button
              type="button"
              onClick={handleViewAllPage}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-[#00C471] hover:text-[#049856] hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer ml-auto"
            >
              <span>Full Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
    </div>
  );
};

export default NotificationDrawer;
