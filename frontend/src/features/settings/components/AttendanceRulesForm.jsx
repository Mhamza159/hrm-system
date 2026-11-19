/**
 * @file AttendanceRulesForm.jsx
 * @description Attendance Rules, Late Arrival Tolerances, Dynamic QR & Biometric Policies Form (Slice 2.4).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Timer,
  Banknote,
  QrCode,
  Camera,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Sliders
} from 'lucide-react';
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

  // Simulator State
  const [simArrivalMinutes, setSimArrivalMinutes] = useState(16);

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

  // Evaluation Simulation
  const simResult = useMemo(() => {
    const grace = parseInt(rules.graceMinutes, 10) || 0;
    const late = parseInt(rules.lateThresholdMinutes, 10) || 0;
    const penaltyPkr = parseFloat(rules.penaltyPerLatePKR) || 0;

    if (simArrivalMinutes <= 0) {
      return { status: 'On Time', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', penalty: 0, text: 'Clock-in occurred before or exactly at shift start time.' };
    }
    if (simArrivalMinutes <= grace) {
      return { status: 'Grace Period Utilized', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30', penalty: 0, text: `Within ${grace}m grace allowance. Marked present with zero deduction.` };
    }
    if (simArrivalMinutes <= late) {
      return { status: 'Late Arrival (Minor)', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30', penalty: penaltyPkr, text: `Exceeds grace period. Accumulates 1 late count towards ${rules.halfDayThresholdLateCount}-count half day threshold.` };
    }
    return { status: 'Severe Late Mark', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/30', penalty: penaltyPkr, text: `Exceeds late threshold of ${late}m. Automatically flagged for supervisor review.` };
  }, [simArrivalMinutes, rules.graceMinutes, rules.lateThresholdMinutes, rules.halfDayThresholdLateCount, rules.penaltyPerLatePKR]);

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

      await Promise.all([
        updateSetting({
          key: 'lateRules',
          value: payload,
          description: 'Updated late-arrival and penalty rules'
        }).unwrap(),
        updateSetting({
          key: 'qrAttendance',
          value: qrSettings,
          description: 'Updated QR code attendance kiosk settings'
        }).unwrap(),
        updateSetting({
          key: 'faceAttendance',
          value: faceSettings,
          description: 'Updated Face recognition attendance rules and matching threshold'
        }).unwrap()
      ]);

      toast.success('Attendance rules & biometric policies updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update attendance rules');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Punctuality & Tolerances Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-500" />
            Punctuality & Late-Arrival Tolerances
          </h3>
          <span className="text-xs font-mono font-medium text-slate-500">
            Enforced System-Wide
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Define automatic tardiness thresholds and salary penalty calculations enforced across daily punch events.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Grace Period Allowance (Minutes) *
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
              Arrivals past grace but within this threshold receive an accumulated "Late" count.
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
              Leave 0 if using attendance ratio deduction instead of direct cash fine.
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Attendance Kiosk Governance Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-500" />
              Dynamic QR Code Attendance (Office Kiosks & Turnstiles)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enable dynamic rotating QR code attendance on office reception kiosks with anti-replay vector tokens.
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
              Kiosks automatically generate a new signed HMAC vector QR every cycle, invalidating screenshot replay attempts.
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Hardware Binding Safeguard
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When scanning kiosk QR codes, the employee's mobile device ID is validated. Discrepancies block punch execution unless reset by an authorized administrator under User Access.
            </p>
          </div>
        </div>
      </div>

      {/* Facial Recognition Attendance Governance Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-500" />
              Facial Recognition Attendance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI face biometric verification with Eye Aspect Ratio (EAR) blink liveness anti-spoofing.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={faceSettings.isEnabled}
              onChange={(e) => setFaceSettings((prev) => ({ ...prev, isEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {faceSettings.isEnabled ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Matching Sensitivity Threshold
              </label>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Distance &lt; {faceSettings.matchThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.70"
              step="0.05"
              value={faceSettings.matchThreshold}
              disabled={!faceSettings.isEnabled}
              onChange={(e) => setFaceSettings((prev) => ({ ...prev, matchThreshold: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.30 (Ultra Strict)</span>
              <span>0.50 (Standard)</span>
              <span>0.70 (Permissive)</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={faceSettings.requireLiveness}
                disabled={!faceSettings.isEnabled}
                onChange={(e) => setFaceSettings((prev) => ({ ...prev, requireLiveness: e.target.checked }))}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mandatory Blink Liveness Anti-Spoofing
              </span>
            </label>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Forces real-time eye aspect ratio tracking to prevent photo or video spoofing attacks.
            </span>
          </div>
        </div>

        {/* Biometric Privacy Banner */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Biometric Data Privacy:</strong> Facial features are mapped into 128-float Euclidean vector descriptors. Raw photos are never stored or transmitted to external AI endpoints.
          </span>
        </div>
      </div>

      {/* Card 4: Interactive Late Arrival Simulation Sandbox */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-emerald-500" />
            Punctuality Rules Simulator
          </h3>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
            Sandbox Simulator
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulate an employee check-in relative to shift start (09:00) to preview how the current grace and penalty settings evaluate.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <div className="w-full sm:w-1/2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Arrival Delay:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                +{simArrivalMinutes} minutes (09:{simArrivalMinutes < 10 ? `0${simArrivalMinutes}` : simArrivalMinutes})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={simArrivalMinutes}
              onChange={(e) => setSimArrivalMinutes(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500"
            />
          </div>

          <div className="w-full sm:w-1/2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Calculated Verdict:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${simResult.badge}`}>
                {simResult.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {simResult.text}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? 'Saving Rules...' : 'Save Attendance Rules'}
        </button>
      </div>
    </form>
  );
}
