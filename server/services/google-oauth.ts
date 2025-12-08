import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const stateStore = new Map<string, { timestamp: number }>();

function cleanupExpiredStates() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [state, data] of stateStore.entries()) {
    if (data.timestamp < tenMinutesAgo) {
      stateStore.delete(state);
    }
  }
}

export function generateState(): string {
  cleanupExpiredStates();
  const state = crypto.randomBytes(32).toString('hex');
  stateStore.set(state, { timestamp: Date.now() });
  return state;
}

export function verifyState(state: string): boolean {
  const data = stateStore.get(state);
  if (!data) return false;
  
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  if (data.timestamp < tenMinutesAgo) {
    stateStore.delete(state);
    return false;
  }
  
  stateStore.delete(state);
  return true;
}

function getRedirectUri(): string {
  if (process.env.REPLIT_DEPLOYMENT === '1') {
    const domains = process.env.REPLIT_DOMAINS?.split(',');
    if (domains && domains.length > 0) {
      return `https://${domains[0]}/api/auth/google/callback`;
    }
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;
  }
  return 'http://localhost:5000/api/auth/google/callback';
}

export function isGoogleOAuthConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function getGoogleOAuthClient(): OAuth2Client {
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

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export async function verifyGoogleToken(code: string): Promise<GoogleUserInfo> {
  const client = getGoogleOAuthClient();
  
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid token payload');
  }
  
  const nameParts = payload.name?.split(' ') || [];
  
  return {
    googleId: payload.sub,
    email: payload.email!,
    firstName: nameParts[0] || payload.email?.split('@')[0] || 'User',
    lastName: nameParts.slice(1).join(' ') || '',
    profileImageUrl: payload.picture,
  };
}
