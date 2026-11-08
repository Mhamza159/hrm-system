/**
 * @file ai.service.js
 * @description AI Resume Parsing & Intelligent Candidate Fit Screening Service.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.5, 15.6)
 * - Standard Library First (Ponytail Rung 3): Uses Node.js native `fetch` to call OpenAI API.
 * - Resilience: Gracefully falls back to deterministic heuristic parsing & matching when API key is unset or rate limited.
 */

const logger = console;

/**
 * Intelligent fallback parser using regex heuristics when LLM is unavailable
 */
export const heuristicResumeParser = (rawText = '') => {
  const text = String(rawText || '').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract Name (first prominent line or header)
  let candidateName = lines[0] || 'Unknown Applicant';
  if (candidateName.length > 50 || candidateName.toLowerCase().includes('resume') || candidateName.toLowerCase().includes('curriculum')) {
    candidateName = lines[1] || 'Candidate';
  }

  // Common tech & professional skills dictionary
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL',
    'SQL', 'Python', 'Django', 'Flask', 'Java', 'Spring', 'Docker', 'Kubernetes', 'AWS',
    'Git', 'CI/CD', 'REST API', 'GraphQL', 'Tailwind', 'CSS', 'HTML', 'Redux', 'Linux',
    'Next.js', 'Vue.js', 'Angular', 'Golang', 'Redis', 'Microservices', 'Jest', 'Playwright',
    'Figma', 'UI/UX', 'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
  ];

  const parsedSkills = skillKeywords.filter((sk) =>
    new RegExp(`\\b${sk.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text)
  );

  // Years of Experience regex (e.g. "5 years", "3+ years", "4 yrs")
  let totalExperienceYears = 0;
  const expMatch = text.match(/(\d+)(?:\+)?\s*(?:years?|yrs?)(?:\s*of)?\s*experience/i);
  if (expMatch && expMatch[1]) {
    totalExperienceYears = parseInt(expMatch[1], 10);
  } else {
    // Estimate based on year spans (e.g. 2019 - 2024)
    const yearMatches = [...text.matchAll(/\b(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|present|current)\b/gi)];
    if (yearMatches.length > 0) {
      const currentYear = new Date().getFullYear();
      let calculatedYears = 0;
      yearMatches.forEach((m) => {
        const start = parseInt(m[1], 10);
        const end = /present|current/i.test(m[2]) ? currentYear : parseInt(m[2], 10);
        if (end >= start) calculatedYears += (end - start);
      });
      totalExperienceYears = Math.min(Math.max(calculatedYears, 1), 30);
    }
  }

  // Highest Education regex
  let highestEducation = 'Bachelor’s Degree';
  if (/ph\.?d|doctorate/i.test(text)) {
    highestEducation = 'Ph.D. / Doctorate';
  } else if (/master|m\.?sc|m\.?s|mba/i.test(text)) {
    highestEducation = 'Master’s Degree';
  } else if (/bachelor|b\.?sc|b\.?s|b\.?e|b\.?tech/i.test(text)) {
    highestEducation = 'Bachelor’s Degree';
  } else if (/diploma|associate/i.test(text)) {
    highestEducation = 'Associate Degree / Diploma';
  }

  const executiveSummary = lines.slice(0, 4).join(' ').slice(0, 300) || 'Applicant profile parsed from CV.';

  return {
    candidateName,
    parsedSkills,
    totalExperienceYears,
    highestEducation,
    executiveSummary
  };
};

/**
 * Parses CV raw text into structured profile JSON
 */
export const parseResumeText = async (resumeText = '') => {
  const fallback = heuristicResumeParser(resumeText);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-placeholder')) {
    logger.info('OpenAI API key unset; using deterministic heuristic resume parser.');
    return fallback;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a high-precision ATS resume extraction engine. Extract applicant name, skills list, years of professional experience, highest education level, and brief executive summary. Return JSON matching the requested keys.'
          },
          {
            role: 'user',
            content: `Resume text:\n${resumeText.slice(0, 10000)}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'parsed_resume',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                candidateName: { type: 'string' },
                parsedSkills: { type: 'array', items: { type: 'string' } },
                totalExperienceYears: { type: 'number' },
                highestEducation: { type: 'string' },
                executiveSummary: { type: 'string' }
              },
              required: [
                'candidateName',
                'parsedSkills',
                'totalExperienceYears',
                'highestEducation',
                'executiveSummary'
              ],
              additionalProperties: false
            }
          }
        },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.warn(`OpenAI resume parse responded with ${response.status}: ${errBody}`);
      return fallback;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        candidateName: parsed.candidateName || fallback.candidateName,
        parsedSkills: Array.isArray(parsed.parsedSkills) && parsed.parsedSkills.length > 0 ? parsed.parsedSkills : fallback.parsedSkills,
        totalExperienceYears: typeof parsed.totalExperienceYears === 'number' ? parsed.totalExperienceYears : fallback.totalExperienceYears,
        highestEducation: parsed.highestEducation || fallback.highestEducation,
        executiveSummary: parsed.executiveSummary || fallback.executiveSummary
      };
    }
    return fallback;
  } catch (error) {
    logger.error('Error invoking OpenAI resume parser:', error);
    return fallback;
  }
};

