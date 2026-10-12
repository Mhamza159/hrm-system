/**
 * @file server.js
 * @description Application Entrypoint & HTTP Server Bootstrapper.
 * 
 * EXECUTION FLOW:
 * 1. Establishes robust connection to MongoDB database cluster.
 * 2. Binds Express application to configured PORT.
 * 3. Gracefully handles startup failure with structured logging.
 */

import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP Listener
    app.listen(env.PORT, () => {
      console.log(`🚀 HRM Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
