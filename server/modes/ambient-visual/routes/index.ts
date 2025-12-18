import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../../../storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { AMBIENT_VISUAL_CONFIG } from '../config';
import { generateMoodDescription } from '../agents';
import type { 
  CreateAmbientVideoRequest, 
  Step1Data, 
  MoodDescriptionGeneratorInput 
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos
 * Create new ambient video (from onboarding)
 */
router.post('/videos', async (req: Request, res: Response) => {
  try {
    const { workspaceId, title, animationMode, videoGenerationMode } = 
      req.body as CreateAmbientVideoRequest;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    if (!animationMode) {
      return res.status(400).json({ error: 'animationMode is required' });
    }
    
    // Initial step1Data with only onboarding settings
    const step1Data: Partial<Step1Data> = {
      animationMode,
      videoGenerationMode: videoGenerationMode || undefined,
    };
    
    const video = await storage.createVideo({
      workspaceId,
      title: title || AMBIENT_VISUAL_CONFIG.defaultTitle,
      mode: AMBIENT_VISUAL_CONFIG.mode,
      status: 'draft',
      currentStep: AMBIENT_VISUAL_CONFIG.initialStep,
      completedSteps: [],
      step1Data,
    });

    res.json(video);
  } catch (error) {
    console.error('[ambient-visual:routes] Video creation error:', error);
    res.status(500).json({ error: 'Failed to create ambient video' });
  }
});

/**
 * GET /api/ambient-visual/videos/:id
 * Get video by ID
 */
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('[ambient-visual:routes] Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: ATMOSPHERE PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/atmosphere/generate
 * Generate mood description from atmosphere settings
 * 
 * Flow:
 * 1. Save ALL settings to database (step1Data)
 * 2. Extract 15 fields for AI generation
 * 3. Generate mood description using AI
 * 4. Update database with generated description
 */
router.post('/atmosphere/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, ...allSettings } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[ambient-visual:routes] Generating atmosphere description:', {
      videoId,
      mood: allSettings.mood,
      theme: allSettings.theme,
      duration: allSettings.duration,
    });

    // Step 1: Build step1Data with ALL settings
    const step1Data: Step1Data = {
      // Animation Mode (from onboarding)
      animationMode: allSettings.animationMode,
      videoGenerationMode: allSettings.videoGenerationMode,
      
      // Image Settings
      imageModel: allSettings.imageModel,
      imageResolution: allSettings.imageResolution,
      
      // Video Settings
      aspectRatio: allSettings.aspectRatio,
      duration: allSettings.duration,
      
      // Mood & Theme
      mood: allSettings.mood,
      theme: allSettings.theme,
      timeContext: allSettings.timeContext,
      season: allSettings.season,
      userStory: allSettings.userStory || '',             // User's original prompt
      moodDescription: allSettings.moodDescription || '', // AI-generated description
      
      // Animation-specific settings
      defaultEasingStyle: allSettings.defaultEasingStyle,
      videoModel: allSettings.videoModel,
      videoResolution: allSettings.videoResolution,
      motionPrompt: allSettings.motionPrompt,
      transitionStyle: allSettings.transitionStyle,
      cameraMotion: allSettings.cameraMotion,
      
      // Pacing & Flow
      pacing: allSettings.pacing,
      segmentEnabled: allSettings.segmentEnabled,
      segmentCount: allSettings.segmentCount,
      shotsPerSegment: allSettings.shotsPerSegment,
      
      // Loop Settings
      loopMode: allSettings.loopMode,
      loopType: allSettings.loopType,
      segmentLoopEnabled: allSettings.segmentLoopEnabled,
      segmentLoopCount: allSettings.segmentLoopCount,
      shotLoopEnabled: allSettings.shotLoopEnabled,
      shotLoopCount: allSettings.shotLoopCount,
      
      // Voiceover
      voiceoverEnabled: allSettings.voiceoverEnabled,
      language: allSettings.language,
      textOverlayEnabled: allSettings.textOverlayEnabled,
      textOverlayStyle: allSettings.textOverlayStyle,
    };

    // Save ALL settings to database first
    await storage.updateVideo(videoId, { 
      step1Data, 
      currentStep: 1 
    });

    // Step 2: Extract ONLY needed settings for AI generation (15 fields)
    const aiInput: MoodDescriptionGeneratorInput = {
      // Core atmosphere (6 fields)
      mood: allSettings.mood,
      theme: allSettings.theme,
      timeContext: allSettings.timeContext,
      season: allSettings.season,
      duration: allSettings.duration,
      aspectRatio: allSettings.aspectRatio,
      
      // Animation context (2 fields)
      animationMode: allSettings.animationMode,
      videoGenerationMode: allSettings.videoGenerationMode,
      
      // Loop settings (6 fields)
      loopMode: allSettings.loopMode,
      loopType: allSettings.loopType,
      segmentLoopEnabled: allSettings.segmentLoopEnabled,
      segmentLoopCount: allSettings.segmentLoopCount,
      shotLoopEnabled: allSettings.shotLoopEnabled,
      shotLoopCount: allSettings.shotLoopCount,
      
      // User's manual text (1 field)
      userPrompt: allSettings.moodDescription || undefined,
    };

    // Step 3: Generate mood description using AI
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateMoodDescription(aiInput, userId, workspaceId);

    // Step 4: Update database with generated description
    step1Data.moodDescription = result.moodDescription;
    await storage.updateVideo(videoId, { step1Data });

    console.log('[ambient-visual:routes] Atmosphere description generated:', {
      videoId,
      descriptionLength: result.moodDescription.length,
      cost: result.cost,
    });

    res.json(result);
  } catch (error) {
    console.error('[ambient-visual:routes] Atmosphere generation error:', error);
    res.status(500).json({ error: 'Failed to generate atmosphere description' });
  }
});

