/**
 * @file PeerFeedbackModal.jsx
 * @description Modal for requesting 360-degree peer feedback and submitting confidential peer evaluations.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.6)
 */

import React, { useState } from 'react';
import { X, Users, MessageSquare, Star, Send } from 'lucide-react';
import { useRequestPeerFeedbackMutation } from '../performanceApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const PeerFeedbackModal = ({ isOpen, onClose, reviewId }) => {
  const [requestPeerFeedback, { isLoading }] = useRequestPeerFeedbackMutation();
  const { data: empData } = useGetEmployeesQuery({ limit: 100 });
  const employees = empData?.data?.employees || empData?.data || [];

  const [selectedPeer, setSelectedPeer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPeer) {
      toast.error('Please select an employee to request peer review');
      return;
    }

    try {
      await requestPeerFeedback({
        id: reviewId,
        peerEmployeeId: selectedPeer
      }).unwrap();
      toast.success('360° peer feedback request sent successfully');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to request peer feedback');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Request 360° Peer Feedback
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Nominate a colleague to provide confidential 360-degree feedback on collaboration, communication, and technical delivery.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Select Peer Employee *
            </label>
            <select
              required
              value={selectedPeer}
              onChange={(e) => setSelectedPeer(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a colleague...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.designation?.title || emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Requesting...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

