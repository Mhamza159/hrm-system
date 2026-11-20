/**
 * @file SurveyBuilderModal.jsx
 * @description Modal for designing and launching company pulse surveys and polls (BUILD-GUIDE Row 20.4).
 */

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  BarChart2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useCreateSurveyMutation } from "../rewardsApi.js";
import { useGetDepartmentsQuery } from "../../departments/departmentsApi.js";
import { toast } from "sonner";

export const SurveyBuilderModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("pulse"); // 'pulse' | 'poll' | 'quarterly' | 'culture'
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [targetAudience, setTargetAudience] = useState("company"); // 'company' | 'department'
  const [departmentId, setDepartmentId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [questions, setQuestions] = useState([
    {
      id: "q1",
      questionText:
        "How satisfied are you with our workplace culture and support?",
      questionType: "rating_5",
      required: true,
      options: [],
    },
  ]);
  const [formError, setFormError] = useState("");

  const { data: deptRes } = useGetDepartmentsQuery(undefined, {
    skip: !isOpen,
  });
  const departments = deptRes?.data || [];

  const [createSurvey, { isLoading: isSubmitting }] = useCreateSurveyMutation();

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const nextId = `q${questions.length + 1}_${Date.now()}`;
    setQuestions([
      ...questions,
      {
        id: nextId,
        questionText: "",
        questionType: "rating_5",
        required: true,
        options: [],
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      toast.error("Survey must contain at least one question.");
      return;
    }
    const updated = [...questions];
    updated.splice(idx, 1);
    setQuestions(updated);
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    if (
      field === "questionType" &&
      value === "multiple_choice" &&
      (!updated[idx].options || updated[idx].options.length === 0)
    ) {
      updated[idx].options = ["Option 1", "Option 2"];
    }
    setQuestions(updated);
  };

  const handleAddOption = (qIdx) => {
    const updated = [...questions];
    const opts = updated[qIdx].options || [];
    updated[qIdx].options = [...opts, `Option ${opts.length + 1}`];
    setQuestions(updated);
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    const updated = [...questions];
    const opts = [...(updated[qIdx].options || [])];
    opts.splice(optIdx, 1);
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIdx, optIdx, val) => {
    const updated = [...questions];
    const opts = [...(updated[qIdx].options || [])];
    opts[optIdx] = val;
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Survey title is required.");
      return;
    }

    if (!expiresAt) {
      setFormError("Please specify an expiration date.");
      return;
    }

    if (new Date(expiresAt) <= new Date()) {
      setFormError("Expiration date must be in the future.");
      return;
    }

    if (targetAudience === "department" && !departmentId) {
      setFormError("Please choose the target department for this survey.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setFormError(`Question #${i + 1} text cannot be empty.`);
        return;
      }
      if (questions[i].questionType === "multiple_choice") {
        const opts = questions[i].options || [];
        if (opts.length < 2) {
          setFormError(
            `Question #${i + 1} (Multiple Choice) must have at least 2 options.`,
          );
          return;
        }
      }
    }

    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim(),
        type,
        isAnonymous,
        targetAudience,
        departmentId: targetAudience === "department" ? departmentId : null,
        expiresAt: new Date(expiresAt).toISOString(),
        questions,
      }).unwrap();

      toast.success("Survey launched successfully!");
      onClose();
    } catch (err) {
      setFormError(
        err?.data?.message || err?.message || "Failed to create survey.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-xl border border-[#00C471]/20">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base">
                Create Pulse Survey or Poll
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Design questions, target groups, and configure anonymous
                response tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              Survey Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Company Sentiment & Leadership Support"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              Description & Context (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief explanation of how feedback will be used to improve company culture..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] p-3 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all leading-relaxed placeholder:text-slate-400 dark:placeholder:text-[#7E9E8F]/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Survey Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              >
                <option value="pulse">Pulse Survey</option>
                <option value="poll">Quick Poll</option>
                <option value="quarterly">Quarterly Review</option>
                <option value="culture">Culture Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              >
                <option value="company">All Company</option>
                <option value="department">Specific Department</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Expiration Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3 py-2.5 text-slate-900 dark:text-[#F8FAFC] font-mono focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>
          </div>

          {targetAudience === "department" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#00C471]" />
                <span>
                  Select Target Department{" "}
                  <span className="text-rose-500">*</span>
                </span>
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Anonymity Checkbox */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#00C471]" />
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Cryptographic Anonymity Guarantee
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">
                  Responses are anonymized with salted hash tokens; user IDs are
                  not saved.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded text-[#00C471] focus:ring-[#00C471] border-slate-300 dark:border-[#1A3125]"
            />
          </div>

          {/* Questions Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                Survey Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#00C471]/10 text-[#00C471] hover:bg-[#00C471]/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-[#00C471]">
                      Question #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={q.questionText}
                    onChange={(e) =>
                      handleQuestionChange(idx, "questionText", e.target.value)
                    }
                    placeholder="Enter question text..."
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471]"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                        Type:
                      </span>
                      <select
                        value={q.questionType}
                        onChange={(e) =>
                          handleQuestionChange(
                            idx,
                            "questionType",
                            e.target.value,
                          )
                        }
                        className="text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-2.5 py-1.5 text-slate-900 dark:text-[#F8FAFC]"
                      >
                        <option value="rating_5">5-Star Rating Scale</option>
                        <option value="multiple_choice">
                          Multiple Choice Poll
                        </option>
                        <option value="text">Open Qualitative Text</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#CBD5E1] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          handleQuestionChange(
                            idx,
                            "required",
                            e.target.checked,
                          )
                        }
                        className="h-3.5 w-3.5 rounded text-[#00C471] focus:ring-[#00C471]"
                      />
                      <span>Mandatory Question</span>
                    </label>
                  </div>

                  {/* Multiple Choice Options Builder */}
                  {q.questionType === "multiple_choice" && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1A3125]">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1]">
                        Answer Options:
                      </span>
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              handleOptionTextChange(
                                idx,
                                optIdx,
                                e.target.value,
                              )
                            }
                            className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3 py-1.5 text-slate-900 dark:text-[#F8FAFC]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx, optIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddOption(idx)}
                        className="text-[11px] font-semibold text-[#00C471] hover:underline"
                      >
                        + Add another option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1A3125] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <BarChart2 className="h-4 w-4" />
              <span>
                {isSubmitting ? "Publishing Survey..." : "Publish Survey"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