/**
 * Screen candidate fit against job description & requirements
 */
export const screenCandidateFit = async ({
  parsedProfile,
  cvText,
  jobTitle,
  jobDescription,
  jobRequirements = [],
  minExperienceYears = 0
}) => {
  // Deterministic baseline calculation
  const reqLower = (jobRequirements || []).map((r) => r.toLowerCase().trim());
  const candSkills = (parsedProfile?.parsedSkills || []).map((s) => s.toLowerCase().trim());

  const matchingStrengths = [];
  const missingSkills = [];

  reqLower.forEach((req) => {
    const isMatched = candSkills.some((s) => s.includes(req) || req.includes(s));
    if (isMatched) {
      matchingStrengths.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const candExp = parsedProfile?.totalExperienceYears || 0;
  const expMatchRatio = minExperienceYears > 0 ? Math.min(candExp / minExperienceYears, 1.2) : 1;
  const skillMatchRatio = reqLower.length > 0 ? matchingStrengths.length / reqLower.length : 0.8;

  // Weight: 65% skills, 35% experience
  const rawScore = Math.round((skillMatchRatio * 65) + (Math.min(expMatchRatio, 1) * 35));
  const deterministicScore = Math.min(Math.max(rawScore, 15), 98);

  const deterministicSummary = `Candidate possesses ${candExp} year(s) of relevant experience with proficiency in ${matchingStrengths.slice(0, 4).join(', ') || 'core domains'}.${missingSkills.length > 0 ? ` Missing explicitly listed requirements: ${missingSkills.slice(0, 3).join(', ')}.` : ' Strong overall alignment with posted opening.'}`;

  const fallback = {
    aiScore: deterministicScore,
    matchingStrengths: matchingStrengths.length > 0 ? matchingStrengths : ['General Software Engineering Competence'],
    missingSkills,
    screeningSummary: deterministicSummary
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-placeholder')) {
    return fallback;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior technical recruiter and talent evaluator. Compare the candidate’s CV and skills against the job opening. Produce an integer fit score from 0 to 100, bulleted matching strengths, missing required skills, and a concise 2-sentence rationale.'
          },
          {
            role: 'user',
            content: `POSITION: ${jobTitle} (Min Experience Required: ${minExperienceYears} yrs)\nDESCRIPTION:\n${jobDescription}\nREQUIREMENTS:\n${(jobRequirements || []).join('\n')}\n\nCANDIDATE SKILLS: ${(parsedProfile?.parsedSkills || []).join(', ')}\nCANDIDATE EXPERIENCE: ${candExp} years\nCANDIDATE CV EXCERPT:\n${(cvText || '').slice(0, 5000)}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'candidate_screening_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                aiScore: { type: 'integer', minimum: 0, maximum: 100 },
                matchingStrengths: { type: 'array', items: { type: 'string' } },
                missingSkills: { type: 'array', items: { type: 'string' } },
                screeningSummary: { type: 'string' }
              },
              required: ['aiScore', 'matchingStrengths', 'missingSkills', 'screeningSummary'],
              additionalProperties: false
            }
          }
        },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        aiScore: typeof parsed.aiScore === 'number' ? parsed.aiScore : fallback.aiScore,
        matchingStrengths: Array.isArray(parsed.matchingStrengths) ? parsed.matchingStrengths : fallback.matchingStrengths,
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : fallback.missingSkills,
        screeningSummary: parsed.screeningSummary || fallback.screeningSummary
      };
    }
    return fallback;
  } catch (error) {
    logger.error('Error invoking OpenAI screening:', error);
    return fallback;
  }
};
