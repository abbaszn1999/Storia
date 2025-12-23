import { Router } from 'express';
import type { Request, Response } from 'express';
import { NarrativeAgents } from '../agents';
import { getCameraMovementPrompt } from '../utils/camera-presets';
import { StorageCleanup } from '../utils/storage-cleanup';
import { storage } from '../../../storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/narrative/videos
 * Create new narrative video (from mode selection)
 */
router.post('/videos', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { workspaceId, title, mode, narrativeMode } = req.body;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    if (!narrativeMode) {
      return res.status(400).json({ error: 'narrativeMode is required' });
    }
    
    // Initial step1Data with narrativeMode
    const step1Data = {
      narrativeMode, // 'image-reference' or 'start-end'
    };
    
    const video = await storage.createVideo({
      workspaceId,
      title: title || 'Untitled Project',
      mode: mode || 'narrative',
      status: 'draft',
      currentStep: 1, // Start at Step 1: Script
      completedSteps: [],
      step1Data,
    });

    console.log('[narrative:routes] Video created:', {
      videoId: video.id,
      narrativeMode,
      workspaceId,
    });

    res.json(video);
  } catch (error) {
    console.error('[narrative:routes] Video creation error:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: SCRIPT PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/narrative/videos/:id/step1
 * Save step1 data (script settings, user idea, generated script, etc.)
 * 
 * Following the same pattern as ambient visual mode:
 * 1. Fetch existing video
 * 2. Merge existing step1Data with incoming updates
 * 3. Save merged data to database
 */
router.patch('/videos/:id/step1', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const step1Updates = req.body;

    console.log('[narrative:routes] Saving step1 data for video:', id, 'fields:', Object.keys(step1Updates));

    // Get existing video to merge with current step1Data
    const existingVideo = await storage.getVideo(id);
    if (!existingVideo) {
      console.error('[narrative:routes] Video not found:', id);
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step1Data with new updates (like ambient visual does)
    const existingStep1 = (existingVideo.step1Data as Record<string, any>) || {};
    const updatedStep1Data = {
      ...existingStep1,
      ...step1Updates,
    };

    // Update video with merged step1Data
    const updated = await storage.updateVideo(id, {
      step1Data: updatedStep1Data,
    });

    console.log('[narrative:routes] Step1 data saved successfully:', {
      videoId: id,
      fieldsUpdated: Object.keys(step1Updates),
      hasScript: !!updatedStep1Data.script,
      scriptLength: updatedStep1Data.script?.length || 0,
    });

    res.json({ success: true, step1Data: updatedStep1Data });
  } catch (error) {
    console.error('[narrative:routes] Step1 save error:', error);
    res.status(500).json({ error: 'Failed to save step1 data' });
  }
});

/**
 * PATCH /api/narrative/videos/:id/step-progress
 * Save step progress (currentStep and completedSteps)
 * 
 * Called when user completes a step (clicks Continue) or navigates between steps
 */
router.patch('/videos/:id/step-progress', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { currentStep, completedSteps } = req.body;

    console.log('[narrative:routes] Saving step progress:', { 
      videoId: id, 
      currentStep, 
      completedSteps 
    });

    // Get existing video
    const existingVideo = await storage.getVideo(id);
    if (!existingVideo) {
      console.error('[narrative:routes] Video not found:', id);
      return res.status(404).json({ error: 'Video not found' });
    }

    // Build update object (client sends numbers 1-6, not string IDs)
    const updates: { currentStep?: number; completedSteps?: number[] } = {};
    
    if (currentStep !== undefined) {
      updates.currentStep = currentStep;
    }
    
    if (completedSteps !== undefined) {
      updates.completedSteps = completedSteps;
    }

    // Update video
    const updated = await storage.updateVideo(id, updates);

    console.log('[narrative:routes] Step progress saved successfully:', {
      videoId: id,
      currentStep: updates.currentStep,
      completedStepsCount: updates.completedSteps?.length || 0,
    });

    res.json({ success: true, currentStep: updated.currentStep, completedSteps: updated.completedSteps });
  } catch (error) {
    console.error('[narrative:routes] Step progress save error:', error);
    res.status(500).json({ error: 'Failed to save step progress' });
  }
});

/**
 * POST /api/narrative/script/generate
 * Generate a script from user's story idea
 */
router.post('/script/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { duration, genre, language, aspectRatio, userPrompt } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    
    console.log('[narrative:routes] Generating script:', { 
      duration, 
      genre, 
      language,
      userId,
      workspaceId,
    });
    
    const script = await NarrativeAgents.generateScript({
      duration,
      genre,
      language,
      aspectRatio,
      userPrompt,
    }, userId, workspaceId);

    res.json({ script });
  } catch (error) {
    console.error('[narrative:routes] Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

router.post('/script/analyze', async (req: Request, res: Response) => {
  try {
    const { script } = req.body;
    
    const scenes = await NarrativeAgents.analyzeScript(script);

    res.json({ scenes });
  } catch (error) {
    console.error('Script analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze script' });
  }
});

router.post('/character/create', async (req: Request, res: Response) => {
  try {
    const { name, role, description, style } = req.body;
    
    const characterDescription = await NarrativeAgents.createCharacter({
      name,
      role,
      description,
      style,
    });

    const referenceImage = await NarrativeAgents.generateImage(characterDescription);

    res.json({ 
      description: characterDescription,
      referenceImage,
    });
  } catch (error) {
    console.error('Character creation error:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

router.post('/shot/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      sceneDescription,
      shotType,
      characters,
      location,
      timeOfDay,
      visualStyle,
      cameraMovement,
      additionalNotes,
      referenceImages,
    } = req.body;

    const imagePrompt = await NarrativeAgents.generateImagePrompt({
      sceneDescription,
      shotType,
      characters,
      location,
      timeOfDay,
      visualStyle,
      cameraMovement,
      additionalNotes,
    });

    const imageUrl = await NarrativeAgents.generateImage(imagePrompt, referenceImages);

    res.json({ 
      imageUrl,
      prompt: imagePrompt,
    });
  } catch (error) {
    console.error('Shot image generation error:', error);
    res.status(500).json({ error: 'Failed to generate shot image' });
  }
});

router.post('/shot/generate-video', async (req: Request, res: Response) => {
  try {
    const {
      imageUrl,
      shotDescription,
      cameraMovement,
      action,
      duration,
      pacing,
    } = req.body;

    const videoPrompt = await NarrativeAgents.generateVideoPrompt({
      shotDescription,
      cameraMovement,
      action,
      duration,
      pacing,
    });

    const videoUrl = await NarrativeAgents.generateVideo(imageUrl, videoPrompt);

    res.json({ 
      videoUrl,
      prompt: videoPrompt,
    });
  } catch (error) {
    console.error('Shot video generation error:', error);
    res.status(500).json({ error: 'Failed to generate shot video' });
  }
});

router.post('/video/finalize', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;

    await StorageCleanup.cleanupVideoFiles({
      videoId,
      keepFinalVideo: true,
      keepCharacterSheets: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Video finalization error:', error);
    res.status(500).json({ error: 'Failed to finalize video' });
  }
});

export default router;
