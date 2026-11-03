import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, FileEdit } from 'lucide-react';
import { useFaceApi } from '../hooks/useFaceApi';
import { BlinkTracker } from '../utils/livenessDetector';
import { LivenessFeedback } from './LivenessFeedback';
import { useCheckInMutation, useCheckOutMutation } from '../attendanceApi';
import { toast } from 'sonner';

export const FaceCheckInModal = ({ isOpen, onClose, isClockedIn = false, isClockedOut = false, onOpenCorrectionModal }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blinkTrackerRef = useRef(new BlinkTracker({ closedThreshold: 0.25, openThreshold: 0.28 }));
  const detectionTimeoutRef = useRef(null);
  const isDetectingRef = useRef(false);
  const lastDetectedResultRef = useRef(null);
  const stableFramesRef = useRef(0);
  const isAutoPunchingRef = useRef(false);
  const lastErrorTimeRef = useRef(0);

  const [direction, setDirection] = useState(isClockedIn && !isClockedOut ? 'exit' : 'entry');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [currentEAR, setCurrentEAR] = useState(0.3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [punchError, setPunchError] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const { isLoaded: modelsLoaded, isLoading: modelsLoading, detectFaceAndDescriptor } = useFaceApi();
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const isSubmitting = isCheckingIn || isCheckingOut || isProcessing;

  // Initialize camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('[FaceModal] Camera error:', err);
      setCameraError('Unable to open camera. Please grant camera permission.');
    }
  };

  const stopCamera = () => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Perform face check-in/out submission (Option 1: Ultra-lightweight descriptor punch, no heavy snapshot)
  const executePunch = useCallback(async (descriptor) => {
    setIsProcessing(true);
    setPunchError(null);

    try {
      const payload = {
        source: 'face',
        liveDescriptor: descriptor
      };

      if (direction === 'entry') {
        const res = await checkIn(payload).unwrap();
        toast.success(res?.message || 'Face Check-In Successful! Welcome.');
      } else {
        const res = await checkOut(payload).unwrap();
        toast.success(res?.message || 'Face Check-Out Successful! Goodbye.');
      }

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('[FaceModal] Punch error:', err);
      const msg = err?.data?.message || err?.message || 'Face verification failed';
      setPunchError(msg);
      toast.error(msg);
      lastErrorTimeRef.current = Date.now();
      isAutoPunchingRef.current = false;
      setIsLive(false);
      stableFramesRef.current = 0;
    } finally {
      setIsProcessing(false);
    }
  }, [direction, checkIn, checkOut, onClose]);

  // Execute punch directly from detected descriptor (~1KB payload)
  const triggerPunchFromFrame = useCallback(async (descriptor) => {
    if (isSubmitting) return;
    await executePunch(descriptor);
  }, [executePunch, isSubmitting]);

  // Throttled real-time detection loop (runs every 200ms, auto punches when face is stable)
  const runDetectionLoop = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded || isSubmitting || isAutoPunchingRef.current) return;

    // 2.5s cooldown after an error before re-triggering auto punch
    if (Date.now() - lastErrorTimeRef.current < 2500) {
      detectionTimeoutRef.current = setTimeout(runDetectionLoop, 300);
      return;
    }

    if (!isDetectingRef.current && videoRef.current.readyState === 4) {
      isDetectingRef.current = true;
      try {
        const result = await detectFaceAndDescriptor(videoRef.current, { inputSize: 224 });

        if (result && result.landmarks && result.descriptor) {
          setIsFaceDetected(true);
          lastDetectedResultRef.current = result;

          const blinked = blinkTrackerRef.current.update(result.landmarks);
          setCurrentEAR(blinkTrackerRef.current.lastEAR);

          stableFramesRef.current += 1;

          // Auto-trigger punch upon either 2 consecutive stable face frames (~400ms) OR natural blink
          if ((stableFramesRef.current >= 2 || blinked) && !isAutoPunchingRef.current && !isSubmitting) {
            isAutoPunchingRef.current = true;
            setIsLive(true);
            await triggerPunchFromFrame(result.descriptor);
            return;
          }
        } else {
          setIsFaceDetected(false);
          stableFramesRef.current = 0;
        }
      } catch (e) {
        // Suppress frame drop errors
      } finally {
        isDetectingRef.current = false;
      }
    }

    if (!isAutoPunchingRef.current && !isSubmitting) {
      detectionTimeoutRef.current = setTimeout(runDetectionLoop, 200);
    }
  }, [modelsLoaded, isSubmitting, detectFaceAndDescriptor, triggerPunchFromFrame]);

  useEffect(() => {
    if (isOpen) {
      blinkTrackerRef.current.reset();
      stableFramesRef.current = 0;
      isAutoPunchingRef.current = false;
      lastErrorTimeRef.current = 0;
      setIsLive(false);
      setIsFaceDetected(false);
      setPunchError(null);
      setDirection(isClockedIn && !isClockedOut ? 'exit' : 'entry');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, isClockedIn, isClockedOut]);

  // Start detection loop once models are ready
  useEffect(() => {
    if (isOpen && modelsLoaded && !isLive && !isSubmitting) {
      detectionTimeoutRef.current = setTimeout(runDetectionLoop, 300);
    }
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [isOpen, modelsLoaded, isLive, isSubmitting, runDetectionLoop]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Facial Recognition Attendance</h3>
              <p className="text-xs text-muted-foreground">Contactless biometric punch with active verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direction Switcher (Clock In vs Clock Out) */}
        <div className="px-5">
          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setDirection('entry')}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                direction === 'entry'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Clock In (Entry)
            </button>
            <button
              type="button"
              onClick={() => setDirection('exit')}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                direction === 'exit'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Clock Out (Exit)
            </button>
          </div>
        </div>

        {/* Video Viewport */}
        <div className="px-5">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border shadow-inner">
            <LivenessFeedback
              isLive={isLive}
              currentEAR={currentEAR}
              isFaceDetected={isFaceDetected}
            />

            {cameraError ? (
              <div className="p-6 text-center text-rose-400 space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto" />
                <p className="text-xs">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 text-xs px-3 py-1.5 bg-rose-500/20 text-rose-300 rounded-md"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror-mode"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Oval Face Bounding Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-44 h-56 border-2 rounded-[50%] transition-all ${
                      isLive
                        ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105'
                        : isFaceDetected
                        ? 'border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'border-dashed border-white/30'
                    }`}
                  />
                </div>

                {/* Processing Overlay */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white z-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                    <p className="text-xs font-semibold">Matching Face Biometrics...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error / Fallback Card (12.8 Fallback Manual Correction) */}
        {punchError && (
          <div className="px-5">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{punchError}</span>
              </div>

              {/* 12.8 Fallback Action */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCorrectionModal) {
                      onOpenCorrectionModal();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition shadow-sm"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Request Manual Attendance Correction
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automated Punch Status & Real-time Feedback Footer */}
        <div className="p-5 bg-muted/40 border-t rounded-b-3xl space-y-3">
          {isSubmitting ? (
            <div
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 shadow-md ${
                direction === 'entry' ? 'bg-emerald-600' : 'bg-rose-600'
              } animate-pulse`}
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Biometrics & Clocking {direction === 'entry' ? 'In' : 'Out'}...</span>
            </div>
          ) : isFaceDetected ? (
            <div className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2.5 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Face Detected! Auto-verifying {direction === 'entry' ? 'Clock In' : 'Clock Out'}...</span>
            </div>
          ) : (
            <div className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4 text-slate-400" />
              <span>Position your face inside the frame to auto-punch</span>
            </div>
          )}

          <div className="text-center space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              {modelsLoading
                ? 'Loading AI face models...'
                : !isFaceDetected
                ? 'Look directly at camera to trigger automatic verification'
                : 'Hold still for a moment, attendance is recording automatically'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Contactless biometric punch &bull; Zero click required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceCheckInModal;
