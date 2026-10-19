/**
 * @file NotificationDrawer.jsx
 * @description Slide-Out Drawer Panel for Notifications with Live Filtering & Mark All Action (Module M8 / Slice 8.2).
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out drawer panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0B0D14] border-l border-slate-800/80 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0F111A]">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-slate-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-md transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-800/60 flex items-center gap-2 bg-[#0B0D14]">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTab === 'unread'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Unread only ({unreadCount})
            </button>
          </div>

          {/* Notifications Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {isLoading ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-400">
                  <BellOff className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">No notifications</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {filterTab === 'unread'
                      ? "You're all caught up! No unread notifications."
                      : 'You do not have any alerts at this time.'}
                  </p>
                </div>
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
          <div className="p-3 border-t border-slate-800/80 bg-[#0F111A] flex items-center justify-between">
            <button
              type="button"
              onClick={handleViewAllPage}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-md border border-slate-700/50 transition-colors"
            >
              View full notification history
              <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
