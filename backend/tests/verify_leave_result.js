import { connectDB } from '../src/config/db.js';
import { Leave } from '../src/models/leave.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { Attendance } from '../src/models/attendance.model.js';

async function verify() {
  await connectDB();
  const l = await Leave.findOne().sort({ createdAt: -1 });
  console.log('Leave Final Status:', l.status);
  console.log('Final Decision By:', l.decisionBy);

  const bal = await LeaveBalance.findOne({ employeeId: l.employeeId, year: 2026 });
  const alBal = bal.balances.find(b => b.leaveTypeId.toString() === l.leaveTypeId.toString());
  console.log('LeaveBalance Annual Leave:', {
    allocated: alBal.allocatedDays,
    used: alBal.usedDays,
    pending: alBal.pendingDays,
    carried: alBal.carriedForwardDays
  });

  const att = await Attendance.find({ employeeId: l.employeeId, date: { $gte: l.startDate, $lte: l.endDate } });
  console.log('Synced Attendance Records Count:', att.length);
  if (att.length > 0) {
    console.log('Sample Attendance status:', att[0].status, 'leaveTypeId:', att[0].leaveTypeId);
  }
  process.exit(0);
}

verify().catch(e => { console.error(e); process.exit(1); });
