/**
 * @file taxCalculator.js
 * @description Pakistan FBR Progressive Income Tax Calculation Engine (Finance Act Salaried Slabs).
 * 
 * SPECIFICATION & STATUTORY COMPLIANCE:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.5)
 * - Calculation Rule:
 *   1. Annualize taxable gross: Annual Taxable Gross = Monthly Taxable Gross × 12.
 *   2. Evaluate matching FBR progressive slab bracket (Finance Act July–June tax year).
 *   3. Compute: Annual Tax = Fixed Tax + Rate % × (Annual Taxable Gross − Lower Slab Threshold).
 *   4. Monthly Tax Withholding = Math.round(Annual Tax / 12).
 *   5. Zero floating-point drift: All values in integer paisa (PKR × 100).
 */

import { SettingService } from '../settings/setting.service.js';

// Default FBR Salaried Tax Slabs (2024-2025 Finance Act) in integer paisa
export const DEFAULT_FBR_TAX_SLABS = [
  { minPaisa: 0, maxPaisa: 60000000, fixedTaxPaisa: 0, ratePercent: 0 },
  { minPaisa: 60000001, maxPaisa: 120000000, fixedTaxPaisa: 0, ratePercent: 5 },
  { minPaisa: 120000001, maxPaisa: 220000000, fixedTaxPaisa: 3000000, ratePercent: 15 },
  { minPaisa: 220000001, maxPaisa: 320000000, fixedTaxPaisa: 18000000, ratePercent: 25 },
  { minPaisa: 320000001, maxPaisa: 410000000, fixedTaxPaisa: 43000000, ratePercent: 30 },
  { minPaisa: 410000001, maxPaisa: null, fixedTaxPaisa: 70000000, ratePercent: 35 }
];

/**
 * Calculates FBR salaried progressive income tax for a monthly taxable gross amount.
 * 
 * @param {number} monthlyTaxableGrossPaisa - Monthly taxable gross salary in integer paisa
 * @param {Object} [customSlabsConfig=null] - Optional override slabs configuration
 * @returns {Promise<{ annualGrossPaisa: number, annualTaxPaisa: number, monthlyTaxPaisa: number, effectiveRatePercent: number, matchedSlab: Object }>}
 */
export async function calculateAnnualIncomeTax(monthlyTaxableGrossPaisa, customSlabsConfig = null) {
  const gross = Math.max(0, Math.round(Number(monthlyTaxableGrossPaisa || 0)));
  const annualGrossPaisa = gross * 12;

  let slabs = customSlabsConfig?.slabs;
  if (!slabs || !Array.isArray(slabs) || slabs.length === 0) {
    try {
      const setting = await SettingService.getSetting('taxSlabs');
      slabs = setting?.slabs || DEFAULT_FBR_TAX_SLABS;
    } catch {
      slabs = DEFAULT_FBR_TAX_SLABS;
    }
  }

  // Find matching slab
  let matchedSlab = slabs[0];
  for (const slab of slabs) {
    const min = slab.minPaisa ?? 0;
    const max = slab.maxPaisa ?? null;

    if (annualGrossPaisa >= min && (max === null || annualGrossPaisa <= max)) {
      matchedSlab = slab;
      break;
    }
  }

  // FBR progressive excess threshold calculation
  const lowerThreshold = matchedSlab.minPaisa > 1
    ? (matchedSlab.minPaisa % 2 === 1 ? matchedSlab.minPaisa - 1 : matchedSlab.minPaisa)
    : 0;

  const excessIncomePaisa = Math.max(0, annualGrossPaisa - lowerThreshold);
  const variableTaxPaisa = Math.round((excessIncomePaisa * (matchedSlab.ratePercent || 0)) / 100);
  const fixedTaxPaisa = Math.round(matchedSlab.fixedTaxPaisa || 0);

  const annualTaxPaisa = fixedTaxPaisa + variableTaxPaisa;
  const monthlyTaxPaisa = Math.round(annualTaxPaisa / 12);
  const effectiveRatePercent =
    annualGrossPaisa > 0 ? Number(((annualTaxPaisa / annualGrossPaisa) * 100).toFixed(2)) : 0;

  return {
    annualGrossPaisa,
    annualTaxPaisa,
    monthlyTaxPaisa,
    effectiveRatePercent,
    matchedSlab: {
      minPaisa: matchedSlab.minPaisa,
      maxPaisa: matchedSlab.maxPaisa,
      fixedTaxPaisa: matchedSlab.fixedTaxPaisa,
      ratePercent: matchedSlab.ratePercent
    }
  };
}
