/**
 * @file offerPdf.service.js
 * @description PDFKit Offer Letter Generation Service (Module M15 / Row 15.10).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.10)
 * - Financial Invariant: All compensation stored in paisa; formatted as PKR in PDF.
 */

import PDFDocument from 'pdfkit';

/**
 * Streams formal offer letter PDF to an Express response or write stream
 */
export const streamOfferLetterPdf = (res, { candidate, job, offerDetails, companyName = 'HRM Enterprise Suite' }) => {
  const filename = `Offer_Letter_${candidate.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Corporate Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#00C471')
    .text(companyName.toUpperCase(), { align: 'center' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('Talent Acquisition & Global People Operations • Islamabad HQ', { align: 'center' })
    .moveDown(1.5);

  // Document Title
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('FORMAL OFFER OF EMPLOYMENT', { align: 'center', underline: true })
    .moveDown(1.5);

  const issueDateStr = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  const joiningDateStr = offerDetails?.joiningDate
    ? new Date(offerDetails.joiningDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Mutually Agreed Date';

  // Date & Reference
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Date: ${issueDateStr}`, { align: 'right' })
    .text(`Ref: HRM-OFFER/${new Date().getFullYear()}/${String(candidate._id).slice(-6).toUpperCase()}`)
    .moveDown(1);

  // Candidate Address Block
  doc
    .font('Helvetica-Bold')
    .text(`To: ${candidate.name}`)
    .font('Helvetica')
    .text(`Email: ${candidate.email}`)
    .text(`Phone: ${candidate.phone}`)
    .moveDown(1.5);

  // Body Opening
  doc
    .font('Helvetica')
    .text(
      `Dear ${candidate.name},\n\nWe are pleased to extend this formal offer of employment for the position of ` +
      `${job.title} at ${companyName}. Based on your technical background, credentials, and performance throughout our evaluation process, we believe your skills will make a vital contribution to our engineering organization.`
    )
    .moveDown(1);

  // Key Terms
  doc
    .font('Helvetica-Bold')
    .text('1. Position & Reporting Structure:')
    .font('Helvetica')
    .text(`• Position Title: ${job.title}`)
    .text(`• Employment Type: ${job.employmentType || 'Full-time'}`)
    .text(`• Work Location: ${job.location || 'Headquarters (Islamabad, PK)'}`)
    .text(`• Anticipated Joining Date: ${joiningDateStr}`)
    .moveDown(1);

  // Compensation Section
  const baseSalaryPkr = ((offerDetails?.baseSalaryPaisa || 0) / 100).toLocaleString('en-PK');
  doc
    .font('Helvetica-Bold')
    .text('2. Compensation & Benefits Package:')
    .font('Helvetica')
    .text(`• Monthly Base Gross Salary: PKR ${baseSalaryPkr} per month`);

  if (Array.isArray(offerDetails?.allowances) && offerDetails.allowances.length > 0) {
    offerDetails.allowances.forEach((al) => {
      const alPkr = ((al.amountPaisa || 0) / 100).toLocaleString('en-PK');
      doc.text(`• ${al.name}: PKR ${alPkr} per month`);
    });
  }

  doc.moveDown(1);

  // Probation Terms
  const probationMonths = offerDetails?.probationMonths || 3;
  doc
    .font('Helvetica-Bold')
    .text('3. Probationary Period:')
    .font('Helvetica')
    .text(
      `You will be on probation for a period of ${probationMonths} month(s) from your joining date. Upon successful completion of your probation period, your employment will be confirmed in writing.`
    )
    .moveDown(2);

  // Closing
  doc
    .text('Please sign and return a copy of this letter to confirm your acceptance of our offer.')
    .moveDown(3);

  // Signatures
  const bottomY = doc.y;
  doc
    .font('Helvetica-Bold')
    .text('_____________________________________', 50, bottomY)
    .text('Authorized Representative', 50, bottomY + 15)
    .text(`${companyName} Talent Acquisition`, 50, bottomY + 30);

  doc
    .text('_____________________________________', 340, bottomY)
    .text('Candidate Signature & Acceptance', 340, bottomY + 15)
    .text(`Name: ${candidate.name}`, 340, bottomY + 30);

  doc.end();
};

/**
 * Generates offer letter as a memory Buffer
 */
export const generateOfferLetterBuffer = async ({ candidate, job, offerDetails, companyName = 'HRM Enterprise Suite' }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#00C471').text(companyName.toUpperCase(), { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('Talent Acquisition • Islamabad HQ', { align: 'center' }).moveDown(1.5);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0F172A').text('FORMAL OFFER OF EMPLOYMENT', { align: 'center', underline: true }).moveDown(1.5);

    const baseSalaryPkr = ((offerDetails?.baseSalaryPaisa || 0) / 100).toLocaleString('en-PK');
    doc.fontSize(10).font('Helvetica').fillColor('#334155').text(`To: ${candidate.name}`).text(`Position: ${job.title}`).text(`Salary: PKR ${baseSalaryPkr}`);
    doc.end();
  });
};
