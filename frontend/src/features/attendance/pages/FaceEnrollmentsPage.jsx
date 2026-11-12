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
  Camera,
  Check,
  X,
  Eye,
  Crown,
  Users,
  Shield,
  BadgeCheck,
  Mail,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

const QUICK_REJECT_REASONS = [
  'Photo is blurry or out of focus',
  'Face is turned too far away from camera',
  'Lighting is too dark or contains excessive glare',
  'Face is partially covered or obscured',
  'Incorrect employee photo submitted'
];

/**
 * Returns role badge styling & icon based on role name
 */
const getRoleBadgeConfig = (roleName = 'Employee') => {
  const normalized = String(roleName).toLowerCase();
  if (normalized.includes('super admin') || normalized.includes('admin')) {
    return {
      label: roleName,
      icon: Crown,
      classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    };
  }
  if (normalized.includes('hr') || normalized.includes('manager')) {
    return {
      label: roleName,
      icon: Shield,
      classes: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
    };
  }
  if (normalized.includes('department') || normalized.includes('lead')) {
    return {
      label: roleName,
      icon: Users,
      classes: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    };
  }
  return {
    label: roleName,
    icon: UserCheck,
    classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  };
};

export const FaceEnrollmentsPage = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null); // { user, details, photoUrl }
  const [rejectModalUser, setRejectModalUser] = useState(null); // { id, name }
  const [rejectionReason, setRejectionReason] = useState('');
  const [resetModalUser, setResetModalUser] = useState(null); // { id, name }
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

  const handleApprove = async (userId, employeeName) => {
    try {
      await approveEnrollment(userId).unwrap();
      toast.success(`Face biometric for ${employeeName} approved successfully!`);
      if (selectedPhotoModal?.user?._id === userId) {
        setSelectedPhotoModal(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to approve enrollment');
    }
  };

  const handleOpenRejectModal = (user, employeeName) => {
    setRejectModalUser({ id: user._id, name: employeeName });
    setRejectionReason(QUICK_REJECT_REASONS[0]);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    try {
      await rejectEnrollment({ userId: rejectModalUser.id, reason: rejectionReason.trim() }).unwrap();
      toast.success(`Enrollment for ${rejectModalUser.name} rejected.`);
      if (selectedPhotoModal?.user?._id === rejectModalUser.id) {
        setSelectedPhotoModal(null);
      }
      setRejectModalUser(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject enrollment');
    }
  };

  const handleOpenResetModal = (user, employeeName) => {
    setResetModalUser({ id: user._id, name: employeeName });
    setResetReason('Administrative recalibration requested');
  };

  const handleConfirmReset = async () => {
    if (!resetReason.trim()) {
      toast.error('Please provide a reset reason');
      return;
    }
    try {
      await resetEnrollment({ userId: resetModalUser.id, reason: resetReason.trim() }).unwrap();
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
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 dark:bg-[#0A1610] rounded-2xl shrink-0 border border-slate-200/60 dark:border-emerald-950/40">
          {[
            {
              id: 'pending',
              label: 'Pending Review',
              icon: Clock,
              count: counts.pending,
              activeCls: 'bg-amber-500 text-white shadow-xs shadow-amber-500/25',
              inactiveIconCls: 'text-amber-500'
            },
            {
              id: 'approved',
              label: 'Approved',
              icon: CheckCircle2,
              count: counts.approved,
              activeCls: 'bg-[#00C471] text-white shadow-xs shadow-emerald-500/25',
              inactiveIconCls: 'text-[#00C471]'
            },
            {
              id: 'rejected',
              label: 'Rejected',
              icon: XCircle,
              count: counts.rejected,
              activeCls: 'bg-rose-600 text-white shadow-xs shadow-rose-600/25',
              inactiveIconCls: 'text-rose-500'
            },
            {
              id: 'all',
              label: 'All Records',
              icon: Filter,
              count: counts.all,
              activeCls: 'bg-slate-900 dark:bg-emerald-900/80 text-white shadow-xs',
              inactiveIconCls: 'text-slate-500 dark:text-slate-400'
            }
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
                    ? tab.activeCls
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.inactiveIconCls}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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
              placeholder="Search by name, ID, email..."
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

            // Explicit Employee Detail Resolution
            const employeeName = emp.name || user.name || user.email?.split('@')[0] || 'Employee';
            const employeeEmail = user.email || '—';
            const employeeCode = emp.employeeCode || (typeof user.employeeId === 'string' ? user.employeeId : 'EMP-—');
            const department = emp?.departmentId?.name || emp?.department || null;
            const designation = emp?.designationId?.title || emp?.designation || null;
            const rolesList = (user.roles || []).map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
            const primaryRole = rolesList[0] || 'Employee';
            const roleConfig = getRoleBadgeConfig(primaryRole);
            const RoleIcon = roleConfig.icon;

            const cardDetails = {
              name: employeeName,
              email: employeeEmail,
              code: employeeCode,
              role: primaryRole,
              department,
              designation
            };

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
                  {/* Status & Employee Code Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : status === 'pending'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          status === 'approved'
                            ? 'bg-emerald-500'
                            : status === 'pending'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      {status === 'approved' ? 'Approved Active' : status === 'pending' ? 'Pending Review' : 'Rejected'}
                    </span>

                    <span className="text-[11px] font-mono text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-md border border-border">
                      {employeeCode}
                    </span>
                  </div>

                  {user.collision?.hasConflict && (
                    <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[11px] uppercase tracking-wide text-rose-800 dark:text-rose-200">
                          Biometric Conflict Detected
                        </p>
                        <p className="text-[11px] truncate text-rose-600 dark:text-rose-400">
                          Matches: <strong>{user.collision.conflictingEmployeeName}</strong> ({user.collision.conflictingEmployeeCode})
                        </p>
                        {user.collision.distance !== null && (
                          <p className="text-[10px] font-mono text-rose-500/80">
                            Distance: {user.collision.distance} (&lt; 0.50 threshold)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Header: Photo + Profile Details */}
                  <div className="flex items-start gap-4">
                    {/* Captured Photo Frame */}
                    <div
                      onClick={() =>
                        enrollment.enrollmentPhotoUrl &&
                        setSelectedPhotoModal({
                          user,
                          details: cardDetails,
                          photoUrl: enrollment.enrollmentPhotoUrl
                        })
                      }
                      className="relative w-24 h-28 rounded-2xl overflow-hidden bg-slate-950 border-2 border-border flex-shrink-0 group/photo cursor-pointer shadow-inner"
                      title="Click to inspect captured face photo in full resolution"
                    >
                      {enrollment.enrollmentPhotoUrl ? (
                        <>
                          <img
                            src={enrollment.enrollmentPhotoUrl}
                            alt={employeeName}
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

                    {/* Employee Identity Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Full Name */}
                      <h3 className="font-extrabold text-base text-foreground truncate" title={employeeName}>
                        {employeeName}
                      </h3>

                      {/* Email */}
                      <p className="text-xs text-muted-foreground font-mono truncate" title={employeeEmail}>
                        {employeeEmail}
                      </p>

                      {/* System Role Badge */}
                      <div className="pt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${roleConfig.classes}`}
                          title={`System Role: ${primaryRole}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{primaryRole}</span>
                        </span>
                      </div>

                      {/* Assigned Designation */}
                      {designation && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">{designation}</span>
                        </div>
                      )}

                      {/* Assigned Department */}
                      {department && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{department}</span>
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
                        onClick={() => handleApprove(user._id, employeeName)}
                        disabled={isApproving || Boolean(user.collision?.hasConflict)}
                        className={`flex-1 py-2 px-3 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs ${
                          user.collision?.hasConflict
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-not-allowed opacity-80'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 disabled:opacity-50'
                        }`}
                        title={
                          user.collision?.hasConflict
                            ? `Cannot approve: duplicate biometric with ${user.collision.conflictingEmployeeName} (${user.collision.conflictingEmployeeCode})`
                            : 'Approve Biometric'
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{user.collision?.hasConflict ? 'Approval Blocked' : 'Approve Biometric'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(user, employeeName)}
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
                          setSelectedPhotoModal({
                            user,
                            details: cardDetails,
                            photoUrl: enrollment.enrollmentPhotoUrl
                          })
                        }
                        className="flex-1 py-2 px-3 border border-border bg-card hover:bg-muted text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(user, employeeName)}
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
                  <th className="py-3.5 px-4">Role & Designation</th>
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

                  // Explicit Detail Resolution
                  const employeeName = emp.name || user.name || user.email?.split('@')[0] || 'Employee';
                  const employeeEmail = user.email || '—';
                  const employeeCode = emp.employeeCode || (typeof user.employeeId === 'string' ? user.employeeId : 'EMP-—');
                  const department = emp?.departmentId?.name || emp?.department || '—';
                  const designation = emp?.designationId?.title || emp?.designation || 'Staff Member';
                  const rolesList = (user.roles || []).map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
                  const primaryRole = rolesList[0] || 'Employee';
                  const roleConfig = getRoleBadgeConfig(primaryRole);
                  const RoleIcon = roleConfig.icon;

                  const rowDetails = {
                    name: employeeName,
                    email: employeeEmail,
                    code: employeeCode,
                    role: primaryRole,
                    department,
                    designation
                  };

                  return (
                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                      {/* Employee Details (Name, Code, Email) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground font-bold text-xs uppercase border border-border flex-shrink-0 shadow-xs">
                            {employeeName.charAt(0)}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground truncate">{employeeName}</span>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded border border-border">
                                {employeeCode}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{employeeEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* System Role & Assigned Designation */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${roleConfig.classes}`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              <span>{primaryRole}</span>
                            </span>
                            <span className="font-semibold text-foreground text-xs">{designation}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground/70" />
                            <span>{department}</span>
                          </p>
                        </div>
                      </td>

                      {/* Biometric Photo */}
                      <td className="py-3.5 px-4 text-center">
                        {enrollment.enrollmentPhotoUrl ? (
                          <div
                            onClick={() =>
                              setSelectedPhotoModal({
                                user,
                                details: rowDetails,
                                photoUrl: enrollment.enrollmentPhotoUrl
                              })
                            }
                            className="relative inline-block w-12 h-14 rounded-xl overflow-hidden border-2 border-border bg-black cursor-pointer group shadow-xs"
                            title="Click to view full captured photo"
                          >
                            <img
                              src={enrollment.enrollmentPhotoUrl}
                              alt={employeeName}
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
                          {user.collision?.hasConflict && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-sans font-semibold mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                              <span>Duplicate ({user.collision.conflictingEmployeeCode})</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                            status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : status === 'pending'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status === 'approved'
                                ? 'bg-emerald-500'
                                : status === 'pending'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
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
                                onClick={() => handleApprove(user._id, employeeName)}
                                disabled={isApproving || Boolean(user.collision?.hasConflict)}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs ${
                                  user.collision?.hasConflict
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-not-allowed opacity-80'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                                title={
                                  user.collision?.hasConflict
                                    ? `Cannot approve: duplicate biometric with ${user.collision.conflictingEmployeeName} (${user.collision.conflictingEmployeeCode})`
                                    : 'Approve'
                                }
                              >
                                {user.collision?.hasConflict ? 'Blocked' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(user, employeeName)}
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
                              onClick={() => handleOpenResetModal(user, employeeName)}
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
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-emerald-950/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00C471] border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-mono-title">
                    Biometric Verification Inspector
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-resolution facial capture inspection & verification audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Photo with Biometric Oval Guide + Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Photo Frame */}
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 shadow-lg flex items-center justify-center">
                <img
                  src={selectedPhotoModal.photoUrl}
                  alt={selectedPhotoModal.details.name}
                  className="w-full h-full object-cover"
                />
                {/* Facial Inspection Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-32 h-44 border-2 border-dashed border-[#00C471] rounded-[50%] shadow-[0_0_24px_rgba(0,196,113,0.4)]" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-emerald-400 font-mono flex items-center justify-between border border-emerald-500/20">
                  <span className="font-semibold">320 × 240 RAW</span>
                  <span className="font-bold">128-D VECTOR ALIGNED</span>
                </div>
              </div>

              {/* Identity & Technical Info */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Employee Details
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedPhotoModal.details.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedPhotoModal.details.email}</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-[#0A1610] border border-slate-200/80 dark:border-emerald-950/80 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Employee ID:</span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                      {selectedPhotoModal.details.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">System Role:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedPhotoModal.details.role}
                    </span>
                  </div>
                  {selectedPhotoModal.details.designation && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Designation:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedPhotoModal.details.designation}
                      </span>
                    </div>
                  )}
                  {selectedPhotoModal.details.department && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Department:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedPhotoModal.details.department}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                    {selectedPhotoModal.user.faceEnrollment?.status === 'approved' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        Approved
                      </span>
                    ) : selectedPhotoModal.user.faceEnrollment?.status === 'rejected' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        Pending Review
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Descriptors:</span>
                    <span className="font-mono font-bold text-xs text-[#00C471] bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/40">
                      {selectedPhotoModal.user.faceEnrollment?.descriptors?.length || 0} vectors
                    </span>
                  </div>
                </div>

                {selectedPhotoModal.user.collision?.hasConflict && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900 dark:text-rose-200">Biometric Conflict Detected</p>
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                        Matches {selectedPhotoModal.user.collision.conflictingEmployeeName} ({selectedPhotoModal.user.collision.conflictingEmployeeCode})
                        {selectedPhotoModal.user.collision.distance !== null && ` · Dist: ${selectedPhotoModal.user.collision.distance}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick actions inside inspector */}
                {selectedPhotoModal.user.faceEnrollment?.status === 'pending' && (
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedPhotoModal.user._id, selectedPhotoModal.details.name)}
                      disabled={isApproving || Boolean(selectedPhotoModal.user.collision?.hasConflict)}
                      className={`flex-1 py-2.5 px-4 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md ${
                        selectedPhotoModal.user.collision?.hasConflict
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-not-allowed opacity-80'
                          : 'bg-[#00C471] hover:bg-[#049856] active:bg-[#038349] text-white shadow-emerald-500/20 cursor-pointer'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{selectedPhotoModal.user.collision?.hasConflict ? 'Approval Blocked' : 'Approve Face'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(selectedPhotoModal.user, selectedPhotoModal.details.name)}
                      disabled={isRejecting}
                      className="py-2.5 px-4 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold rounded-xl text-xs transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-emerald-950/80 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reject Biometric Enrollment
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mt-0.5">
                  Target: {rejectModalUser.name}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select or provide a reason so the employee knows how to correct their photo when re-enrolling:
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
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
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-600 dark:text-rose-300 font-semibold'
                        : 'bg-slate-100/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rejection Note (Visible to Employee)
              </label>
              <textarea
                rows={3}
                placeholder="Explain what was wrong with the biometric capture..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all"
              />
            </div>

            <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalUser(null)}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                {isRejecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESET MODAL ================= */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-emerald-950/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reset Biometric Enrollment
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mt-0.5">
                  Target: {resetModalUser.name}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/30 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                Resetting will immediately clear all facial embedding vectors and require the employee to complete a fresh biometric enrollment before camera check-in.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Administrative Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Employee changed appearance, requested fresh setup..."
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting || !resetReason.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollmentsPage;
