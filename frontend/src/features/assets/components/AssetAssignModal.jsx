/**
 * @file AssetAssignModal.jsx
 * @description Modal for assigning an available asset to an active employee custodian.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.2)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, UserCheck, Calendar, AlertCircle, Mail, Phone, Building2, Briefcase, Shield, CheckCircle2 } from 'lucide-react';
import { useAssignAssetMutation } from '../assetApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const AssetAssignModal = ({ isOpen, onClose, asset }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: employeesRes, isLoading: isLoadingEmps } = useGetEmployeesQuery({ limit: 100, status: 'Active' });
  const employees = employeesRes?.data?.items || (Array.isArray(employeesRes?.data) ? employeesRes.data : []);

  const [assignAsset, { isLoading }] = useAssignAssetMutation();

  if (!isOpen || !asset) return null;

  const selectedEmp = employees.find((e) => (e._id === employeeId || e.id === employeeId));
  const selectedEmpName = selectedEmp
    ? (selectedEmp.name || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim() || selectedEmp.employeeCode)
    : null;
  const deptName = selectedEmp?.departmentId?.name || selectedEmp?.departmentId?.code || selectedEmp?.department || null;
  const desigTitle = selectedEmp?.designationId?.title || selectedEmp?.designationId?.code || selectedEmp?.designation || null;
  const roleName = selectedEmp?.userId?.roles?.[0]?.name || selectedEmp?.role || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!employeeId) {
      setErrorMsg('Please select an employee custodian.');
      return;
    }

    try {
      await assignAsset({
        id: asset._id,
        employeeId,
        assignedDate,
        condition,
        notes: notes.trim()
      }).unwrap();

      toast.success(`Asset '${asset.assetTag}' assigned successfully.`);
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to assign asset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <UserCheck className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Assign Asset Custodian</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {asset.assetTag} · {asset.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Employee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Employee Custodian <span className="text-rose-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            >
              <option value="">-- Choose employee custodian --</option>
              {employees.map((emp) => {
                const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeCode;
                const desig = emp.designationId?.title || emp.designation || '';
                const dept = emp.departmentId?.name || emp.department || '';
                const role = emp.userId?.roles?.[0]?.name || '';
                const details = [desig, dept, role && role !== desig ? `Role: ${role}` : null].filter(Boolean).join(' · ');

                return (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {name} ({emp.employeeCode}){details ? ` · ${details}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Real-time Employee Preview Card with Complete Details (Designation, Role, Department) */}
          {selectedEmp && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-[#1A3125] bg-emerald-50/40 dark:bg-[#162820]/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  {selectedEmp.avatar ? (
                    <img
                      src={selectedEmp.avatar}
                      alt={selectedEmpName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] font-bold text-sm flex items-center justify-center border-2 border-emerald-500/40">
                      {(selectedEmpName?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00C471] ring-2 ring-white dark:ring-[#111D17] flex items-center justify-center text-white text-[8px]">
                    ✓
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      {selectedEmpName}
                    </p>
                    {selectedEmp.employeeCode && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] font-semibold border border-emerald-200 dark:border-[#1A3125]">
                        {selectedEmp.employeeCode}
                      </span>
                    )}
                    {roleName && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-medium">
                        <Shield className="w-2.5 h-2.5 text-amber-500" />
                        {roleName}
                      </span>
                    )}
                  </div>

                  {/* Designation & Department Pills */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 flex-wrap pt-0.5">
                    {desigTitle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] font-medium text-slate-800 dark:text-slate-200">
                        <Briefcase className="w-3 h-3 text-[#00C471]" />
                        {desigTitle}
                      </span>
                    )}
                    {deptName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400">
                        <Building2 className="w-3 h-3 text-blue-500" />
                        {deptName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(selectedEmp.email || selectedEmp.phone) && (
                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-100 dark:border-[#1A3125] flex-wrap">
                  {selectedEmp.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{selectedEmp.email}</span>
                    </span>
                  )}
                  {selectedEmp.phone && (
                    <span className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedEmp.phone}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dates & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Handover Date
              </label>
              <input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Handover Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="new">Brand New</option>
                <option value="good">Good Condition</option>
                <option value="fair">Fair (Normal Wear)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Handover Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over with charger, laptop sleeve, and security lock."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162820] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-emerald-500/20"
            >
              {isLoading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetAssignModal;
