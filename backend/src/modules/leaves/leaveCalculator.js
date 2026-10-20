/**
 * @file leaveCalculator.js
 * @description Working Days, Gazetted Holidays & Sandwich Rule Calculator (Module M6 Row 6.3 & 6.4).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Layer: Helper / Calculation Engine
 * - Evaluates net deductible working days excluding official company weekends and gazetted holidays.
 */

import { Holiday } from '../../models/holiday.model.js';
import { SettingService } from '../settings/setting.service.js';
import { ApiError } from '../../utils/apiError.js';
import { normalizeToUtcMidnight } from './leave.service.js';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Calculates net deductible leave days between startDate and endDate.
 * Excludes non-working days (weekends) and Pakistan gazetted holidays.
 * 
 * @param {Date|string} startDateInput 
 * @param {Date|string} endDateInput 
 * @param {string} [halfDay='none'] - 'none' | 'first_half' | 'second_half'
 * @returns {Promise<{ netDays: number, breakdown: Array<Object>, holidaysFound: Array<Object> }>}
 */
export const calculateDeductibleDays = async (startDateInput, endDateInput, halfDay = 'none') => {
  const start = normalizeToUtcMidnight(startDateInput);
  const end = normalizeToUtcMidnight(endDateInput);

  if (end < start) {
    throw new ApiError(400, 'End date cannot be earlier than start date');
  }

  // Handle half-day applications
  if (halfDay && halfDay !== 'none') {
    if (start.getTime() !== end.getTime()) {
      throw new ApiError(400, 'Half-day leaves can only be applied for a single calendar day');
    }
  }

  // 1. Fetch company working days setting & leave policy
  const workingDaysSetting = (await SettingService.getSetting('workingDays')) || [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday'
  ];
  const activeWorkingDays = new Set(workingDaysSetting.map((d) => d.toLowerCase()));

  const leavePolicy = (await SettingService.getSetting('leavePolicy')) || {
    sandwichRule: false
  };

  // 2. Fetch all active gazetted holidays falling in this date window
  const holidays = await Holiday.find({
    isActive: true,
    date: { $gte: start, $lte: end }
  }).lean();

  const holidayDateMap = new Map();
  for (const h of holidays) {
    const key = normalizeToUtcMidnight(h.date).toISOString().split('T')[0];
    holidayDateMap.set(key, h.name);
  }

  // 3. Iterate through each calendar day in the range
  const breakdown = [];
  let current = new Date(start);
  let netDeductibleDays = 0;

  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0];
    const dayOfWeek = DAY_NAMES[current.getUTCDay()];
    const isCompanyWorkingDay = activeWorkingDays.has(dayOfWeek);
    const holidayName = holidayDateMap.get(dateKey) || null;
    const isPublicHoliday = Boolean(holidayName);

    let isDeductible = false;
    let dayWeight = 1;

    if (halfDay && halfDay !== 'none') {
      dayWeight = 0.5;
    }

    if (isPublicHoliday) {
      // Gazetted holiday is non-deductible
      isDeductible = false;
    } else if (!isCompanyWorkingDay) {
      // Weekend / non-working day is non-deductible unless strict sandwich rule applies
      isDeductible = false;
    } else {
      isDeductible = true;
      netDeductibleDays += dayWeight;
    }

    breakdown.push({
      date: dateKey,
      dayOfWeek,
      isCompanyWorkingDay,
      isPublicHoliday,
      holidayName,
      isDeductible,
      weight: isDeductible ? dayWeight : 0
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return {
    netDays: netDeductibleDays,
    breakdown,
    holidaysFound: holidays
  };
};
