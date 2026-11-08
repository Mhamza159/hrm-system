/**
 * @file InterviewScheduleModal.jsx
 * @description Interview Round Scheduling Modal with Panel Assignment (Module M15 / Row 15.8).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.8)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useScheduleInterviewMutation } from '../recruitmentApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const InterviewScheduleModal = ({ isOpen, onClose, candidate }) => {
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundType, setRoundType] = useState('Technical');
  const [scheduledDate, setScheduledDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedInterviewers, setSelectedInterviewers] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: empsRes } = useGetEmployeesQuery({ limit: 100, status: 'Active' });
  const [scheduleInterview, { isLoading }] = useScheduleInterviewMutation();

  const employees = empsRes?.data?.items || (Array.isArray(empsRes?.data) ? empsRes.data : []);

  if (!isOpen || !candidate) return null;

  const handleInterviewerToggle = (empId) => {
    setSelectedInterviewers((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!scheduledDate) {
      setErrorMsg('Please select interview date and time.');
      return;
    }

    if (selectedInterviewers.length === 0) {
      setErrorMsg('Please select at least one panel interviewer.');
      return;
    }

    try {
      await scheduleInterview({
        candidateId: candidate._id,
        roundNumber: Number(roundNumber),
        roundType,
        scheduledDate: new Date(scheduledDate).toISOString(),
        durationMinutes: Number(durationMinutes),
        meetingLink: meetingLink.trim(),
        interviewers: selectedInterviewers
      }).unwrap();

      toast.success(`Round ${roundNumber} interview scheduled successfully.`);
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to schedule interview.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <Calendar className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Schedule Interview Round</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidate: <span className="font-semibold text-slate-700 dark:text-slate-200">{candidate.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Round Number
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Round Type
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="Screening">Screening / HR</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural Fit</option>
                <option value="Executive">Executive / Final</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="15"
                max="180"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Meeting Video Link (Google Meet / Zoom)
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/xyz-abc"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          {/* Panel Interviewers Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assign Panel Interviewers ({selectedInterviewers.length} selected) <span className="text-rose-500">*</span>
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-[#1A3125] rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-[#162820]/40">
              {employees.map((emp) => {
                const isChecked = selectedInterviewers.includes(emp._id);
                return (
                  <label
                    key={emp._id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-[#111D17] border border-emerald-200 dark:border-[#1A3125] text-emerald-900 dark:text-[#00C471]'
                        : 'hover:bg-slate-100 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{emp.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {emp.designationId?.title || emp.designation || 'Staff'} • {emp.departmentId?.name || ''}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleInterviewerToggle(emp._id)}
                      className="accent-[#00C471] w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Booking...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

