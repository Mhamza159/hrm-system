/**
 * @file DocumentUploadModal.jsx
 * @description Modal dialog for uploading employee verification documents.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.9)
 * - Supported types: CNIC Copy, Degree Certificate, Employment Contract, NDA, Experience Letter, Other.
 * - Formats: PDF, PNG, JPG, WEBP (Max 5MB).
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { useUploadDocumentMutation } from '../employeesApi.js';

export function DocumentUploadModal({ isOpen, onClose, employeeId }) {
  const [docType, setDocType] = useState('Employment Contract');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!title.trim()) {
      toast.error('Document title is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', docType);
      formData.append('title', title.trim());
      formData.append('file', file);

      await uploadDocument({ id: employeeId, formData }).unwrap();
      toast.success('Document uploaded successfully');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#111D17] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shadow-2xs">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload to Document Vault</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all cursor-pointer"
            >
              <option value="CNIC Copy">CNIC Copy</option>
              <option value="Degree Certificate">Degree Certificate</option>
              <option value="Employment Contract">Employment Contract</option>
              <option value="NDA">Non-Disclosure Agreement (NDA)</option>
              <option value="Experience Letter">Experience Letter</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Appointment Letter 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Attachment <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-950/60 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] rounded-xl p-1.5 text-slate-700 dark:text-slate-300"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              PDF, PNG, JPG up to 5MB.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00ad64] text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                'Upload Attachment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
