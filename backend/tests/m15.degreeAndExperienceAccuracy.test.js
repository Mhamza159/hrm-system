/**
 * @file m15.degreeAndExperienceAccuracy.test.js
 * @description Unit tests verifying high-precision degree extraction and experience calculation in heuristicResumeParser.
 */

import { describe, it, expect } from 'vitest';
import { heuristicResumeParser } from '../src/services/ai.service.js';

describe('Module M15 — Degree & Experience Accuracy Tests', () => {
  it('should accurately extract Bachelor’s Degree for Noraiz Ali CV without converting to Master’s', () => {
    const cvText = `
      ABOUT ME
      I hold a BS in Computer Science, and I'm passionate about software engineering.
      EDUCATION AND TRAINING
      [ 30/07/2023 ] Bachelor of Science ( Computer Science)
      National University of Computer & Emerging Sciences
      Intermediate (Pre-Engineering)
      Al-Falah Grammar Higher Secondary School
      WORK EXPERIENCE
      [ 05/2024 – 11/2024 ] Front-end Development Intern
      [ 01/01/2025 – Current ] Web developer
      SKILLS: React.js, Tailwind CSS, JavaScript
    `;

    const parsed = heuristicResumeParser(cvText);
    expect(parsed.highestEducation).toBe('Bachelor’s Degree');
    expect(parsed.totalExperienceYears).toBeGreaterThanOrEqual(1);
  });

  it('should accurately extract Bachelor’s Degree for Mohammad Hamza Hakim (MERN Stack) CV', () => {
    const cvText = `
      Mohammad Hamza Hakim — ATS Resume
      Software Engineer (MERN Stack)
      EXPERIENCE
      A to Z Coders | Full Stack Developer
      06/2024 – Present | Faisalabad, Pakistan
      Worked on React, Node.js, Express, MongoDB.
      Independent Full Stack Developer
      01/2024 – 05/2024
      EDUCATION
      Bachelor of Science in Computer Science
      National University of Computer & Emerging Sciences (FAST-NUCES), Faisalabad
      SKILLS: React, Node.js, Express, MongoDB, Tailwind, Redux
    `;

    const parsed = heuristicResumeParser(cvText);
    expect(parsed.highestEducation).toBe('Bachelor’s Degree');
    expect(parsed.totalExperienceYears).toBeGreaterThanOrEqual(1);
  });

  it('should accurately extract Bachelor’s Degree for Norez Ali (BSCS / Laravel) CV', () => {
    const cvText = `
      NOREZ ALI
      Worked as a Junior Laravel Developer for 1 year, developing and maintaining web
      applications using Laravel, PHP, and MySQL.
      BS Computer Science (BSCS) with knowledge of software development.
      Bachelors Of Computer Science Virtual University
      UnitSol (1 year)
      Cubix Solutions (1 year)
    `;

    const parsed = heuristicResumeParser(cvText);
    expect(parsed.highestEducation).toBe('Bachelor’s Degree');
    expect(parsed.totalExperienceYears).toBeGreaterThanOrEqual(1);
  });

  it('should NOT falsely identify Master’s Degree when regular words contain ms or master', () => {
    const negativeCases = [
      'Experienced in CMS platforms and Design Systems.',
      'Mastering full-stack web applications with Redux and React.',
      'Scrum Master certified and agile team facilitator with BS Software Engineering.',
      'Strong knowledge of algorithms, data structures, and operating systems.'
    ];

    negativeCases.forEach((sample) => {
      const parsed = heuristicResumeParser(sample);
      expect(parsed.highestEducation).not.toBe('Master’s Degree');
    });
  });

  it('should accurately extract true Master’s degree when genuine academic credentials exist', () => {
    const masterCv = `
      Jane Doe
      EDUCATION
      Master of Science in Software Engineering
      LUMS, Lahore
      BS in Computer Science, FAST
      5 years of experience in distributed systems
    `;

    const parsed = heuristicResumeParser(masterCv);
    expect(parsed.highestEducation).toBe('Master’s Degree');
    expect(parsed.totalExperienceYears).toBe(5);
  });

  it('should return Not Specified / Verification Required when no degree is mentioned', () => {
    const noDegreeCv = `
      Self-taught programmer with 3 years of experience in JavaScript and Python.
    `;

    const parsed = heuristicResumeParser(noDegreeCv);
    expect(parsed.highestEducation).toBe('Not Specified / Verification Required');
    expect(parsed.totalExperienceYears).toBe(3);
  });
});
