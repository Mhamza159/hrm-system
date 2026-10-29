/**
 * @file LoginPage.jsx
 * @description Enterprise Login Screen adhering to DESIGN.md (Forest & Emerald Enterprise Craft Archetype)
 * and matching the high-impact split-screen layout reference (ELVARA Brand).
 * 
 * DESIGN & WORKFLOW CONTRACT:
 * - Brand: ELVARA HRM Enterprise
 * - Left Hero Canvas: #061A14 with subtle emerald grid, radial aura, and precision diagonal split
 * - Value Pillars: HR & Payroll, Project Management, Lead & Client CRM
 * - Right Form Canvas: #FAF8F5 / #0A110D with clean #00C471 emerald CTA & Google SSO
 * - Handled Responses & Slices:
 *   - Slice 1.2: Standard credentials login -> sets Redux access token & navigates to dashboard.
 *   - Slice 1.3: 423 Locked status -> displays persistent lockout banner and disables submit.
 *   - Slice 1.9: mustChangePassword === true -> redirects immediately to /change-password.
 *   - Slice 1.10: twoFactorRequired -> forwards tempToken to /verify-otp challenge screen.
 *   - Slice 1.11: session timeout inactivity banner
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Lock,
  Mail,
  AlertTriangle,
  Loader2,
  Landmark,
  FolderKanban,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

import { useLoginMutation } from '../authApi.js';
import { setCredentials } from '../authSlice.js';

// 1. Client-Side Zod validation schema matching backend loginSchema
const loginValidationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email or username is required')
    .email('Please enter a valid work email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
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

  // 5. Local UI state
  const [lockoutError, setLockoutError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Retrieve remembered credentials / preference
  const savedEmail = localStorage.getItem('hrm_saved_email') || '';
  const savedRemember = localStorage.getItem('hrm_remember_me') === 'true';

  // 6. Initialize React Hook Form wired with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      email: savedEmail,
      password: '',
      rememberMe: savedRemember
    }
  });

  /**
   * Handle form submission and authentication dispatch
   * @param {Object} data - Validated form values { email, password, rememberMe }
   */
  const onSubmit = async (data) => {
    setLockoutError(null);

    // Persist or wipe remember-me credentials
    if (data.rememberMe) {
      localStorage.setItem('hrm_remember_me', 'true');
      localStorage.setItem('hrm_saved_email', data.email);
    } else {
      localStorage.removeItem('hrm_remember_me');
      localStorage.removeItem('hrm_saved_email');
    }

    try {
      const response = await login(data).unwrap();

      // 2FA challenge flow (Slice 1.10)
      if (response.data?.twoFactorRequired) {
        toast.info('2FA verification code sent to your email');
        navigate('/verify-otp', {
          state: { tempToken: response.data.tempToken, email: data.email }
        });
        return;
      }

      // Store credentials in Redux auth slice (Slice 1.2)
      dispatch(
        setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken
        })
      );

      toast.success('Signed in successfully');

      // Mandatory password change check (Slice 1.9)
      if (response.data.user.mustChangePassword) {
        navigate('/change-password', {
          state: { tempPassword: data.password }
        });
      } else {
        navigate('/');
      }
    } catch (err) {
      const status = err?.status || err?.originalStatus;
      const apiMsg = err?.data?.message || 'Authentication failed. Please check your credentials.';

      if (status === 423) {
        setLockoutError(apiMsg);
        toast.error('Account Locked: Too many failed attempts');
      } else {
        toast.error(apiMsg);
      }
    }
  };

  /**
   * Google Single Sign-On informational handler
   */
  const handleGoogleSignIn = () => {
    toast.info('Google Workspace SSO is managed by your company domain administrator. Please sign in with your work email.');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF8F5] dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 relative overflow-hidden font-sans selection:bg-[#00C471]/30">
      
      {/* =========================================================================
          LEFT PANEL: Hero Showcase with Angled Geometry & Value Propositions
          ========================================================================= */}
      <div className="relative w-full lg:w-[54%] xl:w-[52%] 2xl:w-[50%] bg-[#061A14] flex flex-col justify-between p-8 sm:p-12 lg:p-16 lg:pr-24 xl:pr-32 text-white overflow-hidden shrink-0 lg:[clip-path:polygon(0_0,100%_0,84%_100%,0_100%)]">
        
        {/* Ambient Grid Texture Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,196,113,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,196,113,0.05)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

        {/* Ambient Emerald Lighting Glows */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-[#00C471]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[360px] h-[360px] bg-[#00C471]/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_40%_25%,rgba(0,196,113,0.12),transparent_70%)] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-10 lg:mb-12">
          <div className="w-11 h-11 rounded-2xl bg-[#00C471] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,196,113,0.35)]">
            {/* Geometric Loop Brand Emblem */}
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 3-2 3.5 1.5 0 3-.5 4.5-2 2-2 4-5 6.5-5s4.5 3 6.5 5c1.5 1.5 3 2 4.5 2 0-.5-.5-2.24-2-3.5-2.5-2.1-4.5-3.5-7-3.5s-4.5 1.4-7 3.5z" />
              <circle cx="12" cy="7" r="3" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-white font-sans">
              ELVARA
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/20">
              HRM
            </span>
          </div>
        </div>

        {/* Hero Narrative Block */}
        <div className="relative z-10 my-auto py-4">
          {/* Welcome Back Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md shadow-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C471] animate-pulse" />
            <span>Welcome back</span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[44px] xl:text-[50px] font-extrabold text-white tracking-tight leading-[1.12] mb-3">
            Manage team <br />
            <span className="text-[#00C471]">with ease.</span>
          </h1>

          {/* Tagline Bar */}
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider mb-6">
            <span className="w-4 h-[2px] bg-[#00C471] rounded-full inline-block" />
            <span className="font-bold">Scale better</span>
            <span className="text-emerald-500/40">•</span>
            <span className="text-emerald-200/90 font-medium">Build stronger</span>
          </div>

          {/* Description */}
          <p className="text-sm text-emerald-100/70 leading-relaxed max-w-md mb-8 font-normal">
            ELVARA is a powerful platform built for fast-moving teams to manage work efficiently.
          </p>

          {/* 3 Core Value Proposition Cards */}
          <div className="space-y-3 max-w-md">
            {/* Card 1: HR & Payroll */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all group backdrop-blur-xs">
              <div className="w-11 h-11 rounded-xl bg-[#0B261D] border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-[#00C471] group-hover:text-white transition-all shadow-xs shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                  HR & Payroll
                </h3>
                <p className="text-xs text-emerald-200/60 mt-0.5 font-normal">
                  Attendance, loan, leave management
                </p>
              </div>
            </div>

            {/* Card 2: Project Management */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all group backdrop-blur-xs">
              <div className="w-11 h-11 rounded-xl bg-[#0B261D] border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-[#00C471] group-hover:text-white transition-all shadow-xs shrink-0">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                  Project Management
                </h3>
                <p className="text-xs text-emerald-200/60 mt-0.5 font-normal">
                  Kanban, tasks, files & clients
                </p>
              </div>
            </div>

            {/* Card 3: Lead & Client CRM */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all group backdrop-blur-xs">
              <div className="w-11 h-11 rounded-xl bg-[#0B261D] border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-[#00C471] group-hover:text-white transition-all shadow-xs shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                  Lead & Client CRM
                </h3>
                <p className="text-xs text-emerald-200/60 mt-0.5 font-normal">
                  Score, assign, follow up
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots Indicator */}
        <div className="relative z-10 flex items-center gap-2 pt-6">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-6 h-2 rounded-full bg-[#00C471] shadow-[0_0_10px_rgba(0,196,113,0.5)]" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Clean Centered Sign-In Card
          ========================================================================= */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px] py-6">
          
          {/* Header Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Continue with Google
            </p>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#15241D] text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 active:scale-[0.99]"
          >
            {/* Authentic Google Multi-Color SVG Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Or Continue With Email Divider */}
          <div className="relative my-7 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative bg-[#FAF8F5] dark:bg-[#0A110D] px-3.5 text-xs text-slate-400 font-medium select-none">
              or continue with email
            </span>
          </div>

          {/* Inactivity Auto-Logout Alert Banner (Slice 1.11) */}
          {isInactivity && !lockoutError && (
            <div className="mb-5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-3 animate-in fade-in shadow-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900 dark:text-white">Session Timed Out</p>
                <p className="mt-0.5 text-blue-700/80 dark:text-blue-300/80">
                  You were automatically signed out after 30 minutes of inactivity.
                </p>
              </div>
            </div>
          )}

          {/* Lockout Warning Banner (Slice 1.3: HTTP 423 Locked) */}
          {lockoutError && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 animate-in fade-in shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100">Account Temporarily Locked</p>
                <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                  {lockoutError}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            
            {/* Email or Username Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Email or Username<span className="text-[#00C471] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={Boolean(lockoutError) || isLoading}
                  placeholder="hello@example.com or username"
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-[#111D17] border ${
                    errors.email
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-[#00C471]'
                  } rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 transition-all shadow-xs`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password<span className="text-[#00C471] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={Boolean(lockoutError) || isLoading}
                  placeholder="••••••••"
                  className={`w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-[#111D17] border ${
                    errors.password
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-[#00C471]'
                  } rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 transition-all shadow-xs font-mono`}
                  {...register('password')}
                />
                {/* Eye / EyeOff Show Password Toggle */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}

              {/* Forgot Password Link (Positioned Right Below Password) */}
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#00C471] hover:text-[#049856] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  id="rememberMe"
                  disabled={Boolean(lockoutError) || isLoading}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#00C471] focus:ring-[#00C471]/30 accent-[#00C471] cursor-pointer"
                  {...register('rememberMe')}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  Remember me on this device
                </span>
              </label>
            </div>

            {/* Full-Width Sign In CTA */}
            <button
              type="submit"
              disabled={Boolean(lockoutError) || isLoading}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00C471] hover:bg-[#049856] active:bg-[#00B368] text-white text-xs font-bold transition-all shadow-md shadow-[#00C471]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Registration / Account Notice */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-7">
            Don't have an account?{' '}
            <Link
              to="/forgot-password"
              className="text-[#00C471] font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
