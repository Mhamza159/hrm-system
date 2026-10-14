/**
 * @file OrgChartPage.jsx
 * @description Interactive Visual Organizational Chart Page.
 * 
 * SPECIFICATION & CAPABILITIES (Slices 4.5 & 4.7):
 * - Renders recursive tree of company hierarchy.
 * - Zoom & pan canvas controls (+, -, reset 100%, fullscreen).
 * - Department filter tabs to spotlight specific departments.
 * - Real-time employee search with instant match highlighting.
 * - "Find My Position" action button that scrolls directly to the logged-in user's node,
 *   highlighting the vertical ancestral reportingChain to executive roots.
 * - Zero TypeScript, plain JSX, dark craft design system.
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Crosshair,
  Building,
  Users,
  ShieldCheck,
  Sparkles,
  Layers
} from 'lucide-react';
import { useGetOrgChartQuery } from '../departmentsApi.js';
import { OrgChartNode } from '../components/OrgChartNode.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';

export const OrgChartPage = () => {
  const { data, isLoading, isError, refetch } = useGetOrgChartQuery();
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);

  const orgData = data?.data || { tree: [], reportingChain: [], totalNodes: 0 };
  const { tree = [], reportingChain = [], totalNodes = 0 } = orgData;

  // Extract unique departments for filter chips
  const departments = useMemo(() => {
    const deptSet = new Set();
    const extractDepts = (nodes) => {
      nodes.forEach((node) => {
        if (node.department) deptSet.add(node.department);
        if (node.children?.length) extractDepts(node.children);
      });
    };
    extractDepts(tree);
    return Array.from(deptSet).sort();
  }, [tree]);

  // Find user's own node in the tree
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

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => setZoom(1);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!canvasRef.current) return;
    if (!document.fullscreenElement) {
      canvasRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Find My Position handler (Slice 4.7)
  const handleFindMyPosition = () => {
    if (!findMyNodeId) return;
    setHighlightedNodeId(findMyNodeId);
    const element = document.getElementById(`org-node-${findMyNodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  // Search employee and scroll into view
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.toLowerCase();
    let matchId = null;

    const findMatch = (nodes) => {
      for (const node of nodes) {
        if (
          node.name.toLowerCase().includes(term) ||
          node.employeeCode.toLowerCase().includes(term) ||
          node.designation.toLowerCase().includes(term)
        ) {
          matchId = node.id;
          return;
        }
        if (node.children?.length) findMatch(node.children);
      }
    };

    findMatch(tree);

    if (matchId) {
      setHighlightedNodeId(matchId);
      const element = document.getElementById(`org-node-${matchId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Organizational Chart"
        subtitle="Explore interactive company hierarchy, reporting lines, and team structures."
      >
        <div className="flex items-center gap-2">
          {findMyNodeId && (
            <button
              type="button"
              onClick={handleFindMyPosition}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-sm shadow-emerald-950"
            >
              <Crosshair className="w-4 h-4 text-emerald-400" />
              Find My Position
            </button>
          )}
        </div>
      </PageHeader>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Staff Mapped"
          value={totalNodes}
          icon={Users}
          description="Active verified organizational members"
        />
        <StatCard
          title="Departments Active"
          value={departments.length}
          icon={Building}
          description="Operational departments represented"
        />
        <StatCard
          title="Reporting Hierarchy"
          value={tree.length > 0 ? 'Verified DAG' : 'Pending'}
          icon={Layers}
          description="Cycle-safe top-down reporting graph"
        />
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
        </form>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          <button
            type="button"
            onClick={() => setSelectedDept('ALL')}
            className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors shrink-0 ${
              selectedDept === 'ALL'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors shrink-0 ${
                selectedDept === dept
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Zoom & Canvas Toolset */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 shrink-0">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1.5 min-w-[3rem] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset to 100%"
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Org Chart Interactive Canvas */}
      <div
        ref={canvasRef}
        className={`relative overflow-auto rounded-xl border border-slate-800 bg-[#061A14]/90 p-8 shadow-inner min-h-[580px] flex items-start justify-center ${
          isFullscreen ? 'h-screen w-screen p-12 bg-[#061A14]' : ''
        }`}
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center my-32 text-slate-400">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Building organizational hierarchy graph...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center my-32 text-rose-400">
            <p className="text-sm font-semibold">Failed to load organizational structure.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center my-32 text-slate-500">
            <Users className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No organizational hierarchy records found.</p>
            <p className="text-xs text-slate-600 mt-1">
              Add employees and assign reporting managers to populate the chart.
            </p>
          </div>
        )}

        {!isLoading && !isError && tree.length > 0 && (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
            className="flex flex-col items-center gap-12 pt-4 pb-16"
          >
            {tree.map((rootNode) => (
              <OrgChartNode
                key={rootNode.id}
                node={rootNode}
                reportingChain={reportingChain}
                highlightedId={highlightedNodeId}
                onSelectNode={(node) => setHighlightedNodeId(node.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
