/**
 * @file AuditRetentionModal.jsx
 * @description Enterprise Modal for Statutory Retention Policy & Audit Archival Management.
 * Features Pakistan labor law compliance standards, active/archived metrics, and a guarded two-step archival workflow.
 */

import React, { useState } from 'react';
import { X, Archive, ShieldCheck, AlertTriangle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useGetAuditRetentionSummaryQuery, useArchiveAuditLogsMutation } from '../auditApi.js';
import { formatDate } from '../../../lib/formatters.js';
import { toast } from 'sonner';
import { AUDIT_BUTTON_STYLES } from '../utils/auditTheme.js';

export const AuditRetentionModal = ({ isOpen, onClose }) => {
  const [olderThanDays, setOlderThanDays] = useState(365);
  const [confirmStep, setConfirmStep] = useState(false);

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
      setConfirmStep(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive records');
    }
  };

  const handleModalClose = () => {
    setConfirmStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Statutory Retention & Archival Console
              </h3>
              <p className="text-xs text-muted-foreground">
                Pakistan Labor Compliance & Append-Only Record Management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground space-y-3">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#00C471]" />
              <p>Fetching immutable retention metadata from cluster...</p>
            </div>
          ) : (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    Active Records
                  </span>
                  <div className="text-xl font-bold text-foreground">
                    {retention.totalActive.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Searchable in Explorer
                  </span>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    Archived Records
                  </span>
                  <div className="text-xl font-bold text-foreground">
                    {retention.totalArchived.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Immutable Cold Storage
                  </span>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    Statutory Rule
                  </span>
                  <div className="text-xl font-bold text-foreground">
                    {retention.statutoryRetentionDays} Days
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Mandatory Pakistan Law
                  </span>
                </div>
              </div>

              {/* Policy Mandate Card */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Labor Compliance Policy Mandate</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Under Pakistan Labor and Corporate Compliance Standards, employee and financial records require a minimum retention window of {retention.statutoryRetentionDays} days. Hard deletion is permanently prohibited; historical records are soft-archived to preserve database performance while maintaining complete legal immutability.
                </p>
                <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t border-emerald-200/50 dark:border-emerald-500/10 flex items-center justify-between">
                  <span>Oldest Record: {retention.oldestRecordDate ? formatDate(retention.oldestRecordDate, 'DD MMM YYYY') : 'None'}</span>
                  <span>Newest: {retention.newestRecordDate ? formatDate(retention.newestRecordDate, 'DD MMM YYYY') : 'Live'}</span>
                </div>
              </div>

              {/* Step 1: Configuration */}
              {!confirmStep ? (
                <div className="p-4 sm:p-5 bg-card border border-border rounded-2xl space-y-3.5">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      Soft-Archive Historical Events
                    </h4>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Select the age threshold to transition older audit records to cold archive.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <select
                      value={olderThanDays}
                      onChange={(e) => setOlderThanDays(Number(e.target.value))}
                      className="px-3.5 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471]"
                    >
                      <option value={90}>Older than 90 days</option>
                      <option value={180}>Older than 180 days</option>
                      <option value={365}>Older than 365 days (Statutory Recommended)</option>
                      <option value={730}>Older than 730 days (2 Years)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setConfirmStep(true)}
                      className={AUDIT_BUTTON_STYLES.primary}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Review Archival Scope</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Guarded Two-Step Confirmation */
                <div className="p-5 bg-amber-50/70 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                        Confirm Archival Execution
                      </h4>
                      <p className="text-amber-800 dark:text-amber-300 text-xs mt-1 leading-relaxed">
                        Are you sure you want to soft-archive audit records older than{' '}
                        <strong className="underline">{olderThanDays} days</strong>?
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-amber-800 dark:text-amber-300 text-[11px]">
                        <li>Records will be moved out of primary active search indexes.</li>
                        <li>No data will be deleted or destroyed. Full cryptographic hashes remain intact.</li>
                        <li>Archived records can still be reviewed during formal compliance audits.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isArchiving}
                      onClick={() => setConfirmStep(false)}
                      className={AUDIT_BUTTON_STYLES.secondary}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      disabled={isArchiving}
                      onClick={handleArchive}
                      className={AUDIT_BUTTON_STYLES.primary}
                    >
                      {isArchiving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Archiving Records...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm & Soft-Archive</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono text-[11px]">
            Pakistan Labor Records Mandate · Non-destructive
          </span>
          <button
            type="button"
            onClick={handleModalClose}
            className={AUDIT_BUTTON_STYLES.secondary}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
