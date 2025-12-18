import type { Express, Request, Response } from 'express';
import { lateService } from './service';
import { LateWebhookHandler } from './webhooks';
import type { IStorage } from '../../storage';

export function registerLateRoutes(app: Express, storage: IStorage, isAuthenticated: any, getCurrentUserId: any, verifyWorkspaceOwnership: any) {
  console.log('🚀 [Late Routes] Registering Late.dev routes...');
  const webhookHandler = new LateWebhookHandler(storage);

  /**
   * Initialize Late profile for workspace (if not already exists)
   */
  app.post('/api/workspaces/:id/late/initialize', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Get workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check if profile already exists
      if ((workspace as any).lateProfileId) {
        return res.json({ profileId: (workspace as any).lateProfileId });
      }

      // Create new profile
      const profileId = await lateService.createProfile(workspaceId);

      // Update workspace with profile ID
      await storage.updateWorkspaceLateProfile(workspaceId, profileId);

      res.json({ profileId });
    } catch (error) {
      console.error('Error initializing Late profile:', error);
      res.status(500).json({ error: 'Failed to initialize Late profile' });
    }
  });

  /**
   * Get OAuth URL for connecting a specific social platform
   * Query params: 
   *   - platform (required) - youtube|tiktok|instagram|facebook|twitter|linkedin|etc
   *   - redirect_url (optional) - URL to redirect back to after OAuth completes
   */
  app.get('/api/workspaces/:id/late/connect-url', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId } = req.params;
      const { platform, redirect_url } = req.query;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!platform || typeof platform !== 'string') {
        return res.status(400).json({ error: 'Platform query parameter is required' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Get workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Get or create profile ID
      let profileId = (workspace as any).lateProfileId;
      if (!profileId) {
        profileId = await lateService.createProfile(workspaceId);
        await storage.updateWorkspaceLateProfile(workspaceId, profileId);
      }

      // Get OAuth URL from Late.dev for the specific platform
      const redirectUrl = typeof redirect_url === 'string' ? redirect_url : undefined;
      const authUrl = await lateService.getOAuthUrl(profileId, platform, redirectUrl);

      res.json({ connectUrl: authUrl });
    } catch (error) {
      console.error('Error generating connect URL:', error);
      res.status(500).json({ error: 'Failed to generate connect URL' });
    }
  });

  /**
   * Get connected accounts for workspace and sync to database
   */
  app.get('/api/workspaces/:id/late/accounts', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Get workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const profileId = (workspace as any).lateProfileId;
      if (!profileId) {
        return res.json([]);
      }

      // Get accounts from Late
      const accounts = await lateService.getConnectedAccounts(profileId);

      // Sync accounts to our database
      for (const account of accounts) {
        try {
          await storage.upsertLateIntegration({
            workspaceId,
            platform: account.platform,
            lateAccountId: account._id,
            platformUserId: account.platformUserId || '',
            platformUsername: account.username || account.displayName || '',
            platformProfileImage: account.profilePicture || '',
          });
        } catch (syncError) {
          console.error(`Error syncing account ${account._id}:`, syncError);
        }
      }

      // Delete any accounts no longer in Late.dev (user disconnected them)
      const existingIntegrations = await storage.getLateIntegrations(workspaceId);
      const lateAccountIds = new Set(accounts.map(a => a._id));
      
      for (const integration of existingIntegrations) {
        if (integration.lateAccountId && !lateAccountIds.has(integration.lateAccountId)) {
          await storage.deleteWorkspaceIntegration(integration.id);
        }
      }

      res.json(accounts);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      res.status(500).json({ error: 'Failed to fetch connected accounts' });
    }
  });

  /**
   * Disconnect an account
   */
  app.delete('/api/workspaces/:id/late/accounts/:accountId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId, accountId } = req.params;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Verify the account belongs to this workspace
      const integration = await storage.getIntegrationByLateAccountId(accountId);
      if (!integration || integration.workspaceId !== workspaceId) {
        return res.status(404).json({ error: 'Account not found in this workspace' });
      }

      // Disconnect account via Late API
      await lateService.disconnectAccount(accountId);

      // Delete the integration from database
      await storage.deleteWorkspaceIntegration(integration.id);

      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });

  /**
   * Publish a video to social media platforms
   * This is the main endpoint for publishing from Storia
   */
  app.post('/api/workspaces/:id/late/publish', isAuthenticated, async (req: Request, res: Response) => {
    console.log('📤 [Late Routes] ═══════════════════════════════════════════════');
    console.log('📤 [Late Routes] PUBLISH endpoint hit!');
    console.log('📤 [Late Routes] Workspace ID:', req.params.id);
    console.log('📤 [Late Routes] Full Request Body:');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('📤 [Late Routes] ═══════════════════════════════════════════════');
    try {
      const { id: workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Get workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const profileId = (workspace as any).lateProfileId;
      if (!profileId) {
        return res.status(400).json({ error: 'Workspace has no Late.dev profile. Please connect a social account first.' });
      }

      const { videoUrl, platforms, metadata, publishNow, scheduledFor } = req.body;

      // Validate required fields
      if (!videoUrl) {
        return res.status(400).json({ error: 'videoUrl is required' });
      }
      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ error: 'At least one platform is required' });
      }

      // Validate each platform has an account connected
      const connectedAccounts = await lateService.getConnectedAccounts(profileId);
      const connectedPlatforms = new Set(connectedAccounts.map(a => a.platform));
      
      for (const platform of platforms) {
        if (!connectedPlatforms.has(platform.platform)) {
          return res.status(400).json({ 
            error: `Platform "${platform.platform}" is not connected. Please connect it first in Workspace Settings.` 
          });
        }
        // Get the account ID from connected accounts
        const account = connectedAccounts.find(a => a.platform === platform.platform);
        if (account) {
          platform.accountId = account._id;
        }
      }

      // Validate platform-specific requirements
      for (const platform of platforms) {
        const platformMeta = metadata?.[platform.platform];
        const validation = lateService.validatePlatformRequirements(platform.platform, platformMeta);
        if (!validation.valid) {
          return res.status(400).json({
            error: `Validation failed for ${platform.platform}`,
            details: validation.errors,
          });
        }
      }

      console.log('[Late Routes] Publishing video:', {
        workspaceId,
        platforms: platforms.map((p: any) => p.platform),
        videoUrl: videoUrl.substring(0, 50) + '...',
        publishNow,
      });

      // Publish using the Late service
      const result = await lateService.publishVideo({
        workspaceId,
        videoUrl,
        platforms,
        metadata: metadata || {},
        publishNow: publishNow ?? true,
        scheduledFor,
      });

      console.log('[Late Routes] Publish result:', result);

      res.json(result);
    } catch (error) {
      console.error('[Late Routes] Error publishing video:', error);
      res.status(500).json({ 
        error: 'Failed to publish video',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get post status by ID
   */
  app.get('/api/workspaces/:id/late/posts/:postId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId, postId } = req.params;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const post = await lateService.getPost(postId);
      res.json(post);
    } catch (error) {
      console.error('[Late Routes] Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post status' });
    }
  });

  /**
   * List posts for workspace
   */
  app.get('/api/workspaces/:id/late/posts', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId } = req.params;
      const { status, platform, page, limit } = req.query;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const profileId = (workspace as any).lateProfileId;
      if (!profileId) {
        return res.json({ posts: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
      }

      const posts = await lateService.listPosts({
        profileId,
        status: typeof status === 'string' ? status : undefined,
        platform: typeof platform === 'string' ? platform : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(posts);
    } catch (error) {
      console.error('[Late Routes] Error listing posts:', error);
      res.status(500).json({ error: 'Failed to list posts' });
    }
  });

  /**
   * Retry a failed post
   */
  app.post('/api/workspaces/:id/late/posts/:postId/retry', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id: workspaceId, postId } = req.params;
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const post = await lateService.retryPost(postId);
      res.json(post);
    } catch (error) {
      console.error('[Late Routes] Error retrying post:', error);
      res.status(500).json({ error: 'Failed to retry post' });
    }
  });

  /**
   * Webhook endpoint for Late events
   */
  app.post('/api/webhooks/late', async (req: Request, res: Response) => {
    await webhookHandler.handleWebhook(req, res);
  });
}

