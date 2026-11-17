/**
 * @file EmployeePoliciesPage.jsx
 * @description Dedicated Employee Policy Portal for reviewing company handbooks and completing mandatory digital sign-offs.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Check
} from 'lucide-react';
import {
  useGetPoliciesQuery
} from '../policyApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import PolicyDetailDrawer from '../components/PolicyDetailDrawer.jsx';
import PolicyAcknowledgementModal from '../components/PolicyAcknowledgementModal.jsx';

export const EmployeePoliciesPage = () => {
  const navigate = useNavigate();
  const { user, isHR, isSuperAdmin } = useAuth();
  const canAdmin = isHR || isSuperAdmin;

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'signed' | 'all'
  const [search, setSearch] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);

  // Fetch policies with employee filter flag
  const {
    data: policiesData,
    isLoading,
    refetch
  } = useGetPoliciesQuery({
    search: search || undefined,
    myPoliciesOnly: true,
    limit: 100
  });

  const policies = policiesData?.policies || [];

  // Partition policies by acknowledgement state
  const pendingPolicies = policies.filter(
    (p) => p.requiresAcknowledgement && !p.userAcknowledged
  );
  const acknowledgedPolicies = policies.filter(
    (p) => p.userAcknowledged
  );
  const generalPolicies = policies;

  const displayList =
    activeTab === 'pending'
      ? pendingPolicies
      : activeTab === 'signed'
      ? acknowledgedPolicies
      : generalPolicies;

  const handleOpenDetail = (policy) => {
    setSelectedPolicy(policy);
    setIsDetailDrawerOpen(true);
  };

  const handleStartAcknowledge = (policy, e) => {
    if (e) e.stopPropagation();
    setSelectedPolicy(policy);
    setIsAckModalOpen(true);
  };

  const handleAcknowledgeSuccess = () => {
    refetch();
    setIsAckModalOpen(false);
    setIsDetailDrawerOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0C1712] to-[#111D17] border border-[#1A3125] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C471] bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              Employee Portal
            </span>
            {pendingPolicies.length > 0 ? (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{pendingPolicies.length} Actions Required</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-[#00C471] bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Required Policies Signed</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Company Handbooks & Compliance Guidelines
          </h1>
          <p className="text-xs sm:text-sm text-[#7E9E8F] leading-relaxed">
            Welcome, {user?.name || 'Team Member'}. Review corporate standards, health & safety rules, operational procedures, and execute mandatory digital acknowledgements.
          </p>
        </div>

        {canAdmin && (
          <div className="mt-4 sm:mt-0 sm:absolute sm:right-8 sm:top-8 z-10">
            <button
              type="button"
              onClick={() => navigate('/policies')}
              className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <span>Admin Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1A3125] pb-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#00C471] text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A3125]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pending Sign-off ({pendingPolicies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signed')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'signed'
                ? 'bg-[#00C471] text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A3125]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Acknowledged ({acknowledgedPolicies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#00C471] text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A3125]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Guidelines ({generalPolicies.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
          />
        </div>
      </div>

      {/* Policies Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl">
          Loading company policies...
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-16 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-[#00C471] mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'pending'
              ? 'No Pending Sign-offs!'
              : activeTab === 'signed'
              ? 'No Signed Policies Yet'
              : 'No Policies Found'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'You are fully compliant with all company operational directives.'
              : 'Browse the guidelines directory to review published company policies.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((p) => {
            const isPendingThis = p.requiresAcknowledgement && !p.userAcknowledged;

            return (
              <div
                key={p._id}
                onClick={() => handleOpenDetail(p)}
                className={`bg-white dark:bg-[#111D17] border rounded-2xl p-5 shadow-xs hover:border-[#00C471]/50 dark:hover:border-[#00C471]/40 transition-all flex flex-col justify-between group cursor-pointer relative ${
                  isPendingThis
                    ? 'border-amber-500/40 dark:border-amber-500/30'
                    : 'border-slate-200 dark:border-[#1A3125]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${p.categoryId?.color || '#00C471'}15`,
                        color: p.categoryId?.color || '#00C471',
                        borderColor: `${p.categoryId?.color || '#00C471'}30`
                      }}
                    >
                      {p.categoryId?.name || 'General'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      v{p.version}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 line-clamp-2 leading-relaxed">
                      {p.description || 'Corporate operational guideline.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      <span>{p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : 'Effective'}</span>
                    </span>
                    {p.fileUrl && (
                      <span className="flex items-center gap-1 text-slate-500">
                        · Attached Doc
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
                  {p.userAcknowledged ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00C471]">
                      <Check className="w-3.5 h-3.5" />
                      <span>Signed</span>
                    </span>
                  ) : p.requiresAcknowledgement ? (
                    <button
                      type="button"
                      onClick={(e) => handleStartAcknowledge(p, e)}
                      className="h-8 px-3 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review & Sign</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Reference Only</span>
                  )}

                  <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition flex items-center gap-0.5">
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Detail Drawer */}
      <PolicyDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        policy={selectedPolicy}
        canManage={canAdmin}
        canApprove={false}
        userAcknowledged={selectedPolicy?.userAcknowledged}
        onAcknowledge={() => {
          setIsDetailDrawerOpen(false);
          setIsAckModalOpen(true);
        }}
      />

      <PolicyAcknowledgementModal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        policy={selectedPolicy}
        userName={user?.name || ''}
        onSuccess={handleAcknowledgeSuccess}
      />
    </div>
  );
};

export default EmployeePoliciesPage;
