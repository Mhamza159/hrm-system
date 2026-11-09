/**
 * @file SurveyBuilderModal.jsx
 * @description Modal for designing and launching company pulse surveys and polls (BUILD-GUIDE Row 20.4).
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, HelpCircle, AlertCircle, BarChart2 } from 'lucide-react';
import { useCreateSurveyMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

export const SurveyBuilderModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pulse');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [targetAudience, setTargetAudience] = useState('company');
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      questionText: 'How satisfied are you with our workplace culture and support?',
      questionType: 'rating_5',
      required: true,
      options: []
    }
  ]);
  const [formError, setFormError] = useState('');

  const [createSurvey, { isLoading: isSubmitting }] = useCreateSurveyMutation();

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const nextId = `q${questions.length + 1}_${Date.now()}`;
    setQuestions([
      ...questions,
      {
        id: nextId,
        questionText: '',
        questionType: 'rating_5',
        required: true,
        options: []
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      toast.error('Survey must have at least one question.');
      return;
    }
    const updated = [...questions];
    updated.splice(idx, 1);
    setQuestions(updated);
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Survey title is required.');
      return;
    }

    if (!expiresAt) {
      setFormError('Please specify an expiration date.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setFormError(`Question #${i + 1} text cannot be empty.`);
        return;
      }
    }

    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim(),
        type,
        isAnonymous,
        targetAudience,
        expiresAt: new Date(expiresAt).toISOString(),
        questions
      }).unwrap();

      toast.success('Survey launched successfully!');
      onClose();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to create survey.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Create Pulse Survey or Poll
              </h3>
              <p className="text-xs text-slate-500">Collect anonymous employee feedback and pulse metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Survey Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 2026 Employee Satisfaction & Wellness Check"
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Survey Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="pulse">Pulse Survey (Frequent)</option>
                <option value="poll">Quick Poll</option>
                <option value="quarterly">Quarterly Review</option>
                <option value="culture">Culture & Wellbeing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Expiration Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the purpose of this survey to employees..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Anonymity Notice */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnonymousCheck"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded text-primary border-slate-300 focus:ring-primary"
              />
              <label htmlFor="isAnonymousCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Strict Anonymous Responses (Cryptographically masked)
              </label>
            </div>
            <span className="text-[10px] text-slate-400">Guarantees zero identity tracing</span>
          </div>

          {/* Questions Builder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Survey Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={q.questionType}
                      onChange={(e) => handleQuestionChange(idx, 'questionType', e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                    >
                      <option value="rating_5">Rating Scale (1 - 5 Stars)</option>
                      <option value="text">Open Feedback (Free Text)</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleQuestionChange(idx, 'required', e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-primary"
                      />
                      <span>Required</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Survey'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
