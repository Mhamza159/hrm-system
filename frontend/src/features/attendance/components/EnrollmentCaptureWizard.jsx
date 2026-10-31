import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useFaceApi } from '../hooks/useFaceApi';
import { useEnrollFaceMutation } from '../attendanceApi';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Frontal Face', instruction: 'Look directly at the camera with a neutral expression' },
  { id: 2, title: 'Slight Left', instruction: 'Turn your head slightly to the left' },
  { id: 3, title: 'Slight Right', instruction: 'Turn your head slightly to the right' }
];

export const EnrollmentCaptureWizard = ({ onEnrollmentComplete }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

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
      setCameraError('Unable to access camera. Please allow camera permissions and ensure no other application is using it.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCaptureFrame = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsCapturing(true);

    try {
      const result = await detectFaceAndDescriptor(videoRef.current);
      if (!result) {
        toast.error('No face detected. Please ensure your face is well-lit and centered inside the frame.');
        setIsCapturing(false);
        return;
      }

      // Capture photo snapshot from video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg', 0.85);

      const newFrame = {
        step: currentStepIndex + 1,
        descriptor: result.descriptor,
        photo: photoDataUri
      };

      const updated = [...capturedFrames, newFrame];
      setCapturedFrames(updated);

      if (currentStepIndex + 1 < STEPS.length) {
        setCurrentStepIndex(currentStepIndex + 1);
        toast.success(`Captured angle ${currentStepIndex + 1} of ${STEPS.length}!`);
      } else {
        toast.success('All 3 angles captured! Submitting enrollment to HR...');
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
      toast.error(err?.data?.message || 'Failed to submit face enrollment. Please try again.');
    }
  };

  const handleReset = () => {
    setCapturedFrames([]);
    setCurrentStepIndex(0);
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
      {/* Header and Step Indicators */}
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Face Biometric Enrollment
        </h2>
        <p className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {STEPS.length}: <span className="font-semibold text-foreground">{STEPS[currentStepIndex].title}</span>
        </p>
        <p className="text-xs text-primary font-medium">{STEPS[currentStepIndex].instruction}</p>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center items-center gap-3">
        {STEPS.map((s, idx) => (
          <div
            key={s.id}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              idx < capturedFrames.length
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : idx === currentStepIndex
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {idx < capturedFrames.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{s.id}</span>}
            <span>{s.title}</span>
          </div>
        ))}
      </div>

      {/* Video Viewport with Oval Face Guide */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border shadow-inner">
        {cameraError ? (
          <div className="p-6 text-center text-rose-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-2 text-xs px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-md transition"
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

            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-48 h-64 border-2 rounded-[50%] transition-all ${
                  modelsLoaded
                    ? 'border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'border-dashed border-amber-400/80'
                }`}
              />
            </div>

            {/* Status Chip */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white flex items-center gap-1.5 border border-white/10">
              <span className={`w-2 h-2 rounded-full ${modelsLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {modelsLoading ? 'Loading Neural Weights...' : modelsLoaded ? 'Face AI Engine Ready' : 'Initializing...'}
            </div>
          </>
        )}
      </div>

      {/* Captured Frames Thumbnail Bar */}
      {capturedFrames.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Captured Angles</p>
          <div className="flex gap-3">
            {capturedFrames.map((frame, idx) => (
              <div key={idx} className="relative w-20 h-16 rounded-lg overflow-hidden border border-emerald-500/40 shadow-sm">
                <img src={frame.photo} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center text-emerald-300 py-0.5">
                  Angle {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={capturedFrames.length === 0 || isSubmitting}
          className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition disabled:opacity-40"
        >
          Reset Captures
        </button>

        <button
          type="button"
          onClick={handleCaptureFrame}
          disabled={!modelsLoaded || isCapturing || isSubmitting || cameraError}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Submitting to HR...
            </>
          ) : isCapturing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Detecting Face...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Capture Angle {currentStepIndex + 1}
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EnrollmentCaptureWizard;
