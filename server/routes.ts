import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import narrativeRoutes from "./modes/narrative/routes";
import storiesRouter from "./stories";
import { psRouter as problemSolutionRouter } from "./stories/problem-solution/routes";
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

// Helper function to verify workspace ownership
async function verifyWorkspaceOwnership(workspaceId: string, userId: string): Promise<boolean> {
  const workspaces = await storage.getWorkspacesByUserId(userId);
  return workspaces.some((ws) => ws.id === workspaceId);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (both /api/auth and /api/account)
  app.use('/api/auth', authRoutes);
  app.use('/api/account', authRoutes);
  
  // Feature routes
  app.use('/api/narrative', narrativeRoutes);
  app.use('/api/stories', storiesRouter);
  app.use('/api/problem-solution', problemSolutionRouter);
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

      // Verify workspace ownership
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === story.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: 'Access denied to this story' });
      }

      // Delete entire project folder from Bunny CDN
      if (story.exportUrl) {
        try {
          // Extract path from CDN URL
          // Example URL: https://storia.b-cdn.net/{userId}/{workspace}/Story_Mode/asmr/{Project_Name_createDate}/Rendered/video.mp4
          // We want to delete: {userId}/{workspace}/Story_Mode/asmr/{Project_Name_createDate}/
          const cdnUrl = new URL(story.exportUrl);
          const fullPath = cdnUrl.pathname.replace(/^\//, ''); // Remove leading slash
          
          // Extract project folder path (everything before /Rendered/)
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
