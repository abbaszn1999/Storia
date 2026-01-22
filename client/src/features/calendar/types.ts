// Calendar Types (Client-Side)
// ═══════════════════════════════════════════════════════════════════════════
// Types for the content calendar feature

// Re-export types that match server-side
export type LatePlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'linkedin';
export type LatePostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial';
export type LateVisibility = 'public' | 'private' | 'unlisted';

// ─────────────────────────────────────────────────────────────────────────────
// STORIA METADATA
// ─────────────────────────────────────────────────────────────────────────────

export interface StoriaPostMetadata {
  storiaVideoId?: string;
  storiaStoryId?: string;
  storiaContentType: 'video' | 'story';
  storiaContentMode: string;
  storiaThumbnailUrl?: string;
  storiaDuration?: number;
  storiaAspectRatio?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LATE.DEV POST (Simplified)
// ─────────────────────────────────────────────────────────────────────────────

export interface LateMediaItem {
  url: string;
  type?: 'image' | 'video' | 'document';
}

export interface LatePostPlatform {
  platform: LatePlatform;
  accountId: string;
  customContent?: string;
}

export interface LatePost {
  _id: string;
  title?: string;
  content?: string;
  mediaItems?: LateMediaItem[];
  platforms: LatePostPlatform[];
  scheduledFor?: string;
  timezone?: string;
  status: LatePostStatus;
  metadata?: Record<string, any>;
  publishedUrls?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENRICHED CALENDAR POST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Late.dev post enriched with Storia video/story data
 */
export interface CalendarPost extends LatePost {
  /** Storia video data (if content type is 'video') */
  storiaVideo?: {
    id: string;
    title: string;
    mode: string;
    thumbnailUrl?: string | null;
    exportUrl?: string | null;
    createdAt: string;
  } | null;
  /** Storia story data (if content type is 'story') */
  storiaStory?: {
    id: string;
    projectName: string;
    storyMode: string;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
    duration?: number | null;
    aspectRatio?: string | null;
    createdAt: string;
  } | null;
  /** Extracted Storia metadata */
  storiaMetadata?: StoriaPostMetadata | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarPostsResponse {
  posts: CalendarPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CalendarQueryParams {
  dateFrom?: string;
  dateTo?: string;
  status?: LatePostStatus;
  platform?: LatePlatform;
  page?: number;
  limit?: number;
}

export interface SchedulePostInput {
  videoId?: string;
  storyId?: string;
  contentType: 'video' | 'story';
  contentMode: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  aspectRatio?: string;
  scheduledFor: string;
  timezone?: string;
  platforms: Array<{
    platform: LatePlatform;
    accountId: string;
  }>;
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

export interface ReschedulePostInput {
  scheduledFor: string;
  timezone?: string;
}

export interface SchedulePostResult {
  postId: string;
  status: LatePostStatus;
  scheduledFor: string;
  post: CalendarPost;
}
