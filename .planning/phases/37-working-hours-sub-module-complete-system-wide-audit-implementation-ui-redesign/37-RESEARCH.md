# Phase 37 Research: Working Hours Sub-Module System-Wide Audit & Integration Architecture

## 1. Executive Summary & Problem Diagnosis

### 1.1 The Existing Gap
* **Working Hours Form (`WorkingHoursForm.jsx`)**:
  * Currently renders a basic day-toggle array and inputs for start time, end time, and half-day minutes.
  * Lacks break duration configuration, net duration calculation, visual weekly off highlights, and clear Saturday/Sunday default status.
  * Uses inconsistent naming and lacks responsive enterprise styling matching `docs/UI-reference.md`.
* **Disconnection Across Attendance (`MyAttendancePage.jsx`, `TeamAttendancePage.jsx`, `attendance.service.js`)**:
  * `MyAttendancePage.jsx` hardcodes `isWeekend = dayName === 'Sat' || dayName === 'Sun'` and `dayObj.getDay() === 0 || dayObj.getDay() === 6` in 3 separate places.
  * In `attendance.service.js` (`getMonthlyAttendanceSheet`), work days are hardcoded to `['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']` when no shift is assigned.
  * Case sensitivity bug: Shift model stores `['Monday', 'Tuesday', ...]`, whereas Settings stores `['monday', 'tuesday', ...]`, causing `workDays.includes(dayName)` to fail silently if formats differ.
  * If Saturday or Sunday is switched ON in Settings, attendance calendars still mark them as "Weekend Off". If a weekday (e.g. Friday) is switched OFF, attendance marks employees as "Absent" instead of "Weekly Off".
* **Disconnection in Leave Management (`ApplyLeaveModal.jsx`, `leaveCalculator.js`)**:
  * `ApplyLeaveModal.jsx` hardcodes `if (day !== 0 && day !== 6) count++` for estimated deductible leave days.
  * `leaveCalculator.js` does not consider employee shift-specific work days.
* **Disconnection in Payroll (`payrollProcessor.js`)**:
  * `attendanceSummary.workingDays` is hardcoded to 30.
  * Scheduled working days in a pay cycle are not dynamically derived from the active working schedule and gazetted holidays.
  * Risk of unexcused absence miscalculation if weekly offs are not recognized.
* **Shift Management Integration**:
  * If an employee has no shift assigned, attendance falls back to hardcoded times (`11:00 AM` to `05:00 PM`) rather than the configured Company Working Hours.

---

## 2. Single Source of Truth & Architecture Flow

```
[ Company Working Hours & Office Hours (Settings Module) ]
       │
       ├── Working Days: [ "monday", "tuesday", "wednesday", "thursday", "friday" ] (Default Sat/Sun OFF)
       ├── Office Hours: { startTime: "09:00", endTime: "18:00", breakMinutes: 60, halfDayMinutes: 240 }
       └── Timezone: "Asia/Karachi"
               │
               ▼
     [ SettingService (MongoDB + In-Memory O(1) Cache Bus) ]
               │
               ├──► Workday Helper (workdayHelper.js)
               │      ├── isWeeklyOff(date, shift, companyWorkingDays)
               │      ├── getEffectiveWorkDays(shift, companyWorkingDays)
               │      └── calculateWorkingDaysInMonth(year, month, workDays, holidays)
               │
               ├──► Attendance Module
               │      ├── Check-in / Check-out evaluation (Grace, Late, Half-Day)
               │      ├── Monthly Sheet & Calendar (Dynamic Weekly Off vs Absent)
               │      └── Fallback shift schedule when employee.shiftId is null
               │
               ├──► Shift Management Module
               │      ├── Shift creation default work days
               │      └── Break duration & net working duration synchronization
               │
               ├──► Leave Management Module
               │      ├── leaveCalculator.js: dynamic deductible days excluding weekly offs
               │      ├── ApplyLeaveModal.jsx: dynamic client-side estimated days
               │      └── TeamLeaveCalendarPage.jsx: dynamic weekly off column highlights
               │
               └──► Payroll Module
                      ├── payrollProcessor.js: exact working days in pay cycle
                      ├── Unexcused absence computation excluding weekly offs
                      └── Historical finalized payroll protection (immutable snapshots)
```

---

## 3. Data Dictionary & Canonical Settings Spec

### 3.1 `workingDays` Setting
```json
[
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday"
]
```
* Rules:
  - Array of unique lowercase day strings: `["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]`.
  - Min 1 day, max 7 days.
  - Default: Monday through Friday (Saturday & Sunday OFF).

### 3.2 `officeHours` Setting
```json
{
  "startTime": "09:00",
  "endTime": "18:00",
  "breakMinutes": 60,
  "halfDayMinutes": 240,
  "fullDayMinutes": 480,
  "flexibleShiftAllowed": false,
  "timeZone": "Asia/Karachi"
}
```
* Rules:
  - `startTime`: `HH:mm` 24h string.
  - `endTime`: `HH:mm` 24h string.
  - `breakMinutes`: Integer, min 0, max 240, default 60.
  - `halfDayMinutes`: Integer, min 60, max 480, default 240.
  - `fullDayMinutes`: Integer, min 180, max 720, default 480.
  - `flexibleShiftAllowed`: Boolean, default false.
  - `timeZone`: String, default "Asia/Karachi".

---

## 4. Key Integration Touchpoints & Migration Strategy

1. **`backend/src/utils/workdayHelper.js`**: Create a single canonical helper utility so every service uses the exact same functions.
2. **`backend/src/modules/attendance/attendance.service.js`**:
   - `getShiftAndPolicies`: Cache with `SettingService.getSetting('officeHours')` and `SettingService.getSetting('workingDays')`.
   - `getMonthlyAttendanceSheet`: Replace hardcoded Mon-Fri with `getEffectiveWorkDays`.
   - Fix fallback shift in `getMyAttendance` to use `officeHours.startTime` / `officeHours.endTime` instead of `"11:00 AM"` / `"05:00 PM"`.
3. **`frontend/src/features/attendance/pages/MyAttendancePage.jsx`**:
   - Query `publicPolicies` or attendance meta to obtain `workingDays`.
   - Replace `isWeekend = dayName === 'Sat' || dayName === 'Sun'` with dynamic `isWeeklyOff`.
4. **`frontend/src/features/leaves/components/ApplyLeaveModal.jsx`**:
   - Replace hardcoded `day !== 0 && day !== 6` with dynamic active working days check.
5. **`backend/src/modules/leaves/leaveCalculator.js`**:
   - Support shift-specific working days and case-insensitive matching.
6. **`backend/src/modules/payroll/payrollProcessor.js`**:
   - Compute true `workingDays` in cycle and ensure non-working weekly offs are never penalized.
