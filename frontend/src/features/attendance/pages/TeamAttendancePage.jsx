/**
 * @file TeamAttendancePage.jsx
 * @description Manager Live Team Presence Grid & Approvals Dashboard with Real-Time Socket.io sync.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Rows 5.10, 5.8, 5.12)
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Clock3,
  Laptop,
  FileSpreadsheet,
  Edit,
  Coffee,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Building2,
  ShieldCheck,
  LogIn,
  LogOut,
  Timer,
  LayoutGrid,
  List,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  UserCheck,
  CalendarDays,
  FileText,
  Check,
  X
} from 'lucide-react';
import {
  useGetTeamAttendanceQuery,
  useGetAttendanceHistoryQuery,
  useGetTeamWFHRequestsQuery,
  useDecideWFHMutation,
  useGetTeamCorrectionsQuery,
  useDecideCorrectionMutation
} from '../attendanceApi.js';
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge.jsx';
import { EditAttendanceModal } from '../components/EditAttendanceModal.jsx';
import { ExportAttendanceModal } from '../components/ExportAttendanceModal.jsx';
import { PunchCorrectionReviewModal } from '../components/PunchCorrectionReviewModal.jsx';
import { WFHReviewModal } from '../components/WFHReviewModal.jsx';
import { getSocket } from '../../notifications/hooks/useSocket.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useSearchParams } from 'react-router-dom';

export const TeamAttendancePage = () => {
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState(urlTab || 'all'); // 'all' | 'history' | 'wfh' | 'corrections'
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['all', 'history', 'wfh', 'corrections'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAttendanceForEdit, setSelectedAttendanceForEdit] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Detailed Punch Correction Review Modal State
  const [selectedCorrectionForReview, setSelectedCorrectionForReview] = useState(null);
  const [isCorrectionReviewModalOpen, setIsCorrectionReviewModalOpen] = useState(false);

  // Detailed WFH Review & Audit Modal State
  const [selectedWFHForReview, setSelectedWFHForReview] = useState(null);
  const [isWFHReviewModalOpen, setIsWFHReviewModalOpen] = useState(false);

  // History Matrix State (Team Attendance History)
  const currentDate = new Date();
  const currentActiveMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [historyMonth, setHistoryMonth] = useState(currentActiveMonth);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const [hYearStr, hMonthStr] = historyMonth.split('-');
  const historyYear = parseInt(hYearStr, 10);
  const historyMonthNum = parseInt(hMonthStr, 10);
  const historyDaysInMonth = new Date(historyYear, historyMonthNum, 0).getDate();

  const handlePrevHistoryMonth = () => {
    const d = new Date(historyYear, historyMonthNum - 2, 1);
    setHistoryMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextHistoryMonth = () => {
    const d = new Date(historyYear, historyMonthNum, 1);
    setHistoryMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Queries
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useGetTeamAttendanceQuery({
    date: selectedDate
  });

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useGetAttendanceHistoryQuery(
    {
      month: historyMonth,
      search: historySearch,
      selfOnly: false,
      page: historyPage,
      limit: 10
    },
    { skip: activeTab !== 'history' }
  );

  const historyItems = historyData?.data?.items || [];
  const historyTotal = historyData?.data?.total || 0;
  const historyPages = historyData?.data?.pages || 1;
  const historyDaysCount = historyData?.data?.daysInMonth || historyDaysInMonth;

  // WFH & Corrections History Queries (Fetch All for Audit & History)
  const { data: wfhData, isLoading: isWFHLoading, refetch: refetchWFH } = useGetTeamWFHRequestsQuery(
    { status: 'all' },
    { skip: activeTab !== 'wfh' }
  );

  const { data: correctionsData, isLoading: isCorrectionsLoading, refetch: refetchCorrections } = useGetTeamCorrectionsQuery(
    { status: 'all' },
    { skip: activeTab !== 'corrections' }
  );

  // WFH Requests & History State
  const [wfhViewMode, setWfhViewMode] = useState('table'); // 'table' | 'card'
  const [wfhStatusFilter, setWfhStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [wfhSearch, setWfhSearch] = useState('');

  // Punch Corrections & History State
  const [correctionViewMode, setCorrectionViewMode] = useState('table'); // 'table' | 'card'
  const [correctionStatusFilter, setCorrectionStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [correctionSearch, setCorrectionSearch] = useState('');

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    type: 'wfh', // 'wfh' | 'correction'
    id: null,
    decision: 'approved',
    applicantName: '',
    date: '',
    reasonOrNotes: ''
  });

  // Mutations
  const [decideWFH, { isLoading: isDecidingWFH }] = useDecideWFHMutation();
  const [decideCorrection, { isLoading: isDecidingCorrection }] = useDecideCorrectionMutation();

  // Listen to real-time punch events via Socket.io
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
      if (socket) {
        socket.on('attendance:punch', () => {
          refetchTeam();
        });
      }
    } catch {
      // Socket not ready yet
    }

    return () => {
      if (socket) socket.off('attendance:punch');
    };
  }, [refetchTeam]);

  const teamMembers = teamData?.data?.items || [];
  const wfhRequests = wfhData?.data || [];
  const corrections = correctionsData?.data || [];

  const pendingWFHCount = wfhRequests.filter((r) => r.status === 'pending').length;
  const approvedWFHCount = wfhRequests.filter((r) => r.status === 'approved').length;
  const rejectedWFHCount = wfhRequests.filter((r) => r.status === 'rejected').length;

  const filteredWFHRequests = wfhRequests.filter((req) => {
    if (wfhStatusFilter !== 'all' && req.status !== wfhStatusFilter) return false;
    if (wfhSearch.trim()) {
      const q = wfhSearch.toLowerCase();
      const name = (req.employeeId?.name || `${req.employeeId?.firstName || ''} ${req.employeeId?.lastName || ''}`).toLowerCase();
      const code = (req.employeeId?.employeeCode || '').toLowerCase();
      const dept = (req.employeeId?.departmentId?.name || '').toLowerCase();
      const reason = (req.reason || '').toLowerCase();
      const decider = (req.decisionBy?.name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || dept.includes(q) || reason.includes(q) || decider.includes(q);
    }
    return true;
  });

  const pendingCorrectionsCount = corrections.filter((r) => r.status === 'pending').length;
  const approvedCorrectionsCount = corrections.filter((r) => r.status === 'approved').length;
  const rejectedCorrectionsCount = corrections.filter((r) => r.status === 'rejected').length;

  const filteredCorrections = corrections.filter((req) => {
    if (correctionStatusFilter !== 'all' && req.status !== correctionStatusFilter) return false;
    if (correctionSearch.trim()) {
      const q = correctionSearch.toLowerCase();
      const name = (req.employeeId?.name || `${req.employeeId?.firstName || ''} ${req.employeeId?.lastName || ''}`).toLowerCase();
      const code = (req.employeeId?.employeeCode || '').toLowerCase();
      const dept = (req.employeeId?.departmentId?.name || '').toLowerCase();
      const reason = (req.reason || '').toLowerCase();
      const decider = (req.decisionBy?.name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || dept.includes(q) || reason.includes(q) || decider.includes(q);
    }
    return true;
  });

  const filteredMembers = teamMembers.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'online') return item.presence === 'online';
    if (statusFilter === 'break') return item.presence === 'on_break';
    if (statusFilter === 'clocked_out') return item.presence === 'clocked_out';
    if (statusFilter === 'absent') return item.presence === 'absent';
    return true;
  });

  const openDecisionModal = (type, req, decision) => {
    const applicantName = req.employeeId?.name || `${req.employeeId?.firstName || ''} ${req.employeeId?.lastName || ''}`.trim() || 'Employee';
    const dateFormatted = new Date(req.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setDecisionModal({
      isOpen: true,
      type,
      id: req._id,
      decision,
      applicantName,
      date: dateFormatted,
      reasonOrNotes: ''
    });
  };

  const handleConfirmDecision = async () => {
    const { type, id, decision, reasonOrNotes } = decisionModal;
    try {
      if (type === 'wfh') {
        await decideWFH({ id, decision, decisionReason: reasonOrNotes }).unwrap();
        refetchWFH();
      } else {
        await decideCorrection({ id, decision, decisionNotes: reasonOrNotes }).unwrap();
        refetchCorrections();
      }
      refetchTeam();
      setDecisionModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      alert(err.data?.message || err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team Attendance & Presence
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live floor presence, break tracking, WFH requests, and punch correction approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {can('attendance.export') && (
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Timesheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Team Presence Grid
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance History</span>
          </button>
          {can('attendance.approve') && (
            <>
              <button
                onClick={() => setActiveTab('wfh')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'wfh'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>WFH Requests</span>
                {pendingWFHCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-xs font-bold animate-pulse">
                    {pendingWFHCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-xs font-semibold">
                    {wfhRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('corrections')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'corrections'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Punch Corrections</span>
                {pendingCorrectionsCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-xs font-bold animate-pulse">
                    {pendingCorrectionsCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200 rounded-full text-xs font-semibold">
                    {corrections.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Live Team Presence Grid */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Quick Sub-Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: `All Staff (${teamMembers.length})` },
              { id: 'online', label: 'Online / Working' },
              { id: 'break', label: 'On Break' },
              { id: 'clocked_out', label: 'Clocked Out' },
              { id: 'absent', label: 'Absent' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  statusFilter === f.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {teamLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading team presence data...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No employee attendance records matched this criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filteredMembers.map((item) => {
                const emp = item.employee;
                const att = item.attendance;
                const presence = item.presence;

                const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const isSuperAdmin =
                  emp.role === 'Super Admin' ||
                  emp.employeeCode === 'EMP-000' ||
                  emp.email === 'mhamzaofficial159@gmail.com';

                // Designation & Department resolution without trailing dots
                const designationTitle =
                  emp.designation && emp.designation !== 'Staff'
                    ? emp.designation
                    : isSuperAdmin
                    ? 'Chief Executive Officer'
                    : 'Team Member';

                const departmentName =
                  emp.department && emp.department !== 'General'
                    ? emp.department
                    : isSuperAdmin
                    ? 'Executive Management'
                    : '';

                // Initial derivation fallback
                const initials = empName
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'EM';

                return (
                  <div
                    key={emp._id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all duration-200 flex flex-col justify-between h-full group"
                  >
                    <div>
                      {/* Top Header: Avatar + Name + Super Admin Badge + Status Badge */}
                      <div className="flex items-center justify-between gap-3 h-12">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Avatar with live presence ring */}
                          <div className="relative shrink-0">
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={empName}
                                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20 dark:ring-emerald-400/20 shadow-xs"
                              />
                            ) : (
                              <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs tracking-wider shadow-xs ${
                                  isSuperAdmin
                                    ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white ring-2 ring-emerald-400/30'
                                    : 'bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 ring-2 ring-slate-200 dark:ring-slate-700'
                                }`}
                              >
                                {initials}
                              </div>
                            )}

                            {/* Presence Dot Indicator */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                                presence === 'online'
                                  ? 'bg-emerald-500'
                                  : presence === 'on_break'
                                  ? 'bg-amber-500 animate-pulse'
                                  : presence === 'clocked_out'
                                  ? 'bg-slate-400'
                                  : 'bg-rose-500'
                              }`}
                              title={`Status: ${presence.replace('_', ' ')}`}
                            />
                          </div>

                          {/* Full Name & Designation/Department (Fixed Height, Truncated to Prevent Staggering) */}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate"
                                title={empName}
                              >
                                {empName}
                              </span>
                              {isSuperAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-2xs shrink-0">
                                  <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={designationTitle}>
                                {designationTitle}
                              </span>
                              {departmentName && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate" title={departmentName}>
                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{departmentName}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex items-center">
                          {att?.status ? (
                            <AttendanceStatusBadge status={att.status} flags={att.flags} />
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Absent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metrics Grid: Clock In & Clock Out (Uniform Height & Clean Symmetry) */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Clock In Block */}
                          <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 h-[64px] flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                              <span>Clock In</span>
                              <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                              {att?.checkIn
                                ? new Date(att.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </div>
                          </div>

                          {/* Clock Out Block */}
                          <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 h-[64px] flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                              <span>Clock Out</span>
                              <LogOut className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                            <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                              {att?.checkOut
                                ? new Date(att.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Worked Hours & Break Strip (Uniform Height & No Raw IDs) */}
                        <div className="flex items-center justify-between px-3 h-9 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
                            <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              Worked:{' '}
                              <strong className="font-bold text-emerald-900 dark:text-emerald-200">
                                {att?.workDurationMinutes ? (att.workDurationMinutes / 60).toFixed(1) : '0.0'} hrs
                              </strong>
                            </span>
                          </div>

                          {att?.totalBreakMinutes > 0 ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                              <Coffee className="w-3 h-3 text-amber-600" />
                              <span>{att.totalBreakMinutes}m break</span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
                              Regular Shift
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer / Edit Punch Action */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs h-9">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                        Shift: {emp.shift?.name || 'Standard'}
                      </span>
                      {can('attendance.edit') && (
                        <button
                          onClick={() => {
                            setSelectedAttendanceForEdit(att);
                            setEditModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Punch</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: WFH Requests & Full History */}
      {activeTab === 'wfh' && (
        <div className="space-y-4">
          {/* Header Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Work-From-Home (WFH) Requests & History
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review pending WFH applications, applicant details, approver audit trail, and timestamps.
                </p>
              </div>

              {/* View Mode Switcher (Table vs Cards) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0 self-start md:self-auto">
                <button
                  onClick={() => setWfhViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    wfhViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setWfhViewMode('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    wfhViewMode === 'card'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card View</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'all', label: `All Requests (${wfhRequests.length})` },
                  { id: 'pending', label: `Pending (${pendingWFHCount})` },
                  { id: 'approved', label: `Approved (${approvedWFHCount})` },
                  { id: 'rejected', label: `Rejected (${rejectedWFHCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setWfhStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      wfhStatusFilter === f.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={wfhSearch}
                  onChange={(e) => setWfhSearch(e.target.value)}
                  placeholder="Search applicant, reason, approver..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Data List Content */}
          {isWFHLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
              <div className="text-sm font-medium">Loading WFH applications history...</div>
            </div>
          ) : filteredWFHRequests.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No WFH requests found matching this criteria.
            </div>
          ) : wfhViewMode === 'table' ? (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                      <th className="py-3 px-4 min-w-[200px]">Applicant</th>
                      <th className="py-3 px-4 min-w-[130px]">Target Date</th>
                      <th className="py-3 px-4 min-w-[200px]">Reason</th>
                      <th className="py-3 px-4 min-w-[140px]">Applied At</th>
                      <th className="py-3 px-4 min-w-[110px]">Status</th>
                      <th className="py-3 px-4 min-w-[220px]">Decision & Timings</th>
                      {can('attendance.approve') && <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredWFHRequests.map((req) => {
                      const emp = req.employeeId || {};
                      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                      const isSuperAdmin = emp.employeeCode === 'EMP-000';
                      const initials = empName
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'EM';

                      return (
                        <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Applicant */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {emp.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={empName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{empName}</span>
                                  {isSuperAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {emp.designationId?.title || 'Team Member'} · {emp.departmentId?.name || 'General'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Target Date */}
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{new Date(req.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3 px-4">
                            <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2 max-w-xs" title={req.reason}>
                              "{req.reason}"
                            </p>
                          </td>

                          {/* Applied At */}
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {req.createdAt ? new Date(req.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {req.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                Approved
                              </span>
                            ) : req.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Decision & Timings */}
                          <td className="py-3 px-4">
                            {req.decisionBy ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{req.decisionBy.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({req.decisionBy.role || 'Manager'})</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock3 className="w-3 h-3" />
                                  <span>{new Date(req.decisionAt || req.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {req.decisionReason && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                    "{req.decisionReason}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Awaiting review</span>
                            )}
                          </td>

                          {/* Actions */}
                          {can('attendance.approve') && (
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {req.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedWFHForReview(req);
                                      setIsWFHReviewModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Review & Audit</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedWFHForReview(req);
                                    setIsWFHReviewModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                                >
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span>Audit Log</span>
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filteredWFHRequests.map((req) => {
                const emp = req.employeeId || {};
                const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const isSuperAdmin = emp.employeeCode === 'EMP-000';
                const initials = empName
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'EM';

                return (
                  <div
                    key={req._id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all duration-200 flex flex-col justify-between h-full group"
                  >
                    <div className="space-y-3.5">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3 h-12">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={empName}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                              <span>{empName}</span>
                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {emp.designationId?.title || 'Team Member'} · {emp.departmentId?.name || 'General'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {req.status === 'approved' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              Approved
                            </span>
                          ) : req.status === 'rejected' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Target Date Box */}
                      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>WFH Date:</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {new Date(req.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Reason Callout */}
                      <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 text-xs">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>Reason</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Audit / Decision Footer */}
                    <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {req.decisionBy ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              {req.decisionBy.name}
                            </span>
                            <span>{new Date(req.decisionAt || req.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          {req.decisionReason && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              Remarks: "{req.decisionReason}"
                            </div>
                          )}
                          <div className="pt-1.5 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedWFHForReview(req);
                                setIsWFHReviewModalOpen(true);
                              }}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View Audit Record</span>
                            </button>
                          </div>
                        </div>
                      ) : can('attendance.approve') ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">
                            Applied: {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedWFHForReview(req);
                              setIsWFHReviewModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review & Audit</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Awaiting review</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Punch Correction Requests & Full History */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          {/* Header Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Missed-Punch Correction Requests & History
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Audit trail of requested attendance punches, original check-in/out records, and manager approvals.
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0 self-start md:self-auto">
                <button
                  onClick={() => setCorrectionViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    correctionViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setCorrectionViewMode('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    correctionViewMode === 'card'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card View</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'all', label: `All Corrections (${corrections.length})` },
                  { id: 'pending', label: `Pending (${pendingCorrectionsCount})` },
                  { id: 'approved', label: `Approved (${approvedCorrectionsCount})` },
                  { id: 'rejected', label: `Rejected (${rejectedCorrectionsCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCorrectionStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      correctionStatusFilter === f.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={correctionSearch}
                  onChange={(e) => setCorrectionSearch(e.target.value)}
                  placeholder="Search employee, reason, approver..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Corrections Data Content */}
          {isCorrectionsLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
              <div className="text-sm font-medium">Loading punch correction records...</div>
            </div>
          ) : filteredCorrections.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No punch correction requests found matching this criteria.
            </div>
          ) : correctionViewMode === 'table' ? (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                      <th className="py-3 px-4 min-w-[200px]">Applicant</th>
                      <th className="py-3 px-4 min-w-[120px]">Punch Date</th>
                      <th className="py-3 px-4 min-w-[200px]">Requested Timings</th>
                      <th className="py-3 px-4 min-w-[150px]">Reason</th>
                      <th className="py-3 px-4 min-w-[110px]">Status</th>
                      <th className="py-3 px-4 min-w-[220px]">Decision & Audit</th>
                      {can('attendance.approve') && <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredCorrections.map((item) => {
                      const emp = item.employeeId || {};
                      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                      const isSuperAdmin = emp.employeeCode === 'EMP-000';
                      const initials = empName
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'EM';

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Applicant */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {emp.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={empName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{empName}</span>
                                  {isSuperAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {emp.designationId?.title || 'Team Member'} · {emp.departmentId?.name || 'General'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Missed Punch Date */}
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </td>

                          {/* Requested Timings */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60">
                                  <LogIn className="w-3 h-3" />
                                  {item.requestedCheckIn ? new Date(item.requestedCheckIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60">
                                  <LogOut className="w-3 h-3" />
                                  {item.requestedCheckOut ? new Date(item.requestedCheckOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                              </div>
                              {item.attendanceId && (
                                <div className="text-[10px] text-slate-400">
                                  Original: {item.attendanceId.checkIn ? new Date(item.attendanceId.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'None'} - {item.attendanceId.checkOut ? new Date(item.attendanceId.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'None'}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3 px-4">
                            <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2 max-w-xs" title={item.reason}>
                              "{item.reason}"
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {item.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                Approved
                              </span>
                            ) : item.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Decision & Audit */}
                          <td className="py-3 px-4">
                            {item.decisionBy ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{item.decisionBy.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({item.decisionBy.role || 'Manager'})</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock3 className="w-3 h-3" />
                                  <span>{new Date(item.decisionAt || item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {item.decisionNotes && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                    Notes: "{item.decisionNotes}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Awaiting review</span>
                            )}
                          </td>

                          {/* Actions */}
                          {can('attendance.approve') && (
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {item.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedCorrectionForReview(item);
                                      setIsCorrectionReviewModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                                  >
                                    <span>Review & Decide</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filteredCorrections.map((item) => {
                const emp = item.employeeId || {};
                const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const isSuperAdmin = emp.employeeCode === 'EMP-000';
                const initials = empName
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'EM';

                return (
                  <div
                    key={item._id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all duration-200 flex flex-col justify-between h-full group"
                  >
                    <div className="space-y-3.5">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3 h-12">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={empName}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                              <span>{empName}</span>
                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {emp.designationId?.title || 'Team Member'} · {emp.departmentId?.name || 'General'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {item.status === 'approved' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              Approved
                            </span>
                          ) : item.status === 'rejected' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Missed Punch Date Banner */}
                      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Missed Punch Date:
                        </span>
                        <strong className="text-slate-900 dark:text-white">
                          {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>

                      {/* Requested Timings Dual Box */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between h-[60px]">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase">
                            <span>Requested In</span>
                            <LogIn className="w-3 h-3 text-emerald-500" />
                          </div>
                          <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                            {item.requestedCheckIn ? new Date(item.requestedCheckIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between h-[60px]">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase">
                            <span>Requested Out</span>
                            <LogOut className="w-3 h-3 text-rose-400" />
                          </div>
                          <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                            {item.requestedCheckOut ? new Date(item.requestedCheckOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Reason Callout */}
                      <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 text-xs">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Applicant Reason</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          "{item.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Audit / Decision Footer */}
                    <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {item.decisionBy ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              {item.decisionBy.name}
                            </span>
                            <span>{new Date(item.decisionAt || item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          {item.decisionNotes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              Notes: "{item.decisionNotes}"
                            </div>
                          )}
                        </div>
                      ) : can('attendance.approve') ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">
                            Applied: {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedCorrectionForReview(item);
                                setIsCorrectionReviewModalOpen(true);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <span>Review & Decide</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Awaiting review</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Team Attendance History Matrix (Matches Screenshot & Project Theme) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                placeholder="Search employee by name, department..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              />
            </div>
            <button
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
              title="Filter Team Attendance"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Month Navigator Strip */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevHistoryMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
                {new Date(`${historyMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextHistoryMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type="month"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
                className="opacity-0 w-8 h-8 absolute inset-0 cursor-pointer z-10"
                id="team-history-month-picker"
              />
              <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Key / Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 px-2 py-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-800 dark:text-slate-200">Key:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-transparent" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Late</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Weekly Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Rest-Day OT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 opacity-60" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Upcoming</span>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400 italic font-sans">
              {new Date(`${historyMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Main Attendance Matrix Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {isHistoryLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
                <div className="text-sm font-medium">Loading team attendance history...</div>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">
                No team attendance records found matching query for {historyMonth}.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      {/* Fixed Left Header: EMPLOYEE */}
                      <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/95 py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider min-w-[210px] max-w-[230px] border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        EMPLOYEE
                      </th>

                      {/* Day Columns (1..daysInMonth) */}
                      {Array.from({ length: historyDaysCount }, (_, idx) => {
                        const day = idx + 1;
                        const dayDate = new Date(historyYear, historyMonthNum - 1, day);
                        const dayShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        return (
                          <th
                            key={day}
                            className="py-2.5 px-1 min-w-[68px] max-w-[68px] text-center border-r border-slate-100 dark:border-slate-800/60"
                          >
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{day}</div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{dayShort}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {historyItems.map((item) => {
                      const emp = item.employee;
                      const empInitials = emp.name
                        ? emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'EM';

                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Fixed Left Employee Column */}
                          <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-3 px-4 min-w-[210px] max-w-[230px] border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-2.5">
                              {emp.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={emp.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {empInitials}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white truncate text-xs" title={emp.name}>
                                    {emp.name}
                                  </span>
                                  {emp.role === 'Super Admin' || emp.employeeCode === 'EMP-000' ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                      <ShieldCheck className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                                      Admin
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={`${emp.designation} · ${emp.department}`}>
                                  {emp.designation} · {emp.department}
                                </div>
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mt-0.5">
                                  {emp.offLabel || 'Sun Off'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Day Cells (1..daysInMonth) */}
                          {Array.from({ length: historyDaysCount }, (_, idx) => {
                            const day = idx + 1;
                            const dateKey = `${historyYear}-${String(historyMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const rec = item.records?.[dateKey];

                            const checkInTime = rec?.checkIn
                              ? new Date(rec.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : '--';
                            const checkOutTime = rec?.checkOut
                              ? new Date(rec.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : '--';

                            return (
                              <td
                                key={dateKey}
                                className="py-2 px-1 min-w-[68px] max-w-[68px] text-center border-r border-slate-100 dark:border-slate-800/60 align-middle"
                              >
                                <div className="w-full h-[62px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1 flex flex-col justify-between items-center transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                  {rec?.isWeeklyOff ? (
                                    <div className="h-full flex items-center justify-center">
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-orange-600 dark:text-orange-300 border border-orange-300/80 dark:border-orange-800/60 bg-orange-50/70 dark:bg-orange-950/30">
                                        OFF
                                      </span>
                                    </div>
                                  ) : rec?.isUpcoming ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                      <span className="text-[10px] text-slate-400 font-medium">--</span>
                                    </div>
                                  ) : rec?.status === 'present' ? (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5">
                                        <span className="text-emerald-600 font-bold">▲ {checkInTime}</span>
                                        <span className="text-rose-600 font-bold">▼ {checkOutTime}</span>
                                      </div>
                                      <span className={`text-[10px] font-semibold flex items-center gap-0.5 leading-none ${rec?.flags?.includes('wfh') || rec?.source === 'wfh' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-emerald-600'}`}>
                                        {rec?.flags?.includes('wfh') || rec?.source === 'wfh' ? '🏠 WFH' : '✓ Present'}
                                      </span>
                                    </>
                                  ) : rec?.status === 'late' || rec?.isLate ? (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5">
                                        <span className="text-amber-600 font-bold">▲ {checkInTime}</span>
                                        <span className="text-rose-600 font-bold">▼ {checkOutTime}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5 leading-none">
                                        ⏰ Late
                                      </span>
                                    </>
                                  ) : rec?.status === 'half_day' ? (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5">
                                        <span className="text-purple-600 font-bold">▲ {checkInTime}</span>
                                        <span className="text-rose-600 font-bold">▼ {checkOutTime}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-purple-600 flex items-center gap-0.5 leading-none">
                                        ½ Half Day
                                      </span>
                                    </>
                                  ) : rec?.status === 'on_leave' || rec?.status === 'holiday' ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                      <span className="text-[10px] font-semibold text-sky-600 flex items-center gap-0.5">
                                        ✈ Leave
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5 text-slate-400">
                                        <span className="text-emerald-600/40 font-bold">▲ --</span>
                                        <span className="text-rose-500/40 font-bold">▼ --</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 leading-none">
                                        ✕ Absent
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Pagination Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Showing {historyTotal > 0 ? (historyPage - 1) * 10 + 1 : 0} to{' '}
                {Math.min(historyPage * 10, historyTotal)} of {historyTotal} entries
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage <= 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: historyPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setHistoryPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                      historyPage === p
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setHistoryPage((p) => Math.min(historyPages, p + 1))}
                  disabled={historyPage >= historyPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditAttendanceModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        attendance={selectedAttendanceForEdit}
        onSuccess={refetchTeam}
      />

      {/* Export Modal */}
      <ExportAttendanceModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* Decision Confirmation Modal */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                {decisionModal.decision === 'approved' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {decisionModal.decision} {decisionModal.type === 'wfh' ? 'WFH Request' : 'Punch Correction'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {decisionModal.applicantName} · {decisionModal.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModal((p) => ({ ...p, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {decisionModal.decision === 'rejected' ? 'Rejection Reason (Required)' : 'Review Notes / Remarks (Optional)'}
              </label>
              <textarea
                rows={3}
                value={decisionModal.reasonOrNotes}
                onChange={(e) => setDecisionModal((p) => ({ ...p, reasonOrNotes: e.target.value }))}
                placeholder={decisionModal.decision === 'rejected' ? 'Explain reason for rejection...' : 'Add any notes for the employee...'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModal((p) => ({ ...p, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={isDecidingWFH || isDecidingCorrection || (decisionModal.decision === 'rejected' && !decisionModal.reasonOrNotes.trim())}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  decisionModal.decision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {(isDecidingWFH || isDecidingCorrection) ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {decisionModal.decision === 'approved' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Confirm {decisionModal.decision === 'approved' ? 'Approval' : 'Rejection'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Punch Correction Review & Decision Modal */}
      <PunchCorrectionReviewModal
        isOpen={isCorrectionReviewModalOpen}
        onClose={() => {
          setIsCorrectionReviewModalOpen(false);
          setSelectedCorrectionForReview(null);
        }}
        correctionId={selectedCorrectionForReview?._id}
        fallbackData={selectedCorrectionForReview}
        onSuccess={() => {
          refetchCorrections();
          refetchTeam();
        }}
      />

      {/* Detailed WFH Review & Decision Modal */}
      <WFHReviewModal
        isOpen={isWFHReviewModalOpen}
        onClose={() => {
          setIsWFHReviewModalOpen(false);
          setSelectedWFHForReview(null);
        }}
        requestId={selectedWFHForReview?._id}
        fallbackData={selectedWFHForReview}
        onSuccess={() => {
          refetchWFH();
          refetchTeam();
        }}
      />
    </div>
  );
};
