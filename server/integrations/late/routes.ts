import type { Express, Request, Response } from 'express';
import { lateService } from './service';
import { LateWebhookHandler } from './webhooks';
import type { IStorage } from '../../storage';

export function registerLateRoutes(app: Express, storage: IStorage, isAuthenticated: any, getCurrentUserId: any, verifyWorkspaceOwnership: any) {
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

      // Also mark any accounts no longer in Late.dev as inactive
      const existingIntegrations = await storage.getLateIntegrations(workspaceId);
      const lateAccountIds = new Set(accounts.map(a => a._id));
      
      for (const integration of existingIntegrations) {
        if (integration.lateAccountId && !lateAccountIds.has(integration.lateAccountId) && integration.isActive) {
          await storage.updateWorkspaceIntegration(integration.id, {
            isActive: false,
            lastSyncedAt: new Date(),
          });
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

      // Mark as inactive in database
      await storage.updateWorkspaceIntegration(integration.id, {
        isActive: false,
        lastSyncedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });

  /**
   * Webhook endpoint for Late events
   */
  app.post('/api/webhooks/late', async (req: Request, res: Response) => {
    await webhookHandler.handleWebhook(req, res);
  });
}

