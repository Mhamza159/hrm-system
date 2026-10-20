/**
 * @file payroll.contributions.test.js
 * @description Unit Tests for Statutory Contributions Calculator (Slice 9.6-TEST).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateStatutoryContributions,
  calculateGratuityPaisa
} from '../src/modules/payroll/contributionsCalculator.js';

describe('Module M9 — Statutory Contributions Unit Tests (Slice 9.6-TEST)', () => {
  it('1. Calculates standard EOBI contributions based on PKR 37,000 minimum wage', async () => {
    const res = await calculateStatutoryContributions({
      basicSalaryPaisa: 10000000,
      grossSalaryPaisa: 16000000,
      eobiEnabled: true
    });

    // 1% employee = 370 PKR (37,000 paisa)
    expect(res.eobi.employee).toBe(37000);
    // 5% employer = 1,850 PKR (185,000 paisa)
    expect(res.eobi.employer).toBe(185000);
  });

  it('2. Returns zero EOBI contributions when EOBI is disabled', async () => {
    const res = await calculateStatutoryContributions({
      basicSalaryPaisa: 10000000,
      grossSalaryPaisa: 16000000,
      eobiEnabled: false
    });

    expect(res.eobi.employee).toBe(0);
    expect(res.eobi.employer).toBe(0);
  });

  it('3. Calculates Provident Fund matched contribution when enabled', async () => {
    const res = await calculateStatutoryContributions({
      basicSalaryPaisa: 10000000, // PKR 100,000
      grossSalaryPaisa: 16000000,
      pfEnabled: true,
      pfRate: 5.0 // 5%
    });

    // 5% of 100,000 = PKR 5,000 (500,000 paisa)
    expect(res.providentFund.employee).toBe(500000);
    expect(res.providentFund.employer).toBe(500000);
  });

  it('4. Calculates PESSI employer contribution when enabled', async () => {
    const res = await calculateStatutoryContributions({
      basicSalaryPaisa: 3000000, // PKR 30,000
      grossSalaryPaisa: 4000000,
      pessiEnabled: true
    });

    // 6% on 30,000 = PKR 1,800 (180,000 paisa)
    expect(res.pessi.employer).toBe(180000);
  });

  it('5. Computes Service Gratuity strictly based on completed years (>= 1 year)', () => {
    const basicPaisa = 10000000; // PKR 100,000
    // Under 1 year service -> 0
    expect(calculateGratuityPaisa(basicPaisa, 0.5)).toBe(0);
    // Exactly 1 year service -> 1 month basic
    expect(calculateGratuityPaisa(basicPaisa, 1)).toBe(10000000);
    // 3.5 years service -> 3 completed years = 300,000 PKR
    expect(calculateGratuityPaisa(basicPaisa, 3.5)).toBe(30000000);
  });
});
