/**
 * @file IdCardPreviewBadge.jsx
 * @description High-Fidelity Standard ISO/IEC 7810 ID-1 (CR80) Employee ID Card Badge Renderer.
 * Supports Front & Back view, Vertical (Portrait) & Horizontal (Landscape) geometry, and 4 theme presets.
 * Adheres strictly to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React from 'react';
import {
  Building2,
  Droplet,
  Phone,
  QrCode,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  User,
  Sparkles
} from 'lucide-react';

export function IdCardPreviewBadge({
  employee = {},
  company = {},
  config = {},
  activeSide = 'front' // 'front' | 'back'
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
    cardValidityYears = 2,
    backDisclaimer = 'This credential card remains the property of the organization. If found, please return to Human Resources.'
  } = config;

  // Resolve employee coordinates
  const displayName = employee.name || 'Muhammad Hamza';
  const displayCode = employee.employeeCode || 'EMP-1049';
  const displayDept = employee.department || 'Information Technology';
  const displayDesig = employee.designation || 'Lead Systems Architect';
  const displayBlood = employee.bloodGroup || 'O+';
  const displayAvatar = employee.avatar || '';
  const displayPhone = employee.phone || company.phone || '+92 51 1234567';
  const displayEmergency = employee.emergencyContact || {
    name: 'Emergency Operations',
    relationship: 'Corporate Security',
    phone: company.phone || '+92 51 1234567'
  };

  const companyName = company.name || 'Starlight Software Ltd';
  const companyLogo = company.logoUrl || '';

  // Theme-specific surface classes
  const themeStyles = {
    forest: {
      cardBg: 'bg-[#061A14] text-white border-[#0B261D]',
      headerBg: 'bg-[#0B261D] border-[#16382B]',
      accentColor: '#00C471',
      subText: 'text-emerald-400/80',
      tagBg: 'bg-emerald-950/60 text-[#00C471] border-emerald-800/60',
      stripeBg: 'bg-slate-900 border-slate-800'
    },
    emerald: {
      cardBg: 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white border-slate-200 dark:border-[#1A3125]',
      headerBg: 'bg-[#00C471] text-white border-emerald-600',
      accentColor: '#00C471',
      subText: 'text-emerald-600 dark:text-emerald-400',
      tagBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-800/60',
      stripeBg: 'bg-slate-800 border-slate-700'
    },
    light: {
      cardBg: 'bg-slate-50 text-slate-900 border-slate-300 shadow-sm',
      headerBg: 'bg-white border-slate-200',
      accentColor: '#0F172A',
      subText: 'text-slate-500',
      tagBg: 'bg-slate-200/80 text-slate-800 border-slate-300',
      stripeBg: 'bg-slate-700 border-slate-600'
    },
    dark: {
      cardBg: 'bg-[#0F172A] text-white border-slate-800',
      headerBg: 'bg-[#1E293B] border-slate-700',
      accentColor: '#38BDF8',
      subText: 'text-sky-400',
      tagBg: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
      stripeBg: 'bg-black border-slate-900'
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles.forest;
  const isVertical = layout === 'vertical';

  return (
    <div
      className={`relative select-none transition-all duration-300 overflow-hidden rounded-2xl border shadow-xl flex flex-col justify-between ${
        currentTheme.cardBg
      } ${
        isVertical
          ? 'w-[250px] h-[395px] max-w-full'
          : 'w-[395px] h-[250px] max-w-full'
      }`}
      style={{
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* ============================================================ */}
      {/* FRONT SIDE VIEW */}
      {/* ============================================================ */}
      {activeSide === 'front' && (
        <div className="h-full flex flex-col justify-between p-4">
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 dark:border-white/10 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-7 h-7 object-contain rounded-lg p-0.5 bg-white shrink-0"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-extrabold text-[11px] uppercase tracking-wider block truncate leading-tight">
                  {companyName}
                </span>
                <span className={`text-[9px] font-semibold tracking-widest uppercase block ${currentTheme.subText}`}>
                  Official Credential
                </span>
              </div>
            </div>

            {showBloodGroup && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 shrink-0 ${currentTheme.tagBg}`}>
                <Droplet className="w-2.5 h-2.5 fill-current" />
                {displayBlood}
              </span>
            )}
          </div>

          {/* Center Identity Block */}
          {isVertical ? (
            /* Vertical Portrait Layout */
            <div className="flex flex-col items-center text-center my-auto py-2 space-y-2">
              {/* Photo Frame */}
              <div
                className="w-20 h-20 rounded-2xl p-0.5 border-2 overflow-hidden shadow-md flex items-center justify-center bg-slate-100 dark:bg-white/5"
                style={{ borderColor: primaryColor }}
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-xl text-slate-600 dark:text-slate-300">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Titles */}
              <div className="w-full px-2">
                <h3 className="font-extrabold text-sm tracking-tight truncate leading-tight">
                  {displayName}
                </h3>
                {showDesignation && (
                  <p className={`text-[11px] font-semibold truncate mt-0.5 ${currentTheme.subText}`}>
                    {displayDesig}
                  </p>
                )}
                {showDepartment && (
                  <p className="text-[10px] opacity-75 truncate mt-0.5">
                    {displayDept}
                  </p>
                )}
              </div>

              {/* Badge ID Tag */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border border-white/20 bg-white/5">
                <span>ID: {displayCode}</span>
              </div>
            </div>
          ) : (
            /* Horizontal Landscape Layout */
            <div className="flex items-center gap-4 my-auto py-1">
              <div
                className="w-20 h-20 rounded-2xl p-0.5 border-2 overflow-hidden shadow-md shrink-0 flex items-center justify-center bg-slate-100 dark:bg-white/5"
                style={{ borderColor: primaryColor }}
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-xl text-slate-600 dark:text-slate-300">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-extrabold text-sm tracking-tight truncate leading-tight">
                  {displayName}
                </h3>
                {showDesignation && (
                  <p className={`text-[11px] font-semibold truncate ${currentTheme.subText}`}>
                    {displayDesig}
                  </p>
                )}
                {showDepartment && (
                  <p className="text-[10px] opacity-75 truncate">
                    {displayDept}
                  </p>
                )}
                <div className="pt-0.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-white/20 bg-white/5">
                    ID: {displayCode}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Verification & Barcode Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            {/* Barcode Simulation */}
            {showBarcode ? (
              <div className="flex-1 overflow-hidden">
                <div className="h-4 flex items-center gap-[2px] opacity-75">
                  {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 2, 3].map(
                    (w, i) => (
                      <span
                        key={i}
                        className="h-full bg-current inline-block"
                        style={{ width: `${w}px` }}
                      />
                    )
                  )}
                </div>
                <div className="text-[8px] font-mono tracking-widest opacity-60 mt-0.5">
                  {displayCode}
                </div>
              </div>
            ) : (
              <div className="text-[9px] font-mono opacity-60">
                AUTH: {displayCode}
              </div>
            )}

            {/* Smart QR Scanner Code Simulation */}
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 shrink-0 flex items-center justify-center shadow-xs">
              <QrCode className="w-full h-full text-slate-950" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BACK SIDE VIEW */}
      {/* ============================================================ */}
      {activeSide === 'back' && (
        <div className="h-full flex flex-col justify-between p-4">
          {/* Magnetic Stripe Simulation Banner */}
          <div className="w-full -mx-4 -mt-4 mb-3">
            <div className="h-8 bg-slate-900 border-b border-slate-800 w-full flex items-center px-4">
              <div className="h-2 w-full bg-slate-800/80 rounded-xs" />
            </div>
          </div>

          {/* Back Info Content */}
          <div className="space-y-2.5 text-[10px] flex-1">
            {/* Emergency Contact */}
            {showEmergencyContact && (
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <span className={`font-bold uppercase tracking-wider block text-[9px] ${currentTheme.subText}`}>
                  Emergency Contact
                </span>
                <p className="font-semibold truncate">
                  {displayEmergency.name} ({displayEmergency.relationship || 'Contact'})
                </p>
                <p className="font-mono text-[9px] opacity-80 flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" /> {displayEmergency.phone}
                </p>
              </div>
            )}

            {/* Corporate Return Coordinates */}
            <div className="space-y-0.5 px-1">
              <span className={`font-bold uppercase tracking-wider block text-[9px] ${currentTheme.subText}`}>
                Corporate Headquarters
              </span>
              <p className="leading-tight opacity-80 line-clamp-2">
                {company.address || 'Plot 14, Sector I-9, Islamabad, Pakistan'}
              </p>
              <p className="font-mono text-[9px] opacity-75">
                Tel: {company.phone || '+92 51 1234567'} • Web: {company.website || 'starlight.pk'}
              </p>
            </div>
          </div>

          {/* Legal Return Disclaimer */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <p className="text-[8px] leading-tight opacity-60 text-justify">
              {backDisclaimer}
            </p>
            <div className="flex items-center justify-between text-[8px] font-mono opacity-60 pt-0.5">
              <span>VALIDITY: {cardValidityYears} YRS</span>
              <span className="flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> SECURE ID
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
