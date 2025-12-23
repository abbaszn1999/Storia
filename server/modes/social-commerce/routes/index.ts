/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOCIAL COMMERCE MODE - API ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Express router for Social Commerce video creation endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { storage } from '../../../storage';
import { bunnyStorage } from '../../../storage/bunny-storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { SOCIAL_COMMERCE_CONFIG } from '../config';
import { optimizeStrategicContext } from '../agents';
import type {
  CreateVideoRequest,
  Step1Data,
  StrategicContextInput,
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPORARY IMAGE STORAGE (Memory)
// ═══════════════════════════════════════════════════════════════════════════════

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
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
  category: 'product' | 'character' | 'logo' | 'style';
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
    console.log(`[social-commerce] Cleaned ${cleaned} expired temp uploads`);
  }
}, 30 * 60 * 1000);

// Export helpers for use in step/2/continue
export function getTempUpload(tempId: string): TempUpload | undefined {
  return tempUploads.get(tempId);
}

export function deleteTempUpload(tempId: string): void {
  tempUploads.delete(tempId);
}

/**
 * POST /api/social-commerce/upload-temp
 * Upload image DIRECTLY to Bunny CDN (no temp storage)
 * Creates database records and returns CDN URL for immediate use
 */
router.post('/upload-temp', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { 
      category, 
      workspaceId, 
      videoId,
      characterName,
      characterDescription,
      brandName,
      brandPrimaryColor,
      brandSecondaryColor,
    } = req.body;

    if (!category || !['product', 'character', 'logo', 'style'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be: product, character, logo, or style' });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    // Get workspace info
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
    const workspaceClean = clean(workspace.name || workspaceId);

    // Check if Bunny CDN is configured
    if (!bunnyStorage.isBunnyConfigured()) {
      console.warn('[social-commerce] ⚠️  Bunny CDN is NOT configured');
      return res.status(503).json({ error: 'File storage is not configured' });
    }

    const timestamp = Date.now();
    const extensionMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    const extension = extensionMap[req.file.mimetype] || "jpg";

    let cdnUrl: string;
    let assetId: string | null = null;
    let assetType: 'upload' | 'character' | 'brandkit' = 'upload';

    // ═══════════════════════════════════════════════════════════════
    // HANDLE BY CATEGORY
    // ═══════════════════════════════════════════════════════════════

    if (category === 'product' || category === 'style') {
      // Upload to Assets/Uploads/
      const filename = `${category}_${timestamp}.${extension}`;
      const bunnyPath = `${userId}/${workspaceClean}/Assets/Uploads/${filename}`;

      cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Create uploads table record
      const uploadRecord = await storage.createUpload({
        workspaceId,
        name: `${category === 'product' ? 'Product' : 'Style'} Image${videoId ? ` - Campaign ${videoId.substring(0, 8)}` : ''}`,
        description: `${category} image uploaded from Social Commerce mode`,
        fileName: filename,
        fileType: req.file.mimetype,
        fileSize: req.file.buffer.length,
        storageUrl: cdnUrl
      });
      
      assetId = uploadRecord.id;
      assetType = 'upload';

      console.log(`[social-commerce] ✓ ${category} uploaded to Bunny:`, {
        path: bunnyPath,
        url: cdnUrl,
        uploadId: assetId,
        size: `${(req.file.buffer.length / 1024).toFixed(2)}KB`
      });

    } else if (category === 'character') {
      // Create character record first
      const character = await storage.createCharacter({
        workspaceId,
        name: characterName || 'Unnamed Character',
        description: characterDescription || '',
        appearance: characterDescription || '',
      });
      
      assetId = character.id;
      assetType = 'character';

      // Upload to Assets/Characters/{characterId}/
      const filename = `main_${timestamp}.${extension}`;
      const bunnyPath = `${userId}/${workspaceClean}/Assets/Characters/${character.id}/${filename}`;

      cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Update character with image URL
      await storage.updateCharacter(character.id, { imageUrl: cdnUrl });

      console.log(`[social-commerce] ✓ Character uploaded to Bunny:`, {
        characterId: character.id,
        characterName: character.name,
        path: bunnyPath,
        url: cdnUrl,
        size: `${(req.file.buffer.length / 1024).toFixed(2)}KB`
      });

    } else if (category === 'logo') {
      // Create brandkit record first
      const brandkit = await storage.createBrandkit({
        workspaceId,
        name: brandName || 'Unnamed Brand',
        colors: {
          primary: brandPrimaryColor || '#000000',
          secondary: brandSecondaryColor || '#FFFFFF',
        },
      });
      
      assetId = brandkit.id;
      assetType = 'brandkit';

      // Upload to Assets/Brand_Kits/{brandkitId}/
      const filename = `logo_${timestamp}.${extension}`;
      const bunnyPath = `${userId}/${workspaceClean}/Assets/Brand_Kits/${brandkit.id}/${filename}`;

      cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Update brandkit with logo URL
      await storage.updateBrandkit(brandkit.id, { logoUrl: cdnUrl });

      console.log(`[social-commerce] ✓ Brand logo uploaded to Bunny:`, {
        brandkitId: brandkit.id,
        brandName: brandkit.name,
        path: bunnyPath,
        url: cdnUrl,
        size: `${(req.file.buffer.length / 1024).toFixed(2)}KB`
      });
    } else {
      return res.status(400).json({ error: 'Invalid category' });
    }

    res.json({
      cdnUrl,
      assetId,
      assetType,
      category,
      originalName: req.file.originalname,
      size: req.file.buffer.length,
    });

  } catch (error) {
    console.error('[social-commerce] Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/social-commerce/upload-temp/:tempId
 * Remove temporary image from memory
 */
router.delete('/upload-temp/:tempId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tempId } = req.params;
    const deleted = tempUploads.delete(tempId);
    
    if (deleted) {
      console.log(`[social-commerce] Temp upload deleted: ${tempId}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[social-commerce] Delete temp error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET DELETION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Helper: Extract Bunny file path from CDN URL
 */
function extractFilePathFromUrl(cdnUrl: string): string {
  const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || '';
  if (!BUNNY_CDN_URL || !cdnUrl) return '';
  
  const cdnBase = BUNNY_CDN_URL.replace(/\/+$/, '');
  return cdnUrl.replace(`${cdnBase}/`, '');
}

/**
 * DELETE /api/social-commerce/assets/character/:id
 * Delete character from database + Bunny CDN
 * Query params: videoId (optional) - if provided, cleans up the video's step2Data
 */
router.delete('/assets/character/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { videoId } = req.query as { videoId?: string };
    
    // Get character to find image URL
    const character = await storage.getCharacter(id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Delete from Bunny CDN if image exists
    if (character.imageUrl) {
      try {
        const filePath = extractFilePathFromUrl(character.imageUrl);
        if (filePath) {
          // Delete the specific file
          await bunnyStorage.deleteFile(filePath);
          console.log(`[social-commerce] ✓ Deleted character image from Bunny CDN: ${filePath}`);
          
          // Also delete the entire character folder (e.g., Assets/Characters/{characterId}/)
          // Extract folder path (everything before the filename)
          const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
          if (folderPath) {
            try {
              await bunnyStorage.deleteFolder(folderPath);
              console.log(`[social-commerce] ✓ Deleted character folder from Bunny CDN: ${folderPath}`);
            } catch (folderError) {
              console.warn('[social-commerce] Failed to delete character folder (may not exist):', folderError);
              // Continue - folder deletion is optional
            }
          }
        }
      } catch (error) {
        console.error('[social-commerce] Failed to delete from Bunny CDN:', error);
        // Continue with DB deletion even if Bunny fails
      }
    }

    // Delete from database
    await storage.deleteCharacter(id);
    
    // Clean up video's step2Data if videoId provided
    if (videoId && videoId !== 'new') {
      try {
        const video = await storage.getVideo(videoId);
        if (video && video.step2Data) {
          const step2 = video.step2Data as any;
          
          // Remove character if it matches this asset ID
          if (step2.character?.assetId === id) {
            step2.character = null;
            await storage.updateVideo(videoId, { step2Data: step2 });
            console.log(`[social-commerce] ✓ Cleaned character from video ${videoId} step2Data`);
          }
        }
      } catch (videoError) {
        console.error('[social-commerce] Failed to clean video step2Data:', videoError);
        // Don't fail the entire deletion if video update fails
      }
    }
    
    console.log(`[social-commerce] ✓ Character deleted: ${id}`);
    res.json({ success: true, message: 'Character deleted successfully' });
  } catch (error) {
    console.error('[social-commerce] Delete character error:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

/**
 * DELETE /api/social-commerce/assets/brandkit/:id
 * Delete brandkit (logo) from database + Bunny CDN
 * Query params: videoId (optional) - if provided, cleans up the video's step2Data
 */
router.delete('/assets/brandkit/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { videoId } = req.query as { videoId?: string };
    
    // Get brandkit to find logo URL
    const brandkit = await storage.getBrandkit(id);
    if (!brandkit) {
      return res.status(404).json({ error: 'Brandkit not found' });
    }

    // Delete from Bunny CDN if logo exists
    if (brandkit.logoUrl) {
      try {
        const filePath = extractFilePathFromUrl(brandkit.logoUrl);
        if (filePath) {
          await bunnyStorage.deleteFile(filePath);
          console.log(`[social-commerce] ✓ Deleted from Bunny CDN: ${filePath}`);
        }
      } catch (error) {
        console.error('[social-commerce] Failed to delete from Bunny CDN:', error);
        // Continue with DB deletion even if Bunny fails
      }
    }

    // Delete from database
    await storage.deleteBrandkit(id);
    
    // Clean up video's step2Data if videoId provided
    if (videoId && videoId !== 'new') {
      try {
        const video = await storage.getVideo(videoId);
        if (video && video.step2Data) {
          const step2 = video.step2Data as any;
          
          // Remove brand logo if it matches this asset ID
          if (step2.brand?.assetId === id) {
            if (step2.brand) {
              step2.brand.logoUrl = null;
              step2.brand.assetId = null;
              step2.brand.name = null;
            }
            await storage.updateVideo(videoId, { step2Data: step2 });
            console.log(`[social-commerce] ✓ Cleaned brandkit from video ${videoId} step2Data`);
          }
        }
      } catch (videoError) {
        console.error('[social-commerce] Failed to clean video step2Data:', videoError);
        // Don't fail the entire deletion if video update fails
      }
    }
    
    console.log(`[social-commerce] ✓ Brandkit deleted: ${id}`);
    res.json({ success: true, message: 'Brandkit deleted successfully' });
  } catch (error) {
    console.error('[social-commerce] Delete brandkit error:', error);
    res.status(500).json({ error: 'Failed to delete brandkit' });
  }
});

/**
 * DELETE /api/social-commerce/assets/upload/:id
 * Delete upload (product/style image) from database + Bunny CDN
 * Query params: 
 *   - videoId (optional) - if provided, cleans up the video's step2Data
 *   - imageKey (optional) - 'heroProfile' | 'macroDetail' | 'materialReference' for product images
 *   - imageType (optional) - 'product' | 'style' to identify what kind of image
 */
router.delete('/assets/upload/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { videoId, imageKey, imageType } = req.query as { 
      videoId?: string; 
      imageKey?: string;
      imageType?: 'product' | 'style';
    };
    
    // Get upload to find storage URL
    const upload = await storage.getUpload(id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete from Bunny CDN
    if (upload.storageUrl) {
      try {
        const filePath = extractFilePathFromUrl(upload.storageUrl);
        if (filePath) {
          await bunnyStorage.deleteFile(filePath);
          console.log(`[social-commerce] ✓ Deleted from Bunny CDN: ${filePath}`);
        }
      } catch (error) {
        console.error('[social-commerce] Failed to delete from Bunny CDN:', error);
        // Continue with DB deletion even if Bunny fails
      }
    }

    // Delete from database
    await storage.deleteUpload(id);
    
    // Clean up video's step2Data if videoId provided
    if (videoId && videoId !== 'new') {
      try {
        const video = await storage.getVideo(videoId);
        if (video && video.step2Data) {
          const step2 = video.step2Data as any;
          let updated = false;
          
          // If imageKey provided, directly clear that specific product image key
          if (imageKey && step2.product?.images) {
            step2.product.images[imageKey] = null;
            updated = true;
            console.log(`[social-commerce] ✓ Clearing product.images.${imageKey}`);
          }
          
          // If imageType is 'style', clear style reference
          if (imageType === 'style' && step2.style) {
            step2.style.referenceUrl = null;
            updated = true;
            console.log(`[social-commerce] ✓ Clearing style.referenceUrl`);
          }
          
          if (updated) {
            await storage.updateVideo(videoId, { step2Data: step2 });
            console.log(`[social-commerce] ✓ Cleaned upload from video ${videoId} step2Data`);
          }
        }
      } catch (videoError) {
        console.error('[social-commerce] Failed to clean video step2Data:', videoError);
        // Don't fail the entire deletion if video update fails
      }
    }
    
    console.log(`[social-commerce] ✓ Upload deleted: ${id}`);
    res.json({ success: true, message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('[social-commerce] Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social-commerce/videos
 * Create new social commerce video project
 */
router.post('/videos', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { workspaceId, title, productTitle, aspectRatio, duration } = 
      req.body as CreateVideoRequest;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    if (!productTitle) {
      return res.status(400).json({ error: 'productTitle is required' });
    }
    
    // Validate and cast duration to allowed values
    const validDurations = [10, 15, 20, 30, 45, 60] as const;
    type ValidDuration = (typeof validDurations)[number];
    const validatedDuration: ValidDuration = validDurations.includes(duration as any) 
      ? (duration as ValidDuration) 
      : SOCIAL_COMMERCE_CONFIG.defaults.duration;
    
    // Initial step1Data with product title
    const step1Data: Partial<Step1Data> = {
      productTitle,
      aspectRatio: aspectRatio || SOCIAL_COMMERCE_CONFIG.defaults.aspectRatio,
      duration: validatedDuration,
    };
    
    const video = await storage.createVideo({
      workspaceId,
      title: title || `${productTitle} Video`,
      mode: SOCIAL_COMMERCE_CONFIG.mode,
      status: 'draft',
      currentStep: SOCIAL_COMMERCE_CONFIG.initialStep,
      completedSteps: [],
      step1Data,
    });

    console.log('[social-commerce:routes] Video project created:', {
      videoId: video.id,
      productTitle,
      aspectRatio: step1Data.aspectRatio,
      duration: step1Data.duration,
    });

    res.json(video);
  } catch (error) {
    console.error('[social-commerce:routes] Video creation error:', error);
    res.status(500).json({ error: 'Failed to create video project' });
  }
});

/**
 * GET /api/social-commerce/videos/:id
 * Get video by ID
 */
router.get('/videos/:id', isAuthenticated, async (req: Request, res: Response) => {
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
    
    // Verify it's a social commerce video
    if (video.mode !== SOCIAL_COMMERCE_CONFIG.mode) {
      return res.status(400).json({ error: 'Not a social commerce video' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('[social-commerce:routes] Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id
 * Update video properties (for step resets and partial updates)
 */
router.patch('/videos/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Verify it's a social commerce video
    if (video.mode !== SOCIAL_COMMERCE_CONFIG.mode) {
      return res.status(400).json({ error: 'Not a social commerce video' });
    }
    
    // Update video with provided fields
    const updated = await storage.updateVideo(id, updates);
    
    console.log('[social-commerce:routes] Video updated:', {
      videoId: id,
      updatedFields: Object.keys(updates),
    });
    
    res.json(updated);
  } catch (error) {
    console.error('[social-commerce:routes] Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

/**
 * DELETE /api/social-commerce/videos/:id
 * Delete video project
 */
router.delete('/videos/:id', isAuthenticated, async (req: Request, res: Response) => {
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
    
    // TODO: Clean up Bunny CDN assets when deleting
    
    await storage.deleteVideo(id);
    
    console.log('[social-commerce:routes] Video deleted:', { videoId: id });
    
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    console.error('[social-commerce:routes] Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: STRATEGIC CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social-commerce/strategic/generate
 * Run Agent 1.1: Strategic Context Optimizer (standalone, for testing)
 */
router.post('/strategic/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { workspaceId, ...input } = req.body as StrategicContextInput & { workspaceId: string };
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    if (!input.productTitle || !input.targetAudience) {
      return res.status(400).json({ error: 'productTitle and targetAudience are required' });
    }

    console.log('[social-commerce:routes] Generating strategic context:', {
      product: input.productTitle,
      audience: input.targetAudience,
    });

    const strategicContext = await optimizeStrategicContext(input, userId, workspaceId);

    res.json({
      success: true,
      strategicContext,
    });
  } catch (error) {
    console.error('[social-commerce:routes] Strategic generation error:', error);
    res.status(500).json({ error: 'Failed to generate strategic context' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// INCREMENTAL DATA UPDATES (WITHOUT RUNNING AGENTS)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deep merge helper for nested objects
 * Handles null values properly (null overwrites existing value)
 */
function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (!target) return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] === null) {
      // Explicitly set to null (for deletions)
      result[key] = null;
    } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // Recursively merge nested objects
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      // Primitive value or array - direct assignment
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * PATCH /api/social-commerce/videos/:id/step/2/data
 * Update step2Data incrementally (without running agents)
 * Used to save uploaded images/characters immediately after upload
 * 
 * This allows users to leave and return to see their uploaded images,
 * even if they haven't clicked "Continue" yet.
 * 
 * Supports nested structure:
 * - product.images.heroProfile
 * - product.material.preset
 * - character.name
 * - brand.logoUrl
 * etc.
 * 
 * Uses retry logic to handle race conditions when multiple uploads happen simultaneously.
 */
router.patch('/videos/:id/step/2/data', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body; // Partial step2Data updates

    // Retry logic to handle race conditions
    const maxRetries = 5;
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get current video (fresh read on each attempt)
        const video = await storage.getVideo(id);
        if (!video) {
          return res.status(404).json({ error: 'Video not found' });
        }

        // Deep merge with existing step2Data (handles nested objects properly)
        const currentStep2Data = (video.step2Data as any) || {};
        
        // Clean up old flat structure fields if they exist
        if (currentStep2Data.productImages) delete currentStep2Data.productImages;
        if (currentStep2Data.characterReferenceUrl) delete currentStep2Data.characterReferenceUrl;
        if (currentStep2Data.characterAssetId) delete currentStep2Data.characterAssetId;
        if (currentStep2Data.characterName) delete currentStep2Data.characterName;
        if (currentStep2Data.characterDescription) delete currentStep2Data.characterDescription;
        if (currentStep2Data.characterMode) delete currentStep2Data.characterMode;
        if (currentStep2Data.characterAIProfile) delete currentStep2Data.characterAIProfile;
        if (currentStep2Data.logoUrl) delete currentStep2Data.logoUrl;
        if (currentStep2Data.brandkitAssetId) delete currentStep2Data.brandkitAssetId;
        if (currentStep2Data.brandName) delete currentStep2Data.brandName;
        if (currentStep2Data.brandPrimaryColor) delete currentStep2Data.brandPrimaryColor;
        if (currentStep2Data.brandSecondaryColor) delete currentStep2Data.brandSecondaryColor;
        if (currentStep2Data.logoIntegrity) delete currentStep2Data.logoIntegrity;
        if (currentStep2Data.logoDepth) delete currentStep2Data.logoDepth;
        if (currentStep2Data.brandIdentity) delete currentStep2Data.brandIdentity;
        if (currentStep2Data.materialPreset) delete currentStep2Data.materialPreset;
        if (currentStep2Data.surfaceComplexity) delete currentStep2Data.surfaceComplexity;
        if (currentStep2Data.refractionEnabled) delete currentStep2Data.refractionEnabled;
        if (currentStep2Data.heroFeature) delete currentStep2Data.heroFeature;
        if (currentStep2Data.originMetaphor) delete currentStep2Data.originMetaphor;
        if (currentStep2Data.productDNA) delete currentStep2Data.productDNA;
        if (currentStep2Data.styleReferenceUrl) delete currentStep2Data.styleReferenceUrl;
        
        const updatedStep2Data = deepMerge(currentStep2Data, updates);

        // Update video with merged step2Data
        const updatedVideo = await storage.updateVideo(id, {
          step2Data: updatedStep2Data,
          updatedAt: new Date(),
        });

        console.log(`[social-commerce:routes] ✓ Step 2 data updated incrementally (attempt ${attempt + 1}):`, Object.keys(updates));
        
        return res.json({ 
          success: true, 
          step2Data: updatedVideo.step2Data 
        });
      } catch (error: any) {
        lastError = error;
        
        // If this is not a race condition error, don't retry
        if (!error.message?.includes('concurrent') && !error.code?.includes('SERIALIZATION')) {
          throw error;
        }
        
        // Exponential backoff: wait 10ms, 20ms, 40ms, 80ms, 160ms
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 10;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`[social-commerce:routes] Retrying step2Data update (attempt ${attempt + 2})...`);
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('Failed to update step2Data after retries');
    
  } catch (error) {
    console.error('[social-commerce:routes] Update step2Data error:', error);
    res.status(500).json({ error: 'Failed to update step2Data' });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/1/continue
 * Run Agent 1.1, save Step 1 data, and proceed to Step 2
 * 
 * Flow:
 * 1. Receive step1Data from frontend
 * 2. Run Agent 1.1 to generate strategicContext
 * 3. Save step1Data with strategicContext to database
 * 4. Update currentStep to 2
 * 5. Return updated video
 */
router.patch('/videos/:id/step/1/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const step1Data = req.body as Step1Data;

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Validate required fields for Agent 1.1
    if (!step1Data.productTitle || !step1Data.targetAudience) {
      return res.status(400).json({ 
        error: 'productTitle and targetAudience are required for strategic optimization' 
      });
    }

    console.log('[social-commerce:routes] Step 1 continue - running Agent 1.1:', {
      videoId: id,
      product: step1Data.productTitle,
      audience: step1Data.targetAudience,
      duration: step1Data.duration,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // RUN AGENT 1.1: STRATEGIC CONTEXT OPTIMIZER
    // ═══════════════════════════════════════════════════════════════════════════
    
    const agentInput: StrategicContextInput = {
      productTitle: step1Data.productTitle,
      productDescription: step1Data.productDescription,
      productCategory: step1Data.productCategory,
      targetAudience: step1Data.targetAudience,
      region: step1Data.region,
      aspectRatio: step1Data.aspectRatio || SOCIAL_COMMERCE_CONFIG.defaults.aspectRatio,
      duration: step1Data.duration || SOCIAL_COMMERCE_CONFIG.defaults.duration,
      customImageInstructions: step1Data.customImageInstructions,
      customMotionInstructions: step1Data.customMotionInstructions,
    };

    const strategicContext = await optimizeStrategicContext(
      agentInput,
      userId,
      video.workspaceId
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE TO DATABASE
    // ═══════════════════════════════════════════════════════════════════════════

    // Merge strategic context into step1Data
    const finalStep1Data: Step1Data = {
      ...step1Data,
      strategicContext,
    };

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    if (!completedSteps.includes(1)) {
      completedSteps.push(1);
    }

    const updated = await storage.updateVideo(id, {
      step1Data: finalStep1Data,
      currentStep: 2,
      completedSteps,
    });

    console.log('[social-commerce:routes] Step 1 completed:', {
      videoId: id,
      currentStep: 2,
      pacingProfile: strategicContext.pacing_profile,
      agentCost: strategicContext.cost,
    });

    res.json(updated);
  } catch (error) {
    console.error('[social-commerce:routes] Step 1 continue error:', error);
    
    // Return more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to complete step 1',
      details: errorMessage,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: PRODUCT & CAST DNA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social-commerce/videos/:id/characters/recommend
 * Generate 3 character recommendations using AI
 * 
 * Called when user clicks "AI Recommend" button.
 * Requires: characterMode (user must select mode first)
 * Optional: character_description, referenceImageUrl (can work from context alone)
 */
router.post('/videos/:id/characters/recommend', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { character_description, referenceImageUrl, characterMode } = req.body;

    // Validate required field: characterMode
    if (!characterMode || !['hand-model', 'full-body', 'silhouette'].includes(characterMode)) {
      return res.status(400).json({ 
        error: 'Character mode is required',
        message: 'Please select a Character Mode (Hand Model, Full Body, or Silhouette) before clicking AI Recommend.'
      });
    }

    // Get video for context
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Description and reference are optional - agent can work from campaign context alone
    const hasDescription = character_description && character_description.trim().length > 0;
    const hasReference = !!referenceImageUrl;

    console.log('[social-commerce] Generating character recommendations...', {
      videoId: id,
      characterMode,
      hasDescription,
      hasReference,
      descriptionLength: character_description?.length || 0,
      inputMode: !hasDescription && !hasReference ? 'context-only' : hasDescription && hasReference ? 'both' : hasDescription ? 'description-only' : 'reference-only',
    });

    // Get context from step1Data
    const step1Data = video.step1Data as any;
    
    // Build planning input
    const { generateCharacterRecommendations } = await import('../agents/tab-2/character-planning');
    
    const planningInput = {
      // Context from Tab 1
      strategic_directives: step1Data?.strategicContext?.strategic_directives || '',
      targetAudience: step1Data?.targetAudience || '',
      optimized_image_instruction: step1Data?.strategicContext?.optimized_image_instruction || '',
      productTitle: step1Data?.productTitle || video.title || '',
      
      // User selected mode (REQUIRED)
      characterMode,
      
      // User input (optional)
      character_description: character_description || undefined,
      referenceImageUrl: referenceImageUrl || undefined,
      
      // Campaign settings
      aspectRatio: step1Data?.aspectRatio || '9:16',
      duration: step1Data?.duration || 15,
    };

    // Generate recommendations
    const result = await generateCharacterRecommendations(
      planningInput,
      userId,
      video.workspaceId
    );

    console.log('[social-commerce] Character recommendations generated:', {
      videoId: id,
      count: result.recommendations.length,
      names: result.recommendations.map(r => r.name),
      cost: result.cost,
    });

    res.json({
      success: true,
      recommendations: result.recommendations,
      reasoning: result.reasoning,
      cost: result.cost,
    });

  } catch (error) {
    console.error('[social-commerce] Character recommendation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate character recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/social-commerce/videos/:id/characters/generate-image
 * Agent 2.2b: Generate character image from recommendation
 * 
 * Uses the image model and settings from Tab 1 (step1Data).
 * Implements identity locking strategies for VFX consistency.
 */
router.post('/videos/:id/characters/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { 
      prompt,
      strategy = 'PROMPT_EMBEDDING',
      vfxAnchorTags,
      referenceImageUrl,
      identityId,
      characterName, // Character name from selected recommendation
    } = req.body;

    // Debug logging for prompt validation
    console.log('[social-commerce] Generate image request body:', {
      hasPrompt: !!prompt,
      promptType: typeof prompt,
      promptLength: prompt?.length || 0,
      promptPreview: typeof prompt === 'string' ? prompt.substring(0, 100) : 'N/A',
    });

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.log('[social-commerce] ❌ Prompt validation failed');
      return res.status(400).json({ error: 'Image generation prompt is required' });
    }

    // Get video for settings
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get image settings from Tab 1 (step1Data)
    const step1Data = video.step1Data as any;
    const imageModel = step1Data?.imageModel || 'nano-banana';
    const imageResolution = step1Data?.imageResolution || '1k';
    const aspectRatio = step1Data?.aspectRatio || '9:16';

    console.log('[social-commerce] Generating character image...', {
      videoId: id,
      strategy,
      imageModel,
      imageResolution,
      aspectRatio,
      promptLength: prompt.length,
      hasReference: !!referenceImageUrl,
    });

    // Import and call Agent 2.2b
    const { generateCharacterImage } = await import('../agents/tab-2/character-execution');

    const result = await generateCharacterImage(
      {
        prompt,
        strategy,
        vfxAnchorTags,
        referenceImageUrl,
        identityId,
        imageModel,
        imageResolution,
        aspectRatio,
      },
      userId,
      video.workspaceId
    );

    if (result.error) {
      console.error('[social-commerce] Character image generation failed:', result.error);
      return res.status(500).json({ 
        error: 'Failed to generate character image',
        details: result.error,
      });
    }

    console.log('[social-commerce] Character image generated successfully:', {
      videoId: id,
      imageUrl: result.imageUrl?.substring(0, 80) + '...',
      cost: result.cost,
    });

    // ═══════════════════════════════════════════════════════════════
    // DOWNLOAD IMAGE FROM RUNWARE AND UPLOAD TO BUNNY CDN
    // ═══════════════════════════════════════════════════════════════
    
    if (!result.imageUrl) {
      return res.status(500).json({ 
        error: 'No image URL returned from generation',
      });
    }

    // Get workspace info for Bunny path
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === video.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
    const workspaceClean = clean(workspace.name || video.workspaceId);

    // Check if Bunny CDN is configured
    if (!bunnyStorage.isBunnyConfigured()) {
      console.warn('[social-commerce] ⚠️  Bunny CDN is NOT configured');
      return res.status(503).json({ error: 'File storage is not configured' });
    }

    try {
      // Download image from Runware URL
      console.log('[social-commerce] Downloading image from Runware...');
      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from Runware: ${imageResponse.statusText}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Determine file extension
      const extensionMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const extension = extensionMap[contentType] || "jpg";

      // Create character record first
      const character = await storage.createCharacter({
        workspaceId: video.workspaceId,
        name: characterName || 'AI Generated Character',
        description: '', // Can be enhanced later
        appearance: '', // Can be enhanced later
      });
      
      console.log('[social-commerce] Character record created:', {
        characterId: character.id,
        characterName: character.name,
      });

      // Upload to Bunny CDN at correct path
      const timestamp = Date.now();
      const filename = `main_${timestamp}.${extension}`;
      const bunnyPath = `${userId}/${workspaceClean}/Assets/Characters/${character.id}/${filename}`;
      
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);

      // Update character with CDN URL
      await storage.updateCharacter(character.id, { imageUrl: cdnUrl });

      console.log('[social-commerce] ✓ Character image uploaded to Bunny:', {
        characterId: character.id,
        characterName: character.name,
        path: bunnyPath,
        url: cdnUrl.substring(0, 80) + '...',
        size: `${(imageBuffer.length / 1024).toFixed(2)}KB`
      });

      // Save to step2Data immediately
      const step2Data = video.step2Data as any || {};
      const updatedStep2Data = {
        ...step2Data,
        character: {
          ...step2Data.character,
          referenceUrl: cdnUrl,
          assetId: character.id,
          name: character.name,
        },
      };
      
      await storage.updateVideo(id, { step2Data: updatedStep2Data });
      console.log('[social-commerce] ✓ Character saved to step2Data');

      res.json({
        success: true,
        imageUrl: cdnUrl, // Return Bunny CDN URL, not Runware URL
        assetId: character.id, // Return character asset ID
        cost: result.cost,
      });

    } catch (uploadError) {
      console.error('[social-commerce] Failed to upload character image to Bunny:', uploadError);
      // Still return the Runware URL as fallback, but log the error
      res.json({
        success: true,
        imageUrl: result.imageUrl, // Fallback to Runware URL
        assetId: null,
        cost: result.cost,
        warning: 'Image generated but failed to upload to Bunny CDN. Using temporary URL.',
      });
    }

  } catch (error) {
    console.error('[social-commerce] Character image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate character image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/2/continue
 * Process Tab 2 (Simplified - uploads already done):
 * 1. Receive already-uploaded CDN URLs and asset IDs
 * 2. Run Agent 2.1 (Product DNA Visionary) with uploaded product images
 * 3. Run Agent 2.2 (Character Curator) if includeHumanElement
 * 4. Run Agent 2.3 (Brand Identity Guardian)
 * 5. Save all outputs to step2Data
 * 6. Update currentStep to 3
 */
router.patch('/videos/:id/step/2/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const requestData = req.body;

    // Get video info
    const video = await storage.getVideo(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    console.log('[social-commerce] Starting Tab 2 AI processing...', {
      videoId: id,
      videoTitle: video.title,
      workspaceId: video.workspaceId,
    });

    // ═══════════════════════════════════════════════════════════════
    // EXTRACT ALREADY-UPLOADED URLS AND ASSET IDS FROM REQUEST
    // (Uploads happened immediately when user selected files)
    // ═══════════════════════════════════════════════════════════════
    
    const productImageUrls = {
      heroProfile: requestData.heroProfileUrl || null,
      macroDetail: requestData.macroDetailUrl || null,
      materialReference: requestData.materialReferenceUrl || null,
    };

    const characterReferenceUrl = requestData.characterReferenceUrl || null;
    const characterAssetId = requestData.characterAssetId || null;
    
    const logoUrl = requestData.logoUrl || null;
    const brandkitAssetId = requestData.brandkitAssetId || null;
    
    const styleReferenceUrl = requestData.styleReferenceUrl || null;

    // Validate hero image exists
    if (!productImageUrls.heroProfile) {
      return res.status(400).json({ error: 'Hero profile image is required' });
    }

    console.log('[social-commerce] Received uploaded assets:', {
      productImages: Object.keys(productImageUrls).filter(k => productImageUrls[k as keyof typeof productImageUrls]),
      hasCharacter: !!characterAssetId,
      hasBrandkit: !!brandkitAssetId,
      hasStyleRef: !!styleReferenceUrl,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: RUN AGENT 2.1 - PRODUCT DNA VISIONARY
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[social-commerce] Running Agent 2.1: Product DNA Visionary...');
    
    // Import agents dynamically to avoid circular dependencies
    const { analyzeProductDNA } = await import('../agents/tab-2/product-dna-visionary');
    
    const productDNAInput = {
      heroProfile: productImageUrls.heroProfile!,
      macroDetail: productImageUrls.macroDetail,
      materialReference: productImageUrls.materialReference,
      materialPreset: requestData.materialPreset || 'metallic',
      surfaceComplexity: requestData.surfaceComplexity || 50,
      refractionEnabled: requestData.refractionEnabled || false,
      heroFeature: requestData.heroFeature || '',
      originMetaphor: requestData.originMetaphor || '',
    };

    const productDNA = await analyzeProductDNA(productDNAInput, userId, video.workspaceId);
    
    console.log('[social-commerce] Agent 2.1 completed:', {
      hasGeometry: !!productDNA.geometry_profile,
      hasMaterial: !!productDNA.material_spec,
      anchorPoints: productDNA.hero_anchor_points?.length || 0,
      cost: productDNA.cost,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: RUN AGENT 2.2 - CHARACTER CURATOR (conditional)
    // ═══════════════════════════════════════════════════════════════
    // Agent 2.2 only runs for AI-generated characters (when description provided).
    // For uploaded characters, the frontend already created a minimal profile.
    
    let characterAIProfile = requestData.characterAIProfile || null;
    let characterCost = 0;

    // Character AI Profile handling:
    // - If user used "AI Recommend" → characterAIProfile is already set from their selection
    // - If user uploaded a character → No AI profile needed
    // - If user typed custom description → Use the description without AI profile
    //   (AI profiles require using AI Recommend to get the full profile with identity_locking, etc.)
    
    if (characterAIProfile) {
      console.log('[social-commerce] Using AI Recommend character profile:', {
        identityId: characterAIProfile.identity_id || characterAIProfile.character_profile?.identity_id,
        hasInteractionProtocol: !!characterAIProfile.interaction_protocol,
        hasIdentityLocking: !!characterAIProfile.identity_locking,
      });
    } else if (requestData.includeHumanElement) {
      console.log('[social-commerce] Character without AI profile:', {
        hasDescription: !!requestData.characterDescription,
        hasAssetId: !!requestData.characterAssetId,
        mode: requestData.characterMode,
        note: 'For full AI profile with VFX consistency, use AI Recommend',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: RUN AGENT 2.3 - BRAND IDENTITY GUARDIAN
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[social-commerce] Running Agent 2.3: Brand Identity Guardian...');
    
    const { convertBrandIdentity } = await import('../agents/tab-2/brand-identity-guardian');
    
    const brandIdentityInput = {
      logoUrl,
      brandPrimaryColor: requestData.brandPrimaryColor || '#000000',
      brandSecondaryColor: requestData.brandSecondaryColor || '#FFFFFF',
      logoIntegrity: requestData.logoIntegrity || 5,
      logoDepth: requestData.logoDepth || 3,
    };

    const brandIdentity = convertBrandIdentity(brandIdentityInput);
    
    console.log('[social-commerce] Agent 2.3 completed (algorithmic, no cost):', {
      integrity: brandIdentity.logo_integrity,
      depth: brandIdentity.logo_depth,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: SAVE TO DATABASE (Organized Nested Structure)
    // ═══════════════════════════════════════════════════════════════
    
    // DEBUG: Verify agent outputs before constructing step2Data
    console.log('[social-commerce] Agent outputs verification:', {
      productDNA: {
        exists: !!productDNA,
        hasGeometry: !!productDNA?.geometry_profile,
        hasMaterial: !!productDNA?.material_spec,
        hasAnchors: !!productDNA?.hero_anchor_points,
        hasLighting: !!productDNA?.lighting_response,
        keys: productDNA ? Object.keys(productDNA) : [],
        geometryPreview: productDNA?.geometry_profile?.substring(0, 100),
      },
      brandIdentity: {
        exists: !!brandIdentity,
        hasIntegrity: !!brandIdentity?.logo_integrity,
        hasDepth: !!brandIdentity?.logo_depth,
        hasColors: !!brandIdentity?.brand_colors,
        keys: brandIdentity ? Object.keys(brandIdentity) : [],
        fullOutput: JSON.stringify(brandIdentity),
      },
      characterAIProfile: {
        exists: !!characterAIProfile,
        keys: characterAIProfile ? Object.keys(characterAIProfile) : [],
      },
    });

    // Validate agent outputs exist
    if (!productDNA) {
      throw new Error('Agent 2.1 (Product DNA) returned no output');
    }
    if (!brandIdentity) {
      throw new Error('Agent 2.3 (Brand Identity) returned no output');
    }
    
    const step2Data: Step2Data = {
      product: {
        images: productImageUrls,
        material: {
          preset: requestData.materialPreset || 'metallic',
          surfaceComplexity: requestData.surfaceComplexity || 50,
          refractionEnabled: requestData.refractionEnabled || false,
          heroFeature: requestData.heroFeature || '',
          originMetaphor: requestData.originMetaphor || '',
        },
        dna: productDNA, // Agent 2.1 output
      },
      character: requestData.includeHumanElement ? {
        mode: requestData.characterMode,
        name: requestData.characterName,
        description: requestData.characterDescription,
        referenceUrl: characterReferenceUrl,
        assetId: characterAssetId,
        aiProfile: characterAIProfile, // Agent 2.2 output
      } : undefined,
      brand: {
        logoUrl,
        name: requestData.brandName,
        assetId: brandkitAssetId,
        colors: {
          primary: requestData.brandPrimaryColor || '#000000',
          secondary: requestData.brandSecondaryColor || '#FFFFFF',
        },
        logo: {
          integrity: requestData.logoIntegrity || 5,
          depth: requestData.logoDepth || 3,
        },
        identity: brandIdentity, // Agent 2.3 output
      },
      style: {
        referenceUrl: styleReferenceUrl,
      },
    };

    // DEBUG: Verify step2Data structure before saving
    console.log('[social-commerce] Constructed step2Data structure:', {
      hasProductDNA: !!step2Data.product?.dna,
      hasBrandIdentity: !!step2Data.brand?.identity,
      hasCharacterProfile: !!step2Data.character?.aiProfile,
      productDNAKeys: step2Data.product?.dna ? Object.keys(step2Data.product.dna) : [],
      brandIdentityKeys: step2Data.brand?.identity ? Object.keys(step2Data.brand.identity) : [],
      step2DataSize: JSON.stringify(step2Data).length,
    });

    // Update completed steps
    const completedSteps = Array.isArray(video.completedSteps) ? [...video.completedSteps] : [];
    if (!completedSteps.includes(2)) {
      completedSteps.push(2);
    }

    const updated = await storage.updateVideo(id, {
      step2Data,
      currentStep: 3,
      completedSteps,
    });

    // DEBUG: Verify what was actually saved to database
    const savedStep2Data = updated.step2Data as any;
    console.log('[social-commerce] Database save verification:', {
      videoId: id,
      savedProductDNA: savedStep2Data?.product?.dna 
        ? {
            exists: true,
            hasGeometry: !!savedStep2Data.product.dna.geometry_profile,
            hasMaterial: !!savedStep2Data.product.dna.material_spec,
            hasAnchors: !!savedStep2Data.product.dna.hero_anchor_points,
            hasLighting: !!savedStep2Data.product.dna.lighting_response,
            keys: Object.keys(savedStep2Data.product.dna),
          }
        : { exists: false, reason: 'product.dna is missing' },
      savedBrandIdentity: savedStep2Data?.brand?.identity
        ? {
            exists: true,
            hasIntegrity: !!savedStep2Data.brand.identity.logo_integrity,
            hasDepth: !!savedStep2Data.brand.identity.logo_depth,
            hasColors: !!savedStep2Data.brand.identity.brand_colors,
            keys: Object.keys(savedStep2Data.brand.identity),
          }
        : { exists: false, reason: 'brand.identity is missing' },
      savedCharacterProfile: savedStep2Data?.character?.aiProfile
        ? { exists: true, keys: Object.keys(savedStep2Data.character.aiProfile) }
        : { exists: false },
    });

    console.log('[social-commerce] Tab 2 completed successfully:', {
      videoId: id,
      currentStep: 3,
      completedSteps,
      totalCost: (productDNA.cost || 0) + characterCost,
      assetsCreated: {
        character: !!characterAssetId,
        brandkit: !!brandkitAssetId,
      },
    });

    res.json({
      video: updated,
      assets: {
        characterId: characterAssetId,
        brandkitId: brandkitAssetId,
      },
      costs: {
        productDNA: productDNA.cost || 0,
        character: characterCost,
        total: (productDNA.cost || 0) + characterCost,
      },
    });
  } catch (error) {
    console.error('[social-commerce] Tab 2 error:', error);
    res.status(500).json({ 
      error: 'Failed to complete Tab 2',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: ENVIRONMENT & STORY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social-commerce/videos/:id/creative-spark/generate
 * Generate creative spark using Agent 3.0 (AI Recommend button)
 */
router.post('/videos/:id/creative-spark/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Get video and previous step data
    const video = await storage.getVideo(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const step1Data = video.step1Data as Step1Data | null;
    const step2Data = video.step2Data as any;

    if (!step1Data || !step2Data) {
      return res.status(400).json({ error: 'Previous steps must be completed first' });
    }

    // Extract inputs from step1Data and step2Data
    const strategicContext = step1Data.strategicContext;
    if (!strategicContext) {
      return res.status(400).json({ error: 'Strategic context not found. Please complete Tab 1 first.' });
    }

    const productDNA = step2Data.product?.dna;
    if (!productDNA) {
      return res.status(400).json({ error: 'Product DNA not found. Please complete Tab 2 first.' });
    }

    console.log('[social-commerce] Generating creative spark for video:', id);
    console.log('[social-commerce] Step1Data exists:', !!step1Data);
    console.log('[social-commerce] Step2Data exists:', !!step2Data);
    console.log('[social-commerce] Strategic context:', strategicContext ? {
      hasDirectives: !!strategicContext.strategic_directives,
      pacingProfile: strategicContext.pacing_profile,
    } : 'missing');
    console.log('[social-commerce] Product DNA:', productDNA ? {
      hasGeometry: !!productDNA.geometry_profile,
      hasMaterial: !!productDNA.material_spec,
    } : 'missing');

    // Import agent dynamically
    const { generateCreativeSpark } = await import('../agents/tab-3/creative-concept-catalyst');

    const sparkInput = {
      strategic_directives: strategicContext.strategic_directives,
      targetAudience: step1Data.targetAudience || '',
      region: step1Data.region || '',
      duration: step1Data.duration || 30,
      pacing_profile: strategicContext.pacing_profile,
      geometry_profile: productDNA.geometry_profile,
      material_spec: productDNA.material_spec,
      heroFeature: step2Data.product?.material?.heroFeature || '',
      originMetaphor: step2Data.product?.material?.originMetaphor || '',
      includeHumanElement: step2Data.character ? true : false,
      characterMode: step2Data.character?.mode,
      character_profile: step2Data.character?.aiProfile,
    };

    console.log('[social-commerce] Spark input prepared:', {
      hasStrategicDirectives: !!sparkInput.strategic_directives,
      targetAudience: sparkInput.targetAudience,
      hasGeometryProfile: !!sparkInput.geometry_profile,
      hasMaterialSpec: !!sparkInput.material_spec,
      heroFeature: sparkInput.heroFeature,
      originMetaphor: sparkInput.originMetaphor,
      includeHumanElement: sparkInput.includeHumanElement,
    });

    const sparkOutput = await generateCreativeSpark(sparkInput, userId, video.workspaceId);

    console.log('[social-commerce] Spark output received:', {
      hasSpark: !!sparkOutput.creative_spark,
      sparkLength: sparkOutput.creative_spark?.length,
      sparkPreview: sparkOutput.creative_spark?.substring(0, 100),
      cost: sparkOutput.cost,
    });

    // Validate output
    if (!sparkOutput.creative_spark || sparkOutput.creative_spark.trim().length < 50) {
      console.error('[social-commerce] Invalid spark output:', sparkOutput);
      throw new Error('Agent returned invalid or empty creative spark');
    }

    // Save the creative spark to step3Data so it persists
    const existingStep3Data = video.step3Data as any || {};
    const updatedStep3Data = {
      ...existingStep3Data,
      creativeSpark: {
        creative_spark: sparkOutput.creative_spark,
        cost: sparkOutput.cost || 0,
      },
    };

    await storage.updateVideo(id, {
      step3Data: updatedStep3Data,
    });

    console.log('[social-commerce] Saved creative spark to step3Data');

    res.json({
      success: true,
      creative_spark: sparkOutput.creative_spark,
      cost: sparkOutput.cost,
    });
  } catch (error) {
    console.error('[social-commerce] Error generating creative spark:', error);
    res.status(500).json({
      error: 'Failed to generate creative spark',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/social-commerce/videos/:id/visual-beats/generate
 * Generate visual beats using Agent 3.2 (Narrative Architect)
 * This is called when user clicks "Generate Visual Beats" button
 */
router.post('/videos/:id/visual-beats/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { campaignSpark, campaignObjective } = req.body;

    // Get video and previous step data
    const video = await storage.getVideo(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const step1Data = video.step1Data as Step1Data | null;
    const step3Data = video.step3Data as any;

    if (!step1Data) {
      return res.status(400).json({ error: 'Tab 1 must be completed first. Please complete Strategic Context setup.' });
    }

    // Extract inputs from step1Data
    const strategicContext = step1Data.strategicContext;
    if (!strategicContext) {
      return res.status(400).json({ error: 'Strategic context not found. Please complete Tab 1 first.' });
    }

    // Get creative spark from step3Data if available, otherwise use campaignSpark
    let creativeSpark: string;
    if (step3Data?.creativeSpark?.creative_spark) {
      creativeSpark = step3Data.creativeSpark.creative_spark;
      console.log('[social-commerce] Using creative spark from step3Data');
    } else if (campaignSpark && campaignSpark.trim().length >= 10) {
      creativeSpark = campaignSpark;
      console.log('[social-commerce] Using campaignSpark as creative spark (step3Data not available)');
    } else {
      return res.status(400).json({ error: 'Creative spark is required. Please fill in the Creative Spark field or use AI Recommend first.' });
    }

    console.log('[social-commerce] Generating visual beats for video:', id);

    // Import agent dynamically
    const { createNarrative } = await import('../agents/tab-3/narrative-architect');

    const narrativeInput = {
      creative_spark: creativeSpark,
      campaignSpark: campaignSpark || '',
      campaignObjective: campaignObjective === 'awareness' ? 'brand-awareness' :
                         campaignObjective === 'showcase' ? 'feature-showcase' :
                         campaignObjective === 'sales' ? 'sales-cta' : 'brand-awareness',
      visualBeats: {
        beat1: '', // Empty - agent will generate from scratch
        beat2: '',
        beat3: '',
      },
      pacing_profile: strategicContext.pacing_profile,
      duration: step1Data.duration || 30,
    };

    console.log('[social-commerce] Calling Agent 3.2 with:', {
      hasCreativeSpark: !!narrativeInput.creative_spark,
      objective: narrativeInput.campaignObjective,
      pacing: narrativeInput.pacing_profile,
      duration: narrativeInput.duration,
    });

    const narrativeOutput = await createNarrative(narrativeInput, userId, video.workspaceId);

    console.log('[social-commerce] Visual beats generated:', {
      hasAct1: !!narrativeOutput.script_manifest.act_1_hook.text,
      hasAct2: !!narrativeOutput.script_manifest.act_2_transform.text,
      hasAct3: !!narrativeOutput.script_manifest.act_3_payoff.text,
      hasCta: !!narrativeOutput.script_manifest.act_3_payoff.cta_text,
      cost: narrativeOutput.cost,
    });

    // Save the narrative output to step3Data so we can reuse it on Continue
    const existingStep3Data = video.step3Data as any || {};
    const updatedStep3Data = {
      ...existingStep3Data,
      narrative: narrativeOutput, // Save full script manifest
    };

    // Also save creative spark if provided (from campaignSpark parameter)
    // This ensures creative spark is saved even if user didn't click "AI Recommend"
    if (campaignSpark && campaignSpark.trim().length >= 10) {
      updatedStep3Data.creativeSpark = {
        creative_spark: campaignSpark,
        cost: 0, // No cost since it was manually entered or already generated
      };
      console.log('[social-commerce] Also saving creative spark from request');
    }

    await storage.updateVideo(id, {
      step3Data: updatedStep3Data,
    });

    console.log('[social-commerce] Saved narrative output to step3Data for reuse on Continue');

    res.json({
      success: true,
      script_manifest: narrativeOutput.script_manifest,
      cost: narrativeOutput.cost,
    });
  } catch (error) {
    console.error('[social-commerce] Error generating visual beats:', error);
    res.status(500).json({
      error: 'Failed to generate visual beats',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/3/continue
 * Process Tab 3:
 * 1. Validate creative spark is provided (required - user must fill or use AI Recommend)
 * 2. Run Agent 3.1 (Atmospheric World-Builder)
 * 3. Reuse existing narrative OR run Agent 3.2 (if beats are filled but not generated)
 * 4. Run Agent 3.3 (Asset-Environment Harmonizer)
 * 5. Save all outputs to step3Data
 * 6. Update currentStep to 4
 * 
 * Note: 
 * - Agent 3.0 only runs when user clicks "AI Recommend" button
 * - Agent 3.2 only runs on Continue if narrative wasn't already generated via "Generate Visual Beats"
 * - Creative Spark and Visual Beats must be filled before Continue
 */
router.patch('/videos/:id/step/3/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const requestData = req.body;

    // Get video and previous step data
    const video = await storage.getVideo(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const step1Data = video.step1Data as Step1Data | null;
    const step2Data = video.step2Data as any;

    if (!step1Data || !step2Data) {
      return res.status(400).json({ error: 'Previous steps must be completed first' });
    }

    console.log('[social-commerce] Starting Tab 3 AI processing...', {
      videoId: id,
      videoTitle: video.title,
      workspaceId: video.workspaceId,
    });

    // Extract inputs from previous steps
    const strategicContext = step1Data.strategicContext;
    if (!strategicContext) {
      return res.status(400).json({ error: 'Strategic context not found' });
    }

    const productDNA = step2Data.product?.dna;
    if (!productDNA) {
      return res.status(400).json({ error: 'Product DNA not found' });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: VALIDATE CREATIVE SPARK (Required - user must fill or use AI Recommend)
    // ═══════════════════════════════════════════════════════════════
    
    // Creative Spark is REQUIRED - user must fill it manually or use "AI Recommend" button
    // Agent 3.0 does NOT run on Continue - it only runs when user clicks "AI Recommend"
    if (!requestData.campaignSpark || requestData.campaignSpark.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Creative Spark is required. Please fill in the Creative Spark field or use "AI Recommend" first.' 
      });
    }

    const creativeSpark = requestData.campaignSpark;
    const sparkCost = 0; // No cost since Agent 3.0 was already run via AI Recommend (if used)
    
    console.log('[social-commerce] Using provided creative spark (length:', creativeSpark.length, ')');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: RUN AGENT 3.1 - ATMOSPHERIC WORLD-BUILDER
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[social-commerce] Running Agent 3.1: Atmospheric World-Builder...');
    
    const { buildEnvironment } = await import('../agents/tab-3/atmospheric-world-builder');
    
    const environmentInput = {
      strategic_directives: strategicContext.strategic_directives,
      optimized_image_instruction: strategicContext.optimized_image_instruction,
      creative_spark: creativeSpark,
      environmentConcept: requestData.environmentConcept || '',
      atmosphericDensity: requestData.atmosphericDensity || 50,
      cinematicLighting: requestData.cinematicLighting || '',
      visualPreset: requestData.visualPreset || '',
      styleReferenceUrl: requestData.styleReferenceUrl || null,
      environmentBrandPrimaryColor: requestData.environmentBrandPrimaryColor,
      environmentBrandSecondaryColor: requestData.environmentBrandSecondaryColor,
    };

    const environmentOutput = await buildEnvironment(environmentInput, userId, video.workspaceId);
    
    console.log('[social-commerce] Agent 3.1 completed:', {
      hasLighting: !!environmentOutput.visual_manifest.global_lighting_setup,
      particleType: environmentOutput.visual_manifest.physics_parameters.particle_type,
      cost: environmentOutput.cost,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: GET OR RUN AGENT 3.2 - 3-ACT NARRATIVE ARCHITECT
    // ═══════════════════════════════════════════════════════════════
    
    let narrativeOutput: any;
    let narrativeCost = 0;

    // Check if narrative was already generated via "Generate Visual Beats"
    const existingStep3Data = video.step3Data as any;
    if (existingStep3Data?.narrative?.script_manifest) {
      // Reuse existing narrative output
      narrativeOutput = existingStep3Data.narrative;
      narrativeCost = existingStep3Data.narrative.cost || 0;
      console.log('[social-commerce] Reusing existing narrative output from "Generate Visual Beats"');
    } else {
      // Validate that beats are filled (required before Continue)
      const hasAllBeats = requestData.visualBeats?.beat1 && 
                          requestData.visualBeats?.beat2 && 
                          requestData.visualBeats?.beat3;
      
      if (!hasAllBeats) {
        return res.status(400).json({ 
          error: 'Visual beats are required. Please fill in all three beats or use "Generate Visual Beats" first.' 
        });
      }

      // Run Agent 3.2 to create script manifest
      console.log('[social-commerce] Running Agent 3.2: 3-Act Narrative Architect...');
      
      const { createNarrative } = await import('../agents/tab-3/narrative-architect');
      
      const narrativeInput = {
        creative_spark: creativeSpark,
        campaignSpark: requestData.campaignSpark || '',
        campaignObjective: requestData.campaignObjective || 'brand-awareness', // Default if not provided (optional field)
        visualBeats: {
          beat1: requestData.visualBeats?.beat1 || '',
          beat2: requestData.visualBeats?.beat2 || '',
          beat3: requestData.visualBeats?.beat3 || '',
        },
        pacing_profile: strategicContext.pacing_profile,
        duration: step1Data.duration || 30,
      };

      narrativeOutput = await createNarrative(narrativeInput, userId, video.workspaceId);
      narrativeCost = narrativeOutput.cost || 0;
      
      console.log('[social-commerce] Agent 3.2 completed:', {
        act1Energy: narrativeOutput.script_manifest.act_1_hook.target_energy,
        act2Energy: narrativeOutput.script_manifest.act_2_transform.target_energy,
        act3Energy: narrativeOutput.script_manifest.act_3_payoff.target_energy,
        cost: narrativeCost,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: RUN AGENT 3.3 - ASSET-ENVIRONMENT HARMONIZER
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[social-commerce] Running Agent 3.3: Asset-Environment Harmonizer...');
    
    const { harmonizeAssets } = await import('../agents/tab-3/asset-environment-harmonizer');
    
    const harmonizerInput = {
      visual_manifest: environmentOutput.visual_manifest,
      geometry_profile: productDNA.geometry_profile,
      material_spec: productDNA.material_spec,
      heroFeature: step2Data.product?.material?.heroFeature || '',
      originMetaphor: step2Data.product?.material?.originMetaphor || '',
      includeHumanElement: step2Data.character ? true : false,
      characterMode: step2Data.character?.mode,
      character_profile: step2Data.character?.aiProfile,
    };

    const harmonizerOutput = await harmonizeAssets(harmonizerInput, userId, video.workspaceId);
    
    console.log('[social-commerce] Agent 3.3 completed:', {
      hasProductModifiers: !!harmonizerOutput.interaction_physics.product_modifiers,
      hasCharacterModifiers: !!harmonizerOutput.interaction_physics.character_modifiers,
      cost: harmonizerOutput.cost,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: RUN TAB 4 AGENTS (Immediately after Tab 3)
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[social-commerce] Running Tab 4 agents...');
    
    // Run Agent 4.1: Cinematic Media Planner
    const { planShots } = await import('../agents/tab-4/cinematic-media-planner');
    
    const mediaPlannerInput = {
      // Tab 1 context
      strategicContext: {
        targetAudience: strategicContext.targetAudience,
        region: strategicContext.region,
        strategic_directives: strategicContext.strategic_directives,
        pacing_profile: strategicContext.pacing_profile,
        optimized_image_instruction: strategicContext.optimized_image_instruction,
      },
      duration: step1Data.duration || 30,
      
      // Tab 2 context
      productDNA: {
        geometry_profile: productDNA.geometry_profile,
        material_spec: productDNA.material_spec,
        hero_anchor_points: productDNA.hero_anchor_points,
        lighting_response: productDNA.lighting_response,
      },
      productImages: {
        heroProfile: step2Data.product?.images?.heroProfile,
        macroDetail: step2Data.product?.images?.macroDetail,
        materialReference: step2Data.product?.images?.materialReference,
      },
      characterReferenceUrl: step2Data.character?.referenceUrl,
      characterProfile: step2Data.character?.aiProfile,
      characterMode: step2Data.character?.mode,
      logoUrl: step2Data.brand?.logoUrl,
      logoIntegrity: step2Data.brand?.logo?.integrity,
      logoDepth: step2Data.brand?.logo?.depth,
      
      // Tab 3 context
      creativeSpark: creativeSpark,
      visualManifest: environmentOutput.visual_manifest,
      scriptManifest: narrativeOutput.script_manifest,
      interactionPhysics: harmonizerOutput.interaction_physics,
    };

    const mediaPlannerOutput = await planShots(mediaPlannerInput, userId, video.workspaceId);
    
    console.log('[social-commerce] Agent 4.1 completed:', {
      sceneCount: mediaPlannerOutput.scenes.length,
      totalShots: mediaPlannerOutput.scenes.reduce((sum, s) => sum + s.shots.length, 0),
      cost: mediaPlannerOutput.cost,
    });

    // Run Agent 4.2: Temporal Rhythmic Orchestrator
    const { calculateTiming } = await import('../agents/tab-4/temporal-rhythmic-orchestrator');
    
    const timingInput = {
      scenes: mediaPlannerOutput.scenes,
      pacing_profile: strategicContext.pacing_profile,
      total_campaign_duration: step1Data.duration || 30,
      script_manifest: {
        act_1_hook: {
          target_energy: narrativeOutput.script_manifest.act_1_hook.target_energy,
          sfx_cue: narrativeOutput.script_manifest.act_1_hook.sfx_cue,
        },
        act_2_transform: {
          target_energy: narrativeOutput.script_manifest.act_2_transform.target_energy,
          sfx_cue: narrativeOutput.script_manifest.act_2_transform.sfx_cue,
        },
        act_3_payoff: {
          target_energy: narrativeOutput.script_manifest.act_3_payoff.target_energy,
          sfx_cue: narrativeOutput.script_manifest.act_3_payoff.sfx_cue,
        },
      },
    };

    const timingOutput = await calculateTiming(timingInput, userId, video.workspaceId);
    
    console.log('[social-commerce] Agent 4.2 completed:', {
      shotCount: timingOutput.temporal_map.length,
      actualTotal: timingOutput.duration_budget.actual_total,
      variance: timingOutput.duration_budget.variance,
      cost: timingOutput.cost,
    });

    // Calculate VFX Seeds (algorithmic)
    const { calculateVfxSeeds } = await import('../agents/tab-4/vfx-seeds-calculator');
    
    const vfxSeeds = [];
    for (const scene of mediaPlannerOutput.scenes) {
      for (let i = 0; i < scene.shots.length; i++) {
        const shot = scene.shots[i];
        const previousShot = i > 0 ? scene.shots[i - 1] : null;
        const vfxSeed = calculateVfxSeeds(shot, previousShot, shot.continuity_logic);
        vfxSeeds.push(vfxSeed);
      }
    }
    
    console.log('[social-commerce] VFX Seeds calculated:', {
      seedCount: vfxSeeds.length,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: SAVE TO DATABASE
    // ═══════════════════════════════════════════════════════════════
    
    const step3Data = {
      creativeSpark: {
        creative_spark: creativeSpark,
        cost: sparkCost,
      },
      environment: environmentOutput,
      narrative: narrativeOutput,
      harmonizer: harmonizerOutput,
    };

    // Build step4Data
    const step4Data = {
      mediaPlanner: mediaPlannerOutput,
      timing: timingOutput,
      vfxSeeds: vfxSeeds,
    };

    // Update completed steps
    const completedSteps = Array.isArray(video.completedSteps) ? [...video.completedSteps] : [];
    if (!completedSteps.includes(3)) {
      completedSteps.push(3);
    }

    const updated = await storage.updateVideo(id, {
      step3Data,
      step4Data, // NEW: Save Tab 4 output
      currentStep: 4,
      completedSteps,
    });

    const totalCost = (sparkCost || 0) + 
                     (environmentOutput.cost || 0) + 
                     (narrativeCost || 0) + 
                     (harmonizerOutput.cost || 0) +
                     (mediaPlannerOutput.cost || 0) + // NEW
                     (timingOutput.cost || 0); // NEW

    console.log('[social-commerce] Tab 3 and Tab 4 completed successfully:', {
      videoId: id,
      currentStep: 4,
      totalCost,
    });

    res.json({
      success: true,
      step3Data,
      step4Data, // NEW: Include in response
      currentStep: 4,
      totalCost,
    });
  } catch (error) {
    console.error('[social-commerce] Error processing Tab 3:', error);
    res.status(500).json({
      error: 'Failed to process Tab 3',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: SHOT ORCHESTRATOR (Placeholder - Sprint 5)
// ═══════════════════════════════════════════════════════════════════════════════

router.patch('/videos/:id/step/4/continue', isAuthenticated, async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet - Sprint 5' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: MEDIA PLANNING & GENERATION (Placeholder - Sprint 6)
// ═══════════════════════════════════════════════════════════════════════════════

router.patch('/videos/:id/step/5/continue', isAuthenticated, async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet - Sprint 6' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social-commerce/config
 * Returns mode configuration for frontend
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    mode: SOCIAL_COMMERCE_CONFIG.mode,
    totalSteps: SOCIAL_COMMERCE_CONFIG.totalSteps,
    defaults: SOCIAL_COMMERCE_CONFIG.defaults,
    pacingProfiles: SOCIAL_COMMERCE_CONFIG.pacingProfiles,
    characterModes: SOCIAL_COMMERCE_CONFIG.characterModes,
    speedCurves: SOCIAL_COMMERCE_CONFIG.speedCurves,
    videoGeneration: SOCIAL_COMMERCE_CONFIG.videoGeneration,
  });
});

export default router;

