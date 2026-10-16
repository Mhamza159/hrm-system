/**
 * @file LoginPage.jsx
 * @description Enterprise Login Screen adhering to DESIGN.md (Linear / Stripe Craft Architecture).
 * 
 * DESIGN & WORKFLOW CONTRACT:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Slice 1.2 & 1.3)
 * - UI Archetype:
 *   - Dark Canvas: #090A0F with subtle ambient violet glow #5E6AD2/10
 *   - Elevated Card: #0F111A with 1px hairline border #1E2235
 *   - Inputs: Monospace for password masking, high-contrast text #F3F4F6
 *   - Accent CTA: Linear Indigo #5E6AD2 with focus ring
 * - Handled Responses & Slices:
 *   - Slice 1.2: Standard credentials login -> sets Redux access token & navigates to dashboard.
 *   - Slice 1.3: 423 Locked status -> displays persistent amber lockout banner and disables submit.
 *   - Slice 1.9: mustChangePassword === true -> redirects immediately to /change-password.
 *   - Slice 1.10: twoFactorRequired -> forwards tempToken to /verify-otp challenge screen.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Lock, Mail, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { useLoginMutation } from '../authApi.js';
import { setCredentials } from '../authSlice.js';

// 1. Client-Side Zod validation schema matching backend loginSchema
const loginValidationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
});

export default function LoginPage() {
  // 2. RTK Query mutation hook for user authentication
  const [login, { isLoading }] = useLoginMutation();

  // 3. Redux dispatcher to commit credentials to state
  const dispatch = useDispatch();

  // 4. React Router navigation hook & query params
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isInactivity = searchParams.get('reason') === 'inactivity';

  // 5. Local state storing account lockout error message (HTTP 423)
  const [lockoutError, setLockoutError] = useState(null);

  // 6. Initialize React Hook Form wired with Zod resolver for zero-boilerplate validation
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  /**
   * Handle form submission and authentication dispatch
   * @param {Object} data - Validated form values { email, password }
   */
  const onSubmit = async (data) => {
    // Clear previous lockout banner before new attempt
    setLockoutError(null);

    try {
      // 1. Dispatch POST /api/v1/auth/login via RTK Query
      const response = await login(data).unwrap();

      // 2. Check if 2FA verification challenge is required (Slice 1.10)
      if (response.data?.twoFactorRequired) {
        toast.info('2FA verification code sent to your email');
        navigate('/verify-otp', {
          state: { tempToken: response.data.tempToken, email: data.email }
        });
        return;
      }

      // 3. Store in-memory accessToken and user in Redux auth state (Slice 1.2)
      dispatch(
        setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken
        })
      );

      toast.success('Signed in successfully');

      // 4. Enforce mandatory password change on initial login (Slice 1.9)
      if (response.data.user.mustChangePassword) {
        navigate('/change-password', {
          state: { tempPassword: data.password }
        });
      } else {
        // 5. Navigate to protected dashboard root
        navigate('/');
      }
    } catch (err) {
      // Extract HTTP status and backend error message
      const status = err?.status || err?.originalStatus;
      const apiMsg = err?.data?.message || 'Authentication failed. Please check your credentials.';

      // 6. Handle brute-force defense lockout (Slice 1.3 - HTTP 423 Locked)
      if (status === 423) {
        setLockoutError(apiMsg);
        toast.error('Account Locked: Too many failed attempts');
      } else {
        toast.error(apiMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#061A14] text-slate-800 dark:text-slate-100 px-4 py-12 relative selection:bg-[#00C471]/30">
      {/* Background ambient emerald glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00C471]/10 blur-[130px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#00C471] mb-4 shadow-[0_2px_12px_rgba(0,196,113,0.35)]">
            <span className="text-xl font-bold tracking-tight text-white">HRM</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-xs text-emerald-200/70 mt-1.5">
            Enter your credentials to access the enterprise portal
          </p>
        </div>

        {/* Inactivity Auto-Logout Banner (Slice 1.11) */}
        {isInactivity && !lockoutError && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 dark:text-white">Session Timed Out</p>
              <p className="mt-0.5 text-blue-700/80 dark:text-blue-300/80">You were automatically signed out after 30 minutes of inactivity to protect your account.</p>
            </div>
          </div>
        )}

        {/* Lockout Warning Banner (Slice 1.3 Brute-Force Defense: HTTP 423 Locked) */}
        {lockoutError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50/95 dark:bg-amber-950/60 border border-amber-300 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-100">Account Temporarily Locked</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90 leading-relaxed">{lockoutError}</p>
            </div>
          </div>
        )}

        {/* Form Card (Matching docs/ui-reference.png White Card Style) */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-7 md:p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email Input Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={Boolean(lockoutError) || isLoading}
                  placeholder="employee@company.pk"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 dark:bg-[#0A110D] border ${
                    errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                  } rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 transition-all`}
                  {...register('email')}
                />
              </div>
              {/* Field Validation Error */}
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#00C471] hover:text-[#049856] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={Boolean(lockoutError) || isLoading}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 dark:bg-[#0A110D] border ${
                    errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-[#1A3125] focus:border-[#00C471]'
                  } rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 transition-all font-mono`}
                  {...register('password')}
                />
              </div>
              {/* Field Validation Error */}
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={Boolean(lockoutError) || isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold transition-all shadow-md shadow-[#00C471]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-emerald-200/60 mt-6">
          Single Software House Enterprise HRM · Pakistan Operations
        </p>
      </div>
    </div>
  );
}
