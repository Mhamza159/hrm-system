/**
 * @file SkillsQualificationsCard.jsx
 * @description Card managing self-service professional skills taxonomy tags.
 * 
 * SPECIFICATION & CAPABILITY:
 * - Module: M3 Employee Management / Skills Matrix
 * - Self-service mutation via `updateSkills` endpoint with optimistic tag updates.
 */

import React, { useState } from 'react';
import { Tag, Plus, X, Loader2 } from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';

export function SkillsQualificationsCard({
  skills = [],
  onAddSkill,
  onRemoveSkill,
  isUpdating = false
}) {
  const [newSkill, setNewSkill] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSkill.trim() || isUpdating) return;
    onAddSkill(newSkill.trim());
    setNewSkill('');
  };

  return (
    <Card className="p-5 border-slate-200 dark:border-[#1A3125] dark:bg-[#111D17] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
          <Tag className="w-4 h-4 text-[#00C471]" />
          <span>Professional Skills & Competencies</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00C471] bg-emerald-50 dark:bg-[#162820] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
          Self-Managed
        </span>
      </div>

      {/* Skills Badges List */}
      <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
        {skills.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic">
            No professional skills or certifications added yet.
          </span>
        ) : (
          skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60 transition-colors"
            >
              {skill}
              <button
                type="button"
                onClick={() => onRemoveSkill(skill)}
                disabled={isUpdating}
                className="hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer disabled:opacity-50"
                title={`Remove ${skill}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Skill Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
        <input
          type="text"
          placeholder="Add a new skill (e.g. React, Node.js, MERN)..."
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          disabled={isUpdating}
          className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] dark:bg-[#0B1A13] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/40"
        />
        <button
          type="submit"
          disabled={isUpdating || !newSkill.trim()}
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-[#162820] dark:border dark:border-[#1A3125] hover:bg-slate-800 dark:hover:bg-[#1E362B] text-white dark:text-[#00C471] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Add
        </button>
      </form>
    </Card>
  );
}
