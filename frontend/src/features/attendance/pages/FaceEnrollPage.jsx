import React from 'react';
import { useGetFaceStatusQuery, useResetFaceEnrollmentMutation } from '../attendanceApi';
import { EnrollmentCaptureWizard } from '../components/EnrollmentCaptureWizard';
import { CheckCircle2, Clock, XCircle, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const FaceEnrollPage = () => {
  const { data: statusData, isLoading, refetch } = useGetFaceStatusQuery();
  const [resetEnrollment, { isLoading: isResetting }] = useResetFaceEnrollmentMutation();

  const faceStatus = statusData?.data?.status || 'none';
  const enrolledAt = statusData?.data?.enrolledAt;
  const approvedAt = statusData?.data?.approvedAt;
  const rejectionReason = statusData?.data?.rejectionReason;
  const photoUrl = statusData?.data?.enrollmentPhotoUrl;

  const handleRequestReEnrollment = async () => {
    if (!window.confirm('Are you sure you want to reset your face biometric enrollment and capture new photos?')) {
      return;
    }
    try {
      await resetEnrollment({ userId: 'me', reason: 'Employee requested biometric re-enrollment' }).unwrap();
      toast.success('Previous enrollment cleared. You can now capture new photos.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset enrollment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking Face Biometric Status...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Facial Biometric Enrollment</h1>
            <p className="text-sm text-muted-foreground">
              Register your face descriptors to enable secure, contactless camera attendance check-in.
            </p>
          </div>
        </div>
      </div>

      {/* State 1: Approved */}
      {faceStatus === 'approved' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                Face Biometric Approved & Active
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your face descriptor is registered and verified by HR. You can now use the camera punch on the My Attendance page.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {enrolledAt && <span>Enrolled: {new Date(enrolledAt).toLocaleDateString()}</span>}
                {approvedAt && <span>Approved: {new Date(approvedAt).toLocaleDateString()}</span>}
              </div>
            </div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Enrolled Profile"
                className="w-20 h-20 rounded-xl object-cover border border-emerald-500/30 shadow-sm"
              />
            )}
          </div>

          <div className="pt-2 border-t border-emerald-500/20 flex justify-end">
            <button
              onClick={handleRequestReEnrollment}
              disabled={isResetting}
              className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-emerald-500/20 rounded-lg transition"
            >
              Request Re-enrollment
            </button>
          </div>
        </div>
      )}

      {/* State 2: Pending Approval */}
      {faceStatus === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-600 rounded-xl">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">
                Enrollment Pending HR Approval
              </h2>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Your face photos and descriptors have been submitted. An HR administrator must review and approve your biometric registration before camera check-in becomes active.
              </p>
              {enrolledAt && (
                <p className="text-xs text-muted-foreground pt-1">
                  Submitted on {new Date(enrolledAt).toLocaleString()}
                </p>
              )}
            </div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Pending Profile"
                className="w-20 h-20 rounded-xl object-cover border border-amber-500/30 shadow-sm"
              />
            )}
          </div>
        </div>
      )}

      {/* State 3: Rejected */}
      {faceStatus === 'rejected' && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/20 text-rose-600 rounded-xl">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-lg font-bold text-rose-800 dark:text-rose-300">
                Face Enrollment Rejected
              </h2>
              <p className="text-sm text-rose-700 dark:text-rose-400">
                Reason: {rejectionReason || 'The submitted photo was not clear or did not meet biometric guidelines.'}
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                Please ensure adequate lighting and center your face clearly inside the frame.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Render Capture Wizard if None or Rejected */}
      {(faceStatus === 'none' || faceStatus === 'rejected') && (
        <EnrollmentCaptureWizard onEnrollmentComplete={refetch} />
      )}
    </div>
  );
};

export default FaceEnrollPage;
