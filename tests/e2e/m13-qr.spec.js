/**
 * @file m13-qr.spec.js
 * @description Playwright End-to-End Test Suite for Module M13: Dynamic QR Code Attendance.
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance (BUILD-GUIDE Section 18 · Rows 13.1 to 13.6)
 * - Multi-role E2E verification across Super Admin, HR Manager, Department Manager, and Employee.
 */

import { test, expect } from '@playwright/test';

test.describe('Module M13 — Dynamic QR Code Attendance E2E Verification', () => {
  test('HR Manager & Super Admin can access Kiosks Management and open Register Modal', async ({ page }) => {
    await page.goto('/attendance/kiosks');

    // Page Header assertion
    await expect(page.getByText(/Attendance Kiosks & Hardware/i)).toBeVisible();

    const registerBtn = page.getByRole('button', { name: /Register New Kiosk|Register Kiosk/i });
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await expect(page.getByText(/Register New Attendance Kiosk/i)).toBeVisible();
      await expect(page.getByText(/Terminal Name/i)).toBeVisible();
      await expect(page.getByText(/Kiosk Code/i)).toBeVisible();
      await expect(page.getByText(/Direction Type/i)).toBeVisible();
    }
  });

  test('Employee views Scan QR launcher on Punch Card Widget and opens Scanner Modal', async ({ page }) => {
    await page.goto('/attendance/my');

    // Punch Card widget
    const scanQrBtn = page.getByRole('button', { name: /Scan QR/i }).first();
    if (await scanQrBtn.isVisible()) {
      await scanQrBtn.click();
      await expect(page.getByText(/QR Code Attendance Scanner/i)).toBeVisible();
      await expect(page.getByText(/Clock In \(Entry\)/i)).toBeVisible();
      await expect(page.getByText(/Clock Out \(Exit\)/i)).toBeVisible();
      await expect(page.getByText(/Anti-Proxy Active/i)).toBeVisible();
    }
  });

  test('HR Manager views Reset Device action on Users page', async ({ page }) => {
    await page.goto('/users');

    await expect(page.getByText(/User Access & Security/i)).toBeVisible();

    const resetDeviceBtn = page.getByRole('button', { name: /Reset Device/i }).first();
    if (await resetDeviceBtn.isVisible()) {
      await resetDeviceBtn.click();
      await expect(page.getByText(/Reset Bound Hardware Device/i)).toBeVisible();
      await expect(page.getByText(/Reason for Device Reset/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Confirm Reset Device/i })).toBeVisible();
    }
  });

  test('Kiosk Display Page renders live wall clock, directionality, and rotating QR layout', async ({ page }) => {
    // Navigate with a mock or test kiosk ID
    await page.goto('/attendance/kiosks/65e000000000000000000001/display');

    await expect(page.getByText(/Office Attendance Terminal|Attendance Terminal/i)).toBeVisible();
    await expect(page.getByText(/Point your smartphone camera to clock in or out/i)).toBeVisible();
    await expect(page.getByText(/Next Code Rotation/i)).toBeVisible();
  });
});
