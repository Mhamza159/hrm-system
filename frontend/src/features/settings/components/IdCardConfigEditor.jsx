/**
 * @file IdCardConfigEditor.jsx
 * @description Interactive Design Studio Controls for Corporate Employee ID Cards (Phase 36 / Plan 36-03).
 * Allows Super Admin and HR to configure physical badge parameters and layout options.
 */

import React from 'react';
import {
  CreditCard,
  Palette,
  Sliders,
  Check,
  RotateCcw,
  Shield,
  Layers
} from 'lucide-react';

export function IdCardConfigEditor({
  config = {},
  onChange,
  disabled = false
}) {
  const {
    layout = 'vertical',
    theme = 'forest',
    primaryColor = '#00C471',
    showBloodGroup = true,
    showEmergencyContact = true,
    showDepartment = true,
    showDesignation = true,
    showJoiningDate = true,
    showBarcode = true,
    qrCodeType = 'verification',
    cardValidityYears = 2,
    backDisclaimer = 'This credential card remains the property of the organization. If found, please return to Human Resources.'
  } = config;

  const handleToggle = (key) => {
    if (disabled) return;
    onChange({ ...config, [key]: !config[key] });
  };

  const handleChange = (key, value) => {
    if (disabled) return;
    onChange({ ...config, [key]: value });
  };

  const themes = [
    { id: 'forest', label: 'Elvara Forest', color: '#061A14', border: '#00C471' },
    { id: 'emerald', label: 'Emerald Corporate', color: '#00C471', border: '#00C471' },
    { id: 'light', label: 'Executive Light', color: '#F8FAFC', border: '#CBD5E1' },
    { id: 'dark', label: 'Midnight Slate', color: '#0F172A', border: '#38BDF8' }
  ];

  const colorPresets = [
    '#00C471', // Emerald
    '#2563EB', // Blue
    '#7C3AED', // Purple
    '#EA580C', // Orange
    '#0F172A'  // Slate
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Layout & Orientation */}
      <div className="space-y-2">
        <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#00C471]" />
          Card Layout & Orientation
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleChange('layout', 'vertical')}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              layout === 'vertical'
                ? 'bg-emerald-50/80 border-[#00C471] ring-2 ring-[#00C471]/20 dark:bg-emerald-950/40 dark:border-[#00C471] text-emerald-900 dark:text-emerald-200'
                : 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div>
              <span className="font-bold block">Portrait (Standard)</span>
              <span className="text-[10px] text-slate-400">Vertical CR80 format</span>
            </div>
            {layout === 'vertical' && <Check className="w-4 h-4 text-[#00C471]" />}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handleChange('layout', 'horizontal')}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              layout === 'horizontal'
                ? 'bg-emerald-50/80 border-[#00C471] ring-2 ring-[#00C471]/20 dark:bg-emerald-950/40 dark:border-[#00C471] text-emerald-900 dark:text-emerald-200'
                : 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div>
              <span className="font-bold block">Landscape (Badge)</span>
              <span className="text-[10px] text-slate-400">Horizontal lanyard format</span>
            </div>
            {layout === 'horizontal' && <Check className="w-4 h-4 text-[#00C471]" />}
          </button>
        </div>
      </div>

      {/* 2. Visual Theme & Palette */}
      <div className="space-y-2">
        <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#00C471]" />
          Visual Theme & Styling
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {themes.map((t) => (
            <button
              type="button"
              key={t.id}
              disabled={disabled}
              onClick={() => handleChange('theme', t.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-18 ${
                theme === t.id
                  ? 'border-[#00C471] ring-2 ring-[#00C471]/20 bg-slate-50 dark:bg-white/5'
                  : 'border-slate-200 dark:border-[#1A3125] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ backgroundColor: t.color }}
                />
                {theme === t.id && <Check className="w-3.5 h-3.5 text-[#00C471]" />}
              </div>
              <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Accent Color Presets */}
      <div className="space-y-2">
        <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
          Accent Brand Highlight Color
        </label>
        <div className="flex items-center gap-2">
          {colorPresets.map((c) => (
            <button
              type="button"
              key={c}
              disabled={disabled}
              onClick={() => handleChange('primaryColor', c)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border ${
                primaryColor === c ? 'scale-110 ring-2 ring-emerald-500/50 border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            >
              {primaryColor === c && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
          <input
            type="text"
            value={primaryColor}
            disabled={disabled}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            className="w-24 px-2 py-1 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-lg font-mono text-[11px] ml-2 text-slate-800 dark:text-slate-200"
            placeholder="#00C471"
          />
        </div>
      </div>

      {/* 4. Display Toggles Suite */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
        <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#00C471]" />
          Card Information Elements
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { key: 'showBloodGroup', label: 'Blood Group Badge', desc: 'Display employee medical blood type' },
            { key: 'showEmergencyContact', label: 'Emergency Contact Block', desc: 'Show designated contact on back' },
            { key: 'showDepartment', label: 'Department Name', desc: 'Print assigned organizational unit' },
            { key: 'showDesignation', label: 'Designation Title', desc: 'Print corporate job title' },
            { key: 'showJoiningDate', label: 'Joining & Validity Dates', desc: 'Display employment tenure date' },
            { key: 'showBarcode', label: 'Digital Barcode Strip', desc: 'Print machine-readable employee code' }
          ].map((item) => (
            <label
              key={item.key}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                config[item.key]
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60'
                  : 'bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125]'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(config[item.key])}
                disabled={disabled}
                onChange={() => handleToggle(item.key)}
                className="mt-0.5 rounded text-[#00C471] focus:ring-[#00C471]"
              />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {item.desc}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Card Validity & Disclaimer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="space-y-1">
          <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
            Card Validity (Years)
          </label>
          <select
            value={cardValidityYears}
            disabled={disabled}
            onChange={(e) => handleChange('cardValidityYears', Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value={1}>1 Year from Issue</option>
            <option value={2}>2 Years from Issue</option>
            <option value={3}>3 Years from Issue</option>
            <option value={5}>5 Years from Issue</option>
          </select>
        </div>

        <div className="sm:col-span-2 space-y-1">
          <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
            Back-Side Regulatory Return Disclaimer
          </label>
          <input
            type="text"
            value={backDisclaimer}
            disabled={disabled}
            onChange={(e) => handleChange('backDisclaimer', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-200"
            placeholder="This card is the property of..."
          />
        </div>
      </div>
    </div>
  );
}
