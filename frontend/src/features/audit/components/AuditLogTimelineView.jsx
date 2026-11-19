/**
 * @file AuditLogTimelineView.jsx
 * @description Chronological Interactive Timeline Stream for System Audit Logs.
 * Enriched with complete Actor identity, semantic badges, and polished connectors.
 */

import React from 'react';
import { Eye, Clock, CheckCircle2, AlertTriangle, Bot } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';
import {
  getStatusBadgeClass,
  getSeverityBadgeClass,
  getCategoryBadgeClass,
  AUDIT_BUTTON_STYLES
} from '../utils/auditTheme.js';

export const AuditLogTimelineView = ({ items = [], onInspect }) => {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        No audit activity found for this timeline slice.
      </div>
    );
  }

  // Group events by date (PKT formatted)
  const grouped = items.reduce((acc, log) => {
    const dateStr = formatDate(log.createdAt, 'DD MMMM YYYY');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {Object.entries(grouped).map(([date, logs]) => (
        <div key={date} className="space-y-4">
          {/* Date Header Badge */}
          <div className="sticky top-0 z-10 flex items-center gap-2">
            <span className="px-3.5 py-1 bg-card/90 backdrop-blur-md border border-border text-xs font-bold text-foreground rounded-full shadow-sm">
              {date}
            </span>
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[11px] text-muted-foreground font-mono">
              {logs.length} operations recorded
            </span>
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-border/80 space-y-4 ml-4">
            {logs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              const actor = log.actor || {
                name: log.actorEmail?.split('@')[0] || 'System',
                avatar: null,
                employeeCode: 'N/A',
                email: log.actorEmail || 'system',
                role: log.actorRole || 'SYSTEM',
                department: 'General',
                designation: 'Staff',
                isSystem: !log.actorEmail || log.actorEmail === 'system'
              };

              const actorInitials = (actor.name || actor.email || 'S')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={log._id}
                  className="relative group bg-card border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#00C471]/30 transition-all duration-200"
                >
                  {/* Timeline Node Dot */}
                  <div
                    className={cn(
                      'absolute -left-[31px] sm:-left-[39px] top-5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center transition-transform group-hover:scale-125 shadow-xs',
                      isSuccess ? 'bg-[#00C471]' : 'bg-rose-500'
                    )}
                  />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                        {log.action}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border',
                          getCategoryBadgeClass(log.category)
                        )}
                      >
                        {log.module}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                          getSeverityBadgeClass(log.severity)
                        )}
                      >
                        {log.severity || 'LOW'}
                      </span>
                      {log.targetModel && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Target: {log.targetModel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(log.createdAt, 'HH:mm:ss')} (PKT)
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspect(log)}
                        className={AUDIT_BUTTON_STYLES.secondary}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#00C471]" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>

                  {/* Operational Synopsis */}
                  <p className="text-xs text-foreground mb-4 font-normal">
                    {log.description || 'System state mutation executed successfully'}
                  </p>

                  {/* Footer Context with Rich Actor Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
                    {/* Actor Identity */}
                    <div className="flex items-center gap-2.5">
                      {actor.avatar ? (
                        <img
                          src={actor.avatar}
                          alt={actor.name}
                          className="w-7 h-7 rounded-full object-cover border border-border"
                        />
                      ) : actor.isSystem ? (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-border">
                          <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center font-bold text-[10px]">
                          {actorInitials}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">{actor.name}</span>
                        {actor.employeeCode && actor.employeeCode !== 'N/A' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/80">
                            {actor.employeeCode}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-[#00C471]">
                          ({actor.role})
                        </span>
                        <span className="text-muted-foreground text-[11px] hidden md:inline">
                          • {actor.department}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Status */}
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span>IP: {log.ipAddress || 'Internal'}</span>
                      {log.device?.browser && (
                        <span>
                          {log.device.browser} / {log.device.os}
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                          getStatusBadgeClass(log.status)
                        )}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
