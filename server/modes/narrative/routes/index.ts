import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { NarrativeAgents } from '../agents';
import { getCameraMovementPrompt } from '../utils/camera-presets';
import { StorageCleanup } from '../utils/storage-cleanup';
import { storage } from '../../../storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { bunnyStorage } from '../../../storage/bunny-storage';
import { insertCharacterSchema, insertLocationSchema } from '@shared/schema';
import { getRunwareImageModels, getRunwareVideoModels, getAvailableTextModels } from '../../../ai/config';
import { VIDEO_MODEL_CONFIGS, getAvailableVideoModels, getDefaultVideoModel } from '../../../ai/config/video-models';
import { resolveVideoSettings } from '../utils/video-models';
import { callAi } from '../../../ai/service';

// Import modular routers
import previewRouter from './preview';

const DEBUG_LOG_PATH = join(process.cwd(), '.cursor', 'debug.log');
function debugLog(location: string, message: string, data: any, hypothesisId: string) {
  try {
    // Ensure directory exists
    const logDir = dirname(DEBUG_LOG_PATH);
    mkdirSync(logDir, { recursive: true });
    
    const logEntry = JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId,
    }) + '\n';
    appendFileSync(DEBUG_LOG_PATH, logEntry, 'utf8');
    // Also log to console as backup
    console.log(`[DEBUG] ${location}: ${message}`, data);
  } catch (e) {
    // Log to console if file logging fails
    console.error(`[DEBUG LOG ERROR] ${location}: ${message}`, data, e);
  }
}

const router = Router();

// Mount modular routers
router.use(previewRouter);

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
// CONFIGURATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/narrative/models/text
 * Get all available text models from connected providers
 */
