/**
 * @file ProfileHeader.jsx
 * @description Master Hero Banner with interactive avatar upload and identity badges.
 * 
 * SPECIFICATION & BRAND ARCHETYPE:
 * - Module: M3 Employee Management / Profile Self-Service
 * - Theme: Forest & Emerald Enterprise Craft (#111D17 surface, #1A3125 border, #00C471 accent)
 * - File rules: JPEG, PNG, WEBP, max 3MB with client-side format & size guard.
 */

import React, { useRef } from 'react';
import {
  Mail,
  Phone,
  Shield,
  Camera,
  Loader2,
  Crown,
  ShieldCheck,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { StatusBadge } from '../../../../components/common/StatusBadge.jsx';
import { formatCNIC } from '../../../../lib/formatters.js';

export function ProfileHeader({
  employee,
  user,
  isSuperAdminRole,
  isHRRole,
  isDeptManagerRole,
  onUploadAvatar,
  isUploadingAvatar,
  primaryAction
}) {
  const fileInputRef = useRef(null);

  const currentAvatar = employee?.avatar || user?.avatar;

  const initials = employee?.name
    ? employee.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : isSuperAdminRole
    ? 'SA'
    : isHRRole
    ? 'HR'
    : isDeptManagerRole
    ? 'DM'
    : 'EM';

  const roleTitle = isSuperAdminRole
    ? 'System Owner & Root Authority'
    : isHRRole
    ? 'People Operations Executive'
    : isDeptManagerRole
    ? `${employee?.departmentId?.name || 'Department'} Lead`
    : employee?.designationId?.title || 'Staff Member';

  const rolePill = isSuperAdminRole ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-md">
      <Crown className="w-3 h-3 fill-amber-300" /> System Owner
    </span>
  ) : isHRRole ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> HR Executive
    </span>
  ) : isDeptManagerRole ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
      <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Department Lead
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md">
      <UserCheck className="w-3.5 h-3.5 text-[#00C471]" /> Staff Member
    </span>
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadAvatar) {
      onUploadAvatar(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1A13] via-[#11241B] to-[#0A1811] border border-[#1A3125] p-6 md:p-8 text-white shadow-xl">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#00C471]/12 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#047857]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar Block with Upload Trigger */}
          <div className="relative shrink-0 group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden cursor-pointer shadow-xl border-2 border-[#1A3125] group-hover:border-[#00C471]/60 transition-all duration-200 group-hover:scale-[1.02] flex items-center justify-center select-none bg-[#162820]"
              title="Click to update profile photo (JPEG, PNG, WEBP, max 3MB)"
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={employee?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl md:text-3xl tracking-wider bg-gradient-to-tr from-[#047857] to-[#00C471] text-slate-950">
                  {initials}
                </div>
              )}

              {/* Hover / Loading Overlay */}
              <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
                  isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white drop-shadow" />
                    <span className="text-[10px] font-bold text-white tracking-wider uppercase drop-shadow">
                      {currentAvatar ? 'Change' : 'Upload'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Corner Badge Icon */}
            <div className="absolute -bottom-2 -right-2 z-10 pointer-events-none p-1.5 rounded-xl shadow-md border-2 border-[#0B1A13] bg-[#162820] text-[#00C471]">
              {isSuperAdminRole ? (
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ) : isHRRole ? (
                <ShieldCheck className="w-3.5 h-3.5 text-[#00C471]" />
              ) : isDeptManagerRole ? (
                <Briefcase className="w-3.5 h-3.5 text-[#00C471]" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[#00C471]" />
              )}
            </div>
          </div>

          {/* Identity & Metadata */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {employee?.name || user?.email?.split('@')[0] || 'User Profile'}
              </h1>

              {employee?.employeeCode && (
                <span className="text-xs font-mono font-bold text-[#00C471] bg-[#00C471]/15 border border-[#00C471]/30 px-2.5 py-0.5 rounded-md">
                  {employee.employeeCode}
                </span>
              )}

              {rolePill}

              <StatusBadge status={employee?.status || 'Active'} />
            </div>

            <p className="text-xs md:text-sm text-slate-300 font-medium">
              {roleTitle}
              {employee?.departmentId?.name && !isSuperAdminRole && (
                <span> • {employee.departmentId.name}</span>
              )}
            </p>

            {/* Quick Contact Strip */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-xs text-slate-300 pt-2">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00C471]" />
                {employee?.email || user?.email || '—'}
              </span>

              {employee?.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#00C471]" />
                  {employee.phone}
                </span>
              )}

              {employee?.cnic && (
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#00C471]" />
                  CNIC: {formatCNIC(employee.cnic)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Slot */}
        {primaryAction && (
          <div className="shrink-0 self-center md:self-start pt-2 md:pt-0">
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
