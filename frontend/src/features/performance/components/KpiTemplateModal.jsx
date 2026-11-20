/**
 * @file KpiTemplateModal.jsx
 * @description Modal for authoring and editing designation-wise KPI master templates.
 * Enforces the strict 100% total weightage business invariant with real-time visual gauge.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md).
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Target, Percent, AlertCircle, Loader2 } from 'lucide-react';
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
    if (!isOpen) return;
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
            title: 'Technical Delivery & Velocity',
            description: 'Complete sprint tickets within estimated story points and deadlines.',
            weightage: 40,
            targetCriteria: '>= 90% sprint commitments delivered per sprint cycle'
          },
          {
            title: 'Code Quality & Test Coverage',
            description: 'Maintain clean architecture, PR reviews, and unit test coverage >= 80%.',
            weightage: 35,
            targetCriteria: 'Zero critical bugs in production; 80%+ test coverage'
          },
          {
            title: 'Team Mentorship & Collaboration',
            description: 'Active participation in design reviews and helping team members.',
            weightage: 25,
            targetCriteria: 'Positive peer feedback score >= 4.0/5'
          }
        ]
      });
    }
  }, [template, isOpen, designations?.length]);

  if (!isOpen) return null;

  const totalWeightage = formData.kpis.reduce(
    (acc, k) => acc + (parseInt(k.weightage, 10) || 0),
    0
  );
  const isValid100 = totalWeightage === 100;
  const isOver100 = totalWeightage > 100;

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
    if (formData.kpis.length <= 1) {
      toast.error('Template must have at least one KPI metric');
      return;
    }
    const updated = formData.kpis.filter((_, i) => i !== index);
    setFormData({ ...formData, kpis: updated });
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
      toast.error('Please select a target designation');
      return;
    }

    if (formData.kpis.length === 0) {
      toast.error('At least one KPI metric is required');
      return;
    }

    for (let i = 0; i < formData.kpis.length; i++) {
      const k = formData.kpis[i];
      if (!k.title.trim()) {
        toast.error(`Metric #${i + 1} requires a title`);
        return;
      }
      if (!k.targetCriteria.trim()) {
        toast.error(`Metric "${k.title || `#${i + 1}`}" requires target success criteria`);
        return;
      }
      if (k.weightage <= 0 || k.weightage > 100) {
        toast.error(`Metric "${k.title}" weightage must be between 1% and 100%`);
        return;
      }
    }

    if (!isValid100) {
      toast.error(`Total weightage must equal exactly 100%. Current sum: ${totalWeightage}%`);
      return;
    }

    try {
      if (template?._id) {
        await updateTemplate({ id: template._id, ...formData }).unwrap();
        toast.success(`KPI Template "${formData.name}" updated successfully`);
      } else {
        await createTemplate(formData).unwrap();
        toast.success(`KPI Template "${formData.name}" created successfully`);
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save KPI Template');
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {template?._id ? 'Edit KPI Master Template' : 'Create KPI Master Template'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure designation-specific performance indicators and weightages summing to 100%.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
            {/* Template Core Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full Stack Engineer KPI"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.designationId}
                  onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select Designation</option>
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Objective & Description
                </label>
                <input
                  type="text"
                  placeholder="Briefly describe the purpose of this rubric..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Template Active Status
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Active templates are automatically snapshotted when appraisal cycles launch.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Dynamic 100% Weightage Visual Gauge */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isValid100
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : isOver100
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Percent
                    className={`h-4 w-4 ${
                      isValid100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isOver100
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Total KPI Weightage Validation
                  </span>
                </div>

                <span
                  className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isValid100
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : isOver100
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {totalWeightage}% of 100%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isValid100 ? 'bg-emerald-500' : isOver100 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(totalWeightage, 100)}%` }}
                />
              </div>

              {/* Status Message */}
              <p
                className={`text-[11px] font-medium mt-2 flex items-center gap-1.5 ${
                  isValid100
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : isOver100
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {isValid100 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Weightage is perfectly calibrated! Ready to save.
                  </>
                ) : isOver100 ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Total exceeds 100% by {totalWeightage - 100}%. Please reduce weights before saving.
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Remaining weight to allocate: {100 - totalWeightage}%. Sum must equal exactly 100%.
                  </>
                )}
              </p>
            </div>

            {/* Performance Indicators (KPIs) Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                    Performance Metrics ({formData.kpis.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Define measurable rubrics and target criteria evaluated during appraisals.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddKpi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Metric
                </button>
              </div>

              <div className="space-y-3">
                {formData.kpis.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-mono">
                          {idx + 1}
                        </span>
                        Metric #{idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveKpi(idx)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove Metric"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Metric Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Technical Delivery & Velocity"
                          value={kpi.title}
                          onChange={(e) => handleKpiChange(idx, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Weight (%) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={kpi.weightage}
                            onChange={(e) => handleKpiChange(idx, 'weightage', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Target Success Criteria <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. >= 90% sprint story points completed without critical blockers"
                          value={kpi.targetCriteria}
                          onChange={(e) => handleKpiChange(idx, 'targetCriteria', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Rubric Description (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Context on how to assess or score this metric..."
                          value={kpi.description}
                          onChange={(e) => handleKpiChange(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="text-xs">
              <span className="text-slate-500">Weightage Status: </span>
              <span className={`font-mono font-bold ${isValid100 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isValid100 ? 'Balanced (100%)' : `Invalid (${totalWeightage}%)`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isValid100 || isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {template?._id ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
