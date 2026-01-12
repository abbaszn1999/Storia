import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debug log to verify env is loaded (safe to keep, logs only prefix)
console.log(
  "DATABASE_URL prefix:",
  process.env.DATABASE_URL?.slice(0, 60) || "undefined",
);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Connection pool settings to handle connection errors gracefully
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('[Database Pool] Unexpected error on idle client:', err.message);
  // Don't crash the app - connections will be retried automatically
});

// Handle connection errors
pool.on('connect', () => {
  console.log('[Database Pool] New client connected');
});

pool.on('remove', () => {
  console.log('[Database Pool] Client removed from pool');
});

export const db = drizzle(pool, { schema });
