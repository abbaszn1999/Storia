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
    if (!name || !appearance) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'name and appearance are required'
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
