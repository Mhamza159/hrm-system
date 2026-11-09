/**
 * @file CaseDetailsDrawer.jsx
 * @description Slide-over drawer for inspecting and managing a grievance case (BUILD-GUIDE Row 21.2 & 21.5).
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  User,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  MessageSquare,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useAddCaseNoteMutation, useGetFeedbackByIdQuery } from '../feedbackApi.js';
import StatusChangeModal from './StatusChangeModal.jsx';
import EscalateModal from './EscalateModal.jsx';

export default function CaseDetailsDrawer({ isOpen, onClose, caseId }) {
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
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                  {caseItem?.trackingCode || 'LOADING...'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Case Details
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading || !caseItem ? (
              <div className="py-20 text-center text-slate-400">Loading case file...</div>
            ) : (
              <>
                {/* Meta summary card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {caseItem.title}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      caseItem.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : caseItem.status === 'Escalated'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block font-medium">Category</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {caseItem.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Priority</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {caseItem.priority}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Complainant</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {caseItem.isAnonymous ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-emerald-500" />
                            Anonymous
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            {caseItem.submittedBy?.name || 'Named Employee'}
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Department</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {caseItem.departmentId?.name || 'General'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Created Date</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Escalated</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {caseItem.isEscalated ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Original Description */}
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                    Case Narrative & Evidence
                  </h4>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {caseItem.description}
                  </div>
                </div>

                {/* Resolution note banner if resolved */}
                {caseItem.resolutionNote && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                      Final Resolution Findings
                    </span>
                    <p className="text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">
                      {caseItem.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Case Notes & Timeline */}
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Investigation Notes & Log ({caseItem.caseNotes?.length || 0})</span>
                  </h4>

                  <div className="space-y-3 mb-4">
                    {caseItem.caseNotes?.map((note) => (
                      <div
                        key={note._id}
                        className={`p-3.5 rounded-xl border text-sm ${
                          note.isPublicToComplainant
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {note.authorId?.name || note.authorRole || 'Investigator'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              note.isPublicToComplainant
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            }`}>
                              {note.isPublicToComplainant ? 'Shared with Complainant' : 'Internal Only'}
                            </span>
                            <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add note box */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an investigation note, interview update, or finding..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                    />

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublicNote}
                          onChange={(e) => setIsPublicNote(e.target.checked)}
                          className="rounded border-slate-300 text-primary focus:ring-primary/20"
                        />
                        <span>Visible to complainant on tracking portal</span>
                      </label>

                      <button
                        type="submit"
                        disabled={isAddingNote || !newNote.trim()}
                        className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isAddingNote ? 'Saving...' : 'Post Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsEscalateModalOpen(true)}
              className="px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              Escalate to Super Admin
            </button>

            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Change Case Status
            </button>
          </div>
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
