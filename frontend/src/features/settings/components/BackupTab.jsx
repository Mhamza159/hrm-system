/**
 * @file BackupTab.jsx
 * @description Disaster Recovery, Database Snapshots Archive & Secure Off-Site Downloads (Slice 2.10).
 */

import React, { useState } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  CheckCircle2,
  FileCheck,
  Calendar,
  Lock,
  Layers,
  FileArchive,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetBackupStatusQuery,
  useGetBackupsListQuery,
  useTriggerBackupMutation,
  useVerifyBackupIntegrityMutation
} from '../settingsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

export function BackupTab() {
  const { isSuperAdmin } = useAuth();
  const { data: statusRes, isLoading: isFetchingStatus, refetch: refetchStatus } = useGetBackupStatusQuery();
  const { data: listRes, isLoading: isFetchingList, refetch: refetchList } = useGetBackupsListQuery();
  const [triggerBackup, { isLoading: isBackingUp }] = useTriggerBackupMutation();
  const [verifyBackup, { isLoading: isVerifying }] = useVerifyBackupIntegrityMutation();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [verificationReport, setVerificationReport] = useState(null);

  const status = statusRes?.data || {};
  const backupsList = listRes?.data || [];
  const lastBackup = status.lastBackup;

  const handleBackupNow = async () => {
    try {
      const res = await triggerBackup().unwrap();
      toast.success(res.message || 'Database snapshot created successfully');
      setShowConfirmModal(false);
      refetchStatus();
      refetchList();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to generate database backup');
      setShowConfirmModal(false);
    }
  };

  const handleVerifyIntegrity = async (filename) => {
    try {
      const res = await verifyBackup(filename).unwrap();
      setVerificationReport(res.data);
      toast.success('Backup archive integrity verified successfully');
    } catch (err) {
      toast.error(err.data?.message || 'Verification failed on archive');
    }
  };

  const handleDownload = (filename) => {
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/v1/settings/backups/${encodeURIComponent(filename)}/download`;
    // Trigger download via anchor or window
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloading backup archive: ${filename}`);
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Engine Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Nightly automated midnight export</span>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Latest Snapshot</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white truncate">
            {lastBackup ? formatBytes(lastBackup.sizeBytes) : 'No Backups'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            {lastBackup ? formatDate(lastBackup.timestamp) : 'Run initial backup now'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Preserved Archives</span>
            <FileArchive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {status.totalBackups || backupsList.length || 0} Snapshots
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Stored in cold recovery vault
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
            Automated rolling purge policy
          </span>
        </div>
      </div>

      {/* Manual Backup Trigger Section */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              On-Demand Database Snapshot Generation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exports a full concurrent JSON snapshot of all system collections across employees, attendance, payroll, and settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isBackingUp || !isSuperAdmin}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exporting Snapshot...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Create Backup Snapshot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preserved Backup Archives Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-emerald-500" />
            Preserved Backup Archives ({backupsList.length})
          </h3>
          <button
            type="button"
            onClick={() => {
              refetchStatus();
              refetchList();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh List
          </button>
        </div>

        {isFetchingList ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            Loading backup catalog...
          </div>
        ) : backupsList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <p>No backup archives found in local recovery storage.</p>
            <p className="text-[11px] text-slate-500">Click "Create Backup Snapshot" above to generate your first baseline archive.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3">Archive Filename</th>
                  <th className="px-4 py-3">Timestamp (PKT)</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {backupsList.map((file, idx) => (
                  <tr key={file.filename || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate max-w-[280px]">{file.filename}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerifyIntegrity(file.filename)}
                          disabled={isVerifying}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans font-medium transition-colors cursor-pointer"
                        >
                          Verify Integrity
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file.filename)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800/60 font-sans font-semibold transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Non-Destructive Integrity Report Modal */}
      {verificationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Backup Integrity Verified
                </h4>
                <p className="text-xs text-slate-500 font-mono truncate max-w-[280px]">
                  {verificationReport.filename}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Database Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{verificationReport.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Collections Sampled:</span>
                <span className="font-bold text-slate-900 dark:text-white">{verificationReport.collectionsCount} collections</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Total Documents Preserved:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{verificationReport.totalRecords.toLocaleString()} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Integrity Check:</span>
                <span className="text-emerald-600 font-bold">Passed (Zero Corruption)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setVerificationReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Snapshot Generation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Manual Database Backup
                </h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to trigger a manual database export snapshot?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              This process executes non-blocking read streams across all collections. The resulting archive will be stored in local server storage and preserved for 30 days.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBackupNow}
                disabled={isBackingUp}
                className="px-4 py-2 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {isBackingUp ? 'Exporting...' : 'Yes, Create Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
