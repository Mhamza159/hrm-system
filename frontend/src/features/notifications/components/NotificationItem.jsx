/**
 * @file NotificationItem.jsx
 * @description Individual Notification Card Component with Category Iconography & Click Navigation (Module M8 / Slice 8.2).
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
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useMarkAsReadMutation } from '../notificationsApi.js';

const TYPE_CONFIG = {
  leave: {
    icon: Calendar,
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  },
  attendance: {
    icon: Clock,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  },
  payroll: {
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  },
  announcement: {
    icon: Megaphone,
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
  },
  security: {
    icon: ShieldAlert,
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20'
  },
  profile: {
    icon: UserCheck,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  },
  system: {
    icon: Bell,
    color: 'text-slate-400 bg-slate-400/10 border-slate-400/20'
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
        // Silently continue navigation even if markAsRead fails
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
      className={`group relative flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
        isRead
          ? 'bg-[#0F111A]/40 border-slate-800/40 hover:bg-[#161926]/60 hover:border-slate-700/60'
          : 'bg-[#131625] border-indigo-500/30 hover:border-indigo-500/50 shadow-sm'
      }`}
    >
      {/* Category Icon Badge */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${config.color}`}
      >
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-sm truncate font-medium ${
              isRead ? 'text-slate-300' : 'text-slate-100 font-semibold'
            }`}
          >
            {title}
          </h4>
          <span className="text-[11px] text-slate-500 flex-shrink-0">
            {formatNotificationTime(createdAt)}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {body}
        </p>
      </div>

      {/* Unread Indicator Dot */}
      {!isRead && (
        <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
      )}
    </div>
  );
};
