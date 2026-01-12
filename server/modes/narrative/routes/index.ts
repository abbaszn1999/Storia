import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { NarrativeAgents } from '../agents';
import { getCameraMovementPrompt } from '../utils/camera-presets';
import { StorageCleanup } from '../utils/storage-cleanup';
import { storage } from '../../../storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { bunnyStorage } from '../../../storage/bunny-storage';
import { insertCharacterSchema, insertLocationSchema } from '@shared/schema';
import { getRunwareImageModels, getRunwareVideoModels } from '../../../ai/config';
import { VIDEO_MODEL_CONFIGS, getAvailableVideoModels } from '../../../ai/config/video-models';

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
    console.log(`[narrative:routes] Cleaned up ${cleaned} expired temp uploads`);
  }
}, 30 * 60 * 1000);

// Export for use in generation endpoints
export function getTempUpload(tempId: string): TempUpload | undefined {
  return tempUploads.get(tempId);
}

export function deleteTempUpload(tempId: string): void {
  tempUploads.delete(tempId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build Bunny path for character images
 */
function buildCharacterImagePath(
  userId: string,
  workspaceName: string,
  characterId: string,
  imageType: "main" | "reference",
  mimeType: string,
  index?: number
): string {
  const timestamp = Date.now();
  // Extract extension from mime type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionMap[mimeType] || "png";
  const filename = imageType === "main" ? `main_${timestamp}.${extension}` : `ref${index || 1}_${timestamp}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  return `${userId}/${workspace}/Assets/Characters/${characterId}/${filename}`;
}

/**
 * Build Bunny path for location images
 */
function buildLocationImagePath(
  userId: string,
  workspaceName: string,
  locationId: string,
  imageType: "main" | "reference",
  mimeType: string,
  index?: number
): string {
  const timestamp = Date.now();
  // Extract extension from mime type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionMap[mimeType] || "png";
  const filename = imageType === "main" ? `main_${timestamp}.${extension}` : `ref${index || 1}_${timestamp}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  return `${userId}/${workspace}/Assets/Locations/${locationId}/${filename}`;
}

/**
 * Build Bunny path for shot version images
 */
function buildShotImagePath(
  userId: string,
  workspaceName: string,
  videoId: string,
  shotId: string,
  versionId: string,
  imageType: "image" | "start" | "end",
  mimeType: string
): string {
  // Extract extension from mime type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionMap[mimeType] || "png";
  const filename = `${imageType}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  return `${userId}/${workspace}/Videos/${videoId}/Shots/${shotId}/Versions/${versionId}/${filename}`;
}

/**
 * Download image from URL and upload to Bunny CDN
 */
async function downloadAndUploadToBunny(
  imageUrl: string,
  bunnyPath: string
): Promise<string> {
  try {
    // Download image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Get image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Bunny CDN
    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, buffer, contentType);
    
    console.log('[narrative:routes] Image uploaded to Bunny CDN:', {
      originalUrl: imageUrl.substring(0, 50) + '...',
      bunnyPath,
      cdnUrl: cdnUrl.substring(0, 50) + '...',
    });
    
    return cdnUrl;
  } catch (error) {
    console.error('[narrative:routes] Failed to download and upload image:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERENCE IMAGE UPLOAD (Temporary Storage)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/narrative/upload-reference
 * Upload a reference image to temporary memory storage
 * 
 * Returns a tempId and base64 preview URL for immediate display.
 * Images are stored in memory only - lost on page refresh.
 * On image generation, images are uploaded to Bunny CDN permanently.
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

    console.log('[narrative:routes] Reference image uploaded to temp storage:', {
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
    console.error('[narrative:routes] Reference upload error:', error);
    res.status(500).json({ error: 'Failed to upload reference image' });
  }
});

/**
 * DELETE /api/narrative/upload-reference/:tempId
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
      console.log('[narrative:routes] Temp reference deleted:', tempId);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Temp upload not found' });
    }
  } catch (error) {
    console.error('[narrative:routes] Delete temp reference error:', error);
    res.status(500).json({ error: 'Failed to delete reference image' });
  }
});

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
 * PATCH /api/narrative/videos/:id/step2
 * Save step2 data (world settings, characters, locations, etc.)
 * 
 * Following the same pattern as step1:
 * 1. Fetch existing video
 * 2. Merge existing step2Data with incoming updates
 * 3. Save merged data to database
 */
router.patch('/videos/:id/step2', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const step2Updates = req.body;

    console.log('[narrative:routes] Saving step2 data for video:', id, 'fields:', Object.keys(step2Updates));

    // Get existing video to merge with current step2Data
    const existingVideo = await storage.getVideo(id);
    if (!existingVideo) {
      console.error('[narrative:routes] Video not found:', id);
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step2Data with new updates
    const existingStep2 = (existingVideo.step2Data as Record<string, any>) || {};
    const updatedStep2Data = {
      ...existingStep2,
      ...step2Updates,
    };

    // Update video with merged step2Data
    const updated = await storage.updateVideo(id, {
      step2Data: updatedStep2Data,
    });

    console.log('[narrative:routes] Step2 data saved successfully:', {
      videoId: id,
      fieldsUpdated: Object.keys(step2Updates),
      hasCharacters: !!updatedStep2Data.characters,
      charactersCount: Array.isArray(updatedStep2Data.characters) ? updatedStep2Data.characters.length : 0,
      hasLocations: !!updatedStep2Data.locations,
      locationsCount: Array.isArray(updatedStep2Data.locations) ? updatedStep2Data.locations.length : 0,
    });

    res.json({ success: true, step2Data: updatedStep2Data });
  } catch (error) {
    console.error('[narrative:routes] Step2 save error:', error);
    res.status(500).json({ error: 'Failed to save step2 data' });
  }
});

/**
 * PATCH /api/narrative/videos/:id/step3
 * Save step3Data (scenes, shots, continuity groups, continuity locked)
 */
router.patch('/videos/:id/step3', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const step3Data = req.body;

    console.log('[narrative:routes] Saving step3 data:', { 
      videoId: id, 
      hasContinuityLocked: step3Data.continuityLocked !== undefined,
      hasContinuityGroups: !!step3Data.continuityGroups,
    });

    // Get existing video
    const existingVideo = await storage.getVideo(id);
    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step3Data with new data
    const existingStep3 = (existingVideo.step3Data as Record<string, any>) || {};
    const updatedStep3Data = {
      ...existingStep3,
      ...step3Data,
    };

    // Update video with step3Data
    await storage.updateVideo(id, { step3Data: updatedStep3Data });

    console.log('[narrative:routes] Step3 data saved successfully');

    res.json({ success: true, step3Data: updatedStep3Data });
  } catch (error) {
    console.error('[narrative:routes] Step3 data save error:', error);
    res.status(500).json({ error: 'Failed to save step3 data' });
  }
});

/**
 * PATCH /api/narrative/videos/:id/step4
 * Save step4Data (prompts generated by Agent 4.1)
 */
router.patch('/videos/:id/step4', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const step4Data = req.body;

    console.log('[narrative:routes] Saving step4 data:', { 
      videoId: id, 
      promptsCount: step4Data.prompts ? Object.keys(step4Data.prompts).length : 0,
      userId,
    });

    // Get existing video
    const existingVideo = await storage.getVideo(id);
    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step4Data with new data
    const existingStep4 = (existingVideo.step4Data as Record<string, any>) || {};
    const updatedStep4Data = {
      ...existingStep4,
      ...step4Data,
    };

    // Update video with step4Data
    await storage.updateVideo(id, { step4Data: updatedStep4Data });

    res.json({ success: true, step4Data: updatedStep4Data });
  } catch (error) {
    console.error('[narrative:routes] Step4 data save error:', error);
    res.status(500).json({ 
      error: 'Failed to save step4 data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

    const { duration, genre, language, tone, userPrompt, model } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    
    console.log('[narrative:routes] Generating script:', { 
      duration, 
      genre, 
      language,
      tone,
      model,
      userId,
      workspaceId,
    });
    
    const result = await NarrativeAgents.generateScript({
      duration,
      genre,
      language,
      tone,
      userPrompt,
      model,
    }, userId, workspaceId);

    res.json(result);  // Return structured output: { script, estimatedDuration, metadata }
  } catch (error) {
    console.error('[narrative:routes] Script generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate script',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

router.post('/characters/analyze', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, script, model } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    
    // Validate required fields
    if (!videoId || !script) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'videoId and script are required'
      });
    }
    
    console.log('[narrative:routes] Analyzing characters:', { 
      videoId,
      scriptLength: script.length,
      model,
      userId,
      workspaceId,
    });
    
    // Fetch video from database to get genre
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ 
        error: 'Video not found',
        details: `No video found with id: ${videoId}`
      });
    }
    
    // Extract genre from step1Data (where it's stored during script creation)
    const step1Data = (video.step1Data as Record<string, any>) || {};
    const genres = step1Data.genres as string | string[] | undefined;
    
    // Parse genre (can be string or array)
    let genre: string;
    if (Array.isArray(genres)) {
      genre = genres[0] || 'General';
    } else if (typeof genres === 'string') {
      // If comma-separated, take first one
      genre = genres.split(',')[0].trim() || 'General';
    } else {
      genre = 'General';
    }
    
    console.log('[narrative:routes] Using genre:', genre);
    
    // Call character analyzer agent
    const result = await NarrativeAgents.analyzeCharacters(
      script,
      genre,
      userId,
      workspaceId,
      model
    );

    res.json(result);  // Return structured output: { characters, metadata }
  } catch (error) {
    console.error('[narrative:routes] Character analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/locations/analyze', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, script, model } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    
    // Validate required fields
    if (!videoId || !script) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'videoId and script are required'
      });
    }
    
    console.log('[narrative:routes] Analyzing locations:', { 
      videoId,
      scriptLength: script.length,
      model,
      userId,
      workspaceId,
    });
    
    // Fetch video from database to get genre
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ 
        error: 'Video not found',
        details: `No video found with id: ${videoId}`
      });
    }
    
    // Extract genre from step1Data (where it's stored during script creation)
    const step1Data = (video.step1Data as Record<string, any>) || {};
    const genres = step1Data.genres as string | string[] | undefined;
    
    // Parse genre (can be string or array)
    let genre: string;
    if (Array.isArray(genres)) {
      genre = genres[0] || 'General';
    } else if (typeof genres === 'string') {
      // If comma-separated, take first one
      genre = genres.split(',')[0].trim() || 'General';
    } else {
      genre = 'General';
    }
    
    console.log('[narrative:routes] Using genre for location analysis:', genre);
    
    // Call location analyzer agent
    const result = await NarrativeAgents.analyzeLocations(
      script,
      genre,
      userId,
      workspaceId,
      model
    );

    res.json(result);  // Return structured output: { locations, metadata }
  } catch (error) {
    console.error('[narrative:routes] Location analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/narrative/characters/generate-image
 * Generate AI character portrait image (Agent 2.3)
 * 
 * In narrative mode, users can select the image model.
 * Creates character first if characterId not provided, then uploads image to Bunny CDN.
 */
router.post('/characters/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      characterId,  // Optional - if not provided, create character first
      name, 
      appearance, 
      personality, 
      artStyleDescription, 
      model, 
      negativePrompt, 
      referenceImages,  // Already CDN URLs (from assets library)
      referenceTempIds,  // Temp IDs to convert to CDN URLs (from narrative mode)
      styleReferenceTempId,  // Style reference temp ID
      workspaceId  // Accept workspaceId in body instead of header
    } = req.body;

    // Validate required fields
    if (!name || !appearance || !personality) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'name, appearance, and personality are required'
      });
    }

    if (!workspaceId) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'workspaceId is required'
      });
    }

    // Get workspace to build Bunny path
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Create character first if characterId not provided OR if the character doesn't exist
    let finalCharacterId = characterId;
    let characterExists = false;
    
    if (characterId) {
      // Check if character actually exists in database
      try {
        const existingChar = await storage.getCharacter(characterId);
        characterExists = !!existingChar;
      } catch {
        characterExists = false;
      }
    }
    
    if (!finalCharacterId || !characterExists) {
      console.log('[narrative:routes] Creating character first before image generation:', {
        reason: !finalCharacterId ? 'no characterId provided' : 'character not in database',
        providedId: characterId?.substring(0, 8) || 'none',
      });
      const validated = insertCharacterSchema.parse({
        workspaceId,
        name,
        description: undefined,
        personality: personality || undefined,
        appearance,
      });
      const newCharacter = await storage.createCharacter(validated);
      finalCharacterId = newCharacter.id;
      console.log('[narrative:routes] Character created:', { characterId: finalCharacterId, name });
    }

    // Convert temp IDs to CDN URLs by uploading to Bunny
    let finalReferenceImages: string[] = referenceImages || [];
    
    if (referenceTempIds && referenceTempIds.length > 0) {
      console.log('[narrative:routes] Converting reference temp IDs to CDN URLs:', referenceTempIds.length);
      for (let i = 0; i < referenceTempIds.length; i++) {
        const tempId = referenceTempIds[i];
        const tempFile = tempUploads.get(tempId);
        
        if (tempFile) {
          const bunnyPath = buildCharacterImagePath(
            userId, 
            workspace.name, 
            finalCharacterId, 
            "reference", 
            tempFile.mimetype, 
            i + 1
          );
          const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, tempFile.buffer, tempFile.mimetype);
          finalReferenceImages.push(cdnUrl);
          tempUploads.delete(tempId);
          console.log('[narrative:routes] Reference image uploaded to CDN:', {
            tempId: tempId.substring(0, 8),
            cdnUrl: cdnUrl.substring(0, 50) + '...',
          });
        }
      }
    }

    // Handle style reference image
    let styleReferenceUrl: string | undefined;
    if (styleReferenceTempId) {
      const tempFile = tempUploads.get(styleReferenceTempId);
      if (tempFile) {
        const bunnyPath = buildCharacterImagePath(
          userId, 
          workspace.name, 
          finalCharacterId, 
          "reference", 
          tempFile.mimetype, 
          999  // Use 999 for style reference to distinguish it
        );
        styleReferenceUrl = await bunnyStorage.uploadFile(bunnyPath, tempFile.buffer, tempFile.mimetype);
        tempUploads.delete(styleReferenceTempId);
        console.log('[narrative:routes] Style reference image uploaded to CDN:', {
          tempId: styleReferenceTempId.substring(0, 8),
          cdnUrl: styleReferenceUrl.substring(0, 50) + '...',
        });
      }
    }

    console.log('[narrative:routes] Generating character image (Agent 2.3):', { 
      characterId: finalCharacterId,
      characterName: name,
      model: model || 'nano-banana',
      hasArtStyle: !!artStyleDescription,
      hasReferenceImages: finalReferenceImages.length > 0,
      hasStyleReference: !!styleReferenceUrl,
      userId,
      workspaceId,
    });

    // Call Agent 2.3: Character Image Generator
    const result = await NarrativeAgents.generateCharacterImage(
      {
        name,
        appearance,
        personality,
        artStyleDescription,
        model,
        negativePrompt,
        referenceImages: finalReferenceImages,
        styleReferenceImage: styleReferenceUrl,
      },
      userId,
      workspaceId
    );

    if (result.error || !result.imageUrl) {
      console.error('[narrative:routes] Character image generation failed:', result.error);
      return res.status(500).json({ 
        error: 'Failed to generate character image',
        details: result.error 
      });
    }

    console.log('[narrative:routes] AI image generated, downloading to CDN:', {
      generatedUrl: result.imageUrl.substring(0, 50) + '...',
      cost: result.cost,
    });

    // Download the generated image and upload to Bunny CDN
    const imageResponse = await fetch(result.imageUrl);
    if (!imageResponse.ok) {
      return res.status(500).json({ error: 'Failed to download generated image' });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") || "image/png";

    // Build Bunny path for the generated image
    const bunnyPath = buildCharacterImagePath(userId, workspace.name, finalCharacterId, "main", contentType);
    
    // Upload to Bunny CDN
    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);

    // Update character with new image URL
    await storage.updateCharacter(finalCharacterId, { imageUrl: cdnUrl });

    console.log('[narrative:routes] AI-generated image saved successfully:', {
      characterId: finalCharacterId,
      cdnUrl: cdnUrl.substring(0, 50) + '...',
      cost: result.cost,
    });

    res.json({
      imageUrl: cdnUrl,
      characterId: finalCharacterId,
      cost: result.cost,
      success: true,
    });
  } catch (error) {
    console.error('[narrative:routes] Character image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate character image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/narrative/locations/generate-image
 * Generate AI location image (Agent 2.4)
 * 
 * In narrative mode, users can select the image model.
 * Creates location first if locationId not provided, then uploads image to Bunny CDN.
 */
router.post('/locations/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      locationId,  // Optional - if not provided, create location first
      name, 
      description, 
      details,
      artStyleDescription, 
      model, 
      negativePrompt, 
      referenceImages,  // Already CDN URLs (from assets library)
      referenceTempIds,  // Temp IDs to convert to CDN URLs (from narrative mode)
      styleReferenceTempId,  // Style reference temp ID
      workspaceId  // Accept workspaceId in body instead of header
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'name and description are required'
      });
    }

    if (!workspaceId) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'workspaceId is required'
      });
    }

    // Get workspace to build Bunny path
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Create location first if locationId not provided
    let finalLocationId = locationId;
    if (!finalLocationId) {
      console.log('[narrative:routes] Creating location first before image generation');
      const validated = insertLocationSchema.parse({
        workspaceId,
        name,
        description,
        details: details || undefined,
      });
      const newLocation = await storage.createLocation(validated);
      finalLocationId = newLocation.id;
      console.log('[narrative:routes] Location created:', { locationId: finalLocationId, name });
    }

    // Convert temp IDs to CDN URLs by uploading to Bunny
    let finalReferenceImages: string[] = referenceImages || [];
    if (referenceTempIds && referenceTempIds.length > 0) {
      console.log('[narrative:routes] Converting reference temp IDs to CDN URLs:', referenceTempIds.length);
      for (let i = 0; i < referenceTempIds.length; i++) {
        const tempId = referenceTempIds[i];
        const tempFile = tempUploads.get(tempId);
        if (tempFile) {
          const bunnyPath = buildLocationImagePath(
            userId, 
            workspace.name, 
            finalLocationId, 
            "reference", 
            tempFile.mimetype, 
            i + 1
          );
          const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, tempFile.buffer, tempFile.mimetype);
          finalReferenceImages.push(cdnUrl);
          tempUploads.delete(tempId);
          console.log('[narrative:routes] Reference image uploaded to CDN:', {
            tempId: tempId.substring(0, 8),
            cdnUrl: cdnUrl.substring(0, 50) + '...',
          });
        }
      }
    }

    // Handle style reference image
    let styleReferenceUrl: string | undefined;
    if (styleReferenceTempId) {
      const tempFile = tempUploads.get(styleReferenceTempId);
      if (tempFile) {
        const bunnyPath = buildLocationImagePath(
          userId, 
          workspace.name, 
          finalLocationId, 
          "reference", 
          tempFile.mimetype, 
          999  // Use 999 for style reference to distinguish it
        );
        styleReferenceUrl = await bunnyStorage.uploadFile(bunnyPath, tempFile.buffer, tempFile.mimetype);
        tempUploads.delete(styleReferenceTempId);
        console.log('[narrative:routes] Style reference image uploaded to CDN:', {
          tempId: styleReferenceTempId.substring(0, 8),
          cdnUrl: styleReferenceUrl.substring(0, 50) + '...',
        });
      }
    }

    console.log('[narrative:routes] Generating location image (Agent 2.4):', { 
      locationId: finalLocationId,
      locationName: name,
      model: model || 'nano-banana',
      hasArtStyle: !!artStyleDescription,
      hasReferenceImages: finalReferenceImages.length > 0,
      hasStyleReference: !!styleReferenceUrl,
      userId,
      workspaceId,
    });

    // Call Agent 2.4: Location Image Generator
    const result = await NarrativeAgents.generateLocationImage(
      {
        name,
        description,
        details,
        artStyleDescription,
        model,
        negativePrompt,
        referenceImages: finalReferenceImages,
        styleReferenceImage: styleReferenceUrl,
      },
      userId,
      workspaceId
    );

    if (result.error || !result.imageUrl) {
      console.error('[narrative:routes] Location image generation failed:', result.error);
      return res.status(500).json({ 
        error: 'Failed to generate location image',
        details: result.error 
      });
    }

    console.log('[narrative:routes] AI image generated, downloading to CDN:', {
      generatedUrl: result.imageUrl.substring(0, 50) + '...',
      cost: result.cost,
    });

    // Download the generated image and upload to Bunny CDN
    const imageResponse = await fetch(result.imageUrl);
    if (!imageResponse.ok) {
      return res.status(500).json({ error: 'Failed to download generated image' });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") || "image/png";

    // Build Bunny path for the generated image
    const bunnyPath = buildLocationImagePath(userId, workspace.name, finalLocationId, "main", contentType);
    
    // Upload to Bunny CDN
    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);

    // Update location with new image URL
    await storage.updateLocation(finalLocationId, { imageUrl: cdnUrl });

    console.log('[narrative:routes] AI-generated location image saved successfully:', {
      locationId: finalLocationId,
      cdnUrl: cdnUrl.substring(0, 50) + '...',
      cost: result.cost,
    });

    res.json({
      imageUrl: cdnUrl,
      locationId: finalLocationId,
      cost: result.cost,
      success: true,
    });
  } catch (error) {
    console.error('[narrative:routes] Location image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate location image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/narrative/breakdown
 * Generate scene breakdown (Agent 3.1) and shots (Agent 3.2)
 *
 * Runs Agent 3.1 (Scene Analyzer) first, then Agent 3.2 (Shot Composer) sequentially
 */
router.post('/breakdown', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      videoId,
      script,
      model: scriptModel,
      targetDuration,
      genre,
      tone,
      numberOfScenes,
      shotsPerScene,
      characters = [],
      locations = [],
      narrativeMode
    } = req.body;

    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    // Validate required fields
    if (!videoId || !script || !targetDuration || !genre) {
      return res.status(400).json({
        error: 'Missing required fields: videoId, script, targetDuration, genre'
      });
    }

    console.log('[narrative:routes] Generating breakdown:', {
      videoId,
      scriptLength: script.length,
      targetDuration,
      genre,
      tone,
      numberOfScenes,
      shotsPerScene,
      characterCount: characters.length,
      locationCount: locations.length,
      model: scriptModel,
      userId,
      workspaceId,
    });

    // Fetch numberOfScenes from step1Data if not provided
    let finalNumberOfScenes: number | 'auto' = numberOfScenes || 'auto';
    if (!numberOfScenes) {
      try {
        const video = await storage.getVideo(videoId);
        if (video?.step1Data && typeof video.step1Data === 'object') {
          const step1Data = video.step1Data as any;
          if (step1Data.numberOfScenes !== undefined) {
            finalNumberOfScenes = step1Data.numberOfScenes;
            console.log('[narrative:routes] Using numberOfScenes from step1Data:', finalNumberOfScenes);
          }
        }
      } catch (error) {
        console.warn('[narrative:routes] Failed to fetch numberOfScenes from step1Data, using auto:', error);
      }
    }

    // Run Agent 3.1: Scene Analyzer
    console.log('[narrative:routes] Running Agent 3.1: Scene Analyzer...');
    const sceneResult = await NarrativeAgents.generateScenes(
      {
        script,
        targetDuration: parseInt(targetDuration),
        genre,
        tone,
        numberOfScenes: finalNumberOfScenes,
        characters: characters.map((c: any) => ({
          id: c.id || c.characterId || '',
          name: c.name || '',
          description: c.description || c.appearance || '',
        })),
        locations: locations.map((l: any) => ({
          id: l.id || '',
          name: l.name || '',
          description: l.description || '',
        })),
        model: scriptModel,
      },
      videoId,
      userId,
      workspaceId
    );

    // Validate scene count if numberOfScenes was a number
    if (finalNumberOfScenes !== 'auto' && sceneResult.scenes.length !== finalNumberOfScenes) {
      console.warn(
        `[narrative:routes] Scene count mismatch: expected ${finalNumberOfScenes}, got ${sceneResult.scenes.length}`
      );
      // Continue anyway, but log the warning
    }

    // Fetch shotsPerScene from step1Data if not provided
    let finalShotsPerScene: number | 'auto' = shotsPerScene || 'auto';
    if (!shotsPerScene) {
      try {
        const video = await storage.getVideo(videoId);
        if (video?.step1Data && typeof video.step1Data === 'object') {
          const step1Data = video.step1Data as any;
          if (step1Data.shotsPerScene !== undefined) {
            finalShotsPerScene = step1Data.shotsPerScene;
            console.log('[narrative:routes] Using shotsPerScene from step1Data:', finalShotsPerScene);
          }
        }
      } catch (error) {
        console.warn('[narrative:routes] Failed to fetch shotsPerScene from step1Data, using auto:', error);
      }
    }

    // Fetch narrativeMode and video model from video if not provided
    let finalNarrativeMode: "image-reference" | "start-end" | "auto" = narrativeMode || "image-reference";
    let availableDurations: number[] | undefined;
    try {
      const video = await storage.getVideo(videoId);
      if (video) {
        // Fetch narrativeMode from step1Data if not provided
        if (!narrativeMode && video.step1Data && typeof video.step1Data === 'object') {
          const step1Data = video.step1Data as any;
          if (step1Data.narrativeMode) {
            finalNarrativeMode = step1Data.narrativeMode as "image-reference" | "start-end" | "auto";
            console.log('[narrative:routes] Using narrativeMode from step1Data:', finalNarrativeMode);
          }
        }

        // Fetch video model from step2Data to get available durations
        if (video?.step2Data && typeof video.step2Data === 'object') {
          const step2Data = video.step2Data as any;
          // Video model might be stored in step2Data or we need to get it from video model config
          // For now, we'll get it from VIDEO_MODEL_CONFIGS based on a default or stored model
          // Check if there's a videoModel in step2Data or step3Data
          const videoModelId = step2Data.videoModel || (video.step3Data as any)?.scenes?.[0]?.videoModel;

          if (videoModelId) {
            // Import video model config
            const { VIDEO_MODEL_CONFIGS } = await import('../../../ai/config/video-models');
            const modelConfig = VIDEO_MODEL_CONFIGS[videoModelId];
            if (modelConfig && modelConfig.durations) {
              availableDurations = modelConfig.durations;
              console.log('[narrative:routes] Using available durations from video model:', {
                videoModelId,
                availableDurations,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('[narrative:routes] Failed to fetch video data, using defaults:', error);
    }

    // Run Agent 3.2: Shot Composer
    console.log('[narrative:routes] Running Agent 3.2: Shot Composer...');
    const { composeShotsForScenes } = await import('../agents/breakdown/shot-composer');

    const shotResult = await composeShotsForScenes(
      sceneResult.scenes,
      {
        script,
        shotsPerScene: finalShotsPerScene,
        characters: characters.map((c: any) => ({
          id: c.id || c.characterId || '',
          name: c.name || '',
          description: c.description || c.appearance || '',
        })),
        locations: locations.map((l: any) => ({
          id: l.id || '',
          name: l.name || '',
          description: l.description || '',
        })),
        genre,
        tone,
        model: scriptModel,
        availableDurations,
        narrativeMode: finalNarrativeMode,
      },
      userId,
      workspaceId
    );

    const shots: { [sceneId: string]: any[] } = shotResult.shots;
    const continuityGroups: { [sceneId: string]: any[] } = shotResult.continuityGroups || {};
    const shotVersions: { [shotId: string]: any[] } = {};

    // Validate shot counts per scene if shotsPerScene was a number
    if (finalShotsPerScene !== 'auto') {
      for (const scene of sceneResult.scenes) {
        const sceneShots = shots[scene.id] || [];
        if (sceneShots.length !== finalShotsPerScene) {
          console.warn(
            `[narrative:routes] Shot count mismatch for scene ${scene.sceneNumber}: expected ${finalShotsPerScene}, got ${sceneShots.length}`
          );
        }
      }
    }

    // Serialize Date objects to ISO strings for JSONB storage
    const serializedScenes = sceneResult.scenes.map(scene => ({
      ...scene,
      createdAt: scene.createdAt instanceof Date ? scene.createdAt.toISOString() : scene.createdAt,
    }));

    const serializedShots: { [sceneId: string]: any[] } = {};
    for (const [sceneId, sceneShots] of Object.entries(shots)) {
      serializedShots[sceneId] = sceneShots.map(shot => ({
        ...shot,
        createdAt: shot.createdAt instanceof Date ? shot.createdAt.toISOString() : shot.createdAt,
        updatedAt: shot.updatedAt instanceof Date ? shot.updatedAt.toISOString() : shot.updatedAt,
      }));
    }

    // Serialize continuity groups (with serialized dates)
    const serializedContinuityGroups: { [sceneId: string]: any[] } = {};
    for (const [sceneId, sceneGroups] of Object.entries(continuityGroups)) {
      serializedContinuityGroups[sceneId] = sceneGroups.map(group => ({
        ...group,
        createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
        editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : group.editedAt,
        approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : group.approvedAt,
      }));
    }

    // Save to step3Data (with serialized dates)
    const step3Data = {
      scenes: serializedScenes,
      shots: serializedShots,
      shotVersions,
      continuityLocked: false,
      continuityGroups: serializedContinuityGroups,  // Include generated continuity groups
    };

    // Get existing video to merge step3Data
    const existingVideo = await storage.getVideo(videoId);
    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step3Data with new data
    const existingStep3 = (existingVideo.step3Data as Record<string, any>) || {};
    const updatedStep3Data = {
      ...existingStep3,
      ...step3Data,
    };

    // Update video with step3Data
    await storage.updateVideo(videoId, { step3Data: updatedStep3Data });

    const totalCost = (sceneResult.cost || 0) + shotResult.totalCost;
    const totalShots = Object.values(shots).flat().length;

    console.log('[narrative:routes] Breakdown generated successfully:', {
      videoId,
      sceneCount: sceneResult.scenes.length,
      continuityGroupsCount: Object.values(serializedContinuityGroups).flat().length,
      totalShots,
      totalDuration: sceneResult.totalDuration,
      totalCost,
    });

    // Return serialized data for client
    res.json({
      scenes: serializedScenes,
      shots: serializedShots,
      continuityGroups: serializedContinuityGroups,  // Return continuity groups in response
      shotVersions,
      totalDuration: sceneResult.totalDuration,
      cost: totalCost,
    });
  } catch (error) {
    console.error('[narrative:routes] Breakdown generation error:', error);
    res.status(500).json({
      error: 'Failed to generate breakdown',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

/**
 * GET /api/narrative/models
 * Get available image and video models from AI config
 */
router.get('/models', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Comprehensive list of all available image models
    const allImageModels = [
      {
        name: "flux-2-dev",
        label: "FLUX.2 [dev]",
        description: "Open weights release with full architectural control. Supports seed for reproducible results. Up to 4 reference images",
      },
      {
        name: "flux-2-pro",
        label: "FLUX.2 [pro]",
        description: "Production-ready with robust reference-image editing. Built for reliability and speed. Up to 9 reference images",
      },
      {
        name: "flux-2-flex",
        label: "FLUX.2 [flex]",
        description: "Strongest text rendering accuracy in FLUX family. Fine-grained control for branded design, posters, typography. Up to 10 reference images",
      },
      {
        name: "flux-2-max",
        label: "FLUX.2 [max]",
        description: "Pinnacle of FLUX.2 family. Professional-grade visual intelligence with grounded generation (real-world context). Up to 8 reference images",
      },
      {
        name: "openai-gpt-image-1",
        label: "OpenAI GPT Image 1",
        description: "GPT-4o architecture for high-fidelity images with enhanced prompt following, superior text rendering. Supports up to 16 reference images",
      },
      {
        name: "openai-gpt-image-1.5",
        label: "OpenAI GPT Image 1.5",
        description: "Newest flagship powering ChatGPT Images. Faster with enhanced instruction following and precise edits. Supports up to 16 reference images",
      },
      {
        name: "runway-gen-4-image",
        label: "Runway Gen-4 Image",
        description: "High-fidelity with advanced stylistic control and visual consistency. Reference tags system (@tag). Supports up to 3 reference images",
      },
      {
        name: "runway-gen-4-image-turbo",
        label: "Runway Gen-4 Image Turbo",
        description: "Faster variant for rapid iterations. Requires 1-3 reference images. Reference tags system (@tag) supported",
      },
      {
        name: "kling-image-o1",
        label: "Kling IMAGE O1",
        description: "High-control for consistent character handling, precise modification. Strong stylization. Supports up to 10 reference images",
      },
      {
        name: "ideogram-3.0",
        label: "Ideogram 3.0",
        description: "Design-level generation with sharper text rendering and better composition. Enhanced stylistic control for graphic-driven content",
      },
      {
        name: "nano-banana",
        label: "Nano Banana (Gemini Flash 2.5)",
        description: "Rapid, interactive workflows with multi-image fusion and conversational editing. Supports up to 8 reference images. SynthID watermark",
      },
      {
        name: "nano-banana-2-pro",
        label: "Nano Banana 2 Pro (Gemini 3 Pro)",
        description: "Professional-grade with advanced text rendering, up to 4K. Supports 14 reference images. SynthID watermark",
      },
      {
        name: "seedream-4.0",
        label: "Seedream 4.0",
        description: "Ultra-fast 2K/4K rendering with sequential image capabilities. Maintains character consistency. Supports up to 14 reference images",
      },
      {
        name: "seedream-4.5",
        label: "Seedream 4.5",
        description: "Production-focused with fixed face distortion and improved text rendering. Sharp 2K/4K output. Supports up to 14 reference images",
      },
      {
        name: "google-imagen-3.0",
        label: "Google Imagen 3.0",
        description: "High-quality images with advanced prompt understanding and photorealistic output",
      },
      {
        name: "google-imagen-4.0-ultra",
        label: "Google Imagen 4.0 Ultra",
        description: "Most advanced Google image model with superior quality and detail",
      },
      {
        name: "midjourney-v7",
        label: "Midjourney V7",
        description: "Cinematic style with artistic and photorealistic capabilities. Requires numberResults to be multiple of 4",
      },
      {
        name: "riverflow-2-max",
        label: "Riverflow 2 Max",
        description: "Maximum detail with high-quality output. Professional-grade image generation",
      },
    ];

    // Get video models from VIDEO_MODEL_CONFIGS (all models from video-models.ts)
    let allVideoModels;
    try {
      allVideoModels = getAvailableVideoModels();
      console.log('[narrative:routes] Fetched video models from video-models.ts:', {
        count: allVideoModels.length,
        modelIds: allVideoModels.map(m => m.id),
      });
    } catch (error) {
      console.error('[narrative:routes] Error fetching video models:', error);
      throw error;
    }
    
    const videoModels = allVideoModels.map((model) => ({
      name: model.id, // Use model.id as the name (e.g., "seedance-1.0-pro")
      label: model.label, // Use model.label for display (e.g., "Seedance 1.0 Pro")
      description: model.technicalSpecs 
        ? `${model.hasAudio ? '✅ Native audio. ' : ''}${model.frameImageSupport?.first ? '✅ First frame. ' : ''}${model.frameImageSupport?.last ? '✅ Last frame. ' : ''}Durations: ${model.durations.join(', ')}s. ${model.resolutions.join(', ')}. ${model.aspectRatios.join(', ')}`
        : model.label,
      durations: model.durations, // Include durations array for client-side use
    }));

    console.log('[narrative:routes] Returning models:', {
      imageCount: allImageModels.length,
      videoCount: videoModels.length,
      imageModelNames: allImageModels.map(m => m.name),
      videoModelNames: videoModels.map(m => m.name),
      videoModelLabels: videoModels.map(m => m.label),
    });

    res.json({
      imageModels: allImageModels,
      videoModels,
    });
  } catch (error) {
    console.error('[narrative:routes] Models fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/narrative/prompts/generate
 * Generate image and video prompts for a shot (Agent 4.1)
 */
router.post('/prompts/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shotId, videoId, model } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    
    // Validate required fields
    if (!shotId || !videoId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'shotId and videoId are required'
      });
    }
    
    console.log('[narrative:routes] Generating prompts:', { 
      shotId,
      videoId,
      model,
      userId,
      workspaceId,
    });
    
    // Fetch video from database
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ 
        error: 'Video not found',
        details: `No video found with id: ${videoId}`
      });
    }
    
    // Extract step2Data (characters, locations, style, generation targets)
    const step2Data = (video.step2Data as Record<string, any>) || {};
    const characters = step2Data.characters || [];
    const locations = step2Data.locations || [];
    const imageModel = step2Data.imageModel || 'flux-2-dev';
    const videoModel = step2Data.videoModel || 'kling';
    const styleReference = step2Data.styleReference || [];
    const artStyle = step2Data.artStyle || 'none';
    const cinematicInspiration = step2Data.cinematicInspiration || '';
    const realismLevel = step2Data.realismLevel;
    
    // Extract step1Data for aspect ratio
    const step1Data = (video.step1Data as Record<string, any>) || {};
    const aspectRatio = step1Data.aspectRatio || '16:9';
    
    // Extract step3Data (shots, scenes, continuity groups)
    const step3Data = (video.step3Data as Record<string, any>) || {};
    const scenes = step3Data.scenes || [];
    const shots = step3Data.shots || {};
    const continuityGroups = step3Data.continuityGroups || {};
    
    // Find the shot
    let foundShot: any = null;
    let foundScene: any = null;
    
    for (const [sceneId, sceneShots] of Object.entries(shots)) {
      const shotArray = sceneShots as any[];
      const shot = shotArray.find((s: any) => s.id === shotId);
      if (shot) {
        foundShot = shot;
        foundScene = scenes.find((s: any) => s.id === sceneId);
        break;
      }
    }
    
    if (!foundShot) {
      return res.status(404).json({ 
        error: 'Shot not found',
        details: `No shot found with id: ${shotId}`
      });
    }
    
    if (!foundScene) {
      return res.status(404).json({ 
        error: 'Scene not found',
        details: `No scene found for shot: ${shotId}`
      });
    }
    
    // Extract narrative mode from step1Data or step3Data
    const narrativeMode = step1Data.narrativeMode || step3Data.narrativeMode || 'image-reference';
    
    
    // Build character references with anchors
    // Ensure character names are properly tagged, and match to character references
    const characterReferences = foundShot.characters
      ? foundShot.characters.map((charTag: string) => {
          // Extract character name from tag (@{Name} or @Name) or use plain name
          let charName: string;
          if (charTag.startsWith('@')) {
            const nameMatch = charTag.match(/@\{?([^}]+)\}?/);
            charName = nameMatch ? nameMatch[1] : charTag.replace('@', '');
          } else {
            // Plain name - use as is and will be matched by name
            charName = charTag;
          }
          
          // Find character in characters array (case-insensitive match)
          const character = characters.find((c: any) => 
            c.name === charName || c.name?.toLowerCase() === charName.toLowerCase()
          );
          
          if (character) {
            const charRef = {
              name: character.name,
              anchor: character.appearance || character.description || character.name,
              currentOutfit: character.currentOutfit,
              keyTraits: character.personality || character.description,
              refImageUrl: character.imageUrl || character.referenceImageUrl,
            };
            return charRef;
          }
          
          // Fallback if character not found
          return {
            name: charName,
            anchor: charName,
          };
        })
      : [];
    
    // Ensure shot characters array has proper @{Name} tags for Agent 4.1
    // This helps with character reference linking in generated prompts
    const taggedCharacters = foundShot.characters
      ? foundShot.characters.map((charTag: string) => {
          // If already tagged, return as is
          if (charTag.startsWith('@')) {
            return charTag;
          }
          // If plain name, tag it with @{Name} format
          return `@{${charTag}}`;
        })
      : [];
    
    
    // Build location reference
    const locationTag = foundShot.location || '';
    const locationMatch = locationTag.match(/@\{?([^}]+)\}?/);
    const locationName = locationMatch ? locationMatch[1] : locationTag.replace('@', '');
    const location = locations.find((l: any) => 
      l.name === locationName || l.name?.toLowerCase() === locationName.toLowerCase()
    );
    
    const locationReferences = location ? [{
      name: location.name,
      anchor: location.description || location.name,
      refImageUrl: location.imageUrl,
    }] : [];
    
    // Build style reference
    let styleReferenceObj: {
      anchor?: string;
      negativeStyle?: string;
      refImageUrl?: string;
    } | undefined;
    
    if (artStyle === 'none' && styleReference && styleReference.length > 0) {
      // Use first style reference image
      styleReferenceObj = {
        refImageUrl: styleReference[0],
      };
    } else if (cinematicInspiration) {
      styleReferenceObj = {
        anchor: cinematicInspiration,
      };
    }
    
    // Build continuity context
    const sceneContinuityGroups = continuityGroups[foundScene.id] || [];
    let continuityContext = {
      inGroup: false,
      groupId: null as string | null,
      isFirstInGroup: false,
      previousEndFrameSummary: undefined as string | undefined,
      continuityConstraints: undefined as string | undefined,
    };
    
    // Find if shot is in a continuity group
    for (const group of sceneContinuityGroups) {
      if (group.shotIds && group.shotIds.includes(shotId)) {
        continuityContext.inGroup = true;
        continuityContext.groupId = group.id;
        continuityContext.isFirstInGroup = group.shotIds[0] === shotId;
        continuityContext.continuityConstraints = group.description || undefined;
        
        // If not first in group, try to get previous shot's end frame summary from generated prompts
        // ONLY set previousEndFrameSummary if there's actual previous context available
        if (!continuityContext.isFirstInGroup) {
          const shotIndex = group.shotIds.indexOf(shotId);
          if (shotIndex > 0) {
            const previousShotId = group.shotIds[shotIndex - 1];
            
            // Retrieve previous shot's generated prompts from step4Data
            const step4Data = (video.step4Data as Record<string, any>) || {};
            const previousShotPrompts = step4Data.prompts?.[previousShotId];
            
            if (previousShotPrompts) {
              // Extract end frame prompt or image prompt from previous shot
              let previousContext = '';
              
              if (previousShotPrompts.endFramePrompt && previousShotPrompts.endFramePrompt.trim() !== '') {
                // Use end frame prompt for start-end mode
                previousContext = `Previous shot ended with: ${previousShotPrompts.endFramePrompt}`;
              } else if (previousShotPrompts.imagePrompt && previousShotPrompts.imagePrompt.trim() !== '') {
                // Use image prompt for image-reference mode
                previousContext = `Previous shot showed: ${previousShotPrompts.imagePrompt}`;
              }
              
              // Only set if we have actual context
              if (previousContext && previousContext.trim() !== '') {
                continuityContext.previousEndFrameSummary = previousContext;
                console.log('[narrative:routes] Retrieved previous shot context:', {
                  currentShotId: shotId,
                  previousShotId,
                  hasContext: true,
                });
              } else {
                // Explicitly set to undefined to ensure no false continuity mentions
                continuityContext.previousEndFrameSummary = undefined;
                console.log('[narrative:routes] Previous shot has no valid prompts:', {
                  currentShotId: shotId,
                  previousShotId,
                });
              }
            } else {
              // No previous prompts found - explicitly undefined to prevent false continuity
              continuityContext.previousEndFrameSummary = undefined;
              console.log('[narrative:routes] No previous shot prompts found:', {
                currentShotId: shotId,
                previousShotId,
              });
            }
          }
        } else {
          // First in group - no previous context
          continuityContext.previousEndFrameSummary = undefined;
        }
        break;
      }
    }
    
    // Additional validation: Ensure previousEndFrameSummary is only set when there's actual context
    // This prevents the AI from inventing continuity when none exists
    if (continuityContext.previousEndFrameSummary === undefined || 
        continuityContext.previousEndFrameSummary.trim() === '') {
      continuityContext.previousEndFrameSummary = undefined;
    }
    
    // Parse shot description to extract narration and action
    // The description field may contain both narration and action
    const description = foundShot.description || '';
    const narrationText = description; // For now, use description as narration
    const actionDescription = description; // For now, use description as action
    
    // Build input for agent
    const agentInput: import('../agents').PromptEngineerInput = {
      shot: {
        id: foundShot.id,
        sceneId: foundScene.id,
        sceneTitle: foundScene.title,
        shotNumber: foundShot.shotNumber,
        duration: foundShot.duration,
        shotType: foundShot.shotType,
        cameraMovement: foundShot.cameraMovement,
        narrationText,
        actionDescription,
        characters: taggedCharacters.length > 0 ? taggedCharacters : (foundShot.characters || []),
        location: foundShot.location || '',
        frameMode: foundShot.frameMode,
      },
      narrativeMode,
      continuity: continuityContext,
      characterReferences,
      locationReferences,
      styleReference: styleReferenceObj,
      generationTargets: {
        imageModel,
        videoModel,
        aspectRatio,
        realismLevel,
      },
      model,
    };
    
    // Call agent
    const result = await NarrativeAgents.generatePrompts(
      agentInput,
      userId,
      workspaceId
    );
    
    res.json(result);
  } catch (error) {
    console.error('[narrative:routes] Prompt generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/narrative/shots/generate-image
 * Generate storyboard images for a shot (Agent 4.2)
 * Supports both image-reference and start-end modes
 * Includes continuity reference images for shots in continuity groups
 */
router.post('/shots/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shotId, videoId, versionId, imagePrompt, videoPrompt, startFramePrompt, endFramePrompt, negativePrompt, frame } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    if (!shotId || !videoId) {
      return res.status(400).json({ error: 'shotId and videoId are required' });
    }

    console.log('[narrative:routes] Generating storyboard image (Agent 4.2):', {
      shotId,
      videoId,
      versionId,
      userId,
      workspaceId,
      hasImagePrompt: !!imagePrompt,
      hasVideoPrompt: !!videoPrompt,
    });

    // Fetch video from database
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step data
    const step1Data = (video.step1Data as Record<string, any>) || {};
    const step2Data = (video.step2Data as Record<string, any>) || {};
    const step3Data = (video.step3Data as Record<string, any>) || {};
    let step4Data = (video.step4Data as Record<string, any>) || {};

    // If prompts are provided in request body, update step4Data.prompts FIRST
    if (imagePrompt !== undefined || videoPrompt !== undefined || startFramePrompt !== undefined || endFramePrompt !== undefined || negativePrompt !== undefined) {
      const prompts = step4Data.prompts || {};
      const shotPrompts = prompts[shotId] || {};
      prompts[shotId] = {
        ...shotPrompts,
        ...(imagePrompt !== undefined && { imagePrompt }),
        ...(videoPrompt !== undefined && { videoPrompt }),
        ...(startFramePrompt !== undefined && { startFramePrompt }),
        ...(endFramePrompt !== undefined && { endFramePrompt }),
        ...(negativePrompt !== undefined && { negativePrompt }),
      };
      step4Data = {
        ...step4Data,
        prompts,
      };
      
      // Save updated prompts to database before generating
      await storage.updateVideo(videoId, { step4Data });
    }

    // Get aspect ratio from step1Data
    const aspectRatio = step1Data.aspectRatio || '16:9';

    // Get narrative mode
    const narrativeMode = step1Data.narrativeMode || 'image-reference';

    // Get prompts for this shot from step4Data (now updated if provided in request)
    const shotPrompts = step4Data.prompts?.[shotId];
    if (!shotPrompts) {
      return res.status(400).json({ error: 'Prompts not found for this shot. Please generate prompts first.' });
    }

    // Find shot in step3Data
    const allShots: any[] = Object.values(step3Data.shots || {}).flat();
    const foundShot = allShots.find((s: any) => s.id === shotId);
    if (!foundShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Find scene
    const scenes = step3Data.scenes || [];
    const foundScene = scenes.find((s: any) => s.id === foundShot.sceneId);
    if (!foundScene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get image model (shot-level or scene-level)
    const imageModel = foundShot.imageModel || foundScene.imageModel || 'nano-banana';
    
    // Log model selection for debugging
    console.log('[narrative:routes] Image model selection:', {
      shotId,
      shotImageModel: foundShot.imageModel || null,
      sceneImageModel: foundScene.imageModel || null,
      selectedModel: imageModel,
      fallbackUsed: !foundShot.imageModel && !foundScene.imageModel,
    });

    // Collect reference images
    const referenceImages: string[] = [];

    // Character reference images
    const characters = step2Data.characters || [];
    if (foundShot.characters && Array.isArray(foundShot.characters)) {
      for (const charName of foundShot.characters) {
        // Extract character name from @tag format
        const cleanName = charName.replace(/^@\{?([^}]+)\}?$/, '$1');
        const character = characters.find((c: any) => c.name === cleanName);
        if (character && character.imageUrl) {
          referenceImages.push(character.imageUrl);
        }
      }
    }

    // Location reference images
    const locations = step2Data.locations || [];
    if (foundShot.location) {
      const cleanLocationName = foundShot.location.replace(/^@\{?([^}]+)\}?$/, '$1');
      const location = locations.find((l: any) => l.name === cleanLocationName);
      if (location && location.imageUrl) {
        referenceImages.push(location.imageUrl);
      }
    }

    // Style reference images
    const styleReference = step2Data.styleReference || [];
    if (Array.isArray(styleReference)) {
      for (const styleUrl of styleReference) {
        if (styleUrl) {
          referenceImages.push(styleUrl);
        }
      }
    }

    // Continuity Reference Image Collection
    // If shot is in a continuity group and not the first shot, include previous shot's frame
    const continuityGroups = step3Data.continuityGroups || {};
    const sceneContinuityGroups = continuityGroups[foundScene.id] || [];
    let previousFrameUrl: string | null = null;

    for (const group of sceneContinuityGroups) {
      if (group.shotIds && group.shotIds.includes(shotId)) {
        const shotIndex = group.shotIds.indexOf(shotId);
        if (shotIndex > 0) {
          // Not first in group - get previous shot's frame
          const previousShotId = group.shotIds[shotIndex - 1];
          
          // Get previous shot's version from step4Data.shotVersions
          const shotVersions = step4Data.shotVersions || {};
          const previousShotVersions = shotVersions[previousShotId] || [];
          
          // Get the latest version (most recent is last in array)
          const previousVersion = previousShotVersions.length > 0 
            ? previousShotVersions[previousShotVersions.length - 1] 
            : null;
          
          if (previousVersion) {
            // For image-reference mode: use imageUrl
            // For start-end mode: prefer endFrameUrl, fallback to startFrameUrl
            if (narrativeMode === 'image-reference' && previousVersion.imageUrl) {
              previousFrameUrl = previousVersion.imageUrl;
            } else if (narrativeMode === 'start-end' || narrativeMode === 'auto') {
              previousFrameUrl = previousVersion.endFrameUrl || previousVersion.startFrameUrl || null;
            }
            
            if (previousFrameUrl) {
              referenceImages.push(previousFrameUrl);
              console.log('[narrative:routes] Added previous frame reference:', {
                currentShotId: shotId,
                previousShotId,
                previousFrameUrl: previousFrameUrl.substring(0, 50) + '...',
              });
            }
          }
        }
        break;
      }
    }

    // Determine frame type based on user request or continuity groups
    let frameType: "start-only" | "end-only" | "start-and-end" | undefined = undefined;
    
    // If user explicitly requested a specific frame, use that
    if (frame === 'start' || frame === 'end') {
      if (frame === 'start') {
        frameType = "start-only";
      } else if (frame === 'end') {
        frameType = "end-only";
      }
    } else if (narrativeMode === 'start-end' || narrativeMode === 'auto') {
      // Otherwise, use continuity group logic (backward compatible)
      for (const group of sceneContinuityGroups) {
        if (group.shotIds && group.shotIds.includes(shotId)) {
          const shotIndex = group.shotIds.indexOf(shotId);
          const isFirst = shotIndex === 0;
          const isLast = shotIndex === group.shotIds.length - 1;
          
          if (isFirst || isLast) {
            frameType = "start-and-end";
          } else {
            frameType = "start-only";
          }
          break;
        }
      }
      // If not in a group, generate both frames
      if (!frameType) {
        frameType = "start-and-end";
      }
    }

    // Build input for Agent 4.2
    const agentInput = {
      shotId,
      videoId,
      narrativeMode,
      imagePrompt: shotPrompts.imagePrompt || '',
      startFramePrompt: shotPrompts.startFramePrompt || '',
      endFramePrompt: shotPrompts.endFramePrompt || null,
      negativePrompt: shotPrompts.negativePrompt,
      referenceImages,
      aspectRatio,
      imageModel,
      frameType,
    };

    // Call Agent 4.2
    const result = await NarrativeAgents.generateStoryboardImage(
      agentInput,
      userId,
      workspaceId
    );

    if (result.error) {
      return res.status(500).json({ 
        error: result.error,
        details: 'Image generation failed'
      });
    }

    // Get workspace for Bunny path
    let workspaceName = 'default';
    if (workspaceId) {
      try {
        const workspaces = await storage.getWorkspacesByUserId(userId);
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
          workspaceName = workspace.name;
        }
      } catch (error) {
        console.warn('[narrative:routes] Failed to get workspace, using default name:', error);
      }
    }

    // Create or update shot version (we need versionId to build Bunny paths)
    const shotVersions = step4Data.shotVersions || {};
    const existingVersions = shotVersions[shotId] || [];
    
    let newVersionId: string;
    let versionNumber: number;
    let newVersion: any;

    if (versionId && existingVersions.find((v: any) => v.id === versionId)) {
      // Update existing version
      newVersionId = versionId;
      const versionIndex = existingVersions.findIndex((v: any) => v.id === versionId);
      const existingVersion = existingVersions[versionIndex];
      versionNumber = existingVersion.versionNumber;
      
      // Only update frame URLs that were actually generated
      // Preserve existing URLs for frames that weren't generated
      const updatedStartFrameUrl = result.startFrameUrl !== null && result.startFrameUrl !== undefined
        ? result.startFrameUrl
        : existingVersion.startFrameUrl;
      
      const updatedEndFrameUrl = result.endFrameUrl !== null && result.endFrameUrl !== undefined
        ? result.endFrameUrl
        : existingVersion.endFrameUrl;
      
      newVersion = {
        ...existingVersion,
        imageUrl: result.imageUrl || existingVersion.imageUrl,
        startFrameUrl: updatedStartFrameUrl,
        endFrameUrl: updatedEndFrameUrl,
        imagePrompt: shotPrompts.imagePrompt !== undefined ? shotPrompts.imagePrompt : existingVersion.imagePrompt,
        startFramePrompt: shotPrompts.startFramePrompt !== undefined ? shotPrompts.startFramePrompt : existingVersion.startFramePrompt,
        endFramePrompt: shotPrompts.endFramePrompt !== undefined ? shotPrompts.endFramePrompt : existingVersion.endFramePrompt,
        videoPrompt: shotPrompts.videoPrompt !== undefined ? shotPrompts.videoPrompt : existingVersion.videoPrompt,
        negativePrompt: shotPrompts.negativePrompt !== undefined ? shotPrompts.negativePrompt : existingVersion.negativePrompt,
      };
      
      existingVersions[versionIndex] = newVersion;
    } else {
      // Create new version
      newVersionId = `version-${shotId}-${Date.now()}`;
      versionNumber = existingVersions.length + 1;
      
      newVersion = {
        id: newVersionId,
        shotId,
        versionNumber,
        imageUrl: result.imageUrl,
        startFrameUrl: result.startFrameUrl,
        endFrameUrl: result.endFrameUrl,
        imagePrompt: shotPrompts.imagePrompt,
        startFramePrompt: shotPrompts.startFramePrompt,
        endFramePrompt: shotPrompts.endFramePrompt,
        videoPrompt: shotPrompts.videoPrompt,
        negativePrompt: shotPrompts.negativePrompt,
        createdAt: new Date().toISOString(),
      };
      
      existingVersions.push(newVersion);
    }

    // Download images from Runware and upload to Bunny CDN
    let finalImageUrl = result.imageUrl;
    // For existing versions, preserve existing frame URLs if new ones weren't generated
    let finalStartFrameUrl: string | null = result.startFrameUrl;
    let finalEndFrameUrl: string | null = result.endFrameUrl;
    
    // Get existing version if updating
    const existingVersion = versionId ? existingVersions.find((v: any) => v.id === versionId) : null;
    
    // Preserve existing URLs if new ones weren't generated
    if (existingVersion) {
      if (result.startFrameUrl === null || result.startFrameUrl === undefined) {
        finalStartFrameUrl = existingVersion.startFrameUrl || null;
      }
      if (result.endFrameUrl === null || result.endFrameUrl === undefined) {
        finalEndFrameUrl = existingVersion.endFrameUrl || null;
      }
    }

    try {
      // Upload single image (image-reference mode)
      if (result.imageUrl) {
        const bunnyPath = buildShotImagePath(
          userId,
          workspaceName,
          videoId,
          shotId,
          newVersionId,
          "image",
          "image/png" // Default, will be determined from response
        );
        finalImageUrl = await downloadAndUploadToBunny(result.imageUrl, bunnyPath);
      }

      // Upload start frame (start-end mode)
      if (result.startFrameUrl) {
        const bunnyPath = buildShotImagePath(
          userId,
          workspaceName,
          videoId,
          shotId,
          newVersionId,
          "start",
          "image/png"
        );
        finalStartFrameUrl = await downloadAndUploadToBunny(result.startFrameUrl, bunnyPath);
      }

      // Upload end frame (start-end mode)
      if (result.endFrameUrl) {
        const bunnyPath = buildShotImagePath(
          userId,
          workspaceName,
          videoId,
          shotId,
          newVersionId,
          "end",
          "image/png"
        );
        finalEndFrameUrl = await downloadAndUploadToBunny(result.endFrameUrl, bunnyPath);
      }

      // Update version with Bunny CDN URLs
      // For existing versions, only update URLs that were actually generated
      newVersion.imageUrl = finalImageUrl || newVersion.imageUrl;
      if (versionId && existingVersions.find((v: any) => v.id === versionId)) {
        // Only update if a new URL was generated
        if (finalStartFrameUrl !== null && finalStartFrameUrl !== undefined) {
          newVersion.startFrameUrl = finalStartFrameUrl;
        }
        if (finalEndFrameUrl !== null && finalEndFrameUrl !== undefined) {
          newVersion.endFrameUrl = finalEndFrameUrl;
        }
      } else {
        // For new versions, set all URLs
        newVersion.startFrameUrl = finalStartFrameUrl;
        newVersion.endFrameUrl = finalEndFrameUrl;
      }

      // Update the version in the array
      const versionIndex = existingVersions.findIndex((v: any) => v.id === newVersionId);
      if (versionIndex >= 0) {
        existingVersions[versionIndex] = newVersion;
      }
    } catch (error) {
      console.error('[narrative:routes] Failed to upload images to Bunny CDN:', error);
      // Continue with Runware URLs if Bunny upload fails (graceful degradation)
      console.warn('[narrative:routes] Using Runware URLs as fallback');
    }

    // Update shotVersions in step4Data
    shotVersions[shotId] = existingVersions;
    const updatedStep4Data = {
      ...step4Data,
      shotVersions,
    };

    // Save to database
    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[narrative:routes] Storyboard image generated successfully:', {
      shotId,
      versionId: newVersion.id,
      hasImageUrl: !!finalImageUrl,
      hasStartFrame: !!finalStartFrameUrl,
      hasEndFrame: !!finalEndFrameUrl,
      cost: result.cost,
      uploadedToBunny: true,
    });

    res.json({
      imageUrl: finalImageUrl,
      startFrameUrl: finalStartFrameUrl,
      endFrameUrl: finalEndFrameUrl,
      shotVersionId: newVersion.id,
      version: newVersion,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[narrative:routes] Storyboard image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate storyboard image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/narrative/shots/:shotId/versions/:versionId
 * Update shot version prompts (imagePrompt, videoPrompt, etc.)
 */
router.patch('/shots/:shotId/versions/:versionId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2317',message:'Route hit',data:{method:req.method,path:req.path,params:req.params,query:req.query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shotId, versionId } = req.params;
    const { imagePrompt, videoPrompt, startFramePrompt, endFramePrompt, negativePrompt } = req.body;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2324',message:'Parsed params',data:{shotId,versionId,versionIdLength:versionId?.length,versionIdType:typeof versionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2328',message:'Request body prompts',data:{hasImagePrompt:!!imagePrompt,imagePromptPreview:imagePrompt?.substring?.(0,80),hasVideoPrompt:!!videoPrompt,reqBodyKeys:Object.keys(req.body)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Z9'})}).catch(()=>{});
    // #endregion

    if (!shotId || !versionId) {
      return res.status(400).json({ error: 'shotId and versionId are required' });
    }

    console.log('[narrative:routes] Updating shot version prompts:', {
      shotId,
      versionId,
      hasImagePrompt: !!imagePrompt,
      hasVideoPrompt: !!videoPrompt,
      hasStartFramePrompt: !!startFramePrompt,
      hasEndFramePrompt: !!endFramePrompt,
      hasNegativePrompt: !!negativePrompt,
    });

    // Get videoId from request body or find it from shot
    const { videoId } = req.body;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2349',message:'Checking videoId',data:{hasVideoId:!!videoId,videoId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // Fetch video from database
    const video = await storage.getVideo(videoId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2356',message:'Video fetched',data:{hasVideo:!!video,hasStep4Data:!!video?.step4Data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step4Data
    const step4Data = (video.step4Data as Record<string, any>) || {};
    const shotVersions = step4Data.shotVersions || {};
    const existingVersions = shotVersions[shotId] || [];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2363',message:'Checking versions',data:{versionsCount:existingVersions.length,versionIds:existingVersions.map((v:any)=>v.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    // Find the version to update
    const versionIndex = existingVersions.findIndex((v: any) => v.id === versionId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2366',message:'Version search result',data:{versionIndex,searchingFor:versionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    if (versionIndex === -1) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Update the version with new prompt values
    const existingVersion = existingVersions[versionIndex];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2386',message:'Before update',data:{existingImagePrompt:existingVersion?.imagePrompt?.substring?.(0,50),newImagePrompt:imagePrompt?.substring?.(0,80),imagePromptUndefined:imagePrompt===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ZA'})}).catch(()=>{});
    // #endregion
    const updatedVersion = {
      ...existingVersion,
      ...(imagePrompt !== undefined && { imagePrompt }),
      ...(videoPrompt !== undefined && { videoPrompt }),
      ...(startFramePrompt !== undefined && { startFramePrompt }),
      ...(endFramePrompt !== undefined && { endFramePrompt }),
      ...(negativePrompt !== undefined && { negativePrompt }),
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2396',message:'After update',data:{updatedImagePrompt:updatedVersion?.imagePrompt?.substring?.(0,80)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ZB'})}).catch(()=>{});
    // #endregion

    existingVersions[versionIndex] = updatedVersion;
    shotVersions[shotId] = existingVersions;
    
    // #region agent log
    const promptCheck1 = updatedVersion.imagePrompt;
    const promptCheck2 = existingVersions[versionIndex]?.imagePrompt;
    const promptCheck3 = shotVersions[shotId]?.[versionIndex]?.imagePrompt;
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2405',message:'After array assignment',data:{promptCheck1:promptCheck1?.substring?.(0,80),promptCheck2:promptCheck2?.substring?.(0,80),promptCheck3:promptCheck3?.substring?.(0,80),areEqual:promptCheck1===promptCheck2&&promptCheck2===promptCheck3},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ZC'})}).catch(()=>{});
    // #endregion

    // CRITICAL: Also update step4Data.prompts[shotId] because generate-image endpoint reads from there
    const prompts = step4Data.prompts || {};
    const shotPrompts = prompts[shotId] || {};
    const updatedShotPrompts = {
      ...shotPrompts,
      ...(imagePrompt !== undefined && { imagePrompt }),
      ...(videoPrompt !== undefined && { videoPrompt }),
      ...(startFramePrompt !== undefined && { startFramePrompt }),
      ...(endFramePrompt !== undefined && { endFramePrompt }),
      ...(negativePrompt !== undefined && { negativePrompt }),
    };
    prompts[shotId] = updatedShotPrompts;

    // Update step4Data
    const updatedStep4Data = {
      ...step4Data,
      shotVersions,
      prompts,
    };
    
    // #region agent log
    const finalPrompt = updatedStep4Data?.shotVersions?.[shotId]?.[versionIndex]?.imagePrompt;
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2415',message:'After step4Data spread',data:{finalPrompt:finalPrompt?.substring?.(0,80),updatedVersionPrompt:updatedVersion.imagePrompt?.substring?.(0,80)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ZD'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2385',message:'About to save to database',data:{videoId,hasUpdatedStep4Data:!!updatedStep4Data,shotVersionsKeys:Object.keys(shotVersions),versionId,updatedVersionImagePrompt:updatedVersion.imagePrompt?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    // Save to database
    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2392',message:'Database save completed',data:{videoId,shotId,versionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    // Verify the save by reading back from database
    const savedVideo = await storage.getVideo(videoId);
    const savedStep4Data = savedVideo?.step4Data as Record<string, any> | undefined;
    const savedShotVersions = savedStep4Data?.shotVersions || {};
    const savedVersions = savedShotVersions[shotId] || [];
    const savedVersion = savedVersions.find((v: any) => v.id === versionId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2400',message:'Verifying database save',data:{hasSavedVideo:!!savedVideo,hasSavedStep4Data:!!savedStep4Data,hasSavedShotVersions:!!savedShotVersions[shotId],savedVersionsCount:savedVersions.length,hasSavedVersion:!!savedVersion,savedVersionImagePrompt:savedVersion?.imagePrompt?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'T'})}).catch(()=>{});
    // #endregion

    console.log('[narrative:routes] Shot version prompts updated successfully:', {
      shotId,
      versionId,
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2399',message:'About to send response',data:{success:true,versionId:updatedVersion.id,imagePrompt:updatedVersion.imagePrompt?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    res.json({
      success: true,
      version: updatedVersion,
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:2404',message:'Error caught',data:{errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    console.error('[narrative:routes] Shot version update error:', error);
    res.status(500).json({ 
      error: 'Failed to update shot version',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

router.post('/shot/generate-video', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      imageUrl,
      shotDescription,
      cameraMovement,
      action,
      duration,
      pacing,
      videoModel, // Model ID from video-models.ts (e.g., "seedance-1.0-pro")
    } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    // Get model AIR ID from video model config
    const modelConfig = VIDEO_MODEL_CONFIGS[videoModel || 'seedance-1.0-pro'];
    if (!modelConfig || !modelConfig.modelAirId) {
      return res.status(400).json({ error: `Invalid video model: ${videoModel}` });
    }

    const videoPrompt = await NarrativeAgents.generateVideoPrompt({
      shotDescription,
      cameraMovement,
      action,
      duration,
      pacing,
    });

    const videoUrl = await NarrativeAgents.generateVideo(
      imageUrl, 
      videoPrompt,
      modelConfig.modelAirId, // Pass model AIR ID to agent
      duration,
      userId,
      workspaceId
    );

    res.json({ 
      videoUrl,
      prompt: videoPrompt,
    });
  } catch (error) {
    console.error('[narrative:routes] Shot video generation error:', error);
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
