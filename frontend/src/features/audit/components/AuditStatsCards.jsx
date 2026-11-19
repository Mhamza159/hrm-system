/**
 * @file AuditStatsCards.jsx
 * @description Enterprise 8-card responsive metric grid for real-time audit event monitoring.
 * Styled in Elvara Forest & Emerald Enterprise theme (#061A14, #00C471).
 */

import React from 'react';
import {
  ShieldCheck,
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sliders,
  Users
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export const AuditStatsCards = ({ stats = {}, isLoading = false }) => {
  const cards = [
    {
      title: 'Total Audit Records',
      value: stats.totalEvents?.toLocaleString() || '0',
      description: 'Immutable ledger entries',
      icon: ShieldCheck,
      color: 'emerald',
      badge: 'All-time'
    },
    {
      title: "Today's Events",
      value: stats.todayEvents?.toLocaleString() || '0',
      description: 'Since 00:00 UTC',
      icon: Activity,
      color: 'blue',
      badge: 'Live'
    },
    {
      title: '7-Day Activity',
      value: stats.thisWeekEvents?.toLocaleString() || '0',
      description: 'Last 7 days throughput',
      icon: Calendar,
      color: 'indigo',
      badge: 'Weekly'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate ?? 100}%`,
      description: `${stats.successEvents || 0} succeeded`,
      icon: CheckCircle2,
      color: 'emerald',
      badge: 'Healthy'
    },
    {
      title: 'Failed Activities',
      value: stats.failureEvents?.toLocaleString() || '0',
      description: 'Errors & rejected requests',
      icon: AlertTriangle,
      color: stats.failureEvents > 0 ? 'rose' : 'slate',
      badge: stats.failureEvents > 0 ? 'Review' : 'Zero'
    },
    {
      title: 'Security Events',
      value: stats.securityEvents?.toLocaleString() || '0',
      description: 'Logins, 2FA, lockouts',
      icon: Lock,
      color: stats.securityEvents > 0 ? 'amber' : 'slate',
      badge: 'Security'
    },
    {
      title: 'Admin Operations',
      value: stats.adminEvents?.toLocaleString() || '0',
      description: 'Roles, configs & settings',
      icon: Sliders,
      color: 'purple',
      badge: 'Governance'
    },
    {
      title: 'Active Actors',
      value: stats.activeActorsCount?.toLocaleString() || '0',
      description: 'Unique users audited',
      icon: Users,
      color: 'cyan',
      badge: 'Staff'
    }
  ];

  const colorStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('p-2 rounded-xl border', colorStyles[card.color])}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                  colorStyles[card.color]
                )}
              >
                {card.badge}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? (
                  <span className="inline-block w-16 h-7 bg-muted animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
