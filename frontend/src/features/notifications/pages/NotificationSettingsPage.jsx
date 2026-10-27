/**
 * @file NotificationSettingsPage.jsx
 * @description Granular User Channel Notification Preferences Management (Module M8 / Slice 8.5).
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Notifications
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Feature Page (React 18 / Tailwind)
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  DollarSign,
  Megaphone,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation
} from '../notificationsApi.js';

const CATEGORY_ITEMS = [
  {
    key: 'attendance',
    title: 'Attendance & Shifts',
    description: 'Check-in reminders, late arrival alerts, and manager shift change notifications.',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
  },
  {
    key: 'leave',
    title: 'Leaves & Holidays',
    description: 'Leave request submission receipts, manager approval/rejection updates, and gazetted holiday notices.',
    icon: Calendar,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
  },
  {
    key: 'payroll',
    title: 'Payroll & Compensation',
    description: 'Monthly payslip release alerts, bonus disbursement notices, and tax deduction reports.',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
  },
  {
    key: 'announcement',
    title: 'Company & Department Announcements',
    description: 'Executive townhall announcements, company-wide policy updates, and team bulletins.',
    icon: Megaphone,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60'
  }
];

export const NotificationSettingsPage = () => {
  const { data: prefsData, isLoading } = useGetNotificationPreferencesQuery();
  const [updatePrefs, { isLoading: isSaving }] = useUpdateNotificationPreferencesMutation();

  const [localPrefs, setLocalPrefs] = useState({
    attendance: { inApp: true, email: true, whatsapp: false },
    leave: { inApp: true, email: true, whatsapp: false },
    payroll: { inApp: true, email: true, whatsapp: false },
    announcement: { inApp: true, email: true, whatsapp: false }
  });

  useEffect(() => {
    if (prefsData?.data) {
      setLocalPrefs({
        attendance: { inApp: true, email: true, whatsapp: false, ...prefsData.data.attendance },
        leave: { inApp: true, email: true, whatsapp: false, ...prefsData.data.leave },
        payroll: { inApp: true, email: true, whatsapp: false, ...prefsData.data.payroll },
        announcement: { inApp: true, email: true, whatsapp: false, ...prefsData.data.announcement }
      });
    }
  }, [prefsData]);

  const handleToggle = (category, channel) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel]
      }
    }));
  };

  const handleSave = async () => {
    try {
      await updatePrefs(localPrefs).unwrap();
      toast.success('Notification preferences updated successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update preferences');
    }
  };

  const handleReset = () => {
    setLocalPrefs({
      attendance: { inApp: true, email: true, whatsapp: false },
      leave: { inApp: true, email: true, whatsapp: false },
      payroll: { inApp: true, email: true, whatsapp: false },
      announcement: { inApp: true, email: true, whatsapp: false }
    });
    toast.info('Preferences reset to default values (Click Save to apply)');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <PageHeader
        title="Notification Settings"
        description="Control which channels (In-App, Email, WhatsApp) are used to notify you for each category."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13221B] rounded-xl border border-slate-200 dark:border-[#1A3125] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Preferences</span>
          </button>
        </div>
      </PageHeader>

      {/* Main Settings Card */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin text-[#00C471]" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Loading your channel preferences...
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORY_ITEMS.map((cat) => {
            const Icon = cat.icon;
            const current = localPrefs[cat.key] || { inApp: true, email: true, whatsapp: false };

            return (
              <div
                key={cat.key}
                className="p-5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Category Details */}
                  <div className="flex items-start gap-3.5 max-w-xl">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${cat.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cat.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Channel Toggles Grid */}
                  <div className="flex items-center gap-4 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#1A3125]">
                    {/* In-App Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(cat.key, 'inApp')}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          current.inApp ? 'bg-[#00C471]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        title="Toggle In-App Notification"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            current.inApp ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        In-App
                      </span>
                    </div>

                    {/* Email Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(cat.key, 'email')}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          current.email ? 'bg-[#00C471]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        title="Toggle Email Alerts"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            current.email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email
                      </span>
                    </div>

                    {/* WhatsApp Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(cat.key, 'whatsapp')}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          current.whatsapp ? 'bg-[#00C471]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        title="Toggle WhatsApp Messaging"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            current.whatsapp ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPage;
