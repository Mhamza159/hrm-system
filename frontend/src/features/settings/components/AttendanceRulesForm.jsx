/**
 * @file AttendanceRulesForm.jsx
 * @description Late Arrival Grace Period & Penalty Deductions Form (Slice 2.4).
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Timer, Award, Banknote, QrCode, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

export function AttendanceRulesForm({ initialData = {}, qrData = {}, faceData = {}, onSaved }) {
  const [faceSettings, setFaceSettings] = useState({
    isEnabled: faceData?.isEnabled ?? true,
    matchThreshold: faceData?.matchThreshold ?? 0.50,
    requireLiveness: faceData?.requireLiveness ?? true
  });
  const [qrSettings, setQrSettings] = useState({
    isEnabled: qrData?.isEnabled ?? true,
    rotationSeconds: qrData?.rotationSeconds ?? 30
  });
  const [rules, setRules] = useState({
    graceMinutes: initialData.graceMinutes ?? 15,
    lateThresholdMinutes: initialData.lateThresholdMinutes ?? 30,
    halfDayThresholdLateCount: initialData.halfDayThresholdLateCount ?? 3,
    penaltyPerLatePKR: ((initialData.penaltyPerLatePaisa || 0) / 100).toString()
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (qrData) {
      setQrSettings({
        isEnabled: qrData.isEnabled ?? true,
        rotationSeconds: qrData.rotationSeconds ?? 30
      });
    }
    if (initialData) {
      setRules({
        graceMinutes: initialData.graceMinutes ?? 15,
        lateThresholdMinutes: initialData.lateThresholdMinutes ?? 30,
        halfDayThresholdLateCount: initialData.halfDayThresholdLateCount ?? 3,
        penaltyPerLatePKR: ((initialData.penaltyPerLatePaisa || 0) / 100).toString()
      });
    }
    if (faceData) {
      setFaceSettings({
        isEnabled: faceData.isEnabled ?? true,
        matchThreshold: faceData.matchThreshold ?? 0.50,
        requireLiveness: faceData.requireLiveness ?? true
      });
    }
  }, [initialData, qrData, faceData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRules((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const penaltyPkrNum = parseFloat(rules.penaltyPerLatePKR) || 0;
      const penaltyPaisa = Math.round(penaltyPkrNum * 100);

      const payload = {
        graceMinutes: parseInt(rules.graceMinutes, 10),
        lateThresholdMinutes: parseInt(rules.lateThresholdMinutes, 10),
        halfDayThresholdLateCount: parseInt(rules.halfDayThresholdLateCount, 10),
        penaltyPerLatePaisa: penaltyPaisa
      };

      await updateSetting({
        key: 'lateRules',
        value: payload,
        description: 'Updated late-arrival and penalty rules'
      }).unwrap();

      toast.success('Late arrival rules updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update late rules');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Timer className="w-4 h-4 text-emerald-500" />
          Punctuality & Late-Arrival Tolerances
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Define automatic tardiness thresholds and salary penalty calculations enforced across daily punch events.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Grace Period (Minutes) *
            </label>
            <input
              type="number"
              name="graceMinutes"
              min="0"
              max="60"
              required
              value={rules.graceMinutes}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Arrival within this window after shift start is marked on-time (e.g. 09:15 for 09:00 shift).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Late Mark Threshold (Minutes) *
            </label>
            <input
              type="number"
              name="lateThresholdMinutes"
              min="1"
              max="180"
              required
              value={rules.lateThresholdMinutes}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Arrivals after this mark receive an explicit "Late" badge and accumulate towards penalty count.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Consecutive Late Marks for 1 Half-Day Deduction *
            </label>
            <input
              type="number"
              name="halfDayThresholdLateCount"
              min="1"
              max="10"
              required
              value={rules.halfDayThresholdLateCount}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Standard Pakistani corporate rule: 3 late arrivals = 1 half-day salary deduction in payroll.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Flat Financial Fine per Late Mark (PKR)
            </label>
            <div className="relative">
              <Banknote className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                name="penaltyPerLatePKR"
                min="0"
                step="50"
                value={rules.penaltyPerLatePKR}
                onChange={handleChange}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Leave 0 if using attendance ratio deduction instead of direct cash penalty.
            </span>
          </div>
        </div>
      </div>

      {/* 13.6: Dynamic QR Attendance Kiosk Governance Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-500" />
              Dynamic QR Code Attendance (Office Kiosks & Turnstiles)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enable dynamic rotating QR code attendance on office reception kiosks and configure security rotation interval.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={qrSettings.isEnabled}
              onChange={(e) => setQrSettings((prev) => ({ ...prev, isEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {qrSettings.isEnabled ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              QR Code Rotation Interval (Seconds) *
            </label>
            <select
              value={qrSettings.rotationSeconds}
              disabled={!qrSettings.isEnabled}
              onChange={(e) => setQrSettings((prev) => ({ ...prev, rotationSeconds: parseInt(e.target.value, 10) }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              <option value={15}>15 Seconds (Ultra High Security)</option>
              <option value={30}>30 Seconds (Standard / Recommended)</option>
              <option value={45}>45 Seconds (Moderate Network)</option>
              <option value={60}>60 Seconds (Extended Display Window)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Kiosks automatically generate a new signed HMAC vector QR every cycle, invalidating stale photos.
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Rules...' : 'Save Attendance Rules'}
        </button>
      </div>
    </form>
  );
}
