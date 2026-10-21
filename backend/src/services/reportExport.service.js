/**
 * @file reportExport.service.js
 * @description Streaming Excel (ExcelJS) and PDF (PDFKit) Export Service for Multi-Axis Reports.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.8)
 * - Layer: Shared Service (Document Export Engine)
 */

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * 7.8-BE: Build formatted, styled Excel workbook buffer using ExcelJS
 */
export const generateExcelReport = async ({ title = 'HRM Report', columns = [], rows = [] }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRM Enterprise Suite';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(title.slice(0, 31), {
    views: [{ showGridLines: true }]
  });

  // 1. Column Definitions & Auto-fit calculation
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || Math.max(col.header.length + 5, 16)
  }));

  // 2. Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate-900
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // 3. Populate Rows with Alternating Zebra Striping
  rows.forEach((rowData, idx) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;
    row.alignment = { vertical: 'middle' };
    row.font = { size: 9 };

    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' } // Slate-50
      };
    }
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * 7.8-BE: Build formatted PDF document buffer using PDFKit
 */
export const generatePdfReport = async ({ title = 'HRM Report', columns = [], rows = [] }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 30
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(title, 30, 30);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Generated on: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} | HRM Enterprise Suite`, 30, 50);

      doc
        .moveTo(30, 65)
        .lineTo(812, 65)
        .strokeColor('#cbd5e1')
        .stroke();

      // Table Geometry
      const startX = 30;
      let startY = 75;
      const totalWidth = 782;
      const colWidth = Math.floor(totalWidth / Math.max(columns.length, 1));

      // Table Header Row
      doc.rect(startX, startY, totalWidth, 22).fill('#0f172a');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');

      columns.forEach((col, idx) => {
        doc.text(col.header, startX + idx * colWidth + 5, startY + 6, {
          width: colWidth - 10,
          ellipsis: true
        });
      });

      startY += 24;

      // Table Body Rows
      doc.font('Helvetica').fontSize(8);
      rows.forEach((row, rowIdx) => {
        // Page overflow protection
        if (startY > 540) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
          startY = 40;
        }

        if (rowIdx % 2 === 1) {
          doc.rect(startX, startY - 2, totalWidth, 18).fill('#f8fafc');
        }

        doc.fillColor('#1e293b');
        columns.forEach((col, colIdx) => {
          const rawVal = row[col.key];
          const textVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '-';
          doc.text(textVal, startX + colIdx * colWidth + 5, startY + 2, {
            width: colWidth - 10,
            ellipsis: true
          });
        });

        startY += 18;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
