/**
 * @file SurveyFillModal.jsx
 * @description Modal for employees to complete and submit pulse surveys (BUILD-GUIDE Row 20.4).
 */

import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle2, ShieldCheck, Send } from 'lucide-react';
import { useSubmitSurveyResponseMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

export const SurveyFillModal = ({ isOpen, onClose, survey }) => {
  const [answers, setAnswers] = useState({});
  const [formError, setFormError] = useState('');

  const [submitSurveyResponse, { isLoading: isSubmitting }] = useSubmitSurveyResponseMutation();

  if (!isOpen || !survey) return null;

  const handleRatingChange = (qId, rating) => {
    setAnswers((prev) => ({ ...prev, [qId]: rating }));
  };

  const handleTextChange = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Check required questions
    for (const q of survey.questions || []) {
      if (q.required && (!answers[q.id] || String(answers[q.id]).trim() === '')) {
        setFormError(`Please provide an answer for: "${q.questionText}"`);
        return;
      }
    }

    const payload = Object.entries(answers).map(([questionId, answerValue]) => ({
      questionId,
      answerValue
    }));

    try {
      await submitSurveyResponse({
        surveyId: survey._id,
        answers: payload
      }).unwrap();

      toast.success('Thank you! Your survey feedback has been recorded.');
      onClose();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to submit response.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Pulse Survey
              </span>
              {survey.isAnonymous && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  100% Anonymous
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base mt-1">
              {survey.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Questions Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {survey.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {survey.description}
            </p>
          )}

          <div className="space-y-6">
            {(survey.questions || []).map((q, idx) => (
              <div key={q.id} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <span className="text-primary font-bold mr-1.5">{idx + 1}.</span>
                  {q.questionText}
                  {q.required && <span className="text-rose-500 ml-1">*</span>}
                </label>

                {q.questionType === 'rating_5' ? (
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isSelected = answers[q.id] >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => handleRatingChange(q.id, starVal)}
                          className="p-2 rounded-xl transition-all hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              isSelected
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs text-slate-400 ml-2">
                      {answers[q.id] ? `${answers[q.id]} of 5 stars` : 'Select rating'}
                    </span>
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Type your candid feedback..."
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none"
                  />
                )}
              </div>
            ))}
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
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
