import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import narrativeRoutes from "./modes/narrative/routes";
import { insertWorkspaceSchema, insertWorkspaceIntegrationSchema, insertProductionCampaignSchema, insertCampaignVideoSchema, insertCharacterSchema, insertLocationSchema, insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { bunnyStorage } from "./storage/bunny-storage";

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});

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
  // Set up authentication session middleware (must be before other routes)
  await setupAuth(app);
  
  // Register auth routes (login, register, logout, user)
  registerAuthRoutes(app);

  app.use('/api/narrative', isAuthenticated, narrativeRoutes);

  // Onboarding route
  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { workspaceName, onboardingData } = req.body;
      
      if (!workspaceName || typeof workspaceName !== 'string') {
        return res.status(400).json({ error: 'Workspace name is required' });
      }
      
      // Check workspace limit (safety check for edge cases)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const currentCount = await storage.countUserWorkspaces(userId);
      if (currentCount >= user.workspaceLimit) {
        // User already has workspaces, just mark onboarding complete
        await storage.updateUser(userId, {
          hasCompletedOnboarding: true,
          onboardingData: onboardingData || {},
        });
        
        const existingWorkspaces = await storage.getWorkspacesByUserId(userId);
        return res.json({ 
          success: true, 
          workspace: existingWorkspaces[0],
          message: 'Onboarding completed successfully' 
        });
      }
      
      // Create first workspace
      const workspace = await storage.createWorkspace({
        userId,
        name: workspaceName.trim(),
        description: 'Your first workspace',
      });
      
      // Mark onboarding as complete and store onboarding data
      await storage.updateUser(userId, {
        hasCompletedOnboarding: true,
        onboardingData: onboardingData || {},
      });
      
      res.json({ 
        success: true, 
        workspace,
        message: 'Onboarding completed successfully' 
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  });

  // Workspace routes (protected)
  app.get('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const workspaces = await storage.getWorkspacesByUserId(userId);
      res.json(workspaces);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  });

  app.post('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Check workspace limit
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const currentCount = await storage.countUserWorkspaces(userId);
      if (currentCount >= user.workspaceLimit) {
        return res.status(403).json({ 
          error: 'Workspace limit reached', 
          message: `You can have a maximum of ${user.workspaceLimit} workspaces. Upgrade your plan for more.` 
        });
      }
      
      const validatedData = insertWorkspaceSchema.parse({
        ...req.body,
        userId,
      });

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

  app.delete('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const hasAccess = await verifyWorkspaceOwnership(id, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      // Check if this is the user's only workspace
      const workspaceCount = await storage.countUserWorkspaces(userId);
      if (workspaceCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete your only workspace' });
      }

      await storage.deleteWorkspace(id);
      res.json({ success: true, message: 'Workspace deleted' });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      res.status(500).json({ error: 'Failed to delete workspace' });
    }
  });

  // Project routes
  app.get('/api/workspaces/:workspaceId/projects', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const projects = await storage.getProjectsByWorkspaceId(workspaceId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/workspaces/:workspaceId/projects', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);

      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const validatedData = insertProjectSchema.parse({
        ...req.body,
        workspaceId,
      });

      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const hasAccess = await verifyWorkspaceOwnership(project.workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const hasAccess = await verifyWorkspaceOwnership(project.workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        settings: z.any().optional(),
        thumbnailUrl: z.string().optional(),
        status: z.enum(['active', 'archived']).optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateProject(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const hasAccess = await verifyWorkspaceOwnership(project.workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      await storage.deleteProject(id);
      res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // Workspace integration routes
  app.get('/api/workspaces/:workspaceId/integrations', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/workspaces/:workspaceId/integrations', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/workspaces/:workspaceId/integrations/:id', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/production-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const campaigns = await storage.getCampaignsByUserId(userId);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/production-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Additional validation beyond schema
      const storyIdeas = req.body.storyIdeas;
      if (!storyIdeas || !Array.isArray(storyIdeas) || storyIdeas.length === 0) {
        return res.status(400).json({ error: 'At least one story idea is required' });
      }
      
      // Validate scheduling constraints if provided
      if (req.body.scheduleStartDate && req.body.scheduleEndDate) {
        const start = new Date(req.body.scheduleStartDate);
        const end = new Date(req.body.scheduleEndDate);
        if (end < start) {
          return res.status(400).json({ error: 'End date must be after start date' });
        }
        
        const maxVideosPerDay = req.body.maxVideosPerDay || 1;
        if (maxVideosPerDay <= 0) {
          return res.status(400).json({ error: 'Max videos per day must be greater than 0' });
        }
        
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const maxPossibleVideos = daysDiff * maxVideosPerDay;
        if (maxPossibleVideos < storyIdeas.length) {
          return res.status(400).json({ 
            error: `Cannot fit ${storyIdeas.length} videos in ${daysDiff} days with max ${maxVideosPerDay} video(s) per day` 
          });
        }
      }
      
      // Validate publish hours if provided
      if (req.body.preferredPublishHours && Array.isArray(req.body.preferredPublishHours)) {
        const hours = req.body.preferredPublishHours.filter((h: any) => typeof h === 'number');
        const invalidHours = hours.filter((h: number) => h < 0 || h > 23);
        if (invalidHours.length > 0) {
          return res.status(400).json({ error: 'Publish hours must be between 0 and 23' });
        }
      }
      
      const validatedData = insertProductionCampaignSchema.parse({
        ...req.body,
        userId,
      });

      const campaign = await storage.createCampaign(validatedData);
      
      // Automatically create campaign_videos from story ideas (server-side derivation)
      for (let i = 0; i < storyIdeas.length; i++) {
        await storage.createCampaignVideo({
          campaignId: campaign.id,
          title: `${campaign.name} - Video ${i + 1}`,
          conceptDescription: storyIdeas[i],
          orderIndex: i,
          status: 'pending',
        });
      }
      
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  app.get('/api/production-campaigns/:id', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/production-campaigns/:id', isAuthenticated, async (req: any, res) => {
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
        storyIdeas: z.array(z.string()).optional(),
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

  app.delete('/api/production-campaigns/:id', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/production-campaigns/:id/videos', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/production-campaigns/:id/generate-concepts', isAuthenticated, async (req: any, res) => {
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

      // Get existing campaign videos (already created from story ideas)
      const videos = await storage.getCampaignVideos(id);

      // Update campaign status to review
      await storage.updateCampaign(id, { status: 'review' });

      res.json({ success: true, concepts: videos });
    } catch (error) {
      console.error('Error generating concepts:', error);
      res.status(500).json({ error: 'Failed to generate concepts' });
    }
  });

  app.patch('/api/production-campaigns/:id/videos/:videoId', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/production-campaigns/:id/start', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/production-campaigns/:id/pause', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/production-campaigns/:id/resume', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/characters', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/characters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const validated = insertCharacterSchema.parse(req.body);
      
      // Verify workspace belongs to user
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === validated.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const character = await storage.createCharacter(validated);
      res.json(character);
    } catch (error) {
      console.error('Error creating character:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create character' });
    }
  });

  // Location routes
  app.get('/api/locations', isAuthenticated, async (req: any, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' });
      }
      const locations = await storage.getLocationsByWorkspaceId(workspaceId);
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  app.post('/api/locations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const validated = insertLocationSchema.parse(req.body);
      
      // Verify workspace belongs to user
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === validated.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const location = await storage.createLocation(validated);
      res.json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create location' });
    }
  });

  // Commerce API routes (Social Commerce mode)
  app.post('/api/commerce/script/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { productDetails, videoConcept, voiceOverConcept, duration, aspectRatio, voiceOverEnabled } = req.body;
      
      if (!productDetails?.title) {
        return res.status(400).json({ error: 'Product title is required' });
      }
      if (!videoConcept) {
        return res.status(400).json({ error: 'Video concept is required' });
      }

      // TODO: Replace with actual AI script generation
      const script = `[SCENE 1: HOOK - ${Math.ceil(duration * 0.2)}s]
Visual: Close-up of ${productDetails.title}
Action: Dramatic reveal with dynamic lighting

[SCENE 2: PROBLEM - ${Math.ceil(duration * 0.15)}s]
Visual: Show the everyday struggle your audience faces
Action: Quick cuts of frustration moments

[SCENE 3: SOLUTION - ${Math.ceil(duration * 0.25)}s]
Visual: ${productDetails.title} in action
Action: Demonstrate key features
${productDetails.description ? `Highlight: ${productDetails.description.slice(0, 100)}` : ''}

[SCENE 4: BENEFITS - ${Math.ceil(duration * 0.2)}s]
Visual: Happy customer using the product
Action: Show lifestyle transformation
${productDetails.price ? `Value: ${productDetails.price}` : ''}

[SCENE 5: CTA - ${Math.ceil(duration * 0.2)}s]
Visual: Product beauty shot with branding
Action: Clear call to action
CTA: ${productDetails.cta || 'Shop Now'}

---
Video Concept: ${videoConcept}
Aspect Ratio: ${aspectRatio}
Duration: ${duration}s
${voiceOverEnabled ? `Voice Over Style: ${voiceOverConcept || 'Engaging and persuasive'}` : 'No voice over'}`;

      res.json({ script });
    } catch (error) {
      console.error('Error generating commerce script:', error);
      res.status(500).json({ error: 'Failed to generate script' });
    }
  });

  app.post('/api/commerce/voiceover/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { productDetails, videoConcept, voiceOverConcept, duration, voiceActorId } = req.body;
      
      if (!productDetails?.title) {
        return res.status(400).json({ error: 'Product title is required' });
      }
      if (!voiceActorId) {
        return res.status(400).json({ error: 'Narrator selection is required' });
      }

      // TODO: Replace with actual AI voiceover script generation
      const toneStyle = voiceOverConcept || 'engaging and conversational';
      const script = `Introducing ${productDetails.title}.

${productDetails.description 
  ? `${productDetails.description.split('.')[0]}.` 
  : 'The solution you\'ve been waiting for.'}

${videoConcept 
  ? `Imagine ${videoConcept.toLowerCase().includes('lifestyle') ? 'living your best life with this by your side' : 'having the perfect solution right at your fingertips'}.`
  : 'Experience the difference today.'}

${productDetails.price 
  ? `All this for just ${productDetails.price}.` 
  : 'At an unbeatable value.'}

${productDetails.cta || 'Shop now'} and transform your experience.

---
Narrator Style: ${toneStyle}
Estimated Duration: ~${duration}s`;

      res.json({ script });
    } catch (error) {
      console.error('Error generating voiceover script:', error);
      res.status(500).json({ error: 'Failed to generate voiceover script' });
    }
  });

  // =============================================================================
  // BUNNY STORAGE API ROUTES
  // =============================================================================

  // Check if Bunny Storage is configured
  app.get('/api/storage/status', async (req, res) => {
    try {
      const config = bunnyStorage.getBunnyConfig();
      res.json({
        configured: config.isConfigured,
        cdnUrl: config.isConfigured ? config.cdnUrl : null,
      });
    } catch (error) {
      console.error('Error checking storage status:', error);
      res.status(500).json({ error: 'Failed to check storage status' });
    }
  });

  // Upload a file to Bunny Storage
  app.post('/api/storage/upload', upload.single('file'), async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { path: filePath } = req.body;
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ error: 'File path is required' });
      }

      // Sanitize the path to prevent directory traversal
      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');

      const cdnUrl = await bunnyStorage.uploadFile(
        sanitizedPath,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        url: cdnUrl,
        path: sanitizedPath,
        size: req.file.size,
        contentType: req.file.mimetype,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // List files in a directory
  app.get('/api/storage/files', async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      const folderPath = (req.query.path as string) || '';
      const sanitizedPath = folderPath.replace(/\.\./g, '');

      const files = await bunnyStorage.listFiles(sanitizedPath);
      
      // Transform to a cleaner response format
      const formattedFiles = files.map(file => ({
        name: file.ObjectName,
        path: file.Path + file.ObjectName,
        size: file.Length,
        isDirectory: file.IsDirectory,
        lastModified: file.LastChanged,
        contentType: file.ContentType,
        url: file.IsDirectory ? null : bunnyStorage.getPublicUrl(file.Path + file.ObjectName),
      }));

      res.json({
        path: sanitizedPath,
        files: formattedFiles,
      });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // Get file info
  app.get('/api/storage/file-info', async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
      const info = await bunnyStorage.getFileInfo(sanitizedPath);

      if (!info) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json({
        path: sanitizedPath,
        url: bunnyStorage.getPublicUrl(sanitizedPath),
        ...info,
      });
    } catch (error) {
      console.error('Error getting file info:', error);
      res.status(500).json({ error: 'Failed to get file info' });
    }
  });

  // Get CDN URL for a file
  app.get('/api/storage/url', async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
      const url = bunnyStorage.getPublicUrl(sanitizedPath);

      res.json({ url, path: sanitizedPath });
    } catch (error) {
      console.error('Error getting file URL:', error);
      res.status(500).json({ error: 'Failed to get file URL' });
    }
  });

  // Check if a file exists
  app.get('/api/storage/exists', async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
      const exists = await bunnyStorage.fileExists(sanitizedPath);

      res.json({ exists, path: sanitizedPath });
    } catch (error) {
      console.error('Error checking file existence:', error);
      res.status(500).json({ error: 'Failed to check file existence' });
    }
  });

  // Delete a file
  app.delete('/api/storage/file', async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
      await bunnyStorage.deleteFile(sanitizedPath);

      res.json({ success: true, path: sanitizedPath });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // Download a file (proxy through server)
  app.get('/api/storage/download', async (req, res) => {
    try {
      if (!bunnyStorage.isBunnyConfigured()) {
        return res.status(503).json({ error: 'Bunny Storage is not configured' });
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
      const fileBuffer = await bunnyStorage.downloadFile(sanitizedPath);

      // Get filename from path
      const filename = sanitizedPath.split('/').pop() || 'download';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.status(500).json({ error: 'Failed to download file' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
