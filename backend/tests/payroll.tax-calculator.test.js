/**
 * @file payroll.tax-calculator.test.js
 * @description Unit Tests for FBR Salaried Progressive Income Tax Calculator (Slice 9.5-TEST).
 */

import { describe, it, expect } from 'vitest';
import { calculateAnnualIncomeTax, DEFAULT_FBR_TAX_SLABS } from '../src/modules/payroll/taxCalculator.js';

describe('Module M9 — FBR Tax Calculator Unit Tests (Slice 9.5-TEST)', () => {
  it('1. Monthly gross <= PKR 50,000 (PKR 600,000 annual) incurs 0 tax', async () => {
    const res = await calculateAnnualIncomeTax(5000000, { slabs: DEFAULT_FBR_TAX_SLABS });
    expect(res.annualGrossPaisa).toBe(60000000);
    expect(res.annualTaxPaisa).toBe(0);
    expect(res.monthlyTaxPaisa).toBe(0);
    expect(res.effectiveRatePercent).toBe(0);
  });

  it('2. Monthly gross PKR 100,000 (PKR 1,200,000 annual) incurs 5% on excess of 600k', async () => {
    // Annual gross = 1,200,000. Excess over 600k = 600k. 5% of 600k = 30,000 PKR (3,000,000 paisa)
    // Monthly tax = 30,000 / 12 = 2,500 PKR (250,000 paisa)
    const res = await calculateAnnualIncomeTax(10000000, { slabs: DEFAULT_FBR_TAX_SLABS });
    expect(res.annualGrossPaisa).toBe(120000000);
    expect(res.annualTaxPaisa).toBe(3000000);
    expect(res.monthlyTaxPaisa).toBe(250000);
    expect(res.effectiveRatePercent).toBe(2.5);
  });

  it('3. Monthly gross PKR 150,000 (PKR 1,800,000 annual) falls into Slab 3', async () => {
    // Annual gross = 1,800,000. Fixed = 30,000. Excess over 1,200,000 = 600,000.
    // 15% of 600k = 90,000. Total annual tax = 120,000 PKR (12,000,000 paisa).
    // Monthly tax = 120,000 / 12 = 10,000 PKR (1,000,000 paisa).
    const res = await calculateAnnualIncomeTax(15000000, { slabs: DEFAULT_FBR_TAX_SLABS });
    expect(res.annualGrossPaisa).toBe(180000000);
    expect(res.annualTaxPaisa).toBe(12000000);
    expect(res.monthlyTaxPaisa).toBe(1000000);
  });

  it('4. Monthly gross PKR 250,000 (PKR 3,000,000 annual) falls into Slab 4', async () => {
    // Annual gross = 3,000,000. Fixed = 180,000. Excess over 2,200,000 = 800,000.
    // 25% of 800k = 200,000. Total annual tax = 380,000 PKR (38,000,000 paisa).
    // Monthly tax = 380,000 / 12 = 31,667 PKR (3,166,667 paisa).
    const res = await calculateAnnualIncomeTax(25000000, { slabs: DEFAULT_FBR_TAX_SLABS });
    expect(res.annualGrossPaisa).toBe(300000000);
    expect(res.annualTaxPaisa).toBe(38000000);
    expect(res.monthlyTaxPaisa).toBe(3166667);
  });

  it('5. Strictly returns integer numbers with zero decimal fractions', async () => {
    const res = await calculateAnnualIncomeTax(8333333, { slabs: DEFAULT_FBR_TAX_SLABS });
    expect(Number.isInteger(res.annualGrossPaisa)).toBe(true);
    expect(Number.isInteger(res.annualTaxPaisa)).toBe(true);
    expect(Number.isInteger(res.monthlyTaxPaisa)).toBe(true);
  });
});
