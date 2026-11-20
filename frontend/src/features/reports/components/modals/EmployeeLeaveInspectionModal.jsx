/**
 * @file EmployeeLeaveInspectionModal.jsx
 * @description Deep Ledger Inspection Modal for Individual Employee Leave History & Quotas.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React from 'react';
import { X, User } from 'lucide-react';
import { useGetReportInspectionQuery } from '../../reportsApi.js';

export const EmployeeLeaveInspectionModal = ({ isOpen, onClose, employeeId }) => {
  const { data: response, isLoading } = useGetReportInspectionQuery(
    { type: 'leave', employeeId },
    { skip: !isOpen || !employeeId }
  );

  if (!isOpen) return null;

  const data = response?.data || {};
  const employee = data.employee || {};
  const balances = data.balances || [];
  const applications = data.applications || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
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
                  {employee.name || 'Leave Utilization Ledger'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading leave ledger...</div>
          ) : (
            <>
              {/* Category Quota Cards */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Annual Leave Quotas & Balances
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {balances.length === 0 ? (
                    <div className="col-span-4 p-4 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                      Standard organizational leave quotas apply.
                    </div>
                  ) : (
                    balances.map((b) => {
                      const typeName = b.leaveTypeId?.name || 'Leave';
                      const allocated = b.allocatedDays || 0;
                      const used = b.usedDays || 0;
                      const remaining = Math.max(0, allocated - used);

                      return (
                        <div
                          key={b.leaveTypeId?._id || typeName}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate block">
                            {typeName}
                          </span>
                          <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                            {remaining} <span className="text-xs font-normal text-slate-400">/ {allocated}d</span>
                          </p>
                          <span className="text-[10px] text-slate-400 block">{used} days utilized</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Historical Applications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Leave Applications History ({applications.length})
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 dark:bg-[#061A14] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#1A3125]">
                      <tr>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Start Date</th>
                        <th className="py-2.5 px-3">End Date</th>
                        <th className="py-2.5 px-3">Days</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/60">
                      {applications.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                            No leave applications submitted by this employee.
                          </td>
                        </tr>
                      ) : (
                        applications.map((app) => (
                          <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/30 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{app.leaveType}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{app.startDate}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{app.endDate}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{app.totalDays}d</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  app.status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-[#00C471]'
                                    : app.status === 'PENDING'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={app.reason}>
                              {app.reason}
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

        {/* Footer */}
        <div className="flex items-center justify-end p-4 px-6 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#061A14]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveInspectionModal;
