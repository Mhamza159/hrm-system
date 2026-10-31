/**
 * @file AssetDetailPage.jsx
 * @description Comprehensive Asset Profile, Hardware Specs & Interactive Lifecycle Timeline View.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.2, 23.4, 23.6)
 * - Layer: Frontend Page View
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
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  HardDrive,
  FileText,
  User
} from 'lucide-react';
import { useGetAssetByIdQuery, useUpdateAssetRepairMutation } from '../assetApi.js';
import { AssetAssignModal } from '../components/AssetAssignModal.jsx';
import { AssetReturnModal } from '../components/AssetReturnModal.jsx';
import { AssetRepairModal } from '../components/AssetRepairModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'repairs' | 'issues'
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  const { data: assetRes, isLoading } = useGetAssetByIdQuery(id);
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

  if (isLoading) {
    return <div className="p-16 text-center text-xs text-slate-400">Loading asset profile...</div>;
  }

  if (!asset) {
    return (
      <div className="p-16 text-center space-y-3">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Asset Not Found</h3>
        <button
          onClick={() => navigate('/assets')}
          className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold underline"
        >
          Return to Asset Registry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Asset Register</span>
      </button>

      {/* Main Hero Card */}
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#1E2235]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
              <Laptop className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {asset.assetTag}
                </span>
                <span className="text-xs font-medium text-slate-400 capitalize">
                  {asset.type.replace('_', ' ')}
                </span>
                {asset.hasOpenIssue && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="w-3 h-3" />
                    Open Defect Issue
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{asset.name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Serial No: {asset.serialNumber} {asset.modelNumber ? `· Model: ${asset.modelNumber}` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <Can I="asset.assign" a="Asset">
            <div className="flex items-center gap-2 flex-wrap">
              {asset.status === 'available' && (
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Custodian</span>
                </button>
              )}

              {asset.status === 'assigned' && (
                <button
                  onClick={() => setReturnModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return to Store</span>
                </button>
              )}

              {asset.status !== 'under_repair' && asset.status !== 'retired' && (
                <button
                  onClick={() => setRepairModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#151926] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E2235] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Send for Repair</span>
                </button>
              )}
            </div>
          </Can>
        </div>

        {/* Specifications & Financials Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Current Status</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
              {asset.status.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Current Custodian</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {asset.assignedTo
                ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName} (${asset.assignedTo.employeeCode})`
                : 'Available in Central Inventory'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Purchase Value</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {asset.purchaseCostPaisa
                ? `PKR ${(asset.purchaseCostPaisa / 100).toLocaleString()}`
                : 'Not recorded'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Warranty Expiry</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {asset.warrantyExpiresAt
                ? new Date(asset.warrantyExpiresAt).toLocaleDateString()
                : 'None'}
            </p>
          </div>
        </div>

        {/* Technical Specs Details */}
        {(asset.specifications?.processor || asset.specifications?.ramGb || asset.specifications?.storageGb || asset.specifications?.os) && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E2235] flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
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

      {/* Tabs Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2235] pb-2">
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
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Lifecycle History Timeline */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl p-6 shadow-xs">
            {(!asset.history || asset.history.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No history events recorded.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#1E2235]">
                {asset.history.slice().reverse().map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F111A]" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {event.action.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(event.date).toLocaleString()}
                        </span>
                        {event.condition && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                            Condition: {event.condition}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {event.notes || 'No remarks logged.'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Action performed by: {event.performedBy?.name || 'System'}
                        {event.employeeId && ` · Custodian: ${event.employeeId.firstName || ''} ${event.employeeId.lastName || ''}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Service & Repairs */}
        {activeTab === 'repairs' && (
          <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl p-6 shadow-xs space-y-4">
            {(!asset.repairs || asset.repairs.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No repair tickets on record.</p>
            ) : (
              asset.repairs.map((rep) => (
                <div
                  key={rep._id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-[#1E2235] bg-slate-50/50 dark:bg-[#151926]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{rep.vendorName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{rep.issueDescription}</p>
                    <p className="text-[11px] text-slate-400">
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
          <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl p-6 shadow-xs space-y-4">
            {(!asset.issues || asset.issues.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No defects or issues reported.</p>
            ) : (
              asset.issues.map((issue) => (
                <div
                  key={issue._id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-[#1E2235] bg-slate-50/50 dark:bg-[#151926]/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {issue.issueType.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 capitalize">
                      Severity: {issue.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{issue.description}</p>
                  <p className="text-[11px] text-slate-400">
                    Reported by: {issue.reportedBy?.firstName || 'Employee'} {issue.reportedBy?.lastName || ''} on {new Date(issue.reportedAt).toLocaleDateString()}
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
