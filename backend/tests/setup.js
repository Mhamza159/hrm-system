import { afterAll } from 'vitest';
import mongoose from 'mongoose';

afterAll(async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const dbName = mongoose.connection.name;
      // Automatically tear down ephemeral test databases to respect MongoDB Atlas collection limits
      if (dbName && dbName.startsWith('hrm_test_')) {
        await mongoose.connection.dropDatabase();
      }
      await mongoose.disconnect();
    }
  } catch (err) {
    // Graceful error ignore during test runner teardown
  }
});
