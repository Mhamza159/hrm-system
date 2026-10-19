/**
 * @file statusEngine.service.js
 * @description Automated Status and Work Duration Calculation Engine.
 * 
 * SPECIFICATION & LOGIC:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.6 & 5.7)
 * - Evaluates: present, late, half_day, earlyDeparture, graceApplied, overtimeMinutes.
 */

/**
 * Parses time string (e.g. "09:30") into minutes from midnight
 * @param {string} timeStr - "HH:mm"
 * @returns {number} minutes
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 540; // Default 09:00 (540 mins)
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Extracts minutes from midnight for a given Date in local/PKT context
 * Note: Uses local Date getHours() and getMinutes()
 * @param {Date} date
 * @returns {number} minutes
 */
export const getDateMinutes = (date) => {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
};

/**
 * Evaluates daily attendance status based on punch time, shift schedule, and late penalty rules.
 * 
 * @param {Object} params
 * @param {Date} params.checkIn - Check-in timestamp
 * @param {Object|null} params.shift - Assigned shift document (or null)
 * @param {Object|null} params.officeHours - Company officeHours setting
 * @param {Object|null} params.lateRules - Company lateRules setting
 * @returns {{ status: string, flags: string[] }}
 */
export const evaluateAttendanceStatus = ({ checkIn, shift, officeHours, lateRules }) => {
  const flags = [];

  const shiftStartStr = shift?.startTime || officeHours?.startTime || '09:00';
  const shiftStartMins = parseTimeToMinutes(shiftStartStr);

  const graceMinutes = shift?.graceMinutes ?? lateRules?.graceMinutes ?? 15;
  const lateThresholdMinutes = lateRules?.lateThresholdMinutes ?? 30;
  const halfDayThresholdMinutes = shift?.halfDayMinutes ?? officeHours?.halfDayMinutes ?? 240;

  const punchMins = getDateMinutes(checkIn);
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
 * @returns {{ workDurationMinutes: number, overtimeMinutes: number, isEarlyDeparture: boolean }}
 */
export const calculateWorkMetrics = ({
  checkIn,
  checkOut,
  totalBreakMinutes = 0,
  shift,
  officeHours,
  lateRules
}) => {
  if (!checkIn || !checkOut) {
    return { workDurationMinutes: 0, overtimeMinutes: 0, isEarlyDeparture: false };
  }

  const rawMinutes = Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 60000));
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
  const punchOutMins = getDateMinutes(checkOut);
  const isEarlyDeparture = punchOutMins < shiftEndMins - graceMinutes;

  return {
    workDurationMinutes,
    overtimeMinutes,
    isEarlyDeparture
  };
};
