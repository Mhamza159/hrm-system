/**
 * @file AuditLogTableView.jsx
 * @description Master High-Density Enterprise Table View for System Audit Trails.
 */

import React from 'react';
import { Eye, ShieldAlert, Monitor, Smartphone, Tablet } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';

export const AuditLogTableView = ({ items = [], onInspect }) => {
  const getSeverityBadge = (severity = 'LOW') => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getDeviceIcon = (deviceType = 'Desktop') => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'Tablet':
        return <Tablet className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
          <tr>
            <th className="py-3 px-4">Timestamp (PKT)</th>
            <th className="py-3 px-4">Actor</th>
            <th className="py-3 px-4">Action & Severity</th>
            <th className="py-3 px-4">Module / Target</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Device / IP</th>
            <th className="py-3 px-4 text-right">Forensics</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((log) => {
            const isSuccess = log.status === 'SUCCESS';
            return (
              <tr
                key={log._id}
                className="hover:bg-muted/30 transition-colors duration-150"
              >
                {/* Timestamp */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-medium text-foreground">
                    {formatDate(log.createdAt, 'DD MMM YYYY')}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatDate(log.createdAt, 'HH:mm:ss')}
                  </div>
                </td>

                {/* Actor */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 border border-primary/20">
                      {(log.actorEmail || 'S')[0].toUpperCase()}
                    </div>
                    <div className="truncate max-w-[150px]">
                      <div className="font-medium text-foreground truncate" title={log.actorEmail}>
                        {log.actorEmail}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-primary truncate">
                        {log.actorRole}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Action & Severity */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-mono font-semibold text-foreground text-[11px]">
                    {log.action}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider',
                        getSeverityBadge(log.severity)
                      )}
                    >
                      {log.severity || 'LOW'}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                      {log.category}
                    </span>
                  </div>
                </td>

                {/* Module / Target */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-medium capitalize text-foreground">
                    {log.module}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {log.targetModel || 'N/A'}
                  </div>
                </td>

                {/* Description */}
                <td className="py-3 px-4 max-w-[220px]">
                  <p className="text-muted-foreground truncate" title={log.description}>
                    {log.description || 'System state mutation'}
                  </p>
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                      isSuccess
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                      )}
                    />
                    <span>{log.status || 'SUCCESS'}</span>
                  </span>
                </td>

                {/* Device / IP */}
                <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    {getDeviceIcon(log.device?.deviceType)}
                    <span>{log.device?.browser || 'Browser'} / {log.device?.os || 'OS'}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {log.ipAddress || 'Internal'}
                  </div>
                </td>

                {/* Forensics Action */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onInspect(log)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition border border-primary/20 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
