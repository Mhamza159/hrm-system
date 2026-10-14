/**
 * @file BackupTab.jsx
 * @description Disaster Recovery & Database Backup Manager (Slice 2.10).
 */

import React, { useState } from 'react';
import { Database, Download, RefreshCw, ShieldCheck, AlertTriangle, HardDrive, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetBackupStatusQuery, useTriggerBackupMutation } from '../settingsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

export function BackupTab() {
  const { isSuperAdmin } = useAuth();
  const { data: statusRes, isLoading: isFetching, refetch } = useGetBackupStatusQuery();
  const [triggerBackup, { isLoading: isBackingUp }] = useTriggerBackupMutation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const status = statusRes?.data || {};
  const lastBackup = status.lastBackup;

  const handleBackupNow = async () => {
    try {
      const res = await triggerBackup().unwrap();
      toast.success(res.message || 'Database snapshot created successfully');
      setShowConfirmModal(false);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to generate database backup');
      setShowConfirmModal(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Backup Engine Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Daily automated midnight export</span>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Latest Snapshot</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white truncate">
            {lastBackup ? formatBytes(lastBackup.sizeBytes) : 'No Backups'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lastBackup ? formatDate(lastBackup.timestamp) : 'Run initial backup now'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Retention Horizon</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {status.retentionDays || 30} Days
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {status.totalBackups || 0} snapshots currently preserved
          </span>
        </div>
      </div>

      {/* Manual Backup Trigger Section */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              On-Demand Disaster Recovery Snapshot
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Creates an atomic timestamped export of all company collections. Backups are stored in local secure vault storage with automated 30-day retention.
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={isBackingUp || !isSuperAdmin}
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:cursor-not-allowed"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Archive...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Backup Now
                </>
              )}
            </button>
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Database backup trigger is strictly restricted to the Super Admin role.</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold">Trigger Manual Backup</h4>
                <p className="text-xs text-slate-500">Initiate immediate database snapshot</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will generate an immediate JSON export archive across all active database collections (users, roles, settings, audit logs) and verify storage health. Are you sure you want to proceed?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isBackingUp}
                onClick={handleBackupNow}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                {isBackingUp ? 'Exporting...' : 'Yes, Create Backup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
