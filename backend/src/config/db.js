/**
 * @file db.js
 * @description MongoDB Mongoose Database Connection Manager.
 * 
 * NETWORK & CONNECTION RELIABILITY:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.2)
 * - DNS SRV Fix: Configures standard public DNS resolvers (8.8.8.8, 1.1.1.1) to prevent
 *   Windows / local ISP `querySrv ECONNREFUSED` resolution errors on MongoDB Atlas SRV URIs.
 * - AutoIndex: Enabled in development to enforce unique indexes (email, CNIC, etc.).
 */

import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Resolve MongoDB Atlas SRV DNS lookups reliably across all networks & ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  // If platform prevents custom DNS servers, continue with system defaults
}

/**
 * Connect to MongoDB Cluster (Atlas or local replica set)
 * @returns {Promise<typeof mongoose>} Mongoose connection instance
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: true
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};
