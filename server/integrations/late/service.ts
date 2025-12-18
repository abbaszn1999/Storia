// Late.dev API Service
// ═══════════════════════════════════════════════════════════════════════════
// Centralized service for all Late.dev API operations
// Similar to ai/service.ts - single entry point for social media publishing

import { lateConfig } from './config';
import type { 
  LateProfile, 
  LateAccount, 
  LateError,
  LateCreatePostInput,
  LateCreatePostResponse,
  LatePost,
  LateListPostsResponse,
  LatePlatform,
  LateTikTokSettings,
  LateMediaItem,
  StoriaPublishInput,
  StoriaPublishOutput,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// LATE SERVICE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class LateService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = lateConfig.baseUrl;
    this.apiKey = lateConfig.apiKey;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Make authenticated request to Late.dev API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`[Late.dev] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(lateConfig.timeout),
    });

    // Get the raw response text first
    const responseText = await response.text();
    
    // Log raw response for debugging
    console.log(`[Late.dev] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[Late.dev] ❌ Error response (raw):`, responseText);
      let error: LateError;
      try {
        error = JSON.parse(responseText);
      } catch {
        error = {
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }
      throw new Error(`Late.dev API Error: ${error.message || error.error}`);
    }

    // Parse and return the JSON
    try {
      return JSON.parse(responseText) as T;
    } catch (parseError) {
      console.error(`[Late.dev] Failed to parse response:`, responseText);
      throw new Error('Failed to parse Late.dev response as JSON');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new profile for a workspace
   */
  async createProfile(workspaceId: string): Promise<string> {
    try {
      const uniqueName = `Storia_${workspaceId}_${Date.now()}`;
      
      const response = await this.makeRequest<any>('/profiles', {
        method: 'POST',
        body: JSON.stringify({
          name: uniqueName,
        }),
      });
      
      console.log('[Late.dev] createProfile response:', JSON.stringify(response, null, 2));
      
      const profileId = response?.profile?._id || response?.profile?.id || response?.data?.id || response?.id || response?.profileId;
      
      if (!profileId) {
        throw new Error('No profile ID returned from Late.dev API');
      }
      
      return profileId;
    } catch (error) {
      console.error('[Late.dev] Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Get profile details
   */
  async getProfile(profileId: string): Promise<LateProfile> {
    try {
      const response = await this.makeRequest<any>(`/profiles/${profileId}`);
      return response?.data || response;
    } catch (error) {
      console.error('[Late.dev] Error fetching profile:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCOUNT MANAGEMENT (OAuth)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get OAuth authorization URL for a platform
   */
  async getOAuthUrl(profileId: string, platform: string, redirectUrl?: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        profileId,
        ...(redirectUrl && { redirect_url: redirectUrl }),
      });
      
      const response = await this.makeRequest<{ authUrl: string; state: string }>(
        `/connect/${platform}?${params.toString()}`,
        { method: 'GET' }
      );
      
      console.log(`[Late.dev] getOAuthUrl for ${platform}:`, JSON.stringify(response, null, 2));
      
      if (!response.authUrl) {
        throw new Error('No authUrl returned from Late.dev API');
      }
      
      return response.authUrl;
    } catch (error) {
      console.error(`[Late.dev] Error getting OAuth URL for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Get all connected accounts for a profile
   */
  async getConnectedAccounts(profileId: string): Promise<LateAccount[]> {
    try {
      const response = await this.makeRequest<{ accounts: LateAccount[]; hasAnalyticsAccess: boolean }>(
        `/accounts?profileId=${profileId}`,
        { method: 'GET' }
      );
      
      console.log('[Late.dev] getConnectedAccounts:', response.accounts?.length || 0, 'accounts');
      
      return response.accounts || [];
    } catch (error) {
      console.error('[Late.dev] Error fetching connected accounts:', error);
      return [];
    }
  }

  /**
   * Disconnect an account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      const response = await this.makeRequest<{ message: string }>(`/accounts/${accountId}`, {
        method: 'DELETE',
      });
      console.log('[Late.dev] disconnectAccount:', response);
    } catch (error) {
      console.error('[Late.dev] Error disconnecting account:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new post (draft, scheduled, or immediate)
   */
  async createPost(input: LateCreatePostInput): Promise<LateCreatePostResponse> {
    try {
      // Log the FULL request body being sent to Late.dev
      console.log('[Late.dev] ═══════════════════════════════════════════════');
      console.log('[Late.dev] Creating post - FULL REQUEST:');
      console.log('[Late.dev] ═══════════════════════════════════════════════');
      console.log(JSON.stringify(input, null, 2));
      console.log('[Late.dev] ═══════════════════════════════════════════════');

      const response = await this.makeRequest<LateCreatePostResponse>('/posts', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      // Log the FULL response from Late.dev
      console.log('[Late.dev] ═══════════════════════════════════════════════');
      console.log('[Late.dev] Post created - FULL RESPONSE:');
      console.log('[Late.dev] ═══════════════════════════════════════════════');
      console.log(JSON.stringify(response, null, 2));
      console.log('[Late.dev] ═══════════════════════════════════════════════');

      return response;
    } catch (error) {
      console.error('[Late.dev] ═══════════════════════════════════════════════');
      console.error('[Late.dev] Error creating post - FULL ERROR:');
      console.error('[Late.dev] ═══════════════════════════════════════════════');
      console.error(error);
      console.error('[Late.dev] ═══════════════════════════════════════════════');
      throw error;
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<LatePost> {
    try {
      const response = await this.makeRequest<{ post: LatePost }>(`/posts/${postId}`);
      return response.post;
    } catch (error) {
      console.error('[Late.dev] Error fetching post:', error);
      throw error;
    }
  }

  /**
   * List posts with optional filters
   */
  async listPosts(params?: {
    status?: string;
    platform?: string;
    profileId?: string;
    page?: number;
    limit?: number;
  }): Promise<LateListPostsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.platform) queryParams.append('platform', params.platform);
      if (params?.profileId) queryParams.append('profileId', params.profileId);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/posts${queryString ? `?${queryString}` : ''}`;

      return await this.makeRequest<LateListPostsResponse>(endpoint);
    } catch (error) {
      console.error('[Late.dev] Error listing posts:', error);
      throw error;
    }
  }

  /**
   * Delete a post (only draft/scheduled posts can be deleted)
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.makeRequest<{ message: string }>(`/posts/${postId}`, {
        method: 'DELETE',
      });
      console.log('[Late.dev] Post deleted:', postId);
    } catch (error) {
      console.error('[Late.dev] Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Retry a failed post
   */
  async retryPost(postId: string): Promise<LatePost> {
    try {
      const response = await this.makeRequest<{ post: LatePost; message: string }>(`/posts/${postId}/retry`, {
        method: 'POST',
      });
      console.log('[Late.dev] Post retry initiated:', postId);
      return response.post;
    } catch (error) {
      console.error('[Late.dev] Error retrying post:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STORIA-SPECIFIC PUBLISH METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Publish a Storia video to social media platforms
   * This is the main entry point for publishing from Storia
   */
  async publishVideo(input: StoriaPublishInput): Promise<StoriaPublishOutput> {
    console.log('[Late.dev] ═══════════════════════════════════════════════');
    console.log('[Late.dev] Publishing Storia video - INPUT:');
    console.log('[Late.dev] ═══════════════════════════════════════════════');
    console.log('[Late.dev] Platforms:', input.platforms.map(p => `${p.platform} (${p.accountId})`));
    console.log('[Late.dev] Video URL:', input.videoUrl);
    console.log('[Late.dev] Publish Now:', input.publishNow);
    console.log('[Late.dev] Metadata:', JSON.stringify(input.metadata, null, 2));
    console.log('[Late.dev] ═══════════════════════════════════════════════');

    // Build platform-specific post data
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

    // Build TikTok settings if TikTok is selected
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

    // Build the main content (use YouTube description as fallback)
    const mainContent = input.metadata.youtube?.description 
      || input.metadata.tiktok?.caption 
      || input.metadata.instagram?.caption 
      || input.metadata.facebook?.caption 
      || '';

    // Create the post
    const createPostInput: LateCreatePostInput = {
      content: mainContent,
      title: input.metadata.youtube?.title,
      mediaItems: [
        {
          url: input.videoUrl,
          type: 'video',
        }
      ],
      platforms: postPlatforms,
      publishNow: input.publishNow ?? true,
      scheduledFor: input.scheduledFor,
      tags: input.metadata.youtube?.tags,
      hashtags: [
        ...(input.metadata.tiktok?.hashtags || []),
        ...(input.metadata.instagram?.hashtags || []),
        ...(input.metadata.facebook?.hashtags || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      tiktokSettings,
    };

    try {
      const response = await this.createPost(createPostInput);

      // Map response to Storia output format
      return {
        postId: response.post._id,
        status: response.post.status,
        platforms: input.platforms.map(p => ({
          platform: p.platform,
          status: response.post.status === 'published' ? 'published' : 'pending',
          publishedUrl: response.post.publishedUrls?.[p.platform],
        })),
      };
    } catch (error) {
      console.error('[Late.dev] Failed to publish video:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verify API key is valid
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/profiles', { method: 'GET' });
      return true;
    } catch (error) {
      console.error('[Late.dev] API key verification failed:', error);
      return false;
    }
  }

  /**
   * Get default TikTok settings (required fields)
   */
  getDefaultTikTokSettings(): LateTikTokSettings {
    return {
      privacy_level: 'PUBLIC_TO_EVERYONE',
      allow_comment: true,
      allow_duet: true,
      allow_stitch: true,
      content_preview_confirmed: true,
      express_consent_given: true,
    };
  }

  /**
   * Validate platform requirements before publishing
   */
  validatePlatformRequirements(platform: LatePlatform, metadata: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (platform) {
      case 'youtube':
        if (!metadata?.title) errors.push('YouTube requires a title');
        if (metadata?.title && metadata.title.length > 100) errors.push('YouTube title must be ≤100 characters');
        if (metadata?.description && metadata.description.length > 5000) errors.push('YouTube description must be ≤5000 characters');
        break;

      case 'tiktok':
        if (metadata?.caption && metadata.caption.length > 2200) errors.push('TikTok caption must be ≤2200 characters');
        break;

      case 'instagram':
        if (metadata?.caption && metadata.caption.length > 2200) errors.push('Instagram caption must be ≤2200 characters');
        break;

      case 'facebook':
        // Facebook is more lenient
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const lateService = new LateService();
