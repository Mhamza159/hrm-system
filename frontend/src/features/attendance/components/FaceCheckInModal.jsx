import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ScanFace,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  FileEdit,
  LogIn,
  LogOut,
  Cpu,
  Sparkles
} from 'lucide-react';
import { useFaceApi } from '../hooks/useFaceApi';
import { BlinkTracker } from '../utils/livenessDetector';
import { useCheckInMutation, useCheckOutMutation } from '../attendanceApi';
import { toast } from 'sonner';

export const FaceCheckInModal = ({
  isOpen,
  onClose,
  isClockedIn = false,
  isClockedOut = false,
  onOpenCorrectionModal
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blinkTrackerRef = useRef(new BlinkTracker({ closedThreshold: 0.25, openThreshold: 0.28 }));
  const detectionTimeoutRef = useRef(null);
  const isDetectingRef = useRef(false);
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
  const [isCameraReady, setIsCameraReady] = useState(false);

  const { isLoaded: modelsLoaded, isLoading: modelsLoading, detectFaceAndDescriptor } = useFaceApi();
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const isSubmitting = isCheckingIn || isCheckingOut || isProcessing;
  const isEngineReady = modelsLoaded && isCameraReady && !cameraError;

  // Initialize camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraReady(false);
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
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsCameraReady(true);
          }).catch((err) => {
            console.error('[FaceModal] Video play error:', err);
            setIsCameraReady(true);
          });
        };
      }
    } catch (err) {
      console.error('[FaceModal] Camera sensor acquisition error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in your browser settings.');
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
    setIsCameraReady(false);
  };

  // Perform face check-in/out submission (Option 1: 1KB descriptor payload)
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
        toast.success(res?.message || 'Face Check-In Verified! Welcome.');
      } else {
        const res = await checkOut(payload).unwrap();
        toast.success(res?.message || 'Face Check-Out Verified! Goodbye.');
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('[FaceModal] Biometric verification error:', err);
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

  // Execute punch directly from detected descriptor
  const triggerPunchFromFrame = useCallback(async (descriptor) => {
    if (isSubmitting) return;
    await executePunch(descriptor);
  }, [executePunch, isSubmitting]);

  // Real-time detection loop (runs continuously once optical engine is warm)
  const runDetectionLoop = useCallback(async () => {
    if (!videoRef.current || !isEngineReady || isSubmitting || isAutoPunchingRef.current) return;

    // 2.5s cooldown after an error before re-triggering auto punch
    if (Date.now() - lastErrorTimeRef.current < 2500) {
      detectionTimeoutRef.current = setTimeout(runDetectionLoop, 250);
      return;
    }

    if (!isDetectingRef.current && videoRef.current.readyState >= 2) {
      isDetectingRef.current = true;
      try {
        const result = await detectFaceAndDescriptor(videoRef.current, { inputSize: 256 });

        if (result && result.landmarks && result.descriptor) {
          setIsFaceDetected(true);

          const blinked = blinkTrackerRef.current.update(result.landmarks);
          setCurrentEAR(blinkTrackerRef.current.lastEAR);

          stableFramesRef.current += 1;

          // Auto-trigger punch upon either 2 consecutive stable face frames (~300ms) OR natural blink
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
        // Frame drop suppression
      } finally {
        isDetectingRef.current = false;
      }
    }

    if (!isAutoPunchingRef.current && !isSubmitting) {
      detectionTimeoutRef.current = setTimeout(runDetectionLoop, 150);
    }
  }, [isEngineReady, isSubmitting, detectFaceAndDescriptor, triggerPunchFromFrame]);

  // Reset lifecycle on modal open
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

  // Kick off detection loop immediately once engine is fully armed
  useEffect(() => {
    if (isOpen && isEngineReady && !isLive && !isSubmitting) {
      detectionTimeoutRef.current = setTimeout(runDetectionLoop, 100);
    }
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [isOpen, isEngineReady, isLive, isSubmitting, runDetectionLoop]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="relative bg-slate-950/95 border border-slate-800 text-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Subtle Ambient Radial Lighting Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-emerald-400">
                  Biometric Terminal
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Facial Biometric Attendance
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close biometric modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Direction Switcher (Clock In vs Clock Out) */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800/80 rounded-2xl gap-1.5">
            <button
              type="button"
              onClick={() => setDirection('entry')}
              className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'entry'
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Clock In (Entry)</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('exit')}
              className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'exit'
                  ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Clock Out (Exit)</span>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="px-6 pt-4">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800/90 shadow-2xl">
            
            {/* 1. PRE-LOADER STATE: Displayed while models or camera initialize */}
            {!isEngineReady && !cameraError && (
              <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="relative flex items-center justify-center">
                  {/* Concentric Pulsing Radar Rings */}
                  <div className="w-24 h-24 rounded-full border border-emerald-500/20 animate-radar absolute" />
                  <div className="w-16 h-16 rounded-full border border-emerald-500/40 animate-ping absolute opacity-30" />
                  <div className="w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                    <ScanFace className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Initializing Biometric Vision
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {modelsLoading
                      ? 'Loading neural weights into browser GPU cache...'
                      : 'Warming optical sensor & calibrating lighting field...'}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${modelsLoaded ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                    Neural Models {modelsLoaded ? 'Ready' : 'Loading'}
                  </span>
                  <span className="text-slate-700">|</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCameraReady ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                    Optical Sensor {isCameraReady ? 'Live' : 'Starting'}
                  </span>
                </div>
              </div>
            )}

            {/* Camera Error Display */}
            {cameraError && (
              <div className="p-6 text-center text-rose-400 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Camera Sensor Blocked</h3>
                  <p className="text-xs text-rose-300 max-w-xs leading-relaxed">{cameraError}</p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Video Viewport Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror-mode"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Optical HUD Overlay: Corner Brackets & Cybernetic Viewfinder */}
            {isEngineReady && (
              <>
                {/* Precision Corner Brackets */}
                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className={`w-8 h-8 border-t-2 border-l-2 rounded-tl-xl transition-all duration-300 ${
                      isFaceDetected ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-white/40'
                    }`} />
                    <div className={`w-8 h-8 border-t-2 border-r-2 rounded-tr-xl transition-all duration-300 ${
                      isFaceDetected ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-white/40'
                    }`} />
                  </div>

                  {/* Dynamic Vertical Scanning Laser Line */}
                  <div className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.9)] animate-scanline pointer-events-none z-10" />

                  <div className="flex justify-between items-end">
                    <div className={`w-8 h-8 border-b-2 border-l-2 rounded-bl-xl transition-all duration-300 ${
                      isFaceDetected ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-white/40'
                    }`} />
                    <div className={`w-8 h-8 border-b-2 border-r-2 rounded-br-xl transition-all duration-300 ${
                      isFaceDetected ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-white/40'
                    }`} />
                  </div>
                </div>

                {/* Central Face Target Framing */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-48 h-60 rounded-[50%] border-2 transition-all duration-300 ${
                      isLive
                        ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)] scale-105'
                        : isFaceDetected
                        ? 'border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.45)]'
                        : 'border-dashed border-white/20'
                    }`}
                  />
                </div>

                {/* Top HUD Telemetry Chips */}
                <div className="absolute top-3 inset-x-4 flex items-center justify-between pointer-events-none z-20">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold backdrop-blur-md transition-all shadow-md ${
                      isLive
                        ? 'bg-emerald-500/90 text-white border border-emerald-400'
                        : isFaceDetected
                        ? 'bg-amber-500/90 text-white border border-amber-400 animate-pulse'
                        : 'bg-black/60 text-white/80 border border-white/10'
                    }`}
                  >
                    {isLive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>BIO-LIVENESS VERIFIED</span>
                      </>
                    ) : isFaceDetected ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-white animate-bounce" />
                        <span>BLINK TO VERIFY</span>
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ALIGN FACE IN FRAME</span>
                      </>
                    )}
                  </div>

                  {isFaceDetected && (
                    <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-500/30 shadow-xs">
                      EAR: {currentEAR.toFixed(2)}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submission Processing Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white z-40">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
                <div className="text-center space-y-0.5">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                    Matching Bio-Descriptor
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Recording attendance to cryptographic ledger...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Mismatch Error Card */}
        {punchError && (
          <div className="px-6 pt-3">
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-rose-200">Face Verification Not Confirmed</span>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">{punchError}</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCorrectionModal) {
                      onOpenCorrectionModal();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl transition shadow-sm cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Request Manual Attendance Correction
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Action Status Footer */}
        <div className="p-6 pt-4 space-y-2.5">
          {isSubmitting ? (
            <div className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg ${
              direction === 'entry' ? 'bg-emerald-600' : 'bg-rose-600'
            } animate-pulse`}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying Biometrics & Clocking {direction === 'entry' ? 'In' : 'Out'}...</span>
            </div>
          ) : isFaceDetected ? (
            <div className="w-full py-3 px-4 rounded-xl font-bold text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Face Detected! Executing {direction === 'entry' ? 'Clock In' : 'Clock Out'}...</span>
            </div>
          ) : (
            <div className="w-full py-3 px-4 rounded-xl font-medium text-xs text-slate-400 bg-slate-900/80 border border-slate-800 flex items-center justify-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {!isEngineReady ? 'Calibrating optical vision engine...' : 'Position face inside the frame to auto-punch'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Liveness Protected</span>
            </span>
            <span>Zero-Click Biometrics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceCheckInModal;
