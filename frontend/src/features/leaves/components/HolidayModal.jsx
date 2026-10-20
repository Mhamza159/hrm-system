/**
 * @file HolidayModal.jsx
 * @description Dialog for adding or updating public and gazetted holidays.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.11)
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Moon, Sparkles } from 'lucide-react';
import {
  useCreateHolidayMutation,
  useUpdateHolidayMutation
} from '../leavesApi.js';

export function HolidayModal({ isOpen, onClose, holiday }) {
  const isEditMode = Boolean(holiday);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'gazetted',
    isLunar: false,
    description: '',
    isActive: true
  });

  const [errorMessage, setErrorMessage] = useState('');

  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (holiday) {
      const formattedDate = holiday.date ? new Date(holiday.date).toISOString().split('T')[0] : '';
      setFormData({
        name: holiday.name || '',
        date: formattedDate,
        type: holiday.type || 'gazetted',
        isLunar: holiday.isLunar ?? false,
        description: holiday.description || '',
        isActive: holiday.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        date: '',
        type: 'gazetted',
        isLunar: false,
        description: '',
        isActive: true
      });
    }
    setErrorMessage('');
  }, [holiday, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      if (isEditMode) {
        await updateHoliday({
          id: holiday._id,
          ...formData
        }).unwrap();
      } else {
        await createHoliday(formData).unwrap();
      }
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to save holiday');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F111A] border border-[#1E2235] rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2235] bg-[#141724]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">
              {isEditMode ? 'Edit Public Holiday' : 'Add Public Holiday'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Holiday Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Holiday Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Pakistan Day"
              className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Holiday Type & Lunar Flag */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="gazetted">Gazetted (Official)</option>
                <option value="optional">Optional / Cultural</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isLunar}
                  onChange={(e) => setFormData({ ...formData, isLunar: e.target.checked })}
                  className="w-4 h-4 rounded border-[#262B40] bg-[#161926] text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Lunar Holiday</span>
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Subject to moon sighting by Ruet-e-Hilal Committee"
              className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[#262B40] bg-[#161926] text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">Active (Deducted from leave calculations)</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Holiday' : 'Create Holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
