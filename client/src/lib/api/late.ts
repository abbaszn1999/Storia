import { apiRequest } from '../queryClient';

export interface LateAccount {
  id: string;
  platform: string;
  platformUsername?: string;
  platformProfileImage?: string;
  isActive: boolean;
}

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
   * @param platform - Optional platform to pre-select (youtube, tiktok, instagram, facebook)
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
    const response = await apiRequest('DELETE', `/api/workspaces/${workspaceId}/late/accounts/${accountId}`);
    await response.json();
  },
};

