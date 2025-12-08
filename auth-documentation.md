# Autommerce.ai Authentication System Documentation

## Overview

This document provides complete documentation for the authentication and authorization system used in Autommerce.ai. The system supports both traditional email/password authentication and Google OAuth sign-in.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Variables & Secrets](#environment-variables--secrets)
3. [Database Schema](#database-schema)
4. [Backend Services](#backend-services)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Authentication Flows](#authentication-flows)
8. [Email Service (Resend)](#email-service-resend)
9. [Google OAuth Integration](#google-oauth-integration)
10. [Session Management](#session-management)
11. [Security Considerations](#security-considerations)

---

## Architecture Overview

The authentication system is built with:
- **Backend**: Express.js with TypeScript
- **Frontend**: React with TypeScript, using wouter for routing
- **Session Store**: PostgreSQL-backed sessions via `connect-pg-simple`
- **Email Provider**: Resend for transactional emails
- **OAuth Provider**: Google OAuth 2.0
- **Password Hashing**: bcryptjs (10 rounds)

### File Structure

```
server/
├── core/
│   └── auth/
│       ├── routes.ts          # All authentication API routes
│       ├── middleware.ts      # Auth middleware (requireAuth, etc.)
│       └── onboarding-routes.ts
├── services/
│   ├── email-service.ts       # Resend email functions
│   └── google-oauth.ts        # Google OAuth helpers
└── index.ts                   # Session configuration

client/src/
├── core/
│   └── auth/
│       ├── SignIn.tsx         # Sign-in page component
│       ├── SignUp.tsx         # Sign-up page component
│       └── useAuth.ts         # Auth hook for state management
└── lib/
    └── queryClient.ts         # API request utilities
```

---

## Environment Variables & Secrets

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SESSION_SECRET` | Secret key for signing session cookies | Random 32+ character string |
| `APP_RESEND_API_KEY` | API key from Resend.com | `re_xxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Verified sender email in Resend | `noreply@yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxxxxxx` |

### Database Connection (Auto-populated by Replit)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `PGHOST` | PostgreSQL host |
| `PGPORT` | PostgreSQL port |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGDATABASE` | PostgreSQL database name |

### Replit Environment Variables (Auto-populated)

| Variable | Description |
|----------|-------------|
| `REPLIT_DEV_DOMAIN` | Development domain (e.g., `xxx.replit.dev`) |
| `REPLIT_DOMAINS` | Production domains (comma-separated) |
| `REPLIT_DEPLOYMENT` | Set to `1` when in production deployment |

---

## Database Schema

### Users Table

```typescript
// Location: shared/schema.ts

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"), // Nullable for OAuth users
  profilePictureUrl: text("profile_picture_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // OAuth fields
  googleId: text("google_id").unique(),
  githubId: text("github_id").unique(),  // Reserved for future use
  appleId: text("apple_id").unique(),    // Reserved for future use
  
  // Email verification fields
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  
  // Password reset fields
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  
  // Onboarding fields
  seoGoals: text("seo_goals").array(),
  howFoundUs: varchar("how_found_us", { length: 255 }),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  
  // Credit wallet
  creditBalance: numeric("credit_balance", { precision: 10, scale: 2 })
    .default("1000.00").notNull(),
});
```

### Insert Schema

```typescript
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  googleId: true,
  githubId: true,
  appleId: true,
  profilePictureUrl: true,
  emailVerified: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
```

---

## Backend Services

### Email Service (`server/services/email-service.ts`)

The email service uses Resend to send transactional emails.

```typescript
import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.APP_RESEND_API_KEY || process.env.RESEND_API_KEY;
  const fromEmail = process.env.APP_RESEND_FROM_EMAIL || 
                    process.env.RESEND_FROM_EMAIL || 
                    'onboarding@resend.dev';

  if (!apiKey) {
    throw new Error('APP_RESEND_API_KEY environment variable is not set.');
  }

  return {
    client: new Resend(apiKey.trim()),
    fromEmail
  };
}
```

#### Available Email Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `sendVerificationEmail(to, code)` | Send 6-digit verification code | Email address, 6-digit code |
| `sendPasswordResetEmail(to, code)` | Send password reset code | Email address, 6-digit code |
| `sendWelcomeEmail(to, username)` | Send welcome email after signup | Email address, username |
| `resendVerificationCode(to, code)` | Resend verification code | Email address, 6-digit code |

#### Email Templates

All emails use responsive HTML templates with:
- Autommerce.ai branding
- 6-digit verification codes displayed prominently
- 15-minute expiry notice
- Professional styling

### Google OAuth Service (`server/services/google-oauth.ts`)

```typescript
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
```

#### State Token Management (CSRF Protection)

```typescript
// Store state tokens temporarily (use Redis in production for scalability)
const stateStore = new Map<string, { timestamp: number }>();

// Generate cryptographically secure state token
export function generateState(): string {
  cleanupExpiredStates();
  const state = crypto.randomBytes(32).toString('hex');
  stateStore.set(state, { timestamp: Date.now() });
  return state;
}

// Verify state token (one-time use, 10-minute expiry)
export function verifyState(state: string): boolean {
  const data = stateStore.get(state);
  if (!data) return false;
  
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  if (data.timestamp < tenMinutesAgo) {
    stateStore.delete(state);
    return false;
  }
  
  stateStore.delete(state); // One-time use
  return true;
}
```

#### Redirect URI Logic

```typescript
function getRedirectUri(): string {
  // Production: Use replit.app domain
  if (process.env.REPLIT_DEPLOYMENT === '1') {
    return `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/google/callback`;
  }
  // Development: Use Replit dev domain
  return `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;
}
```

#### OAuth Client & Auth URL

```typescript
export function getGoogleOAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

export function getGoogleAuthUrl(state: string): string {
  const client = getGoogleOAuthClient();
  
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
    state,
  });
}
```

#### Token Verification

```typescript
export async function verifyGoogleToken(code: string) {
  const client = getGoogleOAuthClient();
  
  // Exchange authorization code for tokens
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  
  // Verify ID token
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid token payload');
  
  return {
    googleId: payload.sub,
    email: payload.email,
    username: payload.name || payload.email?.split('@')[0] || 'user',
    profilePictureUrl: payload.picture,
  };
}
```

---

## API Endpoints

### Authentication Routes (`/api/auth/*`)

#### POST `/api/auth/signup`

Create a new user account with email/password.

**Request Body:**
```json
{
  "username": "string (min 3 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Success Response (201):**
```json
{
  "user": { "id": 1, "username": "...", "email": "...", "createdAt": "..." },
  "message": "Please check your email for verification code",
  "requiresVerification": true
}
```

**Flow:**
1. Validate input with Zod schema
2. Check if email/username already exists
3. Hash password with bcrypt (10 rounds)
4. Generate 6-digit verification code
5. Create user with `emailVerified: false`
6. Send verification email via Resend
7. Return user data (without session - must verify email first)

---

#### POST `/api/auth/signin`

Sign in with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "user": { "id": 1, "username": "...", "email": "...", ... },
  "message": "Signed in successfully",
  "needsOnboarding": true|false
}
```

**Error Responses:**
- `401`: Invalid credentials or OAuth-only account
- `403`: Email not verified (returns `requiresVerification: true`)

**Flow:**
1. Find user by email
2. Check if user has password (OAuth users don't)
3. Verify password with bcrypt
4. Check if email is verified
5. Create session
6. Return user data with onboarding status

---

#### POST `/api/auth/verify-email`

Verify email with 6-digit code.

**Request Body:**
```json
{
  "email": "string",
  "code": "string (6 digits)"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Flow:**
1. Find user by email
2. Compare verification code
3. Check expiry (15 minutes)
4. Mark email as verified
5. Clear verification token
6. Create session

---

#### POST `/api/auth/resend-verification`

Resend verification code to email.

**Request Body:**
```json
{
  "email": "string"
}
```

**Success Response (200):**
```json
{
  "message": "Verification code sent successfully"
}
```

**Flow:**
1. Find user by email
2. Generate new 6-digit code
3. Set new expiry (15 minutes)
4. Send email via Resend

---

#### POST `/api/auth/forgot-password`

Request password reset code.

**Request Body:**
```json
{
  "email": "string"
}
```

**Success Response (200):**
```json
{
  "message": "If an account exists with this email, you will receive a password reset code"
}
```

**Flow:**
1. Find user by email (don't reveal if exists)
2. Check if OAuth-only account
3. Generate 6-digit reset code
4. Set expiry (15 minutes)
5. Send reset email via Resend

---

#### POST `/api/auth/reset-password`

Reset password with code.

**Request Body:**
```json
{
  "email": "string",
  "code": "string (6 digits)",
  "newPassword": "string (min 6 chars)"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Flow:**
1. Find user by email
2. Verify reset code
3. Check expiry
4. Hash new password
5. Update password and clear reset token

---

#### POST `/api/auth/logout`

Destroy session and log out.

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### GET `/api/auth/me`

Get current authenticated user. **Requires authentication.**

**Success Response (200):**
```json
{
  "user": { "id": 1, "username": "...", "email": "...", ... }
}
```

---

#### PATCH `/api/auth/profile`

Update user profile. **Requires authentication.**

**Request Body:**
```json
{
  "username": "string (min 3 chars)"
}
```

---

#### PATCH `/api/auth/password`

Change password. **Requires authentication.**

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 chars)"
}
```

---

#### POST `/api/auth/profile-picture`

Upload profile picture. **Requires authentication.**

**Request:** `multipart/form-data` with `profilePicture` file

**Limits:**
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

---

#### GET `/api/auth/profile-picture/:userId`

Get user's profile picture as binary image data.

---

#### DELETE `/api/auth/account`

Delete user account. **Requires authentication.**

---

### Google OAuth Routes

#### GET `/api/auth/google`

Initiate Google OAuth flow.

**Flow:**
1. Generate CSRF state token
2. Build Google Auth URL with scopes
3. Redirect to Google

---

#### GET `/api/auth/google/callback`

Handle Google OAuth callback.

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: CSRF protection token

**Flow:**
1. Verify state token (CSRF protection)
2. Exchange code for tokens
3. Verify ID token and extract user info
4. Check if user exists by Google ID
5. If not, check by email (link accounts)
6. If new user, create account with:
   - `emailVerified: true` (Google emails are pre-verified)
   - `password: null` (OAuth users don't have passwords)
   - Auto-generate unique username
7. Create session
8. Redirect to `/onboarding` (new users) or `/` (existing users)

**Error Handling:**
- Invalid state: Redirect to `/signin?error=invalid_state`
- OAuth failure: Redirect to `/signin?error=oauth_failed`

---

## Frontend Components

### SignIn Component (`client/src/core/auth/SignIn.tsx`)

**Features:**
- Email/password form with validation
- Show/hide password toggle
- "Remember Me" checkbox
- Forgot password link
- Google OAuth button
- Error handling with toast notifications

**Form Validation (Zod):**
```typescript
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
```

**Google Sign-In:**
```typescript
<Button onClick={() => window.location.href = '/api/auth/google'}>
  Sign in with Google
</Button>
```

### SignUp Component (`client/src/core/auth/SignUp.tsx`)

**Features:**
- Two-step flow: signup form → email verification
- Username, email, password form
- 6-digit verification code input
- Resend code with 60-second cooldown
- Google OAuth button

**Form Validation (Zod):**
```typescript
const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});
```

**Verification Flow:**
```typescript
// After signup success
if (data.requiresVerification) {
  setUserEmail(form.getValues("email"));
  setStep("verify");
  setResendTimer(60); // 60 second cooldown
}
```

---

## Authentication Flows

### 1. Email/Password Sign Up Flow

```
┌─────────────────┐
│   User fills    │
│   signup form   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /signup   │
│  Create user    │
│  (unverified)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send email     │
│  with 6-digit   │
│  code (Resend)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show verify    │
│  code input     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /verify   │
│  Verify code    │
│  Create session │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  /onboarding    │
└─────────────────┘
```

### 2. Email/Password Sign In Flow

```
┌─────────────────┐
│   User enters   │
│  email/password │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /signin   │
│  Verify creds   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No     ┌─────────────────┐
│ Email verified? │──────────▶│  Return 403     │
│                 │           │  + email addr   │
└────────┬────────┘           └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│  Create session │
│  Return user    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Yes    ┌─────────────────┐
│ Needs onboard?  │──────────▶│ Redirect        │
│                 │           │ /onboarding     │
└────────┬────────┘           └─────────────────┘
         │ No
         ▼
┌─────────────────┐
│  Redirect to /  │
└─────────────────┘
```

### 3. Google OAuth Flow

```
┌─────────────────┐
│  Click "Sign in │
│  with Google"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GET /auth/google│
│ Generate state  │
│ Redirect Google │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google consent │
│  screen         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google calls   │
│  /callback with │
│  code + state   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify state   │
│  Exchange code  │
│  for tokens     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No     ┌─────────────────┐
│ User exists by  │──────────▶│  Create new     │
│ googleId/email? │           │  user account   │
└────────┬────────┘           └────────┬────────┘
         │ Yes                         │
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│  Create session │◀──────────│ emailVerified   │
│                 │           │ = true          │
└────────┬────────┘           └─────────────────┘
         │
         ▼
┌─────────────────┐     Yes    ┌─────────────────┐
│  New user or    │──────────▶│ Redirect        │
│  !onboarded?    │           │ /onboarding     │
└────────┬────────┘           └─────────────────┘
         │ No
         ▼
┌─────────────────┐
│  Redirect to /  │
└─────────────────┘
```

### 4. Password Reset Flow

```
┌─────────────────┐
│  User clicks    │
│ "Forgot Password│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enter email    │
│  POST /forgot   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send reset     │
│  code via email │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enter code +   │
│  new password   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /reset-pwd │
│ Update password │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  /signin        │
└─────────────────┘
```

---

## Session Management

### Session Configuration (`server/index.ts`)

```typescript
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: pool,                    // PostgreSQL connection pool
    tableName: 'session',          // Session table name
    createTableIfMissing: true,    // Auto-create table
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,                 // Set to true in production with HTTPS
    httpOnly: true,                // Prevent XSS access to cookie
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));
```

### Session Data Structure

```typescript
// Defined in server/core/auth/middleware.ts

declare module "express-session" {
  interface SessionData {
    userId?: number;
    currentWorkspaceId?: number;
    user?: {
      id: number;
      username: string;
      email: string;
      createdAt: Date;
    };
  }
}
```

### Setting Session After Login

```typescript
// In /signin, /verify-email, or /google/callback

req.session.userId = user.id;
req.session.user = {
  id: user.id,
  username: user.username,
  email: user.email,
  profilePictureUrl: user.profilePictureUrl,
  createdAt: user.createdAt
};
```

---

## Auth Middleware

### `requireAuth` Middleware

```typescript
// Location: server/core/auth/middleware.ts

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};
```

### Usage in Routes

```typescript
// Protect a route
router.get("/me", requireAuth, async (req, res) => {
  const user = await storage.getUser(req.session.userId!);
  // ...
});

// Protect entire router
apiRouter.use("/workspaces", requireAuth, workspaceRoutes);
```

---

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never stored or returned in plaintext
- Minimum 6 characters required

### Session Security
- Sessions stored in PostgreSQL (not in-memory)
- `httpOnly` cookies prevent XSS attacks
- 30-day expiry with automatic cleanup

### OAuth Security
- CSRF protection with cryptographic state tokens
- State tokens are one-time use
- 10-minute state token expiry
- ID tokens verified with Google's public keys

### Verification Codes
- 6-digit numeric codes
- 15-minute expiry
- Cleared after successful verification

### Rate Limiting Recommendations
- Implement rate limiting on:
  - `/api/auth/signin` (prevent brute force)
  - `/api/auth/forgot-password` (prevent email spam)
  - `/api/auth/resend-verification` (prevent email spam)

---

## Google Cloud Console Setup

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - Development: `https://your-repl.replit.dev/api/auth/google/callback`
   - Production: `https://your-app.replit.app/api/auth/google/callback`
7. Copy Client ID and Client Secret to Replit Secrets

### Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Select **External** user type
3. Fill in app information:
   - App name: Autommerce.ai
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `userinfo.profile`
   - `userinfo.email`
5. Add test users (while in testing mode)

---

## Resend Setup

### Create Resend Account

1. Go to [Resend.com](https://resend.com/)
2. Create an account and verify your email
3. Navigate to **API Keys**
4. Create a new API key
5. Add to Replit Secrets as `APP_RESEND_API_KEY`

### Domain Verification (for production)

1. Go to **Domains** in Resend dashboard
2. Add your domain
3. Add DNS records as instructed
4. Once verified, update `RESEND_FROM_EMAIL` to use your domain

### Development Mode

For development, you can use Resend's test email:
- `from`: `onboarding@resend.dev`
- Emails only delivered to verified email addresses

---

## Storage Interface Methods

The authentication system uses these storage methods:

```typescript
interface IStorage {
  // User CRUD
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}
```

---

## Error Handling

### Standard Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error, invalid input) |
| 401 | Unauthorized (not logged in, invalid credentials) |
| 403 | Forbidden (email not verified) |
| 404 | Not found (user doesn't exist) |
| 500 | Server error |

### Error Response Format

```json
{
  "message": "Human-readable error message",
  "errors": [...] // Optional: Zod validation errors
}
```

---

## Testing Checklist

### Sign Up Flow
- [ ] Create account with valid credentials
- [ ] Reject duplicate email
- [ ] Reject duplicate username
- [ ] Receive verification email
- [ ] Verify with correct code
- [ ] Reject expired code
- [ ] Reject invalid code
- [ ] Resend verification code

### Sign In Flow
- [ ] Sign in with correct credentials
- [ ] Reject wrong password
- [ ] Reject non-existent email
- [ ] Block unverified email (show verification prompt)
- [ ] Redirect to onboarding if not completed

### Google OAuth
- [ ] Redirect to Google
- [ ] Return and create new user
- [ ] Return and link existing email
- [ ] Return and sign in existing Google user
- [ ] Handle OAuth errors gracefully

### Password Reset
- [ ] Request reset code
- [ ] Receive reset email
- [ ] Reset with valid code
- [ ] Reject expired code
- [ ] Cannot reset OAuth-only accounts

### Session Management
- [ ] Session persists across requests
- [ ] Logout destroys session
- [ ] Protected routes reject unauthenticated requests

---

## Common Issues & Solutions

### "Google OAuth credentials not configured"
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Secrets
- Restart the application after adding secrets

### "APP_RESEND_API_KEY not set"
- Add the Resend API key to Secrets
- Check for typos in the key name

### "Invalid or expired state token"
- State tokens expire after 10 minutes
- Don't reuse browser back button during OAuth flow
- Clear cookies and try again

### Session not persisting
- Check PostgreSQL connection
- Verify `session` table exists in database
- Check for cookie blocking in browser

### Emails not being received
- In development, emails only go to verified Resend email addresses
- Check spam folder
- Verify domain in Resend for production

---
