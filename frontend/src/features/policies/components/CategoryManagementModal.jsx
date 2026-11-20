/**
 * @file CategoryManagementModal.jsx
 * @description Administrative modal for creating, updating, and managing policy categories.
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Shield,
  Lock,
  Briefcase,
  Heart,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../policyApi.js';

const AVAILABLE_ICONS = [
  { name: 'Shield', icon: Shield },
  { name: 'Lock', icon: Lock },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Heart', icon: Heart },
  { name: 'Clock', icon: Clock },
  { name: 'FileText', icon: FileText }
];

const PRESET_COLORS = [
  '#00C471',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#F59E0B',
  '#14B8A6',
  '#64748B'
];

export const CategoryManagementModal = ({ isOpen, onClose }) => {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery();
  const rawCategories = categoriesData?.data || (Array.isArray(categoriesData) ? categoriesData : []);
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'FileText',
    color: '#00C471'
  });
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      icon: 'FileText',
      color: '#00C471'
    });
    setErrorMessage('');
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      icon: cat.icon || 'FileText',
      color: cat.color || '#00C471'
    });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMessage('Category name and unique code are required.');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...formData,
          code: formData.code.toUpperCase().trim()
        }).unwrap();
      } else {
        await createCategory({
          ...formData,
          code: formData.code.toUpperCase().trim()
        }).unwrap();
      }
      resetForm();
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Failed to save category.');
    }
  };

  const handleDelete = async (cat) => {
    if (window.confirm(`Are you sure you want to deactivate the "${cat.name}" category?`)) {
      try {
        await deleteCategory(cat._id).unwrap();
        if (editingCategory?._id === cat._id) resetForm();
      } catch (err) {
        setErrorMessage(err?.data?.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Policy Categories
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Organize compliance documentation into department and domain categories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h4>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Information Security"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Code * (Uppercase, e.g. IT-SEC)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT-SEC"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief summary of policies belonging to this group..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
              />
            </div>

            {/* Icon and Color Swatches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Icon Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Icon
                </label>
                <div className="flex items-center gap-2">
                  {AVAILABLE_ICONS.map(({ name, icon: IconComponent }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
                        formData.icon === name
                          ? 'border-[#00C471] bg-emerald-500/10 text-[#00C471]'
                          : 'border-slate-200 dark:border-[#1A3125] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        formData.color === c ? 'border-white dark:border-white scale-110 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="h-9 px-4 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {editingCategory ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingCategory ? 'Update Category' : 'Add Category'}</span>
              </button>
            </div>
          </form>

          {/* Existing Categories Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Existing Categories ({categories.length})
            </h4>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-[#0C1712] rounded-xl border border-slate-200 dark:border-[#1A3125]">
                No categories defined yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1A3125] border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="p-3 bg-white dark:bg-[#111D17] flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#162820]/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                          borderColor: `${cat.color}30`
                        }}
                      >
                        {cat.code.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {cat.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({cat.code})
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] truncate max-w-sm">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end bg-slate-50/50 dark:bg-[#0C1712]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementModal;
