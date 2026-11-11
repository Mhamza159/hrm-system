/**
 * @file dashboard.deadlines.js
 * @description Role-scoped "Upcoming Deadlines" widget: probation ends, job closings, project ends,
 * self-review deadlines and onboarding tasks. Managers only see their team's items
 * (review cycles are company-wide by nature).
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

import { Employee } from '../../models/employee.model.js';
import { Job } from '../../models/job.model.js';
import { Project } from '../../models/project.model.js';
import ReviewCycle from '../../models/reviewCycle.model.js';
import Checklist from '../../models/checklist.model.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Karachi';

export const getUpcomingDeadlines = async ({ team = null, days = 30, limit = 8 } = {}) => {
  const start = dayjs().tz(TIMEZONE).startOf('day');
  const inWindow = { $gte: start.toDate(), $lte: start.add(days, 'day').toDate() };

  const empScope = team ? { _id: { $in: team.teamEmployeeIds } } : {};
  const jobScope = team ? { departmentId: { $in: team.managedDeptIds } } : {};
  const projectScope = team
    ? { $or: [{ managerId: team.managerEmpId }, { 'members.employeeId': { $in: team.teamEmployeeIds } }] }
    : {};
  const checklistScope = team ? { employeeId: { $in: team.teamEmployeeIds } } : {};

  const [employees, jobs, projects, cycles, checklists] = await Promise.all([
    Employee.find({ ...empScope, isDeleted: false, status: { $in: ['Active', 'Probation'] }, probationEndDate: inWindow })
      .select('name probationEndDate').sort({ probationEndDate: 1 }).limit(limit).lean(),
    Job.find({ ...jobScope, status: 'Published', closingDate: inWindow })
      .select('title closingDate').sort({ closingDate: 1 }).limit(limit).lean(),
    Project.find({ ...projectScope, isDeleted: false, status: { $in: ['active', 'on_hold'] }, endDate: inWindow })
      .select('name endDate').sort({ endDate: 1 }).limit(limit).lean(),
    ReviewCycle.find({ status: 'Active', selfReviewDeadline: inWindow })
      .select('title selfReviewDeadline').sort({ selfReviewDeadline: 1 }).limit(limit).lean(),
    // Due dates live on the checklist's tasks[] sub-documents, not on the checklist itself.
    Checklist.find({
      ...checklistScope, isDeleted: false, status: { $in: ['pending', 'in_progress'] },
      tasks: { $elemMatch: { completed: false, dueDate: inWindow } },
    }).select('tasks').limit(limit).lean(),
  ]);

  const tasks = checklists.flatMap((c) => c.tasks)
    .filter((t) => !t.completed && t.dueDate >= inWindow.$gte && t.dueDate <= inWindow.$lte);

  return [
    ...employees.map((e) => ({ _id: e._id, type: 'probation', title: `Probation ends: ${e.name}`, date: e.probationEndDate, link: `/employees/${e._id}` })),
    ...jobs.map((j) => ({ _id: j._id, type: 'job', title: `Job closes: ${j.title}`, date: j.closingDate, link: '/recruitment/jobs' })),
    ...projects.map((p) => ({ _id: p._id, type: 'project', title: `Project ends: ${p.name}`, date: p.endDate, link: '/projects' })),
    ...cycles.map((c) => ({ _id: c._id, type: 'review', title: `Self-review due: ${c.title}`, date: c.selfReviewDeadline, link: '/performance/cycles' })),
    ...tasks.map((t) => ({ _id: t._id, type: 'checklist', title: `Task due: ${t.title}`, date: t.dueDate, link: '/onboarding' })),
  ].sort((a, b) => a.date - b.date).slice(0, limit);
};
