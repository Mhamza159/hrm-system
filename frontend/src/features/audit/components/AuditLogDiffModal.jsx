/**
 * @file AuditLogDiffModal.jsx
 * @description Enterprise Forensic Inspection & Deep State Diff Modal for Audit Log Records.
 */

import React from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  User,
  Layers,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';
import { cn } from '../../../lib/utils.js';

export const AuditLogDiffModal = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null;

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

  const isSuccess = log.status === 'SUCCESS';

  const formatDiffValue = (val) => {
    if (val === null) return <span className="text-muted-foreground italic">null</span>;
    if (val === undefined) return <span className="text-muted-foreground italic">undefined</span>;
    if (typeof val === 'boolean') {
      return (
        <span className={val ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
          {String(val)}
        </span>
      );
    }
    if (typeof val === 'object') {
      return <pre className="font-mono text-[10px] whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
    }
    return <span className="font-mono">{String(val)}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2.5 rounded-xl border',
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              )}
            >
              {isSuccess ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  Forensic Record: {log.action}
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                    isSuccess
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  )}
                >
                  {log.status || 'SUCCESS'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground uppercase">
                  {log.severity || 'LOW'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Ref ID: {log._id} · Category: {log.category || 'DATA_CHANGE'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Forensic Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20 border-b border-border text-xs">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Actor</div>
              <div className="font-semibold text-foreground truncate" title={log.actorEmail}>{log.actorEmail}</div>
              <div className="text-[10px] text-primary uppercase font-bold">{log.actorRole}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Target Entity</div>
              <div className="font-semibold text-foreground capitalize truncate">{log.module} / {log.targetModel || 'N/A'}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">ID: {log.targetId || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Timestamp (PKT)</div>
              <div className="font-semibold text-foreground">{formatDate(log.createdAt, 'DD MMM YYYY')}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{formatDate(log.createdAt, 'HH:mm:ss')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Monitor className="w-4 h-4 text-purple-500 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Device & IP</div>
              <div className="font-semibold text-foreground truncate">{log.device?.browser || 'Browser'} on {log.device?.os || 'OS'}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">{log.ipAddress || 'Internal'}</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Description Synopsis */}
          {log.description && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground">Operational Summary: </span>
                <span className="text-muted-foreground">{log.description}</span>
              </div>
            </div>
          )}

          {/* State Transition Diff */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>State Transition Diff</span>
                <span className="text-xs font-normal text-muted-foreground">
                  (Before <ArrowRight className="inline w-3 h-3 mx-1" /> After)
                </span>
              </h4>
              {allKeys.length > 0 && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {allKeys.length} properties evaluated
                </span>
              )}
            </div>

            {allKeys.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-border/80 rounded-xl">
                No before/after property mutations recorded for this event.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-muted/40 font-semibold text-muted-foreground">
                  <div>Property Key</div>
                  <div>Prior State (Before)</div>
                  <div>Mutated State (After)</div>
                </div>

                {allKeys.map((key) => {
                  const bVal = beforeData?.[key];
                  const aVal = afterData?.[key];
                  const isChanged = JSON.stringify(bVal) !== JSON.stringify(aVal);
                  const isAdded = bVal === undefined && aVal !== undefined;
                  const isRemoved = bVal !== undefined && aVal === undefined;

                  return (
                    <div
                      key={key}
                      className={cn(
                        'grid grid-cols-1 md:grid-cols-3 gap-2 p-3 transition-colors',
                        isAdded
                          ? 'bg-emerald-500/5'
                          : isRemoved
                          ? 'bg-rose-500/5'
                          : isChanged
                          ? 'bg-amber-500/5'
                          : 'hover:bg-muted/20'
                      )}
                    >
                      {/* Key */}
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-foreground">
                        {isAdded && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        {isRemoved && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                        {isChanged && !isAdded && !isRemoved && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                        <span className="truncate">{key}</span>
                      </div>

                      {/* Before */}
                      <div className="p-2 rounded bg-background/80 border border-border/60 overflow-x-auto">
                        {formatDiffValue(bVal)}
                      </div>

                      {/* After */}
                      <div
                        className={cn(
                          'p-2 rounded border overflow-x-auto',
                          isChanged
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-background/80 border-border/60'
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

          {/* Extra Metadata & Context */}
          {Object.keys(extraDetails).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Event Payload & Execution Context
              </h4>
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <pre className="font-mono text-xs text-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {JSON.stringify(extraDetails, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">
            Immutable Audit Hash · Tamper-proof Record
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
          >
            Close Forensics
          </button>
        </div>
      </div>
    </div>
  );
};
