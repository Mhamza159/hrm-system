/**
 * @file AuditLogDiffModal.jsx
 * @description Enterprise Forensic Inspection & Deep State Diff Modal for Audit Log Records.
 * Redesigned with complete Actor identity profile, execution context, visual mutation matrix, and raw JSON tabs.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  User,
  Layers,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  Copy,
  Check,
  Code,
  Sliders,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';
import {
  getStatusBadgeClass,
  getSeverityBadgeClass,
  getCategoryBadgeClass,
  AUDIT_BUTTON_STYLES
} from '../utils/auditTheme.js';
import { toast } from 'sonner';

export const AuditLogDiffModal = ({ log, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'json'
  const [onlyChanged, setOnlyChanged] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !log) return null;

  const actor = log.actor || {
    name: log.actorEmail?.split('@')[0] || 'System Automation',
    avatar: null,
    employeeCode: 'SYS-CRON',
    email: log.actorEmail || 'system',
    role: log.actorRole || 'SYSTEM',
    department: 'Kernel & Infrastructure',
    designation: 'Background Daemon',
    accountStatus: 'Active',
    isSystem: !log.actorEmail || log.actorEmail === 'system'
  };

  const actorInitials = (actor.name || actor.email || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const beforeData = log.details?.before || null;
  const afterData = log.details?.after || null;
  const extraDetails = { ...log.details };
  delete extraDetails.before;
  delete extraDetails.after;

  // Extract all unique property keys between before and after
  const allKeys = Array.from(
    new Set([
      ...(beforeData && typeof beforeData === 'object' ? Object.keys(beforeData) : []),
      ...(afterData && typeof afterData === 'object' ? Object.keys(afterData) : [])
    ])
  );

  const filteredKeys = onlyChanged
    ? allKeys.filter((key) => {
        const b = beforeData?.[key];
        const a = afterData?.[key];
        return JSON.stringify(b) !== JSON.stringify(a);
      })
    : allKeys;

  const isSuccess = log.status === 'SUCCESS';

  const handleCopyId = () => {
    navigator.clipboard.writeText(log._id);
    setCopiedId(true);
    toast.success('Audit Log Reference ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatDiffValue = (val) => {
    if (val === null) return <span className="text-muted-foreground italic">null</span>;
    if (val === undefined) return <span className="text-muted-foreground italic">undefined</span>;
    if (typeof val === 'boolean') {
      return (
        <span className={val ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
          {String(val)}
        </span>
      );
    }
    if (typeof val === 'object') {
      return (
        <pre className="font-mono text-[10px] whitespace-pre-wrap text-foreground bg-muted/40 p-2 rounded-lg max-h-36 overflow-y-auto">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return <span className="font-mono text-foreground">{String(val)}</span>;
  };

  const getDeviceIcon = (deviceType = 'Desktop') => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-primary" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-primary" />;
      default:
        return <Monitor className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                'p-2.5 rounded-2xl border shrink-0',
                isSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
              )}
            >
              {isSuccess ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
                  Forensic Record: {log.action}
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                    getStatusBadgeClass(log.status)
                  )}
                >
                  {log.status || 'SUCCESS'}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                    getSeverityBadgeClass(log.severity)
                  )}
                >
                  {log.severity || 'LOW'}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider',
                    getCategoryBadgeClass(log.category)
                  )}
                >
                  {log.category || 'DATA_CHANGE'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                <span>Ref ID: {log._id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 hover:text-foreground transition rounded"
                  title="Copy Reference ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span>•</span>
                <span>PKT: {formatDate(log.createdAt, 'DD MMM YYYY, HH:mm:ss')}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Comprehensive Actor Identification Profile */}
          <div className="p-4 sm:p-5 bg-muted/30 border border-border/80 rounded-2xl space-y-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Actor Identity & Authorization Snapshot
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {actor.avatar ? (
                  <img
                    src={actor.avatar}
                    alt={actor.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                  />
                ) : actor.isSystem ? (
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-border">
                    <Bot className="w-7 h-7 text-[#00C471]" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center font-bold text-base shrink-0">
                    {actorInitials}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-foreground tracking-tight">
                      {actor.name}
                    </h4>
                    {actor.employeeCode && actor.employeeCode !== 'N/A' && (
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-card text-foreground border border-border">
                        {actor.employeeCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {actor.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20 text-[11px]">
                      {actor.role}
                    </span>
                    <span className="text-muted-foreground font-medium text-[11px]">
                      {actor.designation} ({actor.department})
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Status Pill */}
              <div className="sm:text-right shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                    actor.accountStatus === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', actor.accountStatus === 'Active' ? 'bg-[#00C471]' : 'bg-rose-500')} />
                  <span>Account: {actor.accountStatus}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Execution Context & Device Diagnostics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-card border border-border rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Target Entity
              </span>
              <div className="font-semibold text-foreground capitalize truncate">
                {log.module} / {log.targetModel || 'N/A'}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                ID: {log.targetId || 'N/A'}
              </div>
            </div>

            <div className="p-3.5 bg-card border border-border rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Client Network & IP
              </span>
              <div className="font-semibold text-foreground font-mono truncate">
                {log.ipAddress || 'Internal Network'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Origin: Standard API / App Client
              </div>
            </div>

            <div className="p-3.5 bg-card border border-border rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Device Diagnostics
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                {getDeviceIcon(log.device?.deviceType)}
                <span>{log.device?.deviceType || 'Desktop'}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                OS: {log.device?.os || 'Unknown OS'}
              </div>
            </div>

            <div className="p-3.5 bg-card border border-border rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Browser & Client
              </span>
              <div className="font-semibold text-foreground truncate">
                {log.device?.browser || 'Browser Client'}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate" title={log.userAgent}>
                {log.userAgent || 'Direct RPC / API'}
              </div>
            </div>
          </div>

          {/* Section 3: Operational Summary Synopsis */}
          {log.description && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground text-xs block mb-0.5">
                  Operational Synopsis:
                </span>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {log.description}
                </p>
              </div>
            </div>
          )}

          {/* Failure Alert Box (if operation failed) */}
          {!isSuccess && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-700 dark:text-rose-300 text-xs block mb-0.5">
                  Execution Failure Notice:
                </span>
                <p className="text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
                  The requested operation encountered errors or policy violations and could not be completed successfully. All execution parameters have been logged to the immutable ledger.
                </p>
              </div>
            </div>
          )}

          {/* Section 4: State Transition Diff / Payload Inspector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('diff')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer',
                    activeTab === 'diff'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Visual Mutation Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer',
                    activeTab === 'json'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Raw Forensic JSON</span>
                </button>
              </div>

              {/* Filter toggle for diff */}
              {activeTab === 'diff' && allKeys.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyChanged}
                    onChange={(e) => setOnlyChanged(e.target.checked)}
                    className="rounded border-border text-[#00C471] focus:ring-[#00C471]"
                  />
                  <span>Show only modified fields ({filteredKeys.length})</span>
                </label>
              )}
            </div>

            {/* Tab 1: Visual State Diff */}
            {activeTab === 'diff' && (
              <div>
                {filteredKeys.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-border rounded-2xl">
                    No before/after property mutations recorded for this event.
                  </div>
                ) : (
                  <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border text-xs">
                    {/* Diff Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-900/60 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                      <div>Property Identifier</div>
                      <div>Prior State (Before)</div>
                      <div>Mutated State (After)</div>
                    </div>

                    {filteredKeys.map((key) => {
                      const bVal = beforeData?.[key];
                      const aVal = afterData?.[key];
                      const isChanged = JSON.stringify(bVal) !== JSON.stringify(aVal);
                      const isAdded = bVal === undefined && aVal !== undefined;
                      const isRemoved = bVal !== undefined && aVal === undefined;

                      return (
                        <div
                          key={key}
                          className={cn(
                            'grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 transition-colors',
                            isAdded
                              ? 'bg-emerald-50/40 dark:bg-emerald-500/5'
                              : isRemoved
                              ? 'bg-rose-50/40 dark:bg-rose-500/5'
                              : isChanged
                              ? 'bg-amber-50/40 dark:bg-amber-500/5'
                              : 'hover:bg-muted/30'
                          )}
                        >
                          {/* Key */}
                          <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
                            {isAdded && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                                ADDED
                              </span>
                            )}
                            {isRemoved && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400">
                                REMOVED
                              </span>
                            )}
                            {isChanged && !isAdded && !isRemoved && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                                MODIFIED
                              </span>
                            )}
                            <span className="truncate">{key}</span>
                          </div>

                          {/* Before State */}
                          <div className="p-2.5 rounded-xl bg-background/80 border border-border/80 overflow-x-auto">
                            {formatDiffValue(bVal)}
                          </div>

                          {/* After State */}
                          <div
                            className={cn(
                              'p-2.5 rounded-xl border overflow-x-auto',
                              isChanged
                                ? 'bg-emerald-50/20 border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-background/80 border-border/80'
                            )}
                          >
                            {formatDiffValue(aVal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Raw JSON Inspector */}
            {activeTab === 'json' && (
              <div className="space-y-3">
                <div className="p-4 bg-muted/40 border border-border rounded-2xl relative">
                  <pre className="font-mono text-xs text-foreground overflow-x-auto max-h-80 whitespace-pre-wrap">
                    {JSON.stringify(log.details || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono text-[11px]">
            Immutable Cryptographic Ledger · Tamper-proof Evidence
          </span>
          <button
            type="button"
            onClick={onClose}
            className={AUDIT_BUTTON_STYLES.secondary}
          >
            Close Forensic Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
