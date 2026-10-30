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
    source: req.body.source,
    qrToken: req.body.qrToken,
    deviceId: req.body.deviceId,
    deviceModel: req.body.deviceModel,
    location: req.body.location,
    liveDescriptor: req.body.liveDescriptor,
    snapshot: req.body.snapshot,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(200).json(apiResponse(200, result, 'Clock-in successful'));
});

export const checkOut = asyncHandler(async (req, res) => {
  const result = await attendanceService.checkOut({
    user: req.user,
    source: req.body.source,
    qrToken: req.body.qrToken,
    deviceId: req.body.deviceId,
    deviceModel: req.body.deviceModel,
    location: req.body.location,
    liveDescriptor: req.body.liveDescriptor,
    snapshot: req.body.snapshot
  });
  return res.status(200).json(apiResponse(200, result, 'Clock-out successful'));
});

export const startBreak = asyncHandler(async (req, res) => {
  const result = await attendanceService.startBreak({
    user: req.user,
    type: req.body.type
  });
  return res.status(200).json(apiResponse(200, result, 'Break started'));
});

export const endBreak = asyncHandler(async (req, res) => {
  const result = await attendanceService.endBreak({
    user: req.user
  });
  return res.status(200).json(apiResponse(200, result, 'Break ended'));
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyAttendance({
    user: req.user,
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
    overtimeApproved: req.body.overtimeApproved,
    overrideReason: req.body.overrideReason
  });
  return res.status(200).json(apiResponse(200, result, 'Attendance record updated successfully'));
});

export const decideOvertime = asyncHandler(async (req, res) => {
  const result = await attendanceService.decideOvertime({
    attendanceId: req.params.id,
    user: req.user,
    approved: req.body.approved,
    reason: req.body.reason
  });
  return res.status(200).json(apiResponse(200, result, `Overtime ${req.body.approved ? 'approved' : 'revoked'} successfully`));
});

export const getTeamOvertime = asyncHandler(async (req, res) => {
  const result = await attendanceService.getTeamOvertimeRecords(req.user, req.query);
  return res.status(200).json(apiResponse(200, result, 'Team overtime records retrieved successfully'));
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
  const result = await attendanceService.getMyWFHRequests(req.user, req.query);
  return res.status(200).json(apiResponse(200, result, 'My WFH requests retrieved successfully'));
});

