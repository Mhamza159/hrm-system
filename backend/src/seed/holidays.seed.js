/**
 * @file holidays.seed.js
 * @description Seed Script for Pakistan Official Gazetted & Public Holidays.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.11)
 * - Standard Pakistan calendar with lunar flags for Islamic holidays
 */

import { Holiday } from '../models/holiday.model.js';

export const getPakistanHolidaysData = (year = 2026) => [
  {
    name: 'Kashmir Solidarity Day',
    date: new Date(Date.UTC(year, 1, 5)), // Feb 5
    year,
    type: 'gazetted',
    isLunar: false,
    description: 'National public holiday commemorating solidarity with Kashmiri people.'
  },
  {
    name: 'Pakistan Day',
    date: new Date(Date.UTC(year, 2, 23)), // Mar 23
    year,
    type: 'gazetted',
    isLunar: false,
    description: 'Commemoration of the Lahore Resolution (1940) and Republic adoption (1956).'
  },
  {
    name: 'Eid-ul-Fitr (Day 1)',
    date: new Date(Date.UTC(year, 2, 21)), // Tentative Lunar
    year,
    type: 'gazetted',
    isLunar: true,
    description: 'Religious festival marking the conclusion of Ramadan (Subject to moon sighting).'
  },
  {
    name: 'Eid-ul-Fitr (Day 2)',
    date: new Date(Date.UTC(year, 2, 22)),
    year,
    type: 'gazetted',
    isLunar: true,
    description: 'Second day of Eid-ul-Fitr public holidays.'
  },
  {
    name: 'Eid-ul-Fitr (Day 3)',
    date: new Date(Date.UTC(year, 2, 23)),
    year,
    type: 'gazetted',
    isLunar: true,
    description: 'Third day of Eid-ul-Fitr public holidays.'
  },
  {
    name: 'Labour Day',
    date: new Date(Date.UTC(year, 4, 1)), // May 1
    year,
    type: 'gazetted',
    isLunar: false,
    description: 'International Workers Day honoring the labor movement.'
  },
  {
    name: 'Eid-ul-Adha (Day 1)',
    date: new Date(Date.UTC(year, 4, 27)), // Tentative Lunar May/June
    year,
    type: 'gazetted',
    isLunar: true,
    description: 'Feast of the Sacrifice honoring Ibrahim willingness to sacrifice his son.'
  },
  {
    name: 'Eid-ul-Adha (Day 2)',
    date: new Date(Date.UTC(year, 4, 28)),
    year,
    type: 'gazetted',
    isLunar: true,
    description: 'Second day of Eid-ul-Adha holidays.'
  },
  {
    name: 'Ashura (9th Muharram)',
    date: new Date(Date.UTC(year, 5, 25)), // Tentative Lunar June/July
    year,
    type: 'gazetted',
    isLunar: true,
    description: '9th of Muharram solemn day of observance.'
  },
  {
    name: 'Ashura (10th Muharram)',
    date: new Date(Date.UTC(year, 5, 26)),
    year,
    type: 'gazetted',
    isLunar: true,
    description: '10th of Muharram Day of Ashura.'
  },
  {
    name: 'Independence Day',
    date: new Date(Date.UTC(year, 7, 14)), // Aug 14
    year,
    type: 'gazetted',
    isLunar: false,
    description: 'National Day celebrating sovereignty and independence of Pakistan (1947).'
  },
  {
    name: 'Eid Milad-un-Nabi',
    date: new Date(Date.UTC(year, 8, 25)), // Tentative Lunar Sept
    year,
    type: 'gazetted',
    isLunar: true,
    description: '12th Rabi-ul-Awwal observance of the Prophet birthday.'
  },
  {
    name: 'Iqbal Day',
    date: new Date(Date.UTC(year, 10, 9)), // Nov 9
    year,
    type: 'gazetted',
    isLunar: false,
    description: 'Birthday anniversary of Allama Muhammad Iqbal, national poet and philosopher.'
  },
  {
    name: 'Quaid-e-Azam Day / Christmas',
    date: new Date(Date.UTC(year, 11, 25)), // Dec 25
    year,
    type: 'gazetted',
    isLunar: false,
    description: 'Birthday of founder of Pakistan Muhammad Ali Jinnah and Christmas Day.'
  },
  {
    name: 'Day after Christmas',
    date: new Date(Date.UTC(year, 11, 26)), // Dec 26
    year,
    type: 'optional',
    isLunar: false,
    description: 'Optional holiday for Christian staff members.'
  }
];

export const seedPakistanHolidays = async (year = 2026, actorId = null) => {
  const holidays = getPakistanHolidaysData(year);
  let seededCount = 0;

  for (const h of holidays) {
    const exists = await Holiday.findOne({ date: h.date, name: h.name });
    if (!exists) {
      await Holiday.create({
        ...h,
        createdBy: actorId
      });
      seededCount++;
    }
  }

  return { total: holidays.length, seeded: seededCount };
};
