/**
 * @file orgchart_hierarchy.seed.js
 * @description Seeds a complete enterprise corporate hierarchy with multi-level reporting lines,
 * departments, and designations, while preserving the root user Mohammad Hamza Hakim as CEO.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { Employee } from '../models/employee.model.js';
import { User } from '../models/user.model.js';

export const seedOrgChartHierarchy = async () => {
  console.log('🌳 [ORG CHART SEED] Initializing complete corporate hierarchy...');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // 1. Departments to ensure
  const departmentDefs = [
    { name: 'Executive Management', code: 'EXEC', description: 'C-Suite Corporate Leadership & Strategy' },
    { name: 'Engineering & Technology', code: 'ENG', description: 'Core Software Architecture, Frontend, Backend & DevOps' },
    { name: 'Human Resources & People', code: 'HR', description: 'Talent Acquisition, People Operations, & Culture' },
    { name: 'Product & UI/UX', code: 'PROD', description: 'Product Roadmap, Design Systems & User Experience' },
    { name: 'Finance & Operations', code: 'FIN', description: 'Corporate Finance, Budgeting & Enterprise Operations' }
  ];

  const deptMap = {};
  for (const def of departmentDefs) {
    let dept = await Department.findOne({ code: def.code, isDeleted: false });
    if (!dept) {
      dept = await Department.create(def);
      console.log(`  + Created Department: ${def.name} (${def.code})`);
    }
    deptMap[def.code] = dept;
  }

  // 2. Designations across grade levels
  const designationDefs = [
    { title: 'Chief Executive Officer', code: 'CEO', grade: 'Executive', deptCode: 'EXEC' },
    { title: 'Chief Technology Officer', code: 'CTO', grade: 'Executive', deptCode: 'ENG' },
    { title: 'Head of Human Resources', code: 'HHR', grade: 'Lead', deptCode: 'HR' },
    { title: 'Principal Product Designer', code: 'PPD', grade: 'Lead', deptCode: 'PROD' },
    { title: 'Engineering Manager', code: 'EM', grade: 'Lead', deptCode: 'ENG' },
    { title: 'Senior Frontend Lead', code: 'SFL', grade: 'Senior', deptCode: 'ENG' },
    { title: 'Senior Backend Engineer', code: 'SBE', grade: 'Senior', deptCode: 'ENG' },
    { title: 'Senior HR Specialist', code: 'SHR', grade: 'Senior', deptCode: 'HR' },
    { title: 'Senior UI/UX Designer', code: 'SUD', grade: 'Senior', deptCode: 'PROD' },
    { title: 'Full Stack Developer', code: 'FSD', grade: 'Mid', deptCode: 'ENG' },
    { title: 'Talent Acquisition Specialist', code: 'TAS', grade: 'Mid', deptCode: 'HR' },
    { title: 'Product Designer', code: 'PD', grade: 'Mid', deptCode: 'PROD' },
    { title: 'Associate Software Engineer', code: 'ASE', grade: 'Junior', deptCode: 'ENG' },
    { title: 'QA Automation Engineer', code: 'QAE', grade: 'Junior', deptCode: 'ENG' }
  ];

  const desigMap = {};
  for (const def of designationDefs) {
    let desig = await Designation.findOne({ code: def.code, isDeleted: false });
    if (!desig) {
      desig = await Designation.create({
        title: def.title,
        code: def.code,
        grade: def.grade,
        departmentId: deptMap[def.deptCode]._id,
        description: `${def.title} role in ${deptMap[def.deptCode].name}`
      });
      console.log(`  + Created Designation: ${def.title} (${def.grade})`);
    }
    desigMap[def.code] = desig;
  }

  // 3. Find or link CEO (Mohammad Hamza Hakim)
  let ceoEmp = await Employee.findOne({ employeeCode: 'EMP-000' });
  const adminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' });

  if (ceoEmp) {
    ceoEmp.name = 'Mohammad Hamza Hakim';
    ceoEmp.email = 'mhamzaofficial159@gmail.com';
    ceoEmp.departmentId = deptMap['EXEC']._id;
    ceoEmp.designationId = desigMap['CEO']._id;
    ceoEmp.managerId = null;
    ceoEmp.status = 'Active';
    if (adminUser) {
      ceoEmp.userId = adminUser._id;
      adminUser.employeeId = ceoEmp._id;
      await adminUser.save();
    }
    await ceoEmp.save();
    console.log(`  ✓ Updated CEO node: ${ceoEmp.name} (EMP-000)`);
  } else {
    ceoEmp = await Employee.create({
      employeeCode: 'EMP-000',
      name: 'Mohammad Hamza Hakim',
      email: 'mhamzaofficial159@gmail.com',
      phone: '+92 300 1234567',
      departmentId: deptMap['EXEC']._id,
      designationId: desigMap['CEO']._id,
      managerId: null,
      status: 'Active',
      userId: adminUser?._id || null
    });
    if (adminUser) {
      adminUser.employeeId = ceoEmp._id;
      await adminUser.save();
    }
    console.log(`  + Created CEO node: ${ceoEmp.name} (EMP-000)`);
  }

  // Assign CEO as Head of Executive Department
  deptMap['EXEC'].headId = adminUser?._id || null;
  await deptMap['EXEC'].save();

  // 4. Hierarchical Employees Definition
  // Level 1: Reports directly to CEO (EMP-000)
  // Level 2: Reports to Level 1 Leads
  // Level 3: Reports to Level 2 Managers
  const hierarchyStaff = [
    // --- Direct Reports to CEO ---
    {
      code: 'EMP-001',
      name: 'Zubair Ahmed',
      email: 'zubair.ahmed@hrm.company.pk',
      phone: '+92 301 2345678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'CTO',
      managerCode: 'EMP-000'
    },
    {
      code: 'EMP-002',
      name: 'Ayesha Malik',
      email: 'ayesha.malik@hrm.company.pk',
      phone: '+92 302 3456789',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'HR',
      desigCode: 'HHR',
      managerCode: 'EMP-000'
    },
    {
      code: 'EMP-003',
      name: 'Bilal Tariq',
      email: 'bilal.tariq@hrm.company.pk',
      phone: '+92 303 4567890',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'PROD',
      desigCode: 'PPD',
      managerCode: 'EMP-000'
    },

    // --- Engineering Branch (Reports to CTO Zubair Ahmed EMP-001) ---
    {
      code: 'EMP-004',
      name: 'Farhan Saeed',
      email: 'farhan.saeed@hrm.company.pk',
      phone: '+92 304 5678901',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'EM',
      managerCode: 'EMP-001'
    },
    {
      code: 'EMP-005',
      name: 'Usman Raza',
      email: 'usman.raza@hrm.company.pk',
      phone: '+92 305 6789012',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'SFL',
      managerCode: 'EMP-001'
    },

    // --- Backend Team (Reports to EM Farhan Saeed EMP-004) ---
    {
      code: 'EMP-006',
      name: 'Hamza Ali',
      email: 'hamza.ali@hrm.company.pk',
      phone: '+92 306 7890123',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'SBE',
      managerCode: 'EMP-004'
    },
    {
      code: 'EMP-007',
      name: 'Ali Hassan',
      email: 'ali.hassan@hrm.company.pk',
      phone: '+92 307 8901234',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'FSD',
      managerCode: 'EMP-004'
    },

    // --- Frontend & QA Team (Reports to Frontend Lead Usman Raza EMP-005) ---
    {
      code: 'EMP-008',
      name: 'Zainab Noor',
      email: 'zainab.noor@hrm.company.pk',
      phone: '+92 308 9012345',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'ASE',
      managerCode: 'EMP-005'
    },
    {
      code: 'EMP-009',
      name: 'Ahsan Sheikh',
      email: 'ahsan.sheikh@hrm.company.pk',
      phone: '+92 309 0123456',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'ENG',
      desigCode: 'QAE',
      managerCode: 'EMP-005'
    },

    // --- Human Resources Branch (Reports to Head of HR Ayesha Malik EMP-002) ---
    {
      code: 'EMP-010',
      name: 'Sana Fatima',
      email: 'sana.fatima@hrm.company.pk',
      phone: '+92 310 1234567',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'HR',
      desigCode: 'SHR',
      managerCode: 'EMP-002'
    },
    {
      code: 'EMP-011',
      name: 'Noman Qureshi',
      email: 'noman.qureshi@hrm.company.pk',
      phone: '+92 311 2345678',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'HR',
      desigCode: 'TAS',
      managerCode: 'EMP-002'
    },

    // --- Product & Design Branch (Reports to Product Head Bilal Tariq EMP-003) ---
    {
      code: 'EMP-012',
      name: 'Mariam Khan',
      email: 'mariam.khan@hrm.company.pk',
      phone: '+92 312 3456789',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'PROD',
      desigCode: 'SUD',
      managerCode: 'EMP-003'
    },
    {
      code: 'EMP-013',
      name: 'Hira Aslam',
      email: 'hira.aslam@hrm.company.pk',
      phone: '+92 313 4567890',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
      deptCode: 'PROD',
      desigCode: 'PD',
      managerCode: 'EMP-003'
    }
  ];

  // Map to store created/found employees for manager resolution
  const empCodeToId = {
    'EMP-000': ceoEmp._id
  };

  for (const staff of hierarchyStaff) {
    let emp = await Employee.findOne({ employeeCode: staff.code });
    const managerId = empCodeToId[staff.managerCode] || ceoEmp._id;

    if (!emp) {
      emp = await Employee.create({
        employeeCode: staff.code,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        avatar: staff.avatar,
        departmentId: deptMap[staff.deptCode]._id,
        designationId: desigMap[staff.desigCode]._id,
        managerId: managerId,
        status: 'Active',
        joinDate: new Date('2024-01-15')
      });
      console.log(`  + Created Staff: ${staff.name} (${staff.code}) -> Reports to ${staff.managerCode}`);
    } else {
      emp.departmentId = deptMap[staff.deptCode]._id;
      emp.designationId = desigMap[staff.desigCode]._id;
      emp.managerId = managerId;
      emp.status = 'Active';
      if (!emp.avatar && staff.avatar) emp.avatar = staff.avatar;
      await emp.save();
      console.log(`  ✓ Updated Staff: ${staff.name} (${staff.code})`);
    }
    empCodeToId[staff.code] = emp._id;
  }

  console.log(`✅ [ORG CHART SEED] Successfully verified ${Object.keys(empCodeToId).length} employees in organizational hierarchy.`);
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('orgchart_hierarchy.seed.js')) {
  seedOrgChartHierarchy()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
