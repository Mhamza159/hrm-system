/**
 * @file NotificationSettingsForm.jsx
 * @description Enterprise Omnichannel Notification & Announcement Management Hub.
 * 
 * SPECIFICATION & ARCHETYPE:
 * - Module: M2 Company Settings / M8 Notifications
 * - Standards: Forest & Emerald Craft (DESIGN.md & docs/UI-REFERENCE.md)
 * - Light Mode: #FFFFFF card, #F8FAFC canvas, #EAECF0 hairline border, #0F172A text
 * - Dark Mode: #111D17 card, #0A110D canvas, #1A3125 hairline border, #F8FAFC text
 * - Master Accent: #00C471 Emerald active indicators & toggles
 * - Multi-Channel: In-App (WebSockets + Bell), Email (Queue Worker), WhatsApp Business (Cloud API)
 * - Full 11-Module Matrix Coverage: Leaves, Attendance, Payroll, Loans, Expenses, Assets,
 *   Onboarding, Performance, Projects, Security, Profile.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Coins,
  Receipt,
  Laptop,
  UserCheck,
  Award,
  FolderKanban,
  User,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCheck,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

/**
 * Standardized metadata for all 11 enterprise operational modules
 */
const MODULE_REGISTRY = [
  {
    key: 'leave',
    label: 'Leaves & Holidays',
    description: 'Leave applications, manager approvals, encashment claims, and public holiday announcements',
    icon: Calendar,
    accent: 'emerald'
  },
  {
    key: 'attendance',
    label: 'Attendance & Geofencing',
    description: 'Clock-in/out alerts, perimeter geofence warnings, low GPS flags, and WFH location approvals',
    icon: Clock,
    accent: 'blue'
  },
  {
    key: 'payroll',
    label: 'Payroll & Payslips',
    description: 'Monthly payroll run finalization, payslip publication, salary disbursements, and tax deductions',
    icon: Coins,
    accent: 'amber'
  },
  {
    key: 'loan',
    label: 'Loans & Advances',
    description: 'Loan & salary advance submissions, installment schedule updates, approvals, and early settlements',
    icon: Coins,
    accent: 'emerald'
  },
  {
    key: 'expense',
    label: 'Expenses & Claims',
    description: 'Corporate expense claims, manager escalations, receipt verification, and payment reimbursements',
    icon: Receipt,
    accent: 'purple'
  },
  {
    key: 'asset',
    label: 'Assets Management',
    description: 'Hardware allocations, handover approvals, return requests, and warranty/maintenance alerts',
    icon: Laptop,
    accent: 'indigo'
  },
  {
    key: 'onboarding',
    label: 'Onboarding & Offboarding',
    description: 'New hire checklists, probation milestones, resignation notices, exit interviews, and clearances',
    icon: UserCheck,
    accent: 'teal'
  },
  {
    key: 'performance',
    label: 'Performance & Appraisals',
    description: 'Review cycles, KPI goal milestones, 360 peer feedback invitations, and appraisal results',
    icon: Award,
    accent: 'amber'
  },
  {
    key: 'project',
    label: 'Projects & Timesheets',
    description: 'Project task assignments, milestone deadlines, weekly timesheet submissions, and approvals',
    icon: FolderKanban,
    accent: 'sky'
  },
  {
    key: 'security',
    label: 'Security & Compliance',
    description: '2FA verification codes, password change notices, suspicious logins, and account lockouts',
    icon: ShieldCheck,
    accent: 'rose'
  },
  {
    key: 'profile',
    label: 'Profile & Change Requests',
    description: 'Employee profile change requests (CNIC, bank details, contact info) and HR verification alerts',
    icon: User,
    accent: 'slate'
  }
];

