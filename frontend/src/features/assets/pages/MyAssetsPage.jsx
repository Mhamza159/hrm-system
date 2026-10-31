/**
 * @file MyAssetsPage.jsx
 * @description Employee Self-Service Equipment Custody & Issue Flagging View.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.6)
 * - Layer: Frontend Page View
 */

import React, { useState } from 'react';
import {
  Laptop,
  AlertTriangle,
  Calendar,
  Cpu,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useGetMyAssetsQuery } from '../assetApi.js';
import { AssetIssueModal } from '../components/AssetIssueModal.jsx';

export const MyAssetsPage = () => {
  const [selectedAssetForIssue, setSelectedAssetForIssue] = useState(null);

  const { data: assetsRes, isLoading } = useGetMyAssetsQuery();
  const assets = assetsRes?.data || (Array.isArray(assetsRes) ? assetsRes : []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Laptop className="w-6 h-6 text-emerald-500" />
          My Assigned Assets
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Company equipment, devices, and software licenses registered under your custody.
        </p>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading your equipment...</div>
      ) : assets.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Assets Assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not currently have any company laptops, monitors, or hardware assigned to your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    {asset.assetTag}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {asset.type.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{asset.name}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  S/N: {asset.serialNumber} {asset.modelNumber ? `· Model: ${asset.modelNumber}` : ''}
                </p>

                {/* Specs */}
                {(asset.specifications?.ramGb || asset.specifications?.processor || asset.specifications?.storageGb) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E2235] flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    {asset.specifications.processor && (
                      <span className="flex items-center gap-1 font-medium">
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                        {asset.specifications.processor}
                      </span>
                    )}
                    {asset.specifications.ramGb && (
                      <span className="flex items-center gap-1 font-medium">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        {asset.specifications.ramGb}GB RAM
                      </span>
                    )}
                    {asset.specifications.storageGb && (
                      <span className="flex items-center gap-1 font-medium">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        {asset.specifications.storageGb}GB SSD
                      </span>
                    )}
                  </div>
                )}

                {/* Open Issue Banner */}
                {asset.hasOpenIssue && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>A maintenance ticket is currently open with IT/HR support for this device.</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1E2235] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Custodian Active
                </span>
                <button
                  onClick={() => setSelectedAssetForIssue(asset)}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Defect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Issue Modal */}
      <AssetIssueModal
        isOpen={Boolean(selectedAssetForIssue)}
        onClose={() => setSelectedAssetForIssue(null)}
        asset={selectedAssetForIssue}
      />
    </div>
  );
};

export default MyAssetsPage;

