/**
 * @file ProfileHistoryTab.jsx
 * @description Career & Promotional Milestone Timeline Component.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.5, 3.10)
 * - Chronological vertical timeline for promotions, transfers, and designation updates.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  Award,
  Building2,
  Calendar,
  Plus,
  Loader2,
  X
} from 'lucide-react';

import {
  useGetJobHistoryQuery,
  useRecordJobHistoryMutation
} from '../employeesApi.js';
import {
  useGetDepartmentsQuery,
  useGetDesignationsQuery
} from '../../departments/departmentsApi.js';
import { Card } from '../../../components/common/Card.jsx';
import { formatDate } from '../../../lib/formatters.js';

export function ProfileHistoryTab({ employeeId, canManage = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventType, setEventType] = useState('Promotion');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newDesignationId, setNewDesignationId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');

  const { data: historyData, isLoading } = useGetJobHistoryQuery(employeeId);
  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: desigData } = useGetDesignationsQuery({ limit: 100 });
  const [recordJobHistory, { isLoading: isRecording }] = useRecordJobHistoryMutation();

  const history = historyData?.data || [];
  const departments = deptData?.data || [];
  const designations = desigData?.data || [];

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordJobHistory({
        id: employeeId,
        eventType,
        newDepartmentId: newDepartmentId || null,
        newDesignationId: newDesignationId || null,
        effectiveDate,
        remarks: remarks.trim()
      }).unwrap();
      toast.success('Career milestone recorded successfully');
      setIsModalOpen(false);
      setRemarks('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record career milestone');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Career & Promotion Timeline</h3>
          <p className="text-xs text-slate-500">
            Chronological log of grade promotions, designation changes, and inter-departmental transfers.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Record Career Milestone
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : history.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-medium">No historical promotions or transfers recorded for this employee.</p>
        </Card>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200">
          {history.map((item) => (
            <div key={item._id} className="relative flex items-start gap-4">
              <div className="absolute -left-6 mt-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-xs" />
              <Card className="flex-1 p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {item.eventType}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(item.effectiveDate)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                  {item.newDesignationId && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Designation: <strong>{item.newDesignationId.title}</strong>{' '}
                        {item.newDesignationId.grade && `(${item.newDesignationId.grade})`}
                      </span>
                    </div>
                  )}

                  {item.newDepartmentId && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Department: <strong>{item.newDepartmentId.name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {item.remarks && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-3 italic">
                    "{item.remarks}"
                  </p>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Record Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Career Milestone</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Milestone Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                >
                  <option value="Promotion">Promotion</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Designation Change">Designation Change</option>
                  <option value="Salary Revision">Salary Revision</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Designation</label>
                <select
                  value={newDesignationId}
                  onChange={(e) => setNewDesignationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                >
                  <option value="">-- Keep Current / None --</option>
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} [{d.grade}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Department</label>
                <select
                  value={newDepartmentId}
                  onChange={(e) => setNewDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                >
                  <option value="">-- Keep Current / None --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks & Justification</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Promoted to Senior QA Lead following stellar Q3 performance."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording}
                  className="px-5 py-2 rounded-lg font-semibold bg-[#00C471] hover:bg-[#049856] text-white flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
