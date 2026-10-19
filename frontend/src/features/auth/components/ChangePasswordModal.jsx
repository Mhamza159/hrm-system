/**
 * @file ChangePasswordModal.jsx
 * @description In-place Self-Service Password Change Dialog conforming to M1 specs and DESIGN.md.
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M1 Authentication & Security (Slice 1.9)
 * - Scope: Available to all authenticated roles (Super Admin, HR Manager, Department Manager, Employee).
 * - Real-time password criteria validation with toggleable password visibility.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X,
  CheckCircle2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

import { useChangePasswordMutation } from '../authApi.js';
import { updateUser } from '../authSlice.js';

const changePasswordValidationSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword']
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be the same as your current password',
    path: ['newPassword']
  });

export function ChangePasswordModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(changePasswordValidationSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const watchNewPassword = watch('newPassword', '');

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const res = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }).unwrap();

      dispatch(updateUser({ mustChangePassword: false }));
      toast.success(res?.message || 'Password changed successfully!');
      handleClose();
    } catch (err) {
      toast.error(
        err?.data?.message || 'Failed to update password. Please check your current password.'
      );
    }
  };

  // Live password strength indicator checks
  const hasMinLength = watchNewPassword.length >= 8;
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(watchNewPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#0A130E] border border-slate-200 dark:border-[#1E3327] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#16271E] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1A13]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-[#00C471]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Self-service credential management (All Roles)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16271E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Current Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                {...register('currentPassword')}
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] focus:ring-2 focus:ring-[#00C471]/20 transition-all font-mono placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                {...register('newPassword')}
                placeholder="Minimum 8 characters"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] focus:ring-2 focus:ring-[#00C471]/20 transition-all font-mono placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.newPassword.message}
              </p>
            )}

            {/* Micro requirements indicator */}
            <div className="flex items-center gap-3 pt-1 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 ${
                  hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> 8+ Characters
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  hasNumberOrSymbol ? 'text-emerald-600 font-medium' : 'text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Number/Symbol
              </span>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Re-type new password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] focus:ring-2 focus:ring-[#00C471]/20 transition-all font-mono placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#16271E] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate('/change-password');
              }}
              className="text-[11px] text-slate-500 hover:text-[#00C471] dark:text-slate-400 inline-flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" /> Full Screen Page
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1E3327] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14231A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Save Password
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
