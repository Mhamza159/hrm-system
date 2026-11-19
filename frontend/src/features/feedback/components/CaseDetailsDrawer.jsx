/**
 * @file CaseDetailsDrawer.jsx
 * @description Slide-over drawer for inspecting and managing a grievance case (BUILD-GUIDE Row 21.2 & 21.5).
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  User,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Send,
  EyeOff,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useAddCaseNoteMutation, useGetFeedbackByIdQuery } from '../feedbackApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import StatusChangeModal from './StatusChangeModal.jsx';
import EscalateModal from './EscalateModal.jsx';

export default function CaseDetailsDrawer({ isOpen, onClose, caseId }) {
  const { can, isSuperAdmin } = usePermission();
  const canManage = isSuperAdmin || can('feedback.manage');
  const { data: resData, isLoading, refetch } = useGetFeedbackByIdQuery(caseId, {
    skip: !caseId || !isOpen
  });
  const [addCaseNote, { isLoading: isAddingNote }] = useAddCaseNoteMutation();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(true);

  if (!isOpen) return null;

  const caseItem = resData?.data;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addCaseNote({
        id: caseItem._id,
        note: newNote.trim(),
        isPublicToComplainant: isPublicNote
      }).unwrap();

      setNewNote('');
      toast.success('Investigation note recorded.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add note');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex justify-end">
        <div className="w-full max-w-2xl bg-white dark:bg-[#111D17] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#1A3125] animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#00C471] uppercase">
                  {caseItem?.trackingCode || 'LOADING DOCKET...'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Confidential Case File
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading || !caseItem ? (
              <div className="py-20 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
                Decrypting and vaulting case dossier...
              </div>
            ) : (
              <>
                {/* Meta summary card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {caseItem.title}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      caseItem.status === 'Resolved'
                        ? 'bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30'
                        : caseItem.status === 'Dismissed'
                        ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        : caseItem.status === 'Escalated'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-200 dark:border-[#1A3125]">
                    <div>
                      <span className="text-slate-400 dark:text-[#7E9E8F] block text-[10px] uppercase font-bold">Category</span>
                      <span className="font-semibold text-slate-800 dark:text-[#CBD5E1]">
                        {caseItem.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-[#7E9E8F] block text-[10px] uppercase font-bold">Priority</span>
                      <span className="font-semibold text-slate-800 dark:text-[#CBD5E1]">
                        {caseItem.priority}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-[#7E9E8F] block text-[10px] uppercase font-bold">Complainant</span>
                      <span className="font-semibold text-slate-800 dark:text-[#CBD5E1] flex items-center gap-1">
                        {caseItem.isAnonymous ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-[#00C471]" />
                            <span>Anonymous</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            <span>{caseItem.submittedBy?.name || 'Named Employee'}</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-[#7E9E8F] block text-[10px] uppercase font-bold">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-[#CBD5E1]">
                        {caseItem.departmentId?.name || 'Company-Wide'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-[#7E9E8F] block text-[10px] uppercase font-bold">Logged Date</span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-[#CBD5E1]">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-[#7E9E8F] block text-[10px] uppercase font-bold">Escalated</span>
                      <span className="font-semibold text-slate-800 dark:text-[#CBD5E1]">
                        {caseItem.isEscalated ? 'Yes (Executive Flagged)' : 'Standard Triage'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Case Narrative */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#7E9E8F] mb-2">
                    Case Narrative & Evidence Details
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-xs sm:text-sm text-slate-800 dark:text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">
                    {caseItem.description}
                  </div>
                </div>

                {/* Evidence Attachments */}
                {caseItem.attachments && caseItem.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#7E9E8F] mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#00C471]" />
                      <span>Vaulted Evidence Attachments ({caseItem.attachments.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {caseItem.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-xs font-mono text-[#00C471] hover:border-[#00C471]/50 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[220px]">Attachment #{idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution note banner if resolved */}
                {caseItem.resolutionNote && (
                  <div className="p-4 rounded-xl bg-[#00C471]/10 border border-[#00C471]/30 text-xs sm:text-sm">
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block mb-1">
                      Final Resolution & Closure Findings
                    </span>
                    <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">
                      {caseItem.resolutionNote}
                    </p>
                    {caseItem.resolvedAt && (
                      <p className="mt-2 text-[10px] font-mono text-[#00C471]">
                        Concluded on {new Date(caseItem.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Case Notes & Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#7E9E8F] mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#00C471]" />
                      <span>Investigation Notes & Log ({caseItem.caseNotes?.length || 0})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F]">
                      Audit Trail
                    </span>
                  </h4>

                  <div className="space-y-3 mb-4">
                    {caseItem.caseNotes?.map((note) => (
                      <div
                        key={note._id}
                        className={`p-3.5 rounded-xl border text-xs ${
                          note.isPublicToComplainant
                            ? 'bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125]'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-[#7E9E8F] mb-1.5">
                          <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                            {note.authorId?.name || note.authorRole || 'Investigator'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${
                              note.isPublicToComplainant
                                ? 'bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {note.isPublicToComplainant ? 'Shared with Complainant' : 'Internal Confidential'}
                            </span>
                            <span className="font-mono">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add note input box */}
                  {canManage && (
                    <form onSubmit={handleAddNote} className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125]">
                      <textarea
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Record an investigation update, witness interview finding, or status remark..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] resize-y placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
                      />

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#7E9E8F] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPublicNote}
                            onChange={(e) => setIsPublicNote(e.target.checked)}
                            className="rounded border-slate-300 dark:border-[#1A3125] text-[#00C471] focus:ring-[#00C471]/20"
                          />
                          <span>Visible to complainant on tracking portal</span>
                        </label>

                        <button
                          type="submit"
                          disabled={isAddingNote || !newNote.trim()}
                          className="px-3.5 py-1.5 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isAddingNote ? 'Saving...' : 'Post Note'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          {((isSuperAdmin || can('feedback.escalate') || can('feedback.manage')) && !caseItem?.isEscalated || canManage) && (
            <div className="p-4 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] flex items-center justify-between gap-3">
              {(isSuperAdmin || can('feedback.escalate') || can('feedback.manage')) && !caseItem?.isEscalated ? (
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Escalate to Super Admin</span>
                </button>
              ) : <div />}

              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Change Case Status</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          refetch();
        }}
        caseItem={caseItem}
      />

      <EscalateModal
        isOpen={isEscalateModalOpen}
        onClose={() => {
          setIsEscalateModalOpen(false);
          refetch();
        }}
        caseItem={caseItem}
      />
    </>
  );
}
