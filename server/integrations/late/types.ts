// Late.dev API Types
// ═══════════════════════════════════════════════════════════════════════════
// Centralized type definitions for Late.dev integration

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LatePlatform = 
  | 'youtube' 
  | 'tiktok' 
  | 'instagram' 
  | 'facebook' 
  | 'twitter' 
  | 'linkedin' 
  | 'pinterest' 
  | 'reddit' 
  | 'bluesky' 
  | 'threads' 
  | 'googlebusiness';

export type LatePostStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'partial';

export type LateVisibility = 'public' | 'private' | 'unlisted';

export type LateMediaType = 'image' | 'video' | 'document';

export type LateTikTokPrivacyLevel = 
  | 'PUBLIC_TO_EVERYONE' 
  | 'MUTUAL_FOLLOW_FRIENDS' 
  | 'FOLLOWER_OF_CREATOR' 
  | 'SELF_ONLY';

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE & ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Late.dev Profile schema
 */
export interface LateProfile {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Late.dev SocialAccount schema
 */
export interface LateAccount {
  _id: string;
  platform: LatePlatform;
  profileId: string | { _id: string };
  platformUserId?: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  followersCount?: number;
  followersLastUpdated?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Media item for posts
 */
export interface LateMediaItem {
  url: string;
  type?: LateMediaType;
  thumbnail?: {
    url: string;
  };
}

/**
 * Media upload response
 */
export interface LateMediaUploadResponse {
  files: Array<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIKTOK SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TikTok-specific settings (REQUIRED when posting to TikTok)
 */
export interface LateTikTokSettings {
  /** When true, sends to Creator Inbox as draft */
  draft?: boolean;
  /** REQUIRED: One of the allowed privacy levels */
  privacy_level: LateTikTokPrivacyLevel;
  /** REQUIRED: Allow comments */
  allow_comment: boolean;
  /** REQUIRED for videos: Allow duets */
  allow_duet?: boolean;
  /** REQUIRED for videos: Allow stitches */
  allow_stitch?: boolean;
  /** Commercial content type */
  commercial_content_type?: 'none' | 'brand_organic' | 'brand_content';
  brand_partner_promote?: boolean;
  is_brand_organic_post?: boolean;
  /** REQUIRED: Must be true */
  content_preview_confirmed: boolean;
  /** REQUIRED: Must be true */
  express_consent_given: boolean;
  /** Override media type detection */
  media_type?: 'video' | 'photo';
  /** Thumbnail frame timestamp in ms (default 1000) */
  video_cover_timestamp_ms?: number;
  /** Cover image index for photo carousels */
  photo_cover_index?: number;
  /** Let TikTok add music (photos only) */
  auto_add_music?: boolean;
  /** Disclose AI-generated content */
  video_made_with_ai?: boolean;
  /** Long description for photo posts (max 4000 chars) */
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM-SPECIFIC DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * YouTube-specific options
 */
export interface LateYouTubeData {
  /** Video title (max 100 chars) */
  title?: string;
  /** Visibility: public, private, unlisted */
  visibility?: LateVisibility;
  /** Auto pinned comment (max 10000 chars) */
  firstComment?: string;
}

/**
 * Instagram-specific options
 */
export interface LateInstagramData {
  /** 'story' for Stories, 'reel' for Reels */
  contentType?: 'story' | 'reel' | 'feed';
  /** Collaborator usernames (max 3) */
  collaborators?: string[];
}

/**
 * Facebook-specific options
 */
export interface LateFacebookData {
  /** 'story' for Stories */
  contentType?: 'story' | 'feed';
  /** Specific page ID if multiple pages */
  pageId?: string;
  /** Auto pinned comment */
  firstComment?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Platform target in a post
 */
export interface LatePostPlatform {
  platform: LatePlatform;
  accountId: string;
  /** Custom content for this platform */
  customContent?: string;
  /** Custom media for this platform */
  customMedia?: LateMediaItem[];
  /** Platform-specific options */
  platformSpecificData?: LateYouTubeData | LateInstagramData | LateFacebookData;
}

/**
 * Create post request
 */
export interface LateCreatePostInput {
  /** Post content/description */
  content: string;
  /** Title (for YouTube) */
  title?: string;
  /** Media items */
  mediaItems: LateMediaItem[];
  /** Target platforms */
  platforms: LatePostPlatform[];
  /** Schedule time (ISO 8601) */
  scheduledFor?: string;
  /** Publish immediately */
  publishNow?: boolean;
  /** Save as draft */
  isDraft?: boolean;
  /** Timezone (IANA format) */
  timezone?: string;
  /** Tags/keywords (for YouTube) */
  tags?: string[];
  /** Hashtags */
  hashtags?: string[];
  /** Mentions */
  mentions?: string[];
  /** Enable crossposting */
  crosspostingEnabled?: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** TikTok-specific settings */
  tiktokSettings?: LateTikTokSettings;
  /** Profile ID if using queue */
  queuedFromProfile?: string;
}

/**
 * Post response from Late.dev
 */
export interface LatePost {
  _id: string;
  userId: string;
  title?: string;
  content?: string;
  mediaItems?: LateMediaItem[];
  platforms: LatePostPlatform[];
  scheduledFor?: string;
  timezone?: string;
  status: LatePostStatus;
  tags?: string[];
  hashtags?: string[];
  mentions?: string[];
  visibility?: LateVisibility;
  metadata?: Record<string, any>;
  tiktokSettings?: LateTikTokSettings;
  queuedFromProfile?: string;
  publishedUrls?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

/**
 * Create post response
 */
export interface LateCreatePostResponse {
  post: LatePost;
  message: string;
}

/**
 * Update post request (partial update)
 * Only draft, scheduled, failed, and partial posts can be edited
 */
export interface LateUpdatePostInput {
  /** Post content/description */
  content?: string;
  /** Title (for YouTube) */
  title?: string;
  /** Media items */
  mediaItems?: LateMediaItem[];
  /** Target platforms */
  platforms?: LatePostPlatform[];
  /** Schedule time (ISO 8601) */
  scheduledFor?: string;
  /** Publish immediately */
  publishNow?: boolean;
  /** Save as draft */
  isDraft?: boolean;
  /** Timezone (IANA format) */
  timezone?: string;
  /** Tags/keywords (for YouTube) */
  tags?: string[];
  /** Hashtags */
  hashtags?: string[];
  /** Mentions */
  mentions?: string[];
  /** Enable crossposting */
  crosspostingEnabled?: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** TikTok-specific settings */
  tiktokSettings?: LateTikTokSettings;
}

/**
 * Update post response
 */
export interface LateUpdatePostResponse {
  post: LatePost;
  message: string;
}

/**
 * List posts response
 */
export interface LateListPostsResponse {
  posts: LatePost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK
// ─────────────────────────────────────────────────────────────────────────────

export type LateWebhookEventType = 
  | 'account.connected' 
  | 'account.disconnected' 
  | 'account.error' 
  | 'post.published' 
  | 'post.failed' 
  | 'post.scheduled';

export interface LateWebhookEvent {
  event: LateWebhookEventType;
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
    publishedUrl?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR
// ─────────────────────────────────────────────────────────────────────────────

export interface LateError {
  error: string;
  message: string;
  statusCode: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface LateJWTResponse {
  token: string;
  expiresAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORIA PUBLISH INPUT (Our App → Late.dev)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input for publishing from Storia to social media
 */
export interface StoriaPublishInput {
  /** Workspace ID (to get lateProfileId) */
  workspaceId: string;
  /** Video URL from BunnyCDN */
  videoUrl: string;
  /** Selected platforms with their account IDs */
  platforms: Array<{
    platform: LatePlatform;
    accountId: string;
  }>;
  /** Metadata per platform */
  metadata: {
    youtube?: {
      title: string;
      description: string;
      tags?: string[];
      visibility?: LateVisibility;
    };
    tiktok?: {
      caption: string;
      hashtags?: string[];
    };
    instagram?: {
      caption: string;
      hashtags?: string[];
    };
    facebook?: {
      caption: string;
      hashtags?: string[];
    };
  };
  /** Publish immediately or schedule */
  publishNow?: boolean;
  scheduledFor?: string;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STORIA METADATA (for calendar integration)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Storia video ID (for videos from ambient, narrative, commerce, etc.) */
  storiaVideoId?: string;
  /** Storia story ID (for stories from problem-solution, tease-reveal, etc.) */
  storiaStoryId?: string;
  /** Content type: 'video' or 'story' */
  storiaContentType?: 'video' | 'story';
  /** Content mode (ambient, narrative, problem-solution, etc.) */
  storiaContentMode?: string;
  /** Thumbnail URL from BunnyCDN */
  storiaThumbnailUrl?: string;
  /** Duration in seconds */
  storiaDuration?: number;
  /** Aspect ratio */
  storiaAspectRatio?: string;
}

/**
 * Output from Storia publish
 */
export interface StoriaPublishOutput {
  postId: string;
  status: LatePostStatus;
  platforms: Array<{
    platform: LatePlatform;
    status: 'pending' | 'published' | 'failed';
    publishedUrl?: string;
    error?: string;
  }>;
}
