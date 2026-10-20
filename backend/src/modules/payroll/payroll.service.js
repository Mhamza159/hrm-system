/**
 * @file payroll.service.js
 * @description Domain Business Logic for Payroll, Salary Structures & Pakistan Statutory Compliance.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.1 - 9.17)
 * - Layer: Service (Business Logic Layer)
 * - Financial Invariant: All values computed and stored in integer paisa (PKR × 100).
 */

import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { Employee } from '../../models/employee.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { paginate } from '../../utils/paginate.js';
import { recordAuditLog } from '../../services/audit.service.js';

export class PayrollService {
  /**
   * 9.1: Assign initial salary structure to an employee
   */
  static async createSalaryStructure(data, actor, ip = null, userAgent = null) {
    const { employeeId, effectiveFrom, ...allowances } = data;

    // Verify employee exists and is active
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found or has been archived');
    }

    // Check if employee already has an active salary structure
    const existingActive = await SalaryStructure.findOne({
      employeeId,
      status: 'active',
      isDeleted: false
    });

    if (existingActive) {
      throw new ApiError(
        409,
        'Employee already has an active salary structure. Use salary revision endpoint to update.'
      );
    }

    // Calculate gross salary strictly in integer paisa
    const basicSalary = Math.round(Number(allowances.basicSalary || 0));
    const houseRentAllowance = Math.round(Number(allowances.houseRentAllowance || 0));
    const medicalAllowance = Math.round(Number(allowances.medicalAllowance || 0));
    const conveyanceAllowance = Math.round(Number(allowances.conveyanceAllowance || 0));
    const otherAllowances = Math.round(Number(allowances.otherAllowances || 0));
    const grossSalary = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance + otherAllowances;

    const structure = await SalaryStructure.create({
      employeeId,
      effectiveFrom: new Date(effectiveFrom),
      currency: allowances.currency || 'PKR',
      basicSalary,
      houseRentAllowance,
      medicalAllowance,
      conveyanceAllowance,
      otherAllowances,
      grossSalary,
      eobiEnabled: allowances.eobiEnabled !== undefined ? allowances.eobiEnabled : true,
      pessiEnabled: allowances.pessiEnabled !== undefined ? allowances.pessiEnabled : false,
      providentFundEnabled: allowances.providentFundEnabled !== undefined ? allowances.providentFundEnabled : false,
      providentFundRate: allowances.providentFundRate || 0,
      status: 'active',
      revisedBy: actor?._id || null
    });

    // Record audit trail
    await recordAuditLog({
      userId: actor?._id,
      actor,
      action: 'SALARY_STRUCTURE_CREATE',
      entity: 'SalaryStructure',
      entityId: structure._id,
      after: structure.toObject(),
      ip,
      userAgent,
      details: {
        employeeCode: employee.employeeCode,
        grossSalary
      }
    });

    return structure;
  }

  /**
   * 9.1: List paginated salary structures
   */
  static async getSalaryStructures(query = {}) {
    const { page = 1, limit = 20, status = 'active', search, departmentId } = query;
    const filter = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    // If searching by employee code or name, find employee IDs first
    if (search || departmentId) {
      const empFilter = { isDeleted: false };
      if (departmentId) empFilter.departmentId = departmentId;
      if (search) {
        empFilter.$or = [
          { employeeCode: new RegExp(search.trim(), 'i') },
          { name: new RegExp(search.trim(), 'i') }
        ];
      }
      const matchingEmployees = await Employee.find(empFilter).select('_id');
      filter.employeeId = { $in: matchingEmployees.map((e) => e._id) };
    }

    return await paginate(SalaryStructure, filter, {
      page,
      limit,
      sort: { effectiveFrom: -1, createdAt: -1 },
      populate: {
        path: 'employeeId',
        select: 'employeeCode name email departmentId designationId status',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      }
    });
  }

  /**
   * 9.2: Get employee current salary structure and revision history
   */
  static async getEmployeeSalaryStructure(employeeId) {
    const employee = await Employee.findById(employeeId).populate([
      { path: 'departmentId', select: 'name' },
      { path: 'designationId', select: 'title' }
    ]);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found');
    }

    const current = await SalaryStructure.findOne({
      employeeId,
      status: 'active',
      isDeleted: false
    });

    const history = await SalaryStructure.find({
      employeeId,
      status: { $in: ['historical', 'superseded'] },
      isDeleted: false
    })
      .sort({ effectiveFrom: -1 })
      .populate('revisedBy', 'name email');

    return {
      employee: {
        _id: employee._id,
        name: employee.name,
        employeeCode: employee.employeeCode,
        department: employee.departmentId?.name || '',
        designation: employee.designationId?.title || ''
      },
      current,
      history
    };
  }

  /**
   * 9.2: Revise / Increment Employee Salary Structure
   */
  static async reviseSalaryStructure(employeeId, data, actor, ip = null, userAgent = null) {
    const { effectiveFrom, revisionReason, ...allowances } = data;

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found');
    }

    // Find current active structure
    const currentActive = await SalaryStructure.findOne({
      employeeId,
      status: 'active',
      isDeleted: false
    });

    const basicSalary = Math.round(Number(allowances.basicSalary || 0));
    const houseRentAllowance = Math.round(Number(allowances.houseRentAllowance || 0));
    const medicalAllowance = Math.round(Number(allowances.medicalAllowance || 0));
    const conveyanceAllowance = Math.round(Number(allowances.conveyanceAllowance || 0));
    const otherAllowances = Math.round(Number(allowances.otherAllowances || 0));
    const grossSalary = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance + otherAllowances;

    // Archive current structure to superseded
    if (currentActive) {
      currentActive.status = 'superseded';
      await currentActive.save();
    }

    // Insert new active structure with audit trail
    const newStructure = await SalaryStructure.create({
      employeeId,
      effectiveFrom: new Date(effectiveFrom),
      currency: allowances.currency || currentActive?.currency || 'PKR',
      basicSalary,
      houseRentAllowance,
      medicalAllowance,
      conveyanceAllowance,
      otherAllowances,
      grossSalary,
      eobiEnabled: allowances.eobiEnabled !== undefined ? allowances.eobiEnabled : currentActive?.eobiEnabled ?? true,
      pessiEnabled: allowances.pessiEnabled !== undefined ? allowances.pessiEnabled : currentActive?.pessiEnabled ?? false,
      providentFundEnabled: allowances.providentFundEnabled !== undefined ? allowances.providentFundEnabled : currentActive?.providentFundEnabled ?? false,
      providentFundRate: allowances.providentFundRate !== undefined ? allowances.providentFundRate : currentActive?.providentFundRate ?? 0,
      status: 'active',
      revisionReason,
      revisedBy: actor?._id || null
    });

    await recordAuditLog({
      userId: actor?._id,
      actor,
      action: 'SALARY_STRUCTURE_REVISE',
      entity: 'SalaryStructure',
      entityId: newStructure._id,
      before: currentActive ? currentActive.toObject() : null,
      after: newStructure.toObject(),
      ip,
      userAgent,
      details: {
        employeeCode: employee.employeeCode,
        previousGross: currentActive?.grossSalary || 0,
        newGross: grossSalary,
        reason: revisionReason
      }
    });

    return newStructure;
  }
}
