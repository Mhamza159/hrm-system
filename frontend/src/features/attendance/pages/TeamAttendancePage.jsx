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
  Laptop,
  FileSpreadsheet,
  Edit,
  Coffee,
  AlertCircle
} from 'lucide-react';
import {
  useGetTeamAttendanceQuery,
  useGetTeamWFHRequestsQuery,
  useDecideWFHMutation,
  useGetTeamCorrectionsQuery,
  useDecideCorrectionMutation
} from '../attendanceApi.js';
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge.jsx';
import { EditAttendanceModal } from '../components/EditAttendanceModal.jsx';
import { ExportAttendanceModal } from '../components/ExportAttendanceModal.jsx';
import { getSocket } from '../../notifications/hooks/useSocket.js';

export const TeamAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'wfh' | 'corrections'
  const [statusFilter, setStatusFilter] = useState('all');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAttendanceForEdit, setSelectedAttendanceForEdit] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Queries
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useGetTeamAttendanceQuery({
    date: selectedDate
  });

  const { data: wfhData, refetch: refetchWFH } = useGetTeamWFHRequestsQuery(undefined, {
    skip: activeTab !== 'wfh'
  });

  const { data: correctionsData, refetch: refetchCorrections } = useGetTeamCorrectionsQuery(undefined, {
    skip: activeTab !== 'corrections'
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

  const filteredMembers = teamMembers.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'online') return item.presence === 'online';
    if (statusFilter === 'break') return item.presence === 'on_break';
    if (statusFilter === 'clocked_out') return item.presence === 'clocked_out';
    if (statusFilter === 'absent') return item.presence === 'absent';
    return true;
  });

  const handleDecideWFH = async (id, decision) => {
    try {
      await decideWFH({ id, decision }).unwrap();
      refetchWFH();
      refetchTeam();
    } catch (err) {
      alert(err.data?.message || err.message || 'Action failed');
    }
  };

  const handleDecideCorrection = async (id, decision) => {
    try {
      await decideCorrection({ id, decision }).unwrap();
      refetchCorrections();
      refetchTeam();
    } catch (err) {
      alert(err.data?.message || err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
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
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Timesheets</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Team Presence Grid
          </button>
          <button
            onClick={() => setActiveTab('wfh')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'wfh'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>WFH Requests</span>
            {wfhRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 rounded-full text-xs">
                {wfhRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'corrections'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Punch Corrections</span>
            {corrections.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 rounded-full text-xs">
                {corrections.length}
              </span>
            )}
          </button>
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
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((item) => {
                const emp = item.employee;
                const att = item.attendance;
                const presence = item.presence;

                return (
                  <div
                    key={emp._id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                              {emp.firstName?.[0]}
                              {emp.lastName?.[0]}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                                presence === 'online'
                                  ? 'bg-emerald-500'
                                  : presence === 'on_break'
                                  ? 'bg-amber-500 animate-ping'
                                  : presence === 'clocked_out'
                                  ? 'bg-slate-400'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {emp.designation} • {emp.department}
                            </div>
                          </div>
                        </div>

                        {att?.status && <AttendanceStatusBadge status={att.status} />}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Clock In:</span>{' '}
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                            {att?.checkIn
                              ? new Date(att.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Clock Out:</span>{' '}
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                            {att?.checkOut
                              ? new Date(att.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                              : '-'}
                          </span>
                        </div>
                        {att?.workDurationMinutes > 0 && (
                          <div className="col-span-2 text-slate-500 dark:text-slate-400">
                            Worked:{' '}
                            <strong className="text-slate-800 dark:text-slate-100">
                              {(att.workDurationMinutes / 60).toFixed(1)} hrs
                            </strong>{' '}
                            {att.totalBreakMinutes > 0 && `(${att.totalBreakMinutes} mins break)`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedAttendanceForEdit(att);
                          setEditModalOpen(true);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Punch</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: WFH Requests Queue */}
      {activeTab === 'wfh' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Pending Work-From-Home (WFH) Applications
          </h2>

          {wfhRequests.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">
              No pending WFH requests to review at this moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {wfhRequests.map((req) => (
                <div key={req._id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {req.employeeId?.firstName} {req.employeeId?.lastName} ({req.employeeId?.employeeCode})
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Target Date: <strong>{new Date(req.date).toLocaleDateString()}</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                      "{req.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecideWFH(req._id, 'rejected')}
                      disabled={isDecidingWFH}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecideWFH(req._id, 'approved')}
                      disabled={isDecidingWFH}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Punch Correction Requests Queue */}
      {activeTab === 'corrections' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Pending Missed-Punch Corrections
          </h2>

          {corrections.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">
              No pending punch correction requests at this moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {corrections.map((item) => (
                <div key={item._id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.employeeId?.firstName} {item.employeeId?.lastName} ({item.employeeId?.employeeCode})
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Date: <strong>{new Date(item.date).toLocaleDateString()}</strong> | In:{' '}
                      {item.requestedCheckIn ? new Date(item.requestedCheckIn).toLocaleTimeString() : '-'} | Out:{' '}
                      {item.requestedCheckOut ? new Date(item.requestedCheckOut).toLocaleTimeString() : '-'}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                      "{item.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecideCorrection(item._id, 'rejected')}
                      disabled={isDecidingCorrection}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecideCorrection(item._id, 'approved')}
                      disabled={isDecidingCorrection}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Approve & Correct
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};
