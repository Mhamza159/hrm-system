import React, { useState } from 'react';
import {
  useGetFaceEnrollmentsQuery,
  useApproveFaceEnrollmentMutation,
  useRejectFaceEnrollmentMutation,
  useResetFaceEnrollmentMutation
} from '../attendanceApi';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export const FaceEnrollmentsPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, isFetching, refetch } = useGetFaceEnrollmentsQuery({
    status: activeTab === 'all' ? undefined : activeTab,
    search: searchTerm || undefined,
    page,
    limit: 12
  });

  const [approveEnrollment, { isLoading: isApproving }] = useApproveFaceEnrollmentMutation();
  const [rejectEnrollment, { isLoading: isRejecting }] = useRejectFaceEnrollmentMutation();
  const [resetEnrollment, { isLoading: isResetting }] = useResetFaceEnrollmentMutation();

  const users = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };

  const handleApprove = async (userId, userName) => {
    try {
      await approveEnrollment(userId).unwrap();
      toast.success(`Face biometric enrollment for ${userName} approved!`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to approve enrollment');
    }
  };

  const handleOpenRejectModal = (user) => {
    setRejectModalUser(user);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectEnrollment({ userId: rejectModalUser._id, reason: rejectionReason.trim() }).unwrap();
      toast.success(`Enrollment for ${rejectModalUser.name} rejected.`);
      setRejectModalUser(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject enrollment');
    }
  };

  const handleReset = async (userId, userName) => {
    const reason = window.prompt(`Enter administrative reason for resetting face biometric for ${userName}:`);
    if (!reason) return;

    try {
      await resetEnrollment({ userId, reason }).unwrap();
      toast.success(`Face biometric reset for ${userName}. Employee can now re-enroll.`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset enrollment');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Face Biometric Approvals</h1>
              <p className="text-sm text-muted-foreground">
                Review, verify, and approve employee facial enrollment descriptors and photos.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium border rounded-lg hover:bg-muted transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
          {[
            { id: 'pending', label: 'Pending Review', icon: Clock },
            { id: 'approved', label: 'Approved', icon: CheckCircle2 },
            { id: 'rejected', label: 'Rejected', icon: XCircle },
            { id: 'all', label: 'All Enrollments', icon: Filter }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Enrollments Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-2">
          <RefreshCw className="w-7 h-7 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading enrollment requests...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-card space-y-2">
          <UserCheck className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <h3 className="font-semibold text-foreground text-sm">No enrollment records found</h3>
          <p className="text-xs text-muted-foreground">
            {activeTab === 'pending'
              ? 'No pending face enrollments requiring approval at this time.'
              : 'Try adjusting your search criteria or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const enrollment = user.faceEnrollment || {};
            const emp = user.employeeId || {};
            const status = enrollment.status || 'none';

            return (
              <div
                key={user._id}
                className="bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Photo & Identity Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 border">
                      {enrollment.enrollmentPhotoUrl ? (
                        <img
                          src={enrollment.enrollmentPhotoUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <UserCheck className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-foreground truncate">{user.name}</h3>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {emp.employeeCode && (
                        <p className="text-[11px] text-primary font-medium">
                          ID: {emp.employeeCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded-xl border border-muted">
                    <div className="flex justify-between">
                      <span>Descriptors Captured:</span>
                      <span className="font-semibold text-foreground">
                        {enrollment.descriptors?.length || 0} vectors
                      </span>
                    </div>
                    {enrollment.enrolledAt && (
                      <div className="flex justify-between">
                        <span>Submitted Date:</span>
                        <span className="text-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {status === 'rejected' && enrollment.rejectionReason && (
                      <div className="pt-1 text-rose-600 dark:text-rose-400">
                        <span className="font-semibold">Reason: </span>
                        {enrollment.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t flex items-center gap-2">
                  {status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(user._id, user.name)}
                        disabled={isApproving}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(user)}
                        disabled={isRejecting}
                        className="py-1.5 px-3 border border-rose-300 text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReset(user._id, user.name)}
                      disabled={isResetting}
                      className="w-full py-1.5 px-3 border hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset / Request Re-enrollment
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Reject Face Enrollment</h3>
                <p className="text-xs text-muted-foreground">For: {rejectModalUser.name}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Rejection Reason (Required)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Photo too dark, face partially obscured by glasses or cap..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalUser(null)}
                className="px-3.5 py-2 text-xs font-medium border rounded-xl hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollmentsPage;
