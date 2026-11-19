/**
 * @file AuditLogTimelineView.jsx
 * @description Chronological Interactive Timeline Stream for System Audit Logs.
 */

import React from 'react';
import { Eye, Shield, Activity, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';

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
            <span className="px-3 py-1 bg-muted/80 backdrop-blur-md border border-border text-xs font-bold text-foreground rounded-full shadow-sm">
              {date}
            </span>
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[11px] text-muted-foreground font-mono">
              {logs.length} operations
            </span>
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-border/80 space-y-4 ml-4">
            {logs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              return (
                <div
                  key={log._id}
                  className="relative group bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Timeline Node Dot */}
                  <div
                    className={cn(
                      'absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center transition-transform group-hover:scale-125',
                      isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                    )}
                  />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-foreground bg-muted/50 px-2 py-0.5 rounded border border-border">
                        {log.action}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                        {log.module}
                      </span>
                      {log.targetModel && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Target: {log.targetModel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.createdAt, 'HH:mm:ss')} (PKT)
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspect(log)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>

                  {/* Description Synopsis */}
                  <p className="text-xs text-foreground mb-3">
                    {log.description || 'System mutation executed'}
                  </p>

                  {/* Footer Context */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{log.actorEmail}</span>
                      <span className="text-[10px] uppercase font-bold text-primary">({log.actorRole})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span>IP: {log.ipAddress || 'Internal'}</span>
                      {log.device?.browser && (
                        <span>Device: {log.device.browser} / {log.device.os}</span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-semibold',
                          isSuccess ? 'text-emerald-500' : 'text-rose-500'
                        )}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {log.status}
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
