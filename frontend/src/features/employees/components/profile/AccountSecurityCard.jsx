/**
 * @file AccountSecurityCard.jsx
 * @description Card managing account credentials, 2FA protection, and session activity.
 * 
 * SPECIFICATION & SECURITY PROTOCOL:
 * - Module: M1 Authentication & M3 Employee Self-Service
 * - Replaces technical database jargon with clean, authoritative enterprise copy.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  KeyRound,
  History,
  Lock,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';
import { formatDate } from '../../../../lib/formatters.js';

export function AccountSecurityCard({
  user,
  employee,
  is2faActive,
  onOpen2faModal,
  onOpenChangePasswordModal
}) {
  const navigate = useNavigate();

  const lastLogin = user?.lastLoginAt || employee?.userId?.lastLoginAt;

  return (
    <Card className="p-5 border-slate-200 dark:border-[#1A3125] dark:bg-[#111D17] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-[#00C471]" />
          <span>Security & Authentication Credentials</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00C471] bg-emerald-50 dark:bg-[#162820] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
          Account Defense
        </span>
      </div>

      {/* Security Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Password Management */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#00C471]" /> Account Password
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Update your account credentials to keep your profile secure.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenChangePasswordModal}
            className="w-full mt-2 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-[#00C471] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Change Password
          </button>
        </div>

        {/* 2FA Protection */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#00C471]" /> Two-Factor (2FA)
              </span>
              {is2faActive ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-[#162820] text-emerald-800 dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enforce a one-time passcode on every sign-in attempt.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen2faModal}
            className="w-full mt-2 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-[#00C471] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00C471]" />
            {is2faActive ? 'Configure 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </div>

      {/* Session & Sign-In History Link */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1A3125] flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Last authenticated:{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {lastLogin ? formatDate(lastLogin) : 'Active Session'}
          </span>
        </span>

        <button
          type="button"
          onClick={() => navigate('/login-history')}
          className="text-xs font-semibold text-emerald-700 dark:text-[#00C471] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" /> View Login History
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
}

AccountSecurityCard.propTypes = {
  user: PropTypes.object,
  employee: PropTypes.object,
  is2faActive: PropTypes.bool,
  onOpen2faModal: PropTypes.func,
  onOpenChangePasswordModal: PropTypes.func
};
