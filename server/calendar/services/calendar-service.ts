// Calendar Service
// ═══════════════════════════════════════════════════════════════════════════
// Business logic for the content calendar
// Fetches from Late.dev and enriches with Storia video/story data

import { lateService } from '../../integrations/late/service';
import { storage } from '../../storage';
import type { LatePost, LatePlatform, LatePostStatus, LateCreatePostInput, LateTikTokSettings } from '../../integrations/late/types';
import type {
  CalendarPost,
  CalendarPostsResponse,
  CalendarQueryParams,
  SchedulePostInput,
  SchedulePostResult,
  ReschedulePostInput,
  StoriaPostMetadata,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract Storia metadata from a Late.dev post
 */
function extractStoriaMetadata(post: LatePost): StoriaPostMetadata | null {
  const metadata = post.metadata;
  if (!metadata) return null;
  
  if (metadata.storiaVideoId || metadata.storiaStoryId) {
    return {
      storiaVideoId: metadata.storiaVideoId,
      storiaStoryId: metadata.storiaStoryId,
      storiaContentType: metadata.storiaContentType || 'video',
      storiaContentMode: metadata.storiaContentMode || 'unknown',
      storiaThumbnailUrl: metadata.storiaThumbnailUrl,
      storiaDuration: metadata.storiaDuration,
      storiaAspectRatio: metadata.storiaAspectRatio,
    };
  }
  
  return null;
}

/**
 * Enrich a Late.dev post with Storia video/story data
 */
async function enrichPostWithStoriaData(post: LatePost): Promise<CalendarPost> {
  const storiaMetadata = extractStoriaMetadata(post);
  
  const enrichedPost: CalendarPost = {
    ...post,
    storiaMetadata,
    storiaVideo: null,
    storiaStory: null,
  };
  
  if (!storiaMetadata) {
    return enrichedPost;
  }
  
  try {
    if (storiaMetadata.storiaContentType === 'video' && storiaMetadata.storiaVideoId) {
      enrichedPost.storiaVideo = await storage.getVideo(storiaMetadata.storiaVideoId) || null;
    } else if (storiaMetadata.storiaContentType === 'story' && storiaMetadata.storiaStoryId) {
      enrichedPost.storiaStory = await storage.getStory(storiaMetadata.storiaStoryId) || null;
    }
  } catch (error) {
    console.error('[CalendarService] Failed to fetch Storia content:', error);
    // Continue with enrichedPost without Storia data
  }
  
  return enrichedPost;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class CalendarService {
  /**
   * Get calendar posts for a workspace
   * Fetches from Late.dev and enriches with Storia data
   */
  async getCalendarPosts(
    workspaceId: string,
    params: CalendarQueryParams = {}
  ): Promise<CalendarPostsResponse> {
    console.log(`[CalendarService] Getting calendar posts for workspace: ${workspaceId}`);
    
    // 1. Get workspace's Late.dev profileId
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    if (!workspace.lateProfileId) {
      console.log('[CalendarService] Workspace has no Late.dev profile, returning empty list');
      return {
        posts: [],
        pagination: { page: 1, limit: params.limit || 50, total: 0, pages: 0 },
      };
    }
    
    // 2. Fetch posts from Late.dev
    console.log(`[CalendarService] Fetching from Late.dev with profileId: ${workspace.lateProfileId}`);
    const lateResponse = await lateService.listPosts({
      profileId: workspace.lateProfileId,
      status: params.status,
      platform: params.platform,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      limit: params.limit,
    });
    
    console.log(`[CalendarService] Late.dev returned ${lateResponse.posts.length} posts`);
    
    // 3. Enrich posts with Storia data
    const enrichedPosts = await Promise.all(
      lateResponse.posts.map(post => enrichPostWithStoriaData(post))
    );
    
    return {
      posts: enrichedPosts,
      pagination: lateResponse.pagination,
    };
  }

  /**
   * Schedule a video/story for publishing
   * Creates a post in Late.dev with Storia metadata
   */
  async schedulePost(
    workspaceId: string,
    input: SchedulePostInput
  ): Promise<SchedulePostResult> {
    console.log(`[CalendarService] Scheduling post for workspace: ${workspaceId}`);
    console.log(`[CalendarService] Content: ${input.contentType} - ${input.contentMode}`);
    console.log(`[CalendarService] Scheduled for: ${input.scheduledFor}`);
    
    // 1. Get workspace's Late.dev profileId
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    if (!workspace.lateProfileId) {
      throw new Error('Workspace has no Late.dev profile. Please connect social accounts first.');
    }
    
    // 2. Build Storia metadata to embed in Late.dev post
    const storiaMetadata: StoriaPostMetadata = {
      storiaVideoId: input.videoId,
      storiaStoryId: input.storyId,
      storiaContentType: input.contentType,
      storiaContentMode: input.contentMode,
      storiaThumbnailUrl: input.thumbnailUrl,
      storiaDuration: input.duration,
      storiaAspectRatio: input.aspectRatio,
    };
    
    // 3. Build platform-specific post data
    const postPlatforms = input.platforms.map(p => {
      const platformData: any = {
        platform: p.platform,
        accountId: p.accountId,
      };

      // Add platform-specific data
      if (p.platform === 'youtube' && input.metadata.youtube) {
        platformData.platformSpecificData = {
          title: input.metadata.youtube.title,
          visibility: input.metadata.youtube.visibility || 'public',
        };
        platformData.customContent = input.metadata.youtube.description;
      } else if (p.platform === 'instagram' && input.metadata.instagram) {
        const caption = input.metadata.instagram.caption;
        const hashtags = input.metadata.instagram.hashtags?.join(' ') || '';
        platformData.customContent = `${caption}\n\n${hashtags}`.trim();
      } else if (p.platform === 'facebook' && input.metadata.facebook) {
        const caption = input.metadata.facebook.caption;
        const hashtags = input.metadata.facebook.hashtags?.join(' ') || '';
        platformData.customContent = `${caption}\n\n${hashtags}`.trim();
      } else if (p.platform === 'tiktok' && input.metadata.tiktok) {
        const caption = input.metadata.tiktok.caption;
        const hashtags = input.metadata.tiktok.hashtags?.join(' ') || '';
        platformData.customContent = `${caption} ${hashtags}`.trim();
      }

      return platformData;
    });
    
    // 4. Build TikTok settings if TikTok is selected
    const hasTikTok = input.platforms.some(p => p.platform === 'tiktok');
    const tiktokSettings: LateTikTokSettings | undefined = hasTikTok ? {
      privacy_level: 'PUBLIC_TO_EVERYONE',
      allow_comment: true,
      allow_duet: true,
      allow_stitch: true,
      content_preview_confirmed: true,
      express_consent_given: true,
      video_made_with_ai: true, // Storia uses AI
    } : undefined;
    
    // 5. Build main content
    const mainContent = input.metadata.youtube?.description 
      || input.metadata.tiktok?.caption 
      || input.metadata.instagram?.caption 
      || input.metadata.facebook?.caption 
      || '';
    
    // 6. Create post in Late.dev
    const createPostInput: LateCreatePostInput = {
      content: mainContent,
      title: input.metadata.youtube?.title,
      mediaItems: [{
        url: input.videoUrl,
        type: 'video',
      }],
      platforms: postPlatforms,
      scheduledFor: input.scheduledFor,
      timezone: input.timezone,
      publishNow: false, // This is a scheduled post
      tags: input.metadata.youtube?.tags,
      hashtags: [
        ...(input.metadata.tiktok?.hashtags || []),
        ...(input.metadata.instagram?.hashtags || []),
        ...(input.metadata.facebook?.hashtags || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      tiktokSettings,
      metadata: storiaMetadata, // Embed Storia metadata
    };
    
    console.log('[CalendarService] Creating post in Late.dev...');
    const response = await lateService.createPost(createPostInput);
    console.log(`[CalendarService] Post created with ID: ${response.post._id}`);
    
    // 7. Enrich and return
    const enrichedPost = await enrichPostWithStoriaData(response.post);
    
    return {
      postId: response.post._id,
      status: response.post.status,
      scheduledFor: response.post.scheduledFor || input.scheduledFor,
      post: enrichedPost,
    };
  }

  /**
   * Reschedule a post (change the scheduled time)
   */
  async reschedulePost(
    workspaceId: string,
    postId: string,
    input: ReschedulePostInput
  ): Promise<SchedulePostResult> {
    console.log(`[CalendarService] Rescheduling post ${postId} to ${input.scheduledFor}`);
    
    // Verify workspace has access (the post should belong to this workspace's profile)
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    // Get the post to verify it exists and check status
    const post = await lateService.getPost(postId);
    
    if (post.status === 'published' || post.status === 'publishing') {
      throw new Error('Cannot reschedule a post that is already published or publishing');
    }
    
    // Update the post in Late.dev with new scheduled time
    // Important: Set publishNow: false to keep it as "scheduled" status, not "draft"
    const updateInput = {
      scheduledFor: input.scheduledFor,
      timezone: input.timezone,
      publishNow: false, // Keep as scheduled, not immediate publish
      isDraft: false, // Ensure it's not a draft
    };
    
    console.log('[CalendarService] Updating post in Late.dev...');
    const response = await lateService.updatePost(postId, updateInput);
    console.log(`[CalendarService] Post rescheduled successfully: ${postId}`);
    
    // Enrich and return
    const enrichedPost = await enrichPostWithStoriaData(response.post);
    
    return {
      postId: response.post._id,
      status: response.post.status,
      scheduledFor: response.post.scheduledFor || input.scheduledFor,
      post: enrichedPost,
    };
  }

  /**
   * Cancel (delete) a scheduled post
   */
  async cancelPost(workspaceId: string, postId: string): Promise<void> {
    console.log(`[CalendarService] Canceling post ${postId}`);
    
    // Verify workspace has access
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    // Get the post to verify status
    const post = await lateService.getPost(postId);
    
    if (post.status === 'published') {
      throw new Error('Cannot cancel a post that is already published');
    }
    
    // Delete from Late.dev
    await lateService.deletePost(postId);
    console.log(`[CalendarService] Post ${postId} canceled successfully`);
  }

  /**
   * Get a single post by ID
   */
  async getPost(workspaceId: string, postId: string): Promise<CalendarPost> {
    console.log(`[CalendarService] Getting post ${postId}`);
    
    // Verify workspace has access
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    // Get from Late.dev
    const post = await lateService.getPost(postId);
    
    // Enrich with Storia data
    return enrichPostWithStoriaData(post);
  }

  /**
   * Retry a failed post
   */
  async retryPost(workspaceId: string, postId: string): Promise<CalendarPost> {
    console.log(`[CalendarService] Retrying post ${postId}`);
    
    // Verify workspace has access
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    // Retry in Late.dev
    const post = await lateService.retryPost(postId);
    
    // Enrich with Storia data
    return enrichPostWithStoriaData(post);
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
