import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { storage } from '../../../storage';
import { bunnyStorage, buildVideoModePath } from '../../../storage/bunny-storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { AMBIENT_VISUAL_CONFIG } from '../config';
import { 
  generateMoodDescription, 
  generateScenes, 
  composeShotsForScenes, 
  proposeContinuity 
} from '../agents';
import type { 
  CreateAmbientVideoRequest, 
  Step1Data,
  Step2Data,
  Step3Data,
  MoodDescriptionGeneratorInput,
  SceneGeneratorInput,
  Scene,
  Shot,
  ShotVersion,
  ContinuityGroup
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPORARY REFERENCE IMAGE STORAGE (Memory)
// ═══════════════════════════════════════════════════════════════════════════════

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for reference images
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// In-memory storage for temporary uploads
interface TempUpload {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  uploadedAt: number;
}

const tempUploads = new Map<string, TempUpload>();

// Cleanup expired uploads every 30 minutes
setInterval(() => {
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  let cleaned = 0;
  const entries = Array.from(tempUploads.entries());
  for (const [id, upload] of entries) {
    if (upload.uploadedAt < thirtyMinAgo) {
      tempUploads.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[ambient-visual:routes] Cleaned up ${cleaned} expired temp uploads`);
  }
}, 30 * 60 * 1000);

// Export for use in step/2/continue endpoint
export function getTempUpload(tempId: string): TempUpload | undefined {
  return tempUploads.get(tempId);
}

export function deleteTempUpload(tempId: string): void {
  tempUploads.delete(tempId);
}

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
// REFERENCE IMAGE UPLOAD (Temporary Storage)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/upload-reference
 * Upload a reference image to temporary memory storage
 * 
 * Returns a tempId and base64 preview URL for immediate display.
 * Images are stored in memory only - lost on page refresh.
 * On Continue, images are uploaded to Bunny CDN permanently.
 */
router.post('/upload-reference', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate unique temp ID
    const tempId = randomUUID();

    // Store in memory
    tempUploads.set(tempId, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalName: file.originalname,
      uploadedAt: Date.now(),
    });

    // Create base64 preview URL for immediate display
    const base64 = file.buffer.toString('base64');
    const previewUrl = `data:${file.mimetype};base64,${base64}`;

    console.log('[ambient-visual:routes] Reference image uploaded to temp storage:', {
      tempId,
      originalName: file.originalname,
      size: `${(file.buffer.length / 1024).toFixed(1)}KB`,
      mimetype: file.mimetype,
    });

    res.json({
      tempId,
      previewUrl,
      originalName: file.originalname,
      size: file.buffer.length,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Reference upload error:', error);
    res.status(500).json({ error: 'Failed to upload reference image' });
  }
});

/**
 * DELETE /api/ambient-visual/upload-reference/:tempId
 * Remove a temporary reference image from memory
 */
router.delete('/upload-reference/:tempId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tempId } = req.params;
    
    if (tempUploads.has(tempId)) {
      tempUploads.delete(tempId);
      console.log('[ambient-visual:routes] Temp reference deleted:', tempId);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Temp upload not found' });
    }
  } catch (error) {
    console.error('[ambient-visual:routes] Delete temp reference error:', error);
    res.status(500).json({ error: 'Failed to delete reference image' });
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

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: VISUAL WORLD PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/ambient-visual/videos/:id/step/2/continue
 * Save visual world settings and mark step as complete
 * 
 * Called when user clicks Continue to move to Flow Design phase
 * - Uploads temp reference images to Bunny CDN permanently
 * - Saves ALL visual world settings with CDN URLs
 * - Updates currentStep to 3
 * - Adds 2 to completedSteps array
 */
router.patch('/videos/:id/step/2/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const allSettings = req.body;
    const referenceTempIds: string[] = allSettings.referenceTempIds || [];
    // Existing CDN URLs (from restored images that were already saved)
    const existingReferenceUrls: string[] = allSettings.existingReferenceUrls || [];

    console.log('[ambient-visual:routes] Completing visual world step:', {
      videoId: id,
      artStyle: allSettings.artStyle,
      referenceTempIds: referenceTempIds.length,
      existingReferenceUrls: existingReferenceUrls.length,
    });

    // Get current video to get title and workspace info
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Upload temp reference images to Bunny CDN permanently
    const referenceImageUrls: string[] = [];
    
    if (referenceTempIds.length > 0 && bunnyStorage.isBunnyConfigured()) {
      // Get workspace name for path building
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === video.workspaceId);
      const workspaceName = workspace?.name || video.workspaceId;
      const videoTitle = video.title || 'Untitled';

      console.log('[ambient-visual:routes] Uploading reference images to Bunny:', {
        count: referenceTempIds.length,
        workspace: workspaceName,
        videoTitle,
      });

      for (const tempId of referenceTempIds) {
        const tempUpload = getTempUpload(tempId);
        if (tempUpload) {
          try {
            // Build Bunny path: {userId}/{workspace}/video_mode/ambient/{title}_{date}/Rendered/References/{filename}
            const filename = `${Date.now()}_${tempUpload.originalName}`;
            const bunnyPath = buildVideoModePath({
              userId,
              workspaceName,
              toolMode: 'ambient',
              projectName: videoTitle,
              subFolder: 'References',
              filename,
            });

            // Upload to Bunny CDN
            const cdnUrl = await bunnyStorage.uploadFile(
              bunnyPath,
              tempUpload.buffer,
              tempUpload.mimetype
            );

            referenceImageUrls.push(cdnUrl);
            console.log('[ambient-visual:routes] Reference image uploaded:', {
              tempId,
              cdnUrl,
            });

            // Remove from temp storage
            deleteTempUpload(tempId);
          } catch (uploadError) {
            console.error('[ambient-visual:routes] Failed to upload reference image:', {
              tempId,
              error: uploadError,
            });
            // Continue with other images even if one fails
          }
        } else {
          console.warn('[ambient-visual:routes] Temp upload not found:', tempId);
        }
      }
    }

    // Combine existing CDN URLs with newly uploaded ones
    const allReferenceImages = [...existingReferenceUrls, ...referenceImageUrls];

    // Build step2Data with ALL visual world settings
    const step2Data: Step2Data = {
      artStyle: allSettings.artStyle,
      visualElements: allSettings.visualElements || [],
      visualRhythm: allSettings.visualRhythm,
      referenceImages: allReferenceImages, // Combined: existing + newly uploaded CDN URLs
      imageCustomInstructions: allSettings.imageCustomInstructions,
    };

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    // Add step 2 if not already completed
    if (!completedSteps.includes(2)) {
      completedSteps.push(2);
    }

    // Update video: save settings, mark step complete, move to step 3
    const updated = await storage.updateVideo(id, {
      step2Data,
      currentStep: 3,  // Move to Flow Design phase
      completedSteps,
    });

    console.log('[ambient-visual:routes] Visual world step completed:', {
      videoId: id,
      currentStep: 3,
      completedSteps,
      referenceImagesCount: referenceImageUrls.length,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step completion error:', error);
    res.status(500).json({ error: 'Failed to complete visual world step' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: FLOW DESIGN PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/flow-design/generate
 * Generate scenes and shots from mood description
 * 
 * Flow:
 * 1. Fetch step1Data and step2Data from database
 * 2. Call Scene Generator to create scene segments
 * 3. Call Shot Composer for each scene to create shots
 * 4. (Optional) Call Continuity Producer for start-end-frame mode
 * 5. Save to step3Data in database
 */
router.post('/flow-design/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[ambient-visual:routes] Generating flow design:', { videoId });

    // Step 1: Fetch video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data | undefined;
    const step2Data = video.step2Data as Step2Data | undefined;

    if (!step1Data?.moodDescription) {
      return res.status(400).json({ 
        error: 'Mood description is required. Please complete the Atmosphere phase first.' 
      });
    }

    // Step 2: Build scene generator input
    const sceneInput: SceneGeneratorInput = {
      moodDescription: step1Data.moodDescription,
      duration: step1Data.duration,
      theme: step1Data.theme,
      mood: step1Data.mood,
      pacing: step1Data.pacing,
      segmentCount: step1Data.segmentCount,
      shotsPerSegment: step1Data.shotsPerSegment,
      animationMode: step1Data.animationMode,
      videoGenerationMode: step1Data.videoGenerationMode,
      visualRhythm: step2Data?.visualRhythm,
      artStyle: step2Data?.artStyle,
      visualElements: step2Data?.visualElements,
    };

    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    // Step 3: Generate scenes
    const sceneResult = await generateScenes(
      sceneInput,
      videoId,
      userId,
      workspaceId
    );

    console.log('[ambient-visual:routes] Scenes generated:', {
      sceneCount: sceneResult.scenes.length,
      totalDuration: sceneResult.totalDuration,
    });

    // Step 4: Compose shots for all scenes
    const shotResult = await composeShotsForScenes(
      sceneResult.scenes,
      {
        shotsPerSegment: step1Data.shotsPerSegment,
        pacing: step1Data.pacing,
        animationMode: step1Data.animationMode,
        artStyle: step2Data?.artStyle,
        visualElements: step2Data?.visualElements,
      },
      userId,
      workspaceId
    );

    console.log('[ambient-visual:routes] Shots composed:', {
      totalShots: Object.values(shotResult.shots).flat().length,
    });

    // Step 5: (Optional) Propose continuity for start-end-frame mode
    let continuityGroups: Record<string, ContinuityGroup[]> = {};
    let continuityCost = 0;

    if (step1Data.videoGenerationMode === 'start-end-frame') {
      try {
        const continuityResult = await proposeContinuity(
          {
            scenes: sceneResult.scenes,
            shots: shotResult.shots,
          },
          userId,
          workspaceId
        );
        continuityGroups = continuityResult.continuityGroups;
        continuityCost = continuityResult.cost || 0;

        console.log('[ambient-visual:routes] Continuity proposed:', {
          groupCount: Object.values(continuityGroups).flat().length,
        });
      } catch (continuityError) {
        console.warn('[ambient-visual:routes] Continuity generation failed, continuing without:', continuityError);
        // Don't fail the whole request if continuity generation fails
      }
    }

    // Step 6: Create initial shot versions (empty, for tracking)
    const shotVersions: Record<string, ShotVersion[]> = {};
    const now = new Date();
    
    for (const [sceneId, sceneShots] of Object.entries(shotResult.shots)) {
      for (const shot of sceneShots) {
        shotVersions[shot.id] = [{
          id: `version-${shot.id}-1`,
          shotId: shot.id,
          versionNumber: 1,
          imagePrompt: shot.description,
          imageUrl: null,
          startFramePrompt: null,
          startFrameUrl: null,
          endFramePrompt: null,
          endFrameUrl: null,
          videoPrompt: null,
          videoUrl: null,
          videoDuration: null,
          status: 'pending',
          needsRerender: false,
          createdAt: now,
        }];
        
        // Update shot with version reference
        shot.currentVersionId = `version-${shot.id}-1`;
      }
    }

    // Step 7: Build step3Data and save to database
    const step3Data: Step3Data = {
      scenes: sceneResult.scenes,
      shots: shotResult.shots,
      shotVersions,
      continuityLocked: false,
      continuityGroups,
    };

    await storage.updateVideo(videoId, { 
      step3Data,
      currentStep: 3,
    });

    // Calculate total cost
    const totalCost = (sceneResult.cost || 0) + shotResult.totalCost + continuityCost;

    console.log('[ambient-visual:routes] Flow design generated and saved:', {
      videoId,
      sceneCount: sceneResult.scenes.length,
      totalShots: Object.values(shotResult.shots).flat().length,
      continuityGroups: Object.values(continuityGroups).flat().length,
      totalCost,
    });

    res.json({
      scenes: sceneResult.scenes,
      shots: shotResult.shots,
      shotVersions,
      continuityGroups,
      totalDuration: sceneResult.totalDuration,
      cost: totalCost,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Flow design generation error:', error);
    res.status(500).json({ error: 'Failed to generate flow design' });
  }
});

/**
 * PATCH /api/ambient-visual/videos/:id/step/3/continue
 * Save flow design and mark step as complete
 * 
 * Called when user clicks Continue to move to Composition phase
 * - Saves ALL flow design data (scenes, shots, continuity groups)
 * - Updates currentStep to 4
 * - Adds 3 to completedSteps array
 */
router.patch('/videos/:id/step/3/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { scenes, shots, shotVersions, continuityLocked, continuityGroups } = req.body;

    console.log('[ambient-visual:routes] Completing flow design step:', {
      videoId: id,
      sceneCount: scenes?.length || 0,
      shotCount: shots ? Object.values(shots).flat().length : 0,
      continuityLocked,
    });

    // Get current video
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Validate that we have scenes
    if (!scenes || scenes.length === 0) {
      return res.status(400).json({ 
        error: 'At least one scene is required to continue.' 
      });
    }

    // Build step3Data
    const step3Data: Step3Data = {
      scenes: scenes as Scene[],
      shots: shots as Record<string, Shot[]>,
      shotVersions: shotVersions as Record<string, ShotVersion[]> | undefined,
      continuityLocked: continuityLocked || false,
      continuityGroups: continuityGroups as Record<string, ContinuityGroup[]> || {},
    };

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    // Add step 3 if not already completed
    if (!completedSteps.includes(3)) {
      completedSteps.push(3);
    }

    // Update video: save settings, mark step complete, move to step 4
    const updated = await storage.updateVideo(id, {
      step3Data,
      currentStep: 4,  // Move to Composition phase
      completedSteps,
    });

    console.log('[ambient-visual:routes] Flow design step completed:', {
      videoId: id,
      currentStep: 4,
      completedSteps,
      sceneCount: scenes.length,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step completion error:', error);
    res.status(500).json({ error: 'Failed to complete flow design step' });
  }
});

export default router;

