/**
 * @file SettingsPage.jsx
 * @description Master Enterprise Settings Command Center & Categorized Configuration Hub (Slice 2.1).
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Clock,
  Timer,
  CalendarRange,
  BadgeDollarSign,
  Scale,
  MapPin,
  Mail,
  Database,
  RefreshCw,
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { CompanyForm } from '../components/CompanyForm.jsx';
import { WorkingHoursForm } from '../components/WorkingHoursForm.jsx';
import { AttendanceRulesForm } from '../components/AttendanceRulesForm.jsx';
import { LeavePolicyForm } from '../components/LeavePolicyForm.jsx';
import { PayrollSettingsForm } from '../components/PayrollSettingsForm.jsx';
import { TaxSlabsForm } from '../components/TaxSlabsForm.jsx';
import { GeoFenceMapEditor } from '../components/GeoFenceMapEditor.jsx';
import { TemplatesForm } from '../components/TemplatesForm.jsx';
import { BackupTab } from '../components/BackupTab.jsx';
import { NotificationSettingsForm } from '../components/NotificationSettingsForm.jsx';
import { useGetSettingsQuery } from '../settingsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

const SETTINGS_CATEGORIES = [
  {
    category: 'Organization & Identity',
    items: [
      { id: 'company', label: 'Company Profile', desc: 'Corporate legal identity & brand assets', icon: Building2 },
      { id: 'workingHours', label: 'Working Hours', desc: 'Operating schedule & canonical timezone', icon: Clock },
      { id: 'geoFences', label: 'Geo-Fence Map', desc: 'Multi-branch spatial GPS boundaries', icon: MapPin }
    ]
  },
  {
    category: 'Policies & Compensation',
    items: [
      { id: 'lateRules', label: 'Attendance Rules', desc: 'Grace periods, dynamic QR & biometrics', icon: Timer },
      { id: 'leavePolicy', label: 'Leave Policy', desc: 'Accrual quotas & approval chains builder', icon: CalendarRange },
      { id: 'payroll', label: 'Payroll Cycle', desc: 'Salary disbursement & cutoff schedules', icon: BadgeDollarSign },
      { id: 'taxSlabs', label: 'Statutory & Tax', desc: 'Pakistan FBR slabs, EOBI, PESSI & PF', icon: Scale }
    ]
  },
  {
    category: 'Communications & Disaster Recovery',
    items: [
      { id: 'templates', label: 'Templates Studio', desc: 'Email & WhatsApp dynamic message drafts', icon: Mail },
      { id: 'notifications', label: 'Notifications & Alerts', desc: '11-module omnichannel dispatch matrix', icon: Bell },
      { id: 'backup', label: 'Disaster Recovery', desc: 'Database snapshots & secure downloads', icon: Database, superAdminOnly: true }
    ]
  }
];

export default function SettingsPage() {
  const { isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'company';
  const [filterQuery, setFilterQuery] = useState('');

  const { data: settingsRes, isLoading, refetch } = useGetSettingsQuery();
  const settings = settingsRes?.data || {};

  const handleTabSelect = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Flattened items with search filter
  const filteredCategories = useMemo(() => {
    if (!filterQuery.trim()) {
      return SETTINGS_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => !item.superAdminOnly || isSuperAdmin)
      }));
    }
    const q = filterQuery.toLowerCase();
    return SETTINGS_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items
        .filter((item) => !item.superAdminOnly || isSuperAdmin)
        .filter((item) => item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q))
    })).filter((cat) => cat.items.length > 0);
  }, [filterQuery, isSuperAdmin]);

  // Current active tab item definition
  const currentTabItem = useMemo(() => {
    for (const cat of SETTINGS_CATEGORIES) {
      const match = cat.items.find((i) => i.id === activeTab);
      if (match) return match;
    }
    return SETTINGS_CATEGORIES[0].items[0];
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Governance"
        description="Enterprise configuration command center: legal identity, work schedules, statutory tax, and disaster recovery."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Refresh
          </button>
        }
      />

      {/* Global Configuration Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Organization</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block mt-0.5">
            {settings.company?.name || 'Company Legal Entity'}
          </span>
        </div>
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Fiscal Cycle</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block mt-0.5">
            {settings.leavePolicy?.fiscalYearStart || 'July'} – June (Tax Year)
          </span>
        </div>
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Timezone</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate block mt-0.5">
            Asia/Karachi (UTC+5)
          </span>
        </div>
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Statutory Slabs</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate block mt-0.5">
            FBR {settings.taxSlabs?.taxYear || '2024-2025'}
          </span>
        </div>
      </div>

      {/* Main Two-Column Master Navigation Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Categorized Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter settings sections..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Navigation Accordion */}
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-3 shadow-2xs space-y-4">
            {filteredCategories.map((group) => (
              <div key={group.category} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 block">
                  {group.category}
                </span>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <div className="truncate">
                            <span className="text-xs block truncate">{item.label}</span>
                            <span className="text-[10px] text-slate-400 block truncate font-normal">{item.desc}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Configuration Section Form */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="h-64 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              Loading system configurations...
            </div>
          ) : (
            <div>
              {activeTab === 'company' && (
                <CompanyForm initialData={settings.company} onSaved={refetch} />
              )}

              {activeTab === 'workingHours' && (
                <WorkingHoursForm
                  workingDaysData={settings.workingDays}
                  officeHoursData={settings.officeHours}
                  onSaved={refetch}
                />
              )}

              {activeTab === 'lateRules' && (
                <AttendanceRulesForm
                  initialData={settings.lateRules}
                  qrData={settings.qrAttendance}
                  faceData={settings.faceAttendance}
                  onSaved={refetch}
                />
              )}

              {activeTab === 'leavePolicy' && (
                <LeavePolicyForm initialData={settings.leavePolicy} onSaved={refetch} />
              )}

              {activeTab === 'payroll' && (
                <PayrollSettingsForm initialData={settings.payrollCycle} onSaved={refetch} />
              )}

              {activeTab === 'taxSlabs' && (
                <TaxSlabsForm
                  taxSlabsData={settings.taxSlabs}
                  eobiData={settings.eobi}
                  pessiData={settings.pessi}
                  providentFundData={settings.providentFund}
                  onSaved={refetch}
                />
              )}

              {activeTab === 'geoFences' && (
                <GeoFenceMapEditor initialData={settings.geoFences} onSaved={refetch} />
              )}

              {activeTab === 'templates' && (
                <TemplatesForm initialData={settings.templates} onSaved={refetch} />
              )}

              {activeTab === 'notifications' && (
                <NotificationSettingsForm
                  initialData={settings.notifications}
                  onSaved={refetch}
                />
              )}

              {activeTab === 'backup' && isSuperAdmin && (
                <BackupTab />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
