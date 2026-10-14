/**
 * @file TemplatesForm.jsx
 * @description Email & WhatsApp Notification Template Builder with Placeholders (Slice 2.9).
 */

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Tag, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

const TEMPLATE_KEYS = [
  { id: 'welcomeEmail', label: 'New Hire Welcome Email', type: 'email' },
  { id: 'leaveApproval', label: 'Leave Request Status', type: 'email' },
  { id: 'payslipDispatch', label: 'Payslip Delivery Email', type: 'email' },
  { id: 'passwordReset', label: 'Security Password Reset OTP', type: 'email' },
  { id: 'whatsappAlert', label: 'WhatsApp Instant Notification', type: 'whatsapp' }
];

const AVAILABLE_PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Employee Full Name' },
  { tag: '{{company}}', desc: 'Registered Company Name' },
  { tag: '{{date}}', desc: 'Current Date / Period' },
  { tag: '{{otp}}', desc: '6-Digit Verification OTP' }
];

export function TemplatesForm({ initialData = {}, onSaved }) {
  const [selectedKey, setSelectedKey] = useState('welcomeEmail');
  const [templates, setTemplates] = useState(initialData || {});
  const [activeTemplate, setActiveTemplate] = useState({
    subject: initialData?.[selectedKey]?.subject || '',
    body: initialData?.[selectedKey]?.body || ''
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData) {
      setTemplates(initialData);
      setActiveTemplate({
        subject: initialData[selectedKey]?.subject || '',
        body: initialData[selectedKey]?.body || ''
      });
    }
  }, [initialData, selectedKey]);

  const handleTemplateSelect = (key) => {
    setSelectedKey(key);
    setActiveTemplate({
      subject: templates[key]?.subject || '',
      body: templates[key]?.body || ''
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

  const insertPlaceholder = (tag) => {
    setActiveTemplate((prev) => {
      const newBody = `${prev.body} ${tag}`;
      setTemplates((t) => ({
        ...t,
        [selectedKey]: { ...t[selectedKey], body: newBody }
      }));
      return { ...prev, body: newBody };
    });
  };

  const getPreviewText = (text) => {
    if (!text) return '';
    return text
      .replace(/{{name}}/g, 'Hamza Tariq')
      .replace(/{{company}}/g, 'Starlight Software Ltd')
      .replace(/{{date}}/g, 'October 2026')
      .replace(/{{otp}}/g, '489201');
  };

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

      toast.success('Notification template saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update template');
    }
  };

  const currentDef = TEMPLATE_KEYS.find((k) => k.id === selectedKey);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selectors */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_KEYS.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handleTemplateSelect(item.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedKey === item.id
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {item.type === 'whatsapp' ? (
              <MessageSquare className="w-3.5 h-3.5" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authoring Pane */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500" />
            Edit Template: {currentDef?.label}
          </h3>

          {currentDef?.type === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Subject Line *
              </label>
              <input
                type="text"
                name="subject"
                required
                value={activeTemplate.subject}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message Body *
            </label>
            <textarea
              name="body"
              required
              rows={8}
              value={activeTemplate.body}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Available Dynamic Variables (Click to Insert)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PLACEHOLDERS.map((ph) => (
                <button
                  type="button"
                  key={ph.tag}
                  onClick={() => insertPlaceholder(ph.tag)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-medium transition-colors"
                  title={ph.desc}
                >
                  {ph.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Interpolated Preview Pane */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-500" />
            Live Preview (With Sample Employee Data)
          </h3>

          {currentDef?.type === 'email' && (
            <div className="p-3 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Subject:</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {getPreviewText(activeTemplate.subject) || '(No subject entered)'}
              </p>
            </div>
          )}

          <div className="p-4 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-slate-800 rounded-xl min-h-[160px]">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Message Content:</span>
            <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {getPreviewText(activeTemplate.body) || '(No body text entered)'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-300">
            Preview renders dynamically using mock recipient: <strong>Hamza Tariq</strong>, organization: <strong>Starlight Software Ltd</strong>.
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Template...' : 'Save Template'}
        </button>
      </div>
    </form>
  );
}
