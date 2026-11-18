/**
 * @file LoginHistoryStatsCards.jsx
 * @description KPI summary stat cards for authentication audit and login history.
 * Displays Total Attempts, Successful Logins, Failed Attempts, Locked Accounts, and Unique Accounts.
 */

import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Lock, Users } from 'lucide-react';

export function LoginHistoryStatsCards({ stats = {}, isLoading = false }) {
  const {
    totalAttempts = 0,
    successfulLogins = 0,
    failedLogins = 0,
    lockedAttempts = 0,
    uniqueAccounts = 0,
    successRate = 100
  } = stats || {};

  const cards = [
    {
      title: 'Total Attempts',
      value: totalAttempts.toLocaleString(),
      caption: 'All authentication events',
      icon: Activity,
      color: 'emerald',
      badge: null
    },
    {
      title: 'Successful Logins',
      value: successfulLogins.toLocaleString(),
      caption: `${successRate}% success rate`,
      icon: ShieldCheck,
      color: 'emerald',
      badge: `${successRate}%`
    },
    {
      title: 'Failed Attempts',
      value: failedLogins.toLocaleString(),
      caption: failedLogins > 0 ? 'Requires observation' : 'Zero auth failures',
      icon: ShieldAlert,
      color: failedLogins > 0 ? 'rose' : 'slate',
      badge: failedLogins > 0 ? 'Alert' : null
    },
    {
      title: 'Locked Accounts',
      value: lockedAttempts.toLocaleString(),
      caption: lockedAttempts > 0 ? 'Brute-force lockouts' : 'No locked accounts',
      icon: Lock,
      color: lockedAttempts > 0 ? 'amber' : 'slate',
      badge: lockedAttempts > 0 ? 'Action Req' : null
    },
    {
      title: 'Unique Accounts',
      value: uniqueAccounts.toLocaleString(),
      caption: 'Distinct identities active',
      icon: Users,
      color: 'blue',
      badge: null
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-4 shadow-xs animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#15241C]" />
              <div className="w-12 h-4 rounded-full bg-slate-100 dark:bg-[#15241C]" />
            </div>
            <div className="w-16 h-3 rounded bg-slate-100 dark:bg-[#15241C] mb-2" />
            <div className="w-24 h-7 rounded bg-slate-200 dark:bg-[#1A3125] mb-2" />
            <div className="w-20 h-2.5 rounded bg-slate-100 dark:bg-[#15241C]" />
          </div>
        ))}
      </div>
    );
  }

  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      text: 'text-[#00C471]',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800/50',
      text: 'text-rose-500',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
    },
    blue: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      border: 'border-sky-200 dark:border-sky-800/50',
      text: 'text-sky-500',
      badgeBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400'
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-900/40',
      border: 'border-slate-200 dark:border-slate-800/50',
      text: 'text-slate-400',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => {
        const style = colorStyles[c.color] || colorStyles.slate;
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-4 shadow-xs transition-all hover:border-slate-300 dark:hover:border-[#244433] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${style.bg} ${style.border} ${style.text}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {c.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badgeBg}`}>
                  {c.badge}
                </span>
              )}
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.title}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {c.value}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {c.caption}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