export function NotificationSettingsForm({ initialData = {}, onSaved }) {
  // Master Channel Strategy State
  const [channels, setChannels] = useState({
    inApp: initialData.channels?.inApp ?? true,
    email: initialData.channels?.email ?? true,
    whatsapp: initialData.channels?.whatsapp ?? false
  });

  // Announcements Strategy State
  const [announcements, setAnnouncements] = useState({
    inApp: initialData.announcements?.inApp ?? true,
    email: initialData.announcements?.email ?? true,
    whatsapp: initialData.announcements?.whatsapp ?? false
  });

  // 11-Module Categories Matrix State
  const [categories, setCategories] = useState(() => {
    const initialCategories = initialData.categories || {};
    const state = {};
    MODULE_REGISTRY.forEach((mod) => {
      state[mod.key] = initialCategories[mod.key] || {
        inApp: true,
        email: mod.key === 'security' || mod.key === 'payroll' || mod.key === 'leave',
        whatsapp: false
      };
    });
    return state;
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  // Sync state when initialData updates from server
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
        setCategories((prev) => {
          const next = { ...prev };
          MODULE_REGISTRY.forEach((mod) => {
            if (initialData.categories[mod.key]) {
              next[mod.key] = initialData.categories[mod.key];
            }
          });
          return next;
        });
      }
    }
  }, [initialData]);

  // Quick Preset Handlers
  const applyPreset = (preset) => {
    if (preset === 'all') {
      const allActive = { inApp: true, email: true, whatsapp: true };
      setChannels(allActive);
      setAnnouncements(allActive);
      setCategories((prev) => {
        const next = {};
        MODULE_REGISTRY.forEach((m) => {
          next[m.key] = { ...allActive };
        });
        return next;
      });
      toast.info('Applied "Mixed (All Channels Active)" preset');
    } else if (preset === 'inApp') {
      const inAppOnly = { inApp: true, email: false, whatsapp: false };
      setChannels(inAppOnly);
      setAnnouncements(inAppOnly);
      setCategories((prev) => {
        const next = {};
        MODULE_REGISTRY.forEach((m) => {
          next[m.key] = { ...inAppOnly };
        });
        return next;
      });
      toast.info('Applied "In-App Web Only" preset');
    } else if (preset === 'email') {
      const emailOnly = { inApp: false, email: true, whatsapp: false };
      setChannels(emailOnly);
      setAnnouncements(emailOnly);
      setCategories((prev) => {
        const next = {};
        MODULE_REGISTRY.forEach((m) => {
          next[m.key] = { ...emailOnly };
        });
        return next;
      });
      toast.info('Applied "Email Only" preset');
    } else if (preset === 'whatsapp') {
      const whatsappOnly = { inApp: false, email: false, whatsapp: true };
      setChannels(whatsappOnly);
      setAnnouncements(whatsappOnly);
      setCategories((prev) => {
        const next = {};
        MODULE_REGISTRY.forEach((m) => {
          next[m.key] = { ...whatsappOnly };
        });
        return next;
      });
      toast.info('Applied "WhatsApp Only" preset');
    }
  };

  // Matrix Batch Helpers
  const toggleAllInApp = (enable) => {
    setCategories((prev) => {
      const next = {};
      MODULE_REGISTRY.forEach((m) => {
        next[m.key] = { ...(prev[m.key] || {}), inApp: enable };
      });
      return next;
    });
  };

  const toggleAllEmail = (enable) => {
    setCategories((prev) => {
      const next = {};
      MODULE_REGISTRY.forEach((m) => {
        next[m.key] = { ...(prev[m.key] || {}), email: enable };
      });
      return next;
    });
  };

  const toggleAllWhatsApp = (enable) => {
    setCategories((prev) => {
      const next = {};
      MODULE_REGISTRY.forEach((m) => {
        next[m.key] = { ...(prev[m.key] || {}), whatsapp: enable };
      });
      return next;
    });
  };

  // Row-level Toggle
  const handleCategoryChannelToggle = (moduleKey, channelKey) => {
    setCategories((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || { inApp: true, email: false, whatsapp: false }),
        [channelKey]: !(prev[moduleKey]?.[channelKey] ?? false)
      }
    }));
  };

  // Form Submission
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
        description: 'Updated system notification & announcement delivery channels across all 11 modules'
      }).unwrap();

      toast.success('Notification & announcement matrix saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save notification settings');
    }
  };

  // Formatted summary statistics
  const stats = useMemo(() => {
    let totalInApp = 0;
    let totalEmail = 0;
    let totalWhatsApp = 0;
    MODULE_REGISTRY.forEach((m) => {
      const c = categories[m.key];
      if (c?.inApp) totalInApp++;
      if (c?.email) totalEmail++;
      if (c?.whatsapp) totalWhatsApp++;
    });
    return { totalInApp, totalEmail, totalWhatsApp, totalModules: MODULE_REGISTRY.length };
  }, [categories]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =========================================================================
          CARD 1: Master Admin Channel Strategy & Quick Presets
          ========================================================================= */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 sm:p-6 shadow-2xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#1A3125]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Admin Channel Strategy & Master Routing
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1">
              Select which channels the enterprise platform uses to deliver operational notifications, approvals, and alerts.
            </p>
          </div>

          {/* Quick Preset Badges */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
            <span className="text-[11px] font-medium text-slate-400 dark:text-[#7E9E8F] mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('inApp')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-[#162720] border border-slate-200/80 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              In-App Only
            </button>
            <button
              type="button"
              onClick={() => applyPreset('email')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-[#162720] border border-slate-200/80 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Email Only
            </button>
            <button
              type="button"
              onClick={() => applyPreset('whatsapp')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-[#162720] border border-slate-200/80 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              WhatsApp Only
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors cursor-pointer"
            >
              Mixed (All Active)
            </button>
          </div>
        </div>

        {/* Global Master Channel Toggles */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* In-App Alerts */}
          <div
            onClick={() => setChannels((p) => ({ ...p, inApp: !p.inApp }))}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              channels.inApp
                ? 'bg-emerald-50/40 dark:bg-[#162720]/70 border-emerald-500/40 shadow-2xs'
                : 'bg-slate-50/50 dark:bg-[#0E1713] border-slate-200 dark:border-[#1A3125] opacity-75'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                channels.inApp
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  In-App Alerts
                </span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                    channels.inApp ? 'bg-[#00C471]' : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {channels.inApp && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] mt-1 leading-snug">
                Real-time topbar bell counter, slide-out drawer alerts, and WebSocket live invalidation.
              </p>
            </div>
          </div>

          {/* Email Delivery */}
          <div
            onClick={() => setChannels((p) => ({ ...p, email: !p.email }))}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              channels.email
                ? 'bg-emerald-50/40 dark:bg-[#162720]/70 border-emerald-500/40 shadow-2xs'
                : 'bg-slate-50/50 dark:bg-[#0E1713] border-slate-200 dark:border-[#1A3125] opacity-75'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                channels.email
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Email Delivery
                </span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                    channels.email ? 'bg-[#00C471]' : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {channels.email && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] mt-1 leading-snug">
                Asynchronous branded HTML emails dispatched via background worker queues.
              </p>
            </div>
          </div>

          {/* WhatsApp Business */}
          <div
            onClick={() => setChannels((p) => ({ ...p, whatsapp: !p.whatsapp }))}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              channels.whatsapp
                ? 'bg-emerald-50/40 dark:bg-[#162720]/70 border-emerald-500/40 shadow-2xs'
                : 'bg-slate-50/50 dark:bg-[#0E1713] border-slate-200 dark:border-[#1A3125] opacity-75'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                channels.whatsapp
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  WhatsApp Business
                </span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                    channels.whatsapp ? 'bg-[#00C471]' : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {channels.whatsapp && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] mt-1 leading-snug">
                Direct WhatsApp Cloud API template notifications to employee mobile numbers (+92...).
              </p>
            </div>
          </div>
        </div>

        {/* Global Pipeline Status Pill */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#1A3125] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Global Master Delivery Mode:
          </span>
          <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#162720] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300">
            {[channels.inApp && 'In-App Web', channels.email && 'Email', channels.whatsapp && 'WhatsApp']
              .filter(Boolean)
              .join(' + ') || 'All Suppressed'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          CARD 2: Announcements & Executive Broadcast Channels
          ========================================================================= */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 sm:p-6 shadow-2xs transition-all">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Megaphone className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Announcements & Executive Broadcast Channels
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mb-4">
          Configure how company-wide announcements, policy updates, and executive notices reach staff upon publishing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Notice Board & Bell */}
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1713] cursor-pointer hover:border-slate-300 dark:hover:border-[#224031] transition-all">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-emerald-500" />
              Notice Board & Bell
            </span>
            <input
              type="checkbox"
              checked={announcements.inApp}
              onChange={(e) => setAnnouncements((p) => ({ ...p, inApp: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-500 accent-[#00C471] cursor-pointer"
            />
          </label>

          {/* Announcement Email */}
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1713] cursor-pointer hover:border-slate-300 dark:hover:border-[#224031] transition-all">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
              Announcement Email
            </span>
            <input
              type="checkbox"
              checked={announcements.email}
              onChange={(e) => setAnnouncements((p) => ({ ...p, email: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-500 accent-[#00C471] cursor-pointer"
            />
          </label>

          {/* WhatsApp Broadcast */}
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1713] cursor-pointer hover:border-slate-300 dark:hover:border-[#224031] transition-all">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              WhatsApp Broadcast
            </span>
            <input
              type="checkbox"
              checked={announcements.whatsapp}
              onChange={(e) => setAnnouncements((p) => ({ ...p, whatsapp: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-500 accent-[#00C471] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* =========================================================================
          CARD 3: Full 11-Module Event Delivery Routing Matrix
          ========================================================================= */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 sm:p-6 shadow-2xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Module Event Delivery Routing Matrix
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                11 Modules Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1">
              Fine-tune notification delivery per operational module across in-app, email, and WhatsApp channels.
            </p>
          </div>

          {/* Quick Matrix Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => toggleAllInApp(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-[#162720] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3 h-3 text-emerald-500" />
              Enable All In-App
            </button>
            <button
              type="button"
              onClick={() => {
                toggleAllInApp(true);
                toggleAllEmail(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-[#162720] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              In-App + Email All
            </button>
            <button
              type="button"
              onClick={() => {
                toggleAllInApp(false);
                toggleAllEmail(false);
                toggleAllWhatsApp(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-[#162720] border border-slate-200 dark:border-[#1A3125] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              Mute All
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="divide-y divide-slate-100 dark:divide-[#1A3125] mt-1">
          {MODULE_REGISTRY.map((mod) => {
            const Icon = mod.icon;
            const currentConfig = categories[mod.key] || { inApp: true, email: false, whatsapp: false };

            return (
              <div
                key={mod.key}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-[#162720]/30 px-2 rounded-xl transition-colors"
              >
                {/* Module Identity */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {mod.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {mod.key}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] truncate max-w-md sm:max-w-lg">
                      {mod.description}
                    </p>
                  </div>
                </div>

                {/* Channel Checkbox Pills */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
                  {/* In-App Checkbox */}
                  <label
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryChannelToggle(mod.key, 'inApp');
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                      currentConfig.inApp
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-medium'
                        : 'bg-slate-100 dark:bg-[#162720] border-slate-200 dark:border-[#1A3125] text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] ${
                        currentConfig.inApp ? 'bg-[#00C471]' : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {currentConfig.inApp && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>In-App</span>
                  </label>

                  {/* Email Checkbox */}
                  <label
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryChannelToggle(mod.key, 'email');
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                      currentConfig.email
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-medium'
                        : 'bg-slate-100 dark:bg-[#162720] border-slate-200 dark:border-[#1A3125] text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] ${
                        currentConfig.email ? 'bg-[#00C471]' : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {currentConfig.email && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>Email</span>
                  </label>

                  {/* WhatsApp Checkbox */}
                  <label
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryChannelToggle(mod.key, 'whatsapp');
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                      currentConfig.whatsapp
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-medium'
                        : 'bg-slate-100 dark:bg-[#162720] border-slate-200 dark:border-[#1A3125] text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] ${
                        currentConfig.whatsapp ? 'bg-[#00C471]' : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {currentConfig.whatsapp && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Matrix Active Summary Statistics */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1A3125] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-[#7E9E8F]">
          <div className="flex items-center gap-4">
            <span>
              In-App Active: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{stats.totalInApp}</strong>/{stats.totalModules}
            </span>
            <span>
              Email Active: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{stats.totalEmail}</strong>/{stats.totalModules}
            </span>
            <span>
              WhatsApp Active: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{stats.totalWhatsApp}</strong>/{stats.totalModules}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            * Changes take effect immediately across all dispatch workers.
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM STICKY BAR: Save Actions & Progress Indicator
          ========================================================================= */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Strategy...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Channel Strategy</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
