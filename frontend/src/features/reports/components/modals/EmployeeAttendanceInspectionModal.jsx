/**
 * @file EmployeeAttendanceInspectionModal.jsx
 * @description Deep Dossier Inspection Modal for Individual Employee Attendance Records.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React from 'react';
import { X, User } from 'lucide-react';
import { useGetReportInspectionQuery } from '../../reportsApi.js';

export const EmployeeAttendanceInspectionModal = ({ isOpen, onClose, employeeId, from, to }) => {
  const { data: response, isLoading } = useGetReportInspectionQuery(
    { type: 'attendance', employeeId, from, to },
    { skip: !isOpen || !employeeId }
  );

  if (!isOpen) return null;

  const data = response?.data || {};
  const employee = data.employee || {};
  const summary = data.summary || {};
  const punches = data.punches || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-sm shrink-0">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-11 h-11 rounded-2xl object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {employee.name || 'Employee Attendance Dossier'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#061A14] text-slate-500 border border-slate-200 dark:border-[#1A3125]">
                  {employee.employeeCode || 'EMP-N/A'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
                {employee.department} • {employee.designation}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading attendance dossier...</div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                  <p className="font-mono text-xl font-bold text-[#00C471]">{summary.punctualityRate || '0%'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Worked Hours</span>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">{summary.totalWorkHours || 0} hrs</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime</span>
                  <p className="font-mono text-xl font-bold text-blue-500">+{summary.totalOvertimeHours || 0} hrs</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lates / Absents</span>
                  <p className="font-mono text-xl font-bold text-amber-500">
                    {summary.lateDays || 0} <span className="text-slate-400 text-sm">/</span> {summary.absentDays || 0}
                  </p>
                </div>
              </div>

              {/* Punches Timeline Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Chronological Punch Ledger ({punches.length} records)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 dark:bg-[#061A14] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#1A3125]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Check In</th>
                        <th className="py-2.5 px-3">Check Out</th>
                        <th className="py-2.5 px-3">Work Duration</th>
                        <th className="py-2.5 px-3">Late Mins</th>
                        <th className="py-2.5 px-3">Overtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/60 font-mono">
                      {punches.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                            No attendance punches recorded for this employee.
                          </td>
                        </tr>
                      ) : (
                        punches.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/30 transition">
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">{p.date}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  p.status === 'PRESENT'
                                    ? 'bg-emerald-500/10 text-[#00C471]'
                                    : p.status === 'LATE'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : p.status === 'HALF_DAY'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.checkIn}</td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.checkOut}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.workHours} hrs</td>
                            <td className="py-2.5 px-3 text-amber-500">{p.lateMinutes ? `${p.lateMinutes}m` : '-'}</td>
                            <td className="py-2.5 px-3 text-[#00C471]">
                              {p.overtimeHours ? `+${p.overtimeHours} hrs` : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-4 px-6 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#061A14]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceInspectionModal;