router.get('/models/text', (_req: Request, res: Response) => {
  try {
    const textModels = getAvailableTextModels();
    res.json({ models: textModels });
  } catch (error) {
    console.error('[narrative:routes] Error getting text models:', error);
    res.status(500).json({ error: 'Failed to get text models' });
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
 * PATCH /api/narrative/videos/:id/step5
 * Save step5Data (sound settings: SFX descriptions, voiceover, music)
 * 
 * This is called with debouncing from the frontend to auto-save sound settings.
 */
router.patch('/videos/:id/step5', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const step5Updates = req.body;

    console.log('[narrative:routes] Saving step5 data:', { 
      videoId: id, 
      shotsWithSFXCount: step5Updates.shotsWithSFX ? Object.keys(step5Updates.shotsWithSFX).length : 0,
      voiceoverEnabled: step5Updates.voiceoverEnabled,
      backgroundMusicEnabled: step5Updates.backgroundMusicEnabled,
    });

    // Get existing video
    const existingVideo = await storage.getVideo(id);
    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step5Data with new data
    const existingStep5 = (existingVideo.step5Data as Record<string, any>) || {};
    
    // Deep merge for shotsWithSFX to preserve existing URLs when only updating descriptions
    const mergedShotsWithSFX = {
      ...existingStep5.shotsWithSFX,
      ...step5Updates.shotsWithSFX,
    };
    
    // For each shot, merge the properties (preserving URLs when only description is updated)
    if (step5Updates.shotsWithSFX) {
      for (const shotId of Object.keys(step5Updates.shotsWithSFX)) {
        mergedShotsWithSFX[shotId] = {
          ...existingStep5.shotsWithSFX?.[shotId],
          ...step5Updates.shotsWithSFX[shotId],
        };
      }
    }

    const updatedStep5Data = {
      ...existingStep5,
      ...step5Updates,
      shotsWithSFX: mergedShotsWithSFX,
    };

    // Update video with step5Data
    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    res.json({ success: true, step5Data: updatedStep5Data });
  } catch (error) {
    console.error('[narrative:routes] Step5 data save error:', error);
    res.status(500).json({ 
      error: 'Failed to save step5 data',
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
    
    const result = await NarrativeAgents.generateScript(
      {
        duration,
        genre,
        language,
        tone,
        userPrompt,
        model,
      },
      userId,
      workspaceId,
      'script',
      'narrative'
    );

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
      model,
      'script',
      'narrative'
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
      model,
      'script',
      'narrative'
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

    // Always use nano-banana for character image generation
    const characterModel = 'nano-banana';

    console.log('[narrative:routes] Generating character image (Agent 2.3):', { 
      characterId: finalCharacterId,
      characterName: name,
      model: characterModel,
      requestedModel: model, // Log the requested model for debugging
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
        model: characterModel, // Always use nano-banana
        negativePrompt,
        referenceImages: finalReferenceImages,
        styleReferenceImage: styleReferenceUrl,
      },
      userId,
      workspaceId,
      'assets',
      'narrative'
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

    // Always use nano-banana for location image generation
    const locationModel = 'nano-banana';

    console.log('[narrative:routes] Generating location image (Agent 2.4):', { 
      locationId: finalLocationId,
      locationName: name,
      model: locationModel,
      requestedModel: model, // Log the requested model for debugging
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
        model: locationModel, // Always use nano-banana
        negativePrompt,
        referenceImages: finalReferenceImages,
        styleReferenceImage: styleReferenceUrl,
      },
      userId,
      workspaceId,
      'assets',
      'narrative'
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
      workspaceId,
      'script',
      'narrative'
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

        // Fetch video model from step1Data (script page selection) to get available durations
        // Priority: step1Data.videoModel > step2Data.videoModel > first scene's videoModel
        let videoModelId: string | undefined;
        
        if (video.step1Data && typeof video.step1Data === 'object') {
          const step1Data = video.step1Data as any;
          if (step1Data.videoModel) {
            videoModelId = step1Data.videoModel;
            console.log('[narrative:routes] Using videoModel from step1Data:', videoModelId);
          }
        }
        
        // Fallback to step2Data or first scene's videoModel
        if (!videoModelId && video.step2Data && typeof video.step2Data === 'object') {
          const step2Data = video.step2Data as any;
          videoModelId = step2Data.videoModel || (video.step3Data as any)?.scenes?.[0]?.videoModel;
        }

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
      workspaceId,
      'video',
      'narrative'
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

    // Get imageModel from step1Data to set as default for all scenes
    let defaultImageModel: string | null = null;
    try {
      const video = await storage.getVideo(videoId);
      if (video?.step1Data && typeof video.step1Data === 'object') {
        const step1Data = video.step1Data as any;
        if (step1Data.imageModel) {
          defaultImageModel = step1Data.imageModel;
          console.log('[narrative:routes] Using imageModel from step1Data for scenes:', defaultImageModel);
        }
      }
    } catch (error) {
      console.warn('[narrative:routes] Failed to fetch imageModel from step1Data:', error);
    }

    // Serialize Date objects to ISO strings for JSONB storage
    // Set imageModel from step1Data if scene doesn't have one
    const serializedScenes = sceneResult.scenes.map(scene => ({
      ...scene,
      imageModel: scene.imageModel || defaultImageModel || null, // Inherit from step1Data if not set
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

    // IMPORTANT: Clear step4Data.prompts when breakdown is regenerated
    // Old prompts correspond to old shot IDs that no longer exist
    // This ensures prompts will be regenerated for the new shots when user clicks Continue
    const existingStep4 = (existingVideo.step4Data as Record<string, any>) || {};
    const updatedStep4Data = {
      ...existingStep4,
      prompts: {}, // Clear old prompts - they no longer match the new shots
      // Keep shotVersions since they might still be valid for some shots (user may have just modified one scene)
    };

    // Update video with step3Data AND clear step4Data.prompts
    await storage.updateVideo(videoId, { step3Data: updatedStep3Data, step4Data: updatedStep4Data });
    
    console.log('[narrative:routes] Cleared step4Data.prompts since breakdown was regenerated');

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
      continuityLocked: false,  // Always false for new breakdown
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
 * Generate image and video prompts for all shots in a scene (Agent 4.1 - Batch Mode)
 * Supports both sceneId (new batch mode) and shotId (backward compatibility - finds scene and uses batch mode)
 */
router.post('/prompts/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sceneId, shotId, videoId, model } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    
    // Validate required fields
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'videoId is required'
      });
    }
    
    if (!sceneId && !shotId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Either sceneId or shotId is required'
      });
    }
    
    console.log('[narrative:routes] Generating prompts (batch mode):', { 
      sceneId,
      shotId,
      videoId,
      model,
      userId,
      workspaceId,
    });
    
    // Fetch video from database
    let video;
    try {
      video = await storage.getVideo(videoId);
    } catch (dbError) {
      console.error('[narrative:routes] Database error fetching video:', dbError);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: dbError instanceof Error ? dbError.message : 'Failed to fetch video from database'
      });
    }
    
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
    
    // Find the scene
    let targetSceneId = sceneId;
    let foundScene: any = null;
    
    // If shotId provided instead of sceneId, find the scene containing that shot
    if (shotId && !sceneId) {
      for (const [sId, sceneShots] of Object.entries(shots)) {
        const shotArray = sceneShots as any[];
        const shot = shotArray.find((s: any) => s.id === shotId);
        if (shot) {
          targetSceneId = sId;
          break;
        }
      }
    }
    
    if (!targetSceneId) {
      return res.status(404).json({ 
        error: 'Scene not found',
        details: shotId ? `No scene found for shot: ${shotId}` : 'sceneId is required'
      });
    }
    
    foundScene = scenes.find((s: any) => s.id === targetSceneId);
    if (!foundScene) {
      return res.status(404).json({ 
        error: 'Scene not found',
        details: `No scene found with id: ${targetSceneId}`
      });
    }
    
    // Get all shots for this scene
    const sceneShots = (shots[targetSceneId] as any[]) || [];
    if (sceneShots.length === 0) {
      return res.status(404).json({ 
        error: 'No shots found',
        details: `No shots found for scene: ${targetSceneId}`
      });
    }
    
    // Sort shots by shotNumber
    const sortedShots = [...sceneShots].sort((a, b) => a.shotNumber - b.shotNumber);
    
    // Extract narrative mode from step1Data or step3Data
    const narrativeMode = step1Data.narrativeMode || step3Data.narrativeMode || 'image-reference';
    
    // Build character references map (aggregate from all shots in scene)
    const characterMap = new Map<string, any>();
    sortedShots.forEach(shot => {
      if (shot.characters && Array.isArray(shot.characters)) {
        shot.characters.forEach((charTag: string) => {
          if (!characterMap.has(charTag)) {
            // Extract character name from tag
            let charName: string;
            if (charTag.startsWith('@')) {
              const nameMatch = charTag.match(/@\{?([^}]+)\}?/);
              charName = nameMatch ? nameMatch[1] : charTag.replace('@', '');
            } else {
              charName = charTag;
            }
            
            // Find character in characters array
            const character = characters.find((c: any) => 
              c.name === charName || c.name?.toLowerCase() === charName.toLowerCase()
            );
            
            if (character) {
              characterMap.set(charTag, {
                name: character.name,
                anchor: character.appearance || character.description || character.name,
                currentOutfit: character.currentOutfit,
                keyTraits: character.personality || character.description,
                refImageUrl: character.imageUrl || character.referenceImageUrl,
              });
            } else {
              characterMap.set(charTag, {
                name: charName,
                anchor: charName,
              });
            }
          }
        });
      }
    });
    
    const characterReferences = Array.from(characterMap.values());
    
    // Build location references map (aggregate from all shots in scene)
    const locationMap = new Map<string, any>();
    sortedShots.forEach(shot => {
      if (shot.location) {
        const locationTag = shot.location;
        if (!locationMap.has(locationTag)) {
          const locationMatch = locationTag.match(/@\{?([^}]+)\}?/);
          const locationName = locationMatch ? locationMatch[1] : locationTag.replace('@', '');
          const location = locations.find((l: any) => 
            l.name === locationName || l.name?.toLowerCase() === locationName.toLowerCase()
          );
          
          if (location) {
            locationMap.set(locationTag, {
              name: location.name,
              anchor: location.description || location.name,
              refImageUrl: location.imageUrl,
            });
          }
        }
      }
    });
    
    const locationReferences = Array.from(locationMap.values());
    
    // Build style reference
    let styleReferenceObj: {
      anchor?: string;
      negativeStyle?: string;
      refImageUrl?: string;
      artStyle?: string;
    } | undefined;
    
    // Always include artStyle if it's not 'none'
    const effectiveArtStyle = artStyle && artStyle !== 'none' ? artStyle : undefined;
    
    if (artStyle === 'none' && styleReference && styleReference.length > 0) {
      styleReferenceObj = {
        refImageUrl: styleReference[0],
        artStyle: effectiveArtStyle,
      };
    } else if (cinematicInspiration) {
      styleReferenceObj = {
        anchor: cinematicInspiration,
        artStyle: effectiveArtStyle,
      };
    } else if (effectiveArtStyle) {
      // Even without cinematicInspiration or styleReference, pass artStyle
      styleReferenceObj = {
        artStyle: effectiveArtStyle,
      };
    }
    
    // Build continuity context for each shot
    const sceneContinuityGroups = continuityGroups[targetSceneId] || [];
    const continuityContexts: Array<{
      inGroup: boolean;
      groupId: string | null;
      isFirstInGroup: boolean;
      continuityConstraints?: string;
    }> = [];
    
    sortedShots.forEach((shot, index) => {
      let continuityContext = {
        inGroup: false,
        groupId: null as string | null,
        isFirstInGroup: false,
        continuityConstraints: undefined as string | undefined,
      };
      
      // Find if shot is in a continuity group
      for (const group of sceneContinuityGroups) {
        if (group.shotIds && group.shotIds.includes(shot.id)) {
          continuityContext.inGroup = true;
          continuityContext.groupId = group.id;
          continuityContext.isFirstInGroup = group.shotIds[0] === shot.id;
          continuityContext.continuityConstraints = group.description || undefined;
          break;
        }
      }
      
      continuityContexts.push(continuityContext);
    });
    
    // Build shots input with proper tagging
    const shotsInput = sortedShots.map(shot => {
      // Tag characters if needed
      const taggedCharacters = shot.characters
        ? shot.characters.map((charTag: string) => {
            if (charTag.startsWith('@')) {
              return charTag;
            }
            return `@{${charTag}}`;
          })
        : [];
      
      const description = shot.description || '';
      
      return {
        id: shot.id,
        sceneId: targetSceneId,
        sceneTitle: foundScene.title,
        shotNumber: shot.shotNumber,
        duration: shot.duration,
        shotType: shot.shotType,
        cameraMovement: shot.cameraMovement,
        actionDescription: description,
        characters: taggedCharacters.length > 0 ? taggedCharacters : (shot.characters || []),
        location: shot.location || '',
        frameMode: shot.frameMode,
      };
    });
    
    // Build input for agent
    const agentInput: import('../agents').PromptEngineerInput = {
      sceneId: targetSceneId,
      sceneTitle: foundScene.title,
      shots: shotsInput,
      narrativeMode,
      continuity: continuityContexts,
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
    
    // Call agent (returns array of prompts)
    const results = await NarrativeAgents.generatePrompts(
      agentInput,
      userId,
      workspaceId,
      'script',
      'narrative'
    );
    
    res.json(results);
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
    
    // Ensure response is not already sent
    if (res.headersSent) {
      console.warn('[narrative:routes] Response already sent, skipping');
      return;
    }

    const { 
      shotId, 
      videoId, 
      versionId, 
      imagePrompt, 
      videoPrompt, 
      startFramePrompt, 
      endFramePrompt, 
      negativePrompt,
      // Per-frame advanced settings
      startFrameNegativePrompt,
      endFrameNegativePrompt,
      startFrameSeed,
      endFrameSeed,
      startFrameGuidanceScale,
      endFrameGuidanceScale,
      startFrameSteps,
      endFrameSteps,
      startFrameStrength,
      endFrameStrength,
      frame,
      imageModel: requestImageModel, // Allow frontend to override image model
      shotReferenceImageUrl, // Shot-level reference image (temporary blob URL)
      shot: requestShot // Shot data from frontend (for manually created shots not yet in database)
    } = req.body;
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
      
      // CRITICAL: Re-fetch latest step4Data before saving prompts to prevent race conditions
      const latestVideoForPrompts = await storage.getVideo(videoId);
      const latestStep4DataForPrompts = (latestVideoForPrompts?.step4Data as Record<string, any>) || {};
      const latestPromptsForPrompts = latestStep4DataForPrompts.prompts || {};
      
      // Merge the updated prompts for this shot with the latest data
      latestPromptsForPrompts[shotId] = prompts[shotId];
      
      step4Data = {
        ...latestStep4DataForPrompts,
        prompts: latestPromptsForPrompts,
      };
      
      // Save updated prompts to database before generating
      await storage.updateVideo(videoId, { step4Data });
    }

    // Get aspect ratio from step1Data
    const aspectRatio = step1Data.aspectRatio || '16:9';

    // Get narrative mode
    const narrativeMode = step1Data.narrativeMode || 'image-reference';

    // Find shot in step3Data, or use shot from request body if manually created
    // We need to do this first to check if it's a manually created shot
    const allShots: any[] = Object.values(step3Data.shots || {}).flat();
    let foundShot = allShots.find((s: any) => s.id === shotId);
    let isManuallyCreatedShot = false;
    
    // If shot not found in database, use shot from request body (manually created shot)
    if (!foundShot) {
      if (requestShot && requestShot.id === shotId) {
        foundShot = requestShot;
        isManuallyCreatedShot = true;
        console.log('[narrative:routes] Using manually created shot from request body:', shotId);
      } else {
        return res.status(404).json({ error: 'Shot not found' });
      }
    }

    // Get prompts for this shot from step4Data (now updated if provided in request)
    // Prioritize prompts from request body over database prompts (request body is more recent)
    let shotPrompts = step4Data.prompts?.[shotId] || {};
    
    // If prompts provided in request body, use them (they override database prompts)
    if (imagePrompt !== undefined || videoPrompt !== undefined || startFramePrompt !== undefined || endFramePrompt !== undefined) {
      shotPrompts = {
        ...shotPrompts, // Start with database prompts as base
        ...(imagePrompt !== undefined && { imagePrompt }),
        ...(videoPrompt !== undefined && { videoPrompt }),
        ...(startFramePrompt !== undefined && { startFramePrompt }),
        ...(endFramePrompt !== undefined && { endFramePrompt }),
        ...(negativePrompt !== undefined && { negativePrompt }),
      };
      console.log('[narrative:routes] Using prompts from request body (overriding database):', shotId);
    }
    
    // For manually created shots without prompts, use shot description as fallback
    if (!shotPrompts && isManuallyCreatedShot && foundShot.description) {
      const shotDescription = foundShot.description || 'A scene from the story';
      shotPrompts = {
        imagePrompt: shotDescription,
        startFramePrompt: shotDescription,
        endFramePrompt: shotDescription,
        videoPrompt: shotDescription,
        negativePrompt: undefined,
      };
      console.log('[narrative:routes] Using shot description as fallback prompt for manually created shot:', shotId);
    }
    
    // If still no prompts, return error (prompts are required for generation)
    if (!shotPrompts) {
      return res.status(400).json({ error: 'Prompts not found for this shot. Please generate prompts first.' });
    }

    // Find scene
    const scenes = step3Data.scenes || [];
    let foundScene = scenes.find((s: any) => s.id === foundShot.sceneId);
    
    // If scene not found but we have a shot with sceneId, create a minimal scene object
    if (!foundScene && foundShot.sceneId) {
      // For manually created shots, create a minimal scene object
      foundScene = {
        id: foundShot.sceneId,
        videoId: videoId,
        sceneNumber: 1,
        title: 'New Scene',
        description: '',
        imageModel: null,
        videoModel: null,
        duration: null,
      };
      console.log('[narrative:routes] Created minimal scene object for manually created shot:', foundShot.sceneId);
    }
    
    if (!foundScene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get image model (will be updated below to use per-frame settings from currentVersion)
    // Priority: request override > version per-frame > shot-level > scene-level > step1Data > default
    // Note: currentVersion will be available later after shotVersions are retrieved
    // Get default image model from step1Data (script page selection)
    const defaultImageModelFromStep1 = step1Data.imageModel || 'nano-banana';
    let imageModel = requestImageModel || foundShot.imageModel || foundScene.imageModel || defaultImageModelFromStep1;

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

    // Shot-level reference image (uploaded by user, temporary blob URL)
    if (shotReferenceImageUrl) {
      referenceImages.push(shotReferenceImageUrl);
    }

    // Get current shot's version to check existing frames and for validation
    const shotVersions = step4Data.shotVersions || {};
    const currentShotVersions = shotVersions[shotId] || [];
    const currentVersion = versionId 
      ? currentShotVersions.find((v: any) => v.id === versionId)
      : currentShotVersions[currentShotVersions.length - 1];

    // Determine frame type early (needed for per-frame image model selection)
    // Determine frame type based on user request
    // IMPORTANT: Each frame is generated in a separate API call
    // Never generate both frames in one call when user explicitly requests a frame
    let frameType: "start-only" | "end-only" | "start-and-end" | undefined = undefined;
    
    // If user explicitly requested a specific frame, use that (never "start-and-end")
    if (frame === 'start' || frame === 'end') {
      if (frame === 'start') {
        frameType = "start-only";
      } else if (frame === 'end') {
        frameType = "end-only";
      }
    } else if (narrativeMode === 'start-end' || narrativeMode === 'auto') {
      // Only use "start-and-end" if user didn't specify a frame (backward compatibility)
      // This should rarely happen in normal flow since UI always passes frame parameter
      // We'll determine this later after checking continuity groups
      // For now, default to undefined - will be set below
    }

    // Update image model with per-frame settings if available
    // Priority: request override > version per-frame > shot-level > scene-level > default
    if (!requestImageModel && currentVersion && narrativeMode === 'start-end') {
      // Determine which frame is being generated (use frameType if set, otherwise infer from frame)
      // Note: frameType may not be fully determined yet (start-and-end is set later), so we check frame directly
      const isGeneratingStartFrame = frame === 'start' || frameType === 'start-only';
      const isGeneratingEndFrame = frame === 'end' || frameType === 'end-only';
      
      // Use per-frame image model if available
      if (isGeneratingStartFrame && currentVersion.startFrameImageModel) {
        imageModel = currentVersion.startFrameImageModel;
      } else if (isGeneratingEndFrame && currentVersion.endFrameImageModel) {
        imageModel = currentVersion.endFrameImageModel;
      }
    }
    
    // Log model selection for debugging
    console.log('[narrative:routes] Image model selection:', {
      shotId,
      frame,
      frameType,
      requestImageModel: requestImageModel || null,
      versionStartFrameImageModel: currentVersion?.startFrameImageModel || null,
      versionEndFrameImageModel: currentVersion?.endFrameImageModel || null,
      shotImageModel: foundShot.imageModel || null,
      sceneImageModel: foundScene.imageModel || null,
      selectedModel: imageModel,
      source: requestImageModel ? 'request' 
        : (currentVersion?.startFrameImageModel && (frame === 'start' || frameType === 'start-only')) ? 'version-start-frame'
        : (currentVersion?.endFrameImageModel && (frame === 'end' || frameType === 'end-only')) ? 'version-end-frame'
        : foundShot.imageModel ? 'shot' 
        : foundScene.imageModel ? 'scene' 
        : 'default',
    });

    // Continuity Reference Image Collection
    // If shot is in a continuity group and not the first shot, include previous shot's frame
    const continuityGroups = step3Data.continuityGroups || {};
    const sceneContinuityGroups = continuityGroups[foundScene.id] || [];
    let previousFrameUrl: string | null = null;
    let isInContinuityGroup = false;
    let previousShotId: string | null = null;
    let previousVersion: any = null;

    for (const group of sceneContinuityGroups) {
      if (group.shotIds && group.shotIds.includes(shotId)) {
        isInContinuityGroup = true;
        const shotIndex = group.shotIds.indexOf(shotId);
        if (shotIndex > 0) {
          // Not first in group - get previous shot's frame
          previousShotId = group.shotIds[shotIndex - 1];
          
          // CRITICAL: Re-fetch latest shotVersions from database to get the most recent data
          // During "Generate All Images", previous shots may have just finished and saved
          const freshVideoForPrev = await storage.getVideo(videoId);
          const freshStep4Data = (freshVideoForPrev?.step4Data as Record<string, any>) || {};
          const freshShotVersions = freshStep4Data.shotVersions || {};
          
          // Get previous shot's version from freshly fetched shotVersions
          const previousShotVersions = previousShotId ? (freshShotVersions[previousShotId] || []) : [];
          
          // Get the latest version (most recent is last in array)
          previousVersion = previousShotVersions.length > 0 
            ? previousShotVersions[previousShotVersions.length - 1] 
            : null;
          
          // SOFT CHECK: Log warning if previous shot doesn't have frames, but don't block
          // This allows "Generate All Images" to work even if previous shot hasn't finished
          // The generation will proceed without the reference image for continuity
          if (narrativeMode === 'start-end' || narrativeMode === 'auto') {
            if (!previousVersion || (!previousVersion.endFrameUrl && !previousVersion.startFrameUrl && !previousVersion.imageUrl)) {
              console.warn('[narrative:routes] Previous shot has no frames yet:', {
                currentShotId: shotId,
                previousShotId,
                hasVersion: !!previousVersion,
                message: 'Continuing generation without continuity reference image',
              });
              // Don't return 400 - allow generation to proceed without reference
            }
          }
          
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

    // Validation: Check if end frame can be generated (requires start frame to exist)
    // For connected shots, the start frame is inherited from previous shot's end frame
    if (frame === 'end' && narrativeMode !== 'image-reference') {
      // Check if current shot has its own start frame
      const hasOwnStartFrame = currentVersion && currentVersion.startFrameUrl;
      
      // Check if start frame is inherited from previous shot (for connected shots)
      const hasInheritedStartFrame = isInContinuityGroup && previousVersion && 
        (previousVersion.endFrameUrl || previousVersion.startFrameUrl || previousVersion.imageUrl);
      
      // SOFT CHECK: Log warning but allow generation to proceed
      // This enables "Generate All Images" to work even if previous shot failed
      // The generation will proceed without the start frame reference for visual consistency
      if (!hasOwnStartFrame && !hasInheritedStartFrame) {
        console.warn('[narrative:routes] End frame generation without start frame reference:', {
          shotId,
          hasOwnStartFrame,
          hasInheritedStartFrame,
          isInContinuityGroup,
          hasPreviousVersion: !!previousVersion,
          message: 'Proceeding with generation - visual consistency may be affected',
        });
        // Don't return 400 - allow generation to proceed
      }
    }

    // Complete frame type determination (if not already set above)
    // This handles the case where frame wasn't provided and we need to check continuity groups
    if (!frameType && (narrativeMode === 'start-end' || narrativeMode === 'auto')) {
      // Only use "start-and-end" if user didn't specify a frame (backward compatibility)
      // This should rarely happen in normal flow since UI always passes frame parameter
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
      // If not in a group, generate both frames (only if frame parameter not provided)
      if (!frameType) {
        frameType = "start-and-end";
      }
    }

    // When generating end frame separately, include existing start frame as reference
    // This ensures visual continuity between start and end frames
    if (frameType === "end-only" && currentVersion && currentVersion.startFrameUrl) {
      // Add existing start frame to reference images for end frame generation
      if (!referenceImages.includes(currentVersion.startFrameUrl)) {
        referenceImages.push(currentVersion.startFrameUrl);
        console.log('[narrative:routes] Added existing start frame as reference for end frame generation:', {
          shotId,
          startFrameUrl: currentVersion.startFrameUrl.substring(0, 50) + '...',
        });
      }
    }

    // Validate that required prompts exist for the requested frame type
    // Use shot description as fallback if no prompt is available
    if (frameType === "start-only" || frameType === "start-and-end") {
      if (!shotPrompts.startFramePrompt || shotPrompts.startFramePrompt.trim() === "") {
        // Use shot description as fallback for any shot
        if (foundShot.description) {
          shotPrompts.startFramePrompt = foundShot.description;
          console.log('[narrative:routes] Using shot description as fallback for start frame prompt');
        } else {
          return res.status(400).json({ 
            error: 'Start frame prompt is required but not found. Please enter a prompt or generate prompts using Agent 4.1.' 
          });
        }
      }
    }
    if (frameType === "end-only" || frameType === "start-and-end") {
      if (!shotPrompts.endFramePrompt || shotPrompts.endFramePrompt.trim() === "") {
        // Try fallbacks in order: startFramePrompt -> shot description -> error
        // This allows users to generate end frames without running Agent 4.1 first
        if (shotPrompts.startFramePrompt && shotPrompts.startFramePrompt.trim() !== "") {
          // Use start frame prompt as base for end frame (same scene, different moment)
          shotPrompts.endFramePrompt = shotPrompts.startFramePrompt;
          console.log('[narrative:routes] Using start frame prompt as fallback for end frame prompt');
        } else if (foundShot.description) {
          // Use shot description as fallback
          shotPrompts.endFramePrompt = foundShot.description;
          console.log('[narrative:routes] Using shot description as fallback for end frame prompt');
        } else {
          return res.status(400).json({ 
            error: 'End frame prompt is required but not found. Please enter a prompt or generate prompts using Agent 4.1.' 
          });
        }
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
      // Per-frame advanced settings (from request body or current version)
      startFrameNegativePrompt: startFrameNegativePrompt ?? currentVersion?.startFrameNegativePrompt,
      endFrameNegativePrompt: endFrameNegativePrompt ?? currentVersion?.endFrameNegativePrompt,
      startFrameSeed: startFrameSeed !== undefined ? startFrameSeed : currentVersion?.startFrameSeed,
      endFrameSeed: endFrameSeed !== undefined ? endFrameSeed : currentVersion?.endFrameSeed,
      startFrameGuidanceScale: startFrameGuidanceScale !== undefined ? startFrameGuidanceScale : currentVersion?.startFrameGuidanceScale,
      endFrameGuidanceScale: endFrameGuidanceScale !== undefined ? endFrameGuidanceScale : currentVersion?.endFrameGuidanceScale,
      startFrameSteps: startFrameSteps !== undefined ? startFrameSteps : currentVersion?.startFrameSteps,
      endFrameSteps: endFrameSteps !== undefined ? endFrameSteps : currentVersion?.endFrameSteps,
      startFrameStrength: startFrameStrength !== undefined ? startFrameStrength : currentVersion?.startFrameStrength,
      endFrameStrength: endFrameStrength !== undefined ? endFrameStrength : currentVersion?.endFrameStrength,
      referenceImages,
      aspectRatio,
      imageModel,
      frameType,
    };

    // Call Agent 4.2
    let result;
    try {
      result = await NarrativeAgents.generateStoryboardImage(
        agentInput,
        userId,
        workspaceId,
        'image',
        'narrative'
      );
    } catch (agentError) {
      console.error('[narrative:routes] Agent 4.2 error:', agentError);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'Image generation agent failed',
          details: agentError instanceof Error ? agentError.message : 'Unknown agent error'
        });
      }
      return;
    }

    if (result.error) {
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: result.error,
          details: 'Image generation failed'
        });
      }
      return;
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

    // Create or update shot version
    // Reuse shotVersions from earlier (line 2224) - no need to redeclare
    const existingVersions = shotVersions[shotId] || [];
    
    // Extract character IDs that appear in this frame
    // Priority: 1) shot.characters array, 2) character mentions in prompt text
    const extractCharacterIds = (promptText?: string): string[] => {
      const characterIds: string[] = [];
      const allCharacters = step2Data.characters || [];
      
      // Method 1: Extract from shot.characters array (if available)
      if (foundShot.characters && Array.isArray(foundShot.characters)) {
        for (const charName of foundShot.characters) {
          const cleanName = charName.replace(/^@\{?([^}]+)\}?$/, '$1');
          const character = allCharacters.find((c: any) => c.name === cleanName);
          if (character && character.id) {
            characterIds.push(character.id);
          }
        }
      }
      
      // Method 2: Extract from prompt text by matching character names
      if (promptText && characterIds.length === 0) {
        for (const character of allCharacters) {
          if (character.name && promptText.includes(character.name)) {
            if (!characterIds.includes(character.id)) {
              characterIds.push(character.id);
            }
          }
        }
      }
      
      return characterIds;
    };
    
    // Determine which prompt to use for character extraction based on frame type
    let promptForCharacterExtraction: string | undefined;
    if (frame === 'start' || frameType === 'start-only') {
      promptForCharacterExtraction = shotPrompts.startFramePrompt || shotPrompts.imagePrompt;
    } else if (frame === 'end' || frameType === 'end-only') {
      promptForCharacterExtraction = shotPrompts.endFramePrompt || shotPrompts.imagePrompt;
    } else {
      promptForCharacterExtraction = shotPrompts.imagePrompt;
    }
    
    const extractedCharacterIds = extractCharacterIds(promptForCharacterExtraction);
    
    let newVersionId: string;
    let versionNumber: number;
    let newVersion: any;

    // Check if version exists (for update vs create)
    const existingVersionIndex = versionId ? existingVersions.findIndex((v: any) => v.id === versionId) : -1;
    const existingVersion = existingVersionIndex >= 0 ? existingVersions[existingVersionIndex] : null;

    if (versionId && existingVersion) {
      // Update existing version
      newVersionId = versionId;
      versionNumber = existingVersion.versionNumber;
      
      // Only update frame URLs that were actually generated
      // Preserve existing URLs for frames that weren't generated
      const updatedStartFrameUrl = result.startFrameUrl !== null && result.startFrameUrl !== undefined
        ? result.startFrameUrl
        : existingVersion.startFrameUrl;
      
      const updatedEndFrameUrl = result.endFrameUrl !== null && result.endFrameUrl !== undefined
        ? result.endFrameUrl
        : existingVersion.endFrameUrl;
      
      // Update character IDs based on which frame was generated
      let updatedCharacters = existingVersion.characters || [];
      let updatedStartFrameCharacters = existingVersion.startFrameCharacters || [];
      let updatedEndFrameCharacters = existingVersion.endFrameCharacters || [];
      
      if (frame === 'start' || frameType === 'start-only') {
        // Start frame was generated - update start frame characters
        updatedStartFrameCharacters = extractedCharacterIds.length > 0 ? extractedCharacterIds : existingVersion.startFrameCharacters || [];
        // Also update general characters if this is the first frame or if no general characters exist
        if (!existingVersion.characters || existingVersion.characters.length === 0) {
          updatedCharacters = extractedCharacterIds;
        }
      } else if (frame === 'end' || frameType === 'end-only') {
        // End frame was generated - update end frame characters
        updatedEndFrameCharacters = extractedCharacterIds.length > 0 ? extractedCharacterIds : existingVersion.endFrameCharacters || [];
        // Also update general characters if no general characters exist
        if (!existingVersion.characters || existingVersion.characters.length === 0) {
          updatedCharacters = extractedCharacterIds;
        }
      } else {
        // General image (image-reference mode) - update general characters
        updatedCharacters = extractedCharacterIds.length > 0 ? extractedCharacterIds : existingVersion.characters || [];
      }
      
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
        // Update per-frame advanced settings if provided
        startFrameNegativePrompt: startFrameNegativePrompt !== undefined ? startFrameNegativePrompt : existingVersion.startFrameNegativePrompt,
        endFrameNegativePrompt: endFrameNegativePrompt !== undefined ? endFrameNegativePrompt : existingVersion.endFrameNegativePrompt,
        startFrameSeed: startFrameSeed !== undefined ? startFrameSeed : existingVersion.startFrameSeed,
        endFrameSeed: endFrameSeed !== undefined ? endFrameSeed : existingVersion.endFrameSeed,
        startFrameGuidanceScale: startFrameGuidanceScale !== undefined ? startFrameGuidanceScale : existingVersion.startFrameGuidanceScale,
        endFrameGuidanceScale: endFrameGuidanceScale !== undefined ? endFrameGuidanceScale : existingVersion.endFrameGuidanceScale,
        startFrameSteps: startFrameSteps !== undefined ? startFrameSteps : existingVersion.startFrameSteps,
        endFrameSteps: endFrameSteps !== undefined ? endFrameSteps : existingVersion.endFrameSteps,
        startFrameStrength: startFrameStrength !== undefined ? startFrameStrength : existingVersion.startFrameStrength,
        endFrameStrength: endFrameStrength !== undefined ? endFrameStrength : existingVersion.endFrameStrength,
        // Update character tracking
        characters: updatedCharacters.length > 0 ? updatedCharacters : null,
        startFrameCharacters: updatedStartFrameCharacters.length > 0 ? updatedStartFrameCharacters : null,
        endFrameCharacters: updatedEndFrameCharacters.length > 0 ? updatedEndFrameCharacters : null,
        // Ensure status is updated to completed if generation succeeded
        status: "completed",
        needsRerender: false,
      };
      
      existingVersions[existingVersionIndex] = newVersion;
    } else {
      // Create new version
      newVersionId = `version-${shotId}-${Date.now()}`;
      versionNumber = existingVersions.length + 1;
      
      // Determine character IDs for this new version based on frame type
      let versionCharacters: string[] | null = null;
      let startFrameChars: string[] | null = null;
      let endFrameChars: string[] | null = null;
      
      if (frame === 'start' || frameType === 'start-only') {
        startFrameChars = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
        versionCharacters = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
      } else if (frame === 'end' || frameType === 'end-only') {
        endFrameChars = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
        versionCharacters = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
      } else {
        // General image (image-reference mode) or start-and-end
        versionCharacters = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
        if (frameType === 'start-and-end') {
          // For start-and-end, both frames might have same characters initially
          startFrameChars = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
          endFrameChars = extractedCharacterIds.length > 0 ? extractedCharacterIds : null;
        }
      }
      
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
        // Per-frame advanced settings
        startFrameNegativePrompt: startFrameNegativePrompt ?? null,
        endFrameNegativePrompt: endFrameNegativePrompt ?? null,
        startFrameSeed: startFrameSeed ?? null,
        endFrameSeed: endFrameSeed ?? null,
        startFrameGuidanceScale: startFrameGuidanceScale ?? null,
        endFrameGuidanceScale: endFrameGuidanceScale ?? null,
        startFrameSteps: startFrameSteps ?? null,
        endFrameSteps: endFrameSteps ?? null,
        startFrameStrength: startFrameStrength ?? null,
        endFrameStrength: endFrameStrength ?? null,
        // Character tracking
        characters: versionCharacters,
        startFrameCharacters: startFrameChars,
        endFrameCharacters: endFrameChars,
        status: "completed",
        needsRerender: false,
        createdAt: new Date().toISOString(),
      };
      
      existingVersions.push(newVersion);
    }

    // Use Runware URLs directly (no Bunny CDN upload for shot images)
    // The newVersion object already has the correct URLs set from lines 2239-2249 or 2257-2269
    // For existing versions, preservation is already handled at lines 2231-2237

    // CRITICAL: Re-fetch the latest step4Data from database to prevent race conditions
    // During image generation (10-30+ seconds), other requests may have updated other shots
    // We must merge with the latest data, not overwrite with stale data
    try {
      const latestVideo = await storage.getVideo(videoId);
      const latestStep4Data = (latestVideo?.step4Data as Record<string, any>) || {};
      const latestShotVersions = latestStep4Data.shotVersions || {};
      
      // Only update this specific shot's versions, preserving all other shots' data
      latestShotVersions[shotId] = existingVersions;
      
      const updatedStep4Data = {
        ...latestStep4Data,
        shotVersions: latestShotVersions,
      };

      // Save to database
      await storage.updateVideo(videoId, { step4Data: updatedStep4Data });
      
      console.log('[narrative:routes] Saved with race-condition protection:', {
        shotId,
        totalShotsInVersions: Object.keys(latestShotVersions).length,
      });
    } catch (dbError) {
      console.error('[narrative:routes] Database save error:', dbError);
      // Continue anyway - image was generated successfully, just couldn't save to DB
      // Log warning but don't fail the request
    }

    console.log('[narrative:routes] Storyboard image generated successfully:', {
      shotId,
      versionId: newVersion.id,
      hasImageUrl: !!newVersion.imageUrl,
      hasStartFrame: !!newVersion.startFrameUrl,
      hasEndFrame: !!newVersion.endFrameUrl,
      cost: result.cost,
      usingRunwareUrls: true,
    });

    // Ensure response hasn't been sent already
    if (!res.headersSent) {
      res.json({
        imageUrl: newVersion.imageUrl,
        startFrameUrl: newVersion.startFrameUrl,
        endFrameUrl: newVersion.endFrameUrl,
        shotVersionId: newVersion.id,
        version: newVersion,
        cost: result.cost,
      });
    } else {
      console.warn('[narrative:routes] Response already sent, cannot send success response');
    }
  } catch (error) {
    console.error('[narrative:routes] Storyboard image generation error:', error);
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate storyboard image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      console.error('[narrative:routes] Cannot send error response - headers already sent');
    }
  }
});

