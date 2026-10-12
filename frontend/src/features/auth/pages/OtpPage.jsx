/**
 * @file OtpPage.jsx
 * @description Two-Factor Authentication (2FA) OTP Verification View.
 * 
 * SPECIFICATION & SECURITY PROTOCOL (Slice 1.10-FE):
 * 1. Invoked after primary password login when `user.twoFactorEnabled === true`.
 * 2. Extracts `tempToken` and user email from router location state.
 * 3. Presents 6-digit high-contrast segmented numeric OTP input.
 * 4. Submits verification request to POST /api/v1/auth/verify-otp via RTK Query.
 * 5. Commits rotated access token and user credentials to Redux store.
 * 6. Enforces first-login password change check if required, otherwise routes to dashboard.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShieldCheck, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useVerifyOtpMutation } from '../authApi.js';
import { setCredentials } from '../authSlice.js';

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Extract challenge token and email passed from LoginPage
  const tempToken = location.state?.tempToken;
  const email = location.state?.email || 'your registered email';

  // 6-digit segmented OTP state
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Timer countdown state (10 minutes in seconds)
  const [timeLeft, setTimeLeft] = useState(600);

  // RTK Query mutation hook
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  // Redirect to login if user arrived at this URL directly without challenge token
  useEffect(() => {
    if (!tempToken) {
      toast.error('Session expired. Please sign in again.');
      navigate('/login', { replace: true });
    }
  }, [tempToken, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  /**
   * Handle single digit input and auto-advance focus
   */
  const handleDigitChange = (index, value) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance to next box if filled
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle backspace navigation between boxes
   */
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle pasting full 6-digit code
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...digits];
    pasteData.split('').forEach((char, idx) => {
      if (idx < 6) newDigits[idx] = char;
    });
    setDigits(newDigits);

    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  /**
   * Submit OTP code for verification
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');

    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      // 1. Submit POST /api/v1/auth/verify-otp
      const response = await verifyOtp({
        tempToken,
        otp
      }).unwrap();

      // 2. Commit authenticated session to Redux store
      dispatch(
        setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken
        })
      );

      toast.success('Two-factor verification successful.');

      // 3. Inspect first-login password change mandate (Slice 1.9)
      if (response.data.user.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const errorMsg =
        err?.data?.message || err?.error || 'Invalid or expired verification code.';
      toast.error(errorMsg);
    }
  };

  // Format seconds into MM:SS display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#061A14] text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-[#00C471]/30">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#00C471]/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-[420px] bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-7 md:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#00C471] shadow-[0_2px_12px_rgba(0,196,113,0.35)] flex items-center justify-center text-white mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Two-Factor Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Enter the 6-digit authentication code sent to{' '}
            <span className="text-slate-900 dark:text-white font-medium">{email}</span>
          </p>
        </div>

        {/* 6-Digit Segmented OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-xl font-mono font-bold bg-slate-50/60 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] focus:border-[#00C471] focus:ring-2 focus:ring-[#00C471]/20 rounded-xl text-slate-900 dark:text-white outline-none transition-all"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Countdown & Expiry Notice */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
            <span>Code expires in:</span>
            <span
              className={`font-mono font-semibold ${
                timeLeft < 60 ? 'text-rose-500' : 'text-[#00C471]'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || timeLeft <= 0}
            className="w-full h-11 bg-[#00C471] hover:bg-[#049856] text-white rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(0,196,113,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Security Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        {/* Back to Login Action */}
        <div className="pt-2 text-center border-t border-slate-100 dark:border-[#1A3125]">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
