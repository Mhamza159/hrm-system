/**
 * @file bankSheet.service.js
 * @description Generates corporate bank salary disbursement sheets using ExcelJS.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.12)
 * - Layer: Service (Plain JavaScript ES Modules)
 * - Formats: Meezan Bank Corporate, HBL Corporate, Standard Multi-Bank XLSX.
 */

import ExcelJS from 'exceljs';
import { ApiError } from '../../utils/apiError.js';
import { PayrollRun } from '../../models/payrollRun.model.js';
import { Payslip } from '../../models/payslip.model.js';

/**
 * Generates an Excel workbook buffer for bank salary disbursement.
 * @param {string} runId
 * @param {'meezan' | 'hbl' | 'standard'} bankFormat
 * @returns {Promise<{ buffer: Buffer, filename: string }>}
 */
export async function generateBankAdviceSheet(runId, bankFormat = 'standard') {
  const run = await PayrollRun.findById(runId);
  if (!run) {
    throw new ApiError(404, 'Payroll run not found');
  }

  const payslips = await Payslip.find({ payrollRunId: run._id })
    .populate({
      path: 'employeeId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    });

  if (payslips.length === 0) {
    throw new ApiError(400, 'No payslips found in this payroll run');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRM Corporate Payroll Engine';
  workbook.created = new Date();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[run.month - 1];
  const sheetTitle = `${monthName} ${run.year} Payroll`;

  const worksheet = workbook.addWorksheet(sheetTitle, {
    views: [{ showGridLines: true }]
  });

  let filename = `BankAdvice_${bankFormat.toUpperCase()}_${run.year}_${run.month}.xlsx`;

  if (bankFormat === 'meezan') {
    // -------------------------------------------------------------------------
    // Meezan Bank Corporate Bulk Salary Format
    // -------------------------------------------------------------------------
    worksheet.columns = [
      { header: 'Sr No', key: 'srNo', width: 8 },
      { header: 'Beneficiary Account / IBAN', key: 'iban', width: 28 },
      { header: 'Beneficiary Name', key: 'name', width: 28 },
      { header: 'Amount (PKR)', key: 'amount', width: 16 },
      { header: 'Transaction Reference', key: 'ref', width: 22 },
      { header: 'Remarks / Narration', key: 'remarks', width: 30 }
    ];

    let totalAmount = 0;
    payslips.forEach((slip, index) => {
      const emp = slip.employeeId || {};
      const netPkr = (slip.netPay || 0) / 100;
      totalAmount += netPkr;
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      const empCode = emp.employeeCode || emp.employeeId || (index + 1);

      worksheet.addRow({
        srNo: index + 1,
        iban: emp.bankDetails?.accountNumber || 'PK00MEZN0000000000000000',
        name: empName,
        amount: netPkr,
        ref: `SAL-${run.year}${run.month < 10 ? '0' + run.month : run.month}-${empCode}`,
        remarks: `Salary ${monthName} ${run.year}`
      });
    });

    // Summary Verification Row
    const summaryRow = worksheet.addRow({
      srNo: 'TOTAL',
      iban: '',
      name: `Total Beneficiaries: ${payslips.length}`,
      amount: totalAmount,
      ref: '',
      remarks: 'Corporate Batch Transfer'
    });
    summaryRow.font = { bold: true };

  } else if (bankFormat === 'hbl') {
    // -------------------------------------------------------------------------
    // HBL Corporate Disbursement Format
    // -------------------------------------------------------------------------
    worksheet.columns = [
      { header: 'Transaction Date', key: 'date', width: 16 },
      { header: 'Beneficiary Title', key: 'name', width: 28 },
      { header: 'Account / IBAN', key: 'iban', width: 28 },
      { header: 'Branch Code', key: 'branch', width: 14 },
      { header: 'Amount (PKR)', key: 'amount', width: 16 },
      { header: 'Payment Purpose', key: 'purpose', width: 25 }
    ];

    let totalAmount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    payslips.forEach((slip) => {
      const emp = slip.employeeId || {};
      const netPkr = (slip.netPay || 0) / 100;
      totalAmount += netPkr;
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();

      worksheet.addRow({
        date: todayStr,
        name: empName,
        iban: emp.bankDetails?.accountNumber || '',
        branch: emp.bankDetails?.branchCode || '0001',
        amount: netPkr,
        purpose: `Salary ${monthName} ${run.year}`
      });
    });

    const summaryRow = worksheet.addRow({
      date: 'TOTAL',
      name: `Records: ${payslips.length}`,
      iban: '',
      branch: '',
      amount: totalAmount,
      purpose: 'Batch Verified'
    });
    summaryRow.font = { bold: true };

  } else {
    // -------------------------------------------------------------------------
    // Standard Multi-Bank Audit Sheet
    // -------------------------------------------------------------------------
    worksheet.columns = [
      { header: 'Sr No', key: 'srNo', width: 8 },
      { header: 'Employee ID', key: 'empCode', width: 14 },
      { header: 'Employee Name', key: 'name', width: 26 },
      { header: 'CNIC', key: 'cnic', width: 18 },
      { header: 'Bank Name', key: 'bankName', width: 20 },
      { header: 'Account / IBAN', key: 'iban', width: 26 },
      { header: 'Gross Pay (PKR)', key: 'gross', width: 16 },
      { header: 'Deductions (PKR)', key: 'deductions', width: 16 },
      { header: 'Net Salary (PKR)', key: 'net', width: 18 },
      { header: 'Payment Status', key: 'status', width: 15 }
    ];

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    payslips.forEach((slip, index) => {
      const emp = slip.employeeId || {};
      const grossPkr = (slip.grossPay || 0) / 100;
      const dedPkr = (slip.totalDeductions || 0) / 100;
      const netPkr = (slip.netPay || 0) / 100;
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      const empCode = emp.employeeCode || emp.employeeId || (index + 1);

      totalGross += grossPkr;
      totalDeductions += dedPkr;
      totalNet += netPkr;

      worksheet.addRow({
        srNo: index + 1,
        empCode: empCode,
        name: empName,
        cnic: emp.cnic || 'N/A',
        bankName: emp.bankDetails?.bankName || 'Direct Account',
        iban: emp.bankDetails?.accountNumber || 'N/A',
        gross: grossPkr,
        deductions: dedPkr,
        net: netPkr,
        status: slip.status.toUpperCase()
      });
    });

    const summaryRow = worksheet.addRow({
      srNo: 'TOTAL',
      empCode: '',
      name: `Employees: ${payslips.length}`,
      cnic: '',
      bankName: '',
      iban: '',
      gross: totalGross,
      deductions: totalDeductions,
      net: totalNet,
      status: 'VERIFIED'
    });
    summaryRow.font = { bold: true };
  }

  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF061A14' } // Forest Black-Green
  };
  headerRow.height = 24;

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), filename };
}
