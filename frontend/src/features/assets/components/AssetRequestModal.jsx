/**
 * @file AssetRequestModal.jsx
 * @description Modal for Department Managers to requisition hardware/software for team subordinates.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.5)
 */

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useCreateAssetRequestMutation } from '../assetApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

const ASSET_TYPES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop PC' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'software_license', label: 'Software License' },
  { value: 'other', label: 'Other Equipment' }
];

export const AssetRequestModal = ({ isOpen, onClose }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [assetType, setAssetType] = useState('laptop');
  const [priority, setPriority] = useState('medium');
  const [specificationsRequired, setSpecificationsRequired] = useState('');
  const [justification, setJustification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: employeesRes } = useGetEmployeesQuery({ limit: 100, status: 'Active' });
  const employees = employeesRes?.data || [];

  const [createRequest, { isLoading }] = useCreateAssetRequestMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!employeeId) {
      setErrorMsg('Please select a team member.');
      return;
    }
    if (!justification.trim()) {
      setErrorMsg('Requisition justification is required.');
      return;
    }

    try {
      await createRequest({
        employeeId,
        assetType,
        priority,
        specificationsRequired: specificationsRequired.trim(),
        justification: justification.trim()
      }).unwrap();

      toast.success('Equipment requisition submitted to HR.');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit requisition.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2235]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Requisition Equipment</h3>
              <p className="text-xs text-slate-500">Request hardware/software for department member</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Team Member <span className="text-rose-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="">-- Select employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode}) {emp.departmentId?.name ? `· ${emp.departmentId.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Equipment Type
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Specifications
            </label>
            <input
              type="text"
              value={specificationsRequired}
              onChange={(e) => setSpecificationsRequired(e.target.value)}
              placeholder="e.g. 32GB RAM, 1TB SSD, Ubuntu compatibility"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this equipment is needed for project deliverables"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-all shadow-xs"
            >
              {isLoading ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetRequestModal;
