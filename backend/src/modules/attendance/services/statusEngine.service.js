/**
 * @file statusEngine.service.js
 * @description Automated Status and Work Duration Calculation Engine.
 * 
 * SPECIFICATION & LOGIC:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.6 & 5.7)
 * - Evaluates: present, late, half_day, earlyDeparture, graceApplied, overtimeMinutes.
 */

/**
 * Parses time string (e.g. "09:30", "9:30", "01:00 PM", "11:00 AM") into minutes from midnight
 * @param {string} timeStr - "HH:mm" or "hh:mm AM/PM"
 * @returns {number} minutes from midnight (0 - 1439)
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 540; // Default 09:00 (540 mins)
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    const [hours, minutes] = trimmed.split(':').map(Number);
    return ((hours || 0) * 60 + (minutes || 0)) % 1440;
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return ((hours * 60) + minutes) % 1440;
};

/**
 * Extracts minutes from midnight for a given Date in the target timezone (default Asia/Karachi)
 * @param {Date|string|number} date
 * @param {string} [timeZone='Asia/Karachi']
 * @returns {number} minutes from midnight (0 - 1439)
 */
export const getDateMinutes = (date, timeZone = 'Asia/Karachi') => {
  if (!date) return 0;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 0;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'Asia/Karachi',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23'
    }).formatToParts(d);

    const hours = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return ((hours * 60) + minutes) % 1440;
  } catch {
    return (d.getHours() * 60 + d.getMinutes()) % 1440;
  }
};

/**
 * Evaluates daily attendance status based on punch time, shift schedule, and late penalty rules.
 * 
 * @param {Object} params
 * @param {Date} params.checkIn - Check-in timestamp
 * @param {Object|null} params.shift - Assigned shift document (or null)
 * @param {Object|null} params.officeHours - Company officeHours setting
 * @param {Object|null} params.lateRules - Company lateRules setting
 * @param {string} [params.timeZone='Asia/Karachi'] - Target timezone
 * @returns {{ status: string, flags: string[] }}
 */
export const evaluateAttendanceStatus = ({ checkIn, shift, officeHours, lateRules, timeZone = 'Asia/Karachi' }) => {
  const flags = [];

  const shiftStartStr = shift?.startTime || officeHours?.startTime || '09:00';
  const shiftStartMins = parseTimeToMinutes(shiftStartStr);

  const graceMinutes = shift?.graceMinutes ?? lateRules?.graceMinutes ?? 15;
  const lateThresholdMinutes = lateRules?.lateThresholdMinutes ?? 30;
  const halfDayThresholdMinutes = shift?.halfDayMinutes ?? officeHours?.halfDayMinutes ?? 240;

  const punchMins = getDateMinutes(checkIn, timeZone);
  const diffMinutes = punchMins - shiftStartMins;

  let status = 'present';

  if (diffMinutes <= 0) {
    // Punched in early or exactly on time
    status = 'present';
  } else if (diffMinutes <= graceMinutes) {
    // Within grace period
    status = 'present';
    flags.push('graceApplied');
  } else if (diffMinutes < halfDayThresholdMinutes) {
    // Late punch
    status = 'late';
  } else {
    // Exceeded half day threshold
    status = 'half_day';
  }

  return { status, flags };
};

/**
 * Computes work duration, early departure flag, and overtime minutes at check-out.
 * 
 * @param {Object} params
 * @param {Date} params.checkIn
 * @param {Date} params.checkOut
 * @param {number} params.totalBreakMinutes
 * @param {Object|null} params.shift
 * @param {Object|null} params.officeHours
 * @param {Object|null} params.lateRules
 * @param {string} [params.timeZone='Asia/Karachi']
 * @returns {{ workDurationMinutes: number, overtimeMinutes: number, isEarlyDeparture: boolean }}
 */
export const calculateWorkMetrics = ({
  checkIn,
  checkOut,
  totalBreakMinutes = 0,
  shift,
  officeHours,
  lateRules,
  timeZone = 'Asia/Karachi'
}) => {
  if (!checkIn || !checkOut) {
    return { workDurationMinutes: 0, overtimeMinutes: 0, isEarlyDeparture: false };
  }

  const diffMs = new Date(checkOut) - new Date(checkIn);
  const rawMinutes = diffMs > 0 ? Math.max(1, Math.round(diffMs / 60000)) : 0;
  const workDurationMinutes = Math.max(0, rawMinutes - totalBreakMinutes);

  // Scheduled shift duration
  const shiftStartStr = shift?.startTime || officeHours?.startTime || '09:00';
  const shiftEndStr = shift?.endTime || officeHours?.endTime || '18:00';
  const shiftStartMins = parseTimeToMinutes(shiftStartStr);
  const shiftEndMins = parseTimeToMinutes(shiftEndStr);

  let scheduledMinutes = shiftEndMins - shiftStartMins;
  if (scheduledMinutes <= 0) {
    // Cross-midnight shift handling
    scheduledMinutes += 1440;
  }

  // Deduct standard shift break if defined
  const shiftBreak = shift?.breakMinutes || 60;
  const netScheduledMinutes = Math.max(0, scheduledMinutes - shiftBreak);

  // Overtime computation
  const overtimeMinutes = Math.max(0, workDurationMinutes - netScheduledMinutes);

  // Early departure check
  const graceMinutes = shift?.graceMinutes ?? lateRules?.graceMinutes ?? 15;
  const punchOutMins = getDateMinutes(checkOut, timeZone);
  const isEarlyDeparture = punchOutMins < shiftEndMins - graceMinutes;

  return {
    workDurationMinutes,
    overtimeMinutes,
    isEarlyDeparture
  };
};
