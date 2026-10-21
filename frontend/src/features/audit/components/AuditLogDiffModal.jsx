/**
 * @file AuditLogDiffModal.jsx
 * @description Forensic modal displaying property-level before/after diff for audit records.
 */

import React from 'react';
import { X, ShieldAlert, ArrowRight, Clock, User, Layers } from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                Audit Record Forensics: {log.action}
              </h3>
              <p className="text-xs text-muted-foreground">ID: {log._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20 border-b border-border text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Actor</div>
              <div className="font-medium truncate">{log.actorEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Module / Target</div>
              <div className="font-medium truncate">{log.module} / {log.targetModel || 'N/A'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Recorded At</div>
              <div className="font-medium truncate">{formatDate(log.createdAt, 'DD MMM YYYY, HH:mm')}</div>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Client IP</div>
            <div className="font-medium truncate">{log.ipAddress || 'Internal'}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Diff Grid */}
          {allKeys.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span>State Transition Diff</span>
                <span className="text-xs font-normal text-muted-foreground">
                  (Before <ArrowRight className="inline w-3 h-3 mx-1" /> After)
                </span>
              </h4>
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {allKeys.map((key) => {
                  const bVal = beforeData?.[key];
                  const aVal = afterData?.[key];
                  const isChanged = JSON.stringify(bVal) !== JSON.stringify(aVal);

                  return (
                    <div
                      key={key}
                      className={`grid grid-cols-1 md:grid-cols-3 gap-2 p-3 text-xs ${
                        isChanged ? 'bg-amber-500/5' : 'bg-background'
                      }`}
                    >
                      <div className="font-mono font-medium text-foreground flex items-center gap-1.5">
                        {isChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {key}
                      </div>
                      <div className="font-mono text-rose-500 bg-rose-500/10 p-2 rounded break-all">
                        {bVal !== undefined ? JSON.stringify(bVal, null, 1) : '<empty>'}
                      </div>
                      <div className="font-mono text-emerald-500 bg-emerald-500/10 p-2 rounded break-all">
                        {aVal !== undefined ? JSON.stringify(aVal, null, 1) : '<deleted>'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/30 border border-border rounded-xl text-center text-xs text-muted-foreground">
              No direct property-level before/after diff captured for this action event.
            </div>
          )}

          {/* Additional Context Metadata */}
          {Object.keys(extraDetails).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Additional Metadata</h4>
              <pre className="p-3 bg-muted/40 border border-border rounded-xl text-xs font-mono overflow-x-auto text-foreground">
                {JSON.stringify(extraDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            Close Forensics
          </button>
        </div>
      </div>
    </div>
  );
};
