/**
 * @file MyAssetsPage.jsx
 * @description Employee Self-Service Equipment Custody, Health Tracking & Issue Flagging View.
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.6)
 * - Design System: Forest & Emerald (#00C471 brand primary, #111D17 dark surface, #1A3125 dark border).
 * - Interactive Row Click: Clicking any row opens comprehensive AssetDetailModal.
 * - Dedicated Buttons / Pills Tab Switcher: Filter between All, Active, Hardware, Licenses, and In-Repair.
 */

import React, { useState, useMemo } from 'react';
import {
  Laptop,
  AlertTriangle,
  Calendar,
  Cpu,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Wrench,
  PackageCheck,
  Tag,
  Key
} from 'lucide-react';
import { useGetMyAssetsQuery } from '../assetApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { AssetIssueModal } from '../components/AssetIssueModal.jsx';
import { AssetDetailModal } from '../components/AssetDetailModal.jsx';
import { formatDate } from '../../../lib/formatters.js';

export const MyAssetsPage = () => {
  const [selectedAssetForIssue, setSelectedAssetForIssue] = useState(null);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: assetsRes, isLoading, isFetching, refetch } = useGetMyAssetsQuery();
  const assets = assetsRes?.data || (Array.isArray(assetsRes) ? assetsRes : []);

  // Filtered Assets based on tabs & search
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Tab filter
      if (activeTab === 'assigned' && asset.status !== 'assigned') return false;
      if (activeTab === 'repair' && asset.status !== 'under_repair' && !asset.hasOpenIssue) return false;
      if (activeTab === 'hardware' && asset.type === 'software_license') return false;
      if (activeTab === 'software' && asset.type !== 'software_license') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tag = (asset.assetTag || '').toLowerCase();
        const name = (asset.name || '').toLowerCase();
        const sn = (asset.serialNumber || '').toLowerCase();
        const model = (asset.modelNumber || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || sn.includes(q) || model.includes(q);
      }

      return true;
    });
  }, [assets, activeTab, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = assets.length;
    const hardware = assets.filter((a) => a.type !== 'software_license').length;
    const software = assets.filter((a) => a.type === 'software_license').length;
    const issues = assets.filter((a) => a.hasOpenIssue || a.status === 'under_repair').length;
    return { total, hardware, software, issues };
  }, [assets]);

  if (isLoading && !assetsRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const tabPills = [
    { id: 'all', label: 'All Equipment', count: assets.length },
    { id: 'assigned', label: 'Active Custody', count: assets.filter((a) => a.status === 'assigned').length },
    { id: 'hardware', label: 'Hardware Devices', count: stats.hardware },
    { id: 'software', label: 'Software Licenses', count: stats.software },
    { id: 'repair', label: 'In Repair / Issues', count: stats.issues }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Laptop className="w-7 h-7 text-[#00C471]" />
            My Assigned Assets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Company equipment, physical hardware, and software licenses registered under your custody.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Custody</span>
            <PackageCheck className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400">Registered assets</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hardware</span>
            <Laptop className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.hardware}
          </p>
          <span className="text-[11px] text-slate-400">Physical devices</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Licenses</span>
            <Key className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.software}
          </p>
          <span className="text-[11px] text-slate-400">Software subscriptions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Tickets</span>
            <AlertTriangle className={`w-4 h-4 ${stats.issues > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${stats.issues > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.issues}
          </p>
          <span className="text-[11px] text-slate-400">In maintenance / repair</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-2xs">
        {/* Buttons / Pills Tab Switcher & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1511]/50">
          {/* Pills Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {tabPills.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#00C471] text-white shadow-2xs shadow-emerald-500/20'
                      : 'bg-white dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E362B] border border-slate-200 dark:border-[#1A3125]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-[#0B1511] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Toolbar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tag, name, serial..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471]"
            />
          </div>
        </div>

        {/* Data Table */}
        {filteredAssets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#162820] text-slate-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-[#1A3125]">
              <CheckCircle2 className="w-6 h-6 text-[#00C471]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'No matching assets found' : 'No Assets In This Category'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria or switching to a different tab.'
                : 'You do not have any equipment matching this filter currently assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1A3125] text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-[#0B1511]/70 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Asset Tag & Category</th>
                  <th className="py-3 px-4">Device / Software Name</th>
                  <th className="py-3 px-4">Serial / License Number</th>
                  <th className="py-3 px-4">Assigned On</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {filteredAssets.map((asset) => {
                  const isUnderRepair = asset.status === 'under_repair' || asset.hasOpenIssue;

                  return (
                    <tr
                      key={asset._id}
                      onClick={() => setSelectedAssetForDetail(asset)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162820]/50 transition-colors cursor-pointer group"
                    >
                      {/* Asset Tag & Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {asset.assetTag}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 capitalize">
                            {asset.type?.replace('_', ' ') || 'Hardware'}
                          </span>
                        </div>
                      </td>

                      {/* Name & Model */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors">
                          {asset.name}
                        </div>
                        {asset.modelNumber && (
                          <div className="text-[11px] text-slate-400">
                            Model: {asset.modelNumber}
                          </div>
                        )}
                      </td>

                      {/* Serial Number */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {asset.serialNumber || '—'}
                      </td>

                      {/* Assigned Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {asset.updatedAt ? formatDate(asset.updatedAt) : '—'}
                      </td>

                      {/* Status & Health */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isUnderRepair ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <AlertTriangle className="w-3 h-3" />
                              Issue Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              <ShieldCheck className="w-3 h-3 text-[#00C471]" />
                              Active Custody
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedAssetForIssue(asset)}
                            title="Report defect or malfunction"
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Report Issue</span>
                          </button>
                          <button
                            onClick={() => setSelectedAssetForDetail(asset)}
                            title="View full specifications"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        isOpen={Boolean(selectedAssetForDetail)}
        onClose={() => setSelectedAssetForDetail(null)}
        asset={selectedAssetForDetail}
        isOwnAsset={true}
        onReportIssue={(asset) => {
          setSelectedAssetForDetail(null);
          setSelectedAssetForIssue(asset);
        }}
      />

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