/**
 * POST /api/narrative/videos/:videoId/shots/:shotId/edit-image
 * Edit a storyboard image based on user instructions (Agent 4.3)
 */
router.post('/videos/:videoId/shots/:shotId/edit-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, shotId } = req.params;
    const {
      versionId,
      editCategory,
      editingInstruction,
      referenceImages = [],
      characterId,
      imageModel,
      activeFrame, // For start-end mode: "start" or "end"
    } = req.body;

    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    if (!versionId || !editCategory || !editingInstruction || !imageModel) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['versionId', 'editCategory', 'editingInstruction', 'imageModel']
      });
    }

    console.log('[narrative:routes] Editing image (Agent 4.3):', {
      videoId,
      shotId,
      versionId,
      editCategory,
      model: imageModel,
      userId,
      workspaceId,
    });

    // Fetch video from database
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step data
    const step1Data = (video.step1Data as Record<string, any>) || {};
    const step2Data = (video.step2Data as Record<string, any>) || {};
    const step4Data = (video.step4Data as Record<string, any>) || {};

    // Get aspect ratio from step1Data
    const aspectRatio = step1Data.aspectRatio || '16:9';

    // Get shot versions
    const shotVersions = step4Data.shotVersions || {};
    const existingVersions = shotVersions[shotId] || [];

    // Find the version to edit
    const versionToEdit = existingVersions.find((v: any) => v.id === versionId);
    if (!versionToEdit) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Get the original image URL based on mode and active frame
    let originalImageUrl: string | null | undefined;
    if (activeFrame === "start") {
      originalImageUrl = versionToEdit.startFrameUrl;
    } else if (activeFrame === "end") {
      originalImageUrl = versionToEdit.endFrameUrl;
    } else {
      // Fallback: for image-reference mode, use imageUrl; otherwise try startFrameUrl or endFrameUrl
      originalImageUrl = versionToEdit.imageUrl || versionToEdit.startFrameUrl || versionToEdit.endFrameUrl;
    }
    
    if (!originalImageUrl) {
      let detailsMessage: string;
      if (activeFrame) {
        detailsMessage = `The selected version does not have a ${activeFrame} frame`;
      } else {
        detailsMessage = 'The selected version does not have an image';
      }
      return res.status(400).json({ 
        error: 'No image found in the selected version',
        details: detailsMessage
      });
    }

    // Get character name and appearance if characterId is provided
    let characterName: string | undefined;
    let characterAppearance: string | undefined;
    if (characterId) {
      const characters = step2Data.characters || [];
      const character = characters.find((c: any) => c.id === characterId);
      characterName = character?.name;
      characterAppearance = character?.appearance;
    }

    // Collect reference images (character, location, style refs from step2Data)
    // IMPORTANT: The originalImageUrl is passed separately to the agent, which will prepend it to referenceImages
    // So we only collect additional reference images here (character, style, etc.)
    const allReferenceImages: string[] = [...referenceImages];
    
    // For character-specific edits, include character image as SECOND reference
    // (after original shot image) to help identify which character to edit
    // The original shot image remains the primary/base image for editing
    if (characterId && (editCategory === "clothes" || editCategory === "expression" || editCategory === "figure")) {
      const characters = step2Data.characters || [];
      const character = characters.find((c: any) => c.id === characterId);
      if (character?.imageUrl) {
        // Add character image as identification reference (will be after original image in final array)
        allReferenceImages.push(character.imageUrl);
      }
    } else if (characterId) {
      // For non-character-specific edits, include character image normally
      const characters = step2Data.characters || [];
      const character = characters.find((c: any) => c.id === characterId);
      if (character?.imageUrl) {
        allReferenceImages.push(character.imageUrl);
      }
    }

    // Add location reference images (if shot has location)
    // This would require getting shot data from step3Data, but for now we'll use provided refs

    // Add style reference if available
    if (step2Data.artStyleImageUrl) {
      allReferenceImages.push(step2Data.artStyleImageUrl);
    }

    // Log for debugging
    console.log('[narrative:routes] Image editing request:', {
      shotId,
      versionId,
      originalImageUrl,
      activeFrame,
      characterId,
      characterName,
      referenceImagesCount: allReferenceImages.length,
      editCategory,
    });

    // Call Agent 4.3: Image Editor
    // The agent will prepend originalImageUrl to allReferenceImages when calling the API
    const editResult = await NarrativeAgents.editImage(
      {
        originalImageUrl,
        editingInstruction,
        editCategory,
        referenceImages: allReferenceImages,
        characterId,
        characterName,
        characterAppearance,
        shotId,
        videoId,
        aspectRatio,
        imageModel,
      },
      userId,
      workspaceId,
      'image',
      'narrative'
    );

    if (editResult.error) {
      return res.status(400).json({ 
        error: 'Image editing failed',
        details: editResult.error
      });
    }

    // Create new version with edited image
    const newVersionId = `version-${shotId}-${Date.now()}`;
    const versionNumber = existingVersions.length + 1;

    // Determine which frame URL to update based on activeFrame (for start-end mode) or original version structure
    let imageUrl: string | null = null;
    let startFrameUrl: string | null = null;
    let endFrameUrl: string | null = null;
    
    if (activeFrame === "start") {
      // Editing start frame - update startFrameUrl only
      startFrameUrl = editResult.editedImageUrl;
      endFrameUrl = versionToEdit.endFrameUrl || null;
    } else if (activeFrame === "end") {
      // Editing end frame - update endFrameUrl only
      startFrameUrl = versionToEdit.startFrameUrl || null;
      endFrameUrl = editResult.editedImageUrl;
    } else {
      // Image-reference mode - update imageUrl
      imageUrl = versionToEdit.imageUrl ? editResult.editedImageUrl : null;
      startFrameUrl = versionToEdit.startFrameUrl || null;
      endFrameUrl = versionToEdit.endFrameUrl || null;
    }
    
    const newVersion: any = {
      id: newVersionId,
      shotId,
      versionNumber,
      imageUrl,
      startFrameUrl,
      endFrameUrl,
      // Copy prompts from original version
      imagePrompt: versionToEdit.imagePrompt,
      startFramePrompt: versionToEdit.startFramePrompt,
      endFramePrompt: versionToEdit.endFramePrompt,
      videoPrompt: versionToEdit.videoPrompt,
      negativePrompt: versionToEdit.negativePrompt,
      // Copy per-frame advanced settings
      startFrameNegativePrompt: versionToEdit.startFrameNegativePrompt,
      endFrameNegativePrompt: versionToEdit.endFrameNegativePrompt,
      startFrameSeed: versionToEdit.startFrameSeed,
      endFrameSeed: versionToEdit.endFrameSeed,
      startFrameGuidanceScale: versionToEdit.startFrameGuidanceScale,
      endFrameGuidanceScale: versionToEdit.endFrameGuidanceScale,
      startFrameSteps: versionToEdit.startFrameSteps,
      endFrameSteps: versionToEdit.endFrameSteps,
      startFrameStrength: versionToEdit.startFrameStrength,
      endFrameStrength: versionToEdit.endFrameStrength,
      status: "completed",
      needsRerender: false,
      createdAt: new Date().toISOString(),
      // Store editing metadata
      editedFromVersionId: versionId,
      editCategory,
      editingInstruction,
      editingModel: imageModel,
    };

    existingVersions.push(newVersion);

    // CRITICAL: Re-fetch the latest step4Data to prevent race conditions
    // During image editing, other requests may have updated other shots
    const latestVideoForEdit = await storage.getVideo(videoId);
    const latestStep4DataForEdit = (latestVideoForEdit?.step4Data as Record<string, any>) || {};
    const latestShotVersionsForEdit = latestStep4DataForEdit.shotVersions || {};
    
    // Only update this specific shot's versions, preserving all other shots' data
    latestShotVersionsForEdit[shotId] = existingVersions;

    // Update step4Data
    const updatedStep4Data = {
      ...latestStep4DataForEdit,
      shotVersions: latestShotVersionsForEdit,
    };

    // Save to database
    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[narrative:routes] Image edited successfully:', {
      shotId,
      originalVersionId: versionId,
      newVersionId: newVersion.id,
      hasEditedImage: !!editResult.editedImageUrl,
      cost: editResult.cost,
    });

    res.json({
      editedImageUrl: editResult.editedImageUrl,
      newVersionId: newVersion.id,
      version: newVersion,
      cost: editResult.cost,
    });
  } catch (error) {
    console.error('[narrative:routes] Image editing error:', error);
    res.status(500).json({ 
      error: 'Failed to edit image',
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
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shotId, versionId } = req.params;
    const { 
      imagePrompt, 
      videoPrompt, 
      startFramePrompt, 
      endFramePrompt, 
      negativePrompt,
      // Per-frame advanced settings
      startFrameNegativePrompt,
      endFrameNegativePrompt,
      startFrameSeed,
      endFrameSeed,
      startFrameGuidanceScale,
      endFrameGuidanceScale,
      startFrameSteps,
      endFrameSteps,
      startFrameStrength,
      endFrameStrength,
    } = req.body;

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
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // Fetch video from database
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step4Data
    const step4Data = (video.step4Data as Record<string, any>) || {};
    const shotVersions = step4Data.shotVersions || {};
    const existingVersions = shotVersions[shotId] || [];

    // Find the version to update
    const versionIndex = existingVersions.findIndex((v: any) => v.id === versionId);
    if (versionIndex === -1) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Update the version with new prompt values
    const existingVersion = existingVersions[versionIndex];
    const updatedVersion = {
      ...existingVersion,
      ...(imagePrompt !== undefined && { imagePrompt }),
      ...(videoPrompt !== undefined && { videoPrompt }),
      ...(startFramePrompt !== undefined && { startFramePrompt }),
      ...(endFramePrompt !== undefined && { endFramePrompt }),
      ...(negativePrompt !== undefined && { negativePrompt }),
      // Per-frame advanced settings
      ...(startFrameNegativePrompt !== undefined && { startFrameNegativePrompt }),
      ...(endFrameNegativePrompt !== undefined && { endFrameNegativePrompt }),
      ...(startFrameSeed !== undefined && { startFrameSeed }),
      ...(endFrameSeed !== undefined && { endFrameSeed }),
      ...(startFrameGuidanceScale !== undefined && { startFrameGuidanceScale }),
      ...(endFrameGuidanceScale !== undefined && { endFrameGuidanceScale }),
      ...(startFrameSteps !== undefined && { startFrameSteps }),
      ...(endFrameSteps !== undefined && { endFrameSteps }),
      ...(startFrameStrength !== undefined && { startFrameStrength }),
      ...(endFrameStrength !== undefined && { endFrameStrength }),
    };

    existingVersions[versionIndex] = updatedVersion;

    // CRITICAL: Re-fetch latest step4Data to prevent race conditions
    // During this request, other requests may have updated other shots
    const latestVideoForPatch = await storage.getVideo(videoId);
    const latestStep4DataForPatch = (latestVideoForPatch?.step4Data as Record<string, any>) || {};
    const latestShotVersionsForPatch = latestStep4DataForPatch.shotVersions || {};
    const latestPromptsForPatch = latestStep4DataForPatch.prompts || {};
    
    // Only update this specific shot's data, preserving all other shots' data
    latestShotVersionsForPatch[shotId] = existingVersions;

    // CRITICAL: Also update step4Data.prompts[shotId] because generate-image endpoint reads from there
    const shotPrompts = latestPromptsForPatch[shotId] || {};
    const updatedShotPrompts = {
      ...shotPrompts,
      ...(imagePrompt !== undefined && { imagePrompt }),
      ...(videoPrompt !== undefined && { videoPrompt }),
      ...(startFramePrompt !== undefined && { startFramePrompt }),
      ...(endFramePrompt !== undefined && { endFramePrompt }),
      ...(negativePrompt !== undefined && { negativePrompt }),
    };
    latestPromptsForPatch[shotId] = updatedShotPrompts;

    // Update step4Data
    const updatedStep4Data = {
      ...latestStep4DataForPatch,
      shotVersions: latestShotVersionsForPatch,
      prompts: latestPromptsForPatch,
    };

    // Save to database
    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    // Verify the save by reading back from database
    const savedVideo = await storage.getVideo(videoId);
    const savedStep4Data = savedVideo?.step4Data as Record<string, any> | undefined;
    const savedShotVersions = savedStep4Data?.shotVersions || {};
    const savedVersions = savedShotVersions[shotId] || [];
    const savedVersion = savedVersions.find((v: any) => v.id === versionId);

    console.log('[narrative:routes] Shot version prompts updated successfully:', {
      shotId,
      versionId,
    });

    res.json({
      success: true,
      version: updatedVersion,
    });
  } catch (error) {
    console.error('[narrative:routes] Shot version update error:', error);
    res.status(500).json({ 
      error: 'Failed to update shot version',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/narrative/shots/:shotId/versions/:versionId
 * Delete a shot version
 */
router.delete('/shots/:shotId/versions/:versionId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shotId, versionId } = req.params;
    const { videoId } = req.body;

    if (!shotId || !versionId) {
      return res.status(400).json({ error: 'shotId and versionId are required' });
    }

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[narrative:routes] Deleting shot version:', {
      shotId,
      versionId,
      videoId,
    });

    // Fetch video from database
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step4Data
    const step4Data = (video.step4Data as Record<string, any>) || {};
    const shotVersions = step4Data.shotVersions || {};
    const existingVersions = shotVersions[shotId] || [];

    // Find the version to delete
    const versionIndex = existingVersions.findIndex((v: any) => v.id === versionId);
    if (versionIndex === -1) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Check if this is the current version for the shot
    // Shots are stored in step3Data, so we need to get them from there
    const step3Data = (video.step3Data as Record<string, any>) || {};
    const allShots = Object.values(step3Data.shots || {}).flat() as any[];
    const shot = allShots.find((s: any) => s.id === shotId);
    const isCurrentVersion = shot?.currentVersionId === versionId;

    // Remove the version from the array
    let updatedVersions = existingVersions.filter((v: any) => v.id !== versionId);
    
    // Renumber all remaining versions sequentially (1, 2, 3, ...)
    // Sort by current versionNumber first to maintain order
    updatedVersions = updatedVersions
      .sort((a: any, b: any) => a.versionNumber - b.versionNumber)
      .map((version: any, index: number) => ({
        ...version,
        versionNumber: index + 1,
      }));
    
    // Update shotVersions
    shotVersions[shotId] = updatedVersions;
    
    // If this was the current version, update the shot's currentVersionId in step3Data
    let newCurrentVersionId: string | null | undefined = undefined;
    if (isCurrentVersion && shot) {
      // Set to the last remaining version, or null if no versions left
      newCurrentVersionId = updatedVersions.length > 0 
        ? updatedVersions[updatedVersions.length - 1].id 
        : null;
      
      // CRITICAL: Re-fetch latest step3Data to prevent race conditions
      const latestVideoForStep3 = await storage.getVideo(videoId);
      const latestStep3Data = (latestVideoForStep3?.step3Data as Record<string, any>) || {};
      
      // Update the shot in step3Data
      const shotsByScene = latestStep3Data.shots || {};
      for (const sceneId in shotsByScene) {
        const sceneShots = shotsByScene[sceneId] || [];
        const shotIndex = sceneShots.findIndex((s: any) => s.id === shotId);
        if (shotIndex >= 0) {
          shotsByScene[sceneId][shotIndex] = {
            ...sceneShots[shotIndex],
            currentVersionId: newCurrentVersionId,
          };
          break;
        }
      }
      
      // Save updated step3Data
      await storage.updateVideo(videoId, { step3Data: latestStep3Data });
      
      console.log('[narrative:routes] Updated shot currentVersionId:', {
        shotId,
        oldCurrentVersionId: versionId,
        newCurrentVersionId,
      });
    }

    // CRITICAL: Re-fetch latest step4Data to prevent race conditions
    const latestVideoForDelete = await storage.getVideo(videoId);
    const latestStep4DataForDelete = (latestVideoForDelete?.step4Data as Record<string, any>) || {};
    const latestShotVersionsForDelete = latestStep4DataForDelete.shotVersions || {};
    
    // Only update this specific shot's versions, preserving all other shots' data
    latestShotVersionsForDelete[shotId] = updatedVersions;

    // Update step4Data
    const updatedStep4Data = {
      ...latestStep4DataForDelete,
      shotVersions: latestShotVersionsForDelete,
    };

    // Save to database
    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[narrative:routes] Shot version deleted successfully:', {
      shotId,
      versionId,
      remainingVersions: updatedVersions.length,
      renumberedVersions: updatedVersions.map((v: any) => ({ id: v.id, versionNumber: v.versionNumber })),
    });

    res.json({
      success: true,
      message: 'Version deleted successfully',
      remainingVersions: updatedVersions.length,
      versions: updatedVersions, // Return renumbered versions for frontend update
      newCurrentVersionId: isCurrentVersion ? (updatedVersions.length > 0 ? updatedVersions[updatedVersions.length - 1].id : null) : undefined,
    });
  } catch (error) {
    console.error('[narrative:routes] Shot version delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete shot version',
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

/**
 * POST /api/narrative/videos/:id/shots/:shotId/animate
 * Generate video for a shot (Agent 4.5)
 * Supports both image-reference and start-end narrative modes
 */
router.post('/videos/:id/shots/:shotId/animate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;
    const {
      shotVersionId,
      videoModel: requestVideoModel,
      aspectRatio: requestAspectRatio,
      resolution: requestResolution,
      duration,
      videoPrompt,
      narrativeMode,
    } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    console.log('[narrative:routes] Video generation request:', {
      videoId,
      shotId,
      requestVideoModel,
      requestVideoModelType: typeof requestVideoModel,
      requestVideoModelValue: JSON.stringify(requestVideoModel),
      body: req.body,
    });

    // Load video to get settings and step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Load step3Data (scenes, shots) and step4Data (shot versions)
    const step3Data = (video.step3Data as any) || {};
    const step4Data = (video.step4Data as any) || {};
    
    // Find shot in step3Data
    const allShots: any[] = [];
    const scenes = step3Data.scenes || [];
    scenes.forEach((scene: any) => {
      const sceneShots = step3Data.shots?.[scene.id] || [];
      allShots.push(...sceneShots.map((shot: any) => ({ ...shot, sceneId: scene.id })));
    });
    
    const shot = allShots.find((s: any) => s.id === shotId);
    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Find scene for this shot
    const scene = scenes.find((s: any) => s.id === shot.sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Find shot version
    const shotVersions = step4Data.shotVersions?.[shotId] || [];
    const shotVersion = shotVersions.find((v: any) => v.id === shotVersionId);
    if (!shotVersion) {
      return res.status(404).json({ error: 'Shot version not found' });
    }

    // Resolve video settings with priority: shot → scene → video → default
    const videoSettings = resolveVideoSettings(
      shot,
      scene,
      {
        videoModel: (video.step1Data as any)?.videoModel,
        videoResolution: (video.step1Data as any)?.videoResolution,
        aspectRatio: (video.step1Data as any)?.aspectRatio || requestAspectRatio,
      },
      getDefaultVideoModel().id,
      '720p',
      requestAspectRatio || '16:9'
    );

    // Override with request values if provided
    // Ensure videoModel is a string (handle object cases)
    let finalVideoModel: string;
    if (requestVideoModel) {
      if (typeof requestVideoModel === "string") {
        finalVideoModel = requestVideoModel;
      } else {
        // Extract from object
        finalVideoModel = (requestVideoModel as any)?.id || (requestVideoModel as any)?.name || String(requestVideoModel);
      }
    } else {
      // Use resolved settings, but ensure it's a string
      finalVideoModel = typeof videoSettings.videoModel === "string" 
        ? videoSettings.videoModel 
        : (videoSettings.videoModel as any)?.id || (videoSettings.videoModel as any)?.name || getDefaultVideoModel().id;
    }
    
    // Final validation: ensure videoModel is always a string
    if (typeof finalVideoModel !== "string") {
      console.error('[narrative:routes] finalVideoModel is still not a string:', {
        finalVideoModel,
        type: typeof finalVideoModel,
        requestVideoModel,
        videoSettings,
      });
      finalVideoModel = getDefaultVideoModel().id;
    }
    
    
    console.log('[narrative:routes] Resolved video settings:', {
      requestVideoModel,
      requestVideoModelType: typeof requestVideoModel,
      videoSettings,
      finalVideoModel,
      shotVideoModel: shot.videoModel,
      sceneVideoModel: scene.videoModel,
    });
    
    let finalResolution = requestResolution || videoSettings.resolution;
    const finalAspectRatio = requestAspectRatio || videoSettings.aspectRatio;

    // Validate shot-level resolution is supported by selected model
    if (shot.videoResolution || requestResolution) {
      const modelConfig = VIDEO_MODEL_CONFIGS[finalVideoModel];
      if (modelConfig) {
        const supportedResolutions = modelConfig.resolutions;
        if (!supportedResolutions.includes(finalResolution as any)) {
          // Fall back to scene/video resolution or first supported resolution
          console.warn(`[narrative:routes] Shot resolution ${finalResolution} not supported by model ${finalVideoModel}, falling back`);
          finalResolution = scene.videoResolution 
            || (video.step1Data as any)?.videoResolution 
            || supportedResolutions[0] 
            || '720p';
        }
      }
    }

    // Determine effective mode (handle "auto" mode)
    let effectiveMode: "image-reference" | "start-end";
    if (narrativeMode === "auto") {
      effectiveMode = (shot.frameMode || "image-reference") as "image-reference" | "start-end";
    } else {
      effectiveMode = (narrativeMode || "image-reference") as "image-reference" | "start-end";
    }

    // Get frame URLs based on mode
    let imageUrl: string | undefined;
    let startFrameUrl: string | undefined;
    let endFrameUrl: string | undefined;

    if (effectiveMode === "image-reference") {
      imageUrl = shotVersion.imageUrl || undefined;
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required for image-reference mode' });
      }
    } else {
      // Start-end mode
      startFrameUrl = shotVersion.startFrameUrl || undefined;
      endFrameUrl = shotVersion.endFrameUrl || undefined;

      // Check continuity groups for connected shots
      const continuityGroups = step3Data.continuityGroups?.[scene.id] || [];
      const shotGroup = continuityGroups.find((g: any) => g.shotIds?.includes(shotId));
      
      if (shotGroup && shotGroup.shotIds && Array.isArray(shotGroup.shotIds)) {
        const shotIndex = shotGroup.shotIds.indexOf(shotId);
        
        if (shotIndex !== -1) {
          const previousShotId = shotGroup.shotIds[shotIndex - 1];
          const nextShotId = shotGroup.shotIds[shotIndex + 1];
          
          // If this shot is NOT the first in the group, inherit start frame from previous shot's end frame
          if (previousShotId && shotIndex > 0) {
            const previousShotVersions = step4Data.shotVersions?.[previousShotId] || [];
            const previousShot = allShots.find((s: any) => s.id === previousShotId);
            
            // Find the active version of the previous shot
            // Try currentVersionId first, then most recent version
            let previousShotVersion = null;
            if (previousShot?.currentVersionId) {
              previousShotVersion = previousShotVersions.find((v: any) => v.id === previousShot.currentVersionId);
            }
            if (!previousShotVersion && previousShotVersions.length > 0) {
              // Use the most recent version (last in array)
              previousShotVersion = previousShotVersions[previousShotVersions.length - 1];
            }
            
            // Try to get end frame from previous shot (preferred for continuity)
            if (previousShotVersion?.endFrameUrl) {
              startFrameUrl = previousShotVersion.endFrameUrl;
            } else if (previousShotVersion?.startFrameUrl) {
              // Fallback to start frame if end frame doesn't exist yet
              startFrameUrl = previousShotVersion.startFrameUrl;
            } else if (previousShotVersion?.imageUrl) {
              // Fallback to imageUrl for image-reference mode shots
              startFrameUrl = previousShotVersion.imageUrl;
            }
          }
          
          // If this shot is connected to next, use next shot's start frame as end frame
          if (nextShotId) {
            const nextShotVersions = step4Data.shotVersions?.[nextShotId] || [];
            const nextShot = allShots.find((s: any) => s.id === nextShotId);
            const nextShotVersion = nextShotVersions.find((v: any) => 
              v.id === (nextShot?.currentVersionId || nextShotVersions[nextShotVersions.length - 1]?.id)
            );
            
            if (nextShotVersion?.startFrameUrl) {
              endFrameUrl = nextShotVersion.startFrameUrl;
            }
          }
        }
      }

      if (!startFrameUrl) {
        return res.status(400).json({ error: 'Start frame URL is required for start-end mode' });
      }
    }

    // Final check before calling generateVideo - ensure videoModel is definitely a string
    if (typeof finalVideoModel !== "string") {
      console.error('[narrative:routes] CRITICAL: finalVideoModel is not a string before generateVideo:', {
        finalVideoModel,
        type: typeof finalVideoModel,
        stringified: JSON.stringify(finalVideoModel),
      });
      finalVideoModel = "seedance-1.0-pro"; // Force fallback
    }
    
    // Generate video
    const result = await NarrativeAgents.generateVideo(
      {
        narrativeMode: narrativeMode || "image-reference",
        shotId,
        shotVersionId,
        videoModel: finalVideoModel,
        aspectRatio: finalAspectRatio,
        resolution: finalResolution,
      duration,
        videoPrompt: videoPrompt || shotVersion.videoPrompt || "",
        imageUrl,
        startFrameUrl,
        endFrameUrl,
        effectiveMode,
      },
      userId,
      workspaceId,
      'video',
      'narrative'
    );

    // Update shot version with video URL if completed
    if (result.status === "completed" && result.videoUrl) {
      const updatedShotVersions = { ...step4Data.shotVersions };
      if (!updatedShotVersions[shotId]) {
        updatedShotVersions[shotId] = [];
      }
      
      const versionIndex = updatedShotVersions[shotId].findIndex((v: any) => v.id === shotVersionId);
      if (versionIndex >= 0) {
        updatedShotVersions[shotId][versionIndex] = {
          ...updatedShotVersions[shotId][versionIndex],
          videoUrl: result.videoUrl,
          videoDuration: result.videoDuration,
          status: "completed",
        };
      }

      await storage.updateVideo(videoId, {
        step4Data: {
          ...step4Data,
          shotVersions: updatedShotVersions,
        },
      });
    }

    res.json({ 
      taskId: result.taskId,
      status: result.status,
      videoUrl: result.videoUrl,
      error: result.error,
    });
  } catch (error) {
    console.error('[narrative:routes] Shot video generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate shot video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/narrative/videos/:id/shots/:shotId/video-status/:taskId
 * Check video generation status
 */
router.get('/videos/:id/shots/:shotId/video-status/:taskId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId, taskId } = req.params;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    // Check task status via Runware
    const response = await callAi(
      {
        provider: "runware",
        model: "task-status",
        task: "video-generation",
        payload: {
          taskType: "getTaskStatus",
          taskUUID: taskId,
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: true, // Status checks don't cost
      }
    );

    const data = response.output as any;

    // Map Runware status to our status
    let status: "processing" | "completed" | "failed" = "processing";
    if (data.status === "completed" || data.status === "COMPLETED") {
      status = "completed";
    } else if (data.status === "failed" || data.status === "FAILED") {
      status = "failed";
    }

    const videoUrl = data.videoURL || data.outputURL;

    // If completed, update shot version in database
    if (status === "completed" && videoUrl) {
      const video = await storage.getVideo(videoId);
      if (video) {
        const step4Data = (video.step4Data as any) || {};
        const shotVersions = step4Data.shotVersions?.[shotId] || [];
        
        // Find the version that matches this task (we'd need to store taskId, but for now update the current version)
        const allShots: any[] = [];
        const step3Data = (video.step3Data as any) || {};
        const scenes = step3Data.scenes || [];
        scenes.forEach((scene: any) => {
          const sceneShots = step3Data.shots?.[scene.id] || [];
          allShots.push(...sceneShots.map((s: any) => ({ ...s, sceneId: scene.id })));
        });
        
        const shot = allShots.find((s: any) => s.id === shotId);
        if (shot?.currentVersionId) {
          const updatedShotVersions = { ...step4Data.shotVersions };
          if (!updatedShotVersions[shotId]) {
            updatedShotVersions[shotId] = [];
          }
          
          const versionIndex = updatedShotVersions[shotId].findIndex((v: any) => v.id === shot.currentVersionId);
          if (versionIndex >= 0) {
            updatedShotVersions[shotId][versionIndex] = {
              ...updatedShotVersions[shotId][versionIndex],
              videoUrl,
              status: "completed",
            };
          }

          await storage.updateVideo(videoId, {
            step4Data: {
              ...step4Data,
              shotVersions: updatedShotVersions,
            },
          });
        }
      }
    }

    res.json({
      status,
      videoUrl,
      error: data.error,
    });
  } catch (error) {
    console.error('[narrative:routes] Video status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check video status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND ROUTES (Step 5)
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  generateNarrativeSoundEffectPrompt,
  generateNarrativeSoundEffect,
  generateNarrativeVoiceoverScript,
  generateNarrativeVoiceoverAudio,
  generateNarrativeBackgroundMusic,
  NARRATIVE_VOICES,
} from '../agents/sound';

/**
 * Get available voices for narrative voiceover
 */
router.get('/videos/voices', (_req: Request, res: Response) => {
  res.json(NARRATIVE_VOICES);
});

/**
 * Recommend sound effect description for a shot
 */
router.post('/videos/:id/shots/:shotId/sound-effect/recommend', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId, shotId } = req.params;
    const { sceneId } = req.body;
    const userId = getCurrentUserId(req);

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step3Data for shots/scenes
    const step3Data = (video.step3Data as any) || {};
    const step2Data = (video.step2Data as any) || {};
    const step1Data = (video.step1Data as any) || {};
    
    // Find the scene and shot
    const scenes = step3Data.scenes || [];
    const scene = scenes.find((s: any) => s.id === sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const sceneShots = step3Data.shots?.[sceneId] || [];
    const shot = sceneShots.find((s: any) => s.id === shotId);
    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Generate SFX prompt recommendation
    const result = await generateNarrativeSoundEffectPrompt(
      {
        shot: {
          id: shot.id,
          shotNumber: shot.shotNumber,
          shotType: shot.shotType,
          description: shot.description,
          cameraMovement: shot.cameraMovement,
          duration: shot.duration,
        },
        scene: {
          id: scene.id,
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          description: scene.description,
        },
        script: step1Data.script,
        characters: step2Data.characters,
        locations: step2Data.locations,
        genre: step1Data.genres?.[0],
        tone: step1Data.tones?.[0],
      },
      userId,
      video.workspaceId,
      'video',
      'narrative'
    );

    res.json({ prompt: result.prompt, cost: result.cost });
  } catch (error) {
    console.error('[narrative:routes] SFX recommendation error:', error);
    res.status(500).json({ 
      error: 'Failed to recommend sound effect',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate sound effect for a shot
 */
router.post('/videos/:id/shots/:shotId/sound-effect/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId, shotId } = req.params;
    const { sceneId, description } = req.body;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    if (!description) {
      return res.status(400).json({ error: 'Sound effect description is required' });
    }

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get shot version to get video URL
    const step4Data = (video.step4Data as any) || {};
    const step3Data = (video.step3Data as any) || {};
    const shotVersions = step4Data.shotVersions?.[shotId] || [];
    
    // Get the scene shots to find the shot
    const sceneShots = step3Data.shots?.[sceneId] || [];
    const shot = sceneShots.find((s: any) => s.id === shotId);
    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Get the current version with video URL
    const currentVersionId = shot.currentVersionId;
    const currentVersion = shotVersions.find((v: any) => v.id === currentVersionId) || shotVersions[shotVersions.length - 1];
    
    if (!currentVersion?.videoUrl) {
      return res.status(400).json({ error: 'Shot must have a generated video before creating sound effects' });
    }

    // Get workspace name
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w: any) => w.id === video.workspaceId);
    const workspaceName = workspace?.name || 'default';

    // Generate the sound effect
    const result = await generateNarrativeSoundEffect({
      videoUrl: currentVersion.videoUrl,
      prompt: description,
      duration: shot.duration,
      videoId,
      videoTitle: video.title || 'Untitled',
      shotId,
      sceneId,
      userId,
      workspaceId: video.workspaceId,
      workspaceName,
    }, 'sfx', 'narrative');

    // IMPORTANT: Re-fetch video to get latest step5Data to avoid race conditions
    // Multiple SFX generations may complete simultaneously, and we need the current state
    const freshVideo = await storage.getVideo(videoId);
    const freshStep5Data = (freshVideo?.step5Data as any) || {};
    const existingShotsWithSFX = freshStep5Data.shotsWithSFX || {};
    
    // Deep merge - preserve ALL existing shot SFX data, only update this shot
    const updatedShotsWithSFX = {
      ...existingShotsWithSFX,
      [shotId]: {
        soundEffectDescription: description,
        soundEffectUrl: result.audioUrl,
      },
    };

    await storage.updateVideo(videoId, {
      step5Data: {
        ...freshStep5Data,
        shotsWithSFX: updatedShotsWithSFX,
      },
    });

    res.json({ 
      audioUrl: result.audioUrl,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[narrative:routes] SFX generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate sound effect',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate voiceover script
 */
router.post('/videos/:id/voiceover/generate-script', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;
    const { language = 'en' } = req.body;
    const userId = getCurrentUserId(req);

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as any) || {};
    const step2Data = (video.step2Data as any) || {};
    const step3Data = (video.step3Data as any) || {};

    // Calculate total duration
    const scenes = step3Data.scenes || [];
    let totalDuration = 0;
    for (const scene of scenes) {
      const sceneShots = step3Data.shots?.[scene.id] || [];
      for (const shot of sceneShots) {
        totalDuration += shot.duration || 4;
      }
    }

    // Build shots record
    const shotsRecord: Record<string, Array<{
      id: string;
      shotNumber: number;
      description?: string | null;
      duration: number;
    }>> = {};
    for (const scene of scenes) {
      const sceneShots = step3Data.shots?.[scene.id] || [];
      shotsRecord[scene.id] = sceneShots.map((s: any) => ({
        id: s.id,
        shotNumber: s.shotNumber,
        description: s.description,
        duration: s.duration || 4,
      }));
    }

    // Generate the script
    const result = await generateNarrativeVoiceoverScript(
      {
        script: step1Data.script || '',
        scenes: scenes.map((s: any) => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          title: s.title,
          description: s.description,
          duration: null,
        })),
        shots: shotsRecord,
        totalDuration,
        language: language as 'en' | 'ar',
        characters: step2Data.characters,
        genre: step1Data.genres?.[0],
        tone: step1Data.tones?.[0],
      },
      userId,
      video.workspaceId,
      'video',
      'narrative'
    );

    // Save to step5Data
    const step5Data = (video.step5Data as any) || {};
    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        voiceoverScript: result.script,
      },
    });

    res.json({ 
      script: result.script,
      estimatedDuration: result.estimatedDuration,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[narrative:routes] Voiceover script generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate voiceover script',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate voiceover audio
 */
router.post('/videos/:id/voiceover/generate-audio', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;
    const { script, voiceId, language = 'en' } = req.body;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }
    if (!voiceId) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get workspace name
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w: any) => w.id === video.workspaceId);
    const workspaceName = workspace?.name || 'default';

    // Generate the audio
    const result = await generateNarrativeVoiceoverAudio({
      script,
      voiceId,
      language: language as 'en' | 'ar',
      videoId,
      videoTitle: video.title || 'Untitled',
      userId,
      workspaceId: video.workspaceId,
      workspaceName,
    }, 'voiceover', 'narrative');

    // Save to step5Data
    const step5Data = (video.step5Data as any) || {};
    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        voiceoverScript: script,
        voiceoverAudioUrl: result.audioUrl,
        voiceoverDuration: result.duration,
        voiceId,
      },
    });

    res.json({ 
      audioUrl: result.audioUrl,
      duration: result.duration,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[narrative:routes] Voiceover audio generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate voiceover audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate background music
 */
router.post('/videos/:id/music/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;
    const { musicStyle = 'cinematic' } = req.body;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as any) || {};
    const step3Data = (video.step3Data as any) || {};

    // Calculate total duration
    const scenes = step3Data.scenes || [];
    let totalDuration = 0;
    for (const scene of scenes) {
      const sceneShots = step3Data.shots?.[scene.id] || [];
      for (const shot of sceneShots) {
        totalDuration += shot.duration || 4;
      }
    }

    // Get workspace name
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w: any) => w.id === video.workspaceId);
    const workspaceName = workspace?.name || 'default';

    // Generate the music
    const result = await generateNarrativeBackgroundMusic({
      musicStyle,
      totalDuration,
      genre: step1Data.genres?.[0],
      tone: step1Data.tones?.[0],
      script: step1Data.script,
      scenes: scenes.map((s: any) => ({
        id: s.id,
        sceneNumber: s.sceneNumber,
        title: s.title,
        description: s.description,
      })),
      videoId,
      videoTitle: video.title || 'Untitled',
      userId,
      workspaceId: video.workspaceId,
      workspaceName,
    }, 'music', 'narrative');

    // Save to step5Data
    const step5Data = (video.step5Data as any) || {};
    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        generatedMusicUrl: result.musicUrl,
        generatedMusicDuration: result.duration,
        musicStyle,
      },
    });

    res.json({ 
      musicUrl: result.musicUrl,
      duration: result.duration,
      style: result.style,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[narrative:routes] Music generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate background music',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete generated music
 */
router.delete('/videos/:id/music/generated', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Remove music from step5Data
    const step5Data = (video.step5Data as any) || {};
    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        generatedMusicUrl: null,
        generatedMusicDuration: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[narrative:routes] Music deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete generated music',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get music status
 */
router.get('/videos/:id/music/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step5Data = (video.step5Data as any) || {};
    
    res.json({
      hasGeneratedMusic: !!step5Data.generatedMusicUrl,
      generatedMusicUrl: step5Data.generatedMusicUrl || null,
      generatedMusicDuration: step5Data.generatedMusicDuration || null,
      musicStyle: step5Data.musicStyle || null,
    });
  } catch (error) {
    console.error('[narrative:routes] Music status error:', error);
    res.status(500).json({ 
      error: 'Failed to get music status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
