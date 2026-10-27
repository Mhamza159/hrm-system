/**
 * @file NotificationItem.jsx
 * @description Individual Notification Card Component with Category Iconography & Click Navigation.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  Megaphone,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useMarkAsReadMutation } from '../notificationsApi.js';

const TYPE_CONFIG = {
  leave: {
    icon: Calendar,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
  },
  attendance: {
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
  },
  payroll: {
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
  },
  announcement: {
    icon: Megaphone,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60'
  },
  security: {
    icon: ShieldAlert,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
  },
  profile: {
    icon: UserCheck,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
  },
  system: {
    icon: Bell,
    color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
  }
};

/**
 * Format timestamp into concise relative or localized PKT time string
 */
const formatNotificationTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    month: 'short',
    day: 'numeric'
  });
};

export const NotificationItem = ({ notification, onCloseDrawer }) => {
  const navigate = useNavigate();
  const [markAsRead] = useMarkAsReadMutation();

  const { _id, type = 'system', title, body, link, isRead, createdAt } = notification;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.system;
  const IconComponent = config.icon;

  const handleClick = async () => {
    // 1. Mark as read if currently unread
    if (!isRead) {
      try {
        await markAsRead(_id).unwrap();
      } catch (err) {
        // Silently continue navigation
      }
    }

    // 2. Close slide-out drawer if open
    if (onCloseDrawer) {
      onCloseDrawer();
    }

    // 3. Navigate to target link if provided
    if (link) {
      navigate(link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
        isRead
          ? 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] hover:bg-slate-50/80 dark:hover:bg-[#13221B]/80'
          : 'bg-emerald-50/30 dark:bg-[#13221B] border-emerald-200/80 dark:border-[#1A3125] hover:border-[#00C471]/50 shadow-xs'
      }`}
    >
      {/* Category Icon Badge */}
      <div
        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${config.color}`}
      >
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-xs truncate ${
              isRead
                ? 'font-medium text-slate-800 dark:text-slate-300'
                : 'font-bold text-slate-900 dark:text-white'
            }`}
          >
            {title}
          </h4>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
            {formatNotificationTime(createdAt)}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {body}
        </p>
      </div>

      {/* Unread Indicator Dot */}
      {!isRead && (
        <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-[#00C471] ring-2 ring-emerald-500/20" />
      )}
    </div>
  );
};
