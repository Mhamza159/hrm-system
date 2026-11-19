/**
 * @file AuditLogUserActivityView.jsx
 * @description Actor-centric Grouped User Activity View for System Audit Logs.
 * Features full Actor credentials, designation, department, and activity health.
 */

import React from 'react';
import { Eye, Bot, User, Clock, ChevronRight } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';
import {
  getStatusBadgeClass,
  getSeverityBadgeClass,
  AUDIT_BUTTON_STYLES
} from '../utils/auditTheme.js';

export const AuditLogUserActivityView = ({ items = [], onInspect }) => {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        No user activity recorded matching current criteria.
      </div>
    );
  }

  // Group events by actor email or fallback key
  const userGroups = items.reduce((acc, log) => {
    const actor = log.actor || {
      name: log.actorEmail?.split('@')[0] || 'System',
      avatar: null,
      employeeCode: 'N/A',
      email: log.actorEmail || 'system',
      role: log.actorRole || 'SYSTEM',
      department: 'General',
      designation: 'Staff',
      accountStatus: 'Active',
      isSystem: !log.actorEmail || log.actorEmail === 'system'
    };

    const groupKey = actor.email || log.actorEmail || 'system';

    if (!acc[groupKey]) {
      acc[groupKey] = {
        actor,
        events: []
      };
    }
    acc[groupKey].events.push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {Object.values(userGroups).map(({ actor, events }) => {
        const total = events.length;
        const successes = events.filter((e) => e.status === 'SUCCESS').length;
        const failures = total - successes;
        const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
        const recentEvents = events.slice(0, 3);

        const actorInitials = (actor.name || actor.email || 'S')
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div
            key={actor.email}
            className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#00C471]/30 transition-all duration-200 space-y-4 flex flex-col justify-between"
          >
            {/* User Profile Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {actor.avatar ? (
                  <img
                    src={actor.avatar}
                    alt={actor.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                  />
                ) : actor.isSystem ? (
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-border">
                    <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                    {actorInitials}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate max-w-[220px]" title={actor.name}>
                      {actor.name}
                    </h4>
                    {actor.employeeCode && actor.employeeCode !== 'N/A' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                        {actor.employeeCode}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground font-mono truncate" title={actor.email}>
                    {actor.email}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {actor.role}
                    </span>
                    <span>•</span>
                    <span className="text-muted-foreground">
                      {actor.designation} ({actor.department})
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Health Pill */}
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-foreground">{successRate}%</span>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Success Rate
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-muted/40 rounded-xl text-center text-xs border border-border/60">
              <div>
                <span className="font-bold text-foreground text-sm">{total}</span>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Operations</p>
              </div>
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{successes}</span>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Succeeded</p>
              </div>
              <div>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{failures}</span>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Failed</p>
              </div>
            </div>

            {/* Recent Activity List Inside User Card */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Recent Operations
              </span>
              <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-card">
                {recentEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="truncate max-w-[240px]">
                      <div className="font-mono font-semibold text-foreground text-[11px] truncate">
                        {ev.action}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {formatDate(ev.createdAt, 'DD MMM, HH:mm')} · {ev.module}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase',
                          getStatusBadgeClass(ev.status)
                        )}
                      >
                        {ev.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspect(ev)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                        title="Inspect event details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
