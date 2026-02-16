import { Router } from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { storage } from '../../../storage';
import { bunnyStorage, buildVideoModePath } from '../../../storage/bunny-storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { AMBIENT_VISUAL_CONFIG } from '../config';
import { 
  generateMoodDescription, 
  generateScenes, 
  composeShotsForScenes, 
  proposeContinuity,
  generateVideoPrompts,
  generateVoiceoverScript,
  generateVoiceoverAudio,
  calculateTotalDurationWithLoops,
  AMBIENT_VOICES,
  generateSoundEffectPrompt,
  generateSoundEffect,
} from '../agents';
import { generateAllShotImages, mergeResultsIntoShotVersions } from '../agents/video-image-generator-batch';
import type { 
  CreateAmbientVideoRequest, 
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step6Data,
  Step7Data,
  TimelineSceneItem,
  TimelineShotItem,
  AudioTrackItem,
  VolumeSettings,
  MoodDescriptionGeneratorInput,
  SceneGeneratorInput,
  VideoPromptEngineerInput,
  VoiceoverScriptGeneratorInput,
  VoiceoverAudioGeneratorInput,
  SoundEffectPromptGeneratorInput,
  SoundEffectGeneratorInput,
  Scene,
  Shot,
  ShotVersion,
  ContinuityGroup
} from '../types';

// Import shared utilities
import { upload, audioUpload, tempUploads, getTempUpload, deleteTempUpload, TempUpload } from './shared';
// Re-export for external use
export { getTempUpload, deleteTempUpload };

// Import modular routers
import imageGenerationRouter from './image-generation';
import videoGenerationRouter from './video-generation';
import previewRenderRouter from './preview-render';
import musicGenerationRouter from './music-generation';

const router = Router();

// Mount modular routers
router.use(imageGenerationRouter);
router.use(musicGenerationRouter);
router.use(videoGenerationRouter);
router.use(previewRenderRouter);

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
// CUSTOM BACKGROUND MUSIC UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/custom-music/upload
 * Upload custom background music to Bunny CDN
 * 
 * Returns the CDN URL and duration of the uploaded audio file.
 */
router.post('/videos/:id/custom-music/upload', isAuthenticated, audioUpload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Get video to extract title and createdAt for path construction
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get workspace info
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
    const workspaceName = currentWorkspace?.name || 'default';

    // Build Bunny CDN path with video creation date (consistent with voiceover and SFX)
    const videoTitle = video.title || 'untitled';
    const truncatedTitle = videoTitle.slice(0, 50).replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateLabel = video.createdAt
      ? new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop() || 'mp3';
    const filename = `custom_music_${timestamp}.${ext}`;

    const bunnyPath = buildVideoModePath({
      userId,
      workspaceName,
      toolMode: "ambient",
      projectName: truncatedTitle,
      subFolder: "Background-Music",
      filename,
      dateLabel,
    });

    console.log('[ambient-visual:routes] Uploading custom music to CDN:', {
      videoId,
      filename: file.originalname,
      size: `${(file.buffer.length / 1024 / 1024).toFixed(2)}MB`,
      bunnyPath,
    });

    // Upload to Bunny CDN
    const cdnUrl = await bunnyStorage.uploadFile(
      bunnyPath,
      file.buffer,
      file.mimetype
    );

    // Get audio duration using a simple estimation based on file size
    // For more accurate duration, we'd need to parse the audio file
    // A rough estimate: MP3 at 128kbps = ~1MB per minute
    const estimatedDurationSeconds = Math.round((file.buffer.length / 1024 / 1024) * 60);

    console.log('[ambient-visual:routes] Custom music uploaded successfully:', {
      videoId,
      cdnUrl,
      estimatedDuration: estimatedDurationSeconds,
    });

    res.json({
      url: cdnUrl,
      duration: estimatedDurationSeconds,
      filename: file.originalname,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Custom music upload error:', error);
    res.status(500).json({ error: 'Failed to upload custom music' });
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
      
      // Background Music toggle (music style/url is in step2Data)
      backgroundMusicEnabled: allSettings.backgroundMusicEnabled ?? false,
      
      // Voiceover
      voiceoverEnabled: allSettings.voiceoverEnabled,
      voiceoverStory: allSettings.voiceoverStory,
      voiceId: allSettings.voiceId,
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
      userPrompt: allSettings.userStory || undefined,
    };

    // Step 3: Generate mood description using AI
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateMoodDescription(aiInput, userId, workspaceId, 'video', 'ambient');

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
      
      // Background Music toggle (music style/url is in step2Data)
      backgroundMusicEnabled: allSettings.backgroundMusicEnabled ?? false,
      
      // Voiceover
      voiceoverEnabled: allSettings.voiceoverEnabled,
      voiceoverStory: allSettings.voiceoverStory,
      voiceId: allSettings.voiceId,
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
      // Background Music settings
      musicStyle: allSettings.musicStyle,
      customMusicUrl: allSettings.customMusicUrl,
      customMusicDuration: allSettings.customMusicDuration,
      hasCustomMusic: allSettings.hasCustomMusic ?? false,
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
      workspaceId,
      'video',
      'ambient'
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
        videoModel: step1Data.videoModel,
      },
      userId,
      workspaceId,
      'video',
      'ambient'
    );

    console.log('[ambient-visual:routes] Shots composed:', {
      totalShots: Object.values(shotResult.shots).flat().length,
    });

    // Continuity will be generated manually by user via /flow-design/continuity
    // User must click "Analyze All Shots for Continuity" button after reviewing scenes/shots
    const continuityGroups: Record<string, ContinuityGroup[]> = {};

    // Step 5: Create initial shot versions (empty, for tracking)
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

    // Step 6: Build step3Data and save to database
    const step3Data: Step3Data = {
      scenes: sceneResult.scenes,
      shots: shotResult.shots,
      shotVersions,
      continuityLocked: false,
      continuityGroups: {},  // Empty initially - user generates manually via button
      continuityGenerated: false,  // User must click "Analyze All Shots for Continuity"
    };

    await storage.updateVideo(videoId, { 
      step3Data,
      currentStep: 3,
    });

    // Calculate total cost
    const totalCost = (sceneResult.cost || 0) + shotResult.totalCost;

    console.log('[ambient-visual:routes] Flow design generated and saved:', {
      videoId,
      sceneCount: sceneResult.scenes.length,
      totalShots: Object.values(shotResult.shots).flat().length,
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
 * POST /api/ambient-visual/flow-design/continuity
 * Generate continuity proposals for existing scenes/shots
 * 
 * Called when user clicks "Generate Continuity Proposal" button in Flow Design phase
 * This regenerates continuity proposals without regenerating scenes/shots
 */
router.post('/flow-design/continuity', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[ambient-visual:routes] Generating continuity proposals:', { videoId });

    // Get current video with step3Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step3Data = video.step3Data as Step3Data | null;
    if (!step3Data || !step3Data.scenes || !step3Data.shots) {
      return res.status(400).json({ 
        error: 'No scenes/shots found. Generate flow design first.' 
      });
    }

    const { scenes, shots } = step3Data;

    // Import continuity producer
    const { proposeContinuity } = await import('../agents/continuity-producer');

    // Generate continuity proposals
    const continuityResult = await proposeContinuity(
      { scenes, shots },
      userId,
      video.workspaceId,
      'video',
      'ambient'
    );

    console.log('[ambient-visual:routes] Continuity proposals generated:', {
      videoId,
      groupCount: Object.values(continuityResult.continuityGroups).flat().length,
      cost: continuityResult.cost,
    });

    // Update step3Data with new continuity groups and mark as generated (one-time only)
    const updatedStep3Data: Step3Data = {
      ...step3Data,
      continuityGroups: continuityResult.continuityGroups,
      continuityGenerated: true,  // Mark as generated - button will be disabled after this
    };

    await storage.updateVideo(videoId, { step3Data: updatedStep3Data });

    res.json({
      continuityGroups: continuityResult.continuityGroups,
      cost: continuityResult.cost,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Continuity generation error:', error);
    res.status(500).json({ error: 'Failed to generate continuity proposals' });
  }
});

/**
 * PATCH /api/ambient-visual/videos/:id/continuity/lock
 * Lock continuity and save approved groups to database
 * 
 * Called when user clicks "Lock" button in Flow Design phase
 * - Saves the approved continuity groups
 * - Sets continuityLocked to true
 */
router.patch('/videos/:id/continuity/lock', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { continuityGroups } = req.body;

    console.log('[ambient-visual:routes] Locking continuity:', {
      videoId: id,
      groupCount: continuityGroups ? Object.values(continuityGroups).flat().length : 0,
    });

    // Get current video
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const currentStep3Data = video.step3Data as Step3Data | null;
    if (!currentStep3Data) {
      return res.status(400).json({ error: 'No flow design data found' });
    }

    // Update step3Data with locked continuity groups
    const updatedStep3Data: Step3Data = {
      ...currentStep3Data,
      continuityLocked: true,
      continuityGroups: continuityGroups as Record<string, ContinuityGroup[]> || {},
    };

    await storage.updateVideo(id, { step3Data: updatedStep3Data });

    console.log('[ambient-visual:routes] Continuity locked and saved:', {
      videoId: id,
      continuityLocked: true,
      groupCount: Object.values(continuityGroups || {}).flat().length,
    });

    res.json({ success: true, continuityLocked: true });
  } catch (error) {
    console.error('[ambient-visual:routes] Continuity lock error:', error);
    res.status(500).json({ error: 'Failed to lock continuity' });
  }
});

/**
 * PATCH /api/ambient-visual/videos/:id/step/3/continue
 * Save flow design and mark step as complete
 * 
 * Called when user clicks Continue to move to Composition phase
 * - Saves ALL flow design data (scenes, shots, continuity groups)
 * - Keeps currentStep = 3 (doesn't advance yet - auto-generation will advance)
 * - Adds 3 to completedSteps array
 * 
 * NOTE: Frontend will navigate to step 4 and trigger auto-generation.
 * Step 4 will be activated after prompts are generated via generate-all-prompts endpoint.
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

    // Update video: save settings, mark step 3 complete, but keep currentStep = 3
    // Step 4 will be activated after generate-all-prompts completes
    const updated = await storage.updateVideo(id, {
      step3Data,
      currentStep: 3,  // Keep at step 3 (auto-generation will advance to 4)
      completedSteps,
    });

    console.log('[ambient-visual:routes] Flow design step completed:', {
      videoId: id,
      currentStep: 3,  // Still 3, will become 4 after prompt generation
      completedSteps,
      sceneCount: scenes.length,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step completion error:', error);
    res.status(500).json({ error: 'Failed to complete flow design step' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: COMPOSITION - AUTO-GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/generate-all-prompts
 * Auto-generate prompts for ALL shots when entering Phase 4
 * 
 * Called automatically by frontend after Phase 3 continue
 * - Loops through all shots from step3Data
 * - Calls Agent 4.1 (Video Prompt Engineer) for each shot
 * - Saves all prompts to step4Data
 * - Returns summary with counts and total cost
 */
