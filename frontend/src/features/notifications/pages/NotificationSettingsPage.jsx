/**
 * @file NotificationSettingsPage.jsx
 * @description Granular User Channel Notification Preferences Management (Module M8 / Slice 8.5).
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
import { Card } from '../../../components/common/Card.jsx';
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
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  },
  {
    key: 'leave',
    title: 'Leaves & Holidays',
    description: 'Leave request submission receipts, manager approval/rejection updates, and gazetted holiday notices.',
    icon: Calendar,
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  },
  {
    key: 'payroll',
    title: 'Payroll & Compensation',
    description: 'Monthly payslip release alerts, bonus disbursement notices, and tax deduction reports.',
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  },
  {
    key: 'announcement',
    title: 'Company & Department Announcements',
    description: 'Executive townhall announcements, company-wide policy updates, and team bulletins.',
    icon: Megaphone,
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
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
        subtitle="Control which channels (In-App, Email, WhatsApp) are used to notify you for each category"
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 rounded-lg border border-slate-700/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Preferences
            </button>
          </div>
        }
      />

      {/* Main Settings Card */}
      {isLoading ? (
        <Card className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm">Loading your preferences...</span>
        </Card>
      ) : (
        <div className="space-y-4">
          {CATEGORY_ITEMS.map((cat) => {
            const Icon = cat.icon;
            const current = localPrefs[cat.key] || { inApp: true, email: true, whatsapp: false };

            return (
              <Card key={cat.key} className="p-5 bg-[#0F111A] border-slate-800/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Category Details */}
                  <div className="flex items-start gap-3.5 max-w-xl">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cat.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{cat.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Channel Toggles Grid */}
                  <div className="flex items-center gap-3 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    {/* In-App Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(cat.key, 'inApp')}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          current.inApp ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                        title="Toggle In-App Notification"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            current.inApp ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
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
                          current.email ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                        title="Toggle Email Alerts"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            current.email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
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
                          current.whatsapp ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                        title="Toggle WhatsApp Alerts"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            current.whatsapp ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
