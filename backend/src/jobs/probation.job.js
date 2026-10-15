/**
 * @file probation.job.js
 * @description Scheduled Cron Job & Manual Evaluation Runner for Probation Expiry Alerts.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.17)
 * - Layer: Background Job (Scheduled via node-cron daily at 09:00 PKT)
 * - Notification target: HR Managers and direct Reporting Managers.
 */

import cron from 'node-cron';
import { Employee } from '../models/employee.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { emailService } from '../services/email.service.js';

/**
 * Execute probation expiry evaluation for employees 7 days out
 * @returns {Promise<Object>}
 */
export const checkProbationExpiry = async () => {
  const now = new Date();
  const startTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6, 0, 0, 0);
  const endTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 23, 59, 59);

  const expiringEmployees = await Employee.find({
    status: { $in: ['Active', 'Probation'] },
    isDeleted: false,
    probationEndDate: {
      $gte: startTarget,
      $lte: endTarget
    }
  })
    .populate('managerId', 'name email')
    .populate('departmentId', 'name');

  const hrRole = await Role.findOne({ name: 'HR Manager' });
  const hrUsers = hrRole ? await User.find({ roles: hrRole._id, isActive: true }) : [];
  const hrEmails = hrUsers.map((u) => u.email).filter(Boolean);

  const alertsSent = [];

  for (const emp of expiringEmployees) {
    const recipients = new Set([...hrEmails]);
    if (emp.managerId?.email) {
      recipients.add(emp.managerId.email);
    }

    const recipientList = Array.from(recipients);
    if (recipientList.length > 0) {
      await emailService.sendMail({
        to: recipientList.join(', '),
        subject: `[HR Alert] Probation Ending in 7 Days: ${emp.name}`,
        html: `
          <h3>Employee Probation Period Expiry Alert</h3>
          <p>This is an automated alert to notify you that <strong>${emp.name}</strong> (${emp.employeeCode}) has their probation period ending in 7 days on <strong>${new Date(emp.probationEndDate).toLocaleDateString()}</strong>.</p>
          <p><strong>Department:</strong> ${emp.departmentId?.name || 'Unassigned'}</p>
          <p><strong>Reporting Manager:</strong> ${emp.managerId?.name || 'Unassigned'}</p>
          <p>Please conduct the probation performance evaluation and confirm employment status or extension prior to expiry.</p>
        `
      });
      alertsSent.push({
        employeeId: emp._id,
        employeeCode: emp.employeeCode,
        recipients: recipientList
      });
    }
  }

  return {
    checkedAt: new Date(),
    expiringCount: expiringEmployees.length,
    alertsSent
  };
};

/**
 * Initialize daily cron schedule at 09:00 PKT (04:00 UTC)
 */
export const initProbationJob = () => {
  cron.schedule('0 4 * * *', async () => {
    try {
      await checkProbationExpiry();
    } catch (err) {
      console.error('Failed to run scheduled probation job:', err);
    }
  });
};
