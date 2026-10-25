/**
 * @file OrgChartPage.jsx
 * @description Interactive Visual Organizational Chart Page.
 * 
 * SPECIFICATION & CAPABILITIES (Slices 4.5 & 4.7):
 * - Renders recursive tree of company hierarchy with complete reporting lines.
 * - Zoom & pan canvas controls (+, -, reset 100%, fullscreen).
 * - Department filter tabs to spotlight specific departments.
 * - Real-time employee search with instant match highlighting.
 * - "Find My Position" action button that scrolls directly to the logged-in user's node,
 *   highlighting the vertical ancestral reportingChain to executive roots.
 * - Interactive employee detail modal with manager info and direct reports list.
 * - Zero TypeScript, plain JSX, dark craft design system.
 */

import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Layers,
  X,
  Briefcase,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetOrgChartQuery } from '../departmentsApi.js';
import { OrgChartNode } from '../components/OrgChartNode.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';

export const OrgChartPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, isError, refetch } = useGetOrgChartQuery();
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);

  // Manual data reload handler
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

  // Focus specific node from detail modal or search
  const handleFocusNode = (nodeId) => {
    setHighlightedNodeId(nodeId);
    const element = document.getElementById(`org-node-${nodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  // Search employee and scroll into view
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.toLowerCase();
    let matchNode = null;

    const findMatch = (nodes) => {
      for (const node of nodes) {
        if (
          node.name.toLowerCase().includes(term) ||
          node.employeeCode.toLowerCase().includes(term) ||
          node.designation.toLowerCase().includes(term) ||
          node.department.toLowerCase().includes(term)
        ) {
          matchNode = node;
          return;
        }
        if (node.children?.length) findMatch(node.children);
      }
    };

    findMatch(tree);

    if (matchNode) {
      handleFocusNode(matchNode.id);
      setSelectedEmployee(matchNode);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Organizational Chart"
        subtitle="Explore interactive company hierarchy, reporting lines, and team structures."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Reload organizational structure from database"
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Headcount"
          value={totalNodes}
          caption="Active Members"
          icon={Users}
          variant="emerald"
        />
        <StatCard
          label="Active Departments"
          value={departments.length}
          caption="Operational Units"
          icon={Building}
          variant="blue"
        />
        <StatCard
          label="Reporting Structure"
          value={tree.length > 0 ? 'Verified DAG' : 'Pending'}
          caption="Cycle-Free Hierarchy"
          icon={Layers}
          variant="purple"
        />
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, role, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all"
          />
        </form>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          <button
            type="button"
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
              selectedDept === 'ALL'
                ? 'bg-[#00C471] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1F382D] border border-transparent dark:border-[#1A3125]/60'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
                selectedDept === dept
                  ? 'bg-[#00C471] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1F382D] border border-transparent dark:border-[#1A3125]/60'
              }`}
            >
              {dept}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Reload latest organizational chart data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Reloading...' : 'Reload Chart'}</span>
          </button>
        </div>

        {/* Zoom & Canvas Toolset */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            title={isFetching ? 'Reloading Org Chart...' : 'Reload Org Chart Data'}
            className="p-1.5 text-slate-500 hover:text-[#00C471] dark:text-slate-400 dark:hover:text-[#00C471] rounded-lg hover:bg-white dark:hover:bg-[#162820] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#00C471]' : ''}`} />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-[#1A3125] mx-0.5" />
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-white dark:hover:bg-[#162820] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 px-1.5 min-w-[3rem] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-white dark:hover:bg-[#162820] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-[#1A3125] mx-0.5" />
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset to 100%"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-white dark:hover:bg-[#162820] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-white dark:hover:bg-[#162820] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Org Chart Interactive Canvas */}
      <div
        ref={canvasRef}
        className={`relative overflow-auto rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]/95 p-8 shadow-xs min-h-[620px] flex items-start justify-center text-slate-300/40 dark:text-emerald-950/40 ${
          isFullscreen ? 'h-screen w-screen p-12 bg-slate-50 dark:bg-[#061A14]' : ''
        }`}
        style={{
          backgroundImage: 'radial-gradient(currentColor 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px'
        }}
      >
        {isLoading && (
          <div className="p-6">
            <ScreenSkeleton variant="orgchart" title="Organizational Hierarchy" message="Computing reporting lines and department branches..." />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center my-32 text-rose-500 dark:text-rose-400">
            <p className="text-sm font-semibold">Failed to load organizational structure.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center my-32 text-slate-400 dark:text-slate-500">
            <Users className="w-12 h-12 stroke-1 mb-3 text-slate-400 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No organizational hierarchy records found.</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
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
            className="flex flex-col items-center gap-12 pt-4 pb-20"
          >
            {tree.map((rootNode) => (
              <OrgChartNode
                key={rootNode.id}
                node={rootNode}
                reportingChain={reportingChain}
                highlightedId={highlightedNodeId}
                selectedDept={selectedDept}
                onSelectNode={(node) => {
                  setHighlightedNodeId(node.id);
                  setSelectedEmployee(node);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Employee Detail Modal / Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl text-slate-800 dark:text-slate-100 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {selectedEmployee.avatar ? (
                    <img
                      src={selectedEmployee.avatar}
                      alt={selectedEmployee.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-[#00C471] shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#00C471] text-white font-bold flex items-center justify-center text-lg shadow-sm ring-2 ring-[#00C471]/30">
                      {selectedEmployee.name
                        ? selectedEmployee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                        : 'EM'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#111D17] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedEmployee.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      {selectedEmployee.employeeCode}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{selectedEmployee.designation}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{selectedEmployee.department}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Work Email</span>
                <p className="text-slate-800 dark:text-slate-200 font-mono truncate flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{selectedEmployee.email || 'N/A'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Phone Number</span>
                <p className="text-slate-800 dark:text-slate-200 font-mono truncate flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedEmployee.phone || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Reporting Hierarchy Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#00C471]" />
                  Reports To:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedEmployee.managerName ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{selectedEmployee.managerName}</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Chief Executive Officer (Root)</span>
                  )}
                </span>
              </div>

              {selectedEmployee.managerDesignation && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                  {selectedEmployee.managerDesignation}
                </p>
              )}
            </div>

            {/* Direct Subordinates List */}
            {selectedEmployee.children && selectedEmployee.children.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Direct Subordinates</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                    {selectedEmployee.children.length} Reports
                  </span>
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedEmployee.children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => {
                        setSelectedEmployee(child);
                        handleFocusNode(child.id);
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {child.avatar ? (
                          <img src={child.avatar} alt={child.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
                            {child.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{child.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{child.designation}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleFocusNode(selectedEmployee.id);
                  setSelectedEmployee(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Crosshair className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Focus in Tree
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedEmployee.isMe) {
                    navigate('/me');
                  } else {
                    navigate(`/employees/${selectedEmployee.id}`);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#00C471] hover:bg-[#049856] text-white font-semibold transition-all shadow-xs cursor-pointer"
              >
                <span>View Full Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
