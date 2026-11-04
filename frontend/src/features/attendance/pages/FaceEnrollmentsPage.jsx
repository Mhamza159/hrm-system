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
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Maximize2,
  ShieldCheck,
  Building2,
  Briefcase,
  Calendar,
  Sparkles,
  Camera,
  Check,
  X,
  Eye,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const QUICK_REJECT_REASONS = [
  'Photo is blurry or out of focus',
  'Face is turned too far away from camera',
  'Lighting is too dark or contains excessive glare',
  'Face is partially covered or obscured',
  'Incorrect employee photo submitted'
];

export const FaceEnrollmentsPage = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null); // { user, photoUrl }
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetReason, setResetReason] = useState('');

  const { data, isLoading, isFetching, refetch } = useGetFaceEnrollmentsQuery({
    status: activeTab === 'all' ? undefined : activeTab,
    search: searchTerm || undefined,
    page,
    limit: 24
  });

  const [approveEnrollment, { isLoading: isApproving }] = useApproveFaceEnrollmentMutation();
  const [rejectEnrollment, { isLoading: isRejecting }] = useRejectFaceEnrollmentMutation();
  const [resetEnrollment, { isLoading: isResetting }] = useResetFaceEnrollmentMutation();

  const users = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };
  const counts = data?.meta?.counts || { pending: 0, approved: 0, rejected: 0, all: 0 };

  const handleApprove = async (userId, userName) => {
    try {
      await approveEnrollment(userId).unwrap();
      toast.success(`Face biometric for ${userName} approved successfully!`);
      if (selectedPhotoModal?.user?._id === userId) {
        setSelectedPhotoModal(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to approve enrollment');
    }
  };

  const handleOpenRejectModal = (user) => {
    setRejectModalUser(user);
    setRejectionReason(QUICK_REJECT_REASONS[0]);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    try {
      await rejectEnrollment({ userId: rejectModalUser._id, reason: rejectionReason.trim() }).unwrap();
      toast.success(`Enrollment for ${rejectModalUser.name} rejected.`);
      setRejectModalUser(null);
      if (selectedPhotoModal?.user?._id === rejectModalUser._id) {
        setSelectedPhotoModal(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject enrollment');
    }
  };

  const handleOpenResetModal = (user) => {
    setResetModalUser(user);
    setResetReason('Administrative recalibration requested');
  };

  const handleConfirmReset = async () => {
    if (!resetReason.trim()) {
      toast.error('Please provide a reset reason');
      return;
    }
    try {
      await resetEnrollment({ userId: resetModalUser._id, reason: resetReason.trim() }).unwrap();
      toast.success(`Face biometric reset for ${resetModalUser.name}. Employee can re-enroll.`);
      setResetModalUser(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset enrollment');
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono-title">
                  Face Biometric Approvals
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                  M12 Core
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Audit, inspect facial descriptors, and authorize employee contactless attendance biometrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border rounded-xl bg-card hover:bg-muted text-foreground transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh Records'}</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Card */}
        <div
          onClick={() => { setActiveTab('pending'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-sm ring-1 ring-amber-500/30'
              : 'bg-card border-border hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Review
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              {(counts.pending > 0 || (activeTab === 'pending' && users.length > 0)) && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {counts.pending ?? 0}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Awaiting HR</span>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => { setActiveTab('approved'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
              : 'bg-card border-border hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Approved Active
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {counts.approved ?? 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active Passes</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => { setActiveTab('rejected'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'rejected'
              ? 'bg-rose-500/10 border-rose-500/40 shadow-sm ring-1 ring-rose-500/30'
              : 'bg-card border-border hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {counts.rejected ?? 0}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Recaptures</span>
          </div>
        </div>

        {/* Total Registered */}
        <div
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'all'
              ? 'bg-primary/10 border-primary/40 shadow-sm ring-1 ring-primary/30'
              : 'bg-card border-border hover:border-primary/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Recorded
            </span>
            <UserCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {counts.all ?? 0}
            </span>
            <span className="text-xs text-muted-foreground font-medium">Employees</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Tabs, Search & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 bg-card border rounded-2xl shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
            { id: 'approved', label: 'Approved', icon: CheckCircle2, count: counts.approved },
            { id: 'rejected', label: 'Rejected', icon: XCircle, count: counts.rejected },
            { id: 'all', label: 'All Records', icon: Filter, count: counts.all }
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
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-background' : ''}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-background/25 text-background'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employee, ID, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Card / Table Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Audit Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] rounded-2xl border bg-card p-12 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Loading Biometric Records...
          </p>
          <p className="text-xs text-muted-foreground">Fetching neural face descriptors and employee assignments</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 px-4 border rounded-3xl bg-card space-y-3 max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Camera className="w-7 h-7 text-muted-foreground/70" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground font-mono-title">
              {activeTab === 'pending'
                ? 'No Pending Biometric Reviews'
                : `No ${activeTab} Records Found`}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'All employee face enrollments have been reviewed. When an employee submits their facial capture, it will appear here.'
                : 'Try clearing your search query or switching to another status filter tab.'}
            </p>
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="mt-2 text-xs px-3.5 py-1.5 rounded-xl border bg-background hover:bg-muted font-medium transition"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= CARD / BENTO GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user) => {
            const enrollment = user.faceEnrollment || {};
            const emp = user.employeeId || {};
            const status = enrollment.status || 'none';
            const deptName = emp?.departmentId?.name || emp?.department || null;
            const desigTitle = emp?.designationId?.title || emp?.designation || null;
            const empCode = emp?.employeeCode || (user.employeeId && typeof user.employeeId === 'string' ? user.employeeId : null);

            return (
              <div
                key={user._id}
                className="bg-card border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Status Indicator Bar Top */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    status === 'approved'
                      ? 'bg-emerald-500'
                      : status === 'pending'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />

                <div className="space-y-4">
                  {/* Header: Photo + Profile Info */}
                  <div className="flex items-start gap-4">
                    {/* Captured Photo Frame */}
                    <div
                      onClick={() =>
                        enrollment.enrollmentPhotoUrl &&
                        setSelectedPhotoModal({ user, photoUrl: enrollment.enrollmentPhotoUrl })
                      }
                      className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-border flex-shrink-0 group/photo cursor-pointer shadow-inner"
                      title="Click to inspect captured face photo in full resolution"
                    >
                      {enrollment.enrollmentPhotoUrl ? (
                        <>
                          <img
                            src={enrollment.enrollmentPhotoUrl}
                            alt={user.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                          {/* Corner Scan Marks */}
                          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-emerald-400" />
                          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-emerald-400" />
                          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-emerald-400" />
                          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-emerald-400" />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1 bg-slate-900">
                          <UserCheck className="w-6 h-6" />
                          <span className="text-[9px] uppercase font-mono">No Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Employee Profile Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : status === 'pending'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'approved' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending' : 'Rejected'}
                        </span>
                        {empCode && (
                          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                            {empCode}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-foreground truncate" title={user.name}>
                        {user.name}
                      </h3>

                      <p className="text-xs text-muted-foreground truncate" title={user.email}>
                        {user.email}
                      </p>

                      {/* Department & Designation Badges */}
                      {(deptName || desigTitle) && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {deptName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-muted rounded-md text-foreground/80">
                              <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="truncate max-w-[110px]">{deptName}</span>
                            </span>
                          )}
                          {desigTitle && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-muted rounded-md text-foreground/80">
                              <Briefcase className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="truncate max-w-[120px]">{desigTitle}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Biometric Technical Details */}
                  <div className="bg-muted/40 border rounded-2xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Facial Embeddings:</span>
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {enrollment.descriptors?.length || 0} vectors (128-d)
                      </span>
                    </div>

                    {enrollment.enrolledAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Captured Date:</span>
                        </span>
                        <span className="font-mono text-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {status === 'approved' && enrollment.approvedAt && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Approved On:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {new Date(enrollment.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {status === 'rejected' && enrollment.rejectionReason && (
                      <div className="pt-1.5 border-t border-rose-500/20 text-rose-600 dark:text-rose-400">
                        <span className="font-bold">Reason: </span>
                        <span>{enrollment.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t flex items-center gap-2">
                  {status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(user._id, user.name)}
                        disabled={isApproving}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Biometric</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(user)}
                        disabled={isRejecting}
                        className="py-2 px-3 border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          enrollment.enrollmentPhotoUrl &&
                          setSelectedPhotoModal({ user, photoUrl: enrollment.enrollmentPhotoUrl })
                        }
                        className="flex-1 py-2 px-3 border border-border bg-card hover:bg-muted text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(user)}
                        disabled={isResetting}
                        className="py-2 px-3 border border-border hover:bg-rose-500/10 hover:border-rose-500/30 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="Reset biometric enrollment and prompt employee to re-enroll"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= HIGH-DENSITY AUDIT TABLE VIEW ================= */
        <div className="bg-card border rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                  <th className="py-3.5 px-4">Employee Details</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4 text-center">Biometric Capture</th>
                  <th className="py-3.5 px-4">Telemetry</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {users.map((user) => {
                  const enrollment = user.faceEnrollment || {};
                  const emp = user.employeeId || {};
                  const status = enrollment.status || 'none';
                  const deptName = emp?.departmentId?.name || emp?.department || '—';
                  const desigTitle = emp?.designationId?.title || emp?.designation || '—';
                  const empCode = emp?.employeeCode || 'EMP-—';

                  return (
                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                      {/* Employee Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground font-bold text-xs uppercase border flex-shrink-0">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground truncate">{user.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                {empCode}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{deptName}</p>
                          <p className="text-[11px] text-muted-foreground">{desigTitle}</p>
                        </div>
                      </td>

                      {/* Biometric Photo */}
                      <td className="py-3.5 px-4 text-center">
                        {enrollment.enrollmentPhotoUrl ? (
                          <div
                            onClick={() =>
                              setSelectedPhotoModal({ user, photoUrl: enrollment.enrollmentPhotoUrl })
                            }
                            className="relative inline-block w-12 h-12 rounded-xl overflow-hidden border bg-black cursor-pointer group shadow-xs"
                            title="Click to view full captured photo"
                          >
                            <img
                              src={enrollment.enrollmentPhotoUrl}
                              alt={user.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-muted-foreground">No Photo</span>
                        )}
                      </td>

                      {/* Telemetry */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            {enrollment.descriptors?.length || 0} Vectors
                          </span>
                          {enrollment.enrolledAt && (
                            <p className="text-muted-foreground text-[10px]">
                              {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                            status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : status === 'pending'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'approved' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(user._id, user.name)}
                                disabled={isApproving}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(user)}
                                disabled={isRejecting}
                                className="px-2.5 py-1.5 border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-semibold text-xs transition cursor-pointer"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenResetModal(user)}
                              disabled={isResetting}
                              className="px-2.5 py-1.5 border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                              title="Reset Biometric"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= BIOMETRIC PHOTO INSPECTION LIGHTBOX MODAL ================= */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground font-mono-title">
                    Biometric Verification Inspector
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    High-resolution facial capture inspection & verification audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Photo with Biometric Oval Guide + Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Photo Frame */}
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
                <img
                  src={selectedPhotoModal.photoUrl}
                  alt={selectedPhotoModal.user.name}
                  className="w-full h-full object-cover"
                />
                {/* Facial Inspection Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-32 h-44 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-emerald-300 font-mono flex items-center justify-between">
                  <span>320 × 240 RAW</span>
                  <span>128-D VECTOR ALIGNED</span>
                </div>
              </div>

              {/* Identity & Technical Info */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                    Employee Information
                  </span>
                  <h4 className="text-base font-bold text-foreground">
                    {selectedPhotoModal.user.name}
                  </h4>
                  <p className="text-muted-foreground">{selectedPhotoModal.user.email}</p>
                </div>

                <div className="p-3 bg-muted/50 border rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-bold uppercase font-mono text-foreground">
                      {selectedPhotoModal.user.faceEnrollment?.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descriptors:</span>
                    <span className="font-mono font-semibold text-emerald-500">
                      {selectedPhotoModal.user.faceEnrollment?.descriptors?.length || 0} angles (Front, Left, Right)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Captured On:</span>
                    <span className="font-mono text-foreground">
                      {selectedPhotoModal.user.faceEnrollment?.enrolledAt
                        ? new Date(selectedPhotoModal.user.faceEnrollment.enrolledAt).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Quick actions inside inspector */}
                {selectedPhotoModal.user.faceEnrollment?.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedPhotoModal.user._id, selectedPhotoModal.user.name)}
                      disabled={isApproving}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Face</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(selectedPhotoModal.user)}
                      disabled={isRejecting}
                      className="py-2 px-3 border border-rose-300 text-rose-600 hover:bg-rose-50 font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECTION MODAL WITH PRESET REASONS ================= */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Reject Biometric Enrollment</h3>
                <p className="text-xs text-muted-foreground">For: {rejectModalUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Select or provide a reason so the employee knows how to correct their photo when re-enrolling:
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                Quick Preset Reasons
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECT_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${
                      rejectionReason === reason
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-semibold'
                        : 'bg-muted/40 hover:bg-muted text-foreground/80'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Rejection Note (Visible to Employee)
              </label>
              <textarea
                rows={3}
                placeholder="Explain what was wrong with the biometric capture..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setRejectModalUser(null)}
                className="px-3.5 py-2 text-xs font-medium border rounded-xl hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESET MODAL ================= */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Reset Biometric Enrollment</h3>
                <p className="text-xs text-muted-foreground">For: {resetModalUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Resetting will clear the existing facial descriptors and require the employee to re-capture their face before using camera attendance.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Administrative Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Employee changed appearance, requested fresh setup..."
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-3.5 py-2 text-xs font-medium border rounded-xl hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting || !resetReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollmentsPage;
