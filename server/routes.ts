import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import narrativeRoutes from "./modes/narrative/routes";
import { ambientVisualRoutes } from "./modes/ambient-visual";
import { characterVlogRoutes } from "./modes/character-vlog";
import { socialCommerceRoutes } from "./modes/social-commerce";
import storiesRouter from "./stories";
// Import will be done inside registerRoutes since it's async
import { storageRoutes } from "./storage/index";
import { authRoutes, isAuthenticated, getCurrentUserId } from "./auth";
import characterRoutes from "./assets/characters/routes";
import locationRoutes from "./assets/locations/routes";
import voiceRoutes from "./assets/voices/routes";
import brandkitRoutes from "./assets/brandkits/routes";
import uploadRoutes from "./assets/uploads/routes";
import { registerLateRoutes } from "./integrations/late/routes";
import { insertWorkspaceSchema, insertWorkspaceIntegrationSchema, insertCharacterSchema, insertLocationSchema, insertVoiceSchema, insertUploadSchema } from "@shared/schema";
import { z } from "zod";
import { bunnyStorage } from "./storage/bunny-storage";
// Auto Production routes
import { autoProductionSharedRoutes } from "./autoproduction/shared/routes";
import { autoStoryRoutes } from "./autoproduction/auto-story/routes";
import { autoVideoRoutes } from "./autoproduction/auto-video/routes";

