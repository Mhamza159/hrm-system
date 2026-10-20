/**
 * @file contributionsCalculator.js
 * @description Pakistan Statutory Contributions Engine (EOBI, PESSI, Provident Fund & Gratuity).
 * 
 * SPECIFICATION & STATUTORY COMPLIANCE:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.6)
 * - Statutory Frameworks:
 *   1. EOBI Act 1976: Fixed contribution on gazetted minimum wage (1% Employee, 5% Employer).
 *   2. PESSI: Provincial Social Security on eligible wage ceiling.
 *   3. Provident Fund: Matched employer/employee contribution on basic salary.
 *   4. Industrial and Commercial Employment (Standing Orders) Ordinance: Service Gratuity.
 * - Integer Paisa Invariant: All contributions computed and returned as integers (PKR × 100).
 */

import { SettingService } from '../settings/setting.service.js';

export const DEFAULT_STATUTORY_RATES = {
  eobi: {
    enabled: true,
    employerRatePercent: 5,
    employeeRatePercent: 1,
    minWagePaisa: 3700000 // PKR 37,000
  },
  pessi: {
    enabled: false,
    employerRatePercent: 6,
    wageCeilingPaisa: 3700000
  },
  providentFund: {
    enabled: false,
    employerPercent: 8.33,
    employeePercent: 8.33
  }
};

/**
 * Calculates monthly statutory contributions for an employee.
 * 
 * @param {Object} params
 * @param {number} params.basicSalaryPaisa - Employee's monthly basic salary in paisa
 * @param {number} params.grossSalaryPaisa - Employee's monthly gross salary in paisa
 * @param {boolean} [params.eobiEnabled=true] - EOBI active flag on employee structure
 * @param {boolean} [params.pessiEnabled=false] - PESSI active flag on employee structure
 * @param {boolean} [params.pfEnabled=false] - Provident Fund active flag
 * @param {number} [params.pfRate=0] - Custom Provident Fund rate
 * @returns {Promise<{ eobi: { employee: number, employer: number, minWagePaisa: number }, pessi: { employee: number, employer: number }, providentFund: { employee: number, employer: number } }>}
 */
export async function calculateStatutoryContributions({
  basicSalaryPaisa = 0,
  grossSalaryPaisa = 0,
  eobiEnabled = true,
  pessiEnabled = false,
  pfEnabled = false,
  pfRate = 0
}) {
  const basic = Math.max(0, Math.round(Number(basicSalaryPaisa || 0)));
  const gross = Math.max(0, Math.round(Number(grossSalaryPaisa || 0)));

  // Load statutory configurations from M2 Settings
  let eobiConfig = DEFAULT_STATUTORY_RATES.eobi;
  let pessiConfig = DEFAULT_STATUTORY_RATES.pessi;
  let pfConfig = DEFAULT_STATUTORY_RATES.providentFund;

  try {
    const [eobiSetting, pessiSetting, pfSetting] = await Promise.all([
      SettingService.getSetting('eobi').catch(() => null),
      SettingService.getSetting('pessi').catch(() => null),
      SettingService.getSetting('providentFund').catch(() => null)
    ]);
    if (eobiSetting) eobiConfig = { ...eobiConfig, ...eobiSetting };
    if (pessiSetting) pessiConfig = { ...pessiConfig, ...pessiSetting };
    if (pfSetting) pfConfig = { ...pfConfig, ...pfSetting };
  } catch {
    // Fall back to statutory defaults
  }

  // 1. EOBI Contribution (Mandatory on Minimum Wage)
  let eobiEmployee = 0;
  let eobiEmployer = 0;
  if (eobiEnabled && eobiConfig.enabled) {
    const minWage = eobiConfig.minWagePaisa || 3700000;
    eobiEmployee = Math.round((minWage * (eobiConfig.employeeRatePercent || 1)) / 100);
    eobiEmployer = Math.round((minWage * (eobiConfig.employerRatePercent || 5)) / 100);
  }

  // 2. PESSI Contribution (Employer-only on basic wage up to ceiling)
  let pessiEmployee = 0;
  let pessiEmployer = 0;
  if (pessiEnabled) {
    const assessableWage = pessiConfig.wageCeilingPaisa > 0
      ? Math.min(basic, pessiConfig.wageCeilingPaisa)
      : basic;
    pessiEmployer = Math.round((assessableWage * (pessiConfig.employerRatePercent || 6)) / 100);
  }

  // 3. Provident Fund (Matched percentage on basic salary)
  let pfEmployee = 0;
  let pfEmployer = 0;
  if (pfEnabled || pfConfig.enabled) {
    const rate = pfRate > 0 ? pfRate : (pfConfig.employeePercent || 8.33);
    pfEmployee = Math.round((basic * rate) / 100);
    pfEmployer = Math.round((basic * rate) / 100);
  }

  return {
    eobi: {
      employee: eobiEmployee,
      employer: eobiEmployer,
      minWagePaisa: eobiConfig.minWagePaisa || 3700000
    },
    pessi: {
      employee: pessiEmployee,
      employer: pessiEmployer
    },
    providentFund: {
      employee: pfEmployee,
      employer: pfEmployer
    }
  };
}

/**
 * Calculates statutory service gratuity for final exit settlement.
 * Rule: 30 days basic salary for each completed year of service (minimum 1 year of continuous service).
 * 
 * @param {number} lastDrawnBasicPaisa - Last drawn monthly basic salary in integer paisa
 * @param {number} completedYears - Number of completed service years
 * @returns {number} Gratuity amount in integer paisa
 */
export function calculateGratuityPaisa(lastDrawnBasicPaisa, completedYears) {
  const basic = Math.max(0, Math.round(Number(lastDrawnBasicPaisa || 0)));
  const years = Math.floor(Math.max(0, Number(completedYears || 0)));

  if (years < 1) return 0;
  return basic * years;
}
