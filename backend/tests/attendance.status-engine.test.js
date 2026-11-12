import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  getDateMinutes,
  evaluateAttendanceStatus,
  calculateWorkMetrics
} from '../src/modules/attendance/services/statusEngine.service.js';

describe('statusEngine.service - Timezone & Status Evaluation Suite', () => {
  describe('parseTimeToMinutes', () => {
    it('parses standard 24h formats correctly', () => {
      expect(parseTimeToMinutes('09:00')).toBe(540);
      expect(parseTimeToMinutes('09:30')).toBe(570);
      expect(parseTimeToMinutes('18:00')).toBe(1080);
      expect(parseTimeToMinutes('00:00')).toBe(0);
    });

    it('parses 12h AM/PM formats correctly', () => {
      expect(parseTimeToMinutes('09:00 AM')).toBe(540);
      expect(parseTimeToMinutes('11:00 AM')).toBe(660);
      expect(parseTimeToMinutes('12:00 PM')).toBe(720);
      expect(parseTimeToMinutes('01:00 PM')).toBe(780);
      expect(parseTimeToMinutes('12:00 AM')).toBe(0);
    });

    it('falls back to default 09:00 (540 mins) on invalid or missing inputs', () => {
      expect(parseTimeToMinutes(null)).toBe(540);
      expect(parseTimeToMinutes('')).toBe(540);
      expect(parseTimeToMinutes(undefined)).toBe(540);
    });
  });

  describe('getDateMinutes with Timezone calibration', () => {
    it('accurately resolves Pakistan Time (Asia/Karachi, UTC+5) regardless of UTC input', () => {
      // 07:28 UTC is 12:28 PKT
      const utcDate = new Date('2026-11-12T07:28:01.734Z');
      const mins = getDateMinutes(utcDate, 'Asia/Karachi');
      expect(mins).toBe(12 * 60 + 28); // 748
    });

    it('accurately resolves early morning punch in PKT', () => {
      // 03:55 UTC is 08:55 PKT
      const utcDate = new Date('2026-11-12T03:55:00.000Z');
      const mins = getDateMinutes(utcDate, 'Asia/Karachi');
      expect(mins).toBe(8 * 60 + 55); // 535
    });
  });

  describe('evaluateAttendanceStatus', () => {
    const corporateShift = {
      startTime: '09:00',
      graceMinutes: 15,
      halfDayMinutes: 240
    };

    it('marks early punches as present with no flags', () => {
      // 08:50 AM PKT (03:50 UTC)
      const checkIn = new Date('2026-11-12T03:50:00.000Z');
      const res = evaluateAttendanceStatus({ checkIn, shift: corporateShift, timeZone: 'Asia/Karachi' });
      expect(res.status).toBe('present');
      expect(res.flags).toEqual([]);
    });

    it('marks punches within grace period as present with graceApplied flag', () => {
      // 09:10 AM PKT (04:10 UTC) - within 15 min grace
      const checkIn = new Date('2026-11-12T04:10:00.000Z');
      const res = evaluateAttendanceStatus({ checkIn, shift: corporateShift, timeZone: 'Asia/Karachi' });
      expect(res.status).toBe('present');
      expect(res.flags).toContain('graceApplied');
    });

    it('accurately flags late punches (like 12:28 PM PKT) on UTC timestamps', () => {
      // 12:28 PM PKT (07:28 UTC) - Nov 12 real world punch
      const checkIn = new Date('2026-11-12T07:28:01.734Z');
      const res = evaluateAttendanceStatus({ checkIn, shift: corporateShift, timeZone: 'Asia/Karachi' });
      expect(res.status).toBe('late');
      expect(res.flags).toEqual([]);
    });

    it('accurately flags half_day when punch exceeds halfDayThreshold', () => {
      // 01:15 PM PKT (08:15 UTC) - 255 mins after 09:00 (threshold is 240)
      const checkIn = new Date('2026-11-12T08:15:00.000Z');
      const res = evaluateAttendanceStatus({ checkIn, shift: corporateShift, timeZone: 'Asia/Karachi' });
      expect(res.status).toBe('half_day');
    });
  });

  describe('calculateWorkMetrics', () => {
    const standardShift = {
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      graceMinutes: 15
    };

    it('detects early departure correctly in Asia/Karachi timezone', () => {
      // Checked in 09:00 PKT (04:00 UTC), checked out 16:00 PKT (11:00 UTC) -> 2 hours early
      const checkIn = new Date('2026-11-12T04:00:00.000Z');
      const checkOut = new Date('2026-11-12T11:00:00.000Z');
      const res = calculateWorkMetrics({
        checkIn,
        checkOut,
        shift: standardShift,
        timeZone: 'Asia/Karachi'
      });
      expect(res.isEarlyDeparture).toBe(true);
      expect(res.workDurationMinutes).toBe(420); // 7h = 420m
    });

    it('calculates overtime correctly when working beyond scheduled shift', () => {
      // Checked in 09:00 PKT (04:00 UTC), checked out 20:00 PKT (15:00 UTC) -> 11 hours, break 60m = 10h net (vs 8h net shift = 2h OT)
      const checkIn = new Date('2026-11-12T04:00:00.000Z');
      const checkOut = new Date('2026-11-12T15:00:00.000Z');
      const res = calculateWorkMetrics({
        checkIn,
        checkOut,
        shift: standardShift,
        timeZone: 'Asia/Karachi'
      });
      expect(res.isEarlyDeparture).toBe(false);
      expect(res.workDurationMinutes).toBe(660); // 11h = 660m
      expect(res.overtimeMinutes).toBe(180); // 660 - (9h - 1h = 8h = 480m) = 180m
    });
  });
});

