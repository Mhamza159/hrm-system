/**
 * @file ShiftAssignModal.jsx
 * @description Dedicated modal for managing employee roster assignments to a work shift.
 * Supports viewing current assigned roster, unassigning staff, and multi-selecting employees to assign
 * with capacity limit validation and instant updates.
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  UserMinus,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check
} from 'lucide-react';
import {
  useGetShiftEmployeesQuery,
  useAssignEmployeesToShiftMutation,
  useGetHeadCandidatesQuery
} from '../departmentsApi.js';

export function ShiftAssignModal({
  isOpen,
  onClose,
  shift = null
}) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'add'
  const [candidateSearch, setCandidateSearch] = useState('');
  const [currentRosterSearch, setCurrentRosterSearch] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch currently assigned staff for this shift
  const {
    data: employeesResponse,
    isLoading: isStaffLoading,
    refetch: refetchStaff
  } = useGetShiftEmployeesQuery(
    shift ? { id: shift._id, params: { limit: 100, search: currentRosterSearch } } : null,
    { skip: !shift || !isOpen }
  );

  const assignedEmployees = employeesResponse?.data || [];
  const totalAssigned = employeesResponse?.meta?.total ?? assignedEmployees.length;

  // Fetch available employee candidates
  const {
    data: candidatesResponse,
    isLoading: isCandidatesLoading
  } = useGetHeadCandidatesQuery(
    candidateSearch.trim() ? { search: candidateSearch.trim() } : undefined,
    { skip: !isOpen || activeTab !== 'add' }
  );

  const allCandidates = candidatesResponse?.data || [];
  // Filter out candidates already assigned to this shift
  const availableCandidates = allCandidates.filter(
    (cand) => !assignedEmployees.some((emp) => String(emp._id) === String(cand._id))
  );

  const [assignEmployees, { isLoading: isAssigning }] = useAssignEmployeesToShiftMutation();

  if (!isOpen || !shift) return null;

  const capacity = shift.capacity || 0;
  const remainingCapacity = capacity > 0 ? Math.max(0, capacity - totalAssigned) : Infinity;

  const toggleSelectCandidate = (candId) => {
    setErrorMessage('');
    if (selectedCandidates.includes(candId)) {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candId));
    } else {
      if (capacity > 0 && selectedCandidates.length >= remainingCapacity) {
        setErrorMessage(`Cannot select more than ${remainingCapacity} employee(s). Shift capacity limit reached (${capacity}).`);
        return;
      }
      setSelectedCandidates([...selectedCandidates, candId]);
    }
  };

  const handleAssignSelected = async () => {
    if (selectedCandidates.length === 0) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await assignEmployees({
        id: shift._id,
        employeeIds: selectedCandidates,
        action: 'add'
      }).unwrap();

      setSuccessMessage(`Successfully assigned ${selectedCandidates.length} employee(s) to '${shift.name}'.`);
      setSelectedCandidates([]);
      refetchStaff();
      setActiveTab('current');
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to assign employees.');
    }
  };

  const handleRemoveEmployee = async (employeeId, employeeName) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await assignEmployees({
        id: shift._id,
        employeeIds: [employeeId],
        action: 'remove'
      }).unwrap();

      setSuccessMessage(`Removed '${employeeName}' from '${shift.name}'.`);
      refetchStaff();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to remove employee.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Roster Staff for {shift.name}
                </h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  {shift.code}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <span>{shift.startTime} → {shift.endTime}</span>
                <span>•</span>
                <span>{totalAssigned} assigned</span>
                {capacity > 0 && (
                  <>
                    <span>•</span>
                    <span>Cap: {capacity} ({remainingCapacity} left)</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/50">
          <button
            type="button"
            onClick={() => { setActiveTab('current'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'current'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Currently Assigned ({totalAssigned})</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('add'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'add'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign New Staff</span>
            {selectedCandidates.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00C471] text-white text-[10px] flex items-center justify-center font-bold">
                {selectedCandidates.length}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alerts */}
        <div className="px-6 pt-3">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 text-xs mb-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-[#00C471] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 text-xs mb-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-1 overflow-y-auto flex-1 max-h-[60vh]">
          {activeTab === 'current' ? (
            /* TAB 1: Currently Assigned Staff */
            <div>
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={currentRosterSearch}
                  onChange={(e) => setCurrentRosterSearch(e.target.value)}
                  placeholder="Filter rostered employees by name, code, or email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471]"
                />
              </div>

              {isStaffLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00C471]" />
                  Loading assigned roster...
                </div>
              ) : assignedEmployees.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl p-6">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No employees currently assigned to this shift.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click &ldquo;Assign New Staff&rdquo; above to roster personnel to this shift.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1A3125] border border-slate-200/80 dark:border-[#1A3125] rounded-xl overflow-hidden">
                  {assignedEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#162720]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-[#00C471] flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {emp.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono text-slate-500">{emp.employeeCode}</span>
                            <span>•</span>
                            <span className="truncate">{emp.designationId?.title || 'No Title'}</span>
                            {emp.departmentId && (
                              <>
                                <span>•</span>
                                <span className="truncate">{emp.departmentId.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(emp._id, emp.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors shrink-0"
                        title="Remove from shift"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Assign New Staff */
            <div>
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search available personnel to assign..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471]"
                />
              </div>

              {isCandidatesLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00C471]" />
                  Loading available personnel...
                </div>
              ) : availableCandidates.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl p-6">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No available personnel found.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    All matching employees are already assigned to this shift or no employees match your search query.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1A3125] border border-slate-200/80 dark:border-[#1A3125] rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
                  {availableCandidates.map((cand) => {
                    const isSelected = selectedCandidates.includes(cand._id);
                    return (
                      <div
                        key={cand._id}
                        onClick={() => toggleSelectCandidate(cand._id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-[#162720]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#00C471] border-[#00C471] text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          {cand.avatar ? (
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {cand.name?.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {cand.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-500">{cand.employeeCode}</span>
                              <span>•</span>
                              <span className="truncate">{cand.designation || 'Staff'}</span>
                              {cand.department && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{cand.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {cand.currentShift && (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50 shrink-0">
                            Current: {cand.currentShift}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1712]/30">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'add' && selectedCandidates.length > 0 && (
              <span><strong>{selectedCandidates.length}</strong> employee(s) selected</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            {activeTab === 'add' && (
              <button
                type="button"
                disabled={selectedCandidates.length === 0 || isAssigning}
                onClick={handleAssignSelected}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00B065] disabled:opacity-50 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Assign {selectedCandidates.length > 0 ? `(${selectedCandidates.length})` : ''} to Shift</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShiftAssignModal;
