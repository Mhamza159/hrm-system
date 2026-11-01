/**
 * @file KpiTemplateModal.jsx
 * @description Modal for authoring and editing designation-wise KPI master templates with 100% weightage validation.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.1)
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Target, Percent, AlertCircle } from 'lucide-react';
import { useCreateKpiTemplateMutation, useUpdateKpiTemplateMutation } from '../performanceApi.js';
import { useGetDesignationsQuery } from '../../departments/departmentsApi.js';
import { toast } from 'sonner';

export const KpiTemplateModal = ({ isOpen, onClose, template }) => {
  const [createTemplate, { isLoading: isCreating }] = useCreateKpiTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateKpiTemplateMutation();
  const { data: desigData } = useGetDesignationsQuery();
  const designations = desigData?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    designationId: '',
    description: '',
    isActive: true,
    kpis: []
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        designationId: template.designationId?._id || template.designationId || '',
        description: template.description || '',
        isActive: template.isActive ?? true,
        kpis: template.kpis?.map((k) => ({
          title: k.title || '',
          description: k.description || '',
          weightage: k.weightage ?? 0,
          targetCriteria: k.targetCriteria || ''
        })) || []
      });
    } else {
      setFormData({
        name: '',
        designationId: designations[0]?._id || '',
        description: '',
        isActive: true,
        kpis: [
          {
            title: 'Code Quality & Test Coverage',
            description: 'Maintain clean architecture, PR reviews, and unit test coverage >= 80%.',
            weightage: 40,
            targetCriteria: 'Zero critical bugs in production; 80%+ test coverage'
          },
          {
            title: 'Feature Delivery On Time',
            description: 'Complete sprint tickets within estimated story points and deadlines.',
            weightage: 35,
            targetCriteria: '>= 90% sprint commitments delivered per sprint cycle'
          },
          {
            title: 'Team Mentorship & Collaboration',
            description: 'Active participation in design reviews and helping junior engineers.',
            weightage: 25,
            targetCriteria: 'Positive peer feedback score >= 4.0/5'
          }
        ]
      });
    }
  }, [template, isOpen, designations]);

  if (!isOpen) return null;

  const totalWeightage = formData.kpis.reduce((sum, item) => sum + (Number(item.weightage) || 0), 0);
  const isWeightValid = totalWeightage === 100;

  const handleAddKpi = () => {
    setFormData({
      ...formData,
      kpis: [
        ...formData.kpis,
        {
          title: '',
          description: '',
          weightage: 10,
          targetCriteria: ''
        }
      ]
    });
  };

  const handleRemoveKpi = (index) => {
    setFormData({
      ...formData,
      kpis: formData.kpis.filter((_, i) => i !== index)
    });
  };

  const handleKpiChange = (index, field, value) => {
    const updated = [...formData.kpis];
    updated[index][field] = field === 'weightage' ? (parseInt(value, 10) || 0) : value;
    setFormData({ ...formData, kpis: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!formData.designationId) {
      toast.error('Please select a designation');
      return;
    }
    if (formData.kpis.length === 0) {
      toast.error('Please add at least one KPI item');
      return;
    }
    if (!isWeightValid) {
      toast.error(`Total weightage must equal 100% (currently ${totalWeightage}%)`);
      return;
    }

    try {
      if (template) {
        await updateTemplate({ id: template._id, ...formData }).unwrap();
        toast.success('KPI Template updated successfully');
      } else {
        await createTemplate(formData).unwrap();
        toast.success('KPI Template created successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save KPI Template');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {template ? 'Edit KPI Template' : 'Create Designation KPI Template'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Backend Engineer Core KPIs"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Target Designation *
              </label>
              <select
                required
                value={formData.designationId}
                onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Designation...</option>
                {designations.map((desig) => (
                  <option key={desig._id} value={desig._id}>
                    {desig.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Strategic expectations and evaluation goals..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* KPI Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  KPI Items ({formData.kpis.length})
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isWeightValid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                  }`}
                >
                  {isWeightValid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  Total Weightage: {totalWeightage}% {isWeightValid ? '(Balanced)' : '(Must be 100%)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddKpi}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add Metric
              </button>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {formData.kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3.5 relative space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="KPI Title *"
                          value={kpi.title}
                          onChange={(e) => handleKpiChange(idx, 'title', e.target.value)}
                          className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            placeholder="Weight %"
                            value={kpi.weightage}
                            onChange={(e) => handleKpiChange(idx, 'weightage', e.target.value)}
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-2.5 pr-6 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                    {formData.kpis.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKpi(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Target Criteria / Measurable outcome *"
                      required
                      value={kpi.targetCriteria}
                      onChange={(e) => handleKpiChange(idx, 'targetCriteria', e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Optional description / guidance"
                      value={kpi.description}
                      onChange={(e) => handleKpiChange(idx, 'description', e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating || !isWeightValid}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              {isCreating || isUpdating ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

