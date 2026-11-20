/**
 * @file GiveKudosModal.jsx
 * @description Modal for sending peer recognition kudos and badges (BUILD-GUIDE Row 20.2).
 */

import React, { useState } from "react";
import {
  X,
  Sparkles,
  AlertCircle,
  Heart,
  Star,
  Award,
  Zap,
  Lightbulb,
  Users,
  Target,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCreateKudosMutation } from "../rewardsApi.js";
import { useGetEmployeesQuery } from "../../employees/employeesApi.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { toast } from "sonner";

const BADGE_OPTIONS = [
  {
    name: "Team Player",
    icon: Users,
    desc: "Outstanding collaboration & team support",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    name: "Problem Solver",
    icon: Lightbulb,
    desc: "Creative solutions & critical debugging",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    name: "Customer Hero",
    icon: Heart,
    desc: "Client obsession & empathy champion",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  {
    name: "Innovation Champ",
    icon: Zap,
    desc: "Bold ideas & process modernization",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    name: "Leadership Star",
    icon: Star,
    desc: "Inspiring guidance & proactive ownership",
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  {
    name: "Above & Beyond",
    icon: Target,
    desc: "Exceeding targets & heroic dedication",
    color: "text-[#00C471] bg-[#00C471]/10 border-[#00C471]/20",
  },
  {
    name: "Rockstar",
    icon: Award,
    desc: "Exceptional milestone & overall excellence",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
];

export const GiveKudosModal = ({
  isOpen,
  onClose,
  initialReceiverId = "",
  initialBadge = "Rockstar",
}) => {
  const { user } = useAuth();
  const [receiverId, setReceiverId] = useState(initialReceiverId);
  const [selectedBadge, setSelectedBadge] = useState(initialBadge);
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [formError, setFormError] = useState("");

  const { data: employeesRes, isLoading: isLoadingEmps } = useGetEmployeesQuery(
    { limit: 200, status: "Active" },
    { skip: !isOpen },
  );

  const [createKudos, { isLoading: isSubmitting }] = useCreateKudosMutation();

  // Synchronize when opening with new props
  const [lastOpen, setLastOpen] = useState(false);
  if (isOpen && !lastOpen) {
    setLastOpen(true);
    if (initialReceiverId) setReceiverId(initialReceiverId);
    if (initialBadge) setSelectedBadge(initialBadge);
    setFormError("");
  } else if (!isOpen && lastOpen) {
    setLastOpen(false);
  }

  if (!isOpen) return null;

  const rawList =
    employeesRes?.data?.items ||
    employeesRes?.data?.employees ||
    employeesRes?.data ||
    [];
  const employees = Array.isArray(rawList) ? rawList : [];

  // Exclude current user from recipient options to prevent self-kudos
  const currentUserId = user?._id?.toString();
  const currentEmpId = user?.employeeId?.toString();
  const availableEmployees = employees.filter((emp) => {
    const empIdStr = emp._id?.toString();
    const empUserIdStr = emp.userId?.toString();
    return empIdStr !== currentEmpId && empUserIdStr !== currentUserId;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!receiverId) {
      setFormError("Please select a colleague to appreciate.");
      return;
    }

    if (!message || message.trim().length < 5) {
      setFormError("Appreciation message must be at least 5 characters.");
      return;
    }

    try {
      await createKudos({
        receiverId,
        badge: selectedBadge,
        message: message.trim(),
        isPublic,
      }).unwrap();

      toast.success("Kudos posted to appreciation wall!");
      onClose();
      setReceiverId("");
      setMessage("");
    } catch (err) {
      setFormError(
        err?.data?.message || err?.message || "Failed to post kudos.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-xl border border-[#00C471]/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base">
                Send Peer Appreciation
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Celebrate a colleague's contributions, teamwork, and great work
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              Select Colleague <span className="text-rose-500">*</span>
            </label>
            {isLoadingEmps ? (
              <div className="py-2.5 text-xs text-slate-400 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00C471] border-t-transparent" />
                <span>Loading colleagues...</span>
              </div>
            ) : (
              <select
                required
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
              >
                <option value="">-- Choose Colleague --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name ||
                      `${emp.firstName || ""} ${emp.lastName || ""}`.trim()}{" "}
                    • {emp.designation || "Team Member"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              Recognition Badge <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BADGE_OPTIONS.map((badge) => {
                const Icon = badge.icon;
                const isSelected = selectedBadge === badge.name;

                return (
                  <button
                    key={badge.name}
                    type="button"
                    onClick={() => setSelectedBadge(badge.name)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#00C471] bg-[#00C471]/10 ring-1 ring-[#00C471]"
                        : "border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] hover:border-slate-300 dark:hover:border-[#2D4A3A]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 ${badge.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {badge.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-[#7E9E8F] truncate">
                        {badge.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Appreciation Message <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-[#7E9E8F] font-mono">
                {message.length}/500
              </span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Huge shoutout for helping resolve the client production incident swiftly today!"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] p-3 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all leading-relaxed placeholder:text-slate-400 dark:placeholder:text-[#7E9E8F]/60"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Eye className="h-4 w-4 text-[#00C471]" />
              ) : (
                <EyeOff className="h-4 w-4 text-slate-400" />
              )}
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {isPublic ? "Public on Wall" : "Direct Recognition"}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-[#7E9E8F]">
                  {isPublic
                    ? "Visible to the entire company on the Appreciation Wall"
                    : "Sent privately to recipient"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isPublic
                  ? "bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30"
                  : "bg-slate-200 dark:bg-[#1A3125] text-slate-600 dark:text-[#CBD5E1]"
              }`}
            >
              {isPublic ? "Public" : "Private"}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1A3125] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || !receiverId || message.trim().length < 5
              }
              className="px-5 py-2 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "Sending..." : "Send Kudos"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
