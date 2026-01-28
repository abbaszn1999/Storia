// Calendar Types
// ═══════════════════════════════════════════════════════════════════════════
// Types for the content calendar module
// Late.dev is the single source of truth - these types enrich Late.dev posts with Storia data

import type { LatePost, LatePlatform, LatePostStatus, LateVisibility } from '../integrations/late/types';
import type { Video, Story } from '@shared/schema';

// ─────────────────────────────────────────────────────────────────────────────
// STORIA METADATA IN LATE.DEV POSTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom metadata stored in Late.dev post.metadata field
 * This links Late.dev posts back to Storia content
 */
export interface StoriaPostMetadata {
  /** Storia video ID (for video modes: ambient, narrative, commerce, vlog, logo) */
  storiaVideoId?: string;
  /** Storia story ID (for story templates: problem-solution, tease-reveal, etc.) */
  storiaStoryId?: string;
  /** Content type: 'video' or 'story' */
  storiaContentType: 'video' | 'story';
  /** Content mode/template identifier */
  storiaContentMode: string;
  /** Original thumbnail URL from BunnyCDN */
  storiaThumbnailUrl?: string;
  /** Duration in seconds */
  storiaDuration?: number;
  /** Aspect ratio */
  storiaAspectRatio?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENRICHED CALENDAR POST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Late.dev post enriched with Storia video/story data
 * This is what the calendar page receives and displays
 */
export interface CalendarPost extends LatePost {
  /** Storia video data (if content type is 'video') */
  storiaVideo?: Video | null;
  /** Storia story data (if content type is 'story') */
  storiaStory?: Story | null;
  /** Extracted Storia metadata for quick access */
  storiaMetadata?: StoriaPostMetadata | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input for scheduling a video/story to be published
 */
export interface SchedulePostInput {
  /** Video ID (for videos) */
  videoId?: string;
  /** Story ID (for stories) */
  storyId?: string;
  /** Content type */
  contentType: 'video' | 'story';
  /** Content mode (ambient, narrative, problem-solution, etc.) */
  contentMode: string;
  /** Video URL from BunnyCDN */
  videoUrl: string;
  /** Thumbnail URL */
  thumbnailUrl?: string;
  /** Duration in seconds */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: string;
  /** Scheduled publish time (ISO 8601) */
  scheduledFor: string;
  /** Timezone (IANA format, e.g., 'America/New_York') */
  timezone?: string;
  /** Target platforms */
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
}

/**
 * Input for rescheduling a post
 */
export interface ReschedulePostInput {
  /** New scheduled time (ISO 8601) */
  scheduledFor: string;
  /** Timezone (IANA format) */
  timezone?: string;
}

/**
 * Calendar posts list response
 */
export interface CalendarPostsResponse {
  posts: CalendarPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Query parameters for listing calendar posts
 */
export interface CalendarQueryParams {
  /** Start date filter (ISO 8601) */
  dateFrom?: string;
  /** End date filter (ISO 8601) */
  dateTo?: string;
  /** Filter by status */
  status?: LatePostStatus;
  /** Filter by platform */
  platform?: LatePlatform;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE RESULT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result after scheduling a post
 */
export interface SchedulePostResult {
  /** Late.dev post ID */
  postId: string;
  /** Current status */
  status: LatePostStatus;
  /** Scheduled time */
  scheduledFor: string;
  /** The created/updated post */
  post: CalendarPost;
}
