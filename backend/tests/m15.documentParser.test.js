/**
 * @file m15.documentParser.test.js
 * @description Unit Tests for Document Text Parser Service (PDF, DOCX, Plain Text).
 */

import { describe, it, expect } from 'vitest';
import PDFDocument from 'pdfkit';
import {
  extractTextFromBuffer,
  extractTextFromPdf,
  normalizeDocumentText
} from '../src/services/documentParser.service.js';

describe('Module M15 — Document Parser Service Unit Tests', () => {
  describe('normalizeDocumentText', () => {
    it('should strip non-printable control characters and page break markers', () => {
      const raw = 'John Doe\x00\x08 Resume\n-- 1 of 2 --\nExperienced Developer\n\n\n\nSkills: React, Node.js';
      const normalized = normalizeDocumentText(raw);

      expect(normalized).not.toContain('\x00');
      expect(normalized).not.toContain('\x08');
      expect(normalized).not.toContain('-- 1 of 2 --');
      expect(normalized).toContain('John Doe Resume');
      expect(normalized).toContain('Skills: React, Node.js');
    });

    it('should respect maximum character limits', () => {
      const longString = 'a'.repeat(20000);
      const normalized = normalizeDocumentText(longString, 500);
      expect(normalized.length).toBe(500);
    });
  });

  describe('extractTextFromPdf', () => {
    it('should extract text from a generated digital PDF buffer', async () => {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));

      const bufferPromise = new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      doc.text('Applicant: Alexander Graham');
      doc.text('Skills: React, Node.js, TypeScript, Docker, AWS');
      doc.text('Experience: 5 years of full stack software engineering');
      doc.end();

      const pdfBuffer = await bufferPromise;
      const text = await extractTextFromPdf(pdfBuffer);

      expect(text).toContain('Alexander Graham');
      expect(text).toContain('React');
      expect(text).toContain('Node.js');
      expect(text).toContain('5 years of full stack');
    });

    it('should reject invalid or non-buffer inputs gracefully', async () => {
      await expect(extractTextFromPdf('not-a-buffer')).rejects.toThrow('Invalid PDF buffer');
    });
  });

  describe('extractTextFromBuffer unified dispatcher', () => {
    it('should correctly detect and parse PDF buffer', async () => {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));

      const bufferPromise = new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      doc.text('Candidate Profile: Sarah Connor');
      doc.text('Specialization: Security and DevOps Engineering');
      doc.end();

      const pdfBuffer = await bufferPromise;
      const result = await extractTextFromBuffer(pdfBuffer, 'application/pdf', 'resume.pdf');

      expect(result.format).toBe('pdf');
      expect(result.isExtracted).toBe(true);
      expect(result.text).toContain('Sarah Connor');
      expect(result.text).toContain('Security and DevOps');
    });

    it('should parse UTF-8 plain text file buffer', async () => {
      const textBuffer = Buffer.from('Jane Developer\nSkills: Python, Django, PostgreSQL\nExperience: 3 years');
      const result = await extractTextFromBuffer(textBuffer, 'text/plain', 'cv.txt');

      expect(result.format).toBe('txt');
      expect(result.isExtracted).toBe(true);
      expect(result.text).toContain('Jane Developer');
      expect(result.text).toContain('PostgreSQL');
    });

    it('should fall back to candidate metadata when buffer is empty or corrupt', async () => {
      const emptyBuffer = Buffer.from('');
      const metadata = {
        name: 'Fallback Candidate',
        email: 'fallback@example.com',
        phone: '+1 555-0199',
        jobTitle: 'Frontend Engineer'
      };

      const result = await extractTextFromBuffer(emptyBuffer, 'application/pdf', 'empty.pdf', metadata);

      expect(result.isExtracted).toBe(false);
      expect(result.text).toContain('Applicant: Fallback Candidate');
      expect(result.text).toContain('Email: fallback@example.com');
      expect(result.text).toContain('Target Position: Frontend Engineer');
    });
  });
});
