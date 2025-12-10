import { lateConfig } from './config';
import type { LateProfile, LateAccount, LateJWTResponse, LateError } from './types';

export class LateService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = lateConfig.baseUrl;
    this.apiKey = lateConfig.apiKey;
  }

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

    if (!response.ok) {
      const error: LateError = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      }));
      console.error(`[Late.dev] Error response:`, error);
      throw new Error(`Late.dev API Error: ${error.message || error.error}`);
    }

    return response.json();
  }

  /**
   * Create a new profile for a workspace
   */
  async createProfile(workspaceId: string): Promise<string> {
    try {
      // Use workspaceId + timestamp to ensure uniqueness
      const uniqueName = `Storia_${workspaceId}_${Date.now()}`;
      
      const response = await this.makeRequest<any>('/profiles', {
        method: 'POST',
        body: JSON.stringify({
          name: uniqueName,
        }),
      });
      
      console.log('Late.dev createProfile response:', JSON.stringify(response, null, 2));
      
      // Handle different possible response structures
      const profileId = response?.profile?._id || response?.profile?.id || response?.data?.id || response?.id || response?.profileId;
      
      if (!profileId) {
        throw new Error('No profile ID returned from Late.dev API. Response: ' + JSON.stringify(response));
      }
      
      return profileId;
    } catch (error) {
      console.error('Error creating Late profile:', error);
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
      console.error('Error fetching Late profile:', error);
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL for a platform
   * @param profileId - Late.dev profile ID
   * @param platform - Social platform (youtube, tiktok, instagram, facebook, etc.)
   * @param redirectUrl - Your callback URL after OAuth completes
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
      
      console.log(`Late.dev getOAuthUrl for ${platform}:`, JSON.stringify(response, null, 2));
      
      if (!response.authUrl) {
        throw new Error('No authUrl returned from Late.dev API. Response: ' + JSON.stringify(response));
      }
      
      return response.authUrl;
    } catch (error) {
      console.error(`Error getting OAuth URL for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Get all connected accounts for a profile
   * Endpoint: GET /v1/accounts?profileId={profileId}
   */
  async getConnectedAccounts(profileId: string): Promise<LateAccount[]> {
    try {
      const response = await this.makeRequest<{ accounts: LateAccount[]; hasAnalyticsAccess: boolean }>(
        `/accounts?profileId=${profileId}`,
        { method: 'GET' }
      );
      
      console.log('Late.dev getConnectedAccounts response:', JSON.stringify(response, null, 2));
      
      return response.accounts || [];
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      return []; // Return empty array instead of throwing, as no accounts is valid
    }
  }

  /**
   * Disconnect an account
   * Endpoint: DELETE /v1/accounts/{accountId}
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      const response = await this.makeRequest<{ message: string }>(`/accounts/${accountId}`, {
        method: 'DELETE',
      });
      console.log('Late.dev disconnectAccount response:', response);
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }

  /**
   * Verify API key is valid
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/profiles', { method: 'GET' });
      return true;
    } catch (error) {
      console.error('API key verification failed:', error);
      return false;
    }
  }

  // Removed: getConnectUrl - not needed, we use getOAuthUrl instead
}

// Export singleton instance
export const lateService = new LateService();

