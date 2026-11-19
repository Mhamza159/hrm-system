/**
 * @file TaxSlabsForm.jsx
 * @description Pakistan Statutory Compliance Settings: FBR Progressive Tax Slabs, EOBI, PESSI, PF & Live Simulator (Slice 2.7).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  ShieldCheck,
  Percent,
  HelpCircle,
  CheckCircle2,
  PlayCircle,
  Calculator,
  RefreshCw,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

// Official Pakistan FBR Salaried Slabs Presets
const FBR_PRESETS = {
  '2024-2025': [
    { minPKR: '0', maxPKR: '600000', fixedTaxPKR: '0', ratePercent: '0' },
    { minPKR: '600001', maxPKR: '1200000', fixedTaxPKR: '0', ratePercent: '5' },
    { minPKR: '1200001', maxPKR: '2200000', fixedTaxPKR: '30000', ratePercent: '15' },
    { minPKR: '2200001', maxPKR: '3200000', fixedTaxPKR: '180000', ratePercent: '25' },
    { minPKR: '3200001', maxPKR: '4100000', fixedTaxPKR: '430000', ratePercent: '30' },
    { minPKR: '4100001', maxPKR: '', fixedTaxPKR: '700000', ratePercent: '35' }
  ],
  '2025-2026': [
    { minPKR: '0', maxPKR: '600000', fixedTaxPKR: '0', ratePercent: '0' },
    { minPKR: '600001', maxPKR: '1200000', fixedTaxPKR: '0', ratePercent: '5' },
    { minPKR: '1200001', maxPKR: '2200000', fixedTaxPKR: '30000', ratePercent: '15' },
    { minPKR: '2200001', maxPKR: '3200000', fixedTaxPKR: '180000', ratePercent: '25' },
    { minPKR: '3200001', maxPKR: '4100000', fixedTaxPKR: '430000', ratePercent: '30' },
    { minPKR: '4100001', maxPKR: '', fixedTaxPKR: '700000', ratePercent: '35' }
  ]
};

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
      : FBR_PRESETS['2024-2025']
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

  // Simulator Gross Salary Input
  const [simGrossPKR, setSimGrossPKR] = useState('150000');

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

  const handleAddSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    const newMin = lastSlab && lastSlab.maxPKR ? (parseInt(lastSlab.maxPKR, 10) + 1).toString() : '0';
    setSlabs((prev) => [
      ...prev,
      { minPKR: newMin, maxPKR: '', fixedTaxPKR: '0', ratePercent: '0' }
    ]);
  };

  const handleRemoveSlab = (index) => {
    if (slabs.length <= 1) {
      toast.error('At least one tax slab must remain defined');
      return;
    }
    setSlabs((prev) => prev.filter((_, i) => i !== index));
  };

  const loadPreset = (year) => {
    setTaxYear(year);
    if (FBR_PRESETS[year]) {
      setSlabs(FBR_PRESETS[year]);
      toast.success(`Loaded official FBR ${year} salaried tax slabs`);
    }
  };

  // Live Tax & Net Pay Simulation Calculator
  const simulation = useMemo(() => {
    const gross = parseFloat(simGrossPKR) || 0;
    const annualGross = gross * 12;

    // Evaluate against current slabs
    let annualTax = 0;
    for (const slab of slabs) {
      const min = parseFloat(slab.minPKR) || 0;
      const max = slab.maxPKR ? parseFloat(slab.maxPKR) : Infinity;
      const fixed = parseFloat(slab.fixedTaxPKR) || 0;
      const rate = parseFloat(slab.ratePercent) || 0;

      if (annualGross >= min) {
        if (annualGross <= max || max === Infinity) {
          const taxableAboveMin = annualGross - min;
          annualTax = fixed + (taxableAboveMin * (rate / 100));
          break;
        }
      }
    }

    const monthlyTax = Math.round(annualTax / 12);

    // EOBI Calculations (Pakistan standard: 1% employee, 5% employer based on min wage)
    const minWage = parseFloat(eobi.minWagePKR) || 37000;
    const eobiEmployee = eobi.enabled ? Math.round(minWage * (eobi.employeeRatePercent / 100)) : 0;
    const eobiEmployer = eobi.enabled ? Math.round(minWage * (eobi.employerRatePercent / 100)) : 0;

    // Provident Fund
    const pfEmployee = providentFund.enabled ? Math.round(gross * (providentFund.employeePercent / 100)) : 0;

    const totalDeductions = monthlyTax + eobiEmployee + pfEmployee;
    const netSalary = Math.max(0, gross - totalDeductions);

    return {
      gross,
      annualGross,
      annualTax: Math.round(annualTax),
      monthlyTax,
      eobiEmployee,
      eobiEmployer,
      pfEmployee,
      totalDeductions,
      netSalary
    };
  }, [simGrossPKR, slabs, eobi, providentFund]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Build and validate tax slabs payload
      const taxSlabsPayload = {
        taxYear,
        slabs: slabs.map((s) => ({
          minPaisa: Math.round(parseFloat(s.minPKR) * 100),
          maxPaisa: s.maxPKR && s.maxPKR.trim() !== '' ? Math.round(parseFloat(s.maxPKR) * 100) : null,
          fixedTaxPaisa: Math.round(parseFloat(s.fixedTaxPKR || 0) * 100),
          ratePercent: parseFloat(s.ratePercent || 0)
        }))
      };

      // 2. Build EOBI payload
      const eobiPayload = {
        enabled: eobi.enabled,
        employerRatePercent: parseFloat(eobi.employerRatePercent),
        employeeRatePercent: parseFloat(eobi.employeeRatePercent),
        minWagePaisa: Math.round(parseFloat(eobi.minWagePKR) * 100)
      };

      // 3. Build PESSI payload
      const pessiPayload = {
        enabled: pessi.enabled,
        employerRatePercent: parseFloat(pessi.employerRatePercent),
        wageCeilingPaisa: Math.round(parseFloat(pessi.wageCeilingPKR || 0) * 100)
      };

      // 4. Build Provident Fund payload
      const pfPayload = {
        enabled: providentFund.enabled,
        employerPercent: parseFloat(providentFund.employerPercent),
        employeePercent: parseFloat(providentFund.employeePercent)
      };

      await Promise.all([
        updateSetting({
          key: 'taxSlabs',
          value: taxSlabsPayload,
          description: `Updated FBR salaried tax slabs for ${taxYear}`
        }).unwrap(),
        updateSetting({
          key: 'eobi',
          value: eobiPayload,
          description: 'Updated EOBI contribution parameters'
        }).unwrap(),
        updateSetting({
          key: 'pessi',
          value: pessiPayload,
          description: 'Updated PESSI contribution parameters'
        }).unwrap(),
        updateSetting({
          key: 'providentFund',
          value: pfPayload,
          description: 'Updated Provident Fund policy settings'
        }).unwrap()
      ]);

      toast.success('Statutory tax brackets and contribution rates updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update statutory compliance settings');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* FBR Salaried Slabs Table Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              Pakistan FBR Salaried Income Tax Slabs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Salaried progressive tax brackets applied during monthly payroll calculation (Annual Gross Tax $\div$ 12).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset('2024-2025')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              FBR 2024-25
            </button>
            <button
              type="button"
              onClick={() => loadPreset('2025-2026')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              FBR 2025-26
            </button>
          </div>
        </div>

        {/* Dynamic Slab Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="px-4 py-3">Slab #</th>
                <th className="px-4 py-3">Min Annual Salary (PKR)</th>
                <th className="px-4 py-3">Max Annual Salary (PKR)</th>
                <th className="px-4 py-3">Fixed Tax (PKR)</th>
                <th className="px-4 py-3">Marginal Rate (%)</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {slabs.map((slab, index) => (
                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={slab.minPKR}
                      onChange={(e) => handleSlabChange(index, 'minPKR', e.target.value)}
                      className="w-32 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Exceeding (No Max)"
                      value={slab.maxPKR}
                      onChange={(e) => handleSlabChange(index, 'maxPKR', e.target.value)}
                      className="w-32 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder:text-slate-400 placeholder:italic"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={slab.fixedTaxPKR}
                      onChange={(e) => handleSlabChange(index, 'fixedTaxPKR', e.target.value)}
                      className="w-28 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={slab.ratePercent}
                        onChange={(e) => handleSlabChange(index, 'ratePercent', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right"
                      />
                      <span>%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {slabs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(index)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                        title="Remove Slab"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={handleAddSlab}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Slab Bracket
        </button>
      </div>

      {/* Statutory Contributions Grid (EOBI, PESSI, Provident Fund) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* EOBI Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              EOBI Statutory
            </h4>
            <input
              type="checkbox"
              checked={eobi.enabled}
              onChange={(e) => setEobi((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="rounded text-emerald-500 w-4 h-4"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Employees' Old-Age Benefits Institution compliance.
          </p>

          <div className="space-y-2 pt-1 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Min Statutory Wage (PKR)</span>
              <input
                type="number"
                value={eobi.minWagePKR}
                disabled={!eobi.enabled}
                onChange={(e) => setEobi((prev) => ({ ...prev, minWagePKR: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Employer (%)</span>
                <input
                  type="number"
                  value={eobi.employerRatePercent}
                  disabled={!eobi.enabled}
                  onChange={(e) => setEobi((prev) => ({ ...prev, employerRatePercent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Employee (%)</span>
                <input
                  type="number"
                  value={eobi.employeeRatePercent}
                  disabled={!eobi.enabled}
                  onChange={(e) => setEobi((prev) => ({ ...prev, employeeRatePercent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PESSI Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-emerald-500" />
              PESSI (Social Security)
            </h4>
            <input
              type="checkbox"
              checked={pessi.enabled}
              onChange={(e) => setPessi((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="rounded text-emerald-500 w-4 h-4"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Provincial Employees Social Security Institution.
          </p>

          <div className="space-y-2 pt-1 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Employer Rate (%)</span>
              <input
                type="number"
                value={pessi.employerRatePercent}
                disabled={!pessi.enabled}
                onChange={(e) => setPessi((prev) => ({ ...prev, employerRatePercent: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Wage Ceiling (PKR)</span>
              <input
                type="number"
                value={pessi.wageCeilingPKR}
                disabled={!pessi.enabled}
                onChange={(e) => setPessi((prev) => ({ ...prev, wageCeilingPKR: e.target.value }))}
                placeholder="0 (No Ceiling)"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Provident Fund Card */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-500" />
              Provident Fund (PF)
            </h4>
            <input
              type="checkbox"
              checked={providentFund.enabled}
              onChange={(e) => setProvidentFund((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="rounded text-emerald-500 w-4 h-4"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Retirement benefit shared contribution matching.
          </p>

          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Employer Match (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={providentFund.employerPercent}
                  disabled={!providentFund.enabled}
                  onChange={(e) => setProvidentFund((prev) => ({ ...prev, employerPercent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Employee Share (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={providentFund.employeePercent}
                  disabled={!providentFund.enabled}
                  onChange={(e) => setProvidentFund((prev) => ({ ...prev, employeePercent: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              Standard Pakistani rate: 8.33% (1 month basic per year).
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Live Tax & Net Pay Simulator Widget */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            Interactive Gross-to-Net Pay Simulator
          </h3>
          <span className="text-xs font-mono px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
            Live Sandbox
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Test any monthly gross salary against current FBR slabs and statutory rules to preview withholding tax and net take-home pay.
        </p>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pt-2">
          <div className="w-full md:w-1/3 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Monthly Gross Salary (PKR):
            </label>
            <div className="relative">
              <input
                type="number"
                step="5000"
                value={simGrossPKR}
                onChange={(e) => setSimGrossPKR(e.target.value)}
                placeholder="150000"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              Annualized Gross: <strong className="font-mono text-slate-700 dark:text-slate-300">PKR {simulation.annualGross.toLocaleString()}</strong>
            </span>
          </div>

          <div className="w-full md:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] text-slate-400 block">FBR Income Tax</span>
              <span className="text-sm font-bold text-rose-600 block mt-1">
                -PKR {simulation.monthlyTax.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                (PKR {simulation.annualTax.toLocaleString()} / yr)
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] text-slate-400 block">EOBI Share</span>
              <span className="text-sm font-bold text-rose-600 block mt-1">
                -PKR {simulation.eobiEmployee.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                (Employer: PKR {simulation.eobiEmployer.toLocaleString()})
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] text-slate-400 block">Total Deductions</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                -PKR {simulation.totalDeductions.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                Combined monthly
              </span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-bold">Net Payout</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                PKR {simulation.netSalary.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-600/70 block mt-0.5">
                Take-home pay
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? 'Saving Compliance...' : 'Save Statutory Settings'}
        </button>
      </div>
    </form>
  );
}
