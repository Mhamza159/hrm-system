/**
 * @file SettingsPage.jsx
 * @description Centralized Tabbed Configuration Hub for Module M2 Company Settings (Slice 2.1).
 */

import React, { useState } from 'react';
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
  Bell
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

const TABS = [
  { id: 'company', label: 'Company Profile', icon: Building2 },
  { id: 'workingHours', label: 'Working Hours', icon: Clock },
  { id: 'lateRules', label: 'Attendance Rules', icon: Timer },
  { id: 'leavePolicy', label: 'Leave Policy', icon: CalendarRange },
  { id: 'payroll', label: 'Payroll Cycle', icon: BadgeDollarSign },
  { id: 'taxSlabs', label: 'Statutory & Tax', icon: Scale },
  { id: 'geoFences', label: 'Geo-Fence Map', icon: MapPin },
  { id: 'templates', label: 'Templates', icon: Mail },
  { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
  { id: 'backup', label: 'Data Backup', icon: Database }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const { data: settingsRes, isLoading, refetch } = useGetSettingsQuery();

  const settings = settingsRes?.data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Settings"
        description="Configure corporate identity, work schedules, tax compliance, and system rules."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Refresh
          </button>
        }
      />

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/80 dark:border-slate-800/80 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Area */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
          Loading company settings...
        </div>
      ) : (
        <div className="pt-1">
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
            <AttendanceRulesForm initialData={settings.lateRules} onSaved={refetch} />
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

          {activeTab === 'backup' && <BackupTab />}
        </div>
      )}
    </div>
  );
}
