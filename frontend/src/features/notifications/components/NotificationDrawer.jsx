/**
 * @file NotificationDrawer.jsx
 * @description Slide-Out Drawer Panel for Notifications with Live Filtering & Mark All Action.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Notifications
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, BellOff, ExternalLink, Loader2 } from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation
} from '../notificationsApi.js';
import { NotificationItem } from './NotificationItem.jsx';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'

  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    {
      page: 1,
      limit: 25,
      unreadOnly: filterTab === 'unread' ? 'true' : 'false'
    },
    { skip: !isOpen }
  );

  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  if (!isOpen) return null;

  const items = notificationsData?.data?.items || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleViewAllPage = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out drawer panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0A110D] border-l border-slate-200 dark:border-[#1A3125] shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/80 dark:bg-[#111D17]">
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#00C471] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#13221B] transition-colors"
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
                className={`flex-1 py-1 rounded-lg font-semibold transition-all text-center ${
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
                className={`flex-1 py-1 rounded-lg font-semibold transition-all text-center ${
                  filterTab === 'unread'
                    ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread ({unreadCount})
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
                    : 'Your notification stream is currently clear.'}
                </p>
              </div>
            ) : (
              items.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onCloseDrawer={onClose}
                />
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#111D17]">
            <button
              type="button"
              onClick={handleViewAllPage}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-[#00C471] hover:text-[#049856] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors cursor-pointer"
            >
              <span>View all notifications history</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
