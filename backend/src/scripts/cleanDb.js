import 'dotenv/config';
import mongoose from 'mongoose';

async function cleanDatabase() {
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    console.log('🔍 Identifying Super Admin user...');
    const adminUser = await db.collection('users').findOne({ email: 'mhamzaofficial159@gmail.com' });
    if (!adminUser) {
      console.error('❌ Super Admin user (mhamzaofficial159@gmail.com) not found!');
      process.exit(1);
    }
    console.log(`✅ Found Super Admin user: ${adminUser.email} (${adminUser._id})`);

    // Ensure Super Admin Employee profile exists
    let adminEmp = await db.collection('employees').findOne({ email: 'mhamzaofficial159@gmail.com' });
    if (!adminEmp) {
      adminEmp = await db.collection('employees').findOne({ employeeCode: 'EMP-000' });
    }

    if (!adminEmp) {
      console.log('Creating fresh Super Admin employee record...');
      const insertResult = await db.collection('employees').insertOne({
        employeeCode: 'EMP-000',
        name: 'Super Admin',
        email: 'mhamzaofficial159@gmail.com',
        phone: '+92 300 0000000',
        cnic: '35201-0000000-1',
        gender: 'Male',
        employmentType: 'Permanent',
        status: 'Active',
        joiningDate: new Date(),
        isDeleted: false,
        userId: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      adminEmp = { _id: insertResult.insertedId };
    } else {
      await db.collection('employees').updateOne(
        { _id: adminEmp._id },
        {
          $set: {
            departmentId: null,
            designationId: null,
            shiftId: null,
            managerId: null,
            isDeleted: false,
            status: 'Active',
            userId: adminUser._id,
            email: 'mhamzaofficial159@gmail.com',
            employeeCode: 'EMP-000',
            updatedAt: new Date()
          }
        }
      );
    }
    console.log(`✅ Secured Super Admin employee: EMP-000 (${adminEmp._id})`);

    // Ensure two-way linkage
    await db.collection('users').updateOne(
      { _id: adminUser._id },
      {
        $set: {
          employeeId: adminEmp._id,
          isActive: true,
          mustChangePassword: false,
          updatedAt: new Date()
        }
      }
    );

    // 1. Delete all other users
    const usersResult = await db.collection('users').deleteMany({
      _id: { $ne: adminUser._id }
    });
    console.log(`🧹 Deleted users: ${usersResult.deletedCount}`);

    // 2. Delete all other employees
    const empResult = await db.collection('employees').deleteMany({
      _id: { $ne: adminEmp._id }
    });
    console.log(`🧹 Deleted employees: ${empResult.deletedCount}`);

    // 3. Clear departments, designations, shifts
    const deptResult = await db.collection('departments').deleteMany({});
    console.log(`🧹 Deleted departments: ${deptResult.deletedCount}`);

    const desigResult = await db.collection('designations').deleteMany({});
    console.log(`🧹 Deleted designations: ${desigResult.deletedCount}`);

    const shiftResult = await db.collection('shifts').deleteMany({});
    console.log(`🧹 Deleted shifts: ${shiftResult.deletedCount}`);

    // 4. Delete non-system roles
    const rolesResult = await db.collection('roles').deleteMany({
      isSystem: { $ne: true }
    });
    console.log(`🧹 Deleted non-system custom roles: ${rolesResult.deletedCount}`);

    // 5. Clear audit logs & login histories
    const auditResult = await db.collection('auditlogs').deleteMany({});
    console.log(`🧹 Deleted audit logs: ${auditResult.deletedCount}`);

    const loginResult = await db.collection('loginhistories').deleteMany({});
    console.log(`🧹 Deleted login histories: ${loginResult.deletedCount}`);

    // 6. Clear change requests, delegations, histories
    const crResult = await db.collection('profilechangerequests').deleteMany({});
    console.log(`🧹 Deleted profile change requests: ${crResult.deletedCount}`);

    const delResult = await db.collection('delegations').deleteMany({});
    console.log(`🧹 Deleted delegations: ${delResult.deletedCount}`);

    const ehResult = await db.collection('employeehistories').deleteMany({});
    console.log(`🧹 Deleted employee histories: ${ehResult.deletedCount}`);

    console.log('\n========================================');
    console.log('🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY');
    console.log('========================================');

    // Summary count
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`📊 ${c.name}: ${count}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected gracefully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  }
}

cleanDatabase();
