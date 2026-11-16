/**
 * @file m15.skillsMatching.test.js
 * @description Unit tests verifying tokenization of compound job requirements and accurate matched vs unmatched skills separation.
 */

import { describe, it, expect } from 'vitest';
import { tokenizeJobRequirements, screenCandidateFit } from '../src/services/ai.service.js';

describe('Module M15 — Skills Tokenization & Matching Tests', () => {
  it('should split compound requirement strings into distinct canonical skill tokens', () => {
    const rawReqs = [
      'React Js',
      'Node Js Html Css Javascript Mongo DB MYSQL Tailwind Css Bootstrap'
    ];

    const tokens = tokenizeJobRequirements(rawReqs);
    expect(tokens).toContain('React Js');
    expect(tokens).toContain('Node Js');
    expect(tokens).toContain('HTML');
    expect(tokens).toContain('CSS');
    expect(tokens).toContain('JavaScript');
    expect(tokens).toContain('Mongo DB');
    expect(tokens).toContain('MySQL');
    expect(tokens).toContain('Tailwind');
    expect(tokens).toContain('Bootstrap');
  });

  it('should accurately separate matched skills from missing skills for candidate with partial skills', async () => {
    const parsedProfile = {
      candidateName: 'Noraiz Ali',
      parsedSkills: ['JavaScript', 'React', 'SQL', 'Tailwind', 'CSS', 'HTML', 'Redux'],
      totalExperienceYears: 1,
      highestEducation: 'Bachelor’s Degree'
    };

    const jobRequirements = [
      'React Js',
      'Node Js Html Css Javascript Mongo DB MYSQL Tailwind Css Bootstrap'
    ];

    const result = await screenCandidateFit({
      parsedProfile,
      cvText: 'I am a frontend developer proficient in React and Tailwind.',
      jobTitle: 'Full Stack Developer',
      jobDescription: 'Build scalable MERN web applications.',
      jobRequirements,
      minExperienceYears: 2
    });

    // Matched skills should contain React, Tailwind, CSS, HTML, JavaScript
    const matchedLower = result.matchingStrengths.map((s) => s.toLowerCase());
    expect(matchedLower.some((s) => s.includes('react'))).toBe(true);
    expect(matchedLower.some((s) => s.includes('tailwind'))).toBe(true);
    expect(matchedLower.some((s) => s.includes('javascript'))).toBe(true);

    // Missing skills MUST contain Node and Mongo and Bootstrap
    const missingLower = result.missingSkills.map((s) => s.toLowerCase());
    expect(missingLower.some((s) => s.includes('node'))).toBe(true);
    expect(missingLower.some((s) => s.includes('mongo'))).toBe(true);
    expect(missingLower.some((s) => s.includes('bootstrap'))).toBe(true);

    // Should NOT have 98% false match because backend skills are missing
    expect(result.aiScore).toBeLessThan(90);
    expect(result.aiScore).toBeGreaterThanOrEqual(40);
  });

  it('should award near-perfect score when candidate possesses all requirements', async () => {
    const fullStackProfile = {
      candidateName: 'Expert MERN',
      parsedSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'SQL', 'Bootstrap'],
      totalExperienceYears: 3,
      highestEducation: 'Bachelor’s Degree'
    };

    const result = await screenCandidateFit({
      parsedProfile: fullStackProfile,
      cvText: 'Full Stack MERN Engineer with 3 years of commercial production experience.',
      jobTitle: 'Full Stack Developer',
      jobDescription: 'Full stack development',
      jobRequirements: ['React Js', 'Node Js Html Css Javascript Mongo DB MYSQL Tailwind Css Bootstrap'],
      minExperienceYears: 2
    });

    expect(result.missingSkills.length).toBe(0);
    expect(result.aiScore).toBeGreaterThanOrEqual(90);
  });
});
