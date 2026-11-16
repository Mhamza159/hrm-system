/**
 * @file KpiTemplatesPage.jsx
 * @description Master KPI Templates management page for HR and Super Admin.
 * Strictly adheres to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.1)
 */

import React, { useState, useMemo } from 'react';
import { Target, Plus, Search, Filter, Edit, Trash2, CheckCircle2, Layers, Eye, Percent, Check } from 'lucide-react';
import { useGetKpiTemplatesQuery, useDeleteKpiTemplateMutation } from '../performanceApi.js';
import { useGetDesignationsQuery } from '../../departments/departmentsApi.js';
import { KpiTemplateModal } from '../components/KpiTemplateModal.jsx';
import { KpiTemplateDetailModal } from '../components/KpiTemplateDetailModal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const KpiTemplatesPage = () => {
  const [search, setSearch] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [detailTemplate, setDetailTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  const { data: templatesData, isLoading, isFetching, refetch } = useGetKpiTemplatesQuery({
    search: search.trim() ? search.trim() : undefined,
    designationId: selectedDesignation ? selectedDesignation : undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
  });
  const templates = templatesData?.data || [];

  const { data: desigData } = useGetDesignationsQuery();
  const designations = desigData?.data || [];

  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteKpiTemplateMutation();

  // Metrics summary
  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((t) => t.isActive).length;
    const designationsSet = new Set(templates.map((t) => t.designationId?._id || t.designationId).filter(Boolean));
    const totalMetrics = templates.reduce((acc, t) => acc + (t.kpis?.length || 0), 0);

    return { total, active, designationsCount: designationsSet.size, totalMetrics };
  }, [templates]);

  if (isLoading && !templatesData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
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

  const handleOpenDetail = (template) => {
    setDetailTemplate(template);
  };

  const handleDeletePrompt = (template) => {
    setDeleteConfirm({
      isOpen: true,
      id: template._id,
      name: template.name
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteTemplate(deleteConfirm.id).unwrap();
      toast.success(`KPI Template "${deleteConfirm.name}" deleted successfully`);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete template');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                KPI Master Templates
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Standardize measurable indicators, performance rubrics, and 100% weightages across job designations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />

          <Can perform="performance.template.manage">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
            >
              <Plus className="h-4 w-4" /> New KPI Template
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Rubrics
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.total}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Configured templates</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Templates
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5 block">
            {stats.active}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ready for cycle launch</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Designations
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.designationsCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Job roles covered</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Metrics
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.totalMetrics}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">KPI evaluation criteria</span>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates by title or criteria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="w-full sm:w-52 py-2 px-3 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Designations</option>
              {designations.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 py-2 px-3 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(search || selectedDesignation || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedDesignation('');
                setStatusFilter('all');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Templates Content */}
      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No KPI Templates Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Create standard KPI rubrics to automatically instantiate measurable evaluation metrics when launching review cycles.
          </p>
          <Can perform="performance.template.manage">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" /> Create First KPI Template
            </button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => {
            const totalWeight = (tpl.kpis || []).reduce((acc, k) => acc + (k.weightage || 0), 0);
            const is100 = totalWeight === 100;

            return (
              <div
                key={tpl._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="space-y-1">
                      <h3
                        onClick={() => handleOpenDetail(tpl)}
                        className="font-bold text-slate-900 dark:text-white text-base leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                        title={tpl.name}
                      >
                        {tpl.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                          <Layers className="h-3 w-3 text-emerald-600" />
                          {tpl.designationId?.title || 'General'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                        tpl.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${tpl.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {tpl.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {tpl.description}
                    </p>
                  )}

                  {/* Metrics preview list */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      <span>Key Criteria</span>
                      <span className="font-mono">{tpl.kpis?.length || 0} Metrics</span>
                    </div>

                    {tpl.kpis?.slice(0, 3).map((k, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/30 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/40"
                      >
                        <span className="truncate pr-2 text-[11px] font-medium">• {k.title}</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[11px] shrink-0">
                          {k.weightage}%
                        </span>
                      </div>
                    ))}

                    {tpl.kpis?.length > 3 && (
                      <p className="text-[10px] text-slate-400 text-center italic">
                        +{tpl.kpis.length - 3} more metric{tpl.kpis.length - 3 > 1 ? 's' : ''} in rubric
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        is100
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <Check className="h-3 w-3" /> {totalWeight}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDetail(tpl)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    <Can perform="performance.template.manage">
                      <button
                        onClick={() => handleOpenEdit(tpl)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Edit Template"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePrompt(tpl)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Can>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <KpiTemplateDetailModal
        isOpen={Boolean(detailTemplate)}
        onClose={() => setDetailTemplate(null)}
        template={detailTemplate}
        onEdit={handleOpenEdit}
      />

      {/* Create / Edit Modal */}
      <KpiTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete KPI Master Template"
        description={`Are you sure you want to delete template "${deleteConfirm.name}"? Active reviews that have already snapshotted this template will not be impacted, but this rubric will no longer be available for future review cycles.`}
        confirmText="Delete Template"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
