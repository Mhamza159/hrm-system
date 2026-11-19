/**
 * @file AuditLogTableView.jsx
 * @description Master High-Density Enterprise Table View for System Audit Trails.
 * Refined with full Actor Identity cards, semantic tinted pills, and Elvara theme tokens.
 */

import React from 'react';
import { Eye, Monitor, Smartphone, Tablet, Bot } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';
import {
  getStatusBadgeClass,
  getSeverityBadgeClass,
  getCategoryBadgeClass,
  AUDIT_BUTTON_STYLES
} from '../utils/auditTheme.js';

export const AuditLogTableView = ({ items = [], onInspect }) => {
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
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3.5 px-4">Timestamp (PKT)</th>
            <th className="py-3.5 px-4 min-w-[220px]">Actor Identity</th>
            <th className="py-3.5 px-4">Action & Severity</th>
            <th className="py-3.5 px-4">Module / Target</th>
            <th className="py-3.5 px-4 min-w-[200px]">Description</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Device & IP</th>
            <th className="py-3.5 px-4 text-right">Forensics</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((log) => {
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
              <tr
                key={log._id}
                className="hover:bg-muted/40 transition-colors duration-150"
              >
                {/* Timestamp */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-foreground">
                    {formatDate(log.createdAt, 'DD MMM YYYY')}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {formatDate(log.createdAt, 'HH:mm:ss')}
                  </div>
                </td>

                {/* Actor Identity Card */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    {actor.avatar ? (
                      <img
                        src={actor.avatar}
                        alt={actor.name}
                        className="w-9 h-9 rounded-full object-cover border border-border shadow-xs shrink-0"
                      />
                    ) : actor.isSystem ? (
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-border">
                        <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {actorInitials}
                      </div>
                    )}

                    <div className="truncate max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate" title={actor.name}>
                          {actor.name}
                        </span>
                        {actor.employeeCode && actor.employeeCode !== 'N/A' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/80 shrink-0">
                            {actor.employeeCode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground truncate">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {actor.role}
                        </span>
                        <span>•</span>
                        <span className="truncate" title={actor.department}>
                          {actor.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Action & Severity */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-mono font-semibold text-foreground text-[11px]">
                    {log.action}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
                        getSeverityBadgeClass(log.severity)
                      )}
                    >
                      {log.severity || 'LOW'}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-medium px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
                        getCategoryBadgeClass(log.category)
                      )}
                    >
                      {log.category || 'DATA_CHANGE'}
                    </span>
                  </div>
                </td>

                {/* Module / Target */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold capitalize text-foreground">
                    {log.module}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    Target: {log.targetModel || 'Resource'}
                  </div>
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 max-w-[240px]">
                  <p className="text-muted-foreground truncate text-xs" title={log.description}>
                    {log.description || 'System state mutation recorded'}
                  </p>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                      getStatusBadgeClass(log.status)
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

                {/* Device & IP */}
                <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    {getDeviceIcon(log.device?.deviceType)}
                    <span className="truncate max-w-[120px]">
                      {log.device?.browser || 'Browser'} on {log.device?.os || 'OS'}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    IP: {log.ipAddress || 'Internal'}
                  </div>
                </td>

                {/* Forensics Action Button */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onInspect(log)}
                    className={AUDIT_BUTTON_STYLES.secondary}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#00C471]" />
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
