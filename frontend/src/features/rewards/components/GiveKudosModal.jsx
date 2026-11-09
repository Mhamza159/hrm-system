/**
 * @file GiveKudosModal.jsx
 * @description Modal for sending peer recognition kudos and badges (BUILD-GUIDE Row 20.2).
 */

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Heart, Star, Award, Zap, Lightbulb, Users, Target } from 'lucide-react';
import { useCreateKudosMutation } from '../rewardsApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

const BADGE_OPTIONS = [
  { name: 'Team Player', icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { name: 'Problem Solver', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { name: 'Customer Hero', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  { name: 'Innovation Champ', icon: Zap, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  { name: 'Leadership Star', icon: Star, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800' },
  { name: 'Above & Beyond', icon: Target, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { name: 'Rockstar', icon: Award, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' }
];

export const GiveKudosModal = ({ isOpen, onClose, currentUserId }) => {
  const [receiverId, setReceiverId] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('Team Player');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [formError, setFormError] = useState('');

  const { data: employeesRes, isLoading: isLoadingEmps } = useGetEmployeesQuery(
    { limit: 150, status: 'Active' },
    { skip: !isOpen }
  );

  const [createKudos, { isLoading: isSubmitting }] = useCreateKudosMutation();

  if (!isOpen) return null;

  const rawList = employeesRes?.data?.items || employeesRes?.data?.employees || employeesRes?.data || [];
  const employees = Array.isArray(rawList) ? rawList : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!receiverId) {
      setFormError('Please select a colleague to appreciate.');
      return;
    }

    if (!message || message.trim().length < 5) {
      setFormError('Appreciation message must be at least 5 characters.');
      return;
    }

    try {
      await createKudos({
        receiverId,
        badge: selectedBadge,
        message: message.trim(),
        isPublic
      }).unwrap();

      toast.success('Kudos posted to appreciation wall!');
      onClose();
      setReceiverId('');
      setMessage('');
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to post kudos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Send Peer Appreciation
              </h3>
              <p className="text-xs text-slate-500">Recognize and celebrate your colleague's great work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Colleague <span className="text-rose-500">*</span>
            </label>
            {isLoadingEmps ? (
              <div className="text-xs text-slate-400 py-2">Loading active colleagues...</div>
            ) : (
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">-- Choose colleague --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeCode || emp.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Badges Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Choose Recognition Badge <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BADGE_OPTIONS.map((badge) => {
                const IconComponent = badge.icon;
                const isSelected = selectedBadge === badge.name;
                return (
                  <button
                    key={badge.name}
                    type="button"
                    onClick={() => setSelectedBadge(badge.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${badge.color}`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate text-[11px] text-slate-800 dark:text-slate-200">
                      {badge.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Appreciation Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Thanks for your incredible troubleshooting during today's system migration!"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded text-primary border-slate-300 focus:ring-primary"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Post publicly on Appreciation Wall
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingEmps}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSubmitting ? 'Posting...' : 'Send Kudos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
