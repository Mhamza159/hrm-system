/**
 * @file SurveyFillModal.jsx
 * @description Modal for employees to complete and submit pulse surveys (BUILD-GUIDE Row 20.4).
 */

import React, { useState } from "react";
import { X, Star, AlertCircle, ShieldCheck, Send, Check } from "lucide-react";
import { useSubmitSurveyResponseMutation } from "../rewardsApi.js";
import { toast } from "sonner";

const RATING_LABELS = {
  1: "1 • Needs Improvement",
  2: "2 • Fair",
  3: "3 • Satisfactory",
  4: "4 • Very Good",
  5: "5 • Exceptional",
};

export const SurveyFillModal = ({ isOpen, onClose, survey }) => {
  const [answers, setAnswers] = useState({});
  const [formError, setFormError] = useState("");

  const [submitSurveyResponse, { isLoading: isSubmitting }] =
    useSubmitSurveyResponseMutation();

  if (!isOpen || !survey) return null;

  const questions = survey.questions || [];
  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && String(answers[q.id]).trim() !== "",
  ).length;
  const progressPct =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  const handleRatingChange = (qId, rating) => {
    setAnswers((prev) => ({ ...prev, [qId]: rating }));
  };

  const handleTextChange = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleOptionSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Check required questions
    for (const q of questions) {
      if (
        q.required &&
        (answers[q.id] === undefined || String(answers[q.id]).trim() === "")
      ) {
        setFormError(`Please complete required question: "${q.questionText}"`);
        return;
      }
    }

    const payload = Object.entries(answers).map(
      ([questionId, answerValue]) => ({
        questionId,
        answerValue,
      }),
    );

    try {
      await submitSurveyResponse({
        surveyId: survey._id,
        answers: payload,
      }).unwrap();

      toast.success("Thank you! Your survey feedback has been recorded.");
      onClose();
      setAnswers({});
    } catch (err) {
      setFormError(
        err?.data?.message || err?.message || "Failed to submit response.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20">
                  {survey.type || "Pulse Survey"}
                </span>
                {survey.isAnonymous && (
                  <span className="text-[11px] text-[#00C471] flex items-center gap-1 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    100% Anonymous
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-base mt-1.5">
                {survey.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-[#1A3125] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00C471] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-[#7E9E8F] shrink-0">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>
        </div>

        {/* Scrollable Questions Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto flex-1"
        >
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Anonymity Banner */}
          {survey.isAnonymous && (
            <div className="p-3.5 rounded-2xl bg-[#00C471]/5 border border-[#00C471]/20 flex items-start gap-2.5 text-xs text-[#00C471]">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Confidential Feedback:</strong> Your answers are
                cryptographically hashed. No department manager or administrator
                can trace your answers back to your profile.
              </p>
            </div>
          )}

          {survey.description && (
            <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed bg-slate-50 dark:bg-[#0A110D] p-3.5 rounded-xl border border-slate-100 dark:border-[#1A3125]">
              {survey.description}
            </p>
          )}

          {/* Question Items */}
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const currentAnswer = answers[q.id];

              return (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0C1712] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                      <span className="text-[#00C471] mr-1.5 font-mono">
                        #{idx + 1}.
                      </span>
                      {q.questionText}
                      {q.required && (
                        <span className="text-rose-500 ml-1">*</span>
                      )}
                    </h4>
                  </div>

                  {/* Rating 5-Star Input */}
                  {q.questionType === "rating_5" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled =
                            currentAnswer && currentAnswer >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingChange(q.id, star)}
                              className="p-1 text-slate-300 dark:text-slate-700 hover:text-amber-400 transition-colors focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 transition-all ${
                                  isFilled
                                    ? "fill-amber-400 text-amber-400 scale-110"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {currentAnswer && (
                        <p className="text-[11px] font-semibold text-amber-500">
                          {RATING_LABELS[currentAnswer]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {q.questionType === "multiple_choice" && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt, optIdx) => {
                        const isSelected = currentAnswer === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleOptionSelect(q.id, opt)}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? "border-[#00C471] bg-[#00C471]/10 text-[#00C471] ring-1 ring-[#00C471]"
                                : "border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-[#CBD5E1] hover:border-slate-300 dark:hover:border-[#2D4A3A]"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[#00C471]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Open Qualitative Text Input */}
                  {q.questionType === "text" && (
                    <textarea
                      rows={3}
                      value={currentAnswer || ""}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder="Share your perspective or constructive suggestions..."
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-3 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all leading-relaxed placeholder:text-slate-400 dark:placeholder:text-[#7E9E8F]/60"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1A3125] transition-colors"
            >
              Save for Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>
                {isSubmitting ? "Submitting Responses..." : "Submit Feedback"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
