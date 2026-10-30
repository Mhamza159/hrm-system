/**
 * @file KioskModal.jsx
 * @description Modal for registering and configuring dynamic QR attendance kiosk devices.
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance (BUILD-GUIDE Section 18 · Row 13.1)
 */

import React, { useState, useEffect } from 'react';
import { Monitor, X, AlertCircle, Save, ShieldCheck } from 'lucide-react';
import { useCreateKioskMutation, useUpdateKioskMutation } from '../attendanceApi.js';
import { toast } from 'sonner';

export const KioskModal = ({ isOpen, onClose, kiosk = null, onSuccess }) => {
  const isEditing = Boolean(kiosk?._id);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('both');
  const [locationDescription, setLocationDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const [createKiosk, { isLoading: isCreating }] = useCreateKioskMutation();
  const [updateKiosk, { isLoading: isUpdating }] = useUpdateKioskMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (kiosk) {
      setName(kiosk.name || '');
      setCode(kiosk.code || '');
      setType(kiosk.type || 'both');
      setLocationDescription(kiosk.locationDescription || '');
      setIsActive(kiosk.isActive !== false);
    } else {
      setName('');
      setCode('');
      setType('both');
      setLocationDescription('');
      setIsActive(true);
    }
    setFormError('');
  }, [kiosk, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Kiosk terminal name is required.');
      return;
    }

    if (!isEditing && !code.trim()) {
      setFormError('Unique kiosk identification code is required.');
      return;
    }

    try {
      if (isEditing) {
        await updateKiosk({
          id: kiosk._id,
          name: name.trim(),
          type,
          locationDescription: locationDescription.trim(),
          isActive
        }).unwrap();
        toast.success(`Kiosk '${name}' updated successfully.`);
      } else {
        await createKiosk({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          locationDescription: locationDescription.trim(),
          isActive
        }).unwrap();
        toast.success(`Kiosk '${name}' registered with 32-char crypto secret.`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to save kiosk configuration.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Configure Kiosk Terminal' : 'Register New Attendance Kiosk'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? `Editing ${kiosk.code}`
                  : 'Generates anti-tamper dynamic QR vector stream'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start space-x-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Terminal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reception Main Lobby"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Kiosk Code {!isEditing && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                required={!isEditing}
                disabled={isEditing}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. KIOSK-MAIN-01"
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  isEditing ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Direction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="both">Both (Entry & Exit)</option>
                <option value="entry">Entry Only (Check-In)</option>
                <option value="exit">Exit Only (Check-Out)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Physical Location / Floor
            </label>
            <input
              type="text"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g. Ground Floor, East Gate Turnstile #2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Terminal Operational Status</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isActive ? 'Active & dispensing rotating QR tokens' : 'Inactive (Punches through this kiosk blocked)'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Kiosk' : 'Register Kiosk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
