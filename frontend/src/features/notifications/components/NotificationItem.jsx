/**
 * @file NotificationItem.jsx
 * @description Enterprise Notification Card Component with Module Iconography, Priority Badge & Archival Actions.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Enterprise theme
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
  UserCheck,
  BookOpen,
  Laptop,
  UserPlus,
  FolderKanban,
  Award,
  ListChecks,
  Trophy,
  MessageSquare,
  TrendingDown,
  Archive,
  RotateCcw,
  Trash2,
  Check,
  ExternalLink,
  Flame,
  AlertTriangle
} from 'lucide-react';
import {
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useArchiveNotificationMutation,
  useUnarchiveNotificationMutation,
  useDeleteNotificationMutation
} from '../notificationsApi.js';
import { toast } from 'sonner';

const MODULE_CONFIG = {
  leaves: {
    icon: Calendar,
    label: 'Leaves',
    color: 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
  },
  attendance: {
    icon: Clock,
    label: 'Attendance',
    color: 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
  },
  payroll: {
    icon: DollarSign,
    label: 'Payroll',
    color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
  },
  loans: {
    icon: DollarSign,
    label: 'Loans',
    color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
  },
  expenses: {
    icon: DollarSign,
    label: 'Expenses',
    color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
  },
  assets: {
    icon: Laptop,
    label: 'Assets',
    color: 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
  },
  recruitment: {
    icon: UserPlus,
    label: 'Recruitment',
    color: 'text-cyan-500 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60'
  },
  projects: {
    icon: FolderKanban,
    label: 'Projects',
    color: 'text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60'
  },
  performance: {
    icon: Award,
    label: 'Performance',
    color: 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60'
  },
  lifecycle: {
    icon: ListChecks,
    label: 'Lifecycle',
    color: 'text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
  },
  policies: {
    icon: BookOpen,
    label: 'Policies',
    color: 'text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60'
  },
  announcements: {
    icon: Megaphone,
    label: 'Announcements',
    color: 'text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60'
  },
  rewards: {
    icon: Trophy,
    label: 'Rewards',
    color: 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/60'
  },
  feedback: {
    icon: ShieldAlert,
    label: 'Feedback',
    color: 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
  },
  chat: {
    icon: MessageSquare,
    label: 'Chat',
    color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
  },
  attrition: {
    icon: TrendingDown,
    label: 'Attrition',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
  },
  security: {
    icon: ShieldAlert,
    label: 'Security',
    color: 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
  },
  profile: {
    icon: UserCheck,
    label: 'Profile',
    color: 'text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
  },
  system: {
    icon: Bell,
    label: 'System',
    color: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
  }
};

const PRIORITY_BADGES = {
  urgent: {
    label: 'Urgent',
    icon: Flame,
    color: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30'
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    color: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30'
  },
  normal: {
    label: 'Normal',
    icon: null,
    color: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
  },
  low: {
    label: 'Low',
    icon: null,
    color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
  }
};

/**
 * Format timestamp into relative or localized time string
 */
const formatNotificationTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
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

export const NotificationItem = ({
  notification,
  onCloseDrawer,
  compact = false,
  showActions = true
}) => {
  const navigate = useNavigate();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();
  const [archiveNotification] = useArchiveNotificationMutation();
  const [unarchiveNotification] = useUnarchiveNotificationMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  if (!notification) return null;

  const {
    _id,
    module = 'system',
    type = 'system',
    priority = 'normal',
    title,
    body,
    link,
    isRead,
    isArchived,
    createdAt
  } = notification;

  const resolvedModule = (module && module !== 'system' ? module : type)?.toLowerCase();
  const config = MODULE_CONFIG[resolvedModule] || MODULE_CONFIG.system;
  const IconComponent = config?.icon || Bell;

  const priorityMeta = PRIORITY_BADGES[priority?.toLowerCase()] || PRIORITY_BADGES.normal;
  const PriorityIcon = priorityMeta?.icon;

  const handleCardClick = async () => {
    if (!isRead) {
      try {
        await markAsRead(_id).unwrap();
      } catch {
        // Continue navigation
      }
    }
    if (onCloseDrawer) {
      onCloseDrawer();
    }
    if (link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(link);
      }
    }
  };

  const handleToggleRead = async (e) => {
    e.stopPropagation();
    try {
      if (isRead) {
        await markAsUnread(_id).unwrap();
        toast.success('Marked as unread');
      } else {
        await markAsRead(_id).unwrap();
        toast.success('Marked as read');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleToggleArchive = async (e) => {
    e.stopPropagation();
    try {
      if (isArchived) {
        await unarchiveNotification(_id).unwrap();
        toast.success('Restored from archive');
      } else {
        await archiveNotification(_id).unwrap();
        toast.success('Notification archived');
      }
    } catch {
      toast.error('Failed to update archive state');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteNotification(_id).unwrap();
      toast.success('Notification deleted permanently');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
        isRead
          ? 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] hover:bg-slate-50/80 dark:hover:bg-[#13221B]/80'
          : 'bg-emerald-50/30 dark:bg-[#13221B] border-emerald-300/80 dark:border-emerald-800/40 hover:border-[#00C471]/60 shadow-xs'
      }`}
    >
      {/* Category / Module Icon */}
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 ${config.color}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Message Content & Metadata */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* Module Pill */}
          <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1E3A2B]">
            {config.label}
          </span>

          {/* Priority Badge */}
          {priority !== 'normal' && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${priorityMeta.color}`}
            >
              {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
              <span>{priorityMeta.label}</span>
            </span>
          )}

          {/* Timestamp */}
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 ml-auto shrink-0">
            {formatNotificationTime(createdAt)}
          </span>
        </div>

        {/* Title */}
        <h4
          className={`text-sm truncate ${
            isRead
              ? 'font-medium text-slate-800 dark:text-slate-300'
              : 'font-bold text-slate-900 dark:text-white'
          }`}
        >
          {title}
        </h4>

        {/* Body Text */}
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {body}
        </p>

        {/* Interactive Action Toolbar */}
        {showActions && !compact && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1A3125]/60">
            {link && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCloseDrawer) onCloseDrawer();
                  if (link.startsWith('http://') || link.startsWith('https://')) {
                    window.open(link, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate(link);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#00C471] hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <span>Take Action</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleRead}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-lg transition-colors cursor-pointer"
              title={isRead ? 'Mark as unread' : 'Mark as read'}
            >
              <Check className={`w-3.5 h-3.5 ${isRead ? 'text-slate-400' : 'text-[#00C471]'}`} />
              <span className="text-[11px]">{isRead ? 'Mark unread' : 'Mark read'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleArchive}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-lg transition-colors cursor-pointer"
              title={isArchived ? 'Restore to active' : 'Archive alert'}
            >
              {isArchived ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">Restore</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Archive</span>
                </>
              )}
            </button>

            {isArchived && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-auto cursor-pointer"
                title="Delete permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unread Indicator Pulse */}
      {!isRead && (
        <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-[#00C471] ring-4 ring-[#00C471]/20 animate-pulse" />
      )}
    </div>
  );
};

export default NotificationItem;
