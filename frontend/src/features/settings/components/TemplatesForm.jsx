/**
 * @file TemplatesForm.jsx
 * @description Email & WhatsApp Notification Template Builder with Live Sandbox Preview (Slice 2.9).
 */

import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Tag,
  Eye,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Building2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

const TEMPLATE_KEYS = [
  { id: 'welcomeEmail', label: 'New Hire Welcome Email', type: 'email', channel: 'Email' },
  { id: 'leaveApproval', label: 'Leave Request Status', type: 'email', channel: 'Email' },
  { id: 'payslipDispatch', label: 'Payslip Delivery Email', type: 'email', channel: 'Email' },
  { id: 'passwordReset', label: 'Security Password Reset OTP', type: 'email', channel: 'Email' },
  { id: 'whatsappAlert', label: 'WhatsApp Instant Notification', type: 'whatsapp', channel: 'WhatsApp' }
];

const CANONICAL_DEFAULTS = {
  welcomeEmail: {
    subject: 'Welcome to {{company}}!',
    body: 'Dear {{name}},\n\nWelcome to {{company}}! Your employee portal login has been activated. Please log in with your corporate email to review your onboarding checklist and complete your profile.'
  },
  leaveApproval: {
    subject: 'Leave Request Update — {{company}}',
    body: 'Dear {{name}},\n\nYour leave application for {{date}} has been reviewed and approved by management. Your leave balance has been updated accordingly.'
  },
  payslipDispatch: {
    subject: 'Monthly Salary Advice for {{date}}',
    body: 'Dear {{name}},\n\nYour monthly salary advice slip for {{date}} has been disbursed. Please log into the self-service employee portal to download your branded PDF payslip.'
  },
  passwordReset: {
    subject: 'Security Verification OTP — {{company}}',
    body: 'Dear {{name}},\n\nYour security verification code is {{otp}}. This code expires in 10 minutes. If you did not initiate this request, please alert HR immediately.'
  },
  whatsappAlert: {
    body: 'HRM Alert: Dear {{name}}, your request for {{date}} has been processed by {{company}}. Check your portal for details.'
  }
};

const AVAILABLE_PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Employee Full Name' },
  { tag: '{{company}}', desc: 'Company Legal Name' },
  { tag: '{{date}}', desc: 'Formatted Date / Period' },
  { tag: '{{otp}}', desc: '6-Digit Verification Code' },
  { tag: '{{designation}}', desc: 'Job Title / Designation' }
];

