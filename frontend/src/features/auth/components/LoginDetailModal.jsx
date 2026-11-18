/**
 * @file LoginDetailModal.jsx
 * @description Comprehensive inspection modal for authentication attempts with threat correlation.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  Globe,
  Clock,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';
import { useGetLoginHistoryDetailQuery } from '../authApi.js';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { RoleBadge } from '../../../components/common/RoleBadge.jsx';

export function LoginDetailModal({ isOpen, onClose, recordId, initialRecord = null }) {
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedUa, setCopiedUa] = useState(false);
  const [showTechnicalUa, setShowTechnicalUa] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: detailResponse, isLoading } = useGetLoginHistoryDetailQuery(recordId, {
    skip: !isOpen || !recordId
  });

  if (!isOpen) return null;

  const record = detailResponse?.data || initialRecord;

  // Format timestamp strictly to Asia/Karachi timezone
  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-GB', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return String(ts);
    }
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'ip') {
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    } else {
      setCopiedUa(true);
      setTimeout(() => setCopiedUa(false), 2000);
    }
  };

  const getStatusMapping = (status) => {
    switch (status) {
      case 'SUCCESS':
        return { status: 'active', label: 'Success' };
      case 'FAILED':
        return { status: 'rejected', label: 'Failed' };
      case 'LOCKED':
        return { status: 'late', label: 'Locked' };
      case '2FA_PENDING':
        return { status: 'pending', label: '2FA Challenged' };
      case 'RESTRICTED':
      case 'BLOCKED':
        return { status: 'rejected', label: 'Blocked' };
      default:
        return { status: 'inactive', label: status || 'Unknown' };
    }
  };

  const renderDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'MOBILE':
        return <Smartphone className="w-4 h-4 text-slate-500" />;
      case 'TABLET':
        return <Tablet className="w-4 h-4 text-slate-500" />;
      case 'DESKTOP':
        return <Monitor className="w-4 h-4 text-slate-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusMeta = getStatusMapping(record?.status);
  const correlation = record?.securityCorrelation;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1712]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#00C471]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Authentication Attempt Details
                </h3>
                <StatusBadge status={statusMeta.status} label={statusMeta.label} />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatTime(record?.createdAt)} (Asia/Karachi)</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {isLoading && !record ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-[#15241C]" />
              <div className="h-24 rounded-xl bg-slate-100 dark:bg-[#15241C]" />
              <div className="h-24 rounded-xl bg-slate-100 dark:bg-[#15241C]" />
            </div>
          ) : (
            <>
              {/* Threat Correlation Alert (if suspicious) */}
              {correlation?.isSuspiciousOrigin && (
                <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-500/10 text-rose-800 dark:text-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Suspicious Origin Activity</p>
                    <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">
                      Detected {correlation.recentFailuresFromIp} recent authentication failure(s) from this IP origin and {correlation.recentFailuresFromAccount} for this account in the last 24 hours.
                    </p>
                  </div>
                </div>
              )}

              {/* Section A: Account Identity & Organization */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Account Identity</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Employee Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {record?.employeeName && record.employeeName !== 'Unregistered Account' && record.employeeName !== 'Unregistered / Unknown'
                        ? record.employeeName
                        : (record?.email ? record.email.split('@')[0] : 'Unregistered / Unknown')}
                    </span>
                    {record?.employeeCode && (
                      <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300">
                        {record.employeeCode}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Email Identifier</span>
                    <span className="font-mono text-slate-900 dark:text-white break-all">
                      {record?.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Assigned Role</span>
                    {record?.role && record.role !== 'None' ? (
                      <div className="mt-0.5">
                        <RoleBadge role={record.role} size="sm" />
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Department</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {record?.department || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section B: Authentication Outcome & Notice */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authentication Outcome</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Status Code</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {record?.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Notice / Reason</span>
                    <span className={`font-medium ${
                      record?.status === 'SUCCESS'
                        ? 'text-[#00C471]'
                        : record?.status === '2FA_PENDING'
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-rose-500'
                    }`}>
                      {record?.failureReason || (record?.status === 'SUCCESS' ? 'Authentication successful' : '—')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section C: Network & Client Environment */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Network & Environment</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">IP Address Origin</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">
                        {record?.ipAddress || '127.0.0.1'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(record?.ipAddress, 'ip')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Copy IP"
                      >
                        {copiedIp ? <Check className="w-3.5 h-3.5 text-[#00C471]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Location / Network</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {record?.location || 'Local / Private Network'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Device & OS</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {renderDeviceIcon(record?.deviceType)}
                      <span className="capitalize font-medium text-slate-900 dark:text-white">
                        {String(record?.deviceType || 'unknown').toLowerCase()}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {record?.os || 'Unknown OS'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Client Browser</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {record?.browser || 'Unknown Browser'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible Technical User-Agent */}
              <div className="border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTechnicalUa(!showTechnicalUa)}
                  className="w-full px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-[#0E1712]/50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Raw User-Agent Header</span>
                  {showTechnicalUa ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showTechnicalUa && (
                  <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] break-all flex items-start justify-between gap-2">
                    <span>{record?.userAgent || 'None'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(record?.userAgent, 'ua')}
                      className="text-slate-400 hover:text-white shrink-0 p-1 cursor-pointer"
                      title="Copy User-Agent"
                    >
                      {copiedUa ? <Check className="w-3.5 h-3.5 text-[#00C471]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#15241C] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
