/**
 * @file CompanyForm.jsx
 * @description Company Profile Information & Logo Upload Form (Slice 2.2).
 */

import React, { useState, useEffect } from 'react';
import { Building2, Upload, Globe, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadLogoMutation, useUpdateSettingMutation } from '../settingsApi.js';

export function CompanyForm({ initialData = {}, onSaved }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    address: initialData.address || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    website: initialData.website || '',
    ntn: initialData.ntn || '',
    strn: initialData.strn || '',
    logoUrl: initialData.logoUrl || ''
  });

  const [previewUrl, setPreviewUrl] = useState(initialData.logoUrl || '');
  const [selectedFile, setSelectedFile] = useState(null);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation();
  const [uploadLogo, { isLoading: isUploading }] = useUploadLogoMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        website: initialData.website || '',
        ntn: initialData.ntn || '',
        strn: initialData.strn || '',
        logoUrl: initialData.logoUrl || ''
      });
      setPreviewUrl(initialData.logoUrl || '');
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2 MB limit');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadLogoOnly = async () => {
    if (!selectedFile) return;
    try {
      const data = new FormData();
      data.append('logo', selectedFile);
      const res = await uploadLogo(data).unwrap();
      const newUrl = res.data?.logoUrl || res.data?.company?.logoUrl;
      setFormData((prev) => ({ ...prev, logoUrl: newUrl }));
      toast.success('Company logo uploaded successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to upload logo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let currentLogoUrl = formData.logoUrl;

      // Upload logo first if new file is selected
      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('logo', selectedFile);
        const res = await uploadLogo(fileData).unwrap();
        currentLogoUrl = res.data?.logoUrl || res.data?.company?.logoUrl;
      }

      const payload = {
        ...formData,
        logoUrl: currentLogoUrl
      };

      await updateSetting({
        key: 'company',
        value: payload,
        description: 'Updated company legal entity profile'
      }).unwrap();

      toast.success('Company profile updated successfully');
      setSelectedFile(null);
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to save company profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand & Logo Uploader Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-emerald-500" />
          Company Identity & Brand Logo
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden shrink-0 relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Company Logo Preview"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Building2 className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Select Logo File
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleUploadLogoOnly}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {isUploading ? 'Uploading...' : 'Upload Now'}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supported formats: PNG, JPEG, SVG, WEBP. Maximum file size: 2 MB. Rendered in navigation header and payslips.
            </p>
          </div>
        </div>
      </div>

      {/* Corporate Entity Details Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" />
          Legal Entity & Registration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Company Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Starlight Software Ltd"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              National Tax Number (NTN) *
            </label>
            <input
              type="text"
              name="ntn"
              required
              value={formData.ntn}
              onChange={handleChange}
              placeholder="e.g. 7284910-3"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sales Tax Registration Number (STRN)
            </label>
            <input
              type="text"
              name="strn"
              value={formData.strn}
              onChange={handleChange}
              placeholder="e.g. 12-34-5678-901-23"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Website
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://company.pk"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Support Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="hr@company.pk"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 51 1234567"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Registered Office Address *
          </label>
          <textarea
            name="address"
            required
            rows={3}
            value={formData.address}
            onChange={handleChange}
            placeholder="Plot / Street / Sector, City, Postal Code, Pakistan"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving Changes...' : 'Save Company Profile'}
        </button>
      </div>
    </form>
  );
}
