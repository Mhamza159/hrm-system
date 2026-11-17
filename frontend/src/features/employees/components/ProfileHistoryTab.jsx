/**
 * @file ProfileHistoryTab.jsx
 * @description Career & Promotional Milestone Timeline Component.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.5, 3.10)
 * - Chronological vertical timeline for promotions, transfers, and designation updates.
 * - Forest & Emerald Enterprise theme craft.
 */

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  Award,
  Building2,
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
  const [effectiveDate, setEffectiveDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [remarks, setRemarks] = useState('');

  const { data: historyData, isLoading } = useGetJobHistoryQuery(employeeId);
  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: desigData } = useGetDesignationsQuery({ limit: 100 });
  const [recordJobHistory, { isLoading: isRecording }] = useRecordJobHistoryMutation();

  const history = historyData?.data || [];
  const departments = deptData?.data || [];
  const filteredDesignations = useMemo(() => {
    const list = desigData?.data || [];
    if (!newDepartmentId) return list;
    return list.filter((d) => {
      const deptId = d.departmentId?._id || d.departmentId;
      return deptId === newDepartmentId;
    });
  }, [desigData?.data, newDepartmentId]);

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
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Career & Promotion Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological log of grade promotions, designation changes, and inter-departmental transfers.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Record Career Milestone
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
        </div>
      ) : history.length === 0 ? (
        <Card className="p-8 text-center text-slate-400 dark:text-slate-500 border-slate-200 dark:border-[#1A3125]">
          <TrendingUp className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
          <p className="text-xs font-medium">No historical promotions or transfers recorded for this employee.</p>
        </Card>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-[#1A3125]">
          {history.map((item) => (
            <div key={item._id} className="relative flex items-start gap-4">
              <div className="absolute -left-6 mt-1.5 w-5 h-5 rounded-full bg-[#00C471] border-4 border-white dark:border-[#111D17] shadow-xs" />
              <Card className="flex-1 p-4 border-slate-200 dark:border-[#1A3125]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                    {item.eventType}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatDate(item.effectiveDate)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                  {item.newDesignationId && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Designation: <strong className="text-slate-900 dark:text-white">{item.newDesignationId.title}</strong>{' '}
                        {item.newDesignationId.grade && `(${item.newDesignationId.grade})`}
                      </span>
                    </div>
                  )}

                  {item.newDepartmentId && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Department: <strong className="text-slate-900 dark:text-white">{item.newDepartmentId.name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {item.remarks && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0A110D] p-2.5 rounded-xl border border-slate-100 dark:border-[#1A3125] mt-3 italic">
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
          <div className="bg-white dark:bg-[#111D17] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Career Milestone</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Milestone Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                >
                  <option value="Promotion">Promotion</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Designation Change">Designation Change</option>
                  <option value="Salary Revision">Salary Revision</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Department</label>
                <select
                  value={newDepartmentId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewDepartmentId(val);
                    if (val && newDesignationId) {
                      const match = rawDesignations.find((d) => d._id === newDesignationId);
                      const matchDeptId = match?.departmentId?._id || match?.departmentId;
                      if (matchDeptId !== val) {
                        setNewDesignationId('');
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Designation</label>
                <select
                  value={newDesignationId}
                  onChange={(e) => setNewDesignationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                >
                  <option value="">-- Keep Current / None --</option>
                  {filteredDesignations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} [{d.grade}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks & Justification</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Promoted to Senior QA Lead following stellar Q3 performance."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#15241C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording}
                  className="px-5 py-2 rounded-xl font-semibold bg-[#00C471] hover:bg-[#00ad64] text-white flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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
