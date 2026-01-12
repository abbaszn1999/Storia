import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

const PostgresSessionStore = connectPg(session);

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

/**
 * Setup session middleware for authentication
 */
export async function setupAuth(app: Express): Promise<void> {
  const sessionStore = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
    tableName: "sessions",
  });

  // Handle session store errors gracefully
  sessionStore.on('error', (error: Error) => {
    console.error('[Session Store] Error:', error.message);
    // Don't crash the app - sessions will fall back to memory if DB is unavailable
  });

  // Test database connection before setting up session store
  try {
    await pool.query('SELECT 1');
    console.log('[Session Store] Database connection verified');
  } catch (error) {
    console.error('[Session Store] Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('[Session Store] Sessions may not persist if database is unavailable');
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "storia-dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );
}

// Export middleware and utilities
export { isAuthenticated, getCurrentUserId, hashPassword, verifyPassword } from "./middleware";

// Export auth routes
export { default as authRoutes } from "./routes";
