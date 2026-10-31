/**
 * @file AssetFormModal.jsx
 * @description Modal for registering a new asset or editing existing asset specifications.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.1)
 * - Financial Invariant: All costs entered in PKR and saved in minor currency units (paisa).
 */

import React, { useState, useEffect } from 'react';
import { X, Laptop, ShieldCheck, DollarSign, Calendar, Cpu, HardDrive } from 'lucide-react';
import { useCreateAssetMutation, useUpdateAssetMutation } from '../assetApi.js';
import { toast } from 'sonner';

const ASSET_TYPES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop PC' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'printer', label: 'Printer / Scanner' },
  { value: 'network_device', label: 'Network Device' },
  { value: 'software_license', label: 'Software License' },
  { value: 'other', label: 'Other Equipment' }
];

export const AssetFormModal = ({ isOpen, onClose, asset = null }) => {
  const isEditing = Boolean(asset?._id);

  const [formData, setFormData] = useState({
    assetTag: '',
    name: '',
    type: 'laptop',
    modelNumber: '',
    serialNumber: '',
    vendorName: '',
    purchaseDate: '',
    purchaseCostPkr: '',
    warrantyExpiresAt: '',
    licenseExpiresAt: '',
    processor: '',
    ramGb: '',
    storageGb: '',
    os: '',
    licenseKey: ''
  });

  const [formError, setFormError] = useState('');

  const [createAsset, { isLoading: isCreating }] = useCreateAssetMutation();
  const [updateAsset, { isLoading: isUpdating }] = useUpdateAssetMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (asset) {
      setFormData({
        assetTag: asset.assetTag || '',
        name: asset.name || '',
        type: asset.type || 'laptop',
        modelNumber: asset.modelNumber || '',
        serialNumber: asset.serialNumber || '',
        vendorName: asset.vendorName || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
        purchaseCostPkr: asset.purchaseCostPaisa ? (asset.purchaseCostPaisa / 100).toString() : '',
        warrantyExpiresAt: asset.warrantyExpiresAt ? asset.warrantyExpiresAt.split('T')[0] : '',
        licenseExpiresAt: asset.licenseExpiresAt ? asset.licenseExpiresAt.split('T')[0] : '',
        processor: asset.specifications?.processor || '',
        ramGb: asset.specifications?.ramGb?.toString() || '',
        storageGb: asset.specifications?.storageGb?.toString() || '',
        os: asset.specifications?.os || '',
        licenseKey: asset.specifications?.licenseKey || ''
      });
    } else {
      setFormData({
        assetTag: '',
        name: '',
        type: 'laptop',
        modelNumber: '',
        serialNumber: '',
        vendorName: '',
        purchaseDate: '',
        purchaseCostPkr: '',
        warrantyExpiresAt: '',
        licenseExpiresAt: '',
        processor: '',
        ramGb: '',
        storageGb: '',
        os: '',
        licenseKey: ''
      });
    }
    setFormError('');
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isEditing && !formData.assetTag.trim()) {
      setFormError('Asset tag is required (e.g. AST-LPT-001).');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Asset name is required.');
      return;
    }
    if (!isEditing && !formData.serialNumber.trim()) {
      setFormError('Serial number or license ID is required.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      modelNumber: formData.modelNumber.trim(),
      vendorName: formData.vendorName.trim(),
      purchaseDate: formData.purchaseDate || null,
      purchaseCostPaisa: formData.purchaseCostPkr ? Math.round(parseFloat(formData.purchaseCostPkr) * 100) : 0,
      warrantyExpiresAt: formData.warrantyExpiresAt || null,
      licenseExpiresAt: formData.licenseExpiresAt || null,
      specifications: {
        processor: formData.processor.trim(),
        ramGb: formData.ramGb ? parseInt(formData.ramGb, 10) : null,
        storageGb: formData.storageGb ? parseInt(formData.storageGb, 10) : null,
        os: formData.os.trim(),
        licenseKey: formData.licenseKey.trim()
      }
    };

    if (!isEditing) {
      payload.assetTag = formData.assetTag.toUpperCase().trim();
      payload.serialNumber = formData.serialNumber.trim();
    }

    try {
      if (isEditing) {
        await updateAsset({ id: asset._id, ...payload }).unwrap();
        toast.success(`Asset '${payload.name}' updated successfully.`);
      } else {
        await createAsset(payload).unwrap();
        toast.success(`Asset '${payload.name}' registered into inventory.`);
      }
      onClose();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to save asset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E2235]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                {isEditing ? 'Edit Asset Details' : 'Register New Asset'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Modifying specifications for ${asset.assetTag}` : 'Add company hardware or software to registry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Tag <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleChange}
                disabled={isEditing}
                placeholder="e.g. AST-LPT-001"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white uppercase font-mono disabled:opacity-60 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. ThinkPad T14 Gen 4"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Serial Number / Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                disabled={isEditing}
                placeholder="e.g. PF-29XA01"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white font-mono disabled:opacity-60 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Number
              </label>
              <input
                type="text"
                name="modelNumber"
                value={formData.modelNumber}
                onChange={handleChange}
                placeholder="e.g. 21HD0006US"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Supplier
              </label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                placeholder="e.g. Sharaf DG / Dell Direct"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Cost (PKR)
              </label>
              <input
                type="number"
                name="purchaseCostPkr"
                value={formData.purchaseCostPkr}
                onChange={handleChange}
                placeholder="e.g. 250000"
                min="0"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warranty Expiry Date
              </label>
              <input
                type="date"
                name="warrantyExpiresAt"
                value={formData.warrantyExpiresAt}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                License Expiration (If Software)
              </label>
              <input
                type="date"
                name="licenseExpiresAt"
                value={formData.licenseExpiresAt}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#1E2235]">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Hardware / Software Specs
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Processor</label>
                <input
                  type="text"
                  name="processor"
                  value={formData.processor}
                  onChange={handleChange}
                  placeholder="e.g. Core i7 13th Gen"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">RAM (GB)</label>
                <input
                  type="number"
                  name="ramGb"
                  value={formData.ramGb}
                  onChange={handleChange}
                  placeholder="e.g. 32"
                  min="1"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Storage (GB)</label>
                <input
                  type="number"
                  name="storageGb"
                  value={formData.storageGb}
                  onChange={handleChange}
                  placeholder="e.g. 512"
                  min="1"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Operating System</label>
                <input
                  type="text"
                  name="os"
                  value={formData.os}
                  onChange={handleChange}
                  placeholder="e.g. Ubuntu 24.04 LTS"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">License Key (Optional)</label>
                <input
                  type="text"
                  name="licenseKey"
                  value={formData.licenseKey}
                  onChange={handleChange}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormModal;

