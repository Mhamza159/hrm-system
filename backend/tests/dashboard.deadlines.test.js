import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { env } from '../src/config/env.js';
import { Employee } from '../src/models/employee.model.js';
import { Job } from '../src/models/job.model.js';
import { Project } from '../src/models/project.model.js';
import ReviewCycle from '../src/models/reviewCycle.model.js';
import Checklist from '../src/models/checklist.model.js';
import { getUpcomingDeadlines } from '../src/modules/dashboard/dashboard.deadlines.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const oid = () => new mongoose.Types.ObjectId();
// Noon Karachi, N days from today: safely inside the day regardless of when the test runs.
const inDays = (n) => dayjs().tz('Asia/Karachi').startOf('day').add(n, 'day').add(12, 'hour').toDate();

describe('Dashboard upcoming deadlines', () => {
  const deptA = oid(), deptB = oid(), mgrE = oid(), staffE = oid(), otherE = oid();
  const team = { managerEmpId: mgrE, teamEmployeeIds: [mgrE, staffE], managedDeptIds: [deptA] };
  const cols = [Employee, Job, Project, ReviewCycle, Checklist];

  // Raw inserts: only fields the service reads, so skip model validation.
  const seedSet = async ({ dept, emp, mgr, days }) => {
    const ids = { probation: oid(), job: oid(), project: oid(), checklistTask: oid() };
    await Employee.collection.insertOne({ _id: ids.probation, name: 'P', employeeCode: String(ids.probation), status: 'Probation', isDeleted: false, probationEndDate: inDays(days[0]) });
    await Job.collection.insertOne({ _id: ids.job, slug: String(ids.job), title: 'J', departmentId: dept, status: 'Published', closingDate: inDays(days[1]) });
    await Project.collection.insertOne({ _id: ids.project, code: String(ids.project), name: 'Pr', managerId: mgr, members: [{ employeeId: emp }], status: 'active', isDeleted: false, endDate: inDays(days[2]) });
    await Checklist.collection.insertOne({ _id: oid(), employeeId: emp, isDeleted: false, status: 'in_progress', tasks: [{ _id: ids.checklistTask, title: 'T', completed: false, dueDate: inDays(days[3]) }] });
    return ids;
  };

  beforeAll(async () => {
    const uri = env.MONGO_URI.replace('hrm_development', 'hrm_test_dash_deadlines');
    if (!uri.includes('hrm_test')) throw new Error('Refusing to run: not a hrm_test database');
    await mongoose.connect(uri);
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });
  beforeEach(async () => {
    await Promise.all(cols.map((m) => m.collection.deleteMany({})));
  });

  it('returns all five types company-wide, sorted soonest first, within 30 days', async () => {
    const ids = await seedSet({ dept: deptA, emp: staffE, mgr: mgrE, days: [5, 10, 15, 25] });
    await ReviewCycle.collection.insertOne({ _id: oid(), title: 'C', status: 'Active', selfReviewDeadline: inDays(20) });
    await Employee.collection.insertOne({ _id: oid(), name: 'Late', employeeCode: 'L', status: 'Probation', isDeleted: false, probationEndDate: inDays(40) });
    const items = await getUpcomingDeadlines();
    expect(items.map((i) => i.type)).toEqual(['probation', 'job', 'project', 'review', 'checklist']);
    expect(items.every((i) => dayjs(i.date).diff(dayjs(), 'day') <= 30)).toBe(true);
    expect(items[0]).toMatchObject({ _id: ids.probation, title: 'Probation ends: P', link: `/employees/${ids.probation}` });
    expect(items.map((i) => i.link).slice(1)).toEqual(['/recruitment/jobs', '/projects', '/performance/cycles', '/onboarding']);
  });

  it('manager sees only team probation/checklists, own-dept jobs, own/member projects', async () => {
    const mine = await seedSet({ dept: deptA, emp: staffE, mgr: mgrE, days: [1, 2, 3, 4] });
    await seedSet({ dept: deptB, emp: otherE, mgr: otherE, days: [1, 2, 3, 4] });
    // probation is scoped by employee _id, so make the team's probation employee a team member
    await Employee.collection.deleteMany({});
    await Employee.collection.insertOne({ _id: staffE, name: 'S', employeeCode: 'S', status: 'Active', isDeleted: false, probationEndDate: inDays(1) });
    await Employee.collection.insertOne({ _id: otherE, name: 'O', employeeCode: 'O', status: 'Active', isDeleted: false, probationEndDate: inDays(1) });
    await ReviewCycle.collection.insertOne({ _id: oid(), title: 'C', status: 'Active', selfReviewDeadline: inDays(6) });
    const items = await getUpcomingDeadlines({ team });
    const teamItemIds = [staffE, mine.job, mine.project, mine.checklistTask].map(String);
    expect(items.filter((i) => i.type !== 'review').map((i) => String(i._id)).sort()).toEqual(teamItemIds.sort());
    expect(items.some((i) => i.type === 'review')).toBe(true);
  });

  it('ignores completed checklists, closed jobs, completed projects', async () => {
    await Checklist.collection.insertOne({ _id: oid(), employeeId: staffE, isDeleted: false, status: 'in_progress', tasks: [{ _id: oid(), title: 'Done', completed: true, dueDate: inDays(3) }] });
    await Job.collection.insertOne({ _id: oid(), slug: 'closed', title: 'Closed', departmentId: deptA, status: 'Closed', closingDate: inDays(3) });
    await Project.collection.insertOne({ _id: oid(), name: 'Done', managerId: mgrE, members: [], status: 'completed', isDeleted: false, endDate: inDays(3) });
    expect(await getUpcomingDeadlines()).toHaveLength(0);
  });

  it('caps at limit', async () => {
    await Employee.collection.insertMany(Array.from({ length: 10 }, (_, i) => ({
      _id: oid(), name: `E${i}`, employeeCode: `C${i}`, status: 'Probation', isDeleted: false, probationEndDate: inDays(i + 1),
    })));
    const items = await getUpcomingDeadlines();
    expect(items).toHaveLength(8);
    expect(items[0].title).toBe('Probation ends: E0');
  });

  it('excludes items due yesterday (window starts at start of today)', async () => {
    await Employee.collection.insertOne({ _id: oid(), name: 'Past', employeeCode: 'PA', status: 'Probation', isDeleted: false, probationEndDate: inDays(-1) });
    expect(await getUpcomingDeadlines()).toHaveLength(0);
  });

  it('picks the soonest checklist tasks across more than 8 checklists', async () => {
    const early = oid();
    await Checklist.collection.insertMany(Array.from({ length: 10 }, (_, i) => ({
      _id: oid(), employeeId: staffE, isDeleted: false, status: 'in_progress',
      tasks: [{ _id: i === 9 ? early : oid(), title: `T${i}`, completed: false, dueDate: inDays(i === 9 ? 1 : 10 + i) }],
    })));
    const items = await getUpcomingDeadlines();
    expect(items).toHaveLength(8);
    expect(items[0]._id).toEqual(early);
  });
});
