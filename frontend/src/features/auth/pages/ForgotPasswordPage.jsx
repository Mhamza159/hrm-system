/**
 * @file ForgotPasswordPage.jsx
 * @description Password Recovery Request Screen adhering to DESIGN.md (Linear Craft Architecture).
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Slice 1.7)
 * - Archetype:
 *   - Dark Canvas: #090A0F with subtle radial indigo atmospheric glow
 *   - Glass Card: #0F111A with 1px hairline border #1E2235
 *   - Focus ring: #5E6AD2
 * - User Flow:
 *   1. User submits registered email address.
 *   2. Backend generates and emails 6-digit OTP code (valid 10 mins).
 *   3. UI displays confirmation state instructing user to check their inbox.
 *   4. Direct action navigates user to /reset-password screen with prefilled email.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '../authApi.js';

// Client-side validation schema matching backend forgotPasswordSchema
const forgotPasswordValidationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid work email')
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submittedEmail, setSubmittedEmail] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordValidationSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    try {
      const res = await forgotPassword(data).unwrap();
      setSubmittedEmail(data.email);
      toast.success(res?.message || 'Verification code sent to your email');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to dispatch reset code. Please try again.');
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
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
          <p className="text-xs text-emerald-200/70 mt-1.5">
            Enter your work email and we'll send a 6-digit verification code
          </p>
        </div>

        {/* Card Canvas */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-7 md:p-8 shadow-2xl backdrop-blur-sm">
          {submittedEmail ? (
            /* Success Confirmation State */
            <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#00C471] mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Check your inbox</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                If an account exists for <span className="text-slate-900 dark:text-white font-mono font-medium">{submittedEmail}</span>, 
                a 6-digit code has been delivered. It is valid for 10 minutes.
              </p>

              <button
                type="button"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)}
                className="w-full h-11 bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,196,113,0.35)] mb-3"
              >
                <span>Enter Verification Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSubmittedEmail(null)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Did not receive? Try again
              </button>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="employee@company.pk"
                    {...register('email')}
                    className={`w-full h-11 bg-slate-50/60 dark:bg-[#0A110D] border ${
                      errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                    } focus:ring-2 focus:ring-[#00C471]/20 rounded-xl px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#00C471] hover:bg-[#049856] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,196,113,0.35)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

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