/**
 * PATCH /api/ambient-visual/videos/:id/step/1/continue
 * Save atmosphere settings and mark step as complete
 * 
 * Called when user clicks Continue to move to Visual World phase
 * - Saves ALL settings (in case modified after generation)
 * - Updates currentStep to 2
 * - Adds 1 to completedSteps array
 */
router.patch('/videos/:id/step/1/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const allSettings = req.body;

    console.log('[ambient-visual:routes] Completing atmosphere step:', {
      videoId: id,
      mood: allSettings.mood,
      theme: allSettings.theme,
    });

    // Build step1Data with ALL settings
    const step1Data: Step1Data = {
      // Animation Mode (from onboarding)
      animationMode: allSettings.animationMode,
      videoGenerationMode: allSettings.videoGenerationMode,
      
      // Image Settings
      imageModel: allSettings.imageModel,
      imageResolution: allSettings.imageResolution,
      
      // Video Settings
      aspectRatio: allSettings.aspectRatio,
      duration: allSettings.duration,
      
      // Mood & Theme
      mood: allSettings.mood,
      theme: allSettings.theme,
      timeContext: allSettings.timeContext,
      season: allSettings.season,
      userStory: allSettings.userStory,         // User's original prompt (preserved)
      moodDescription: allSettings.moodDescription, // AI-generated description
      
      // Animation-specific settings
      defaultEasingStyle: allSettings.defaultEasingStyle,
      videoModel: allSettings.videoModel,
      videoResolution: allSettings.videoResolution,
      motionPrompt: allSettings.motionPrompt,
      transitionStyle: allSettings.transitionStyle,
      cameraMotion: allSettings.cameraMotion,
      
      // Pacing & Flow
      pacing: allSettings.pacing,
      segmentEnabled: allSettings.segmentEnabled,
      segmentCount: allSettings.segmentCount,
      shotsPerSegment: allSettings.shotsPerSegment,
      
      // Loop Settings
      loopMode: allSettings.loopMode,
      loopType: allSettings.loopType,
      segmentLoopEnabled: allSettings.segmentLoopEnabled,
      segmentLoopCount: allSettings.segmentLoopCount,
      shotLoopEnabled: allSettings.shotLoopEnabled,
      shotLoopCount: allSettings.shotLoopCount,
      
      // Voiceover
      voiceoverEnabled: allSettings.voiceoverEnabled,
      language: allSettings.language,
      textOverlayEnabled: allSettings.textOverlayEnabled,
      textOverlayStyle: allSettings.textOverlayStyle,
    };

    // Get current video to check completed steps
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    // Add step 1 if not already completed
    if (!completedSteps.includes(1)) {
      completedSteps.push(1);
    }

    // Update video: save settings, mark step complete, move to step 2
    const updated = await storage.updateVideo(id, {
      step1Data,
      currentStep: 2,  // Move to Visual World phase
      completedSteps,
    });

    console.log('[ambient-visual:routes] Atmosphere step completed:', {
      videoId: id,
      currentStep: 2,
      completedSteps,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step completion error:', error);
    res.status(500).json({ error: 'Failed to complete atmosphere step' });
  }
});

export default router;

