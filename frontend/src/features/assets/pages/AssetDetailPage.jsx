/**
 * @file AssetDetailPage.jsx
 * @description Comprehensive Asset Profile, Hardware Specs & Interactive Lifecycle Timeline View.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.2, 23.4, 23.6)
 * - Layer: Frontend Page View
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Laptop,
  ArrowLeft,
  UserCheck,
  RotateCcw,
  Wrench,
  Clock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  HardDrive,
  Mail,
  Phone,
  Building2,
  Briefcase,
  PackageCheck,
  User,
  History,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useGetAssetByIdQuery, useUpdateAssetRepairMutation } from '../assetApi.js';
import { AssetAssignModal } from '../components/AssetAssignModal.jsx';
import { AssetReturnModal } from '../components/AssetReturnModal.jsx';
import { AssetRepairModal } from '../components/AssetRepairModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'repairs' | 'issues'
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  const { data: assetRes, isLoading, isFetching, refetch } = useGetAssetByIdQuery(id);
  const asset = assetRes?.data;

  const [updateRepair] = useUpdateAssetRepairMutation();

  const handleCompleteRepair = async (repairId) => {
    if (window.confirm('Mark this repair as completed and return asset to active service?')) {
      try {
        await updateRepair({
          id: asset._id,
          repairId,
          status: 'completed',
          resolutionNotes: 'Repairs completed and verified operational.'
        }).unwrap();
        toast.success('Repair marked as completed.');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to update repair status.');
      }
    }
  };

  if (isLoading && !asset) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-16 text-center space-y-3">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Asset Not Found</h3>
        <button
          onClick={() => navigate('/assets')}
          className="text-xs text-emerald-600 dark:text-[#00C471] font-semibold underline cursor-pointer"
        >
          Return to Asset Registry
        </button>
      </div>
    );
  }

  const custodian = asset.assignedTo;
  const custodianName = custodian
    ? (custodian.name || `${custodian.firstName || ''} ${custodian.lastName || ''}`.trim() || 'Staff')
    : null;
  const deptName = custodian?.departmentId?.name || custodian?.departmentId?.code || null;
  const desigTitle = custodian?.designationId?.title || custodian?.designationId?.code || null;
  const roleName = custodian?.userId?.roles?.[0]?.name || custodian?.role || null;

  const lastAssignment = asset?.history?.slice().reverse().find((h) => h.action === 'assigned');
  const handoverDate = lastAssignment?.date || asset?.assignedDate || null;
  const handoverCondition = lastAssignment?.condition || asset?.condition || 'good';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Asset Register</span>
      </button>

      {/* Main Hero Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125] shrink-0">
              <Laptop className="w-8 h-8 text-[#00C471]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]">
                  {asset.assetTag}
                </span>
                <span className="text-xs font-medium text-slate-400 capitalize">
                  {asset.type?.replace?.('_', ' ') || asset.type || 'Equipment'}
                </span>
                {asset.hasOpenIssue && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    Open Defect Issue
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">{asset.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Serial No: {asset.serialNumber} {asset.modelNumber ? `· Model: ${asset.modelNumber}` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} />
            <Can I="asset.assign" a="Asset">
              <div className="flex items-center gap-2 flex-wrap">
                {asset.status === 'available' && (
                  <button
                    onClick={() => setAssignModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer hover:shadow-emerald-500/20"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Assign Custodian</span>
                  </button>
                )}

                {asset.status === 'assigned' && (
                  <button
                    onClick={() => setReturnModalOpen(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer hover:shadow-amber-500/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return to Store</span>
                  </button>
                )}

                {asset.status !== 'under_repair' && asset.status !== 'retired' && (
                  <button
                    onClick={() => setRepairModalOpen(true)}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#162820] hover:bg-slate-200 dark:hover:bg-[#1a3125] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Send for Repair</span>
                  </button>
                )}
              </div>
            </Can>
          </div>
        </div>

        {/* Specifications & Financials Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Current Status</p>
            <div className="mt-1 flex items-center gap-1.5">
              {asset.status === 'available' && (
                <span className="font-semibold text-emerald-600 dark:text-[#00C471] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Available in Store
                </span>
              )}
              {asset.status === 'assigned' && (
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Assigned in Custody
                </span>
              )}
              {asset.status === 'under_repair' && (
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> Under Repair
                </span>
              )}
              {asset.status === 'retired' && (
                <span className="font-semibold text-slate-500">Retired / Decommissioned</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-slate-400 font-medium">Assigned Custodian</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
              {custodianName || 'Central Inventory'}
            </p>
          </div>

          <div>
            <p className="text-slate-400 font-medium">Purchase Value</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-1">
              {asset.purchaseCostPaisa
                ? `PKR ${(asset.purchaseCostPaisa / 100).toLocaleString()}`
                : 'Not recorded'}
            </p>
          </div>

          <div>
            <p className="text-slate-400 font-medium">Warranty Expiry</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-1">
              {asset.warrantyExpiresAt
                ? new Date(asset.warrantyExpiresAt).toLocaleDateString()
                : 'None registered'}
            </p>
          </div>
        </div>

        {/* Technical Specs Details */}
        {(asset.specifications?.processor || asset.specifications?.ramGb || asset.specifications?.storageGb || asset.specifications?.os) && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            {asset.specifications.processor && (
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-slate-400" />
                {asset.specifications.processor}
              </span>
            )}
            {asset.specifications.ramGb && (
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="w-4 h-4 text-slate-400" />
                {asset.specifications.ramGb} GB RAM
              </span>
            )}
            {asset.specifications.storageGb && (
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="w-4 h-4 text-slate-400" />
                {asset.specifications.storageGb} GB Storage
              </span>
            )}
            {asset.specifications.os && (
              <span className="flex items-center gap-1.5 font-medium">
                <Laptop className="w-4 h-4 text-slate-400" />
                {asset.specifications.os}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Custodian Profile Card (When Assigned) or Store Banner (When Available) - US1 (T002) */}
      {asset.status === 'assigned' && custodian ? (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs relative overflow-hidden">
          {/* Subtle gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#00C471] to-blue-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Identity lockup */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                {custodian.avatar ? (
                  <img
                    src={custodian.avatar}
                    alt={custodianName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] font-bold text-xl flex items-center justify-center border-2 border-emerald-500/30">
                    {(custodianName?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00C471] ring-4 ring-white dark:ring-[#111D17] flex items-center justify-center text-white text-[9px]">
                  ✓
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {custodianName}
                  </h2>
                  {custodian.employeeCode && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] font-semibold border border-emerald-200 dark:border-[#1A3125]">
                      {custodian.employeeCode}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                    <UserCheck className="w-3 h-3" />
                    Active Custodian
                  </span>
                  {roleName && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                      <Shield className="w-3 h-3 text-amber-500" />
                      Role: {roleName}
                    </span>
                  )}
                </div>

                {/* Designation & Department */}
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                  {desigTitle && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#162820] text-emerald-800 dark:text-[#00C471] font-semibold border border-emerald-200 dark:border-[#1A3125]">
                      <Briefcase className="w-3.5 h-3.5 text-[#00C471]" />
                      Designation: {desigTitle}
                    </span>
                  )}
                  {deptName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-[#1A3125]">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      Department: {deptName}
                    </span>
                  )}
                </div>

                {/* Contact Chips */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                  {custodian.email && (
                    <a
                      href={`mailto:${custodian.email}`}
                      className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-[#00C471] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{custodian.email}</span>
                    </a>
                  )}
                  {custodian.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono tabular-nums">{custodian.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Handover Details Column */}
            <div className="flex md:flex-col justify-between items-start md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-[#1A3125] md:pl-6 text-xs">
              <div>
                <p className="text-slate-400 text-[11px] font-medium">Handover Date</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                  {handoverDate ? new Date(handoverDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-[11px] font-medium">Handover Condition</p>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125] capitalize">
                  {handoverCondition}
                </span>
              </div>

              <Can I="asset.assign" a="Asset">
                <button
                  onClick={() => setReturnModalOpen(true)}
                  className="mt-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Initiate Handover Return</span>
                </button>
              </Can>
            </div>
          </div>
        </div>
      ) : asset.status === 'available' ? (
        <div className="bg-emerald-50/50 dark:bg-[#162820]/50 border border-emerald-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-[#1A3125] shrink-0">
              <PackageCheck className="w-6 h-6 text-[#00C471]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Available in Central Inventory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This asset is currently in store, verified operational, and ready for assignment to any employee.
              </p>
            </div>
          </div>

          <Can I="asset.assign" a="Asset">
            <button
              onClick={() => setAssignModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer hover:shadow-emerald-500/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign to Employee</span>
            </button>
          </Can>
        </div>
      ) : null}

      {/* Tabs Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1A3125] pb-2">
          {[
            { id: 'history', label: `Lifecycle History (${asset.history?.length || 0})` },
            { id: 'repairs', label: `Service & Repairs (${asset.repairs?.length || 0})` },
            { id: 'issues', label: `Reported Issues (${asset.issues?.length || 0})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Lifecycle History Timeline (T007) */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs">
            {(!asset.history || asset.history.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No history events recorded.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#1A3125]">
                {asset.history.slice().reverse().map((event, idx) => {
                  const eventEmp = event.employeeId;
                  const eventEmpName = eventEmp
                    ? (eventEmp.name || `${eventEmp.firstName || ''} ${eventEmp.lastName || ''}`.trim() || eventEmp.employeeCode)
                    : null;
                  const eventDept = eventEmp?.departmentId?.name || eventEmp?.departmentId?.code;

                  return (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#00C471] border-2 border-white dark:border-[#111D17]" />
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white capitalize">
                            {event.action?.replace?.('_', ' ') || event.action || 'Action'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {new Date(event.date).toLocaleString()}
                          </span>
                          {event.condition && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125] capitalize">
                              Condition: {event.condition}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 dark:text-slate-300">
                          {event.notes || 'No remarks logged.'}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 flex-wrap">
                          <span>
                            Authorized by: <strong className="text-slate-700 dark:text-slate-300">{event.performedBy?.name || 'System Administrator'}</strong>
                          </span>
                          {eventEmpName && (
                            <span className="flex items-center gap-1.5">
                              <span>•</span>
                              <span>Custodian:</span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-[#1A3125]">
                                {eventEmpName}
                                {eventEmp.employeeCode && <span className="font-mono text-[10px] text-emerald-600 dark:text-[#00C471]">({eventEmp.employeeCode})</span>}
                                {eventDept && <span className="text-[10px] text-slate-400">· {eventDept}</span>}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Service & Repairs */}
        {activeTab === 'repairs' && (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs space-y-4">
            {(!asset.repairs || asset.repairs.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No repair tickets on record.</p>
            ) : (
              asset.repairs.map((rep) => (
                <div
                  key={rep._id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{rep.vendorName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-[#00C471]'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{rep.issueDescription}</p>
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                      Dispatched: {new Date(rep.sentDate).toLocaleDateString()}
                      {rep.expectedReturnDate && ` · Expected: ${new Date(rep.expectedReturnDate).toLocaleDateString()}`}
                      {rep.repairCostPaisa ? ` · Cost: PKR ${(rep.repairCostPaisa / 100).toLocaleString()}` : ''}
                    </p>
                  </div>

                  {rep.status === 'in_progress' && (
                    <Can I="asset.manage" a="Asset">
                      <button
                        onClick={() => handleCompleteRepair(rep._id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    </Can>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Reported Issues */}
        {activeTab === 'issues' && (
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs space-y-4">
            {(!asset.issues || asset.issues.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No defects or issues reported.</p>
            ) : (
              asset.issues.map((issue) => (
                <div
                  key={issue._id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {issue.issueType?.replace?.('_', ' ') || issue.issueType || 'Issue'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 capitalize">
                      Severity: {issue.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{issue.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                    Reported by: {issue.reportedBy?.name || `${issue.reportedBy?.firstName || ''} ${issue.reportedBy?.lastName || ''}`.trim() || 'Employee'} on {new Date(issue.reportedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AssetAssignModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        asset={asset}
      />
      <AssetReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        asset={asset}
      />
      <AssetRepairModal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        asset={asset}
      />
    </div>
  );
};

export default AssetDetailPage;