router.post('/videos/:id/generate-all-prompts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    console.log('[ambient-visual:routes] Auto-generating prompts for all shots:', { videoId });

    // 1. Fetch video with all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step2Data = video.step2Data as Step2Data;
    const step3Data = video.step3Data as Step3Data;
    const existingStep4Data = video.step4Data as Step4Data | undefined;

    if (!step1Data) {
      return res.status(400).json({ error: 'No atmosphere data found. Complete Phase 1 first.' });
    }

    if (!step2Data) {
      return res.status(400).json({ error: 'No visual world data found. Complete Phase 2 first.' });
    }

    if (!step3Data?.shots || !step3Data?.scenes) {
      return res.status(400).json({ error: 'No shots found. Complete flow design first.' });
    }

    // 2. Check if prompts already exist - if so, preserve everything and skip generation
    const existingShotVersions = existingStep4Data?.shotVersions;
    const hasExistingPrompts = existingShotVersions && Object.keys(existingShotVersions).length > 0;
    
    if (hasExistingPrompts) {
      // Prompts already exist - preserve all existing step4Data (including user-edited scenes/shots)
      console.log('[ambient-visual:routes] Prompts already exist, preserving existing step4Data');
      
      // CRITICAL: Strip audio fields from existing step4Data.shots if they exist
      const cleanedExistingShots = existingStep4Data.shots ? Object.fromEntries(
        Object.entries(existingStep4Data.shots).map(([sceneId, sceneShots]) => [
          sceneId,
          (sceneShots as any[]).map(({ soundEffectUrl, soundEffectDescription, ...shot }) => shot)
        ])
      ) : undefined;
      
      const preservedStep4Data: Step4Data = {
        shotVersions: existingShotVersions,
        scenes: existingStep4Data.scenes || step3Data.scenes.map(scene => ({
          ...scene,
          imageModel: scene.imageModel || step1Data.imageModel,
          videoModel: scene.videoModel || step1Data.videoModel,
        })),
        shots: cleanedExistingShots || Object.fromEntries(
          Object.entries(step3Data.shots).map(([sceneId, sceneShots]) => [
            sceneId,
            sceneShots.map(shot => ({
              ...shot,
              imageModel: shot.imageModel || null,
              videoModel: shot.videoModel || null,
            }))
          ])
        ),
      };
      
      // Save to ensure scenes/shots are preserved even if they weren't in existingStep4Data
      await storage.updateVideo(videoId, { step4Data: preservedStep4Data });
      
      return res.json({
        success: true,
        promptsGenerated: 0,
        failedShots: [],
        totalCost: 0,
        message: 'Prompts already exist, skipped generation',
      });
    }

    // 3. Initialize step4Data - preserve existing scenes/shots if they exist (user edits), otherwise initialize from step3Data
    let scenes: Scene[];
    let shots: Record<string, Shot[]>;
    
    if (existingStep4Data?.scenes && existingStep4Data?.shots) {
      // Preserve existing scenes and shots (they may have user-edited model settings)
      console.log('[ambient-visual:routes] Preserving existing step4Data scenes and shots with user edits');
      scenes = existingStep4Data.scenes;
      shots = existingStep4Data.shots;
    } else {
      // Initialize from step3Data with defaults from step1Data
      console.log('[ambient-visual:routes] Initializing step4Data scenes and shots from step3Data');
      scenes = step3Data.scenes.map(scene => ({
        ...scene,
        imageModel: scene.imageModel || step1Data.imageModel,
        videoModel: scene.videoModel || step1Data.videoModel,
      }));
      shots = Object.fromEntries(
        Object.entries(step3Data.shots).map(([sceneId, sceneShots]) => [
          sceneId,
          sceneShots.map(shot => ({
            ...shot,
            imageModel: shot.imageModel || null,  // null = inherit from scene
            videoModel: shot.videoModel || null,  // null = inherit from scene
          }))
        ])
      );
    }

    const step4Data: Step4Data = {
      shotVersions: existingShotVersions || {},
      scenes,
      shots,
    };

    let totalCost = 0;
    let successCount = 0;
    const failedShots: string[] = [];

    // 4. Build continuity group lookup map for Start-End Frame mode
    // Maps shotId -> { groupId, isFirst, previousShotId }
    // NOTE: A shot can appear in multiple overlapping groups (e.g., Shot 2 in [1,2] and [2,3])
    // When a shot appears in multiple groups, we prioritize the case where it INHERITS
    // (i.e., not first in a group) because that's the one that matters for frame inheritance
    const shotContinuityInfo: Map<string, { 
      groupId: string; 
      isFirst: boolean; 
      previousShotId: string | null;
    }> = new Map();

    if (step1Data.videoGenerationMode === 'start-end-frame' && step3Data.continuityGroups) {
      for (const groups of Object.values(step3Data.continuityGroups)) {
        for (const group of groups) {
          // Only process approved groups
          if (group.status !== 'approved') continue;
          
          for (let i = 0; i < group.shotIds.length; i++) {
            const shotId = group.shotIds[i];
            const isFirstInThisGroup = i === 0;
            const previousShotIdInThisGroup = i > 0 ? group.shotIds[i - 1] : null;
            
            // Check if this shot already has continuity info
            const existing = shotContinuityInfo.get(shotId);
            
            if (!existing) {
              // First time seeing this shot - add it
              shotContinuityInfo.set(shotId, {
                groupId: group.id,
                isFirst: isFirstInThisGroup,
                previousShotId: previousShotIdInThisGroup,
              });
            } else if (existing.isFirst && !isFirstInThisGroup) {
              // Shot already exists as "first" in another group, but in THIS group it inherits
              // Prioritize inheritance - update to this group's info
              shotContinuityInfo.set(shotId, {
                groupId: group.id,
                isFirst: false,
                previousShotId: previousShotIdInThisGroup,
              });
              console.log(`[ambient-visual:routes] Shot ${shotId} appears in overlapping groups - prioritizing inheritance from ${previousShotIdInThisGroup}`);
            }
            // If existing.isFirst is false, keep it (already inheriting from another group)
          }
        }
      }
    }

    console.log('[ambient-visual:routes] Continuity info built:', {
      totalConnectedShots: shotContinuityInfo.size,
      groups: Array.from(shotContinuityInfo.entries()).map(([id, info]) => ({ 
        shotId: id, 
        ...info 
      })),
    });

    // 5. Track generated endFramePrompts for inheritance
    const generatedEndFramePrompts: Map<string, string> = new Map();

    // 6. Loop through all shots
    for (const [sceneId, sceneShots] of Object.entries(step3Data.shots)) {
      const scene = step3Data.scenes.find(s => s.id === sceneId);
      if (!scene) {
        console.warn(`[ambient-visual:routes] Scene not found for sceneId: ${sceneId}`);
        continue;
      }

      for (const shot of sceneShots) {
        try {
          // Check continuity status
          const continuityInfo = shotContinuityInfo.get(shot.id);
          const isConnectedShot = !!continuityInfo;
          const isFirstInGroup = continuityInfo?.isFirst ?? false;
          const previousShotId = continuityInfo?.previousShotId ?? null;

          // Get previous shot's end frame prompt for inheritance
          let previousShotEndFramePrompt: string | undefined;
          if (isConnectedShot && !isFirstInGroup && previousShotId) {
            previousShotEndFramePrompt = generatedEndFramePrompts.get(previousShotId);
            console.log(`[ambient-visual:routes] Shot ${shot.id} inheriting from ${previousShotId}:`, {
              hasPreviousEndFrame: !!previousShotEndFramePrompt,
              promptLength: previousShotEndFramePrompt?.length || 0,
            });
          }

          // Build input for Agent 4.1
          const input: VideoPromptEngineerInput = {
            shotId: shot.id,
            shotDescription: shot.description || '',
            shotType: shot.shotType,
            cameraMovement: shot.cameraMovement,
            shotDuration: shot.duration,
            sceneId,
            sceneTitle: scene.title,
            sceneDescription: scene.description || '',
            moodDescription: step1Data.moodDescription,
            mood: step1Data.mood,
            theme: step1Data.theme,
            timeContext: step1Data.timeContext,
            season: step1Data.season,
            aspectRatio: step1Data.aspectRatio,
            artStyle: step2Data.artStyle,
            visualElements: step2Data.visualElements,
            visualRhythm: step2Data.visualRhythm,
            referenceImageUrls: step2Data.referenceImages,
            imageCustomInstructions: step2Data.imageCustomInstructions,
            animationMode: step1Data.animationMode,  // Use actual animation mode
            videoGenerationMode: step1Data.videoGenerationMode,
            motionPrompt: step1Data.motionPrompt,
            isFirstInGroup,
            isConnectedShot,
            previousShotEndFramePrompt,  // Pass to AI for context (video-animation only)
          };

          // Call Agent 4.1
          const result = await generateVideoPrompts(input, userId, video.workspaceId, 'video', 'ambient');

          // Create version based on animation mode
          const versionId = `version-${Date.now()}-${shot.id.slice(-8)}`;
          const isImageTransitions = step1Data.animationMode === 'image-transitions';
          const isImageReference = step1Data.animationMode === 'video-animation' && 
                                   step1Data.videoGenerationMode === 'image-reference';
          const isStartEndFrame = step1Data.animationMode === 'video-animation' && 
                                  step1Data.videoGenerationMode === 'start-end-frame';
          
          let shotVersion: ShotVersion;
          
          if (isImageTransitions) {
            // Image Transitions mode: only imagePrompt
            shotVersion = {
              id: versionId,
              shotId: shot.id,
              versionNumber: 1,
              imagePrompt: result.imagePrompt,
              status: 'prompt_generated',
              needsRerender: false,
              createdAt: new Date(),
            };
          } else if (isImageReference) {
            // Image-Reference mode: startFramePrompt + videoPrompt only (no endFramePrompt)
            shotVersion = {
              id: versionId,
              shotId: shot.id,
              versionNumber: 1,
              startFramePrompt: result.startFramePrompt,
              videoPrompt: result.videoPrompt,
              // No endFramePrompt for image-reference mode
              status: 'prompt_generated',
              needsRerender: false,
              createdAt: new Date(),
            };
          } else if (isStartEndFrame) {
            // Start-End Frame mode: startFramePrompt, endFramePrompt, videoPrompt
            // For connected shots (not first): Agent 4.1 generates endFramePrompt + videoPrompt (start is inherited)
            // Store end frame prompt for potential inheritance by next shot
            if (result.endFramePrompt) {
              generatedEndFramePrompts.set(shot.id, result.endFramePrompt);
            }

            // Determine the actual startFramePrompt to use
            // For connected shots (not first): inherit from previous shot's endFramePrompt
            const startFrameInherited = isConnectedShot && !isFirstInGroup && !!previousShotEndFramePrompt;
            const actualStartFramePrompt = startFrameInherited
              ? previousShotEndFramePrompt
              : result.startFramePrompt;

            shotVersion = {
              id: versionId,
              shotId: shot.id,
              versionNumber: 1,
              startFramePrompt: actualStartFramePrompt,  // Use inherited or generated
              endFramePrompt: result.endFramePrompt,
              videoPrompt: result.videoPrompt,  // Always generated (even for connected shots)
              startFrameInherited,  // Mark if inherited
              status: 'prompt_generated',
              needsRerender: false,
              createdAt: new Date(),
            };
          } else {
            // Fallback: should not happen, but handle gracefully
            console.warn(`[ambient-visual:routes] Unknown mode combination for shot ${shot.id}:`, {
              animationMode: step1Data.animationMode,
              videoGenerationMode: step1Data.videoGenerationMode,
            });
            shotVersion = {
              id: versionId,
              shotId: shot.id,
              versionNumber: 1,
              status: 'prompt_generated',
              needsRerender: false,
              createdAt: new Date(),
            };
          }

          step4Data.shotVersions[shot.id] = [shotVersion];
          
          if (result.cost) {
            totalCost += result.cost;
          }
          successCount++;

          console.log(`[ambient-visual:routes] Generated prompt for shot ${shot.id}:`, {
            shotNumber: shot.shotNumber,
            sceneTitle: scene.title,
            animationMode: step1Data.animationMode,
            videoGenerationMode: step1Data.videoGenerationMode,
            isImageReference,
            isConnectedShot: isImageTransitions ? 'N/A' : isConnectedShot,
            isFirstInGroup: isImageTransitions ? 'N/A' : isFirstInGroup,
            startFrameInherited: isImageTransitions || isImageReference ? 'N/A' : shotVersion.startFrameInherited,
            generatedFields: isImageTransitions ? 'imagePrompt' : 
                           (isImageReference ? 'startFramePrompt + videoPrompt' :
                           (isConnectedShot && !isFirstInGroup ? 'endFramePrompt + videoPrompt' : 'all 3')),
            cost: result.cost,
          });

        } catch (error) {
          console.error(`[ambient-visual:routes] Failed to generate prompt for shot ${shot.id}:`, error);
          failedShots.push(shot.id);
        }
      }
    }

    // 7. Update shots with currentVersionId in step3Data
    const updatedShots: Record<string, Shot[]> = {};
    for (const [sceneId, sceneShots] of Object.entries(step3Data.shots)) {
      updatedShots[sceneId] = sceneShots.map(shot => {
        const versions = step4Data.shotVersions[shot.id];
        if (versions && versions.length > 0) {
          return { ...shot, currentVersionId: versions[versions.length - 1].id };
        }
        return shot;
      });
    }
    
    const updatedStep3Data: Step3Data = {
      ...step3Data,
      shots: updatedShots,
    };

    // 8. Save all data to database
    await storage.updateVideo(videoId, { 
      step3Data: updatedStep3Data,
      step4Data 
    });

    console.log('[ambient-visual:routes] All prompts generated:', {
      videoId,
      successCount,
      failedCount: failedShots.length,
      totalCost,
    });

    res.json({
      success: true,
      promptsGenerated: successCount,
      failedShots,
      totalCost,
    });

  } catch (error) {
    console.error('[ambient-visual:routes] Batch prompt generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ambient-visual/videos/:id/generate-all-images
 * Generate keyframe images for ALL shots (Agent 4.2)
 * 
 * This endpoint handles batch image generation with continuity inheritance.
 * Shots are processed IN ORDER to support the inheritance chain.
 * 
 * Flow:
 * 1. Fetch prompts from step4Data.shotVersions
 * 2. Build continuity info map (which shots inherit from which)
 * 3. Process shots sequentially for continuity support
 * 4. Generate images using Runware API
 * 5. Store image URLs directly in step4Data (no Bunny CDN upload)
 */
router.post('/videos/:id/generate-all-images', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    console.log('[ambient-visual:routes] Starting batch image generation:', { videoId });

    // 1. Fetch video with all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;

    if (!step1Data) {
      return res.status(400).json({ error: 'No atmosphere data found. Complete Phase 1 first.' });
    }

    if (!step4Data?.shotVersions || Object.keys(step4Data.shotVersions).length === 0) {
      return res.status(400).json({ error: 'No prompts found. Generate prompts first.' });
    }

    // Use step4Data.scenes/shots if available (with models), fallback to step3Data
    const step4Scenes = step4Data.scenes || step3Data?.scenes || [];
    const step4Shots = step4Data.shots || step3Data?.shots || {};

    if (Object.keys(step4Shots).length === 0) {
      return res.status(400).json({ error: 'No shots found. Complete flow design first.' });
    }

    // 2. Build shot list with prompts for batch generation
    const shots: Array<{
      shotId: string;
      shotNumber: number;
      sceneId: string;
      versionId: string;
      imageModel: string;  // Per-shot model from step4Data
      imagePrompt?: string;
      startFramePrompt?: string;
      endFramePrompt?: string;
      groupId?: string;
      isFirstInGroup?: boolean;
      previousShotId?: string;
      existingStartFrameUrl?: string;
      existingEndFrameUrl?: string;
    }> = [];

    // Create versionId map for result merging
    const versionIdMap = new Map<string, string>();
    
    // Track skipped shots
    let skippedCount = 0;

    // Process all scenes/shots from step4Data (with models)
    for (const [sceneId, sceneShots] of Object.entries(step4Shots)) {
      const scene = step4Scenes.find(s => s.id === sceneId);
      
      for (const shot of sceneShots) {
        const versions = step4Data.shotVersions[shot.id];
        if (!versions || versions.length === 0) {
          console.warn(`[ambient-visual:routes] No versions found for shot ${shot.id}, skipping`);
          continue;
        }

        const latestVersion = versions[versions.length - 1];
        
        // Check if shot needs image generation (smart partial generation)
        const isImageTransitionsMode = step1Data.animationMode === 'image-transitions';
        const isImageReferenceMode = step1Data.animationMode === 'video-animation' && 
                                     step1Data.videoGenerationMode === 'image-reference';
        const isStartEndFrameMode = step1Data.animationMode === 'video-animation' && 
                                   step1Data.videoGenerationMode === 'start-end-frame';
        
        let needsImageGeneration: boolean;
        if (isImageTransitionsMode) {
          // Image transitions mode: needs imageUrl
          needsImageGeneration = !latestVersion.imageUrl;
        } else if (isImageReferenceMode) {
          // Image-reference mode: only needs startFrameUrl (no end frame)
          needsImageGeneration = !latestVersion.startFrameUrl;
        } else if (isStartEndFrameMode) {
          // Start-end frame mode: needs both startFrameUrl and endFrameUrl
          needsImageGeneration = !latestVersion.startFrameUrl || !latestVersion.endFrameUrl;
        } else {
          // Fallback: check for startFrameUrl (shouldn't happen with proper mode)
          needsImageGeneration = !latestVersion.startFrameUrl;
        }
        
        if (!needsImageGeneration) {
          console.log(`[ambient-visual:routes] Skipping shot ${shot.id} - all required images already exist`);
          skippedCount++;
          continue;
        }
        
        // Log what needs to be generated
        if (!isImageTransitionsMode) {
          const missingFrames = [];
          if (!latestVersion.startFrameUrl) missingFrames.push('start');
          if (!latestVersion.endFrameUrl) missingFrames.push('end');
          console.log(`[ambient-visual:routes] Shot ${shot.id} missing frames: ${missingFrames.join(', ')}`);
        }
        
        versionIdMap.set(shot.id, latestVersion.id);

        // Determine image model: shot → scene → step1Data (fallback)
        const imageModel = shot.imageModel || scene?.imageModel || step1Data.imageModel;

        shots.push({
          shotId: shot.id,
          shotNumber: shot.shotNumber,
          sceneId,
          versionId: latestVersion.id,
          imageModel,
          imagePrompt: latestVersion.imagePrompt || undefined,
          startFramePrompt: latestVersion.startFramePrompt || undefined,
          endFramePrompt: latestVersion.endFramePrompt || undefined,
          // NEW: Pass existing frame URLs so agent can skip regeneration
          existingStartFrameUrl: latestVersion.startFrameUrl || undefined,
          existingEndFrameUrl: latestVersion.endFrameUrl || undefined,
        });
      }
    }
    
    // If all shots have images, return early
    if (shots.length === 0) {
      console.log('[ambient-visual:routes] All shots already have images, nothing to generate');
      return res.json({
        success: true,
        imagesGenerated: 0,
        skippedShots: skippedCount,
        failedShots: 0,
        totalCost: 0,
        message: 'All shots already have images generated',
      });
    }

    // 3. Extract approved continuity groups
    const allContinuityGroups: ContinuityGroup[] = [];
    if (step3Data?.continuityGroups) {
      for (const groups of Object.values(step3Data.continuityGroups)) {
        allContinuityGroups.push(...groups.filter(g => g.status === 'approved'));
      }
    }

    console.log('[ambient-visual:routes] Batch generation input:', {
      shotCount: shots.length,
      skippedCount,
      continuityGroupCount: allContinuityGroups.length,
      animationMode: step1Data.animationMode,
      defaultImageModel: step1Data.imageModel,
      usingPerShotModels: true,
    });

    // 4. Call batch generation (uses per-shot imageModel from shots array)
    const batchResult = await generateAllShotImages(
      {
        videoId,
        imageModel: step1Data.imageModel,  // Default fallback
        aspectRatio: step1Data.aspectRatio,
        imageResolution: step1Data.imageResolution,
        animationMode: step1Data.animationMode,
        videoGenerationMode: step1Data.videoGenerationMode,
        shots,
        continuityGroups: allContinuityGroups,
      },
      userId,
      video.workspaceId,
      'video',
      'ambient'
    );

    // 5. Merge results back into step4Data
    const updatedShotVersions = mergeResultsIntoShotVersions(
      step4Data.shotVersions as Record<string, Array<any>>,
      batchResult.results,
      versionIdMap
    );

    const updatedStep4Data: Step4Data = {
      ...step4Data,
      shotVersions: updatedShotVersions,
    };

    // 6. Save updated data
    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[ambient-visual:routes] Batch image generation complete:', {
      videoId,
      successCount: batchResult.successCount,
      failureCount: batchResult.failureCount,
      totalCost: batchResult.totalCost,
    });

    res.json({
      success: true,
      imagesGenerated: batchResult.successCount,
      skippedShots: skippedCount,
      failedShots: batchResult.failureCount,
      totalCost: batchResult.totalCost,
      results: batchResult.results.map(r => ({
        shotId: r.shotId,
        hasImage: !!r.imageUrl,
        hasStartFrame: !!r.startFrameUrl,
        hasEndFrame: !!r.endFrameUrl,
        startFrameInherited: r.startFrameInherited,
        error: r.error,
      })),
    });

  } catch (error) {
    console.error('[ambient-visual:routes] Batch image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// NOTE: Single shot image generation routes have been moved to ./image-generation.ts
// The following routes are now handled by the imageGenerationRouter:
// - POST /videos/:id/shots/:shotId/generate-image
// - POST /videos/:id/shots/:shotId/regenerate-image

/**
 * PATCH /api/ambient-visual/videos/:id/step/4/continue
 * Activate Phase 4 (Composition) after prompts are generated
 * 
 * Called after generate-all-prompts completes successfully
 * - Updates currentStep to 4
 * - Adds 4 to completedSteps (marks Phase 4 as entered)
 */
router.patch('/videos/:id/step/4/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    console.log('[ambient-visual:routes] Activating Phase 4:', { videoId: id });

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify step4Data exists (prompts were generated)
    const step4Data = video.step4Data as Step4Data;
    if (!step4Data || !step4Data.shotVersions || Object.keys(step4Data.shotVersions).length === 0) {
      return res.status(400).json({ 
        error: 'No prompts found. Generate prompts first via /generate-all-prompts.' 
      });
    }

    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    // Add step 4 if not already completed
    if (!completedSteps.includes(4)) {
      completedSteps.push(4);
    }

    const updated = await storage.updateVideo(id, {
      currentStep: 4,
      completedSteps,
    });

    console.log('[ambient-visual:routes] Phase 4 activated:', {
      videoId: id,
      currentStep: 4,
      completedSteps,
      shotVersionsCount: Object.keys(step4Data.shotVersions).length,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step 4 activation error:', error);
    res.status(500).json({ error: 'Failed to activate Phase 4' });
  }
});

/**
 * Helper function to calculate loop count based on settings
 * @param enabled - Whether looping is enabled
 * @param countSetting - 'auto' or a specific number
 * @returns The loop count (1 if disabled, random 2-10 for auto, or the specified number)
 */
function calculateLoopCount(enabled: boolean, countSetting: 'auto' | number): number {
  if (!enabled) {
    return 1; // No looping
  }
  if (countSetting === 'auto') {
    // Random number between 2 and 10 (inclusive)
    return Math.floor(Math.random() * 9) + 2;
  }
  return countSetting;
}

/**
 * PATCH /api/ambient-visual/videos/:id/step/4/continue-to-5
 * Continue from Composition (Step 4) to Soundscape (Step 5)
 * 
 * Called when user clicks Continue after all videos are generated
 * - Updates currentStep to 5
 * - Adds 4 to completedSteps array
 * - Initializes loop counts for scenes and shots based on Step1Data settings
 */
router.patch('/videos/:id/step/4/continue-to-5', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    console.log('[ambient-visual:routes] Continuing from Step 4 to Step 5:', { videoId: id });

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify all videos/images are generated (depends on animation mode)
    const step4Data = video.step4Data as Step4Data;
    if (!step4Data || !step4Data.shotVersions) {
      return res.status(400).json({ 
        error: 'No step 4 data found.' 
      });
    }

    // Check if all shots have required media based on animation mode
    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    if (!step3Data || !step3Data.shots) {
      return res.status(400).json({ 
        error: 'No shots found in step 3 data.' 
      });
    }

    const isImageTransitionsMode = step1Data?.animationMode === 'image-transitions';
    const allShots = Object.values(step3Data.shots).flat();
    
    if (isImageTransitionsMode) {
      // IMAGE-TRANSITIONS MODE: Check all shots have images
      const shotsWithoutImage = allShots.filter(shot => {
        const versions = step4Data.shotVersions[shot.id] || [];
        const latestVersion = versions[versions.length - 1];
        const hasImage = latestVersion?.imageUrl && 
                         typeof latestVersion.imageUrl === 'string' && 
                         latestVersion.imageUrl.trim().length > 0;
        return !hasImage;
      });

      if (shotsWithoutImage.length > 0) {
        return res.status(400).json({ 
          error: `Cannot continue: ${shotsWithoutImage.length} shot(s) still need image generation.` 
        });
      }
    } else {
      // VIDEO-ANIMATION MODE: Check all shots have videos
      const shotsWithoutVideo = allShots.filter(shot => {
        const versions = step4Data.shotVersions[shot.id] || [];
        const latestVersion = versions[versions.length - 1];
        const hasVideo = latestVersion?.videoUrl && 
                         typeof latestVersion.videoUrl === 'string' && 
                         latestVersion.videoUrl.trim().length > 0;
        return !hasVideo;
      });

      if (shotsWithoutVideo.length > 0) {
        return res.status(400).json({ 
          error: `Cannot continue: ${shotsWithoutVideo.length} shot(s) still need video generation.` 
        });
      }
    }

    // Preserve existing step5Data - ONLY initialize loop data if not already present
    const existingStep5Data = video.step5Data as Step5Data || {};
    
    // Validate existing loop data: must have scenesWithLoops with valid loopCount values
    const hasExistingLoopData = existingStep5Data.scenesWithLoops && 
                                 existingStep5Data.scenesWithLoops.length > 0 &&
                                 existingStep5Data.scenesWithLoops.every(s => typeof s.loopCount === 'number' && s.loopCount > 0) &&
                                 existingStep5Data.shotsWithLoops &&
                                 Object.keys(existingStep5Data.shotsWithLoops).length > 0 &&
                                 Object.values(existingStep5Data.shotsWithLoops).every(shots => 
                                   shots.every(s => typeof s.loopCount === 'number' && s.loopCount > 0)
                                 );
    
    console.log('[ambient-visual:routes] Step 4->5 transition - existing loop data check:', {
      hasExistingStep5Data: !!existingStep5Data,
      hasScenesWithLoops: !!existingStep5Data.scenesWithLoops,
      scenesWithLoopsLength: existingStep5Data.scenesWithLoops?.length || 0,
      hasShotsWithLoops: !!existingStep5Data.shotsWithLoops,
      shotsWithLoopsKeys: existingStep5Data.shotsWithLoops ? Object.keys(existingStep5Data.shotsWithLoops).length : 0,
      hasValidLoopData: hasExistingLoopData,
      sampleSceneLoop: existingStep5Data.scenesWithLoops?.[0]?.loopCount,
      sampleShotLoop: existingStep5Data.shotsWithLoops ? Object.values(existingStep5Data.shotsWithLoops)[0]?.[0]?.loopCount : undefined,
    });

    let scenesWithLoops: Scene[] | undefined;
    let shotsWithLoops: Record<string, Shot[]> | undefined;
    let loopSettingsLocked: boolean | undefined;

    if (hasExistingLoopData) {
      // PRESERVE existing loop data - user has already edited these values
      console.log('[ambient-visual:routes] Preserving existing step5Data loop settings:', {
        scenesCount: existingStep5Data.scenesWithLoops?.length,
        shotsCount: existingStep5Data.shotsWithLoops ? Object.keys(existingStep5Data.shotsWithLoops).length : 0,
        loopSettingsLocked: existingStep5Data.loopSettingsLocked,
      });
      scenesWithLoops = existingStep5Data.scenesWithLoops;
      shotsWithLoops = existingStep5Data.shotsWithLoops;
      loopSettingsLocked = existingStep5Data.loopSettingsLocked;
    } else {
      // FIRST TIME entering step 5 - initialize loop counts from Step1Data settings
      const step1Data = video.step1Data as Step1Data;
      
      console.log('[ambient-visual:routes] Raw step1Data from database:', {
        step1DataExists: !!step1Data,
        step1DataType: typeof step1Data,
        step1DataKeys: step1Data ? Object.keys(step1Data) : [],
        rawLoopMode: step1Data?.loopMode,
        rawSegmentLoopEnabled: step1Data?.segmentLoopEnabled,
        rawSegmentLoopCount: step1Data?.segmentLoopCount,
        rawSegmentLoopCountType: typeof step1Data?.segmentLoopCount,
        rawShotLoopEnabled: step1Data?.shotLoopEnabled,
        rawShotLoopCount: step1Data?.shotLoopCount,
        rawShotLoopCountType: typeof step1Data?.shotLoopCount,
        fullStep1Data: JSON.stringify(step1Data, null, 2),
      });
      
      // Check if loop mode is enabled in step1Data
      const loopModeEnabled = step1Data?.loopMode ?? false;
      
      // Get segment loop settings (preserve 'auto' if set, otherwise default to 1)
      const segmentLoopEnabled = loopModeEnabled && (step1Data?.segmentLoopEnabled ?? false);
      // Handle type coercion: ensure number is a number, 'auto' stays as string
      let segmentLoopCount: 'auto' | number = step1Data?.segmentLoopCount ?? 1;
      if (segmentLoopCount !== 'auto' && typeof segmentLoopCount === 'string') {
        // Try to parse string to number
        const parsed = parseInt(segmentLoopCount, 10);
        segmentLoopCount = isNaN(parsed) ? 1 : parsed;
      } else if (segmentLoopCount !== 'auto' && typeof segmentLoopCount === 'number') {
        // Ensure it's a valid positive number
        segmentLoopCount = segmentLoopCount > 0 ? segmentLoopCount : 1;
      }
      
      // Get shot loop settings (preserve 'auto' if set, otherwise default to 1)
      const shotLoopEnabled = loopModeEnabled && (step1Data?.shotLoopEnabled ?? false);
      // Handle type coercion: ensure number is a number, 'auto' stays as string
      let shotLoopCount: 'auto' | number = step1Data?.shotLoopCount ?? 1;
      if (shotLoopCount !== 'auto' && typeof shotLoopCount === 'string') {
        // Try to parse string to number
        const parsed = parseInt(shotLoopCount, 10);
        shotLoopCount = isNaN(parsed) ? 1 : parsed;
      } else if (shotLoopCount !== 'auto' && typeof shotLoopCount === 'number') {
        // Ensure it's a valid positive number
        shotLoopCount = shotLoopCount > 0 ? shotLoopCount : 1;
      }

      console.log('[ambient-visual:routes] First time step 5 - initializing loop counts from Step1Data:', {
        loopModeEnabled,
        segmentLoopEnabled,
        segmentLoopCount,
        segmentLoopCountType: typeof segmentLoopCount,
        segmentLoopCountValue: segmentLoopCount,
        shotLoopEnabled,
        shotLoopCount,
        shotLoopCountType: typeof shotLoopCount,
        shotLoopCountValue: shotLoopCount,
        step1DataKeys: Object.keys(step1Data || {}),
        step1DataLoopSettings: {
          loopMode: step1Data?.loopMode,
          segmentLoopEnabled: step1Data?.segmentLoopEnabled,
          segmentLoopCount: step1Data?.segmentLoopCount,
          shotLoopEnabled: step1Data?.shotLoopEnabled,
          shotLoopCount: step1Data?.shotLoopCount,
        },
      });

      // Initialize scenes with loop counts (exclude videoModel/imageModel - those stay in step4Data)
      const scenes = step3Data.scenes || step4Data.scenes || [];
      console.log('[ambient-visual:routes] Initializing scenes with loop counts:', {
        scenesCount: scenes.length,
        segmentLoopEnabled,
        segmentLoopCount,
        calculatedLoopCount: calculateLoopCount(segmentLoopEnabled, segmentLoopCount),
      });
      scenesWithLoops = scenes.map((scene, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { videoModel, imageModel, ...sceneWithoutModels } = scene;
        const calculatedLoop = calculateLoopCount(segmentLoopEnabled, segmentLoopCount);
        console.log(`[ambient-visual:routes] Scene ${index + 1} (${scene.id}): loopCount = ${calculatedLoop}`, {
          segmentLoopEnabled,
          segmentLoopCount,
        });
        return {
          ...sceneWithoutModels,
          loopCount: calculatedLoop,
        };
      });

      // Initialize shots with loop counts (exclude videoModel/imageModel - those stay in step4Data)
      // CRITICAL: Also strip audio fields - they don't belong in step4Data and shouldn't be copied to step5Data from there
      const shots = step3Data.shots || step4Data.shots || {};
      console.log('[ambient-visual:routes] Initializing shots with loop counts:', {
        shotsScenesCount: Object.keys(shots).length,
        totalShotsCount: Object.values(shots).flat().length,
        shotLoopEnabled,
        shotLoopCount,
        calculatedLoopCount: calculateLoopCount(shotLoopEnabled, shotLoopCount),
      });
      shotsWithLoops = {};
      for (const sceneId of Object.keys(shots)) {
        shotsWithLoops[sceneId] = shots[sceneId].map((shot, shotIndex) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { videoModel, imageModel, soundEffectUrl, soundEffectDescription, ...shotWithoutModelsAndAudio } = shot;
          const calculatedLoop = calculateLoopCount(shotLoopEnabled, shotLoopCount);
          console.log(`[ambient-visual:routes] Scene ${sceneId} Shot ${shotIndex + 1} (${shot.id}): loopCount = ${calculatedLoop}`, {
            shotLoopEnabled,
            shotLoopCount,
          });
          return {
            ...shotWithoutModelsAndAudio,
            loopCount: calculatedLoop,
          };
        });
      }

      loopSettingsLocked = false; // Default to unlocked on first entry

      console.log('[ambient-visual:routes] Initialized loop counts:', {
        scenesCount: scenesWithLoops.length,
        sceneSampleLoop: scenesWithLoops[0]?.loopCount,
        allSceneLoops: scenesWithLoops.map(s => ({ id: s.id, loopCount: s.loopCount })),
        shotsScenesCount: Object.keys(shotsWithLoops).length,
        shotSampleLoop: Object.values(shotsWithLoops)[0]?.[0]?.loopCount,
        allShotLoops: Object.entries(shotsWithLoops).map(([sceneId, shots]) => ({
          sceneId,
          shots: shots.map(s => ({ id: s.id, loopCount: s.loopCount })),
        })),
      });
    }

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    // Add step 4 if not already completed
    if (!completedSteps.includes(4)) {
      completedSteps.push(4);
    }

    // Build updated step5Data, preserving voiceover and other existing data
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      scenesWithLoops,
      shotsWithLoops,
      loopSettingsLocked,
    };

    console.log('[ambient-visual:routes] Saving step5Data to database:', {
      videoId: id,
      scenesWithLoopsCount: scenesWithLoops?.length || 0,
      scenesWithLoopsSample: scenesWithLoops?.[0] ? {
        id: scenesWithLoops[0].id,
        sceneNumber: scenesWithLoops[0].sceneNumber,
        loopCount: scenesWithLoops[0].loopCount,
        loopCountType: typeof scenesWithLoops[0].loopCount,
      } : null,
      allSceneLoops: scenesWithLoops?.map(s => ({ id: s.id, loopCount: s.loopCount })) || [],
      shotsWithLoopsScenes: shotsWithLoops ? Object.keys(shotsWithLoops) : [],
      shotsWithLoopsSample: shotsWithLoops && Object.keys(shotsWithLoops).length > 0 ? {
        sceneId: Object.keys(shotsWithLoops)[0],
        shot: shotsWithLoops[Object.keys(shotsWithLoops)[0]]?.[0] ? {
          id: shotsWithLoops[Object.keys(shotsWithLoops)[0]][0].id,
          shotNumber: shotsWithLoops[Object.keys(shotsWithLoops)[0]][0].shotNumber,
          loopCount: shotsWithLoops[Object.keys(shotsWithLoops)[0]][0].loopCount,
          loopCountType: typeof shotsWithLoops[Object.keys(shotsWithLoops)[0]][0].loopCount,
        } : null,
      } : null,
      allShotLoops: shotsWithLoops ? Object.entries(shotsWithLoops).map(([sceneId, shots]) => ({
        sceneId,
        shots: shots.map(s => ({ id: s.id, loopCount: s.loopCount })),
      })) : [],
      loopSettingsLocked,
      step5DataJSON: JSON.stringify(updatedStep5Data, null, 2),
    });

    // Update video: mark step 4 complete, move to step 5, save loop data
    const updated = await storage.updateVideo(id, {
      currentStep: 5,  // Move to Soundscape phase
      completedSteps,
      step5Data: updatedStep5Data,
    });
    
    console.log('[ambient-visual:routes] Step5Data saved successfully. Verifying saved data:', {
      savedStep5Data: updated.step5Data ? {
        scenesWithLoopsCount: (updated.step5Data as Step5Data).scenesWithLoops?.length || 0,
        scenesWithLoopsSample: (updated.step5Data as Step5Data).scenesWithLoops?.[0] ? {
          id: (updated.step5Data as Step5Data).scenesWithLoops![0].id,
          loopCount: (updated.step5Data as Step5Data).scenesWithLoops![0].loopCount,
        } : null,
        shotsWithLoopsScenes: (updated.step5Data as Step5Data).shotsWithLoops ? Object.keys((updated.step5Data as Step5Data).shotsWithLoops!) : [],
      } : null,
    });

    console.log('[ambient-visual:routes] Step 4 completed, moved to Step 5:', {
      videoId: id,
      currentStep: 5,
      completedSteps,
      totalShots: allShots.length,
      loopSettingsInitialized: true,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step 4 -> 5 transition error:', error);
    res.status(500).json({ error: 'Failed to continue to Step 5' });
  }
});

