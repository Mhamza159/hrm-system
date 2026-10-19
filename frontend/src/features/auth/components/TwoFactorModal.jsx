/**
 * @file TwoFactorModal.jsx
 * @description Modal dialog for managing Two-Factor Authentication (2FA) setup, verification, and deactivation.
 * 
 * SPECIFICATION (BUILD-GUIDE Section 4 · Slice 1.10):
 * - Enable: Dispatches 6-digit OTP to user's official email -> verifies OTP -> enables 2FA.
 * - Disable: Requires current account password confirmation -> disables 2FA.
 */

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  X,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import {
  useEnable2faMutation,
  useVerifyEnable2faMutation,
  useDisable2faMutation
} from '../authApi.js';
import { updateUser } from '../authSlice.js';

export function TwoFactorModal({ isOpen, onClose, user }) {
  const dispatch = useDispatch();
  const [enable2fa, { isLoading: isSendingOtp }] = useEnable2faMutation();
  const [verifyEnable2fa, { isLoading: isVerifying }] = useVerifyEnable2faMutation();
  const [disable2fa, { isLoading: isDisabling }] = useDisable2faMutation();

  const [step, setStep] = useState('initial'); // 'initial' | 'otp_sent'
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const isEnabled = Boolean(user?.twoFactorEnabled);

  // Step 1: Send setup OTP to email
  const handleInitiateEnable = async () => {
    try {
      const res = await enable2fa().unwrap();
      toast.success(res?.message || 'Verification code sent to your registered email!');
      setStep('otp_sent');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send verification code. Please try again.');
    }
  };

  // Step 2: Verify OTP and activate 2FA
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      const res = await verifyEnable2fa({ otp: otp.trim() }).unwrap();
      dispatch(updateUser({ twoFactorEnabled: true }));
      toast.success(res?.message || 'Two-factor authentication enabled successfully!');
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid or expired verification code');
    }
  };

  // Deactivate 2FA
  const handleDisable2fa = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password to confirm disabling 2FA');
      return;
    }

    try {
      const res = await disable2fa({ password }).unwrap();
      dispatch(updateUser({ twoFactorEnabled: false }));
      toast.success(res?.message || 'Two-factor authentication disabled successfully');
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Incorrect password. Failed to disable 2FA.');
    }
  };

  const handleClose = () => {
    setStep('initial');
    setOtp('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enhanced security login verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-white/5 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Current Status:</span>
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active & Protected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Disabled
              </span>
            )}
          </div>

          {!isEnabled ? (
            /* Setup Flow */
            step === 'initial' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-[#1A3125] space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Why enable Two-Factor Authentication?
                  </p>
                  <p>
                    Two-factor authentication adds an essential defense layer to your master account. When signing in, you will be prompted to enter a temporary 6-digit OTP dispatched to:
                  </p>
                  <div className="flex items-center gap-1.5 font-mono text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user?.email || 'Your official email'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInitiateEnable}
                  disabled={isSendingOtp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Code...
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="font-medium">
                    A 6-digit code has been dispatched to <span className="font-bold underline">{user?.email}</span>. Please enter it below to confirm activation:
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#061A14] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('initial')}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-[#1A3125] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || otp.length !== 6}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Verify & Enable 2FA
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Disable Flow */
            <form onSubmit={handleDisable2fa} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                <p>
                  Disabling Two-Factor Authentication reduces account protection. Please enter your account password to confirm:
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter current password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#061A14] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isDisabling || !password}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deactivating...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" /> Deactivate 2FA Protection
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
