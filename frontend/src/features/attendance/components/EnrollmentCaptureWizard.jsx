import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Maximize2,
  ChevronRight,
  Sun,
  Eye,
  Info,
  Check,
  Compass
} from 'lucide-react';
import { useFaceApi } from '../hooks/useFaceApi';
import { useEnrollFaceMutation } from '../attendanceApi';
import { toast } from 'sonner';

const STEPS = [
  {
    id: 1,
    title: 'Frontal Angle',
    sub: 'Direct view',
    instruction: 'Look straight at the camera with a relaxed, neutral expression.',
    iconDirection: 'center'
  },
  {
    id: 2,
    title: 'Slight Left',
    sub: 'Turn ~15° left',
    instruction: 'Gently turn your head slightly to your left while keeping eyes forward.',
    iconDirection: 'left'
  },
  {
    id: 3,
    title: 'Slight Right',
    sub: 'Turn ~15° right',
    instruction: 'Gently turn your head slightly to your right to record side depth.',
    iconDirection: 'right'
  }
];

export const EnrollmentCaptureWizard = ({ onEnrollmentComplete }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const detectionTimerRef = useRef(null);

  const { isLoaded: modelsLoaded, isLoading: modelsLoading, detectFaceAndDescriptor } = useFaceApi();
  const [enrollFace, { isLoading: isSubmitting }] = useEnrollFaceMutation();

  // Start webcam stream
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
      console.error('[Enrollment] Camera start error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions in your browser and ensure no other application is using it.'
      );
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current);
      }
    };
  }, []);

  // Lightweight detection loop to give user real-time visual feedback if face is in frame
  useEffect(() => {
    if (!modelsLoaded || cameraError) return;

    detectionTimerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isCapturing || isSubmitting) return;
      try {
        const res = await detectFaceAndDescriptor(videoRef.current, { inputSize: 224, scoreThreshold: 0.45 });
        setIsFaceDetected(Boolean(res));
      } catch {
        // silent loop
      }
    }, 400);

    return () => {
      if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current);
      }
    };
  }, [modelsLoaded, cameraError, isCapturing, isSubmitting, detectFaceAndDescriptor]);

  const handleCaptureFrame = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsCapturing(true);

    try {
      const result = await detectFaceAndDescriptor(videoRef.current, { inputSize: 320, scoreThreshold: 0.5 });
      if (!result) {
        toast.error('No face detected. Please ensure your face is well-lit and centered inside the biometric frame.');
        setIsCapturing(false);
        return;
      }

      // Capture lightweight, optimized photo snapshot (320x240 @ 0.7 quality ~12KB)
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg', 0.7);

      const newFrame = {
        step: currentStepIndex + 1,
        title: STEPS[currentStepIndex].title,
        descriptor: result.descriptor,
        photo: photoDataUri
      };

      const updated = [...capturedFrames, newFrame];
      setCapturedFrames(updated);

      if (currentStepIndex + 1 < STEPS.length) {
        setCurrentStepIndex(currentStepIndex + 1);
        toast.success(`Captured ${STEPS[currentStepIndex].title}! Proceeding to angle ${currentStepIndex + 2}.`);
      } else {
        toast.success('All 3 facial angles verified! Transmitting registration to HR...');
        await handleSubmitEnrollment(updated);
      }
    } catch (err) {
      console.error('[Enrollment] Capture error:', err);
      toast.error(err.message || 'Face detection failed. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmitEnrollment = async (frames) => {
    setSubmissionError(null);
    try {
      const descriptors = frames.map((f) => f.descriptor);
      const primaryPhoto = frames[0]?.photo || null;

      const res = await enrollFace({
        descriptors,
        photo: primaryPhoto
      }).unwrap();

      toast.success(res.message || 'Face enrollment submitted successfully! Pending HR approval.');
      if (onEnrollmentComplete) {
        onEnrollmentComplete();
      }
    } catch (err) {
      console.error('[Enrollment] Submission error:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to submit face enrollment. Please try again.';
      setSubmissionError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setSubmissionError(null);
    setCapturedFrames([]);
    setCurrentStepIndex(0);
  };

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ================= LEFT / MAIN: OPTICAL BIOMETRIC HUD ================= */}
      <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        {submissionError && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-rose-800 dark:text-rose-200 text-sm">
                Biometric Registration Conflict
              </p>
              <p className="text-xs leading-relaxed">{submissionError}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition"
                >
                  Clear & Re-capture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <h2 className="text-lg font-bold text-foreground font-mono-title">
                {currentStep.title}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">{currentStep.instruction}</p>
          </div>

          {/* Quick Progress Bar */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx < capturedFrames.length
                    ? 'w-7 bg-emerald-500'
                    : idx === currentStepIndex
                    ? 'w-9 bg-foreground shadow-xs'
                    : 'w-5 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Viewport Frame with Optical Biometric HUD */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 sm:aspect-16/10 flex items-center justify-center border-2 border-border shadow-inner group">
          {cameraError ? (
            <div className="p-8 text-center text-rose-400 space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Camera Access Required</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-2 text-xs px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Retry Camera Connection
              </button>
            </div>
          ) : (
            <>
              {/* Webcam Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror-mode"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Tactical Biometric HUD Corners */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

              {/* Center Biometric Oval Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-44 h-60 sm:w-52 sm:h-72 rounded-[50%] transition-all duration-300 relative flex items-center justify-center ${
                    isFaceDetected
                      ? 'border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                      : modelsLoaded
                      ? 'border-2 border-dashed border-amber-400/80 animate-pulse'
                      : 'border-2 border-dashed border-slate-600'
                  }`}
                >
                  {/* Internal alignment reticle */}
                  <div className="w-4 h-4 border-t border-b border-white/40 absolute" />
                  <div className="h-4 w-4 border-l border-r border-white/40 absolute" />
                </div>
              </div>

              {/* Status Header Chips */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-mono text-white flex items-center gap-2 border border-white/10 shadow-sm">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      modelsLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {modelsLoading
                      ? 'Loading Neural Weights...'
                      : isFaceDetected
                      ? 'Face In Position'
                      : modelsLoaded
                      ? 'Align Face In Frame'
                      : 'Calibrating...'}
                  </span>
                </div>
              </div>

              <div className="absolute top-3.5 right-3.5">
                <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-300 border border-white/10">
                  <span>RESNET-34 128-D</span>
                </div>
              </div>

              {/* Lower Direction Guidance HUD Banner */}
              <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-white flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                  <span className="font-semibold">{currentStep.title}:</span>
                  <span className="text-slate-300">{currentStep.instruction}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="flex items-center justify-between pt-2 gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={capturedFrames.length === 0 || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Captures</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureFrame}
            disabled={!modelsLoaded || isCapturing || isSubmitting || cameraError}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-[#00C471] hover:bg-[#049856] active:bg-[#038349] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Submitting to HR...</span>
              </>
            ) : isCapturing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Extracting Descriptors...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-white" />
                <span>Capture {currentStep.title}</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center ml-0.5 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3 text-white stroke-[2.5]" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= RIGHT: CAPTURE TELEMETRY & SEQUENCE PANEL ================= */}
      <div className="lg:col-span-4 space-y-5">
        {/* Angle Sequence Cards */}
        <div className="bg-card border rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>Biometric Angle Slots</span>
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground font-semibold">
              {capturedFrames.length} / {STEPS.length} Captured
            </span>
          </div>

          <div className="space-y-3">
            {STEPS.map((step, idx) => {
              const frame = capturedFrames[idx];
              const isCurrent = idx === currentStepIndex && !frame;
              const isCompleted = Boolean(frame);

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden ${
                    isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isCurrent
                      ? 'bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/20'
                      : 'bg-muted/40 border-border opacity-70'
                  }`}
                >
                  {/* Thumbnail / Indicator */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-border relative flex items-center justify-center">
                    {frame?.photo ? (
                      <img src={frame.photo} alt={step.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-0.5">
                        <span className="font-mono text-xs font-bold text-slate-400">#{step.id}</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-foreground truncate">{step.title}</h4>
                      <span className="text-[10px] font-mono text-muted-foreground">{step.sub}</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {isCompleted
                        ? '128-d descriptor extracted'
                        : isCurrent
                        ? 'Align face & tap capture'
                        : 'Waiting for previous angle'}
                    </p>

                    {isCompleted && (
                      <span className="inline-block text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        Ready for verification
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality & Guidance Best Practices */}
        <div className="bg-card border rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Biometric Accuracy Guidelines</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <span>Ensure adequate front-facing ambient lighting without dark shadows.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <span>Keep your eyes open and look directly into the camera lens.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <span>Do not wear heavy sunglasses or cover your face with clothing.</span>
            </li>
          </ul>
        </div>

        {/* Security & Data Privacy Pill */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-start gap-3 text-xs text-muted-foreground">
          <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground text-[11px]">Enterprise Biometric Privacy</span>
            <p className="text-[11px] leading-relaxed">
              Biometric embeddings are encrypted mathematically. Raw vectors are matched locally without third-party exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentCaptureWizard;
