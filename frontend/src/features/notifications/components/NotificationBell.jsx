/**
 * @file NotificationBell.jsx
 * @description Topbar Notification Bell Trigger with Live Unread Counter Badge & Drawer Toggle.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Notifications
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
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
    { pollingInterval: 60000 } // Safety fallback poll every 60s
  );

  const unreadCount = notificationsData?.data?.unreadCount || 0;

  return (
    <>
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsDrawerOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Dynamic unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-[#00C471] rounded-full ring-2 ring-white dark:ring-[#111D17] animate-pulse shadow-xs font-mono">
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

export default NotificationBell;
