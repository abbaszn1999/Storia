import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import connectPg from "connect-pg-simple";
import { pool } from "../db";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, generateVerificationCode } from "../services/email-service";
import { generateState, verifyState, getGoogleAuthUrl, verifyGoogleToken, isGoogleOAuthConfigured } from "../services/google-oauth";

const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const deleteAccountSchema = z.object({
  password: z.string().optional(),
});

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

export async function setupAuth(app: Express): Promise<void> {
  const sessionStore = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
    tableName: "sessions",
  });

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

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export function getCurrentUserId(req: Request): string | undefined {
  return req.session?.userId;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        provider: "credentials",
        emailVerified: false,
      });

      await storage.updateUser(user.id, {
        emailVerificationToken: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      });

      await sendVerificationEmail(email, verificationCode);
      
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        message: "Please check your email for verification code",
        requiresVerification: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      if (user.emailVerificationToken !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (user.emailVerificationExpiry && new Date() > new Date(user.emailVerificationExpiry)) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      });

      req.session.userId = user.id;

      // Create default workspace for new user
      const existingWorkspaces = await storage.getWorkspacesByUserId(user.id);
      if (existingWorkspaces.length === 0) {
        await storage.createWorkspace({
          userId: user.id,
          name: "My Workspace",
          description: "Your default workspace",
        });
      }

      const displayName = user.firstName || user.email.split('@')[0];
      await sendWelcomeEmail(email, displayName);

      res.json({
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await storage.updateUser(user.id, {
        emailVerificationToken: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      });

      await sendVerificationEmail(email, verificationCode);

      res.json({ message: "Verification code sent successfully" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ 
          message: "This account uses Google sign-in. Please sign in with Google.",
          useGoogle: true,
        });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.emailVerified) {
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await storage.updateUser(user.id, {
          emailVerificationToken: verificationCode,
          emailVerificationExpiry: verificationExpiry,
        });

        await sendVerificationEmail(email, verificationCode);

        return res.status(403).json({
          message: "Please verify your email before signing in",
          requiresVerification: true,
          email: user.email,
        });
      }

      req.session.userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      res.json({ 
        message: "If an account exists with this email, you will receive a password reset code" 
      });

      if (!user) return;

      if (!user.passwordHash && user.googleId) {
        return;
      }

      const resetCode = generateVerificationCode();
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await storage.updateUser(user.id, {
        passwordResetToken: resetCode,
        passwordResetExpiry: resetExpiry,
      });

      await sendPasswordResetEmail(email, resetCode);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/verify-reset-code", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      if (user.passwordResetToken !== code) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      res.json({ message: "Code verified successfully" });
    } catch (error) {
      console.error("Verify reset code error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      if (user.passwordResetToken !== code) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      const passwordHash = await hashPassword(newPassword);

      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/auth/google", (req: Request, res: Response) => {
    try {
      if (!isGoogleOAuthConfigured()) {
        return res.status(503).json({ message: "Google OAuth is not configured" });
      }

      const state = generateState();
      const authUrl = getGoogleAuthUrl(state);
      res.redirect(authUrl);
    } catch (error) {
      console.error("Google OAuth initiation error:", error);
      res.redirect("/auth/sign-in?error=oauth_failed");
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error("Google OAuth error:", error);
        return res.redirect("/auth/sign-in?error=oauth_denied");
      }

      if (!state || !verifyState(state as string)) {
        return res.redirect("/auth/sign-in?error=invalid_state");
      }

      if (!code) {
        return res.redirect("/auth/sign-in?error=no_code");
      }

      const googleUser = await verifyGoogleToken(code as string);

      let user = await storage.getUserByGoogleId(googleUser.googleId);

      if (!user) {
        user = await storage.getUserByEmail(googleUser.email);
        
        if (user) {
          await storage.updateUser(user.id, {
            googleId: googleUser.googleId,
            emailVerified: true,
            profileImageUrl: user.profileImageUrl || googleUser.profileImageUrl,
          });
          user = await storage.getUser(user.id);
        } else {
          user = await storage.createUser({
            email: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            profileImageUrl: googleUser.profileImageUrl,
            provider: "google",
            providerId: googleUser.googleId,
            googleId: googleUser.googleId,
            emailVerified: true,
          });
        }
      }

      if (user) {
        req.session.userId = user.id;
        
        // Create default workspace if user doesn't have any
        const existingWorkspaces = await storage.getWorkspacesByUserId(user.id);
        if (existingWorkspaces.length === 0) {
          await storage.createWorkspace({
            userId: user.id,
            name: "My Workspace",
            description: "Your default workspace",
          });
        }
      }

      res.redirect("/");
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/auth/sign-in?error=oauth_failed");
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account Management Routes
  app.get("/api/account/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        provider: user.provider,
        googleId: user.googleId ? true : false,
        emailVerified: user.emailVerified,
        hasPassword: !!user.passwordHash,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/account/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { firstName, lastName } = parseResult.data;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName !== undefined ? firstName : user.firstName,
        lastName: lastName !== undefined ? lastName : user.lastName,
      });

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/account/change-password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parseResult = changePasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.flatten().fieldErrors;
        const errorMessage = Object.values(errors).flat()[0] || "Invalid request data";
        return res.status(400).json({ message: errorMessage });
      }

      const { currentPassword, newPassword } = parseResult.data;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.passwordHash) {
        return res.status(400).json({ message: "Cannot change password for accounts without a password. You signed up with Google." });
      }

      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateUser(userId, { passwordHash: newPasswordHash });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.delete("/api/account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parseResult = deleteAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { password } = parseResult.data;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For password-based accounts, verify password for re-authentication
      if (user.passwordHash) {
        if (!password) {
          return res.status(400).json({ message: "Password is required to delete account" });
        }
        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({ message: "Incorrect password" });
        }
      }

      // Delete user's workspaces and all related data
      await storage.deleteUserAccount(userId);

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
}
