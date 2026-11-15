/**
 * @file BirthdaysCard.jsx
 * @description Upcoming team celebrations & birthdays list.
 */

import React from 'react';
import { Cake } from 'lucide-react';
import { PersonRow } from '../../../../components/common/Person.jsx';

export function BirthdaysCard({ birthdays = [] }) {
  if (birthdays.length === 0) {
    return (
      <div className="space-y-1.5 py-8 text-center">
        <Cake className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">No birthdays in the next two weeks.</p>
      </div>
    );
  }

  return (
    <ul className="max-h-72 divide-y divide-[#EAECF0] overflow-y-auto dark:divide-[#1A3125]">
      {birthdays.map((b) => (
        <li key={b._id} className="py-3 first:pt-0 last:pb-0">
          <PersonRow
            person={b}
            size="sm"
            showRole={false}
            trailing={
              <div className="text-end">
                <span className="block font-mono text-xs font-semibold tabular-nums text-pink-600 dark:text-pink-400">{b.birthDate}</span>
                <span className="text-[11px] text-slate-400">{b.daysRemaining === 0 ? 'Today' : `in ${b.daysRemaining}d`}</span>
              </div>
            }
          />
        </li>
      ))}
    </ul>
  );
}
