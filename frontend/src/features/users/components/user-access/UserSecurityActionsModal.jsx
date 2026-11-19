/**
 * @file UserSecurityActionsModal.jsx
 * @description Forensic Security Actions Modal for User Access Governance.
 * Supports:
 *  1. Unlock Locked User Account
 *  2. Revoke Active Sessions & Tokens
 *  3. Force Password Change on Next Login
 *  4. Emergency Password Reset (Generates Temp Password)
 *  5. Hardware Device Unbinding (QR / Kiosk Attendance)
 * 
 * Adheres strictly to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Unlock,
  LogOut,
  KeyRound,
  RefreshCw,
  Smartphone,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useUnlockUserAccountMutation,
  useRevokeUserSessionsMutation,
  useForcePasswordChangeMutation,
  useAdminResetPasswordMutation,
  useResetDeviceBindingMutation
} from '../../usersApi.js';

const SECURITY_ACTIONS = [
  {
    id: 'unlock',
    label: 'Unlock Account',
    shortDesc: 'Clear failed login attempts & restore sign-in ability',
    icon: Unlock,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-[#00C471] dark:border-emerald-800/60'
  },
  {
    id: 'revoke_sessions',
    label: 'Revoke Sessions',
    shortDesc: 'Evict active refresh tokens & force re-authentication',
    icon: LogOut,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60'
  },
  {
    id: 'force_password_change',
    label: 'Force Password Change',
    shortDesc: 'Require employee to set a new password on next login',
    icon: KeyRound,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60'
  },
  {
    id: 'reset_password',
    label: 'Emergency Reset',
    shortDesc: 'Generate a random temporary password for the user',
    icon: RefreshCw,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60'
  },
  {
    id: 'reset_device',
    label: 'Unbind Device',
    shortDesc: 'Clear registered mobile or hardware kiosk device binding',
    icon: Smartphone,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-800/60'
  }
];

export function UserSecurityActionsModal({
  user,
  initialAction = 'unlock',
  isOpen,
  onClose,
  onSuccess
}) {
  const [selectedAction, setSelectedAction] = useState(initialAction);
  const [reason, setReason] = useState('');
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [unlockAccount, { isLoading: isUnlocking }] = useUnlockUserAccountMutation();
  const [revokeSessions, { isLoading: isRevoking }] = useRevokeUserSessionsMutation();
  const [forcePasswordChange, { isLoading: isForcing }] = useForcePasswordChangeMutation();
  const [adminResetPwd, { isLoading: isResettingPwd }] = useAdminResetPasswordMutation();
  const [resetDevice, { isLoading: isResettingDevice }] = useResetDeviceBindingMutation();

  const isSubmitting = isUnlocking || isRevoking || isForcing || isResettingPwd || isResettingDevice;

  useEffect(() => {
    if (isOpen) {
      setSelectedAction(initialAction || 'unlock');
      setReason('');
      setTempPassword(null);
      setCopied(false);
      setShowPassword(false);
    }
  }, [isOpen, initialAction, user]);

  if (!isOpen || !user) return null;

  const displayName = user.name || user.email?.split('@')[0] || 'User Account';
  const isLocked = Boolean(user.isLocked);

  const handleCopyPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success('Temporary password copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    try {
      if (selectedAction === 'unlock') {
        const res = await unlockAccount({
          id: user._id,
          reason: reason.trim() || 'Administrative account unlock'
        }).unwrap();
        toast.success(res?.message || 'User account unlocked successfully.');
      } else if (selectedAction === 'revoke_sessions') {
        const res = await revokeSessions({
          id: user._id,
          reason: reason.trim() || 'Administrative session revocation'
        }).unwrap();
        toast.success(res?.message || 'Active user sessions revoked successfully.');
      } else if (selectedAction === 'force_password_change') {
        const res = await forcePasswordChange({
          id: user._id,
          reason: reason.trim() || 'Mandatory password rotation policy'
        }).unwrap();
        toast.success(res?.message || 'User required to update password upon next login.');
      } else if (selectedAction === 'reset_password') {
        const res = await adminResetPwd(user._id).unwrap();
        const generated = res?.data?.temporaryPassword || res?.temporaryPassword;
        if (generated) {
          setTempPassword(generated);
          toast.success('Temporary password generated successfully.');
          if (onSuccess) onSuccess();
          return; // Stay open to show the temporary password
        } else {
          toast.success(res?.message || 'Password reset link or email dispatched.');
        }
      } else if (selectedAction === 'reset_device') {
        const res = await resetDevice({
          id: user._id,
          reason: reason.trim() || 'Device re-registration approved by administrator'
        }).unwrap();
        toast.success(res?.message || 'Hardware device binding reset successfully.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to execute security operation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Account Security Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: <span className="font-semibold text-slate-700 dark:text-slate-200">{displayName}</span> ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Action Tabs */}
          {!tempPassword && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Select Security Operation
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SECURITY_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedAction === action.id;
                  const isRelevantUnlock = action.id === 'unlock' && isLocked;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setSelectedAction(action.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#00C471]/5 border-[#00C471] ring-1 ring-[#00C471]'
                          : 'bg-white dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 rounded-xl border ${action.badgeColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isRelevantUnlock && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 animate-pulse">
                            Action Needed
                          </span>
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {action.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {action.shortDesc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Temporary Password Result Screen */}
          {tempPassword ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00C471] shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold text-sm">Emergency Temporary Password Created</div>
                  <div>
                    A secure temporary password was provisioned for <span className="font-semibold">{displayName}</span>. Please copy and provide it securely to the employee. They will be mandated to change it upon first login.
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Generated Temporary Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    readOnly
                    value={tempPassword}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] font-mono text-sm tracking-wider text-slate-900 dark:text-white select-all pr-24"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-2 rounded-xl text-[#00C471] hover:bg-[#00C471]/10 border border-[#00C471]/30 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>For security reasons, this temporary password will not be shown again once you close this window.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExecute} className="space-y-4">
              {/* Contextual Warning Banner */}
              <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125] text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>
                    {selectedAction === 'unlock' && 'Account Unlock Procedure'}
                    {selectedAction === 'revoke_sessions' && 'Active Session Invalidation'}
                    {selectedAction === 'force_password_change' && 'Password Rotation Policy Enforcement'}
                    {selectedAction === 'reset_password' && 'Emergency Password Reset Workflow'}
                    {selectedAction === 'reset_device' && 'Biometric / Hardware Kiosk Device Reset'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 pl-6 text-[11px]">
                  {selectedAction === 'unlock' &&
                    'This action immediately resets the failed login attempt counter and removes any active lock timer, enabling the user to log in again.'}
                  {selectedAction === 'revoke_sessions' &&
                    'Invalidates all active refresh tokens for this user. The user will be immediately logged out of all active web and mobile sessions.'}
                  {selectedAction === 'force_password_change' &&
                    'Marks the account as requiring a password change. Upon their next sign-in attempt, the user will be blocked from accessing protected resources until they create a new password.'}
                  {selectedAction === 'reset_password' &&
                    'Generates a high-entropy temporary password and revokes any existing sessions. The user will be prompted to reset it upon login.'}
                  {selectedAction === 'reset_device' &&
                    'Unlinks the hardware device identifier stored on the user employee record, allowing them to register a new phone or workstation kiosk.'}
                </p>
              </div>

              {/* Justification Reason Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Audit Justification Reason <span className="text-slate-400 font-normal">(Recorded in System Audit Log)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Reason for ${selectedAction.replace(/_/g, ' ')}...`}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-[#00C471] hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Confirm {SECURITY_ACTIONS.find((a) => a.id === selectedAction)?.label || 'Action'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {tempPassword && (
            <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-[#00C471] hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
