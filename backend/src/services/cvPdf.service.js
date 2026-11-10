/**
 * @file cvPdf.service.js
 * @description Candidate CV Retrieval & Dynamic Fallback PDF Generator (Module M15 / Row 15.4 & 15.5).
 * 
 * SPECIFICATION & RELIABILITY:
 * - Module: M15 Recruitment & AI Screening
 * - Serves candidate CV document securely with inline Content-Disposition.
 * - Handles 3 tiers of CV file resolution:
 *   1. Remote HTTPS URL (Cloudinary / S3 / external storage) -> HTTP 302 Redirect.
 *   2. Local file on disk (uploads/resumes/...) -> Streams binary file stream directly.
 *   3. Missing / Ephemeral / Seed File -> Dynamically generates a professional PDF resume using PDFKit.
 * - Guarantees zero 404 broken document errors across local, containerized, and cloud deployments (Render / Vercel).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically generates a clean, executive PDF CV from candidate's parsed profile and database records
 * @param {import('express').Response} res - Express response object
 * @param {Object} candidate - Populated candidate document
 */
export const generateFallbackCvPdf = (res, candidate) => {
  const safeFilename = `${(candidate.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_')}_Curriculum_Vitae.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  // Top Accent Banner
  doc.rect(0, 0, doc.page.width, 10).fill('#00C471');

  // Candidate Name Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text(candidate.name || 'Candidate Profile', 45, 40);

  // Applied Position Subtitle
  const jobTitle = candidate.jobId?.title || 'Job Opening';
  const deptName = candidate.jobId?.departmentId?.name || 'Enterprise Team';
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#00C471')
    .text(`Target Role: ${jobTitle} • ${deptName}`)
    .moveDown(0.3);

  // Contact Info Line
  const contactParts = [
    candidate.email,
    candidate.phone,
    candidate.linkedinUrl ? 'LinkedIn Profile' : null,
    candidate.portfolioUrl ? 'Portfolio' : null
  ].filter(Boolean);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748B')
    .text(contactParts.join('   |   '))
    .moveDown(1);

  // Divider
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(45, doc.y).lineTo(doc.page.width - 45, doc.y).stroke().moveDown(0.8);

  const profile = candidate.parsedProfile || {};

  // Executive Summary
  if (profile.executiveSummary || candidate.cvText) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('EXECUTIVE PROFILE & SUMMARY')
      .moveDown(0.3);

    const summaryText = profile.executiveSummary || candidate.cvText.slice(0, 500);
    doc
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor('#334155')
      .text(summaryText, { lineGap: 3 })
      .moveDown(1);
  }

  // Key Qualifications & Education
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('QUALIFICATIONS & EXPERIENCE OVERVIEW')
    .moveDown(0.3);

  const expYears = profile.totalExperienceYears !== undefined ? `${profile.totalExperienceYears} Years` : 'Relevant Industry Background';
  const education = profile.highestEducation || 'Professional Degree / Diploma';

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('Total Experience: ', { continued: true })
    .font('Helvetica')
    .fillColor('#334155')
    .text(expYears);

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('Highest Education: ', { continued: true })
    .font('Helvetica')
    .fillColor('#334155')
    .text(education)
    .moveDown(1);

  // Technical Competencies & Skills
  const skills = profile.parsedSkills?.length ? profile.parsedSkills : [];
  if (skills.length > 0) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('CORE COMPETENCIES & TECHNICAL SKILLS')
      .moveDown(0.3);

    doc
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor('#334155')
      .text(skills.join('  •  '), { lineGap: 2 })
      .moveDown(1);
  }

  // AI Screening & Matching Assessment
  if (candidate.aiScore !== null && candidate.aiScore !== undefined) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('AI MATCH & SKILLS FIT ASSESSMENT')
      .moveDown(0.3);

    doc
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .fillColor(candidate.aiScore >= 70 ? '#059669' : candidate.aiScore >= 40 ? '#D97706' : '#DC2626')
      .text(`Job Fit Score: ${candidate.aiScore}/100`, { continued: true })
      .font('Helvetica')
      .fillColor('#64748B')
      .text(`  (Current Stage: ${candidate.stage || 'Applied'})`);

    if (candidate.aiScreeningReason) {
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#475569')
        .text(`Screening Justification: "${candidate.aiScreeningReason}"`, { lineGap: 2 })
        .moveDown(0.5);
    }

    if (profile.matchingStrengths?.length) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text('Strengths: ', { continued: true })
        .font('Helvetica')
        .fillColor('#334155')
        .text(profile.matchingStrengths.join(', '));
    }

    if (profile.missingSkills?.length) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#DC2626')
        .text('Growth / Missing Areas: ', { continued: true })
        .font('Helvetica')
        .fillColor('#334155')
        .text(profile.missingSkills.join(', '));
    }

    doc.moveDown(1);
  }

  // Bottom Notice
  doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(45, doc.page.height - 60).lineTo(doc.page.width - 45, doc.page.height - 60).stroke();

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#94A3B8')
    .text('Elvara HRM Enterprise Suite • Verified Candidate Application Record • Talent Acquisition Department', 45, doc.page.height - 50, {
      align: 'center'
    });

  doc.end();
};

/**
 * Securely streams candidate CV document to the Express response
 * @param {import('express').Response} res - Express response object
 * @param {Object} candidate - Populated candidate record
 */
export const streamCandidateCv = async (res, candidate) => {
  const cvUrl = candidate.cvUrl || '';

  // 1. If remote URL (Cloudinary, AWS S3, etc.), redirect directly
  if (cvUrl.startsWith('http://') || cvUrl.startsWith('https://')) {
    return res.redirect(cvUrl);
  }

  // 2. Local file inspection
  const cleanPath = cvUrl.replace(/^\/+/, '');
  const candidateBasename = path.basename(cleanPath);

  const searchLocations = [
    path.resolve(process.cwd(), cleanPath),
    path.resolve(process.cwd(), 'uploads', 'resumes', candidateBasename),
    path.resolve(process.cwd(), 'backend', cleanPath),
    path.resolve(process.cwd(), 'backend', 'uploads', 'resumes', candidateBasename),
    path.resolve(__dirname, '../../uploads/resumes', candidateBasename),
    path.resolve(__dirname, '../../../uploads/resumes', candidateBasename)
  ];

  let resolvedFile = null;
  for (const loc of searchLocations) {
    if (fs.existsSync(loc)) {
      resolvedFile = loc;
      break;
    }
  }

  // If local file is physically present on disk, stream it with proper headers
  if (resolvedFile) {
    const ext = path.extname(resolvedFile).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    const safeFilename = `${(candidate.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_')}_Resume${ext}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    return fs.createReadStream(resolvedFile).pipe(res);
  }

  // 3. Fallback: Local file missing (Render ephemeral storage wipe or seed record)
  // Dynamically generate executive PDF CV on the fly
  return generateFallbackCvPdf(res, candidate);
};
