/**
 * @file QrScannerModal.jsx
 * @description Camera Scanner Modal using html5-qrcode for Scan-to-Punch with hardware device binding.
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance (BUILD-GUIDE Section 18 · Rows 13.3 & 13.4)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogIn,
  LogOut,
  Smartphone
} from 'lucide-react';
import { useCheckInMutation, useCheckOutMutation } from '../attendanceApi.js';
import { getDeviceId, getDeviceModel } from '../../../utils/deviceFingerprint.js';
import { toast } from 'sonner';

export const QrScannerModal = ({ isOpen, onClose, defaultAction = 'in', onSuccess }) => {
  const [action, setAction] = useState(defaultAction); // 'in' | 'out'
  const [scannerError, setScannerError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(null);

  const scannerRef = useRef(null);
  const containerId = 'qr-camera-viewport';

  const [checkIn] = useCheckInMutation();
  const [checkOut] = useCheckOutMutation();

  useEffect(() => {
    setAction(defaultAction);
  }, [defaultAction, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isMounted = true;

    const startScanner = async () => {
      setScannerError('');
      setScanSuccess(null);
      setIsProcessing(false);

      // Brief delay to ensure DOM container is rendered
      await new Promise((r) => setTimeout(r, 150));
      if (!isMounted) return;

      try {
        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (!isProcessing) {
              handleQrDetected(decodedText);
            }
          },
          () => {
            // per-frame parse failure, normal when QR is not in sight
          }
        );
      } catch (err) {
        console.error('Camera initialization failed:', err);
        setScannerError(
          err?.message?.includes('Permission')
            ? 'Camera permission denied. Please enable camera access in your browser settings to scan attendance QR codes.'
            : 'Unable to access device camera. Please ensure camera is connected and not in use by another app.'
        );
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } else {
          scannerRef.current.clear().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQrDetected = async (token) => {
    setIsProcessing(true);
    setScannerError('');

    // Stop scanning camera
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const deviceId = getDeviceId();
    const deviceModel = getDeviceModel();

    try {
      let result;
      if (action === 'in') {
        result = await checkIn({
          source: 'qr',
          qrToken: token,
          deviceId,
          deviceModel
        }).unwrap();
        toast.success('Clock-In recorded successfully via QR scan!');
      } else {
        result = await checkOut({
          source: 'qr',
          qrToken: token,
          deviceId,
          deviceModel
        }).unwrap();
        toast.success('Clock-Out recorded successfully via QR scan!');
      }

      setScanSuccess({
        action,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      // Haptic feedback if supported on mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      if (onSuccess) onSuccess(result);

      // Close modal after brief success presentation
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('QR Punch Failed:', err);
      const errMsg =
        err?.data?.message || err?.message || 'Failed to process QR attendance punch.';
      setScannerError(errMsg);
      setIsProcessing(false);
    }
  };

  const handleRestartScanner = () => {
    setScannerError('');
    setIsProcessing(false);
    setScanSuccess(null);
    if (scannerRef.current) {
      scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleQrDetected(decodedText),
        () => {}
      ).catch((e) => setScannerError(e.message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">QR Code Attendance Scanner</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Point camera at office kiosk screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle (Clock In / Clock Out) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setAction('in')}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                action === 'in'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Clock In (Entry)</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('out')}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                action === 'out'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Clock Out (Exit)</span>
            </button>
          </div>
        </div>

        {/* Camera Viewport Container */}
        <div className="relative p-6 flex flex-col items-center justify-center bg-black min-h-[320px]">
          {scanSuccess ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-10 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-white">Punch Verified!</h4>
              <p className="text-xs text-slate-300">
                {scanSuccess.action === 'in' ? 'Clocked In' : 'Clocked Out'} at {scanSuccess.time}
              </p>
              <span className="text-[11px] text-emerald-400 font-medium">Device hardware bound successfully</span>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
              <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-xs font-medium text-slate-300">Verifying HMAC cryptographic signature...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div
                id={containerId}
                className="w-full max-w-[280px] h-[280px] rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-inner"
              />
            </div>
          )}

          {/* Scanner Error Display */}
          {scannerError && (
            <div className="absolute inset-x-4 bottom-4 p-3 bg-rose-950/90 border border-rose-800 rounded-xl text-xs text-rose-200 flex flex-col space-y-2 backdrop-blur-md">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1 text-[11px] leading-relaxed">{scannerError}</span>
              </div>
              <button
                type="button"
                onClick={handleRestartScanner}
                className="self-end px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-[10px] font-semibold transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer / Device info */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span className="truncate max-w-[200px]">{getDeviceModel()}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Anti-Proxy Active</span>
        </div>
      </div>
    </div>
  );
};

