import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function clean() {
  const conn = await mongoose.connect(env.MONGO_URI);
  const adminDb = conn.connection.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name));

  for (const d of dbs.databases) {
    if (d.name.startsWith('hrm_test_')) {
      console.log('Dropping test DB:', d.name);
      const testDbConn = conn.connection.useDb(d.name);
      await testDbConn.dropDatabase();
      console.log('Dropped:', d.name);
    }
  }
  await mongoose.connection.close();
  console.log('Cleanup finished!');
}

clean().catch(console.error);
