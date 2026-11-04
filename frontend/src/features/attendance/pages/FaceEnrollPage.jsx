import React, { useState } from 'react';
import { useGetFaceStatusQuery, useResetFaceEnrollmentMutation } from '../attendanceApi';
import { EnrollmentCaptureWizard } from '../components/EnrollmentCaptureWizard';
import {
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Camera,
  Calendar,
  Building2,
  Briefcase,
  Crown,
  Shield,
  Users,
  AlertTriangle,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';

const getRoleBadge = (roleName = 'Employee') => {
  const normalized = String(roleName).toLowerCase();
  if (normalized.includes('super admin') || normalized.includes('admin')) {
    return { label: roleName, icon: Crown, classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
  }
  if (normalized.includes('hr') || normalized.includes('manager')) {
    return { label: roleName, icon: Shield, classes: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
  }
  if (normalized.includes('department') || normalized.includes('lead')) {
    return { label: roleName, icon: Users, classes: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' };
  }
  return { label: roleName, icon: UserCheck, classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
};

export const FaceEnrollPage = () => {
  const { data: statusData, isLoading, refetch } = useGetFaceStatusQuery();
  const [resetEnrollment, { isLoading: isResetting }] = useResetFaceEnrollmentMutation();
  const [isReEnrolling, setIsReEnrolling] = useState(false);

  const faceStatus = statusData?.data?.status || 'none';
  const enrolledAt = statusData?.data?.enrolledAt;
  const approvedAt = statusData?.data?.approvedAt;
  const rejectionReason = statusData?.data?.rejectionReason;
  const photoUrl = statusData?.data?.enrollmentPhotoUrl;
  const descriptorsCount = statusData?.data?.descriptorsCount || 0;
  const employee = statusData?.data?.employee || {};

  const roleConfig = getRoleBadge(employee.role);
  const RoleIcon = roleConfig.icon;

  const handleRequestReEnrollment = () => {
    setIsReEnrolling(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-semibold text-foreground tracking-wide uppercase">
          Verifying Biometric Status...
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header Block matching docs/UI-REFERENCE.md */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono-title">
                  Facial Biometric Enrollment
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                  M12 Registration
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Register your 3D facial descriptors for contactless, zero-click attendance check-in.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl border bg-card shadow-xs flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                faceStatus === 'approved'
                  ? 'bg-emerald-500'
                  : faceStatus === 'pending'
                  ? 'bg-amber-500 animate-ping'
                  : faceStatus === 'rejected'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-mono font-semibold uppercase text-foreground">
              Status: {faceStatus === 'none' ? 'Not Enrolled' : faceStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ================= STATE 1: APPROVED PASS CARD ================= */}
      {faceStatus === 'approved' && !isReEnrolling && (
        <div className="max-w-2xl mx-auto bg-card border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          {/* Top Holographic Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Captured Profile Photo */}
            <div className="relative w-32 h-36 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-md flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Enrolled Biometric" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <UserCheck className="w-8 h-8" />
                </div>
              )}
              <div className="absolute bottom-1 inset-x-1 bg-black/75 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-mono text-center text-emerald-300">
                VERIFIED PASS
              </div>
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-2 flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Approved & Active</span>
                </span>
                {employee.employeeCode && (
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-md border">
                    {employee.employeeCode}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                {employee.name}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">{employee.email}</p>

              {/* System Role Badge */}
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${roleConfig.classes}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  <span>{employee.role}</span>
                </span>
                {employee.designation && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{employee.designation}</span>
                  </span>
                )}
              </div>

              {employee.department && (
                <p className="text-[11px] text-muted-foreground flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>{employee.department}</span>
                </p>
              )}
            </div>
          </div>

          {/* Biometric Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/40 rounded-2xl border text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">Descriptors</span>
              <span className="font-mono font-bold text-foreground">
                {descriptorsCount || 3} Vectors (128-d)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">Enrolled Date</span>
              <span className="font-mono font-semibold text-foreground">
                {enrolledAt ? new Date(enrolledAt).toLocaleDateString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">Authorized</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {approvedAt ? new Date(approvedAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Camera check-in is active on the <strong>My Attendance</strong> page.
            </span>
            <button
              type="button"
              onClick={handleRequestReEnrollment}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border rounded-xl transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request Re-enrollment</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STATE 2: PENDING APPROVAL ================= */}
      {faceStatus === 'pending' && !isReEnrolling && (
        <div className="max-w-2xl mx-auto bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Facial Biometric Pending HR Authorization
                </h2>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your 3-angle face capture and mathematical descriptors have been safely uploaded. An HR administrator must review and approve your biometric registration before camera punch becomes active.
              </p>
              {enrolledAt && (
                <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 pt-1">
                  Submitted on {new Date(enrolledAt).toLocaleString()}
                </p>
              )}
            </div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Pending Profile"
                className="w-20 h-24 rounded-2xl object-cover border border-amber-500/30 shadow-xs flex-shrink-0"
              />
            )}
          </div>

          <div className="p-4 bg-muted/40 border rounded-2xl text-xs space-y-2">
            <span className="font-semibold text-foreground">What happens next?</span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Once verified by HR, your account status will change to <strong>Approved</strong> and the camera check-in button on your daily attendance page will unlock automatically.
            </p>
          </div>
        </div>
      )}

      {/* ================= STATE 3: REJECTED ================= */}
      {faceStatus === 'rejected' && !isReEnrolling && (
        <div className="max-w-2xl mx-auto bg-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-lg font-bold text-foreground">
                Face Enrollment Required Recalibration
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Reason: {rejectionReason || 'The submitted capture did not meet biometric clarity standards.'}
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                Please ensure adequate front lighting, remove tinted glasses, and center your face inside the frame.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleRequestReEnrollment}
              className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background hover:bg-foreground/90 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>Begin New Facial Capture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STATE 4: CAPTURE WIZARD (NEW ENROLLMENT OR RE-ENROLLING) ================= */}
      {(faceStatus === 'none' || isReEnrolling) && (
        <div className="space-y-4">
          {isReEnrolling && (
            <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-2xl">
              <span className="text-xs text-muted-foreground font-medium">
                Re-capturing 3-angle face biometric for HR re-authorization
              </span>
              <button
                type="button"
                onClick={() => setIsReEnrolling(false)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
              >
                Cancel Re-enrollment
              </button>
            </div>
          )}
          <EnrollmentCaptureWizard
            onEnrollmentComplete={() => {
              setIsReEnrolling(false);
              refetch();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FaceEnrollPage;
