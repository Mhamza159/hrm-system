/**
 * @file PolicyUploadModal.jsx
 * @description Policy Document & Handbook Ingestion Modal for HR Managers (Module M16 / Row 16.1).
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.1)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUploadPolicyDocMutation } from '../chatbotApi.js';
import { toast } from 'sonner';

export const PolicyUploadModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [uploadPolicyDoc, { isLoading }] = useUploadPolicyDocMutation();

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('File size must not exceed 10MB.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
      if (!title) {
        // Auto-fill title from filename
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Policy document title is required.');
      return;
    }
    if (!selectedFile) {
      setErrorMsg('Please select a document file (.pdf, .doc, .docx, or .txt).');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('file', selectedFile);

      await uploadPolicyDoc(formData).unwrap();
      toast.success('Policy document uploaded and indexed successfully!');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to upload policy document.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111D17] border border-[#1A3125] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A3125] bg-[#0E1713]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00C471]/10 text-[#00C471]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Upload Policy Document</h3>
              <p className="text-xs text-gray-400">Ingest handbook files for Chatbot AI grounding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1A3125]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Document Title <span className="text-[#00C471]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee Leave Policy 2026"
              className="w-full px-3 py-2 text-sm bg-[#1A3125]/40 border border-[#1A3125] rounded-lg text-white focus:outline-none focus:border-[#00C471] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Handbook Category <span className="text-[#00C471]">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A3125]/40 border border-[#1A3125] rounded-lg text-white focus:outline-none focus:border-[#00C471] transition-colors"
            >
              <option value="General" className="bg-[#111D17]">General</option>
              <option value="Leave" className="bg-[#111D17]">Leave & Time-Off</option>
              <option value="Attendance" className="bg-[#111D17]">Attendance & Timings</option>
              <option value="Conduct" className="bg-[#111D17]">Code of Conduct</option>
              <option value="Benefits" className="bg-[#111D17]">Employee Benefits</option>
              <option value="Travel" className="bg-[#111D17]">Travel & Expense Policy</option>
              <option value="Security" className="bg-[#111D17]">Security & Confidentiality</option>
              <option value="Probation" className="bg-[#111D17]">Probation & Confirmation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Brief Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of contents covered in this document..."
              className="w-full px-3 py-2 text-sm bg-[#1A3125]/40 border border-[#1A3125] rounded-lg text-white focus:outline-none focus:border-[#00C471] transition-colors resize-none"
            />
          </div>

          {/* File Drag & Drop / Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Document File (PDF, DOC, DOCX, TXT up to 10MB) <span className="text-[#00C471]">*</span>
            </label>
            <div className="relative border-2 border-dashed border-[#1A3125] hover:border-[#00C471]/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#0E1713]/40">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                <FileText className="w-8 h-8 text-[#00C471]/80" />
                {selectedFile ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#00C471] font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-200">
                      Click to browse or drop handbook document here
                    </p>
                    <p className="text-[11px] text-gray-500">PDF, Word, or plain text</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-[#1A3125]/40 hover:bg-[#1A3125] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-medium text-black bg-[#00C471] hover:bg-[#00C471]/90 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? 'Ingesting Document...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

