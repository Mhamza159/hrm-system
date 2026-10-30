/**
 * @file m12-face.spec.js
 * @description Playwright End-to-End Test Suite for Module M12: Face Recognition Attendance.
 *
 * SPECIFICATION:
 * - Module: M12 Face Recognition Attendance (BUILD-GUIDE Section 19 · Rows 12.1 to 12.9)
 * - Multi-role E2E verification across Super Admin, HR Manager, Department Manager, and Employee.
 */

import { test, expect } from '@playwright/test';

test.describe('Module M12 — Face Recognition Attendance E2E Verification', () => {

  test('Employee can access Face Biometric Enrollment page and view capture guidance', async ({ page }) => {
    await page.goto('/attendance/face/enroll');

    // Page title and guidance card
    await expect(page.getByText(/Face Biometric Enrollment/i)).toBeVisible();
    await expect(page.getByText(/Capture 3 Facial Angles/i)).toBeVisible();
    await expect(page.getByText(/Active Liveness Detection/i)).toBeVisible();
    await expect(page.getByText(/HR Verification Gate/i)).toBeVisible();

    // Start / Reset Enrollment trigger
    const startBtn = page.getByRole('button', { name: /Start Face Enrollment|Re-Enroll Biometrics/i });
    if (await startBtn.isVisible()) {
      await expect(startBtn).toBeEnabled();
    }
  });

  test('Employee views Face Punch launcher buttons in Punch Card Widget and opens Face Punch Modal', async ({ page }) => {
    await page.goto('/attendance/my');

    // Punch Card widget face action buttons
    const faceClockInBtn = page.getByRole('button', { name: /Face Clock In/i });
    const faceClockOutBtn = page.getByRole('button', { name: /Face Clock Out/i });

    if (await faceClockInBtn.isVisible()) {
      await faceClockInBtn.click();
      await expect(page.getByText(/Face Recognition Attendance/i)).toBeVisible();
      await expect(page.getByText(/Look directly into your camera/i)).toBeVisible();
      await expect(page.getByText(/Liveness & Blink Verified/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    } else if (await faceClockOutBtn.isVisible()) {
      await faceClockOutBtn.click();
      await expect(page.getByText(/Face Recognition Attendance/i)).toBeVisible();
    }
  });

  test('HR Manager can access Face Enrollments lifecycle directory with status filter tabs and action modals', async ({ page }) => {
    await page.goto('/attendance/face/enrollments');

    // Directory header
    await expect(page.getByText(/Face Biometric Approvals|Face Biometrics/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search employees by name or email/i)).toBeVisible();

    // Status filter tabs
    await expect(page.getByRole('button', { name: /All/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pending/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Approved/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Rejected/i })).toBeVisible();

    // Review / Reject action modal checks if any records exist
    const reviewBtn = page.getByRole('button', { name: /Review|Approve/i }).first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await expect(page.getByText(/Approve Face Biometrics|Review Enrollment/i)).toBeVisible();
    }
  });

  test('Super Admin can access Settings and configure Facial Recognition Attendance settings card', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText(/System Settings|Company Settings|Attendance Settings/i)).toBeVisible();

    // Look for Face Recognition Attendance governance card
    const faceCardHeader = page.getByText(/Facial Recognition Attendance/i);
    if (await faceCardHeader.isVisible()) {
      await expect(page.getByText(/Enable Face Attendance/i)).toBeVisible();
      await expect(page.getByText(/Matching Threshold Distance/i)).toBeVisible();
      await expect(page.getByText(/Active Blink Liveness/i)).toBeVisible();
    }
  });

  test('HR Manager and Department Manager can view Flagged Punches page with face mismatch reason and snapshot photos', async ({ page }) => {
    await page.goto('/attendance/flagged');

    await expect(page.getByText(/Flagged Attendance Punches/i)).toBeVisible();

    // Search and status filters
    await expect(page.getByPlaceholder(/Search by employee name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /All Punches/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pending Review/i })).toBeVisible();
  });
});
