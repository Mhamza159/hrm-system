/**
 * @file ResetPasswordPage.jsx
 * @description Password Reset Verification Screen adhering to DESIGN.md (Linear Craft Architecture).
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Slice 1.8)
 * - Archetype:
 *   - Dark Canvas: #090A0F with subtle radial indigo atmospheric glow
 *   - Glass Card: #0F111A with 1px hairline border #1E2235
 *   - 6-digit OTP code field with monospace character spacing
 *   - Password strength confirmation
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useResetPasswordMutation } from '../authApi.js';

// Client-side validation schema matching backend resetPasswordSchema
const resetPasswordValidationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid work email'),
    otp: z
      .string()
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Code must contain digits only'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordValidationSchema),
    defaultValues: {
      email: emailParam,
      otp: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const res = await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword
      }).unwrap();

      toast.success(res?.message || 'Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset password. Please check your OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-[#061A14] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#00C471]/30">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#00C471]/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#00C471] shadow-[0_2px_12px_rgba(0,196,113,0.35)] mb-4 text-white">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Choose new password</h1>
          <p className="text-xs text-emerald-200/70 mt-1.5">
            Enter the 6-digit verification code and your new password
          </p>
        </div>

        {/* Card Canvas */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-7 md:p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                placeholder="employee@company.pk"
                {...register('email')}
                className={`w-full h-11 bg-slate-50/60 dark:bg-[#0A110D] border ${
                  errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* OTP Code Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                {...register('otp')}
                className={`w-full h-12 bg-slate-50/60 dark:bg-[#0A110D] border ${
                  errors.otp ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3 text-center tracking-[8px] font-mono text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all`}
              />
              {errors.otp && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.otp.message}</p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('newPassword')}
                  className={`w-full h-11 bg-slate-50/60 dark:bg-[#0A110D] border ${
                    errors.newPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                  } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3.5 pr-10 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                type={showPassword ? 'text' : 'password'}
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
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#1A3125] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
