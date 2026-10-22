/**
 * @file server.js
 * @description Application Entrypoint & HTTP Server Bootstrapper.
 * 
 * EXECUTION FLOW:
 * 1. Loads environment configuration and SMTP services.
 * 2. Establishes robust connection to MongoDB database cluster.
 * 2. Binds Express application to configured PORT.
 * 3. Gracefully handles startup failure with structured logging.
 */

import http from 'node:http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocketIO } from './services/socket.service.js';
import { initAutoAbsentJob } from './modules/attendance/jobs/autoAbsent.job.js';
import { initYearlyLeaveCron } from './jobs/yearlyLeave.job.js';
import { seedRolesAndAdmin } from './seed/roles.seed.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Ensure Core Roles and Super Admin are seeded in database
    await seedRolesAndAdmin();

    // 2. Wrap Express with standard Node HTTP Server
    const httpServer = http.createServer(app);

    // 3. Initialize Real-Time Socket.io Hub on the HTTP Server
    initSocketIO(httpServer);

    // 4. Initialize Scheduled Cron Jobs
    initAutoAbsentJob();
    initYearlyLeaveCron();

    // 5. Start HTTP & WebSocket Listener
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 HRM Server & Socket.io running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