// Helper function to verify workspace ownership
async function verifyWorkspaceOwnership(workspaceId: string, userId: string): Promise<boolean> {
  const workspaces = await storage.getWorkspacesByUserId(userId);
  return workspaces.some((ws) => ws.id === workspaceId);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (both /api/auth and /api/account)
  app.use('/api/auth', authRoutes);
  app.use('/api/account', authRoutes);
  
  // Auto Production routes (NEW)
  app.use('/api/autoproduction', autoProductionSharedRoutes);
  app.use('/api/autoproduction/story', autoStoryRoutes);
  app.use('/api/autoproduction/video', autoVideoRoutes);
  
  // Feature routes
  app.use('/api/narrative', narrativeRoutes);
  app.use('/api/ambient-visual', ambientVisualRoutes);
  app.use('/api/character-vlog', characterVlogRoutes);
  app.use('/api/social-commerce', socialCommerceRoutes);
  app.use('/api/stories', storiesRouter);
  
  // Story mode routers (async imports)
  const { psRouter: problemSolutionRouter } = await import("./stories/problem-solution");
  app.use('/api/problem-solution', problemSolutionRouter);
  
  const { baRouter: beforeAfterRouter } = await import("./stories/before-after");
  app.use('/api/before-after', beforeAfterRouter);
  
  const { mbRouter: mythBustingRouter } = await import("./stories/myth-busting");
  app.use('/api/myth-busting', mythBustingRouter);
  
  const { trRouter: teaseRevealRouter } = await import("./stories/tease-reveal");
  app.use('/api/tease-reveal', teaseRevealRouter);
  
  const { autoAsmrRouter } = await import("./stories/auto-asmr");
  app.use('/api/auto-asmr', autoAsmrRouter);
  
  const { logoAnimationRoutes } = await import("./modes/logo-animation");
  app.use('/api/videos/logo-animation', logoAnimationRoutes);
  
  app.use('/api/storage', storageRoutes);
  app.use('/api/characters', characterRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/voices', voiceRoutes);
  app.use('/api/brandkits', brandkitRoutes);
  app.use('/api/uploads', uploadRoutes);
  
  // Late.dev integration routes
  registerLateRoutes(app, storage, isAuthenticated, getCurrentUserId, verifyWorkspaceOwnership);

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
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
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
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
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

  app.patch('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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

  // Stories routes
  
  // Get all stories for the current user
  app.get('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const stories = await storage.getStoriesByUserId(userId);
      res.json(stories);
    } catch (error) {
      console.error('Error fetching user stories:', error);
      res.status(500).json({ error: 'Failed to fetch stories' });
    }
  });

  // Get stories for a specific workspace
  app.get('/api/workspaces/:workspaceId/stories', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify workspace ownership
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const stories = await storage.getStoriesByWorkspaceId(workspaceId);
      res.json(stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      res.status(500).json({ error: 'Failed to fetch stories' });
    }
  });
  
  // Get a single story by ID
  app.get('/api/stories/:storyId', isAuthenticated, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      // Verify ownership
      if (story.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this story' });
      }

      res.json(story);
    } catch (error) {
      console.error('Error fetching story:', error);
      res.status(500).json({ error: 'Failed to fetch story' });
    }
  });

  // Update story with published platforms info (shared endpoint for all story modes)
  app.put('/api/stories/:storyId/publish', isAuthenticated, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { platform, publishData, publishedPlatforms } = req.body;

      // Get current story
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      // Verify ownership
      if (story.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Support two modes: single platform or bulk platforms
      let updatedPlatforms: Record<string, any>;
      const currentPlatforms = (story.publishedPlatforms || {}) as Record<string, any>;

      if (publishedPlatforms && typeof publishedPlatforms === 'object') {
        // Bulk mode: merge all provided platforms
        updatedPlatforms = { ...currentPlatforms, ...publishedPlatforms };
      } else if (platform && publishData) {
        // Single platform mode
        updatedPlatforms = {
          ...currentPlatforms,
          [platform]: {
            ...publishData,
            published_at: new Date().toISOString(),
          },
        };
      } else {
        return res.status(400).json({ 
          error: "Either 'publishedPlatforms' object or 'platform' + 'publishData' are required" 
        });
      }

      const updatedStory = await storage.updateStory(storyId, {
        publishedPlatforms: updatedPlatforms,
      });

      console.log('[routes] Story publish updated:', {
        storyId,
        totalPlatforms: Object.keys(updatedPlatforms).length,
      });

      res.json({
        success: true,
        story: updatedStory,
      });
    } catch (error) {
      console.error('Error updating story publish status:', error);
      res.status(500).json({ error: 'Failed to update story publish status' });
    }
  });

  app.delete('/api/stories/:storyId', isAuthenticated, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get story to verify ownership
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      // Verify ownership (check userId directly on story)
      if (story.userId !== userId) {
        return res.status(403).json({ error: 'Access denied to this story' });
      }

      // Delete entire project folder from Bunny CDN
      if (story.videoUrl) {
        try {
          // Extract path from CDN URL
          // Example URL: https://storia.b-cdn.net/{userId}/{workspace}/Story_Mode/asmr/{ProjectFolder}/Render/final.mp4
          // We want to delete: {userId}/{workspace}/Story_Mode/{storyMode}/{ProjectFolder}/
          const cdnUrl = new URL(story.videoUrl);
          const fullPath = cdnUrl.pathname.replace(/^\//, ''); // Remove leading slash
          
          // Extract project folder path (everything before /Render/)
          const projectFolderMatch = fullPath.match(/^(.+\/Story_Mode\/[^/]+\/[^/]+)\//);
          if (projectFolderMatch) {
            const projectFolderPath = projectFolderMatch[1];
            console.log(`Deleting project folder: ${projectFolderPath}`);
            await bunnyStorage.deleteFolder(projectFolderPath);
          } else {
            // Fallback: delete individual files if pattern doesn't match
            console.warn('Could not extract project folder path, deleting individual files');
            await bunnyStorage.deleteFile(fullPath);
            if (story.thumbnailUrl) {
              const thumbnailPath = new URL(story.thumbnailUrl).pathname.replace(/^\//, '');
              await bunnyStorage.deleteFile(thumbnailPath);
            }
          }
        } catch (error) {
          console.warn('Failed to delete files from Bunny:', error);
          // Continue with database deletion even if Bunny delete fails
        }
      }

      // Delete from database
      await storage.deleteStory(storyId);
      res.json({ success: true, message: 'Story and all associated files deleted' });
    } catch (error) {
      console.error('Error deleting story:', error);
      res.status(500).json({ error: 'Failed to delete story' });
    }
  });

  // Videos routes
  app.get('/api/workspaces/:workspaceId/videos', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }

      const videos = await storage.getVideosByWorkspaceId(workspaceId);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.get('/api/videos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(video.workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this video' });
      }

      res.json(video);
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  app.delete('/api/videos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get video to verify ownership
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Verify workspace ownership
      const hasAccess = await verifyWorkspaceOwnership(video.workspaceId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this video' });
      }

      // Get workspace info for building Bunny path
      const workspace = await storage.getWorkspace(video.workspaceId);
      
      // Clean up Bunny CDN assets
      if (workspace && bunnyStorage.isBunnyConfigured()) {
        try {
          // Determine tool mode from video.mode
          const toolModeMap: Record<string, string> = {
            'social-commerce': 'commerce',
            'ambient-visual': 'ambient',
            'narrative': 'narrative',
            'character-vlog': 'vlog',
            'logo-animation': 'logo',
          };
          const toolMode = toolModeMap[video.mode] || video.mode;

          // Build folder path using createdAt date
          const folderPath = bunnyStorage.buildVideoProjectFolderPath({
            userId,
            workspaceName: workspace.name,
            toolMode,
            projectName: video.title || 'untitled',
            dateLabel: video.createdAt 
              ? new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
              : undefined,
          });

          console.log('[routes] Deleting video folder from Bunny CDN:', folderPath);
          await bunnyStorage.deleteFolder(folderPath);
          console.log('[routes] ✓ Video folder deleted from Bunny CDN');
        } catch (bunnyError) {
          // Log but don't fail the delete - DB record should still be removed
          console.error('[routes] Failed to delete Bunny folder (continuing with DB delete):', bunnyError);
        }
      }

      // Delete from database
      await storage.deleteVideo(id);
      res.json({ success: true, message: 'Video deleted' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  });

  // Workspace integration routes
  app.get('/api/workspaces/:workspaceId/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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

  const httpServer = createServer(app);

  return httpServer;
}
