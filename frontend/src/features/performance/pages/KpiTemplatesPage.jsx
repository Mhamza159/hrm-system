/**
 * @file KpiTemplatesPage.jsx
 * @description Master KPI Templates management page for HR and Super Admin.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.1)
 */

import React, { useState } from 'react';
import { Target, Plus, Search, Filter, Edit, Trash2, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { useGetKpiTemplatesQuery, useDeleteKpiTemplateMutation } from '../performanceApi.js';
import { useGetDesignationsQuery } from '../../departments/departmentsApi.js';
import { KpiTemplateModal } from '../components/KpiTemplateModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const KpiTemplatesPage = () => {
  const [search, setSearch] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const { data: templatesData, isLoading, isFetching, refetch } = useGetKpiTemplatesQuery({
    search: search ? search : undefined,
    designationId: selectedDesignation ? selectedDesignation : undefined
  });
  const templates = templatesData?.data || [];

  const { data: desigData } = useGetDesignationsQuery();
  const designations = desigData?.data || [];

  const [deleteTemplate] = useDeleteKpiTemplateMutation();

  if (isLoading && !templatesData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete KPI template "${name}"?`)) {
      try {
        await deleteTemplate(id).unwrap();
        toast.success('KPI Template deleted successfully');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete template');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KPI Master Templates</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standardize measurable performance indicators and weightages across job designations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can perform="performance.template.manage">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          </Can>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="w-full sm:w-60 py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Designations</option>
            {designations.map((d) => (
              <option key={d._id} value={d._id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading KPI Templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Target className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No KPI Templates Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create standard KPI templates to automatically assign evaluation metrics when launching review cycles.
          </p>
          <Can perform="performance.template.manage">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="h-4 w-4" /> Create First Template
            </button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {tpl.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 shrink-0">
                    {tpl.kpis?.length || 0} Metrics
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {tpl.designationId?.title || 'General Designation'}
                  </span>
                </div>

                {tpl.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {tpl.description}
                  </p>
                )}

                {/* KPI Metrics summary */}
                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {tpl.kpis?.slice(0, 3).map((k, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">• {k.title}</span>
                      <span className="font-mono font-bold text-slate-500 shrink-0">{k.weightage}%</span>
                    </div>
                  ))}
                  {tpl.kpis?.length > 3 && (
                    <p className="text-[11px] text-slate-400 italic">
                      +{tpl.kpis.length - 3} more metrics...
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Total Weight: 100%
                </span>
                <Can perform="performance.template.manage">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(tpl)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Edit Template"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl._id, tpl.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      <KpiTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
      />
    </div>
  );
};

