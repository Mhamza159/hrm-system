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
import { ApiError } from '../../utils/ApiError.js';
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

  const isHalfDay = halfDay && halfDay !== 'none';
  const dayWeight = isHalfDay ? 0.5 : 1;

  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0];
    const dayOfWeek = DAY_NAMES[current.getUTCDay()];
    const isCompanyWorkingDay = activeWorkingDays.has(dayOfWeek);
    const holidayName = holidayDateMap.get(dateKey) || null;
    const isPublicHoliday = Boolean(holidayName);

    const isWorkingDay = isCompanyWorkingDay && !isPublicHoliday;

    breakdown.push({
      date: dateKey,
      dayOfWeek,
      isCompanyWorkingDay,
      isPublicHoliday,
      holidayName,
      isWorkingDay,
      isDeductible: isWorkingDay,
      isSandwiched: false,
      weight: isWorkingDay ? dayWeight : 0
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  // 4. Evaluate Sandwich Rule (if enabled by corporate leave policy and not half-day)
  if (leavePolicy.sandwichRule && !isHalfDay && breakdown.length > 2) {
    for (let i = 0; i < breakdown.length; i++) {
      if (!breakdown[i].isWorkingDay) {
        // Check if there is at least one working day before and after this non-working date
        const hasWorkingBefore = breakdown.slice(0, i).some((d) => d.isWorkingDay);
        const hasWorkingAfter = breakdown.slice(i + 1).some((d) => d.isWorkingDay);

        if (hasWorkingBefore && hasWorkingAfter) {
          breakdown[i].isDeductible = true;
          breakdown[i].isSandwiched = true;
          breakdown[i].weight = 1;
        }
      }
    }
  }

  const netDeductibleDays = breakdown.reduce((acc, curr) => acc + curr.weight, 0);

  return {
    netDays: netDeductibleDays,
    breakdown,
    holidaysFound: holidays
  };
};
