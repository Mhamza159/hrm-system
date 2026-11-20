/**
 * @file OrgChartPage.jsx
 * @description Enterprise Interactive Organizational Chart Visualization Page.
 * 
 * SPECIFICATION & CAPABILITIES (Phase 38 Overhaul):
 * - Production-grade interactive canvas navigation studio with custom pointer drag-to-pan.
 * - Smooth mouse-wheel zooming (20% to 200%), Fit-to-Screen auto-scaler, and Center on Root.
 * - 4 First-Class View Modes: Company Wide, Department Tree, My Team, and Focal 360°.
 * - Dual-Density Rendering: Standard Cards (280px) vs Compact Chips (190px).
 * - Multi-column leaf grid stacking to eliminate horizontal canvas explosion on broad spans.
 * - Enterprise slide-over inspection drawer with direct reports roster and profile bridge.
 * - Multi-dimensional filtering (Department, Designation, Employment Status) and real-time search.
 * - Strict Elvara Forest theme (`#061A14`, `#111D17`, `#00C471`).
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  Layers,
  Sparkles,
  RefreshCw,
  Crosshair,
  GitBranch
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetOrgChartQuery } from '../departmentsApi.js';
import { OrgChartNode } from '../components/OrgChartNode.jsx';
import { OrgChartCanvasControls } from '../components/OrgChartCanvasControls.jsx';
import { OrgChartFilterBar } from '../components/OrgChartFilterBar.jsx';
import { OrgChartDetailDrawer } from '../components/OrgChartDetailDrawer.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';

export const OrgChartPage = () => {
  const navigate = useNavigate();

  // Query & Viewport States
  const [viewMode, setViewMode] = useState('company'); // 'company' | 'department' | 'team' | 'employee'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'probation' | 'all'
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [maxDepthLimit, setMaxDepthLimit] = useState(10);
  const [isCompact, setIsCompact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focalEmployeeId, setFocalEmployeeId] = useState(null);

  // RTK Query: Pass dynamic server-side filters
  const { data, isLoading, isFetching, isError, refetch } = useGetOrgChartQuery({
    viewMode,
    status: statusFilter,
    maxDepth: maxDepthLimit,
    employeeId: focalEmployeeId || undefined
  });

  // Canvas Pan & Zoom States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef(null);
  const contentRef = useRef(null);

  const orgData = data?.data || {
    tree: [],
    reportingChain: [],
    totalNodes: 0,
    stats: {
      totalNodes: 0,
      departmentsCount: 0,
      managersCount: 0,
      maxDepth: 0,
      spanOfControlAvg: 0
    }
  };

  const { tree = [], reportingChain = [], totalNodes = 0, stats = {} } = orgData;

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const deptSet = new Set();
    const extractDepts = (nodes) => {
      nodes.forEach((node) => {
        if (node.department && node.department !== 'Unassigned Department') {
          deptSet.add(node.department);
        }
        if (node.children?.length) extractDepts(node.children);
      });
    };
    extractDepts(tree);
    return Array.from(deptSet).sort();
  }, [tree]);

  // Find user's own node in the hierarchy
  const findMyNodeId = useMemo(() => {
    let myId = null;
    const searchMe = (nodes) => {
      for (const node of nodes) {
        if (node.isMe) {
          myId = node.id;
          return;
        }
        if (node.children?.length) searchMe(node.children);
      }
    };
    searchMe(tree);
    return myId;
  }, [tree]);

  // Canvas Drag & Pan Handlers
  const handlePointerDown = (e) => {
    // Only drag when clicking canvas background, not on interactive node cards or buttons
    if (e.target.closest('button, select, input, [id^="org-node-"], [id^="org-compact-node-"]')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom / Pan
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 2.0));
    }
  };

  // Auto-centering & Viewport Fitters
  const handleFitToScreen = () => {
    if (!canvasRef.current || !contentRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    if (contentRect.width === 0 || contentRect.height === 0) return;

    const scaleX = (canvasRect.width * 0.9) / (contentRect.width / zoom);
    const scaleY = (canvasRect.height * 0.85) / (contentRect.height / zoom);
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.2);

    setZoom(newZoom);
    setPan({ x: 0, y: 20 });
  };

  const handleCenterRoot = () => {
    setPan({ x: 0, y: 20 });
    setZoom(1);
  };

  // Find My Position with focal zoom
  const handleFindMyPosition = () => {
    if (!findMyNodeId) return;
    setHighlightedNodeId(findMyNodeId);
    const element = document.getElementById(`org-node-${findMyNodeId}`) || document.getElementById(`org-compact-node-${findMyNodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  // Focus specific node from detail modal or search
  const handleFocusNode = (nodeId) => {
    setHighlightedNodeId(nodeId);
    const element = document.getElementById(`org-node-${nodeId}`) || document.getElementById(`org-compact-node-${nodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!canvasRef.current) return;
    if (!document.fullscreenElement) {
      canvasRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    try {
      const res = await refetch();
      if (res?.error) {
        toast.error('Failed to reload organizational chart');
      } else {
        toast.success('Org chart reloaded successfully');
      }
    } catch {
      toast.error('Network error while reloading');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setStatusFilter('active');
    setViewMode('company');
    setFocalEmployeeId(null);
    setMaxDepthLimit(10);
  };

  const hasActiveFilters = searchTerm !== '' || selectedDept !== 'ALL' || statusFilter !== 'active' || viewMode !== 'company' || focalEmployeeId !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Organizational Chart"
        subtitle="Explore interactive company hierarchy, reporting lines, departments, and span of control."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Reload latest organizational structure from database"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {findMyNodeId && (
              <button
                type="button"
                onClick={handleFindMyPosition}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-sm shadow-emerald-950 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>Find My Position</span>
              </button>
            )}
          </div>
        }
      />

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Headcount"
          value={stats.totalNodes || totalNodes}
          caption="Active Members"
          icon={Users}
          variant="emerald"
        />
        <StatCard
          label="Departments"
          value={stats.departmentsCount || departments.length}
          caption="Operational Units"
          icon={Building}
          variant="blue"
        />
        <StatCard
          label="People Managers"
          value={stats.managersCount || 0}
          caption="Supervisory Roles"
          icon={Layers}
          variant="purple"
        />
        <StatCard
          label="Span of Control"
          value={stats.spanOfControlAvg ? `${stats.spanOfControlAvg} avg` : 'Direct'}
          caption={`Max Depth: ${stats.maxDepth || 1} Levels`}
          icon={GitBranch}
          variant="amber"
        />
      </div>

      {/* Multi-Dimensional Filter & Search Bar */}
      <OrgChartFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
        viewMode={viewMode}
        onChangeViewMode={(m) => {
          setViewMode(m);
          if (m !== 'employee') setFocalEmployeeId(null);
        }}
        selectedDept={selectedDept}
        onChangeDept={setSelectedDept}
        departments={departments}
        statusFilter={statusFilter}
        onChangeStatus={setStatusFilter}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalNodes={stats.totalNodes || totalNodes}
      />

      {/* Interactive Org Chart Canvas */}
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#061A14] min-h-[640px] flex items-start justify-center shadow-xs select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${isFullscreen ? 'h-screen w-screen p-12 bg-slate-50 dark:bg-[#061A14]' : ''}`}
        style={{
          backgroundImage: 'radial-gradient(rgba(26, 49, 37, 0.6) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px'
        }}
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-8 my-auto">
            <ScreenSkeleton variant="orgchart" title="Organizational Hierarchy" message="Computing reporting lines, department branches, and hierarchy graph..." />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center my-36 text-rose-500 dark:text-rose-400">
            <p className="text-sm font-semibold">Failed to load organizational structure.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center my-36 text-slate-400 dark:text-slate-500">
            <Users className="w-12 h-12 stroke-1 mb-3 text-slate-400 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No organizational hierarchy records found.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add employees and assign reporting managers to populate the chart.
            </p>
          </div>
        )}

        {/* Interactive Tree Viewport */}
        {!isLoading && !isError && tree.length > 0 && (
          <div
            ref={contentRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className="flex flex-col items-center gap-14 pt-8 pb-32"
          >
            {tree.map((rootNode) => (
              <OrgChartNode
                key={rootNode.id}
                node={rootNode}
                reportingChain={reportingChain}
                highlightedId={highlightedNodeId}
                selectedDept={selectedDept}
                selectedStatus={statusFilter}
                isCompact={isCompact}
                onSelectNode={(node) => {
                  setHighlightedNodeId(node.id);
                  setSelectedEmployee(node);
                }}
              />
            ))}
          </div>
        )}

        {/* Floating Navigation Controls HUD */}
        <div className="absolute bottom-5 right-5 z-20">
          <OrgChartCanvasControls
            zoom={zoom}
            onZoomIn={() => setZoom((prev) => Math.min(prev + 0.15, 2.0))}
            onZoomOut={() => setZoom((prev) => Math.max(prev - 0.15, 0.25))}
            onResetZoom={() => setZoom(1)}
            onFitToScreen={handleFitToScreen}
            onCenterRoot={handleCenterRoot}
            onFindMyPosition={handleFindMyPosition}
            hasMyPosition={Boolean(findMyNodeId)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            maxDepthLimit={maxDepthLimit}
            onChangeDepth={(d) => setMaxDepthLimit(d)}
            onExpandAll={() => setMaxDepthLimit(10)}
            onCollapseAll={() => setMaxDepthLimit(1)}
            isCompact={isCompact}
            onToggleCompact={() => setIsCompact(!isCompact)}
          />
        </div>
      </div>

      {/* Enterprise Slide-Over Employee Inspection Drawer */}
      {selectedEmployee && (
        <OrgChartDetailDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSelectEmployee={(emp) => {
            setSelectedEmployee(emp);
            handleFocusNode(emp.id);
          }}
          onCenterOnCanvas={(nodeId) => handleFocusNode(nodeId)}
          onSetFocalRoot={(nodeId) => {
            setFocalEmployeeId(nodeId);
            setViewMode('employee');
          }}
        />
      )}
    </div>
  );
};
