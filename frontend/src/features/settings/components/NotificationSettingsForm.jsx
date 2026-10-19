/**
 * @file NotificationSettingsForm.jsx
 * @description Admin Configuration Form for Global Notification & Announcement Channels (In-App, Email, WhatsApp).
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Megaphone,
  Check,
  Save,
  ShieldCheck,
  Calendar,
  Clock,
  DollarSign,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

export function NotificationSettingsForm({ initialData = {}, onSaved }) {
  const [channels, setChannels] = useState({
    inApp: initialData.channels?.inApp ?? true,
    email: initialData.channels?.email ?? true,
    whatsapp: initialData.channels?.whatsapp ?? false
  });

  const [announcements, setAnnouncements] = useState({
    inApp: initialData.announcements?.inApp ?? true,
    email: initialData.announcements?.email ?? true,
    whatsapp: initialData.announcements?.whatsapp ?? false
  });

  const [categories, setCategories] = useState({
    attendance: initialData.categories?.attendance || { inApp: true, email: true, whatsapp: false },
    leave: initialData.categories?.leave || { inApp: true, email: true, whatsapp: false },
    payroll: initialData.categories?.payroll || { inApp: true, email: true, whatsapp: false },
    announcement: initialData.categories?.announcement || { inApp: true, email: true, whatsapp: false }
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData) {
      setChannels({
        inApp: initialData.channels?.inApp ?? true,
        email: initialData.channels?.email ?? true,
        whatsapp: initialData.channels?.whatsapp ?? false
      });
      setAnnouncements({
        inApp: initialData.announcements?.inApp ?? true,
        email: initialData.announcements?.email ?? true,
        whatsapp: initialData.announcements?.whatsapp ?? false
      });
      if (initialData.categories) {
        setCategories(initialData.categories);
      }
    }
  }, [initialData]);

  // Quick preset helper
  const applyPreset = (preset) => {
    if (preset === 'all') {
      const allActive = { inApp: true, email: true, whatsapp: true };
      setChannels(allActive);
      setAnnouncements(allActive);
      setCategories({
        attendance: allActive,
        leave: allActive,
        payroll: allActive,
        announcement: allActive
      });
    } else if (preset === 'inApp') {
      const inAppOnly = { inApp: true, email: false, whatsapp: false };
      setChannels(inAppOnly);
      setAnnouncements(inAppOnly);
      setCategories({
        attendance: inAppOnly,
        leave: inAppOnly,
        payroll: inAppOnly,
        announcement: inAppOnly
      });
    } else if (preset === 'email') {
      const emailOnly = { inApp: false, email: true, whatsapp: false };
      setChannels(emailOnly);
      setAnnouncements(emailOnly);
      setCategories({
        attendance: emailOnly,
        leave: emailOnly,
        payroll: emailOnly,
        announcement: emailOnly
      });
    } else if (preset === 'whatsapp') {
      const whatsappOnly = { inApp: false, email: false, whatsapp: true };
      setChannels(whatsappOnly);
      setAnnouncements(whatsappOnly);
      setCategories({
        attendance: whatsappOnly,
        leave: whatsappOnly,
        payroll: whatsappOnly,
        announcement: whatsappOnly
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        channels,
        announcements,
        categories
      };

      await updateSetting({
        key: 'notifications',
        value: payload,
        description: 'Updated system notification & announcement delivery channels'
      }).unwrap();

      toast.success('Notification & announcement channel settings saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save notification settings');
    }
  };

  // Determine current active delivery summary
  const getActiveChannelsList = (channelObj) => {
    const list = [];
    if (channelObj.inApp) list.push('In-App Web');
    if (channelObj.email) list.push('Email');
    if (channelObj.whatsapp) list.push('WhatsApp');
    return list.length > 0 ? list.join(' + ') : 'None (All Suppressed)';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Strategy Overview Card */}
      <div className="bg-[#0F111A] border border-[#1E2235] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2235]">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Channel Strategy & Routing</span>
            </h3>
            <p className="text-xs text-[#8F94A8] mt-0.5">
              Select which channels the system uses to deliver operational notifications and company announcements.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[#62677B] mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('inApp')}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#141724] border border-[#1E2235] text-[#8F94A8] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              In-App Only
            </button>
            <button
              type="button"
              onClick={() => applyPreset('email')}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#141724] border border-[#1E2235] text-[#8F94A8] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Email Only
            </button>
            <button
              type="button"
              onClick={() => applyPreset('whatsapp')}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#141724] border border-[#1E2235] text-[#8F94A8] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              WhatsApp Only
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#5E6AD2]/15 border border-[#5E6AD2]/30 text-[#7B86E8] hover:bg-[#5E6AD2]/25 rounded-lg transition-colors cursor-pointer"
            >
              Mixed (All Active)
            </button>
          </div>
        </div>

        {/* Global Master Channel Toggles */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* In-App Toggle */}
          <div
            onClick={() => setChannels((p) => ({ ...p, inApp: !p.inApp }))}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              channels.inApp
                ? 'bg-[#141724] border-indigo-500/40 shadow-sm'
                : 'bg-[#0B0D14] border-[#1E2235] opacity-75'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              channels.inApp ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">In-App Alerts</span>
                <input
                  type="checkbox"
                  checked={channels.inApp}
                  onChange={() => {}}
                  className="rounded text-indigo-500 pointer-events-none"
                />
              </div>
              <p className="text-[11px] text-[#8F94A8] mt-1">
                Real-time bell notification badge and slide-out drawer on portal topbar.
              </p>
            </div>
          </div>

          {/* Email Toggle */}
          <div
            onClick={() => setChannels((p) => ({ ...p, email: !p.email }))}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              channels.email
                ? 'bg-[#141724] border-emerald-500/40 shadow-sm'
                : 'bg-[#0B0D14] border-[#1E2235] opacity-75'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              channels.email ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Email Delivery</span>
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={() => {}}
                  className="rounded text-emerald-500 pointer-events-none"
                />
              </div>
              <p className="text-[11px] text-[#8F94A8] mt-1">
                Asynchronous branded HTML emails dispatched via queue workers.
              </p>
            </div>
          </div>

          {/* WhatsApp Toggle */}
          <div
            onClick={() => setChannels((p) => ({ ...p, whatsapp: !p.whatsapp }))}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              channels.whatsapp
                ? 'bg-[#141724] border-green-500/40 shadow-sm'
                : 'bg-[#0B0D14] border-[#1E2235] opacity-75'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              channels.whatsapp ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">WhatsApp Business</span>
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={() => {}}
                  className="rounded text-green-500 pointer-events-none"
                />
              </div>
              <p className="text-[11px] text-[#8F94A8] mt-1">
                Direct WhatsApp Cloud API messages to Pakistani numbers (+923...).
              </p>
            </div>
          </div>
        </div>

        {/* Live Active Delivery Status Banner */}
        <div className="mt-4 p-3 rounded-lg bg-[#0A0B10] border border-[#1E2235] flex items-center justify-between text-xs">
          <span className="text-[#8F94A8]">Global Alert Pipeline:</span>
          <span className="font-semibold text-white bg-[#141724] px-2.5 py-1 rounded border border-[#1E2235]">
            {getActiveChannelsList(channels)}
          </span>
        </div>
      </div>

      {/* Announcements Broadcast Specific Settings */}
      <div className="bg-[#0F111A] border border-[#1E2235] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Megaphone className="w-4 h-4 text-purple-400" />
          <span>Announcements & Executive Broadcast Channels</span>
        </h3>
        <p className="text-xs text-[#8F94A8] mb-4">
          Configure how company-wide and department announcements notify staff members upon publishing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#141724] border border-[#1E2235] cursor-pointer">
            <span className="text-xs font-medium text-white flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              Notice Board & Bell
            </span>
            <input
              type="checkbox"
              checked={announcements.inApp}
              onChange={(e) => setAnnouncements((p) => ({ ...p, inApp: e.target.checked }))}
              className="rounded text-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-[#141724] border border-[#1E2235] cursor-pointer">
            <span className="text-xs font-medium text-white flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Announcement Email
            </span>
            <input
              type="checkbox"
              checked={announcements.email}
              onChange={(e) => setAnnouncements((p) => ({ ...p, email: e.target.checked }))}
              className="rounded text-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-[#141724] border border-[#1E2235] cursor-pointer">
            <span className="text-xs font-medium text-white flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-green-400" />
              WhatsApp Alert
            </span>
            <input
              type="checkbox"
              checked={announcements.whatsapp}
              onChange={(e) => setAnnouncements((p) => ({ ...p, whatsapp: e.target.checked }))}
              className="rounded text-green-500"
            />
          </label>
        </div>
      </div>

      {/* Module Category Routing Matrix */}
      <div className="bg-[#0F111A] border border-[#1E2235] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Module Event Delivery Routing Matrix</span>
        </h3>
        <p className="text-xs text-[#8F94A8] mb-4">
          Fine-tune delivery channels for specific operational events.
        </p>

        <div className="divide-y divide-[#1E2235]">
          {/* Leaves */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Leaves & Approvals</span>
                <p className="text-[11px] text-[#8F94A8]">Leave request submission, approvals, cancellations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-[#8F94A8]">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.leave?.inApp ?? true}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, leave: { ...p.leave, inApp: e.target.checked } }))
                  }
                  className="rounded text-indigo-500"
                />
                <span>In-App</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.leave?.email ?? true}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, leave: { ...p.leave, email: e.target.checked } }))
                  }
                  className="rounded text-emerald-500"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.leave?.whatsapp ?? false}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, leave: { ...p.leave, whatsapp: e.target.checked } }))
                  }
                  className="rounded text-green-500"
                />
                <span>WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Attendance */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Attendance & Shifts</span>
                <p className="text-[11px] text-[#8F94A8]">Clock-in alerts, missed punch corrections, shift changes</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-[#8F94A8]">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.attendance?.inApp ?? true}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, attendance: { ...p.attendance, inApp: e.target.checked } }))
                  }
                  className="rounded text-indigo-500"
                />
                <span>In-App</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.attendance?.email ?? true}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, attendance: { ...p.attendance, email: e.target.checked } }))
                  }
                  className="rounded text-emerald-500"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.attendance?.whatsapp ?? false}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, attendance: { ...p.attendance, whatsapp: e.target.checked } }))
                  }
                  className="rounded text-green-500"
                />
                <span>WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Payroll */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Payroll & Payslips</span>
                <p className="text-[11px] text-[#8F94A8]">Payslip publication, salary disbursement alerts</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-[#8F94A8]">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.payroll?.inApp ?? true}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, payroll: { ...p.payroll, inApp: e.target.checked } }))
                  }
                  className="rounded text-indigo-500"
                />
                <span>In-App</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.payroll?.email ?? true}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, payroll: { ...p.payroll, email: e.target.checked } }))
                  }
                  className="rounded text-emerald-500"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.payroll?.whatsapp ?? false}
                  onChange={(e) =>
                    setCategories((p) => ({ ...p, payroll: { ...p.payroll, whatsapp: e.target.checked } }))
                  }
                  className="rounded text-green-500"
                />
                <span>WhatsApp</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          <span>{isLoading ? 'Saving Changes...' : 'Save Channel Strategy'}</span>
        </button>
      </div>
    </form>
  );
}

export default NotificationSettingsForm;
