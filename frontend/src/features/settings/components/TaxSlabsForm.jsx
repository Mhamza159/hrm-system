/**
 * @file TaxSlabsForm.jsx
 * @description Pakistan Statutory Compliance Settings: FBR Tax Slabs, EOBI, PESSI & Provident Fund (Slice 2.7).
 */

import React, { useState, useEffect } from 'react';
import { Scale, Plus, Trash2, ShieldCheck, Percent, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

export function TaxSlabsForm({
  taxSlabsData = {},
  eobiData = {},
  pessiData = {},
  providentFundData = {},
  onSaved
}) {
  const [taxYear, setTaxYear] = useState(taxSlabsData.taxYear || '2024-2025');
  const [slabs, setSlabs] = useState(
    taxSlabsData.slabs && taxSlabsData.slabs.length > 0
      ? taxSlabsData.slabs.map((s) => ({
          minPKR: (s.minPaisa / 100).toString(),
          maxPKR: s.maxPaisa !== null && s.maxPaisa !== undefined ? (s.maxPaisa / 100).toString() : '',
          fixedTaxPKR: (s.fixedTaxPaisa / 100).toString(),
          ratePercent: s.ratePercent.toString()
        }))
      : [
          { minPKR: '0', maxPKR: '600000', fixedTaxPKR: '0', ratePercent: '0' },
          { minPKR: '600001', maxPKR: '1200000', fixedTaxPKR: '0', ratePercent: '5' },
          { minPKR: '1200001', maxPKR: '2200000', fixedTaxPKR: '30000', ratePercent: '15' },
          { minPKR: '2200001', maxPKR: '3200000', fixedTaxPKR: '180000', ratePercent: '25' },
          { minPKR: '3200001', maxPKR: '4100000', fixedTaxPKR: '430000', ratePercent: '30' },
          { minPKR: '4100001', maxPKR: '', fixedTaxPKR: '700000', ratePercent: '35' }
        ]
  );

  const [eobi, setEobi] = useState({
    enabled: eobiData.enabled ?? true,
    employerRatePercent: eobiData.employerRatePercent ?? 5,
    employeeRatePercent: eobiData.employeeRatePercent ?? 1,
    minWagePKR: ((eobiData.minWagePaisa || 3700000) / 100).toString()
  });

  const [pessi, setPessi] = useState({
    enabled: pessiData.enabled ?? false,
    employerRatePercent: pessiData.employerRatePercent ?? 6,
    wageCeilingPKR: ((pessiData.wageCeilingPaisa || 0) / 100).toString()
  });

  const [providentFund, setProvidentFund] = useState({
    enabled: providentFundData.enabled ?? false,
    employerPercent: providentFundData.employerPercent ?? 8.33,
    employeePercent: providentFundData.employeePercent ?? 8.33
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (taxSlabsData?.slabs?.length > 0) {
      setTaxYear(taxSlabsData.taxYear || '2024-2025');
      setSlabs(
        taxSlabsData.slabs.map((s) => ({
          minPKR: (s.minPaisa / 100).toString(),
          maxPKR: s.maxPaisa !== null && s.maxPaisa !== undefined ? (s.maxPaisa / 100).toString() : '',
          fixedTaxPKR: (s.fixedTaxPaisa / 100).toString(),
          ratePercent: s.ratePercent.toString()
        }))
      );
    }
    if (eobiData) {
      setEobi({
        enabled: eobiData.enabled ?? true,
        employerRatePercent: eobiData.employerRatePercent ?? 5,
        employeeRatePercent: eobiData.employeeRatePercent ?? 1,
        minWagePKR: ((eobiData.minWagePaisa || 3700000) / 100).toString()
      });
    }
    if (pessiData) {
      setPessi({
        enabled: pessiData.enabled ?? false,
        employerRatePercent: pessiData.employerRatePercent ?? 6,
        wageCeilingPKR: ((pessiData.wageCeilingPaisa || 0) / 100).toString()
      });
    }
    if (providentFundData) {
      setProvidentFund({
        enabled: providentFundData.enabled ?? false,
        employerPercent: providentFundData.employerPercent ?? 8.33,
        employeePercent: providentFundData.employeePercent ?? 8.33
      });
    }
  }, [taxSlabsData, eobiData, pessiData, providentFundData]);

  const handleSlabChange = (index, field, value) => {
    setSlabs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    const nextMin = lastSlab && lastSlab.maxPKR ? (parseInt(lastSlab.maxPKR, 10) + 1).toString() : '0';
    setSlabs((prev) => [
      ...prev,
      { minPKR: nextMin, maxPKR: '', fixedTaxPKR: '0', ratePercent: '0' }
    ]);
  };

  const removeSlab = (index) => {
    if (slabs.length === 1) {
      toast.error('At least one tax slab bracket is required');
      return;
    }
    setSlabs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Process Tax Slabs into integer paisa
      const processedSlabs = slabs.map((s) => ({
        minPaisa: Math.round(parseFloat(s.minPKR || '0') * 100),
        maxPaisa: s.maxPKR !== '' ? Math.round(parseFloat(s.maxPKR) * 100) : null,
        fixedTaxPaisa: Math.round(parseFloat(s.fixedTaxPKR || '0') * 100),
        ratePercent: parseFloat(s.ratePercent || '0')
      }));

      await updateSetting({
        key: 'taxSlabs',
        value: { taxYear, slabs: processedSlabs },
        description: 'Updated FBR progressive salaried tax brackets'
      }).unwrap();

      // 2. Process EOBI
      await updateSetting({
        key: 'eobi',
        value: {
          enabled: eobi.enabled,
          employerRatePercent: parseFloat(eobi.employerRatePercent),
          employeeRatePercent: parseFloat(eobi.employeeRatePercent),
          minWagePaisa: Math.round(parseFloat(eobi.minWagePKR || '37000') * 100)
        },
        description: 'Updated EOBI statutory deduction rates'
      }).unwrap();

      // 3. Process PESSI
      await updateSetting({
        key: 'pessi',
        value: {
          enabled: pessi.enabled,
          employerRatePercent: parseFloat(pessi.employerRatePercent),
          wageCeilingPaisa: Math.round(parseFloat(pessi.wageCeilingPKR || '0') * 100)
        },
        description: 'Updated PESSI provincial social security parameters'
      }).unwrap();

      // 4. Process Provident Fund
      await updateSetting({
        key: 'providentFund',
        value: {
          enabled: providentFund.enabled,
          employerPercent: parseFloat(providentFund.employerPercent),
          employeePercent: parseFloat(providentFund.employeePercent)
        },
        description: 'Updated provident fund contributions'
      }).unwrap();

      toast.success('Statutory tax & compliance parameters saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to save statutory compliance settings');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* FBR Salaried Slabs Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              Pakistan FBR Salaried Income Tax Slabs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Annual progressive tax brackets per Finance Act. Monthly withholding = Annual Tax / 12.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tax Year:</span>
            <input
              type="text"
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value)}
              className="w-28 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-center"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Slab #</th>
                <th className="px-4 py-3">Min Salary (PKR)</th>
                <th className="px-4 py-3">Max Salary (PKR)</th>
                <th className="px-4 py-3">Fixed Tax (PKR)</th>
                <th className="px-4 py-3">Tax Rate (%)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {slabs.map((slab, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-4 py-2.5 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="0"
                      value={slab.minPKR}
                      onChange={(e) => handleSlabChange(idx, 'minPKR', e.target.value)}
                      className="w-32 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Above / No Limit"
                      value={slab.maxPKR}
                      onChange={(e) => handleSlabChange(idx, 'maxPKR', e.target.value)}
                      className="w-36 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="0"
                      value={slab.fixedTaxPKR}
                      onChange={(e) => handleSlabChange(idx, 'fixedTaxPKR', e.target.value)}
                      className="w-28 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={slab.ratePercent}
                        onChange={(e) => handleSlabChange(idx, 'ratePercent', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
                      />
                      <span className="font-semibold text-slate-400">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeSlab(idx)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addSlab}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tax Slab Bracket
        </button>
      </div>

      {/* Statutory Contributions Cards (EOBI, PESSI, PF) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* EOBI Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">EOBI (Employees' Old-Age Benefits)</h4>
            <input
              type="checkbox"
              checked={eobi.enabled}
              onChange={(e) => setEobi((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                Minimum Wage Baseline (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={eobi.minWagePKR}
                onChange={(e) => setEobi((prev) => ({ ...prev, minWagePKR: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                  Employer (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={eobi.employerRatePercent}
                  onChange={(e) => setEobi((prev) => ({ ...prev, employerRatePercent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                  Employee (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={eobi.employeeRatePercent}
                  onChange={(e) => setEobi((prev) => ({ ...prev, employeeRatePercent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PESSI Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">PESSI (Social Security)</h4>
            <input
              type="checkbox"
              checked={pessi.enabled}
              onChange={(e) => setPessi((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                Employer Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={pessi.employerRatePercent}
                onChange={(e) => setPessi((prev) => ({ ...prev, employerRatePercent: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                Wage Ceiling (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={pessi.wageCeilingPKR}
                onChange={(e) => setPessi((prev) => ({ ...prev, wageCeilingPKR: e.target.value }))}
                placeholder="0 for uncapped"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Provident Fund Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Provident Fund (PF)</h4>
            <input
              type="checkbox"
              checked={providentFund.enabled}
              onChange={(e) => setProvidentFund((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                Employer (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={providentFund.employerPercent}
                onChange={(e) => setProvidentFund((prev) => ({ ...prev, employerPercent: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                Employee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={providentFund.employeePercent}
                onChange={(e) => setProvidentFund((prev) => ({ ...prev, employeePercent: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Statutory Settings...' : 'Save Statutory & Tax Settings'}
        </button>
      </div>
    </form>
  );
}
