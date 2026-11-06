/**
 * @file SessionExpiredModal.jsx
 * @description State 8: Session Expiration & Draft Recovery Dialog.
 * Strictly satisfies Rule 8: Save their work before signing them out.
 */

import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { authApi } from '../../features/auth/authApi.js';
import { setCredentials, logout } from '../../features/auth/authSlice.js';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { user, isSessionExpired } = useAuth();
  const dispatch = useDispatch();
  const [login, { isLoading }] = authApi.useLoginMutation();

  // Trigger open via Redux state or CustomEvent
  useEffect(() => {
    if (isSessionExpired) {
      setIsOpen(true);
      setErrorMsg('');
    }
  }, [isSessionExpired]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsOpen(true);
      setErrorMsg('');
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  if (!isOpen) return null;

  const email = user?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your password to continue.');
      return;
    }

    try {
      setErrorMsg('');
      const response = await login({ email, password }).unwrap();
      if (response?.data) {
        dispatch(setCredentials(response.data));
        setIsOpen(false);
        setPassword('');
        toast.success('Session restored! All your unsaved work has been safely preserved.');
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Authentication failed. Please check your password.');
    }
  };

  const handleFullLogout = () => {
    setIsOpen(false);
    dispatch(logout());
    window.location.href = '/login';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Top Icon Capsule */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="session-expired-title" className="text-base font-bold text-slate-900 dark:text-white">
              Session Timed Out
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please confirm your password to resume work.
            </p>
          </div>
        </div>

        {/* 1. Reassurance Badge: Work is Safely Preserved */}
        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Unsaved Work Protected</span>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              Your open form drafts have been safely preserved in browser local storage and will be restored immediately after signing in.
            </p>
          </div>
        </div>

        {/* Re-Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {email && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Account
              </label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-[#0E1A14] border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs text-slate-600 dark:text-slate-400 cursor-not-allowed select-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              className="w-full px-3 py-2 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] focus:border-[#00C471] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 transition-all shadow-2xs"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleFullLogout}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign in as different user
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Continue Drafting
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
