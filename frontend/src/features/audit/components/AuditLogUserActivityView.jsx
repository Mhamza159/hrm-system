/**
 * @file AuditLogUserActivityView.jsx
 * @description Actor-centric Grouped User Activity View for System Audit Logs.
 */

import React from 'react';
import { User, Eye, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';

export const AuditLogUserActivityView = ({ items = [], onInspect }) => {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        No user activity recorded matching current criteria.
      </div>
    );
  }

  // Group events by actorEmail
  const userGroups = items.reduce((acc, log) => {
    const actor = log.actorEmail || 'System';
    if (!acc[actor]) {
      acc[actor] = {
        email: actor,
        role: log.actorRole || 'SYSTEM',
        events: []
      };
    }
    acc[actor].events.push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.values(userGroups).map((user) => {
        const total = user.events.length;
        const successes = user.events.filter((e) => e.status === 'SUCCESS').length;
        const failures = total - successes;
        const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
        const latestEvent = user.events[0];

        return (
          <div
            key={user.email}
            className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            {/* User Profile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                  {user.email[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground truncate max-w-[200px]" title={user.email}>
                    {user.email}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {user.role}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {total} activities
                    </span>
                  </div>
                </div>
              </div>

              {/* Health pill */}
              <div className="text-right">
                <span className="text-xs font-bold text-foreground">{successRate}%</span>
                <div className="text-[10px] text-muted-foreground">Success Rate</div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/30 rounded-xl text-center text-xs">
              <div>
                <span className="font-bold text-foreground">{total}</span>
                <p className="text-[10px] text-muted-foreground">Operations</p>
              </div>
              <div>
                <span className="font-bold text-emerald-500">{successes}</span>
                <p className="text-[10px] text-muted-foreground">Succeeded</p>
              </div>
              <div>
                <span className="font-bold text-rose-500">{failures}</span>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Recent Actions List */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Actions
              </span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {user.events.slice(0, 5).map((ev) => (
                  <div
                    key={ev._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {ev.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="font-mono font-medium truncate text-[11px]">
                        {ev.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(ev.createdAt, 'HH:mm')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspect(ev)}
                        className="text-primary hover:text-primary/80"
                        title="Inspect Record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> Last Active: {formatDate(latestEvent?.createdAt, 'DD MMM HH:mm')}
              </span>
              <span>IP: {latestEvent?.ipAddress || 'Internal'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
