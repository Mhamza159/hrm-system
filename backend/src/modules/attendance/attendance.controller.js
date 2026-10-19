/**
 * @file attendance.controller.js
 * @description Express Controller for Attendance, Shifts, Breaks, WFH, and Month Locking.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10)
 * - Layer: Controller (Request/Response boundary)
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as attendanceService from './attendance.service.js';
import { runAutoAbsentSweep } from './jobs/autoAbsent.job.js';

export const checkIn = asyncHandler(async (req, res) => {
  const result = await attendanceService.checkIn({
    user: req.user,
    employeeId: req.body.employeeId,
    source: req.body.source,
    location: req.body.location,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(200).json(apiResponse(200, result, 'Clock-in successful'));
});

export const checkOut = asyncHandler(async (req, res) => {
  const result = await attendanceService.checkOut({
    user: req.user,
    employeeId: req.body.employeeId,
    location: req.body.location
  });
  return res.status(200).json(apiResponse(200, result, 'Clock-out successful'));
});

export const startBreak = asyncHandler(async (req, res) => {
  const result = await attendanceService.startBreak({
    user: req.user,
    employeeId: req.body.employeeId,
    type: req.body.type
  });
  return res.status(200).json(apiResponse(200, result, 'Break started'));
});

export const endBreak = asyncHandler(async (req, res) => {
  const result = await attendanceService.endBreak({
    user: req.user,
    employeeId: req.body.employeeId
  });
  return res.status(200).json(apiResponse(200, result, 'Break ended'));
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyAttendance({
    user: req.user,
    employeeId: req.query.employeeId,
    month: req.query.month,
    date: req.query.date
  });
  return res.status(200).json(apiResponse(200, result, 'My attendance retrieved successfully'));
});

export const getTeamAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getTeamAttendance({
    user: req.user,
    date: req.query.date,
    departmentId: req.query.departmentId,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit
  });
  return res.status(200).json(apiResponse(200, result, 'Team attendance retrieved successfully'));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.updateAttendanceRecord({
    attendanceId: req.params.id,
    user: req.user,
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    status: req.body.status,
    overrideReason: req.body.overrideReason
  });
  return res.status(200).json(apiResponse(200, result, 'Attendance record updated successfully'));
});

export const lockMonth = asyncHandler(async (req, res) => {
  const result = await attendanceService.lockAttendanceMonth({
    yearMonth: req.body.yearMonth,
    user: req.user,
    notes: req.body.notes
  });
  return res.status(200).json(apiResponse(200, result, `Attendance month ${req.body.yearMonth} locked successfully`));
});

export const unlockMonth = asyncHandler(async (req, res) => {
  const result = await attendanceService.unlockAttendanceMonth({
    yearMonth: req.body.yearMonth,
    user: req.user,
    notes: req.body.notes
  });
  return res.status(200).json(apiResponse(200, result, `Attendance month ${req.body.yearMonth} unlocked successfully`));
});

export const getLockStatus = asyncHandler(async (req, res) => {
  const ym = req.query.yearMonth || req.params.yearMonth || attendanceService.getYearMonth();
  const result = await attendanceService.getMonthLockStatus(ym);
  return res.status(200).json(apiResponse(200, result, 'Month lock status retrieved'));
});

export const applyWFH = asyncHandler(async (req, res) => {
  const result = await attendanceService.applyWFH({
    user: req.user,
    date: req.body.date,
    reason: req.body.reason
  });
  return res.status(201).json(apiResponse(201, result, 'Work From Home request submitted successfully'));
});

export const getMyWFHRequests = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyWFHRequests(req.user);
  return res.status(200).json(apiResponse(200, result, 'My WFH requests retrieved successfully'));
});

export const getTeamWFHRequests = asyncHandler(async (req, res) => {
  const result = await attendanceService.getTeamWFHRequests(req.user);
  return res.status(200).json(apiResponse(200, result, 'Team WFH requests retrieved successfully'));
});

export const decideWFH = asyncHandler(async (req, res) => {
  const result = await attendanceService.decideWFH({
    requestId: req.params.id,
    user: req.user,
    decision: req.body.decision,
    decisionReason: req.body.decisionReason
  });
  return res.status(200).json(apiResponse(200, result, `WFH request ${req.body.decision} successfully`));
});

export const applyCorrection = asyncHandler(async (req, res) => {
  const result = await attendanceService.applyCorrection({
    user: req.user,
    date: req.body.date,
    requestedCheckIn: req.body.requestedCheckIn,
    requestedCheckOut: req.body.requestedCheckOut,
    reason: req.body.reason
  });
  return res.status(201).json(apiResponse(201, result, 'Attendance correction request submitted'));
});

export const getMyCorrections = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyCorrections(req.user);
  return res.status(200).json(apiResponse(200, result, 'My correction requests retrieved successfully'));
});

export const getTeamCorrections = asyncHandler(async (req, res) => {
  const result = await attendanceService.getTeamCorrections(req.user);
  return res.status(200).json(apiResponse(200, result, 'Team correction requests retrieved successfully'));
});

export const decideCorrection = asyncHandler(async (req, res) => {
  const result = await attendanceService.decideCorrection({
    correctionId: req.params.id,
    user: req.user,
    decision: req.body.decision,
    decisionNotes: req.body.decisionNotes
  });
  return res.status(200).json(apiResponse(200, result, `Correction request ${req.body.decision} successfully`));
});

export const exportAttendance = asyncHandler(async (req, res) => {
  const buffer = await attendanceService.generateAttendanceExcel(req.query);
  const filename = `Attendance_Report_${req.query.month || new Date().toISOString().split('T')[0]}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(buffer);
});

export const triggerAutoAbsentSweep = asyncHandler(async (req, res) => {
  const targetDate = req.body.date ? new Date(req.body.date) : new Date();
  const result = await runAutoAbsentSweep(targetDate);
  return res.status(200).json(apiResponse(200, result, 'Auto-absent sweep executed successfully'));
});
