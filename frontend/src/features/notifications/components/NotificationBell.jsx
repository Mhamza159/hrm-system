/**
 * @file NotificationBell.jsx
 * @description Topbar Notification Bell Trigger with Live Unread Counter Badge & Drawer Toggle (Module M8 / Slice 8.2).
 */

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';
import { useGetNotificationsQuery } from '../notificationsApi.js';
import { NotificationDrawer } from './NotificationDrawer.jsx';

export const NotificationBell = () => {
  // 1. Maintain active WebSocket connection and event handlers
  useSocket();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 2. Poll initial unread summary with lightweight limit: 1
  const { data: notificationsData } = useGetNotificationsQuery(
    { page: 1, limit: 1, unreadOnly: 'false' },
    { pollingInterval: 60000 } // Safety fallback poll every 60s in case websocket is disconnected
  );

  const unreadCount = notificationsData?.data?.unreadCount || 0;

  return (
    <>
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsDrawerOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1E2235]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Dynamic unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-[#090A0F] animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out drawer modal */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
