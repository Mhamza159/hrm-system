import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, CheckCircle2, User, Eye, BarChart3 } from 'lucide-react';
import { formatDate } from '../../../../lib/formatters.js';
import { PunchCorrectionReviewModal } from '../../../attendance/components/PunchCorrectionReviewModal.jsx';
import { WFHReviewModal } from '../../../attendance/components/WFHReviewModal.jsx';
import { LeaveDecideModal } from '../../../leaves/components/LeaveDecideModal.jsx';

export function PendingList({ leaves = [], corrections = [], wfh = [], onRefresh }) {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'corrections' | 'wfh'
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [selectedWFH, setSelectedWFH] = useState(null);
  const [isWFHModalOpen, setIsWFHModalOpen] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const items = activeTab === 'leaves' ? leaves : activeTab === 'corrections' ? corrections : wfh;

  const handleOpenCorrection = (item) => {
    setSelectedCorrection(item);
    setIsReviewModalOpen(true);
  };

  const handleOpenWFH = (item) => {
    setSelectedWFH(item);
    setIsWFHModalOpen(true);
  };

  const handleOpenLeave = (item) => {
    // Construct normalized leave object for LeaveDecideModal
    const leaveDoc = {
      _id: item._id,
      employeeId: {
        _id: item.employeeId?._id || item.employeeId,
        name: item.employeeName,
        employeeCode: item.employeeCode,
        avatar: item.avatar
      },
      leaveTypeId: {
        _id: item.leaveTypeId?._id || item.leaveTypeId,
        name: item.leaveType
      },
      startDate: item.startDate,
      endDate: item.endDate,
      days: item.totalDays || item.days || 1,
      reason: item.reason || 'Pending Leave Review',
      approvalChain: item.approvalChain || []
    };
    setSelectedLeave(leaveDoc);
    setIsLeaveModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#13221B] rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'leaves'
                ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Leaves ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'corrections'
                ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Corrections ({corrections.length})
          </button>
          <button
            onClick={() => setActiveTab('wfh')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'wfh'
                ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            WFH ({wfh.length})
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-[#1A3125] max-h-80 overflow-y-auto overflow-x-hidden scrollbar-none">
        {items.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">All caught up! No pending approvals.</p>
          </div>
        ) : (
          items.slice(0, 6).map((item) => (
            <div
              key={item._id}
              onClick={() => {
                if (activeTab === 'corrections') handleOpenCorrection(item);
                else if (activeTab === 'wfh') handleOpenWFH(item);
                else handleOpenLeave(item);
              }}
              className="py-3 px-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#13221B] rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300 overflow-hidden">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.employeeName} className="w-full h-full object-cover" />
                  ) : (
                    item.employeeName?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.employeeName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeTab === 'leaves' ? (
                      <>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.leaveType}</span>
                        {' · '}
                        <span className="font-medium">{item.totalDays} {item.totalDays === 1 ? 'day' : 'days'}</span>
                        {item.reason && <span className="text-slate-400 dark:text-slate-500 block truncate text-[10px] mt-0.5">{item.reason}</span>}
                      </>
                    ) : activeTab === 'corrections' ? (
                      <>
                        Missed Punch on{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(item.date)}</span>
                        {item.department ? ` · ${item.department}` : ''}
                      </>
                    ) : (
                      <>
                        Work From Home on{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(item.date)}</span>
                        {item.department ? ` · ${item.department}` : ''}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {activeTab === 'corrections' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCorrection(item);
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Inspect Punch</span>
                </button>
              ) : activeTab === 'wfh' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenWFH(item);
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Inspect WFH</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenLeave(item);
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Inspect Leave</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {items.length > 6 && (
        <div className="pt-2 text-center border-t border-slate-100 dark:border-[#1A3125]">
          <Link
            to={activeTab === 'leaves' ? '/leaves/approvals' : activeTab === 'wfh' ? '/attendance/team?tab=wfh' : '/attendance/team?tab=corrections'}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View all {items.length} pending requests</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Audit & Decision Modal for Leaves */}
      {selectedLeave && (
        <LeaveDecideModal
          isOpen={isLeaveModalOpen}
          onClose={() => {
            setIsLeaveModalOpen(false);
            setSelectedLeave(null);
          }}
          leave={selectedLeave}
          initialAction="approve"
          onSuccess={onRefresh}
        />
      )}

      {/* Audit & Decision Modal for Corrections */}
      <PunchCorrectionReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedCorrection(null);
        }}
        correctionId={selectedCorrection?._id}
        fallbackData={selectedCorrection}
        onSuccess={onRefresh}
      />

      {/* Audit & Decision Modal for WFH */}
      <WFHReviewModal
        isOpen={isWFHModalOpen}
        onClose={() => {
          setIsWFHModalOpen(false);
          setSelectedWFH(null);
        }}
        requestId={selectedWFH?._id}
        fallbackData={selectedWFH}
        onSuccess={onRefresh}
      />
    </div>
  );
}
