/**
 * @file ChangePasswordPage.jsx
 * @description Self-Service & Mandatory First-Login Password Change Screen adhering to DESIGN.md.
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Slice 1.9)
 * - Archetype: Linear Craft Dark UI (#090A0F, #0F111A, #1E2235, #5E6AD2)
 * - Mandate Intercept:
 *   If user.mustChangePassword === true, displays compliance alert banner
 *   and locks navigation to dashboard until completed.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShieldAlert, Key, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useChangePasswordMutation } from '../authApi.js';
import { updateUser } from '../authSlice.js';
import { useAuth } from '../../../hooks/useAuth.js';

// Client-side validation schema matching backend changePasswordSchema
const changePasswordValidationSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword']
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be the same as your current password',
    path: ['newPassword']
  });

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const isMandatory = Boolean(user?.mustChangePassword);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(changePasswordValidationSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const res = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }).unwrap();

      // Clear mustChangePassword flag in client-side state
      dispatch(updateUser({ mustChangePassword: false }));
      toast.success(res?.message || 'Password changed successfully!');

      // Forward to main dashboard
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update password. Please check your current password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#061A14] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#00C471]/30">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#00C471]/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#00C471] shadow-[0_2px_12px_rgba(0,196,113,0.35)] mb-4 text-white">
            <Key className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Change Password</h1>
          <p className="text-xs text-emerald-200/70 mt-1.5">
            {isMandatory
              ? 'Required initial setup before accessing your account'
              : 'Keep your account secure by updating your credentials'}
          </p>
        </div>

        {/* Mandatory Setup Warning Banner */}
        {isMandatory && (
          <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-300 text-xs animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">First-Time Login Mandate</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                For security compliance, you must replace your initial temporary password before continuing to the HRM dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-7 md:p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('currentPassword')}
                  className={`w-full h-11 bg-slate-50/60 dark:bg-[#0A110D] border ${
                    errors.currentPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                  } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3.5 pr-10 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('newPassword')}
                  className={`w-full h-11 bg-slate-50/60 dark:bg-[#0A110D] border ${
                    errors.newPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                  } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3.5 pr-10 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••••••"
                {...register('confirmPassword')}
                className={`w-full h-11 bg-slate-50/60 dark:bg-[#0A110D] border ${
                  errors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all`}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#00C471] hover:bg-[#049856] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,196,113,0.35)] pt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving new password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