export function TemplatesForm({ initialData = {}, onSaved }) {
  const [selectedKey, setSelectedKey] = useState('welcomeEmail');
  const [templates, setTemplates] = useState(initialData && Object.keys(initialData).length > 0 ? initialData : CANONICAL_DEFAULTS);
  const [activeTemplate, setActiveTemplate] = useState({
    subject: initialData?.[selectedKey]?.subject || CANONICAL_DEFAULTS[selectedKey]?.subject || '',
    body: initialData?.[selectedKey]?.body || CANONICAL_DEFAULTS[selectedKey]?.body || ''
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setTemplates(initialData);
      setActiveTemplate({
        subject: initialData[selectedKey]?.subject || CANONICAL_DEFAULTS[selectedKey]?.subject || '',
        body: initialData[selectedKey]?.body || CANONICAL_DEFAULTS[selectedKey]?.body || ''
      });
    }
  }, [initialData]);

  const handleTemplateSelect = (key) => {
    setSelectedKey(key);
    setActiveTemplate({
      subject: templates[key]?.subject || CANONICAL_DEFAULTS[key]?.subject || '',
      body: templates[key]?.body || CANONICAL_DEFAULTS[key]?.body || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActiveTemplate((prev) => ({ ...prev, [name]: value }));
    setTemplates((prev) => ({
      ...prev,
      [selectedKey]: {
        ...prev[selectedKey],
        [name]: value
      }
    }));
  };

  const insertPlaceholder = (tag, targetField = 'body') => {
    if (targetField === 'subject' && activeTemplate.subject !== undefined) {
      const newSubject = `${activeTemplate.subject} ${tag}`;
      setActiveTemplate((prev) => ({ ...prev, subject: newSubject }));
      setTemplates((t) => ({
        ...t,
        [selectedKey]: { ...t[selectedKey], subject: newSubject }
      }));
    } else {
      const newBody = `${activeTemplate.body} ${tag}`;
      setActiveTemplate((prev) => ({ ...prev, body: newBody }));
      setTemplates((t) => ({
        ...t,
        [selectedKey]: { ...t[selectedKey], body: newBody }
      }));
    }
  };

  const handleResetToDefault = () => {
    const def = CANONICAL_DEFAULTS[selectedKey];
    if (def) {
      setActiveTemplate({
        subject: def.subject || '',
        body: def.body || ''
      });
      setTemplates((prev) => ({
        ...prev,
        [selectedKey]: def
      }));
      toast.success('Template reset to system default blueprint');
    }
  };

  const getPreviewText = (text) => {
    if (!text) return '';
    return text
      .replace(/{{name}}/g, 'Hamza Tariq')
      .replace(/{{company}}/g, 'Starlight Software Ltd')
      .replace(/{{date}}/g, 'October 2026')
      .replace(/{{otp}}/g, '489201')
      .replace(/{{designation}}/g, 'Senior Software Engineer');
  };

  const currentDef = TEMPLATE_KEYS.find((t) => t.id === selectedKey) || TEMPLATE_KEYS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const merged = {
        ...templates,
        [selectedKey]: activeTemplate
      };

      await updateSetting({
        key: 'templates',
        value: merged,
        description: `Updated notification template: ${selectedKey}`
      }).unwrap();

      toast.success('Notification templates saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to save templates');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              Communication Templates Studio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize dynamic email and WhatsApp message templates using mustache interpolation tokens.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
        </div>

        {/* Template Selector Horizontal Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TEMPLATE_KEYS.map((item) => {
            const isSelected = selectedKey === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTemplateSelect(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                }`}
              >
                {item.type === 'email' ? (
                  <Mail className="w-3.5 h-3.5" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>{item.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800">
                  {item.channel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clickable Token Chips */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-emerald-500" />
            Click to Insert Dynamic Placeholder:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {AVAILABLE_PLACEHOLDERS.map((ph) => (
              <button
                type="button"
                key={ph.tag}
                onClick={() => insertPlaceholder(ph.tag, 'body')}
                className="px-2.5 py-1 bg-white dark:bg-[#111D17] hover:border-emerald-500 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-emerald-600 dark:text-emerald-400 shadow-2xs transition-all cursor-pointer"
                title={ph.desc}
              >
                {ph.tag}
                <span className="text-[10px] text-slate-400 ml-1.5 font-sans">({ph.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Split Screen: Editor on Left, Live Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Editor Column */}
          <div className="space-y-4">
            {currentDef.type === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={activeTemplate.subject || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Welcome to {{company}}!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message Body Payload *
              </label>
              <textarea
                name="body"
                required
                rows={8}
                value={activeTemplate.body || ''}
                onChange={handleInputChange}
                placeholder="Compose notification body..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Realistic Live Preview Column */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              Live Context Preview:
            </span>

            {currentDef.type === 'email' ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                {/* Email Window Header */}
                <div className="bg-slate-100 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 ml-2">Inbox Preview</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">From: hr@starlight.pk</span>
                </div>

                <div className="p-4 bg-white dark:bg-[#111D17] space-y-3">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Subject</span>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {getPreviewText(activeTemplate.subject) || '—'}
                    </h5>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed min-h-[120px]">
                    {getPreviewText(activeTemplate.body) || 'Message preview will render here...'}
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Generated by HRM Notification Engine</span>
                    <span>Confidential</span>
                  </div>
                </div>
              </div>
            ) : (
              /* WhatsApp Preview Bubble */
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-[#EFEAE2] dark:bg-[#0C1317] flex flex-col justify-end min-h-[240px]">
                <div className="max-w-[85%] bg-[#D9FDD3] dark:bg-[#005C4B] text-slate-900 dark:text-white p-3 rounded-2xl rounded-tl-xs shadow-xs space-y-1.5 self-start">
                  <p className="text-xs whitespace-pre-line leading-relaxed">
                    {getPreviewText(activeTemplate.body) || 'WhatsApp message preview...'}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 dark:text-slate-300">
                    <span>10:45 AM</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? 'Saving Templates...' : 'Save Communication Templates'}
        </button>
      </div>
    </form>
  );
}
