import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import narrativeRoutes from "./modes/narrative/routes";
import { insertWorkspaceSchema, insertWorkspaceIntegrationSchema, insertProductionCampaignSchema, insertCampaignVideoSchema } from "@shared/schema";
import { z } from "zod";

// TODO: Replace with actual session-based authentication
// This function should derive userId from req.session or req.user, not from query parameters
function getCurrentUserId(req: any): string {
  // TEMPORARY: Using hardcoded userId until auth is implemented
  // When auth is added, this should be: return req.session?.userId || req.user?.id
  return "default-user";
}

// Helper function to verify workspace ownership
async function verifyWorkspaceOwnership(workspaceId: string, userId: string): Promise<boolean> {
  const workspaces = await storage.getWorkspacesByUserId(userId);
  return workspaces.some((ws) => ws.id === workspaceId);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/narrative', narrativeRoutes);

  // Workspace routes
  app.get('/api/workspaces', async (req, res) => {
    try {
      // Get userId from session (currently hardcoded, will use req.session when auth is added)
      const userId = getCurrentUserId(req);
      const workspaces = await storage.getWorkspacesByUserId(userId);
      res.json(workspaces);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  });

  app.post('/api/workspaces', async (req, res) => {
    try {
      // Validate request body with Zod
      const validatedData = insertWorkspaceSchema.parse(req.body);

      const workspace = await storage.createWorkspace(validatedData);
      res.json(workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating workspace:', error);
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  });

  app.patch('/api/workspaces/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      // Verify ownership
      const hasAccess = await verifyWorkspaceOwnership(id, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Validate only the fields that can be updated
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);

      const updated = await storage.updateWorkspace(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error updating workspace:', error);
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  });

  // Workspace integration routes
  app.get('/api/workspaces/:workspaceId/integrations', async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      // Verify ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const integrations = await storage.getWorkspaceIntegrations(workspaceId);
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching workspace integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  app.post('/api/workspaces/:workspaceId/integrations', async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      // Verify ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Validate request body with Zod
      const validatedData = insertWorkspaceIntegrationSchema.parse({
        ...req.body,
        workspaceId,
      });

      const integration = await storage.createWorkspaceIntegration(validatedData);
      res.json(integration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating workspace integration:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create integration' });
    }
  });

  app.delete('/api/workspaces/:workspaceId/integrations/:id', async (req, res) => {
    try {
      const { workspaceId, id } = req.params;
      const userId = getCurrentUserId(req);

      // Verify ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Verify the integration belongs to this workspace
      const integrations = await storage.getWorkspaceIntegrations(workspaceId);
      const integration = integrations.find((i) => i.id === id);
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found in this workspace' });
      }

      await storage.deleteWorkspaceIntegration(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workspace integration:', error);
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  });

  // Production Campaign routes
  app.get('/api/production-campaigns', async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const campaigns = await storage.getCampaignsByUserId(userId);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/production-campaigns', async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const validatedData = insertProductionCampaignSchema.parse({
        ...req.body,
        userId,
      });

      const campaign = await storage.createCampaign(validatedData);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  app.get('/api/production-campaigns/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Verify ownership
      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  });

  app.patch('/api/production-campaigns/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        status: z.string().optional(),
        conceptPrompt: z.string().optional(),
        videoCount: z.number().min(1).max(50).optional(),
        automationMode: z.enum(['manual', 'auto']).optional(),
        aspectRatio: z.string().optional(),
        duration: z.number().optional(),
        language: z.string().optional(),
        artStyle: z.string().optional(),
        tone: z.string().optional(),
        genre: z.string().optional(),
        targetAudience: z.string().optional(),
        scheduleStartDate: z.coerce.date().optional(),
        scheduleEndDate: z.coerce.date().optional(),
        selectedPlatforms: z.array(z.string()).optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateCampaign(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  });

  app.delete('/api/production-campaigns/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      await storage.deleteCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });

  app.get('/api/production-campaigns/:id/videos', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      const videos = await storage.getCampaignVideos(id);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching campaign videos:', error);
      res.status(500).json({ error: 'Failed to fetch campaign videos' });
    }
  });

  app.post('/api/production-campaigns/:id/generate-concepts', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      // Update campaign status to generating_concepts
      await storage.updateCampaign(id, { status: 'generating_concepts' });

      // Generate mock concepts (in production, this would call AI service)
      const concepts = [];
      for (let i = 0; i < campaign.videoCount; i++) {
        const concept = await storage.createCampaignVideo({
          campaignId: id,
          title: `${campaign.name} - Video ${i + 1}`,
          conceptDescription: `AI-generated concept for video ${i + 1} based on: ${campaign.conceptPrompt}`,
          orderIndex: i,
          status: 'pending',
        });
        concepts.push(concept);
      }

      // Update campaign status to review
      await storage.updateCampaign(id, { status: 'review' });

      res.json({ success: true, concepts });
    } catch (error) {
      console.error('Error generating concepts:', error);
      res.status(500).json({ error: 'Failed to generate concepts' });
    }
  });

  app.patch('/api/production-campaigns/:id/videos/:videoId', async (req, res) => {
    try {
      const { id, videoId } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      const updateSchema = z.object({
        title: z.string().optional(),
        conceptDescription: z.string().optional(),
        orderIndex: z.number().optional(),
        status: z.string().optional(),
        generationProgress: z.number().min(0).max(100).optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateCampaignVideo(videoId, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error updating campaign video:', error);
      res.status(500).json({ error: 'Failed to update campaign video' });
    }
  });

  app.post('/api/production-campaigns/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      const updated = await storage.updateCampaign(id, { status: 'in_progress' });
      res.json(updated);
    } catch (error) {
      console.error('Error starting campaign:', error);
      res.status(500).json({ error: 'Failed to start campaign' });
    }
  });

  app.post('/api/production-campaigns/:id/pause', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      const updated = await storage.updateCampaign(id, { status: 'paused' });
      res.json(updated);
    } catch (error) {
      console.error('Error pausing campaign:', error);
      res.status(500).json({ error: 'Failed to pause campaign' });
    }
  });

  app.post('/api/production-campaigns/:id/resume', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this campaign' });
      }

      const updated = await storage.updateCampaign(id, { status: 'in_progress' });
      res.json(updated);
    } catch (error) {
      console.error('Error resuming campaign:', error);
      res.status(500).json({ error: 'Failed to resume campaign' });
    }
  });

  // Character routes
  app.get('/api/characters', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' });
      }
      const characters = await storage.getCharactersByWorkspaceId(workspaceId);
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ error: 'Failed to fetch characters' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
