/**
 * @file app.js
 * @description Express Application Configuration & Middleware Pipeline.
 * 
 * ARCHITECTURAL DESIGN & SECURITY STANDARDS:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.1 & 0.14)
 * - Middleware Order:
 *   1. helmet(): Configures secure HTTP response headers against clickjacking and MIME-sniffing.
 *   2. cors(): Restricts requests strictly to CLIENT_URL with credentials (cookies) enabled.
 *   3. parsers: JSON & urlencoded limits capped at 16kb to prevent payload memory exhaustion.
 *   4. cookieParser(): Extracts signed/httpOnly cookies (such as refreshToken).
 *   5. /health: Standard container liveness & monitoring probe.
 *   6. /api/v1/*: Module domain routes.
 *   7. errorHandler: Terminal error interceptor returning unified JSON shape.
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import delegationRoutes from './modules/roles/delegation.routes.js';
import settingRoutes from './modules/settings/setting.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import designationRoutes from './modules/departments/designation.routes.js';
import shiftRoutes from './modules/departments/shift.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import changeRequestRoutes from './modules/employees/changeRequest.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import * as attendanceController from './modules/attendance/attendance.controller.js';
import { exportAttendanceSchema } from './modules/attendance/attendance.validation.js';
import { validate } from './middlewares/validate.js';
import { authenticate } from './middlewares/authenticate.js';
import { checkPermission } from './middlewares/checkPermission.js';
import * as roleController from './modules/roles/role.controller.js';
import * as departmentController from './modules/departments/department.controller.js';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// 2. Cross-Origin Resource Sharing (CORS) with strict client whitelisting & cookie forwarding
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body parsers with defensive size caps
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// 4. Cookie parser for httpOnly refresh tokens
app.use(cookieParser());

// Static file serving for uploads (logos, documents)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// 5. Health Check Liveness Probe (M0 Row 0.13)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. Mount Domain Modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/delegations', delegationRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/designations', designationRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/change-requests', changeRequestRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.get('/api/v1/reports/attendance', authenticate, checkPermission('attendance.export', 'team'), validate(exportAttendanceSchema), attendanceController.exportAttendance);
app.get('/api/v1/permissions', authenticate, checkPermission('role.view'), roleController.getPermissions);
app.get('/api/v1/org-chart', authenticate, checkPermission('org.view'), departmentController.getOrgChart);
app.get('/api/v1/teams/my', authenticate, checkPermission('org.view'), departmentController.getMyTeam);

// 7. Global Centralized Error Handler (M0 Row 0.4)
app.use(errorHandler);

export default app;
