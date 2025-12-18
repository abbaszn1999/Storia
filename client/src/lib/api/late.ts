// Late.dev API Client
// ═══════════════════════════════════════════════════════════════════════════
// Client-side wrapper for Late.dev social media integration

import { apiRequest } from '../queryClient';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LatePlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'linkedin';

export type LatePostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial';

export interface LateAccount {
  _id: string;
  platform: LatePlatform;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  isActive: boolean;
}

export interface LatePost {
  _id: string;
  status: LatePostStatus;
  platforms: Array<{
    platform: LatePlatform;
    accountId: string;
  }>;
  publishedUrls?: Record<string, string>;
  createdAt: string;
  publishedAt?: string;
}

export interface PublishVideoInput {
  /** Video URL from BunnyCDN */
  videoUrl: string;
  /** Selected platforms (accountId will be auto-filled) */
  platforms: Array<{
    platform: LatePlatform;
  }>;
  /** Metadata per platform */
  metadata: {
    youtube?: {
      title: string;
      description: string;
      tags?: string[];
      visibility?: 'public' | 'private' | 'unlisted';
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
  /** Publish immediately (default true) */
  publishNow?: boolean;
  /** Schedule for later (ISO 8601) */
  scheduledFor?: string;
}

export interface PublishVideoResult {
  postId: string;
  status: LatePostStatus;
  platforms: Array<{
    platform: LatePlatform;
    status: 'pending' | 'published' | 'failed';
    publishedUrl?: string;
    error?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export const lateApi = {
  /**
   * Initialize Late profile for workspace (if not exists)
   */
  async initializeWorkspace(workspaceId: string): Promise<{ profileId: string }> {
    const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/late/initialize`);
    return response.json();
  },

  /**
   * Get connect URL for OAuth flow
   * @param platform - Platform to connect (youtube, tiktok, instagram, facebook)
   * @param redirectUrl - URL to redirect back to after OAuth completes
   */
  async getConnectUrl(workspaceId: string, platform?: string, redirectUrl?: string): Promise<{ connectUrl: string }> {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (redirectUrl) params.append('redirect_url', redirectUrl);
    
    const queryString = params.toString();
    const url = `/api/workspaces/${workspaceId}/late/connect-url${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest('GET', url);
    return response.json();
  },

  /**
   * Get all connected accounts for workspace
   */
  async getConnectedAccounts(workspaceId: string): Promise<LateAccount[]> {
    const response = await apiRequest('GET', `/api/workspaces/${workspaceId}/late/accounts`);
    return response.json();
  },

  /**
   * Disconnect an account
   */
  async disconnectAccount(workspaceId: string, accountId: string): Promise<void> {
    await apiRequest('DELETE', `/api/workspaces/${workspaceId}/late/accounts/${accountId}`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLISHING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Publish a video to social media platforms
   * This is the main method for publishing from Storia
   */
  async publishVideo(workspaceId: string, input: PublishVideoInput): Promise<PublishVideoResult> {
    console.log('[lateApi] Publishing video:', {
      platforms: input.platforms.map(p => p.platform),
      hasMetadata: Object.keys(input.metadata).length > 0,
    });

    const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/late/publish`, input);
    return response.json();
  },

  /**
   * Get post status by ID
   */
  async getPost(workspaceId: string, postId: string): Promise<LatePost> {
    const response = await apiRequest('GET', `/api/workspaces/${workspaceId}/late/posts/${postId}`);
    return response.json();
  },

  /**
   * List posts for workspace
   */
  async listPosts(workspaceId: string, params?: {
    status?: LatePostStatus;
    platform?: LatePlatform;
    page?: number;
    limit?: number;
  }): Promise<{ posts: LatePost[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/api/workspaces/${workspaceId}/late/posts${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest('GET', url);
    return response.json();
  },

  /**
   * Retry a failed post
   */
  async retryPost(workspaceId: string, postId: string): Promise<LatePost> {
    const response = await apiRequest('POST', `/api/workspaces/${workspaceId}/late/posts/${postId}/retry`);
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a platform is connected
   */
  async isPlatformConnected(workspaceId: string, platform: LatePlatform): Promise<boolean> {
    try {
      const accounts = await this.getConnectedAccounts(workspaceId);
      return accounts.some(a => a.platform === platform && a.isActive);
    } catch {
      return false;
    }
  },

  /**
   * Get connected platforms
   */
  async getConnectedPlatforms(workspaceId: string): Promise<LatePlatform[]> {
    try {
      const accounts = await this.getConnectedAccounts(workspaceId);
      return accounts.filter(a => a.isActive).map(a => a.platform);
    } catch {
      return [];
    }
  },
};
