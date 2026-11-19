/**
 * @file AuditRetentionModal.jsx
 * @description Enterprise Modal for Statutory Retention Policy & Audit Archival Management.
 */

import React, { useState } from 'react';
import { X, Archive, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useGetAuditRetentionSummaryQuery, useArchiveAuditLogsMutation } from '../auditApi.js';
import { formatDate } from '../../../lib/formatters.js';
import { toast } from 'sonner';

export const AuditRetentionModal = ({ isOpen, onClose }) => {
  const [olderThanDays, setOlderThanDays] = useState(90);
  const { data: response, isLoading, refetch } = useGetAuditRetentionSummaryQuery(undefined, {
    skip: !isOpen
  });
  const [archiveLogs, { isLoading: isArchiving }] = useArchiveAuditLogsMutation();

  if (!isOpen) return null;

  const retention = response?.data || {
    totalActive: 0,
    totalArchived: 0,
    oldestRecordDate: null,
    newestRecordDate: null,
    statutoryRetentionDays: 365,
    immutablePolicyEnforced: true
  };

  const handleArchive = async () => {
    try {
      const res = await archiveLogs({ olderThanDays }).unwrap();
      toast.success(res?.message || `Archived records successfully`);
      refetch();
    } catch (err) {
      toast.error('Failed to archive records');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Statutory Retention & Archival
              </h3>
              <p className="text-xs text-muted-foreground">
                Forensic policy enforcement & archive management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <span>Fetching retention metadata...</span>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 border border-border rounded-xl">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Active Records</span>
                  <div className="text-lg font-bold text-foreground mt-1">
                    {retention.totalActive.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-500">Searchable in Explorer</span>
                </div>

                <div className="p-3 bg-muted/30 border border-border rounded-xl">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Archived Records</span>
                  <div className="text-lg font-bold text-foreground mt-1">
                    {retention.totalArchived.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Cold Storage</span>
                </div>
              </div>

              {/* Policy Guidelines */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Statutory Compliance Policy</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Under Pakistan Labor and Corporate Compliance Standards, employee and financial records require a minimum retention window of {retention.statutoryRetentionDays} days. Hard deletion is permanently prohibited.
                </p>
                <div className="text-[11px] font-mono text-muted-foreground pt-1 border-t border-primary/10">
                  Oldest active record: {retention.oldestRecordDate ? formatDate(retention.oldestRecordDate, 'DD MMM YYYY') : 'None'}
                </div>
              </div>

              {/* Archival Action Control */}
              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
                <span className="font-bold text-foreground block">
                  Soft-Archive Historical Events:
                </span>
                <div className="flex items-center gap-3">
                  <select
                    value={olderThanDays}
                    onChange={(e) => setOlderThanDays(Number(e.target.value))}
                    className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-medium"
                  >
                    <option value={30}>Older than 30 days</option>
                    <option value={60}>Older than 60 days</option>
                    <option value={90}>Older than 90 days</option>
                    <option value={180}>Older than 180 days</option>
                    <option value={365}>Older than 365 days</option>
                  </select>

                  <button
                    type="button"
                    disabled={isArchiving}
                    onClick={handleArchive}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                    <span>Archive Now</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Archiving flags records as archived, keeping database integrity intact while optimizing active explorer query performance.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
