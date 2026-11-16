/**
 * @file AssetDetailModal.jsx
 * @description Comprehensive detail inspection modal for hardware & software assets.
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1 to 23.6)
 * - Design System: Forest & Emerald (#00C471 brand primary, #111D17 dark surface, #1A3125 dark border).
 * - Interactive Row Click: Displays full hardware specifications, custodian info, warranty, and context actions.
 */

import React from 'react';
import {
  X,
  Laptop,
  Cpu,
  HardDrive,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  UserCheck,
  Clock,
  Wrench,
  DollarSign,
  Tag,
  Building2,
  Briefcase,
  CheckCircle2,
  Archive,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';

export const AssetDetailModal = ({
  isOpen,
  onClose,
  asset,
  onAssign,
  onReturn,
  onRepair,
  onReportIssue,
  isOwnAsset = false,
  canManage = false
}) => {
  if (!isOpen || !asset) return null;

  const statusConfig = {
    available: {
      label: 'Available in Inventory',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
    },
    assigned: {
      label: 'Assigned to Custodian',
      badgeClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60'
    },
    under_repair: {
      label: 'Under Service Repair',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
    },
    retired: {
      label: 'Decommissioned / Retired',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    },
    lost: {
      label: 'Reported Missing / Lost',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
    }
  };

  const statusInfo = statusConfig[asset.status] || {
    label: asset.status?.replace('_', ' ') || 'Unknown',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const assignedEmp = asset.assignedTo;
  const assignedEmpName = assignedEmp
    ? (assignedEmp.name || `${assignedEmp.firstName || ''} ${assignedEmp.lastName || ''}`.trim() || assignedEmp.employeeCode)
    : null;

  const costFormatted = asset.purchaseCostPaisa
    ? `PKR ${(asset.purchaseCostPaisa / 100).toLocaleString('en-PK')}`
    : 'Not Recorded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-[#1A3125] shrink-0 bg-slate-50/50 dark:bg-[#0B1511]/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125] shrink-0">
              <Laptop className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {asset.assetTag}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                  {statusInfo.label}
                </span>
                {asset.hasOpenIssue && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Issue Ticket Open
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                {asset.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close asset details"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Hardware & Specifications Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Equipment Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Category Type</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">
                  {asset.type?.replace('_', ' ') || 'Hardware'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Serial Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-emerald-400">
                  {asset.serialNumber || 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Model</span>
                <span className="font-medium text-slate-900 dark:text-white truncate block">
                  {asset.modelNumber || 'Standard Model'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Processor (CPU)</span>
                <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {asset.specifications?.processor || 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Memory (RAM)</span>
                <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {asset.specifications?.ramGb ? `${asset.specifications.ramGb} GB` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Storage (SSD/HDD)</span>
                <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {asset.specifications?.storageGb ? `${asset.specifications.storageGb} GB` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Custodian */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Current Custodian & Assignment
            </h4>
            {assignedEmp ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shrink-0 text-xs">
                    {assignedEmp.avatar ? (
                      <img src={assignedEmp.avatar} alt={assignedEmpName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      assignedEmpName?.slice(0, 2).toUpperCase() || 'EMP'
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="truncate">{assignedEmpName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300">
                        {assignedEmp.employeeCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {assignedEmp.designationId?.title || assignedEmp.designation || 'Staff'} · {assignedEmp.departmentId?.name || assignedEmp.department || 'Department'}
                    </div>
                  </div>
                </div>

                {canManage && onReturn && (
                  <button
                    onClick={() => {
                      onClose();
                      onReturn(asset);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E362B] transition-colors cursor-pointer shrink-0"
                  >
                    Return to Inventory
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-[#1A3125] text-center text-slate-400">
                <p>Not assigned to any custodian. Equipment is currently available in corporate storage.</p>
                {canManage && onAssign && (
                  <button
                    onClick={() => {
                      onClose();
                      onAssign(asset);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00C471] text-white hover:bg-[#049856] transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Assign Custodian
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Financial & Warranty Details */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Procurement & Warranty Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Purchase Cost</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {costFormatted}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Purchase Date</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {asset.purchaseDate ? formatDate(asset.purchaseDate) : 'Not Specified'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
                <span className="text-slate-400 block text-[10px]">Warranty Expiry</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {asset.warrantyExpiresAt ? formatDate(asset.warrantyExpiresAt) : 'No Warranty Recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Maintenance & Issues */}
          {asset.issues && asset.issues.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Issue Tickets & Maintenance ({asset.issues.length})
              </h4>
              <div className="space-y-2">
                {asset.issues.slice(0, 3).map((issue, idx) => (
                  <div key={issue._id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125] flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {issue.issueType?.replace('_', ' ') || 'Defect'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          issue.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">{issue.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatDate(issue.reportedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0B1511]/50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E362B] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isOwnAsset && onReportIssue && (
              <button
                onClick={() => {
                  onClose();
                  onReportIssue(asset);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Report Issue
              </button>
            )}
            {canManage && asset.status === 'available' && onAssign && (
              <button
                onClick={() => {
                  onClose();
                  onAssign(asset);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] text-white hover:bg-[#049856] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" /> Assign Custodian
              </button>
            )}
            {canManage && asset.status === 'assigned' && onReturn && (
              <button
                onClick={() => {
                  onClose();
                  onReturn(asset);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E362B] transition-colors cursor-pointer"
              >
                Return Asset
              </button>
            )}
            {canManage && asset.status !== 'under_repair' && onRepair && (
              <button
                onClick={() => {
                  onClose();
                  onRepair(asset);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" /> Send for Repair
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailModal;
