/**
 * @file documentParser.service.js
 * @description Native Document Text Extraction Service (PDF, Word DOCX, Plain Text).
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M15 Recruitment & AI Screening (Phase 09 Enhancement)
 * - Supported Formats: Digital PDF via `pdf-parse`, Word DOCX via `mammoth`, and UTF-8 Plain Text.
 * - Resilience: Sanitizes control characters, caps output length (15k chars), and falls back gracefully on corrupt or scanned files.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const mammoth = require('mammoth');

const logger = console;

/**
 * Clean and normalize extracted document text
 * @param {string} raw - Raw text string
 * @param {number} maxChars - Maximum characters to retain (default 15,000)
 * @returns {string} Cleaned, normalized text
 */
export const normalizeDocumentText = (raw = '', maxChars = 15000) => {
  if (typeof raw !== 'string') return '';

  return raw
    // Remove non-printable control characters (except newline \n and tab \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Standardize page break indicators from pdf-parse (e.g. "-- 1 of 2 --")
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    // Normalize excessive carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple horizontal spaces/tabs
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, maxChars);
};

/**
 * Extract text from a digital PDF buffer
 * @param {Buffer} buffer - Binary PDF buffer
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPdf = async (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid PDF buffer provided.');
  }

  // Handle both pdf-parse v2 class-based and v1 function-based APIs
  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    try {
      const res = await parser.getText();
      const text = typeof res === 'string' ? res : (res?.text || '');
      return normalizeDocumentText(text);
    } finally {
      if (typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  } else if (typeof pdfParseModule === 'function') {
    const data = await pdfParseModule(buffer);
    return normalizeDocumentText(data?.text || '');
  }

  throw new Error('pdf-parse module exports could not be resolved.');
};

/**
 * Extract text from a Word (.docx) buffer
 * @param {Buffer} buffer - Binary DOCX buffer
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromDocx = async (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid DOCX buffer provided.');
  }

  const result = await mammoth.extractRawText({ buffer });
  return normalizeDocumentText(result?.value || '');
};

/**
 * Main entry point: Extract text from any supported document buffer
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {string} mimeType - MIME type from file upload
 * @param {string} originalname - Original file name for extension checking
 * @param {Object} fallbackMetadata - Optional candidate metadata (name, email, job) if extraction fails
 * @returns {Promise<{ text: string, format: string, isExtracted: boolean }>}
 */
export const extractTextFromBuffer = async (
  buffer,
  mimeType = '',
  originalname = '',
  fallbackMetadata = null
) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return {
      text: buildFallbackString(fallbackMetadata),
      format: 'unknown',
      isExtracted: false
    };
  }

  const ext = (originalname ? originalname.slice(originalname.lastIndexOf('.')) : '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  const isPdf = ext === '.pdf' || mime === 'application/pdf' || buffer.toString('utf8', 0, 5).startsWith('%PDF');
  const isDocx = ext === '.docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isText = ext === '.txt' || mime === 'text/plain';

  let extractedText = '';
  let format = 'unknown';

  try {
    if (isPdf) {
      format = 'pdf';
      extractedText = await extractTextFromPdf(buffer);
    } else if (isDocx) {
      format = 'docx';
      extractedText = await extractTextFromDocx(buffer);
    } else if (isText) {
      format = 'txt';
      extractedText = normalizeDocumentText(buffer.toString('utf8'));
    } else {
      // Legacy .doc or unsupported format: attempt best-effort UTF-8 extraction
      format = ext ? ext.replace('.', '') : 'binary';
      extractedText = normalizeDocumentText(buffer.toString('utf8'));
    }
  } catch (err) {
    logger.warn(`[DocumentParser] Failed to extract text from ${format} (${originalname}):`, err.message);
  }

  // If extraction succeeded and has meaningful content
  if (extractedText && extractedText.length >= 25) {
    return {
      text: extractedText,
      format,
      isExtracted: true
    };
  }

  // Fallback for scanned documents (image-only PDFs) or empty extractions
  const fallback = buildFallbackString(fallbackMetadata);
  return {
    text: fallback || extractedText,
    format,
    isExtracted: false
  };
};

/**
 * Builds fallback profile text if document is scanned or unparseable
 */
const buildFallbackString = (meta) => {
  if (!meta) return '';
  const parts = [];
  if (meta.name) parts.push(`Applicant: ${meta.name}`);
  if (meta.email) parts.push(`Email: ${meta.email}`);
  if (meta.phone) parts.push(`Phone: ${meta.phone}`);
  if (meta.linkedinUrl) parts.push(`LinkedIn: ${meta.linkedinUrl}`);
  if (meta.portfolioUrl) parts.push(`Portfolio: ${meta.portfolioUrl}`);
  if (meta.jobTitle) parts.push(`Target Position: ${meta.jobTitle}`);
  if (meta.notes) parts.push(`Referral Notes: ${meta.notes}`);
  return parts.join('\n');
};
