import React from 'react';
import { Eye, CheckCircle2, ShieldAlert } from 'lucide-react';

export const LivenessFeedback = ({ isLive, currentEAR = 0, isFaceDetected = false }) => {
  return (
    <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
      {/* Left indicator: Liveness Status */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
          isLive
            ? 'bg-emerald-500/90 text-white border border-emerald-400'
            : isFaceDetected
            ? 'bg-amber-500/90 text-white border border-amber-400 animate-pulse'
            : 'bg-black/60 text-white/80 border border-white/10'
        }`}
      >
        {isLive ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Live Person Verified</span>
          </>
        ) : isFaceDetected ? (
          <>
            <Eye className="w-4 h-4 text-white animate-bounce" />
            <span>Please blink naturally</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-white/70" />
            <span>Position your face in center</span>
          </>
        )}
      </div>

      {/* Right indicator: EAR Metric badge */}
      {isFaceDetected && (
        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-white/90 border border-white/10">
          EAR: {currentEAR.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default LivenessFeedback;