/**
 * PATCH /api/ambient-visual/videos/:id/step4/settings
 * Auto-save scene/shot model changes to step4Data
 * Called from Compose phase when user changes model settings
 */
router.patch('/videos/:id/step4/settings', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      console.log('[ambient-visual:routes] Step 4 settings auto-save FAILED: No userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videoId = req.params.id;
    const { scenes, shots } = req.body;

    console.log('[ambient-visual:routes] Step 4 settings auto-save START:', {
      videoId,
      userId,
      hasScenes: !!scenes,
      hasShots: !!shots,
    });

    const video = await storage.getVideo(videoId);
    if (!video) {
      console.log('[ambient-visual:routes] Step 4 settings auto-save FAILED: Video not found');
      return res.status(404).json({ error: 'Video not found' });
    }

    // Note: Videos are workspace-scoped, not user-scoped
    // The isAuthenticated middleware ensures the user has access to the workspace

    // Get existing step4Data
    const existingStep4Data = video.step4Data as Step4Data || { shotVersions: {} };

    // CRITICAL: Strip audio fields (soundEffectUrl, soundEffectDescription) from shots
    // Audio fields belong ONLY in step5Data, never in step4Data
    const cleanedShots = shots ? Object.fromEntries(
      Object.entries(shots).map(([sceneId, sceneShots]) => [
        sceneId,
        (sceneShots as any[]).map(({ soundEffectUrl, soundEffectDescription, ...shot }) => shot)
      ])
    ) : undefined;

    // Update scenes and shots in step4Data (preserve shotVersions)
    const updatedStep4Data: Step4Data = {
      ...existingStep4Data,
      scenes,
      shots: cleanedShots,
    };

    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[ambient-visual:routes] Step 4 settings auto-saved:', {
      videoId,
      scenesCount: scenes?.length || 0,
      shotsCount: Object.keys(shots || {}).length,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[ambient-visual:routes] Auto-save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// NOTE: Video generation routes have been moved to ./video-generation.ts
// The following routes are now handled by the videoGenerationRouter:
// - POST /videos/:id/shots/:shotId/generate-video
// - POST /videos/:id/generate-all-videos

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: SOUNDSCAPE PHASE - LOOP SETTINGS & AUTOSAVE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/ambient-visual/videos/:id/step5/settings
 * Auto-save Step 5 soundscape data (loop counts, lock state, sound effects, etc.)
 * Called from Soundscape phase when user changes loop counts or other settings
 */
router.patch('/videos/:id/step5/settings', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      console.log('[ambient-visual:routes] Step 5 settings auto-save FAILED: No userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videoId = req.params.id;
    const { 
      scenesWithLoops, 
      shotsWithLoops, 
      loopSettingsLocked,
      ambientSound,
    } = req.body;

    console.log('[ambient-visual:routes] Step 5 settings auto-save START:', {
      videoId,
      userId,
      hasScenesWithLoops: !!scenesWithLoops,
      hasShotsWithLoops: !!shotsWithLoops,
      loopSettingsLocked,
      hasAmbientSound: !!ambientSound,
    });

    const video = await storage.getVideo(videoId);
    if (!video) {
      console.log('[ambient-visual:routes] Step 5 settings auto-save FAILED: Video not found');
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get existing step5Data (preserve voiceover data)
    const existingStep5Data = video.step5Data as Step5Data || {};

    // Build updated step5Data, only updating provided fields
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
    };

    // Only update fields that were provided
    // Strip videoModel and imageModel from scenes/shots (those belong in step4Data)
    if (scenesWithLoops !== undefined) {
      updatedStep5Data.scenesWithLoops = scenesWithLoops.map((scene: Scene) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { videoModel, imageModel, ...sceneWithoutModels } = scene;
        return sceneWithoutModels;
      });
    }
    if (shotsWithLoops !== undefined) {
      const cleanedShots: Record<string, Shot[]> = {};
      for (const sceneId of Object.keys(shotsWithLoops)) {
        cleanedShots[sceneId] = shotsWithLoops[sceneId].map((shot: Shot) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { videoModel, imageModel, ...shotWithoutModels } = shot;
          return shotWithoutModels;
        });
      }
      updatedStep5Data.shotsWithLoops = cleanedShots;
    }
    if (loopSettingsLocked !== undefined) {
      updatedStep5Data.loopSettingsLocked = loopSettingsLocked;
    }
    if (ambientSound !== undefined) {
      updatedStep5Data.ambientSound = ambientSound;
    }

    await storage.updateVideo(videoId, { step5Data: updatedStep5Data });

    console.log('[ambient-visual:routes] Step 5 settings auto-saved:', {
      videoId,
      scenesCount: scenesWithLoops?.length,
      shotsSceneCount: shotsWithLoops ? Object.keys(shotsWithLoops).length : undefined,
      loopSettingsLocked,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[ambient-visual:routes] Step 5 auto-save settings error:', error);
    res.status(500).json({ error: 'Failed to save Step 5 settings' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: SOUNDSCAPE PHASE - VOICEOVER GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ambient-visual/voices
 * Get available voices for voiceover generation
 */
router.get('/voices', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const language = req.query.language as string || 'en';
    
    // Return voices filtered by language
    const voices = language === 'ar' ? AMBIENT_VOICES.ar : AMBIENT_VOICES.en;
    
    res.json({ voices });
  } catch (error) {
    console.error('[ambient-visual:routes] Voices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

/**
 * POST /api/ambient-visual/videos/:id/voiceover/generate-script
 * Generate voiceover narration script (Agent 5.1)
 */
router.post('/videos/:id/voiceover/generate-script', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;

    // Validate voiceover is enabled
    if (!step1Data?.voiceoverEnabled) {
      return res.status(400).json({ error: 'Voiceover is not enabled for this video' });
    }

    // Get voiceover story from step1Data
    const voiceoverStory = step1Data.voiceoverStory;
    if (!voiceoverStory || voiceoverStory.trim().length === 0) {
      return res.status(400).json({ error: 'Voiceover story is required. Please add a narration theme in Atmosphere settings.' });
    }

    // Get scenes and shots with loop counts from step5Data (where loops are initialized)
    // Fall back to step3Data if step5Data doesn't have the data yet
    const step5Data = video.step5Data as Step5Data || {};
    const scenesWithLoops = step5Data.scenesWithLoops || step3Data?.scenes || [];
    const shotsWithLoops = step5Data.shotsWithLoops || step3Data?.shots || {};

    if (scenesWithLoops.length === 0) {
      return res.status(400).json({ error: 'No scenes found. Complete Flow Design phase first.' });
    }

    // Calculate total duration with loop repetitions using step5Data (which has actual loopCount values)
    const totalDuration = calculateTotalDurationWithLoops(
      scenesWithLoops.map(s => ({ id: s.id, loopCount: s.loopCount ?? 1 })),
      Object.fromEntries(
        Object.entries(shotsWithLoops).map(([sceneId, shots]) => [
          sceneId,
          (shots as Shot[]).map(shot => ({ duration: shot.duration, loopCount: shot.loopCount ?? 1 }))
        ])
      )
    );

    console.log('[ambient-visual:routes] Generating voiceover script:', {
      videoId: id,
      language: step1Data.language || 'en',
      voiceoverStoryLength: voiceoverStory.length,
      totalDuration,
      scenesCount: scenesWithLoops.length,
      usingStep5Data: !!step5Data.scenesWithLoops,
    });

    // Build input for Agent 5.1
    const input: VoiceoverScriptGeneratorInput = {
      language: step1Data.language || 'en',
      voiceoverStory,
      totalDuration,
      mood: step1Data.mood,
      theme: step1Data.theme,
      moodDescription: step1Data.moodDescription,
      scenes: scenesWithLoops.map(s => ({
        sceneNumber: s.sceneNumber,
        title: s.title,
        description: s.description,
        duration: s.duration,
      })),
    };

    // Get workspace for billing context
    const workspace = await storage.getWorkspace(video.workspaceId);

    // Generate script
    const result = await generateVoiceoverScript(
      input,
      userId,
      video.workspaceId,
      'video',
      'ambient'
    );

    // Update step5Data with the generated script
    // IMPORTANT: Fetch fresh video data to avoid overwriting concurrent updates (e.g., music generation)
    const freshVideo = await storage.getVideo(id);
    const existingStep5Data = (freshVideo?.step5Data as Step5Data) || {};
    
    console.log('[ambient-visual:routes] Updating voiceover script - preserving existing step5Data:', {
      hasGeneratedMusicUrl: !!existingStep5Data.generatedMusicUrl,
      hasScenesWithLoops: !!existingStep5Data.scenesWithLoops,
      hasShotsWithLoops: !!existingStep5Data.shotsWithLoops,
    });
    
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,  // Preserve all existing fields (music, loops, etc.)
      voiceoverScript: result.script,
      voiceoverStatus: 'script_generated',
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[ambient-visual:routes] Voiceover script generated:', {
      videoId: id,
      scriptLength: result.script.length,
      estimatedDuration: result.estimatedDuration,
      cost: result.cost,
    });

    res.json({
      script: result.script,
      estimatedDuration: result.estimatedDuration,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Voiceover script generation error:', error);
    res.status(500).json({ error: 'Failed to generate voiceover script' });
  }
});

/**
 * POST /api/ambient-visual/videos/:id/voiceover/generate-audio
 * Generate voiceover audio from approved script (Agent 5.2)
 */
router.post('/videos/:id/voiceover/generate-audio', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { script } = req.body;  // Allow passing edited script
    
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step5Data = video.step5Data as Step5Data || {};

    // Validate voiceover is enabled
    if (!step1Data?.voiceoverEnabled) {
      return res.status(400).json({ error: 'Voiceover is not enabled for this video' });
    }

    // Use provided script or existing script from step5Data
    const scriptToUse = script || step5Data.voiceoverScript;
    if (!scriptToUse || scriptToUse.trim().length === 0) {
      return res.status(400).json({ error: 'No voiceover script available. Generate a script first.' });
    }

    // Get voice ID from step1Data
    const voiceId = step1Data.voiceId;
    if (!voiceId) {
      return res.status(400).json({ error: 'No voice selected. Please select a voice in Atmosphere settings.' });
    }

    // Get workspace for path building
    const workspace = await storage.getWorkspace(video.workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    console.log('[ambient-visual:routes] Generating voiceover audio:', {
      videoId: id,
      voiceId,
      language: step1Data.language || 'en',
      scriptLength: scriptToUse.length,
    });

    // Build input for Agent 5.2
    const input: VoiceoverAudioGeneratorInput = {
      script: scriptToUse,
      voiceId,
      language: step1Data.language || 'en',
      videoId: id,
      videoTitle: video.title,
      videoCreatedAt: video.createdAt,  // Use video's creation date for path
      userId,
      workspaceId: video.workspaceId,
      workspaceName: workspace.name,
    };
    
    console.log('[ambient-visual:routes] Voiceover path info:', {
      videoId: id,
      videoTitle: video.title,
      videoCreatedAt: video.createdAt,
      dateFormatted: video.createdAt 
        ? (typeof video.createdAt === 'string' 
            ? new Date(video.createdAt).toISOString().slice(0, 10)
            : video.createdAt.toISOString().slice(0, 10))
        : 'undefined',
    });

    // Generate audio
    const result = await generateVoiceoverAudio(input, 'video', 'ambient');

    // Update step5Data with the generated audio
    // IMPORTANT: Fetch fresh video data to avoid overwriting concurrent updates (e.g., music generation)
    const freshVideo = await storage.getVideo(id);
    const freshStep5Data = (freshVideo?.step5Data as Step5Data) || {};
    
    console.log('[ambient-visual:routes] Updating voiceover audio - preserving existing step5Data:', {
      hasGeneratedMusicUrl: !!freshStep5Data.generatedMusicUrl,
      hasScenesWithLoops: !!freshStep5Data.scenesWithLoops,
      hasShotsWithLoops: !!freshStep5Data.shotsWithLoops,
    });
    
    const updatedStep5Data: Step5Data = {
      ...freshStep5Data,  // Preserve all existing fields (music, loops, etc.)
      voiceoverScript: scriptToUse,  // Save the final script used
      voiceoverAudioUrl: result.audioUrl,
      voiceoverDuration: result.duration,
      voiceoverStatus: 'audio_generated',
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[ambient-visual:routes] Voiceover audio generated:', {
      videoId: id,
      audioUrl: result.audioUrl,
      duration: result.duration,
      cost: result.cost,
    });

    res.json({
      audioUrl: result.audioUrl,
      duration: result.duration,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Voiceover audio generation error:', error);
    res.status(500).json({ error: 'Failed to generate voiceover audio' });
  }
});

/**
 * PATCH /api/ambient-visual/videos/:id/voiceover/script
 * Update/save edited voiceover script
 */
router.patch('/videos/:id/voiceover/script', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { script } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script is required' });
    }

    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update step5Data with edited script
    const existingStep5Data = video.step5Data as Step5Data || {};
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      voiceoverScript: script,
      voiceoverStatus: 'script_generated',  // Reset status since script changed
      // Clear audio since script changed
      voiceoverAudioUrl: undefined,
      voiceoverDuration: undefined,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[ambient-visual:routes] Voiceover script updated:', {
      videoId: id,
      scriptLength: script.length,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[ambient-visual:routes] Voiceover script update error:', error);
    res.status(500).json({ error: 'Failed to update voiceover script' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT PROMPT RECOMMENDATION (Agent 5.3)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/shots/:shotId/sound-effect/recommend
 * Generate AI recommendation for sound effect description
 * 
 * Uses shot context (description, video prompt, scene info) and atmosphere
 * data (mood, theme) to generate contextual sound effect recommendations.
 */
router.post('/videos/:id/shots/:shotId/sound-effect/recommend', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;

    console.log('[ambient-visual:routes] Sound effect recommendation request:', { videoId, shotId });

    // Get video for Step1Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    if (!step1Data) {
      return res.status(400).json({ error: 'No atmosphere data found. Complete Atmosphere phase first.' });
    }

    // Get step3Data for scenes and shots
    const step3Data = video.step3Data as Step3Data;
    if (!step3Data?.shots) {
      return res.status(400).json({ error: 'No shots found. Complete Flow Design phase first.' });
    }

    // Find the shot across all scenes
    let targetShot: Shot | null = null;
    let targetScene: Scene | null = null;
    
    for (const sceneId of Object.keys(step3Data.shots)) {
      const shots = step3Data.shots[sceneId] as Shot[];
      const foundShot = shots.find(s => s.id === shotId);
      if (foundShot) {
        targetShot = foundShot;
        targetScene = step3Data.scenes?.find(s => s.id === sceneId) || null;
        break;
      }
    }

    if (!targetShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Get shot version for video prompt (from step4Data)
    const step4Data = video.step4Data as Step4Data;
    const shotVersions = step4Data?.shotVersions?.[shotId] || [];
    const latestVersion = shotVersions.length > 0 
      ? shotVersions[shotVersions.length - 1] 
      : null;

    // Build input for Agent 5.3
    const input: SoundEffectPromptGeneratorInput = {
      shotDescription: targetShot.description || null,
      shotType: targetShot.shotType || 'wide',
      shotDuration: targetShot.duration || 5,
      videoPrompt: latestVersion?.videoPrompt || null,
      sceneTitle: targetScene?.title || 'Untitled Scene',
      sceneDescription: targetScene?.description || null,
      mood: step1Data.mood || 'calm',
      theme: step1Data.theme || 'nature',
      moodDescription: step1Data.moodDescription || '',
    };

    console.log('[ambient-visual:routes] Generating sound effect recommendation:', {
      videoId,
      shotId,
      shotType: input.shotType,
      hasVideoPrompt: !!input.videoPrompt,
      mood: input.mood,
      theme: input.theme,
    });

    // Generate recommendation
    const result = await generateSoundEffectPrompt(
      input,
      userId,
      video.workspaceId,
      'video',
      'ambient'
    );

    console.log('[ambient-visual:routes] Sound effect recommendation generated:', {
      videoId,
      shotId,
      promptLength: result.prompt.length,
      cost: result.cost,
    });

    res.json({
      prompt: result.prompt,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Sound effect recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate sound effect recommendation' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT GENERATION (Agent 5.4)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/shots/:shotId/sound-effect/generate
 * Generate sound effect for a shot using MMAudio
 * 
 * Takes the shot's video URL and a sound effect prompt, generates audio
 * synchronized with the video using MMAudio, and uploads to CDN.
 * 
 * Request body:
 * - prompt: string (required) - Sound effect description
 * - duration?: number - Audio duration in seconds (1-30)
 * - numSteps?: number - Inference steps (1-50)
 * - cfgStrength?: number - Guidance strength (1-10)
 * - seed?: number - For reproducibility
 */
router.post('/videos/:id/shots/:shotId/sound-effect/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;
    let { prompt, duration, numSteps, cfgStrength, seed, previousSoundEffectUrl } = req.body;

    // Use default prompt if none is provided
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      prompt = "Generate a Soundeffect for The Following Video";
    }

    console.log('[ambient-visual:routes] Sound effect generation request:', { videoId, shotId, prompt: prompt?.substring(0, 50) });

    // Delete previous SFX file if it exists
    if (previousSoundEffectUrl && typeof previousSoundEffectUrl === 'string') {
      try {
        // Extract storage path from CDN URL
        // CDN URL format: https://storia.b-cdn.net/{path} or {BUNNY_CDN_URL}/{path}
        const cdnBase = process.env.BUNNY_CDN_URL || '';
        
        let storagePath = previousSoundEffectUrl;
        
        // If CDN base URL is configured, extract path relative to it
        if (cdnBase) {
          const cdnBaseClean = cdnBase.replace(/\/+$/, ''); // Remove trailing slashes
          if (previousSoundEffectUrl.startsWith(cdnBaseClean)) {
            storagePath = previousSoundEffectUrl.substring(cdnBaseClean.length);
          } else {
            // Try parsing as URL and extracting pathname
            try {
              const cdnUrl = new URL(previousSoundEffectUrl);
              storagePath = cdnUrl.pathname;
            } catch {
              // If URL parsing fails, assume it's already a path
              storagePath = previousSoundEffectUrl;
            }
          }
        } else {
          // No CDN base configured, try to extract path from URL
          try {
            const cdnUrl = new URL(previousSoundEffectUrl);
            storagePath = cdnUrl.pathname;
          } catch {
            // If URL parsing fails, assume it's already a path
            storagePath = previousSoundEffectUrl;
          }
        }
        
        // Normalize path: remove leading slashes
        storagePath = storagePath.replace(/^\/+/, '');
        
        if (storagePath) {
          console.log('[ambient-visual:routes] Deleting previous SFX file:', storagePath);
          await bunnyStorage.deleteFile(storagePath);
          console.log('[ambient-visual:routes] Previous SFX file deleted successfully');
        }
      } catch (error) {
        // Log error but don't fail the request - file might not exist or already deleted
        console.warn('[ambient-visual:routes] Failed to delete previous SFX file:', error instanceof Error ? error.message : String(error));
      }
    }

    // Get video
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get workspace for CDN path
    const workspace = await storage.getWorkspace(video.workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Get step3Data for shots
    const step3Data = video.step3Data as Step3Data;
    if (!step3Data?.shots) {
      return res.status(400).json({ error: 'No shots found. Complete Flow Design phase first.' });
    }

    // Find the shot across all scenes and capture sceneId
    let targetShot: Shot | null = null;
    let targetSceneId: string | null = null;
    
    for (const sceneId of Object.keys(step3Data.shots)) {
      const shots = step3Data.shots[sceneId] as Shot[];
      const foundShot = shots.find(s => s.id === shotId);
      if (foundShot) {
        targetShot = foundShot;
        targetSceneId = sceneId;
        break;
      }
    }

    if (!targetShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }
    
    if (!targetSceneId) {
      return res.status(400).json({ error: 'Scene ID not found for shot' });
    }

    // Get shot version for video URL (from step4Data)
    const step4Data = video.step4Data as Step4Data;
    const shotVersions = step4Data?.shotVersions?.[shotId] || [];
    const latestVersion = shotVersions.length > 0 
      ? shotVersions[shotVersions.length - 1] 
      : null;

    if (!latestVersion?.videoUrl) {
      return res.status(400).json({ error: 'No video found for this shot. Generate video first.' });
    }

    // Build input for Agent 5.4
    const input: SoundEffectGeneratorInput = {
      videoUrl: latestVersion.videoUrl,
      prompt: prompt.trim(),
      duration,
      numSteps,
      cfgStrength,
      seed,
      videoId,
      videoTitle: video.title,
      videoCreatedAt: video.createdAt,
      shotId,
      sceneId: targetSceneId,
      userId,
      workspaceId: video.workspaceId,
      workspaceName: workspace.name || 'default',
    };
    
    console.log('[ambient-visual:routes] Sound effect path info:', {
      videoId,
      videoTitle: video.title,
      videoCreatedAt: video.createdAt,
      dateFormatted: video.createdAt 
        ? (typeof video.createdAt === 'string' 
            ? new Date(video.createdAt).toISOString().slice(0, 10)
            : video.createdAt.toISOString().slice(0, 10))
        : 'undefined',
    });

    console.log('[ambient-visual:routes] Generating sound effect:', {
      videoId,
      shotId,
      videoUrl: input.videoUrl.substring(0, 50) + '...',
      prompt: input.prompt.substring(0, 100),
      duration: input.duration,
    });

    // Generate sound effect
    const result = await generateSoundEffect(input, 'video', 'ambient');

    console.log('[ambient-visual:routes] Sound effect generated:', {
      videoId,
      shotId,
      audioUrl: result.audioUrl.substring(0, 50) + '...',
      fileSize: result.fileSize,
      cost: result.cost,
    });

    // Update the shot version with the sound effect prompt
    if (latestVersion) {
      latestVersion.soundEffectPrompt = prompt.trim();
      
      // Update in storage
      await storage.updateVideo(videoId, {
        step4Data: {
          ...step4Data,
          shotVersions: {
            ...step4Data?.shotVersions,
            [shotId]: shotVersions,
          },
        },
      });
    }

    // Also update step5Data to save soundEffectUrl on the shot
    const step5Data = video.step5Data as Step5Data || {};
    const shotsWithLoops = step5Data.shotsWithLoops || {};
    
    // Initialize scene shots array if it doesn't exist
    if (!shotsWithLoops[targetSceneId]) {
      // Get shots from step3Data or step4Data as fallback
      const step3Data = video.step3Data as Step3Data;
      const fallbackShots = step3Data?.shots?.[targetSceneId] || [];
      shotsWithLoops[targetSceneId] = fallbackShots.map(shot => ({
        ...shot,
        loopCount: shot.loopCount ?? 1,
      }));
    }
    
    const sceneShots = shotsWithLoops[targetSceneId];
    const shotIndex = sceneShots.findIndex(s => s.id === shotId);
    
    if (shotIndex >= 0) {
      sceneShots[shotIndex] = {
        ...sceneShots[shotIndex],
        soundEffectUrl: result.audioUrl, // Changed from videoWithAudioUrl
        soundEffectDescription: prompt.trim(),
      };
    } else {
      // Shot not found in step5Data, add it
      sceneShots.push({
        ...targetShot,
        soundEffectUrl: result.audioUrl,
        soundEffectDescription: prompt.trim(),
        loopCount: targetShot.loopCount ?? 1,
      });
    }
    
    shotsWithLoops[targetSceneId] = sceneShots;
    
    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        shotsWithLoops,
      },
    });

    res.json({
      audioUrl: result.audioUrl,
      originalMMAudioUrl: result.originalMMAudioUrl,
      fileSize: result.fileSize,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Sound effect generation error:', error);
    res.status(500).json({ error: 'Failed to generate sound effect' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5 -> STEP 6 TRANSITION (Soundscape -> Preview)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/ambient-visual/videos/:id/step/5/continue-to-6
 * Continue from Soundscape (Step 5) to Preview (Step 6)
 * 
 * Called when user clicks Continue from Soundscape step
 * - Validates all required data exists
 * - Initializes Step6Data with timeline from scenes/shots/audio
 * - Sets currentStep to 6
 * - Marks step 5 as completed
 */
router.patch('/videos/:id/step/5/continue-to-6', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    console.log('[ambient-visual:routes] Continuing from Step 5 to Step 6:', { videoId });

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get all step data
    const step1Data = video.step1Data as Step1Data;
    const step2Data = video.step2Data as Step2Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;
    const step5Data = video.step5Data as Step5Data;

    if (!step3Data?.scenes || !step3Data?.shots) {
      return res.status(400).json({ error: 'No scenes/shots found. Complete Flow Design phase first.' });
    }

    if (!step4Data?.shotVersions) {
      return res.status(400).json({ error: 'No shot versions found. Complete Composition phase first.' });
    }

    // Use step5Data scenes/shots with loops, fallback to step3Data/step4Data
    const scenesSource = step5Data?.scenesWithLoops || step3Data.scenes;
    const shotsSource = step5Data?.shotsWithLoops || step3Data.shots;

    // Validate all shots have required media based on animation mode
    const isImageTransitionsMode = step1Data?.animationMode === 'image-transitions';
    const allShots = Object.values(shotsSource).flat();
    
    if (isImageTransitionsMode) {
      // IMAGE-TRANSITIONS MODE: Check all shots have images
      // Use imageUrl if available, fallback to startFrameUrl for backward compatibility
      const shotsWithoutImage = allShots.filter(shot => {
        const versions = step4Data.shotVersions[shot.id] || [];
        const latestVersion = versions[versions.length - 1];
        const hasImage = (latestVersion?.imageUrl || latestVersion?.startFrameUrl) && 
                         typeof (latestVersion?.imageUrl || latestVersion?.startFrameUrl) === 'string' && 
                         (latestVersion?.imageUrl || latestVersion?.startFrameUrl)!.trim().length > 0;
        return !hasImage;
      });

      if (shotsWithoutImage.length > 0) {
        return res.status(400).json({
          error: `Cannot continue: ${shotsWithoutImage.length} shot(s) still need image generation.`,
        });
      }
    } else {
      // VIDEO-ANIMATION MODE: Check all shots have videos
      const shotsWithoutVideo = allShots.filter(shot => {
        const versions = step4Data.shotVersions[shot.id] || [];
        const latestVersion = versions[versions.length - 1];
        const hasVideo = latestVersion?.videoUrl && 
                         typeof latestVersion.videoUrl === 'string' && 
                         latestVersion.videoUrl.trim().length > 0;
        return !hasVideo;
      });

      if (shotsWithoutVideo.length > 0) {
        return res.status(400).json({
          error: `Cannot continue: ${shotsWithoutVideo.length} shot(s) still need video generation.`,
        });
      }
    }

    // Build timeline scenes
    const timelineScenes: TimelineSceneItem[] = scenesSource.map((scene, index) => ({
      id: scene.id,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      description: scene.description,
      duration: scene.duration,
      loopCount: scene.loopCount ?? 1,
      order: index,
    }));

    // Build timeline shots (keyed by sceneId)
    const timelineShots: Record<string, TimelineShotItem[]> = {};
    for (const [sceneId, sceneShots] of Object.entries(shotsSource)) {
      timelineShots[sceneId] = (sceneShots as Shot[]).map((shot, index) => {
        const versions = step4Data.shotVersions[shot.id] || [];
        const latestVersion = versions[versions.length - 1];
        
        // For image-transitions mode: use imageUrl, or fallback to startFrameUrl for backward compatibility
        const imageUrl = isImageTransitionsMode
          ? (latestVersion?.imageUrl || latestVersion?.startFrameUrl || null)
          : null;
        
        return {
          id: shot.id,
          sceneId,
          shotNumber: shot.shotNumber,
          duration: shot.duration,
          loopCount: shot.loopCount ?? 1,
          transition: shot.transition,
          videoUrl: latestVersion?.videoUrl || null,
          imageUrl: imageUrl,  // Use imageUrl for image-transitions mode (with fallback)
          cameraMovement: shot.cameraMovement,  // Add camera movement for image-transitions mode
          order: index,
        };
      });
    }

    // Build SFX audio tracks from shot versions
    const sfxTracks: AudioTrackItem[] = [];
    let currentTime = 0;
    
    // Calculate SFX tracks with proper timing (respecting loops)
    for (const scene of timelineScenes) {
      const sceneLoopCount = scene.loopCount ?? 1;
      const sceneShots = timelineShots[scene.id] || [];
      
      for (let sceneIter = 0; sceneIter < sceneLoopCount; sceneIter++) {
        for (const shot of sceneShots) {
          const shotLoopCount = shot.loopCount ?? 1;
          const versions = step4Data.shotVersions[shot.id] || [];
          const latestVersion = versions[versions.length - 1];
          
          for (let shotIter = 0; shotIter < shotLoopCount; shotIter++) {
            // Add SFX if exists (from shot's soundEffectUrl)
            const sfxUrl = (shotsSource[scene.id] as Shot[])?.find(s => s.id === shot.id)?.soundEffectUrl;
            
            if (sfxUrl) {
              sfxTracks.push({
                id: `sfx-${shot.id}-${sceneIter}-${shotIter}`,
                shotId: shot.id,
                src: sfxUrl,
                start: currentTime,
                duration: shot.duration,
                volume: 1,
                order: sfxTracks.length,
              });
            }
            
            currentTime += shot.duration;
          }
        }
      }
    }

    // Build voiceover track if exists
    let voiceoverTrack: AudioTrackItem | undefined;
    if (step5Data?.voiceoverAudioUrl) {
      voiceoverTrack = {
        id: 'voiceover-main',
        src: step5Data.voiceoverAudioUrl,
        start: 0,
        duration: step5Data.voiceoverDuration || currentTime,
        volume: 1,
        fadeIn: true,
        fadeOut: true,
        order: 0,
      };
    }

    // Build music track if enabled
    // Simple logic: if backgroundMusicEnabled, get from customMusicUrl or generatedMusicUrl
    let musicTrack: AudioTrackItem | undefined;
    if (step1Data?.backgroundMusicEnabled) {
      const musicUrl = step2Data?.hasCustomMusic 
        ? step2Data.customMusicUrl 
        : step5Data?.generatedMusicUrl;
      
      if (musicUrl) {
        musicTrack = {
          id: 'music-main',
          src: musicUrl,
          start: 0,
          duration: currentTime, // Music spans entire video
          volume: 0.5,
          fadeIn: true,
          fadeOut: true,
          order: 0,
        };
        console.log('[ambient-visual:routes] Music track added:', {
          hasCustomMusic: step2Data?.hasCustomMusic,
          musicUrl,
        });
      }
    }

    // Default volume settings (no ambient - we don't use it)
    const defaultVolumes: VolumeSettings = {
      master: 1,
      sfx: 0.8,
      voiceover: 1,
      music: 0.5,
    };

    // Build Step6Data
    const step6Data: Step6Data = {
      timeline: {
        scenes: timelineScenes,
        shots: timelineShots,
        audioTracks: {
          sfx: sfxTracks,
          voiceover: voiceoverTrack,
          music: musicTrack,
        },
      },
      volumes: defaultVolumes,
      previewRender: undefined,
      finalRender: undefined,
    };

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps)
      ? [...video.completedSteps]
      : [];

    // Add step 5 if not already completed
    if (!completedSteps.includes(5)) {
      completedSteps.push(5);
    }

    // Update video: mark step 5 complete, move to step 6, save timeline data
    const updated = await storage.updateVideo(videoId, {
      currentStep: 6,
      completedSteps,
      step6Data,
    });

    console.log('[ambient-visual:routes] Step 5 completed, moved to Step 6:', {
      videoId,
      currentStep: 6,
      completedSteps,
      timelineScenes: timelineScenes.length,
      timelineShots: Object.values(timelineShots).flat().length,
      sfxTracks: sfxTracks.length,
      hasVoiceover: !!voiceoverTrack,
      hasMusic: !!musicTrack,
      totalDuration: currentTime,
    });

    res.json(updated);
  } catch (error) {
    console.error('[ambient-visual:routes] Step 5 -> 6 transition error:', error);
    res.status(500).json({ error: 'Failed to continue to Step 6' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6 -> STEP 7 TRANSITION (EXPORT)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/ambient-visual/videos/:id/step/6/continue-to-7
 * Transition from Preview to Export phase
 * 
 * Called when user confirms export from Preview phase (Step 6)
 * - Saves final audio volume settings
 * - Triggers Shotstack final render (1080p quality)
 * - Creates step7Data with render state
 * - Updates currentStep to 7, adds 6 to completedSteps
 * - User cannot go back after this point
 */
router.patch('/videos/:id/step/6/continue-to-7', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const { volumes } = req.body; // Audio volumes from mixer

    console.log('[ambient-visual:routes] Step 6 -> 7 transition requested:', {
      videoId,
      hasVolumes: !!volumes,
      receivedVolumes: volumes,
    });

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data | null;
    const step6Data = video.step6Data as Step6Data | undefined;
    
    if (!step6Data?.timeline) {
      return res.status(400).json({ error: 'No timeline data found. Complete preview step first.' });
    }

    // Update volumes in step6Data if provided
    const updatedVolumes: VolumeSettings = volumes ? {
      master: volumes.master ?? step6Data.volumes?.master ?? 1,
      sfx: volumes.sfx ?? step6Data.volumes?.sfx ?? 0.8,
      voiceover: volumes.voiceover ?? step6Data.volumes?.voiceover ?? 1,
      music: volumes.music ?? step6Data.volumes?.music ?? 0.5,
    } : (step6Data.volumes || {
      master: 1,
      sfx: 0.8,
      voiceover: 1,
      music: 0.5,
    });

    // Save volumes to step6Data
    const step6DataWithVolumes: Step6Data = {
      ...step6Data,
      volumes: updatedVolumes,
    };

    console.log('[ambient-visual:routes] Saving updated volumes to step6Data:', {
      videoId,
      updatedVolumes,
    });

    await storage.updateVideo(videoId, {
      step6Data: step6DataWithVolumes,
    });

    // Calculate total duration from timeline
    let totalDuration = 0;
    for (const scene of step6Data.timeline.scenes) {
      const sceneLoopCount = scene.loopCount ?? 1;
      const sceneShots = step6Data.timeline.shots[scene.id] || [];
      for (let i = 0; i < sceneLoopCount; i++) {
        for (const shot of sceneShots) {
          const shotLoopCount = shot.loopCount ?? 1;
          totalDuration += shot.duration * shotLoopCount;
        }
      }
    }

    // Create initial step7Data
    const step7Data: Step7Data = {
      renderStatus: 'pending',
      renderProgress: 0,
      resolution: '1080p',
      format: 'mp4',
      duration: totalDuration,
      aspectRatio: step1Data?.aspectRatio || '16:9',
      sceneCount: step6Data.timeline.scenes.length,
      startedAt: new Date().toISOString(),
    };

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps)
      ? [...video.completedSteps]
      : [];

    // Add step 6 if not already completed
    if (!completedSteps.includes(6)) {
      completedSteps.push(6);
    }

    // Update video: mark step 6 complete, move to step 7, save step7Data
    // Also update status to 'rendering'
    await storage.updateVideo(videoId, {
      currentStep: 7,
      completedSteps,
      step7Data,
      status: 'rendering',
    });

    console.log('[ambient-visual:routes] Step 6 completed, moved to Step 7:', {
      videoId,
      currentStep: 7,
      completedSteps,
      totalDuration,
      renderStatus: 'pending',
    });

    res.json({
      success: true,
      step7Data,
      message: 'Moved to export phase. Render will start shortly.',
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Step 6 -> 7 transition error:', error);
    res.status(500).json({ error: 'Failed to continue to Step 7' });
  }
});

/**
 * POST /api/ambient-visual/videos/:id/export/start-render
 * Start the Shotstack final render
 * 
 * Called after step7Data is created to trigger the actual render
 */
router.post('/videos/:id/export/start-render', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step7Data = video.step7Data as Step7Data | undefined;
    if (!step7Data) {
      return res.status(400).json({ error: 'Export not initialized. Call continue-to-7 first.' });
    }

    // If already rendering or done, return current state
    if (step7Data.renderStatus !== 'pending' && step7Data.renderStatus !== 'failed') {
      return res.json({
        renderId: step7Data.renderId,
        renderStatus: step7Data.renderStatus,
        renderProgress: step7Data.renderProgress,
      });
    }

    // Use the existing preview/render endpoint logic
    // Trigger final quality render via internal call
    const renderResponse = await fetch(
      `${req.protocol}://${req.get('host')}/api/ambient-visual/videos/${videoId}/preview/render`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || '',
        },
        body: JSON.stringify({ quality: 'final' }),
      }
    );

    if (!renderResponse.ok) {
      const errData = await renderResponse.json();
      throw new Error(errData.error || 'Failed to start render');
    }

    const renderData = await renderResponse.json();

    // Update step7Data with render ID
    const updatedStep7Data: Step7Data = {
      ...step7Data,
      renderId: renderData.renderId,
      renderStatus: 'queued',
      renderProgress: 5,
    };

    await storage.updateVideo(videoId, {
      step7Data: updatedStep7Data,
    });

    console.log('[ambient-visual:routes] Export render started:', {
      videoId,
      renderId: renderData.renderId,
    });

    res.json({
      success: true,
      renderId: renderData.renderId,
      renderStatus: 'queued',
      renderProgress: 5,
    });
  } catch (error) {
    console.error('[ambient-visual:routes] Export render error:', error);
    
    // Update step7Data with error
    const video = await storage.getVideo(req.params.id);
    if (video?.step7Data) {
      await storage.updateVideo(req.params.id, {
        step7Data: {
          ...(video.step7Data as Step7Data),
          renderStatus: 'failed',
          error: error instanceof Error ? error.message : 'Failed to start render',
        },
      });
    }
    
    res.status(500).json({ error: 'Failed to start export render' });
  }
});

/**
 * GET /api/ambient-visual/videos/:id/export/status
 * Get export status and handle completion
 * 
 * Polls Shotstack render status and when complete:
 * - Downloads video from Shotstack temporary URL
 * - Uploads to Bunny CDN
 * - Updates exportUrl, thumbnailUrl, status columns
 */
router.get('/videos/:id/export/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step7Data = video.step7Data as Step7Data | undefined;
    if (!step7Data) {
      return res.status(400).json({ error: 'Export not initialized' });
    }

    // If already done, uploading, or failed, return current state (prevents duplicate uploads)
    if (step7Data.renderStatus === 'done' || step7Data.renderStatus === 'failed' || step7Data.renderStatus === 'uploading') {
      return res.json({
        renderStatus: step7Data.renderStatus,
        renderProgress: step7Data.renderProgress,
        exportUrl: step7Data.exportUrl || video.exportUrl,
        thumbnailUrl: step7Data.thumbnailUrl || video.thumbnailUrl,
        error: step7Data.error,
      });
    }

    // If no render ID yet, render hasn't started
    if (!step7Data.renderId) {
      return res.json({
        renderStatus: step7Data.renderStatus,
        renderProgress: step7Data.renderProgress,
        message: 'Render not started yet',
      });
    }

    // Poll Shotstack status via internal call
    const statusResponse = await fetch(
      `${req.protocol}://${req.get('host')}/api/ambient-visual/videos/${videoId}/preview/status/${step7Data.renderId}`,
      {
        method: 'GET',
        headers: {
          'Cookie': req.headers.cookie || '',
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error('Failed to get render status');
    }

    const statusData = await statusResponse.json();
    const shotstackStatus = statusData.status;
    const shotstackUrl = statusData.url;
    const thumbnailUrl = statusData.thumbnail;

    // Map Shotstack status to progress
    let renderProgress = step7Data.renderProgress;
    let renderStatus: Step7Data['renderStatus'] = step7Data.renderStatus;

    switch (shotstackStatus) {
      case 'queued':
        renderProgress = 10;
        renderStatus = 'queued';
        break;
      case 'fetching':
        renderProgress = 30;
        renderStatus = 'fetching';
        break;
      case 'rendering':
        renderProgress = 60;
        renderStatus = 'rendering';
        break;
      case 'saving':
        renderProgress = 85;
        renderStatus = 'saving';
        break;
      case 'done':
        renderProgress = 95;
        renderStatus = 'done';
        break;
      case 'failed':
        renderProgress = 0;
        renderStatus = 'failed';
        break;
    }

    // If render is complete, upload to Bunny CDN
    if (shotstackStatus === 'done' && shotstackUrl) {
      try {
        // IMMEDIATELY set status to 'uploading' to prevent duplicate uploads
        // This is critical: large video uploads take time, and we need to block
        // subsequent poll requests from starting additional uploads
        await storage.updateVideo(videoId, {
          step7Data: {
            ...step7Data,
            renderStatus: 'uploading',
            renderProgress: 95,
          },
        });

        console.log('[ambient-visual:export] Render complete, uploading to Bunny CDN:', {
          videoId,
          shotstackUrl,
        });

        // Get workspace info using the authenticated userId (same pattern as custom music upload)
        const workspaces = await storage.getWorkspacesByUserId(userId);
        const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
        const workspaceName = currentWorkspace?.name || 'default';

        // Build Bunny CDN path with video creation date (consistent with voiceover and SFX)
        const videoTitle = video.title || 'untitled';
        const truncatedTitle = videoTitle.slice(0, 50).replace(/[^a-zA-Z0-9_-]/g, '_') || 'export';
        const dateLabel = video.createdAt
          ? new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
          : new Date().toISOString().slice(0, 10).replace(/-/g, "");

        console.log('[ambient-visual:export] Building path with:', {
          userId,
          workspaceName,
          title: truncatedTitle,
          dateLabel,
        });

        // Download video from Shotstack
        const videoResponse = await fetch(shotstackUrl);
        if (!videoResponse.ok) {
          throw new Error('Failed to download video from Shotstack');
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        // Upload video to Bunny CDN
        const videoFilename = `final_video_${Date.now()}.mp4`;
        const videoBunnyPath = buildVideoModePath({
          userId,
          workspaceName,
          toolMode: 'ambient',
          projectName: truncatedTitle,
          subFolder: 'Final',
          filename: videoFilename,
          dateLabel,
        });

        const exportUrl = await bunnyStorage.uploadFile(videoBunnyPath, videoBuffer, 'video/mp4');
        console.log('[ambient-visual:export] Video uploaded to Bunny CDN:', exportUrl);

        // Handle thumbnail if available from Shotstack
        let finalThumbnailUrl: string | undefined;
        if (thumbnailUrl) {
          try {
            const thumbResponse = await fetch(thumbnailUrl);
            if (thumbResponse.ok) {
              const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
              const thumbFilename = `thumbnail_${Date.now()}.jpg`;
              const thumbBunnyPath = buildVideoModePath({
                userId,
                workspaceName,
                toolMode: 'ambient',
                projectName: truncatedTitle,
                subFolder: 'Final',
                filename: thumbFilename,
                dateLabel,
              });
              finalThumbnailUrl = await bunnyStorage.uploadFile(thumbBunnyPath, thumbBuffer, 'image/jpeg');
              console.log('[ambient-visual:export] Thumbnail uploaded to Bunny CDN:', finalThumbnailUrl);
            }
          } catch (thumbError) {
            console.error('[ambient-visual:export] Thumbnail upload error:', thumbError);
            // Continue without thumbnail
          }
        }

        // Update step7Data with final URLs
        const completedStep7Data: Step7Data = {
          ...step7Data,
          renderStatus: 'done',
          renderProgress: 100,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
          completedAt: new Date().toISOString(),
        };

        // Update video with final data
        await storage.updateVideo(videoId, {
          step7Data: completedStep7Data,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
          status: 'completed',
        });

        console.log('[ambient-visual:export] Export completed:', {
          videoId,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
        });

        return res.json({
          renderStatus: 'done',
          renderProgress: 100,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
        });
      } catch (uploadError) {
        console.error('[ambient-visual:export] Upload error:', uploadError);
        
        // Update step7Data with error
        await storage.updateVideo(videoId, {
          step7Data: {
            ...step7Data,
            renderStatus: 'failed',
            error: uploadError instanceof Error ? uploadError.message : 'Failed to upload to CDN',
          },
        });

        return res.status(500).json({
          renderStatus: 'failed',
          error: 'Failed to upload to CDN',
        });
      }
    }

    // If failed, update step7Data
    if (shotstackStatus === 'failed') {
      await storage.updateVideo(videoId, {
        step7Data: {
          ...step7Data,
          renderStatus: 'failed',
          error: statusData.error || 'Render failed',
        },
        status: 'failed',
      });

      return res.json({
        renderStatus: 'failed',
        renderProgress: 0,
        error: statusData.error || 'Render failed',
      });
    }

    // Update progress in step7Data
    if (renderProgress !== step7Data.renderProgress || renderStatus !== step7Data.renderStatus) {
      await storage.updateVideo(videoId, {
        step7Data: {
          ...step7Data,
          renderStatus,
          renderProgress,
        },
      });
    }

    res.json({
      renderStatus,
      renderProgress,
    });
  } catch (error) {
    console.error('[ambient-visual:export] Status error:', error);
    res.status(500).json({ error: 'Failed to get export status' });
  }
});

export default router;

