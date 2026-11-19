/**
 * @file workdayHelper.js
 * @description Centralized Single-Source-of-Truth Helper for Working Days, Weekly Offs, and Schedule Calculations.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M2 Company Settings · Working Hours Sub-Module (Phase 37)
 * - Harmonizes attendance, leave deductions, shift schedules, and payroll working day counts.
 * - Enforces case-insensitive day names, shift-level precedence, and Asia/Karachi canonical timezone.
 */

export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

export const DAY_NAME_TO_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

export const DEFAULT_WORKING_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday'
];

/**
 * Normalizes day string or day number to canonical lowercase day name (e.g. 'Monday' -> 'monday', 1 -> 'monday')
 * @param {string|number} dayInput
 * @returns {string} canonical lowercase day name
 */
export const normalizeDayName = (dayInput) => {
  if (dayInput === null || dayInput === undefined) return '';
  if (typeof dayInput === 'number') {
    return DAY_NAMES[dayInput % 7] || '';
  }
  const clean = String(dayInput).trim().toLowerCase();
  return clean;
};

/**
 * Normalizes an array of days to unique canonical lowercase strings
 * @param {Array<string|number>} days
 * @returns {string[]}
 */
export const normalizeWorkDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    return [...DEFAULT_WORKING_DAYS];
  }
  const set = new Set();
  for (const d of days) {
    const norm = normalizeDayName(d);
    if (DAY_NAMES.includes(norm)) {
      set.add(norm);
    }
  }
  return set.size > 0 ? Array.from(set) : [...DEFAULT_WORKING_DAYS];
};

/**
 * Resolves effective work days for an employee, prioritizing assigned shift schedule over company default.
 * @param {Object|null} shift - Assigned shift document (or null)
 * @param {string[]|null} companyWorkingDays - Company workingDays setting (or null)
 * @returns {string[]} array of canonical lowercase working day names
 */
export const getEffectiveWorkDays = (shift = null, companyWorkingDays = null) => {
  if (shift && Array.isArray(shift.workDays) && shift.workDays.length > 0) {
    return normalizeWorkDays(shift.workDays);
  }
  if (Array.isArray(companyWorkingDays) && companyWorkingDays.length > 0) {
    return normalizeWorkDays(companyWorkingDays);
  }
  return [...DEFAULT_WORKING_DAYS];
};

/**
 * Checks whether a given Date is a weekly off day for the effective work schedule.
 * @param {Date|string} dateInput
 * @param {Object|null} [shift=null]
 * @param {string[]|null} [companyWorkingDays=null]
 * @param {string} [timeZone='Asia/Karachi']
 * @returns {boolean} true if date is a weekly off
 */
export const isWeeklyOff = (dateInput, shift = null, companyWorkingDays = null, timeZone = 'Asia/Karachi') => {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return false;

  const effectiveDays = getEffectiveWorkDays(shift, companyWorkingDays);
  const activeSet = new Set(effectiveDays);

  try {
    const dayName = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'Asia/Karachi',
      weekday: 'long'
    }).format(d).toLowerCase();

    return !activeSet.has(dayName);
  } catch {
    const dayName = DAY_NAMES[d.getDay()];
    return !activeSet.has(dayName);
  }
};

/**
 * Calculates total scheduled working days in a calendar month excluding weekly offs and gazetted holidays.
 * @param {number} year 
 * @param {number} month - 1-indexed (1 = January, 12 = December)
 * @param {string[]} effectiveWorkDays - Array of canonical lowercase working day names
 * @param {Set<string>|Array<string>} [holidayDatesSet=new Set()] - Set of 'YYYY-MM-DD' holiday date strings
 * @param {string} [timeZone='Asia/Karachi']
 * @returns {number} total working days in the month
 */
export const calculateWorkingDaysInMonth = (
  year,
  month,
  effectiveWorkDays = DEFAULT_WORKING_DAYS,
  holidayDatesSet = new Set(),
  timeZone = 'Asia/Karachi'
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const activeDaysSet = new Set(normalizeWorkDays(effectiveWorkDays));
  const holidays = holidayDatesSet instanceof Set ? holidayDatesSet : new Set(holidayDatesSet);

  let workingDaysCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    let dayName = '';
    try {
      dayName = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone || 'Asia/Karachi',
        weekday: 'long'
      }).format(dayDate).toLowerCase();
    } catch {
      dayName = DAY_NAMES[dayDate.getUTCDay()];
    }

    const isWorkDay = activeDaysSet.has(dayName);
    const isHoliday = holidays.has(dateKey);

    if (isWorkDay && !isHoliday) {
      workingDaysCount++;
    }
  }

  return workingDaysCount;
};

/**
 * Parses time string (e.g. "09:00", "18:00") into minutes from midnight
 * @param {string} timeStr - "HH:mm" 24h format
 * @returns {number} minutes from midnight (0 - 1439)
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 540;
  const [hours, minutes] = timeStr.trim().split(':').map(Number);
  return (((hours || 0) * 60) + (minutes || 0)) % 1440;
};

/**
 * Computes shift duration breakdown (Gross Minutes, Break Minutes, Net Productive Minutes)
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @param {number} [breakMinutes=60]
 * @returns {{ grossMinutes: number, breakMinutes: number, netMinutes: number, netHours: number, isCrossMidnight: boolean }}
 */
export const getNetWorkHours = (startTime = '09:00', endTime = '18:00', breakMinutes = 60) => {
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);

  let grossMinutes = endMins - startMins;
  let isCrossMidnight = false;

  if (grossMinutes <= 0) {
    grossMinutes += 1440;
    isCrossMidnight = true;
  }

  const validBreak = Math.max(0, Math.min(grossMinutes, Number(breakMinutes) || 0));
  const netMinutes = Math.max(0, grossMinutes - validBreak);
  const netHours = Number((netMinutes / 60).toFixed(2));

  return {
    grossMinutes,
    breakMinutes: validBreak,
    netMinutes,
    netHours,
    isCrossMidnight
  };
};
