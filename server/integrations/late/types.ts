// Late.dev API response types

/**
 * Late.dev Profile schema (from API documentation)
 */
export interface LateProfile {
  _id: string; // Profile ID
  userId: string; // Late.dev user ID
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Late.dev SocialAccount schema (from API documentation + actual response)
 */
export interface LateAccount {
  _id: string; // Account ID
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'reddit' | 'bluesky' | 'threads' | 'googlebusiness';
  profileId: string | { _id: string }; // Late.dev profile ID (can be string or object)
  platformUserId?: string; // Platform-specific user ID
  username?: string; // Platform username/handle
  displayName?: string; // Display name
  profilePicture?: string; // Profile picture URL
  isActive: boolean; // Whether account is active
  createdAt?: string; // When the account was connected
  updatedAt?: string; // Last update timestamp
  followersCount?: number; // Optional: only if analytics add-on is enabled
  followersLastUpdated?: string; // Optional: only if analytics add-on is enabled
}

export interface LateJWTResponse {
  token: string;
  expiresAt: string;
}

export interface LatePost {
  id: string;
  profileId: string;
  platforms: string[];
  content?: string;
  mediaUrls?: string[];
  scheduledFor?: string;
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed';
  publishedUrls?: Record<string, string>;
  createdAt: string;
  publishedAt?: string;
}

export interface LateWebhookEvent {
  event: 'account.connected' | 'account.disconnected' | 'account.error' | 'post.published' | 'post.failed' | 'post.scheduled';
  timestamp: string;
  data: {
    accountId?: string;
    profileId?: string;
    platform?: string;
    platformAccountId?: string;
    platformUsername?: string;
    platformName?: string;
    platformProfileImage?: string;
    postId?: string;
    error?: string;
  };
}

export interface LateError {
  error: string;
  message: string;
  statusCode: number;
}

