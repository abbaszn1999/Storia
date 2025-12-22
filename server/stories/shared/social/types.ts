/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARED SOCIAL MEDIA TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Shared types for social media functionality across all story modes
 */

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook';

// ─────────────────────────────────────────────────────────────────────────────
// METADATA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SocialMetadataInput {
  platform: SocialPlatform;
  scriptText: string;        // The video script/narration text
  duration: number;          // Video duration in seconds
}

export interface SocialMetadataOutput {
  platform: SocialPlatform;
  // YouTube specific
  title?: string;
  description?: string;
  // TikTok, Instagram, Facebook
  caption?: string;
  // Cost tracking
  cost?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISHING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PublishInput {
  videoUrl: string;
  platforms: SocialPlatform[];
  metadata: {
    youtube?: {
      title: string;
      description: string;
      tags?: string[];
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
  publishNow?: boolean;       // Publish immediately (default true)
  scheduledFor?: string;      // Schedule for later (ISO 8601)
}

export interface PublishOutput {
  postId: string;
  status: 'pending' | 'published' | 'scheduled' | 'failed';
  platforms: Array<{
    platform: SocialPlatform;
    status: 'pending' | 'published' | 'failed';
    publishedUrl?: string;
    error?: string;
  }>;
}