export const getTeamWFHRequests = asyncHandler(async (req, res) => {
  const result = await attendanceService.getTeamWFHRequests(req.user, req.query);
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

export const getWFHAuditContext = asyncHandler(async (req, res) => {
  const result = await attendanceService.getWFHAuditContext({
    requestId: req.params.id,
    user: req.user
  });
  return res.status(200).json(apiResponse(200, result, 'WFH audit context retrieved successfully'));
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
  const result = await attendanceService.getMyCorrections(req.user, req.query);
  return res.status(200).json(apiResponse(200, result, 'My correction requests retrieved successfully'));
});

export const getTeamCorrections = asyncHandler(async (req, res) => {
  const result = await attendanceService.getTeamCorrections(req.user, req.query);
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

export const getCorrectionAuditContext = asyncHandler(async (req, res) => {
  const result = await attendanceService.getCorrectionAuditContext({
    correctionId: req.params.id,
    user: req.user
  });
  return res.status(200).json(apiResponse(200, result, 'Correction audit context retrieved successfully'));
});

export const exportAttendance = asyncHandler(async (req, res) => {
  const buffer = await attendanceService.generateAttendanceExcel({
    ...req.query,
    user: req.user
  });
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

export const getAttendanceHistory = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendanceHistory({
    user: req.user,
    month: req.query.month,
    search: req.query.search,
    departmentId: req.query.departmentId,
    selfOnly: req.query.selfOnly === true || req.query.selfOnly === 'true',
    page: req.query.page,
    limit: req.query.limit
  });
  return res.status(200).json(apiResponse(200, result, 'Attendance history retrieved successfully'));
});


// ============================================================================
// Module M14: GPS / Geo-fencing Controller Handlers
// ============================================================================

export const getFlaggedPunches = asyncHandler(async (req, res) => {
  const result = await attendanceService.getFlaggedPunches({
    user: req.user,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    status: req.query.status || 'pending'
  });
  return res.status(200).json(apiResponse(200, result.punches, 'Flagged punches retrieved successfully', result.meta));
});

export const reviewFlaggedPunch = asyncHandler(async (req, res) => {
  const result = await attendanceService.reviewFlaggedPunch(req.params.id, req.body, req.user);
  return res.status(200).json(apiResponse(200, result, 'Flagged punch reviewed successfully'));
});

export const getPunchLocations = asyncHandler(async (req, res) => {
  const result = await attendanceService.getPunchLocations({
    user: req.user,
    date: req.query.date,
    departmentId: req.query.departmentId,
    onlyFlagged: req.query.onlyFlagged
  });
  return res.status(200).json(apiResponse(200, result, 'Punch locations retrieved successfully'));
});

export const createWfhLocation = asyncHandler(async (req, res) => {
  const result = await attendanceService.createWfhLocation(req.user, req.body);
  return res.status(201).json(apiResponse(201, result, 'WFH remote location registered successfully'));
});

export const getWfhLocations = asyncHandler(async (req, res) => {
  const result = await attendanceService.getWfhLocations(req.user);
  return res.status(200).json(apiResponse(200, result, 'WFH locations retrieved successfully'));
});

export const updateWfhLocationStatus = asyncHandler(async (req, res) => {
  const result = await attendanceService.updateWfhLocationStatus(req.params.id, req.body, req.user);
  return res.status(200).json(apiResponse(200, result, 'WFH location status updated successfully'));
});

export const deleteWfhLocation = asyncHandler(async (req, res) => {
  const result = await attendanceService.deleteWfhLocation(req.params.id, req.user);
  return res.status(200).json(apiResponse(200, result, 'WFH location deleted successfully'));
});


// ============================================================================
// Module M13: Dynamic QR Code Attendance & Kiosks Controller Handlers
// ============================================================================

export const createKiosk = asyncHandler(async (req, res) => {
  const result = await attendanceService.createKiosk(req.body, req.user);
  return res.status(201).json(apiResponse(201, result, 'Kiosk registered successfully'));
});

export const getKiosks = asyncHandler(async (req, res) => {
  const result = await attendanceService.getKiosks(req.query || {});
  return res.status(200).json(apiResponse(200, result.kiosks, 'Kiosks retrieved successfully', result.pagination));
});

export const getKioskById = asyncHandler(async (req, res) => {
  const result = await attendanceService.getKioskById(req.params.id);
  return res.status(200).json(apiResponse(200, result, 'Kiosk retrieved successfully'));
});

export const updateKiosk = asyncHandler(async (req, res) => {
  const result = await attendanceService.updateKiosk(req.params.id, req.body, req.user);
  return res.status(200).json(apiResponse(200, result, 'Kiosk updated successfully'));
});

export const deleteKiosk = asyncHandler(async (req, res) => {
  const result = await attendanceService.deleteKiosk(req.params.id, req.user);
  return res.status(200).json(apiResponse(200, result, 'Kiosk deleted successfully'));
});

export const getCurrentKioskQr = asyncHandler(async (req, res) => {
  const result = await attendanceService.getCurrentKioskQr(req.query.kioskId);
  return res.status(200).json(apiResponse(200, result, 'Current QR token generated successfully'));
});

export const resetDeviceBinding = asyncHandler(async (req, res) => {
  const result = await attendanceService.resetDeviceBinding(req.params.id, req.body.reason, req.user);
  return res.status(200).json(apiResponse(200, result, 'Device binding reset successfully'));
});

export const enrollFace = asyncHandler(async (req, res) => {
  const result = await attendanceService.enrollFace(req.user._id, req.body);
  return res.status(200).json(apiResponse(200, result, 'Face enrollment submitted successfully for HR approval'));
});

export const getFaceEnrollmentStatus = asyncHandler(async (req, res) => {
  const result = await attendanceService.getFaceEnrollmentStatus(req.user._id);
  return res.status(200).json(apiResponse(200, result, 'Face enrollment status retrieved'));
});

export const getFaceEnrollments = asyncHandler(async (req, res) => {
  const result = await attendanceService.getFaceEnrollments(req.query);
  return res.status(200).json(apiResponse(200, result.users, 'Face enrollments retrieved successfully', result.meta));
});

export const approveFaceEnrollment = asyncHandler(async (req, res) => {
  const result = await attendanceService.approveFaceEnrollment(req.params.userId, req.user);
  return res.status(200).json(apiResponse(200, result, 'Face enrollment approved successfully'));
});

export const rejectFaceEnrollment = asyncHandler(async (req, res) => {
  const result = await attendanceService.rejectFaceEnrollment(req.params.userId, req.user, req.body.reason);
  return res.status(200).json(apiResponse(200, result, 'Face enrollment rejected successfully'));
});

export const resetFaceEnrollment = asyncHandler(async (req, res) => {
  const result = await attendanceService.resetFaceEnrollment(req.params.userId, req.user, req.body?.reason);
  return res.status(200).json(apiResponse(200, result, 'Face enrollment reset successfully'));
});
