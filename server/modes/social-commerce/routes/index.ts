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
import { bunnyStorage, buildVideoModePath, buildVideoProjectFolderPath } from '../../../storage/bunny-storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { callAi } from '../../../ai/service';
import { getVideoDimensionsForImageGeneration } from '../../../ai/config';
import { SOCIAL_COMMERCE_CONFIG } from '../config';
import { generateBeatPrompts } from '../agents/tab-3/prompt-architect';
import { generateVoiceoverScripts } from '../agents/tab-3/voiceover-script-architect';
import { generateComposite } from '../services/composite-generator';
import { trimVideoStart } from '../../../stories/shared/services/ffmpeg-helpers';
import type { BatchBeatPromptInput, BeatPromptOutput, VoiceoverScriptInput } from '../types';
import type {
  CreateVideoRequest,
  Step1Data,
  Step1Data as Step1DataType,
  Step2Data,
  Step3Data,
  Step4Data,
  // Step5Data, ShotPrompts, PromptArchitectInput, SceneDefinition, ShotDefinition - kept for backward compatibility only
} from '../types';

// Tab-4 Voiceover Routes
import voiceoverPreviewRouter from './tab-4/voiceover-preview';

// Tab-5 Animatic Routes
import animaticRouter from './tab-5/animatic';

// Tab-6 Export Routes
import exportRouter from './tab-6/export';

const router = Router();

// Mount tab-4 voiceover routes
router.use('/voiceover', voiceoverPreviewRouter);

// Mount tab-5 animatic routes
router.use('/animatic', animaticRouter);

// Mount tab-6 export routes
router.use('/export', exportRouter);

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
  category: 'product';
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

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHORIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verify user has access to a workspace
 * Returns the workspace if accessible, null otherwise
 * 
 * Note: Videos belong to workspaces, not directly to users.
 * Access control is workspace-based, not video-based.
 */
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const workspaces = await storage.getWorkspacesByUserId(userId);
  return workspaces.find(w => w.id === workspaceId) || null;
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
    } = req.body;

    if (!category || category !== 'product') {
      return res.status(400).json({ error: 'Invalid category. Must be: product' });
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

    // Upload product image to Assets/Uploads/
    const filename = `product_${timestamp}.${extension}`;
    const bunnyPath = `${userId}/${workspaceClean}/Assets/Uploads/${filename}`;

    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

    // Create uploads table record
    const uploadRecord = await storage.createUpload({
      workspaceId,
      name: `Product Image${videoId ? ` - Campaign ${videoId.substring(0, 8)}` : ''}`,
      description: 'Product image uploaded from Social Commerce mode',
      fileName: filename,
      fileType: req.file.mimetype,
      fileSize: req.file.buffer.length,
      storageUrl: cdnUrl
    });

    console.log(`[social-commerce] ✓ Product uploaded to Bunny:`, {
      path: bunnyPath,
      url: cdnUrl,
      uploadId: uploadRecord.id,
      size: `${(req.file.buffer.length / 1024).toFixed(2)}KB`
    });

    res.json({
      cdnUrl,
      assetId: uploadRecord.id,
      assetType: 'upload',
      category: 'product',
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

/**
 * DELETE /api/social-commerce/composite
 * Delete composite image from CDN by URL
 */
router.delete('/composite', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract file path from CDN URL
    const filePath = extractFilePathFromUrl(url);
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid CDN URL' });
    }

    // Check if it's a composite image path (support both old and new paths)
    if (!filePath.includes('/Assets/Composites/') && !filePath.includes('/Rendered/Composites/')) {
      return res.status(400).json({ error: 'URL is not a composite image' });
    }

    // Delete from Bunny CDN
    try {
      await bunnyStorage.deleteFile(filePath);
      console.log(`[social-commerce] ✓ Deleted composite image from Bunny CDN: ${filePath}`);
      res.json({ success: true, message: 'Composite image deleted' });
    } catch (bunnyError) {
      console.error('[social-commerce] Failed to delete composite from Bunny CDN:', bunnyError);
      res.status(500).json({ error: 'Failed to delete composite image' });
    }
  } catch (error) {
    console.error('[social-commerce] Delete composite error:', error);
    res.status(500).json({ error: 'Failed to delete composite' });
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
  if (!BUNNY_CDN_URL || !cdnUrl) {
    console.warn('[social-commerce] Missing BUNNY_CDN_URL or cdnUrl:', { 
      hasBunnyUrl: !!BUNNY_CDN_URL, 
      hasCdnUrl: !!cdnUrl 
    });
    return '';
  }
  
  const cdnBase = BUNNY_CDN_URL.replace(/\/+$/, '');
  const filePath = cdnUrl.replace(`${cdnBase}/`, '');
  
  console.log('[social-commerce] Extracted file path:', {
    originalUrl: cdnUrl,
    cdnBase,
    extractedPath: filePath,
  });
  
  return filePath;
}

/**
 * Helper: Resolve product image URL with priority:
 * 1. Composite image (if applied)
 * 2. Hero profile image
 * 3. Legacy productImageUrl (backward compatibility)
 */
function resolveProductImageUrl(step1Data: Step1Data): string | null {
  // Priority 1: Applied composite image
  if (step1Data.productImages?.compositeImage?.isApplied && step1Data.productImages.compositeImage.url) {
    console.log('[social-commerce] Using applied composite image:', step1Data.productImages.compositeImage.url);
    return step1Data.productImages.compositeImage.url;
  }
  
  // Priority 2: Hero profile image
  if (step1Data.productImages?.heroProfile) {
    console.log('[social-commerce] Using hero profile image:', step1Data.productImages.heroProfile);
    return step1Data.productImages.heroProfile;
  }
  
  // Priority 3: Legacy productImageUrl (backward compatibility)
  if (step1Data.productImageUrl) {
    console.log('[social-commerce] Using legacy productImageUrl:', step1Data.productImageUrl);
    return step1Data.productImageUrl;
  }
  
  console.warn('[social-commerce] No product image found in step1Data');
  return null;
}

/**
 * Helper: Find and delete upload by storageUrl
 */
async function cleanupUploadByUrl(
  storageUrl: string,
  videoId: string
): Promise<void> {
  try {
    console.log('[social-commerce] cleanupUploadByUrl called:', { storageUrl, videoId });
    
    // Get all uploads for the workspace (we need workspaceId from video)
    const video = await storage.getVideo(videoId);
    if (!video) {
      console.warn(`[social-commerce] Video not found: ${videoId}`);
      return;
    }

    const uploads = await storage.getUploadsByWorkspaceId(video.workspaceId);
    console.log(`[social-commerce] Found ${uploads.length} uploads in workspace`);
    
    // Find upload matching this URL
    const upload = uploads.find(u => u.storageUrl === storageUrl);
    if (!upload) {
      console.warn(`[social-commerce] Upload not found for URL: ${storageUrl}`);
      return;
    }

    console.log(`[social-commerce] Found upload record: ${upload.id}`);

    // Delete from Bunny CDN
    if (upload.storageUrl) {
      const filePath = extractFilePathFromUrl(upload.storageUrl);
      if (filePath) {
        try {
          await bunnyStorage.deleteFile(filePath);
          console.log(`[social-commerce] ✓ Deleted upload from Bunny CDN: ${filePath}`);
        } catch (bunnyError) {
          console.error('[social-commerce] Failed to delete from Bunny CDN:', bunnyError);
          // Continue with DB deletion even if Bunny fails
        }
      } else {
        console.warn(`[social-commerce] Could not extract file path from URL: ${upload.storageUrl}`);
      }
    }

    // Delete from database
    await storage.deleteUpload(upload.id);
    console.log(`[social-commerce] ✓ Cleaned up upload from database: ${upload.id}`);
  } catch (error) {
    console.error('[social-commerce] Failed to cleanup upload:', error);
    // Don't throw - we want to continue with other cleanup operations
  }
}

/**
 * Helper: Delete all assets from a step's data (Bunny CDN + Database)
 */
async function cleanupStepAssets(
  stepData: any,
  videoId: string,
  userId: string
): Promise<void> {
  if (!stepData) {
    console.log('[social-commerce] cleanupStepAssets: stepData is null/undefined, skipping');
    return;
  }

  console.log('[social-commerce] cleanupStepAssets called:', {
    videoId,
    userId,
    hasProduct: !!stepData.product,
  });

  const cleanupPromises: Promise<void>[] = [];

  // Cleanup product images
  // Check step1Data for productImageUrl (new location)
  if ((stepData as any).productImageUrl) {
    const productImageUrl = (stepData as any).productImageUrl;
    console.log('[social-commerce] Cleaning up product image from step1Data:', {
      productImageUrl: !!productImageUrl,
    });
    cleanupPromises.push(cleanupUploadByUrl(productImageUrl, videoId));
  }
  
  // Also check step2Data.product.images for backward compatibility (old location)
  if (stepData.product?.images) {
    const productImages = stepData.product.images;
    console.log('[social-commerce] Cleaning up product images from step2Data (backward compatibility):', {
      heroProfile: !!productImages.heroProfile,
      macroDetail: !!productImages.macroDetail,
      materialReference: !!productImages.materialReference,
    });
    
    if (productImages.heroProfile) {
      cleanupPromises.push(cleanupUploadByUrl(productImages.heroProfile, videoId));
    }
    if (productImages.macroDetail) {
      cleanupPromises.push(cleanupUploadByUrl(productImages.macroDetail, videoId));
    }
    if (productImages.materialReference) {
      cleanupPromises.push(cleanupUploadByUrl(productImages.materialReference, videoId));
    }
  }

  // Removed: Character, brandkit, and style cleanup - no longer used

  // Wait for all cleanup operations and log results
  const results = await Promise.allSettled(cleanupPromises);
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`[social-commerce] Cleanup completed: ${succeeded} succeeded, ${failed} failed`);
  
  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[social-commerce] Cleanup promise ${index} failed:`, result.reason);
    }
  });
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
 * Delete upload (product image) from database + Bunny CDN
 * Query params: 
 *   - videoId (optional) - if provided, cleans up the video's step2Data
 *   - imageKey (optional) - 'heroProfile' | 'macroDetail' | 'materialReference' for product images
 */
router.delete('/assets/upload/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { videoId, imageKey } = req.query as { 
      videoId?: string; 
      imageKey?: string;
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
          
          // Removed: Style reference handling - no longer used
          
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
    
    // Validate and cast duration to allowed values (beat-based: multiples of 12)
    // Duration is optional when creating video - user will select in Tab 1
    const validDurations = [12, 24, 36] as const;
    type ValidDuration = (typeof validDurations)[number];
    
    // Only validate if duration is provided (optional during creation)
    let validatedDuration: ValidDuration | undefined = undefined;
    if (duration) {
      if (!validDurations.includes(duration as any)) {
        return res.status(400).json({ 
          error: 'Invalid duration',
          details: 'Duration must be one of: 12, 24, or 36 seconds',
          validDurations: [12, 24, 36]
        });
      }
      validatedDuration = duration as ValidDuration;
    }
    
    // Initial step1Data with product title
    const step1Data: Partial<Step1Data> = {
      productTitle,
      aspectRatio: aspectRatio || SOCIAL_COMMERCE_CONFIG.defaults.aspectRatio,
      duration: validatedDuration, // Optional - user will select in Tab 1
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
    
    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
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
    
    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // ═══════════════════════════════════════════════════════════════
    // ASSET CLEANUP: Delete assets from Bunny CDN before clearing step data
    // ═══════════════════════════════════════════════════════════════
    
    // Check if step2Data is being cleared
    if (updates.step2Data === null && video.step2Data) {
      console.log('[social-commerce] Cleaning up step2Data assets before reset...');
      await cleanupStepAssets(video.step2Data, id, userId);
    }

    // Check if step3Data is being cleared
    if (updates.step3Data === null && video.step3Data) {
      console.log('[social-commerce] Cleaning up step3Data assets before reset...');
      // Step3Data might have style reference URL
      await cleanupStepAssets(video.step3Data, id, userId);
    }

    // Removed: step4Data clearing logic (Tab 4 removed, no step4Data used)
    
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
    
    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }
    
    // Clean up Bunny CDN assets
    if (bunnyStorage.isBunnyConfigured()) {
      try {
        // Build folder path using createdAt date
        const folderPath = buildVideoProjectFolderPath({
          userId,
          workspaceName: workspace.name,
          toolMode: 'commerce',
          projectName: video.title || 'untitled',
          dateLabel: video.createdAt 
            ? new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
            : undefined,
        });

        console.log('[social-commerce:routes] Deleting video folder from Bunny CDN:', folderPath);
        await bunnyStorage.deleteFolder(folderPath);
        console.log('[social-commerce:routes] ✓ Video folder deleted from Bunny CDN');
      } catch (bunnyError) {
        // Log but don't fail the delete - DB record should still be removed
        console.error('[social-commerce:routes] Failed to delete Bunny folder (continuing with DB delete):', bunnyError);
      }
    }
    
    await storage.deleteVideo(id);
    
    console.log('[social-commerce:routes] Video deleted:', { videoId: id });
    
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    console.error('[social-commerce:routes] Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: SETUP
// ═══════════════════════════════════════════════════════════════════════════════

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
 * Used to save character/material settings immediately after upload
 * 
 * This allows users to leave and return to see their settings,
 * even if they haven't clicked "Continue" yet.
 * 
 * Supports nested structure:
 * - product.material.preset (material settings only - images are in step1Data)
 * - character.name
 * - character.persona
 * etc.
 * 
 * Note: Product images are saved to step1Data via /step/1/data route
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

        // Verify workspace access (videos belong to workspaces, not directly to users)
        const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
        if (!workspace) {
          return res.status(403).json({ error: 'Access denied to this workspace' });
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
 * PATCH /api/social-commerce/videos/:id/step/1/data
 * Update step1Data incrementally (without running agents)
 * Used to save product images immediately after upload
 * 
 * This allows users to leave and return to see their uploaded images,
 * even if they haven't clicked "Continue" yet.
 * 
 * Supports nested structure:
 * - productImageUrl (for heroProfile image)
 * - Any other step1Data fields
 * 
 * Uses retry logic to handle race conditions when multiple uploads happen simultaneously.
 */
router.patch('/videos/:id/step/1/data', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body; // Partial step1Data updates

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

        // Verify workspace access (videos belong to workspaces, not directly to users)
        const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
        if (!workspace) {
          return res.status(403).json({ error: 'Access denied to this workspace' });
        }

        // Deep merge with existing step1Data (handles nested objects properly)
        const currentStep1Data = (video.step1Data as any) || {};
        const updatedStep1Data = deepMerge(currentStep1Data, updates);

        // Update video with merged step1Data
        const updatedVideo = await storage.updateVideo(id, {
          step1Data: updatedStep1Data,
          updatedAt: new Date(),
        });

        console.log(`[social-commerce:routes] ✓ Step 1 data updated incrementally (attempt ${attempt + 1}):`, Object.keys(updates));
        
        return res.json({ 
          success: true, 
          step1Data: updatedVideo.step1Data 
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
          console.log(`[social-commerce:routes] Retrying step1Data update (attempt ${attempt + 2})...`);
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('Failed to update step1Data after retries');
    
  } catch (error) {
    console.error('[social-commerce:routes] Update step1Data error:', error);
    res.status(500).json({ error: 'Failed to update step1Data' });
  }
});

/**
 * POST /api/social-commerce/videos/:id/composite/generate-prompt
 * Generate prompt only for AI composite generation (without generating image)
 */
router.post('/videos/:id/composite/generate-prompt', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const { images, context } = req.body;

    if (!videoId || videoId === 'new') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    if (images.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 images allowed' });
    }

    // Get video to access workspaceId and step1Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};

    // Generate prompt using agent
    const { generateCompositePrompt } = await import('../agents/composite-prompt-architect');
    const promptOutput = await generateCompositePrompt(
      {
        images,
        userContext: context,
        productTitle: step1Data.productTitle,
        productDescription: step1Data.productDescription,
        targetAudience: step1Data.targetAudience,
        aspectRatio: step1Data.aspectRatio || '9:16',
      },
      userId,
      video.workspaceId
    );

    console.log('[social-commerce:routes] Prompt generated:', {
      videoId,
      promptLength: promptOutput.prompt.length,
      imageCount: images.length,
      cost: promptOutput.cost,
    });

    res.json({
      prompt: promptOutput.prompt,
      layoutDescription: promptOutput.layoutDescription,
      styleGuidance: promptOutput.styleGuidance,
      sourceImages: images,
      cost: promptOutput.cost,
    });
  } catch (error) {
    console.error('[social-commerce:routes] Prompt generation error:', error);
    res.status(500).json({
      error: 'Failed to generate prompt',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/social-commerce/videos/:id/composite/generate
 * Generate composite image from uploaded product images
 * Supports both manual mode (Sharp compositing) and AI mode (Nano Banana Pro)
 * For AI mode, accepts optional prompt parameter (if provided, skips prompt generation)
 */
router.post('/videos/:id/composite/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const { mode, heroImage, productAngles, elements, images, context, prompt, layoutDescription, styleGuidance } = req.body;

    if (!videoId || videoId === 'new') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    if (mode !== 'manual' && mode !== 'ai_generated') {
      return res.status(400).json({ error: 'Mode must be "manual" or "ai_generated"' });
    }

    // Get video to access workspaceId and step1Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};

    let result;
    if (mode === 'manual') {
      // Manual mode: Use Sharp to composite images
      if (!heroImage) {
        return res.status(400).json({ error: 'Hero image is required for manual mode' });
      }

      result = await generateComposite(
        {
          mode: 'manual',
          videoId,
          heroImage,
          productAngles: productAngles || [],
          elements: elements || [],
          aspectRatio: step1Data.aspectRatio || '9:16',
        },
        userId,
        video.workspaceId
      );
    } else {
      // AI mode: Use Nano Banana Pro to generate composite
      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'At least one image is required for AI mode' });
      }

      if (images.length > 6) {
        return res.status(400).json({ error: 'Maximum 6 images allowed for AI mode' });
      }

      result = await generateComposite(
        {
          mode: 'ai_generated',
          videoId,
          images,
          context,
          productTitle: step1Data.productTitle,
          productDescription: step1Data.productDescription,
          targetAudience: step1Data.targetAudience,
          aspectRatio: step1Data.aspectRatio || '9:16',
          // If prompt is provided, use it (from preview dialog)
          ...(prompt && {
            prompt,
            layoutDescription,
            styleGuidance,
          }),
        },
        userId,
        video.workspaceId
      );
    }

    // Update step1Data with composite
    const updatedStep1Data: Step1Data = {
      ...step1Data,
      productImages: {
        ...step1Data.productImages,
        compositeImage: {
          url: result.compositeUrl,
          generatedAt: result.generatedAt,
          mode,
          sourceImages: result.sourceImages,
          ...(result.prompt && { prompt: result.prompt }),
        },
        ...(context && mode === 'ai_generated' && {
          aiContext: {
            description: context,
            generatedAt: Date.now(),
          },
        }),
      },
    };

    await storage.updateVideo(videoId, {
      step1Data: updatedStep1Data,
    });

    console.log('[social-commerce:routes] Composite generated:', {
      videoId,
      mode,
      compositeUrl: result.compositeUrl,
      layout: result.layout,
      imageCount: result.sourceImages.length,
      hasPrompt: !!result.prompt,
    });

    res.json({
      compositeUrl: result.compositeUrl,
      sourceImages: result.sourceImages,
      layout: result.layout,
      generatedAt: result.generatedAt,
      ...(result.prompt && { prompt: result.prompt }),
    });
  } catch (error) {
    console.error('[social-commerce:routes] Composite generation error:', error);
    
    // ✅ Check إذا كان response تم إرساله بالفعل
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate composite',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      console.error('[social-commerce:routes] Response already sent, cannot send error response');
    }
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/1/continue
 * Save Step 1 data and proceed to Step 2
 * 
 * Flow:
 * 1. Receive step1Data from frontend
 * 2. Save step1Data to database (no agents run - simplified flow)
 * 3. Update currentStep to 2
 * 4. Return updated video
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

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Validate required fields
    if (!step1Data.productTitle || !step1Data.targetAudience || !step1Data.duration) {
      return res.status(400).json({ 
        error: 'productTitle, targetAudience, and duration are required' 
      });
    }

    // Resolve product image URL for logging
    const resolvedImageUrl = resolveProductImageUrl(step1Data);
    
    console.log('[social-commerce:routes] Step 1 continue - saving data (no agents):', {
      videoId: id,
      product: step1Data.productTitle,
      audience: step1Data.targetAudience,
      duration: step1Data.duration,
      hasProductImage: !!resolvedImageUrl,
      imageSource: resolvedImageUrl 
        ? (step1Data.productImages?.compositeImage?.isApplied ? 'composite' : 
           step1Data.productImages?.heroProfile ? 'hero' : 'legacy')
        : 'none',
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE TO DATABASE (No agents run - simplified flow)
    // ═══════════════════════════════════════════════════════════════════════════

    // Save step1Data directly (no strategic context from Agent 1.1)
    // Product images should only be in step1Data, not step2Data
    const finalStep1Data: Step1Data = {
      ...step1Data,
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

// Removed: Product image enhancement and character image generation routes - no longer used

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: CREATIVE SPARK & BEATS
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

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step1Data = video.step1Data as Step1Data | null;

    if (!step1Data) {
      return res.status(400).json({ error: 'Tab 1 must be completed first' });
    }

    console.log('[social-commerce] Generating creative spark for video:', id);

    // Import agent dynamically
    const { generateCreativeSpark } = await import('../agents/tab-2/creative-concept-catalyst');

    // Resolve product image URL with priority (composite > hero > legacy), same as Agent 5.1
    const productImageUrl = resolveProductImageUrl(step1Data);

    // Use raw user inputs (no Agent 1.1/2.1 dependencies)
    const sparkInput = {
      // Strategic context (generated from user inputs)
      strategic_directives: `Target audience: ${step1Data.targetAudience}. Region: ${step1Data.region || 'Global'}. Production level: ${step1Data.productionLevel || 'balanced'}.`,
      targetAudience: step1Data.targetAudience || '',
      region: step1Data.region || '',
      duration: step1Data.duration, // Required - validated in Tab 1
      includeHumanElement: false, // Character planning removed
      productCategory: step1Data.productCategory || undefined,
      productTitle: step1Data.productTitle || undefined,
      productDescription: step1Data.productDescription || undefined,
      visualIntensity: step1Data.visualIntensity,
      productionLevel: step1Data.productionLevel,
      characterMode: undefined,
      character_profile: undefined,
      productImageUrl: productImageUrl || undefined,
    };

    console.log('[social-commerce] Spark input prepared:', {
      hasStrategicDirectives: !!sparkInput.strategic_directives,
      targetAudience: sparkInput.targetAudience,
      productTitle: sparkInput.productTitle,
      duration: sparkInput.duration,
      hasProductImage: !!productImageUrl,
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

    // Save the creative spark to step2Data (migrated from step3Data)
    const existingStep2Data = video.step2Data as any || {};
    const updatedStep2Data: Step2Data = {
      ...existingStep2Data,
      creativeSpark: {
        creative_spark: sparkOutput.creative_spark,
        cost: sparkOutput.cost || 0,
      },
      // Preserve existing narrative and uiInputs if they exist
      narrative: existingStep2Data.narrative,
      uiInputs: existingStep2Data.uiInputs,
    };

    await storage.updateVideo(id, {
      step2Data: updatedStep2Data,
    });

    console.log('[social-commerce] Saved creative spark to step2Data');

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
 * POST /api/social-commerce/step/2/generate-beats
 * Generate visual beats using Agent 3.2 (Narrative Architect)
 * This is called when user clicks "Generate Visual Beats" button
 * Saves to step2Data (migrated from step3Data)
 */
router.post('/step/2/generate-beats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get videoId from params or body (support both route formats)
    const { id } = req.params;
    const videoId = id || req.body.id;
    const { campaignSpark, campaignObjective } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Get video and previous step data
    const video = await storage.getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step1Data = video.step1Data as Step1Data | null;
    const step2Data = video.step2Data as any;
    const step3Data = video.step3Data as any; // Check for backward compatibility

    if (!step1Data) {
      return res.status(400).json({ error: 'Tab 1 must be completed first.' });
    }

    // Prefer user's current input (req.body) when valid; otherwise fall back to stored value
    let creativeSpark: string;
    if (campaignSpark && typeof campaignSpark === 'string' && campaignSpark.trim().length >= 10) {
      creativeSpark = campaignSpark.trim();
      console.log('[social-commerce] Using campaignSpark from request (user edits)');
    } else if (step2Data?.creativeSpark?.creative_spark) {
      creativeSpark = step2Data.creativeSpark.creative_spark;
      console.log('[social-commerce] Using creative spark from step2Data');
    } else if (step3Data?.creativeSpark?.creative_spark) {
      creativeSpark = step3Data.creativeSpark.creative_spark;
      console.log('[social-commerce] Using creative spark from step3Data (backward compatibility)');
    } else {
      return res.status(400).json({ error: 'Creative spark is required. Please fill in the Creative Spark field or use AI Recommend first.' });
    }

    console.log('[social-commerce] Generating visual beats for video:', videoId);

    // Import agent dynamically
    const { createNarrative } = await import('../agents/tab-2/narrative-architect');

    // Extract image mode and composite elements info
    let imageMode: 'hero' | 'composite' | undefined;
    let compositeElements: {
      hasHeroProduct: boolean;
      hasProductAngles: boolean;
      hasDecorativeElements: boolean;
      elementDescriptions?: string[];
    } | undefined;

    if (step1Data.productImages) {
      // Check if composite image is applied
      if (step1Data.productImages.compositeImage?.isApplied) {
        imageMode = 'composite';
        
        // Extract composite elements info
        const sourceImages = step1Data.productImages.compositeImage.sourceImages || [];
        const hasHeroProduct = !!step1Data.productImages.heroProfile && 
                               sourceImages.includes(step1Data.productImages.heroProfile);
        const hasProductAngles = !!(step1Data.productImages.productAngles && 
                                    step1Data.productImages.productAngles.length > 0);
        const hasDecorativeElements = !!(step1Data.productImages.elements && 
                                         step1Data.productImages.elements.length > 0);
        
        // Extract element descriptions if available
        const elementDescriptions = step1Data.productImages.elements
          ?.filter(el => el.description)
          .map(el => el.description!)
          .filter(Boolean);

        compositeElements = {
          hasHeroProduct: hasHeroProduct || !!step1Data.productImages.heroProfile,
          hasProductAngles,
          hasDecorativeElements,
          ...(elementDescriptions && elementDescriptions.length > 0 ? { elementDescriptions } : {}),
        };
      } else if (step1Data.productImages.heroProfile) {
        imageMode = 'hero';
      }
    } else if (step1Data.productImageUrl) {
      // Legacy: fallback to hero mode if only productImageUrl exists
      imageMode = 'hero';
    }

    // Resolve product image URL with priority (composite > hero > legacy), same as Agent 5.1
    const productImageUrl = resolveProductImageUrl(step1Data);

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
      // Removed: pacing_profile (no longer from Agent 1.1)
      duration: step1Data.duration, // Required - validated in Tab 1
      productTitle: step1Data.productTitle || undefined,
      productDescription: step1Data.productDescription || undefined,
      visualIntensity: step1Data.visualIntensity,
      productionLevel: step1Data.productionLevel,
      // NEW: Image context
      imageMode,
      compositeElements,
      // NEW: Pacing
      pacingOverride: step1Data.pacingOverride,
      productImageUrl: productImageUrl || undefined,
    };

    console.log('[social-commerce] Calling Agent 3.2 with:', {
      hasCreativeSpark: !!narrativeInput.creative_spark,
      objective: narrativeInput.campaignObjective,
      duration: narrativeInput.duration,
      imageMode: narrativeInput.imageMode,
      hasCompositeElements: !!narrativeInput.compositeElements,
      pacingOverride: narrativeInput.pacingOverride,
      hasProductImage: !!productImageUrl,
    });

    const narrativeOutput = await createNarrative(narrativeInput, userId, video.workspaceId);

    // Validate beat count matches duration (additional validation at route level)
    const expectedBeatCount = step1Data.duration / 12;
    if (narrativeOutput.visual_beats.length !== expectedBeatCount) {
      console.error('[social-commerce] Beat count validation failed:', {
        expected: expectedBeatCount,
        actual: narrativeOutput.visual_beats.length,
        duration: step1Data.duration,
      });
      return res.status(500).json({
        error: 'Beat count mismatch',
        details: `Expected ${expectedBeatCount} beat(s) for ${step1Data.duration}s duration, but got ${narrativeOutput.visual_beats.length} beat(s)`,
      });
    }

    console.log('[social-commerce] Visual beats generated:', {
      beatCount: narrativeOutput.visual_beats.length,
      expectedBeatCount,
      beats: narrativeOutput.visual_beats.map(b => ({ id: b.beatId, name: b.beatName })),
      cost: narrativeOutput.cost,
    });

    // Save the narrative output to step2Data (migrated from step3Data)
    const existingStep2Data = video.step2Data as any || {};
    const updatedStep2Data: Step2Data = {
      ...existingStep2Data,
      narrative: narrativeOutput, // Save visual_beats
    };

    // Also save creative spark if provided (from campaignSpark parameter)
    // This ensures creative spark is saved even if user didn't click "AI Recommend"
    if (campaignSpark && campaignSpark.trim().length >= 10) {
      updatedStep2Data.creativeSpark = {
        creative_spark: campaignSpark,
        cost: 0, // No cost since it was manually entered or already generated
      };
      console.log('[social-commerce] Also saving creative spark from request');
    }

    await storage.updateVideo(videoId, {
      step2Data: updatedStep2Data,
    });

    console.log('[social-commerce] Saved narrative output to step2Data for reuse on Continue');

    res.json({
      success: true,
      visual_beats: narrativeOutput.visual_beats,
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
 * PATCH /api/social-commerce/videos/:id/step/2/continue
 * Process Tab 2 (Creative Spark + Beats):
 * 1. Validate creative spark is provided (required - user must fill or use AI Recommend)
 * 2. Validate visual beats are generated (required - user must click "Generate Visual Beats")
 * 3. Save creativeSpark, narrative, and uiInputs to step2Data
 * 4. Update currentStep to 3
 * 
 * Note: 
 * - Agent 3.0 only runs when user clicks "AI Recommend" button
 * - Agent 3.2 only runs when user clicks "Generate Visual Beats" button (REQUIRED before Continue)
 * - No agents run on Continue - just save data
 */
router.patch('/videos/:id/step/2/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const requestData = req.body;

    // Get video and previous step data
    const video = await storage.getVideo(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step1Data = video.step1Data as Step1Data | null;

    if (!step1Data) {
      return res.status(400).json({ error: 'Tab 1 must be completed first' });
    }

    console.log('[social-commerce] Starting Tab 2 continue (saving data, no agents)...', {
      videoId: id,
      videoTitle: video.title,
      workspaceId: video.workspaceId,
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: VALIDATE CREATIVE SPARK (Required - user must fill or use AI Recommend)
    // ═══════════════════════════════════════════════════════════════
    
    // Creative Spark is REQUIRED - user must fill it manually or use "AI Recommend" button
    // Agent 3.0 does NOT run on Continue - it only runs when user clicks "AI Recommend"
    const campaignSpark = requestData.campaignSpark || '';
    if (!campaignSpark || campaignSpark.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Creative Spark is required. Please fill in the Creative Spark field or use "AI Recommend" first.' 
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // Validate Visual Beats (REQUIRED - must be generated before Continue)
    // ═══════════════════════════════════════════════════════════════
    
    // Check if narrative was already generated via "Generate Visual Beats" button
    // Check both step2Data and step3Data for backward compatibility
    const existingStep2Data = video.step2Data as any;
    const existingStep3Data = video.step3Data as any;
    
    const narrativeOutput = existingStep2Data?.narrative || existingStep3Data?.narrative;
    if (!narrativeOutput?.visual_beats) {
      return res.status(400).json({ 
        error: 'Visual beats are required. Please click "Generate Visual Beats" before continuing.' 
      });
    }

    // Get creative spark from step2Data or step3Data (backward compatibility)
    const creativeSparkOutput = existingStep2Data?.creativeSpark || existingStep3Data?.creativeSpark;
    const creativeSpark = creativeSparkOutput?.creative_spark || campaignSpark;

    // ═══════════════════════════════════════════════════════════════
    // Handle edited visual beats (if provided in request)
    // ═══════════════════════════════════════════════════════════════
    
    let narrativeToSave = narrativeOutput;
    
    // If edited beats are provided, validate and use them to overwrite stored beats
    if (requestData.visualBeats && Array.isArray(requestData.visualBeats) && requestData.visualBeats.length > 0) {
      // Validate beat count matches expected (duration / 12)
      const expectedBeatCount = Math.ceil(step1Data.duration / 12);
      if (requestData.visualBeats.length === expectedBeatCount) {
        // Validate beat structure
        const isValid = requestData.visualBeats.every((beat: any) => 
          beat.beatId && 
          (beat.beatId === 'beat1' || beat.beatId === 'beat2' || beat.beatId === 'beat3') &&
          typeof beat.beatName === 'string' &&
          typeof beat.beatDescription === 'string' &&
          beat.duration === 12
        );
        
        if (isValid) {
          // Overwrite narrative.visual_beats with edited beats
          narrativeToSave = {
            ...narrativeOutput,
            visual_beats: requestData.visualBeats,
          };
          console.log('[social-commerce] Using edited visual beats from request:', {
            beatCount: requestData.visualBeats.length,
            beatIds: requestData.visualBeats.map((b: any) => b.beatId),
          });
        } else {
          console.warn('[social-commerce] Invalid visual beats structure, using stored beats');
        }
      } else {
        console.warn('[social-commerce] Visual beats count mismatch, using stored beats:', {
          expected: expectedBeatCount,
          received: requestData.visualBeats.length,
        });
      }
    }

    console.log('[social-commerce] Saving Tab 2 data:', {
      hasCreativeSpark: !!creativeSpark,
      hasNarrative: !!narrativeToSave,
      beatCount: narrativeToSave.visual_beats.length,
      usingEditedBeats: !!(requestData.visualBeats && Array.isArray(requestData.visualBeats) && requestData.visualBeats.length > 0),
    });

    // ═══════════════════════════════════════════════════════════════
    // Save to Database (No agents run - simplified flow)
    // ═══════════════════════════════════════════════════════════════
    
    const step2DataToSave: Step2Data = {
      creativeSpark: creativeSparkOutput || {
        creative_spark: creativeSpark,
        cost: 0, // No cost if manually entered
      },
      narrative: narrativeToSave,
      uiInputs: {
        visualPreset: requestData.visualPreset || '',
        campaignSpark: creativeSpark,
        campaignObjective: requestData.campaignObjective || 'brand-awareness',
      },
    };

    // Update completed steps
    const completedSteps = Array.isArray(video.completedSteps) ? [...video.completedSteps] : [];
    if (!completedSteps.includes(2)) {
      completedSteps.push(2);
    }

    const updated = await storage.updateVideo(id, {
      step2Data: step2DataToSave,
      currentStep: 3,
      completedSteps,
    });

    console.log('[social-commerce] Tab 2 completed successfully:', {
      videoId: id,
      currentStep: 3,
    });

    res.json({
      success: true,
      step2Data: step2DataToSave,
      currentStep: 3,
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
// TAB 3: PROMPT GENERATION & STORYBOARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assemble BatchBeatPromptInput from all context sources (Simplified)
 * No Agent 1.1, 2.1, 3.1, 4.1 dependencies - uses raw user inputs and vision analysis
 */
function assembleBatchBeatPromptInput(
  visualBeats: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3';
    beatName: string;
    beatDescription: string;
    duration: 12;
  }>,
  step1Data: Step1DataType,
  step2Data: Step2Data
): BatchBeatPromptInput {
  // Note: Max duration is 36s = 3 beats × 12s each
  // Get creative spark from step2Data
  const creativeSpark = step2Data.creativeSpark?.creative_spark || step2Data.uiInputs?.campaignSpark || '';

  // Audio Settings (from Tab 1) - Note: voiceover handled by Agent 5.2
  const audioSettings = {
    soundEffects: step1Data.soundEffectsEnabled ? {
      enabled: true,
      preset: step1Data.soundEffectsPreset || '',
      customInstructions: step1Data.soundEffectsCustomInstructions,
    } : undefined,
    music: step1Data.musicEnabled ? {
      enabled: true,
      preset: step1Data.musicPreset || '',
      mood: step1Data.musicMood,
      customInstructions: step1Data.musicCustomInstructions,
    } : undefined,
  };

  // Resolve product image URL with priority (composite > hero > legacy)
  const productImageUrl = resolveProductImageUrl(step1Data);

  // Extract image mode and composite elements info (same logic as narrative route)
  let imageMode: 'hero' | 'composite' | undefined;
  let compositeElements: {
    hasHeroProduct: boolean;
    hasProductAngles: boolean;
    hasDecorativeElements: boolean;
    elementDescriptions?: string[];
  } | undefined;

  if (step1Data.productImages) {
    // Check if composite image is applied
    if (step1Data.productImages.compositeImage?.isApplied) {
      imageMode = 'composite';
      
      // Extract composite elements info
      const sourceImages = step1Data.productImages.compositeImage.sourceImages || [];
      const hasHeroProduct = !!step1Data.productImages.heroProfile && 
                             sourceImages.includes(step1Data.productImages.heroProfile);
      const hasProductAngles = !!(step1Data.productImages.productAngles && 
                                  step1Data.productImages.productAngles.length > 0);
      const hasDecorativeElements = !!(step1Data.productImages.elements && 
                                       step1Data.productImages.elements.length > 0);
      
      // Extract element descriptions if available
      const elementDescriptions = step1Data.productImages.elements
        ?.filter(el => el.description)
        .map(el => el.description!)
        .filter(Boolean);
      
      compositeElements = {
        hasHeroProduct: hasHeroProduct || !!step1Data.productImages.heroProfile,
        hasProductAngles,
        hasDecorativeElements,
        ...(elementDescriptions && elementDescriptions.length > 0 ? { elementDescriptions } : {}),
      };
    } else if (step1Data.productImages.heroProfile) {
      imageMode = 'hero';
    }
  } else if (step1Data.productImageUrl) {
    // Legacy: fallback to hero mode if only productImageUrl exists
    imageMode = 'hero';
  }

  return {
    // Product Image (single hero image for vision analysis)
    productImageUrl: productImageUrl || '',
    
    // Visual Beats (from Agent 3.2)
    beats: visualBeats,
    
    // Raw User Inputs (from step1Data - replaces Agent 1.1 outputs)
    productTitle: step1Data.productTitle,
    productDescription: step1Data.productDescription,
    targetAudience: step1Data.targetAudience,
    region: step1Data.region,
    aspectRatio: step1Data.aspectRatio || '9:16',
    productionLevel: step1Data.productionLevel,
    visualIntensity: step1Data.visualIntensity,
    pacingOverride: step1Data.pacingOverride,
    customMotionInstructions: step1Data.customMotionInstructions,
    
    // Visual Style (from step2Data - replaces Agent 3.1 outputs)
    visualPreset: step2Data.uiInputs?.visualPreset || '',
    
    // Creative Spark (from step2Data - Agent 3.0 output)
    creativeSpark,
    
    // Campaign Objective (from step2Data.uiInputs)
    campaign_objective: (step2Data.uiInputs?.campaignObjective || 'brand-awareness') as 'brand-awareness' | 'feature-showcase' | 'sales-cta',
    
    // Audio Settings
    audioSettings,
    
    // Image Mode Context
    imageMode,
    compositeElements,
  };
}

/**
 * Assemble VoiceoverScriptInput from all context sources
 */
function assembleVoiceoverScriptInput(
  visualBeats: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3';
    beatName: string;
    beatDescription: string;
    duration: 12;
  }>,
  step1Data: Step1DataType,
  step2Data: Step2Data,
  step3Data?: Step3Data // Optional for backward compatibility
): VoiceoverScriptInput {
  // Determine narrative roles for beats
  const getNarrativeRole = (beatId: string, index: number, total: number): 'hook' | 'transformation' | 'payoff' => {
    if (index === 0) return 'hook';
    if (index === total - 1) return 'payoff';
    return 'transformation';
  };

  // Build beats array with narrative roles and emotional tones
  const beats = visualBeats.map((beat, index) => ({
    beatId: beat.beatId,
    beatName: beat.beatName,
    beatDescription: beat.beatDescription,
    narrativeRole: getNarrativeRole(beat.beatId, index, visualBeats.length),
    emotionalTone: beat.beatName.toLowerCase().includes('ignition') || beat.beatName.toLowerCase().includes('hook')
      ? 'confident'
      : beat.beatName.toLowerCase().includes('transformation') || beat.beatName.toLowerCase().includes('build')
      ? 'energetic'
      : 'satisfying',
    duration: 12 as const,
  }));

  // Voiceover Settings (from Tab 1)
  // Convert userScript to existingDialogue format if provided
  const existingDialogue = step1Data.voiceoverScript && step1Data.voiceoverScript.trim().length > 0
    ? [{
        id: 'user-script-1',
        line: step1Data.voiceoverScript.trim(),
        timestamp: undefined, // User hasn't timed it
        beatId: undefined, // Not assigned to specific beat yet
      }]
    : undefined;

  const voiceoverSettings = {
    enabled: step1Data.voiceOverEnabled || false,
    language: (step1Data.language || 'en') as 'ar' | 'en',
    tempo: (step1Data.speechTempo || 'auto') as 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast',
    volume: (step1Data.audioVolume || 'medium') as 'low' | 'medium' | 'high',
    customInstructions: step1Data.customVoiceoverInstructions,
    existingDialogue: existingDialogue,
  };

  // Strategic Context (from user inputs - replaces Agent 1.1)
  const strategicContextData = {
    targetAudience: step1Data.targetAudience || '',
    campaignObjective: (step2Data.uiInputs?.campaignObjective || 'brand-awareness') as 'brand-awareness' | 'feature-showcase' | 'sales-cta',
    region: step1Data.region,
  };

  // Product Info (from user inputs - replaces Agent 2.1)
  const productInfo = {
    productName: step1Data.productTitle,
    productDescription: step1Data.productDescription,
  };

  // Narrative Context (from step2Data)
  const narrativeContext = {
    creativeSpark: step2Data.creativeSpark?.creative_spark || step2Data.uiInputs?.campaignSpark || '',
    visualBeats: {
      beat1: visualBeats.find(b => b.beatId === 'beat1')?.beatDescription || '',
      beat2: visualBeats.find(b => b.beatId === 'beat2')?.beatDescription || '',
      beat3: visualBeats.find(b => b.beatId === 'beat3')?.beatDescription || '',
    },
  };

  // Character Info (if applicable - character planning removed but keep for backward compatibility)
  const character = step2Data.character?.persona ? {
    persona: step2Data.character.persona.detailed_persona,
    culturalFit: step2Data.character.persona.cultural_fit,
  } : undefined;

  return {
    beats,
    voiceoverSettings,
    strategicContext: strategicContextData,
    productInfo,
    narrativeContext,
    character,
  };
}

/**
 * POST /api/social-commerce/videos/:id/step/3/generate-prompts
 * Generate prompts for ALL beats using Agent 5.1 ONLY
 * NOTE: Agent 5.2 (voiceover) will be implemented in Tab 4 later
 * Simplified: No Agent 4.1 (shots) - generates prompts directly from beats
 */
router.post('/videos/:id/step/3/generate-prompts', isAuthenticated, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req);

    console.log('[social-commerce:agent-5.1] Starting batch beat prompt generation:', {
      videoId: id,
      userId,
      timestamp: new Date().toISOString(),
    });

    if (!userId) {
      console.error('[social-commerce:agent-5.1] Unauthorized request - no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const video = await storage.getVideo(id);
    if (!video) {
      console.error('[social-commerce:agent-5.1] Video not found:', id);
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const workspaceId = video.workspaceId;
    console.log('[social-commerce:agent-5.1] Video loaded:', {
      videoId: id,
      workspaceId,
      hasStep1Data: !!video.step1Data,
      hasStep2Data: !!video.step2Data,
      hasStep3Data: !!video.step3Data,
      // Removed: hasStep4Data (Tab 4 removed)
    });

    // Validate prerequisites (simplified - no step4Data needed)
    if (!video.step1Data || !video.step2Data) {
      const missing = [
        !video.step1Data && 'step1Data',
        !video.step2Data && 'step2Data',
      ].filter(Boolean);
      
      console.error('[social-commerce:agent-5.1] Missing prerequisite data:', { missing });
      return res.status(400).json({
        error: 'Missing prerequisite data',
        missing,
        details: 'Please complete Tab 1 and Tab 2 before generating prompts',
      });
    }

    const step1Data = video.step1Data as Step1DataType;
    const step2Data = video.step2Data as Step2Data;

    // Get visual_beats from step2Data (migrated from step3Data)
    // Check both step2Data and step3Data for backward compatibility
    const narrative = step2Data.narrative || (video.step3Data as any)?.narrative;
    if (!narrative?.visual_beats || !Array.isArray(narrative.visual_beats) || narrative.visual_beats.length === 0) {
      console.error('[social-commerce:agent-5.1] Missing visual_beats');
      return res.status(400).json({
        error: 'Missing visual_beats',
        details: 'Tab 2 must contain visual_beats from Agent 3.2. Please click "Generate Visual Beats" first.',
      });
    }

    const visualBeats = narrative.visual_beats;

    // Resolve product image URL with priority (composite > hero > legacy)
    const productImageUrl = resolveProductImageUrl(step1Data);
    
    if (!productImageUrl) {
      return res.status(400).json({
        error: 'Product image is required',
        details: 'Please upload a product image in Tab 1 before generating prompts.',
      });
    }

    console.log('[social-commerce:agent-5.1] Data validated:', {
      beatCount: visualBeats.length,
      beatIds: visualBeats.map((b: any) => b.beatId),
      hasProductImage: !!productImageUrl,
      imageSource: step1Data.productImages?.compositeImage?.isApplied ? 'composite' : 
                   step1Data.productImages?.heroProfile ? 'hero' : 'legacy',
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BUILD BATCH BEAT PROMPT INPUT (Simplified - no shots needed)
    // ═══════════════════════════════════════════════════════════════════════════
    // Pass step1Data with resolved productImageUrl
    const step1DataWithImage = {
      ...step1Data,
      productImageUrl: productImageUrl, // Resolved URL (composite > hero > legacy)
    };

    const batchInput = assembleBatchBeatPromptInput(
      visualBeats,
      step1DataWithImage,
      step2Data
    );

    console.log('[social-commerce:agent-5.1] Batch input assembled:', {
      beatCount: batchInput.beats.length,
      beatIds: batchInput.beats.map(b => b.beatId),
      hasProductImage: !!batchInput.productImageUrl,
      imageMode: batchInput.imageMode,
      hasCompositeElements: !!batchInput.compositeElements,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // GENERATE PROMPTS FOR ALL BEATS (BATCH) - AGENT 5.1 ONLY
    // ═══════════════════════════════════════════════════════════════════════════
    // NOTE: Agent 5.2 (voiceover) will be implemented in Tab 4 later
    // Only Agent 5.1 runs in Tab 3

    console.log('[social-commerce:agent-5.1] Starting prompt generation (Agent 5.1 only):', {
      agent51: true,
      agent52: false, // Agent 5.2 will be in Tab 4
    });

    // Run only Agent 5.1 (no parallel execution with Agent 5.2)
    const beatPromptOutput = await generateBeatPrompts(batchInput, userId, workspaceId);

    console.log('[social-commerce:agent-5.1] Successfully generated prompts for all beats:', {
      beatCount: beatPromptOutput.beat_prompts.length,
      beatIds: beatPromptOutput.beat_prompts.map(bp => bp.beatId),
      cost: beatPromptOutput.cost,
    });

    // Overwrite beatName with input — Agent 5.1 often puts "name — description" into beatName;
    // cards must show only the short beat name from Tab 2.
    const correctedBeatPrompts = beatPromptOutput.beat_prompts.map((bp: any) => {
      const inputBeat = visualBeats.find((b: any) => b.beatId === bp.beatId);
      return {
        ...bp,
        beatName: (inputBeat?.beatName != null && typeof inputBeat.beatName === 'string')
          ? inputBeat.beatName
          : bp.beatName,
      };
    });
    const beatPromptsToSave = { ...beatPromptOutput, beat_prompts: correctedBeatPrompts };

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE TO DATABASE (step3Data - migrated from step5Data)
    // ═══════════════════════════════════════════════════════════════════════════
    // NOTE: voiceoverScripts will be saved in Tab 4 when Agent 5.2 is implemented

    const step3DataToSave: Step3Data = {
      ...(video.step3Data || {}),
      beatPrompts: beatPromptsToSave,
      // voiceoverScripts will be saved in Tab 4 (Agent 5.2)
    };

    // Update completed steps
    const completedSteps = Array.isArray(video.completedSteps) ? [...video.completedSteps] : [];
    if (!completedSteps.includes(3)) {
      completedSteps.push(3);
    }

    const updated = await storage.updateVideo(id, {
      step3Data: step3DataToSave,
      currentStep: 3,
      completedSteps,
    });

    const duration = Date.now() - startTime;
    console.log('[social-commerce:agent-5.1] Batch prompt generation completed:', {
      videoId: id,
      beatCount: beatPromptOutput.beat_prompts.length,
      durationMs: duration,
      durationSeconds: (duration / 1000).toFixed(2),
      cost: beatPromptOutput.cost,
    });

    res.json({
      success: true,
      step3Data: step3DataToSave,
      currentStep: 3,
      beatCount: beatPromptOutput.beat_prompts.length,
      cost: beatPromptOutput.cost,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[social-commerce:agent-5.1] Error generating beat prompts:', {
      error: errorMessage,
      stack: errorStack,
      videoId: req.params.id,
      timestamp: new Date().toISOString(),
    });
    
    res.status(500).json({
      error: 'Failed to generate beat prompts',
      details: errorMessage,
      step: 'generation',
    });
  }
});

/**
 * POST /api/social-commerce/videos/:id/step/3/generate-voiceover-scripts
 * 
 * Generate voiceover scripts using Agent 5.2
 * Called when transitioning from Step 3 to Step 4 (if voiceover enabled)
 */
router.post('/videos/:id/step/3/generate-voiceover-scripts', isAuthenticated, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
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

    // Verify workspace access
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const workspaceId = video.workspaceId;
    const step1Data = video.step1Data as Step1DataType;
    const step2Data = video.step2Data as Step2Data;
    const step3Data = video.step3Data as Step3Data;

    // Validate prerequisites
    if (!step1Data || !step2Data) {
      return res.status(400).json({
        error: 'Missing prerequisite data',
        details: 'Please complete Tab 1 and Tab 2 before generating voiceover scripts',
      });
    }

    // Check if voiceover is enabled
    if (!step1Data.voiceOverEnabled) {
      return res.status(400).json({
        error: 'Voiceover is disabled',
        details: 'Voiceover must be enabled in Tab 1 to generate scripts',
      });
    }

    // Get visual_beats from step2Data
    const narrative = step2Data.narrative || (step3Data as any)?.narrative;
    if (!narrative?.visual_beats || !Array.isArray(narrative.visual_beats) || narrative.visual_beats.length === 0) {
      return res.status(400).json({
        error: 'Missing visual_beats',
        details: 'Tab 2 must contain visual_beats from Agent 3.2. Please generate visual beats first.',
      });
    }

    const visualBeats = narrative.visual_beats;

    // Assemble VoiceoverScriptInput
    const voiceoverInput = assembleVoiceoverScriptInput(
      visualBeats,
      step1Data,
      step2Data,
      step3Data
    );

    console.log('[social-commerce:agent-5.2] Starting voiceover script generation:', {
      videoId: id,
      workspaceId,
      beatCount: voiceoverInput.beats.length,
      language: voiceoverInput.voiceoverSettings.language,
      tempo: voiceoverInput.voiceoverSettings.tempo,
    });

    // Run Agent 5.2
    const voiceoverOutput = await generateVoiceoverScripts(
      voiceoverInput,
      userId,
      workspaceId
    );

    // Save to step3Data
    const updatedStep3Data: Step3Data = {
      ...(step3Data || {}),
      voiceoverScripts: voiceoverOutput,
    };

    // Update video
    const updated = await storage.updateVideo(id, {
      step3Data: updatedStep3Data,
      updatedAt: new Date(),
    });

    const duration = Date.now() - startTime;
    console.log('[social-commerce:agent-5.2] Voiceover script generation completed:', {
      videoId: id,
      beatCount: voiceoverOutput.beat_scripts.length,
      durationMs: duration,
      durationSeconds: (duration / 1000).toFixed(2),
    });

    res.json({
      success: true,
      step3Data: updatedStep3Data,
      beatCount: voiceoverOutput.beat_scripts.length,
    });
  } catch (error) {
    console.error('[social-commerce:agent-5.2] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: 'Failed to generate voiceover scripts',
      details: errorMessage,
    });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/voiceover-script/:beatId
 * Update a single beat's voiceover script
 * 
 * Used when user edits the script in Tab 4 and clicks Regenerate
 */
router.patch('/videos/:id/voiceover-script/:beatId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, beatId } = req.params;
    const { script } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script is required' });
    }

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step3Data = video.step3Data as Step3Data | null;
    if (!step3Data?.voiceoverScripts?.beat_scripts) {
      return res.status(400).json({ error: 'No voiceover scripts found' });
    }

    // Find and update the specific beat script
    const beatScriptIndex = step3Data.voiceoverScripts.beat_scripts.findIndex(
      (bs: any) => bs.beatId === beatId
    );

    if (beatScriptIndex === -1) {
      return res.status(404).json({ error: `Beat script not found for beatId: ${beatId}` });
    }

    // Update the script
    step3Data.voiceoverScripts.beat_scripts[beatScriptIndex].voiceoverScript.script = script;

    // Save to database
    await storage.updateVideo(id, {
      step3Data,
      updatedAt: new Date(),
    });

    console.log('[social-commerce:routes] Voiceover script updated:', {
      videoId: id,
      beatId,
      scriptLength: script.length,
    });

    res.json({
      success: true,
      beatId,
      script,
    });
  } catch (error) {
    console.error('[social-commerce:routes] Error updating voiceover script:', error);
    res.status(500).json({ error: 'Failed to update voiceover script' });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/4/continue
 * Save Step 4 (Voiceover) data and proceed to Step 5
 * 
 * Flow:
 * 1. Verify voiceover scripts exist in step3Data (from Agent 5.2)
 * 2. Mark step 4 as completed
 * 3. Update currentStep to 5
 * 4. Return updated video
 */
router.patch('/videos/:id/step/4/continue', isAuthenticated, async (req: Request, res: Response) => {
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

    // Verify workspace access
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const step3Data = video.step3Data as Step3Data | null;

    // Validate that voiceover scripts exist (should be generated by Agent 5.2)
    if (!step3Data?.voiceoverScripts) {
      return res.status(400).json({ 
        error: 'Voiceover scripts are required. Please generate voiceover scripts first.' 
      });
    }

    // Get existing step4Data to preserve voiceoverAudios
    const existingStep4Data = video.step4Data as Step4Data | null;

    console.log('[social-commerce:routes] Step 4 continue - saving data:', {
      videoId: id,
      hasVoiceoverScripts: !!step3Data.voiceoverScripts,
      beatCount: step3Data.voiceoverScripts.beat_scripts?.length || 0,
      hasExistingVoiceoverAudios: !!existingStep4Data?.voiceoverAudios,
      existingVoiceoverAudioBeatIds: existingStep4Data?.voiceoverAudios 
        ? Object.keys(existingStep4Data.voiceoverAudios) 
        : [],
    });

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    if (!completedSteps.includes(4)) {
      completedSteps.push(4);
    }

    // Save step4Data with voiceover scripts reference
    // IMPORTANT: Preserve existing voiceoverAudios that were generated during this step!
    const step4Data: Step4Data = {
      // Preserve existing voiceover audios (generated when user clicked "Generate Audio")
      ...existingStep4Data,
      // Save reference to voiceover scripts (they're in step3Data but we keep a copy here for step 4)
      voiceoverScripts: step3Data.voiceoverScripts,
    };

    // Update video
    const updated = await storage.updateVideo(id, {
      step4Data,
      currentStep: 5,
      completedSteps,
      updatedAt: new Date(),
    });

    console.log('[social-commerce:routes] Step 4 completed:', {
      videoId: id,
      currentStep: 5,
    });

    res.json(updated);
  } catch (error) {
    console.error('[social-commerce:routes] Step 4 continue error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to complete step 4',
      details: errorMessage,
    });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/5/continue
 * Mark Step 5 (Animatic) as completed and proceed to Step 6 (Export)
 */
router.patch('/videos/:id/step/5/continue', isAuthenticated, async (req: Request, res: Response) => {
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

    // Verify workspace access
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    if (!completedSteps.includes(5)) {
      completedSteps.push(5);
    }

    // Update video
    const updated = await storage.updateVideo(id, {
      currentStep: 6,
      completedSteps,
      updatedAt: new Date(),
    });

    console.log('[social-commerce:routes] Step 5 completed:', {
      videoId: id,
      currentStep: 6,
      completedSteps,
    });

    res.json(updated);
  } catch (error) {
    console.error('[social-commerce:routes] Step 5 continue error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to complete step 5',
      details: errorMessage,
    });
  }
});

/**
 * PATCH /api/social-commerce/videos/:id/step/6/complete
 * Mark Step 6 (Export) as completed - final step
 */
router.patch('/videos/:id/step/6/complete', isAuthenticated, async (req: Request, res: Response) => {
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

    // Verify workspace access
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    if (!completedSteps.includes(6)) {
      completedSteps.push(6);
    }

    // Update video - mark as completed
    const updated = await storage.updateVideo(id, {
      currentStep: 6,
      completedSteps,
      status: 'completed',
      updatedAt: new Date(),
    });

    console.log('[social-commerce:routes] Step 6 completed - Video finished:', {
      videoId: id,
      currentStep: 6,
      completedSteps,
      status: 'completed',
    });

    res.json(updated);
  } catch (error) {
    console.error('[social-commerce:routes] Step 6 complete error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to complete step 6',
      details: errorMessage,
    });
  }
});

// Removed: assemblePromptArchitectInput function and old Step 5 route - replaced by simplified 3-tab structure

// ═══════════════════════════════════════════════════════════════════════════════
// BEAT GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social-commerce/videos/:id/beats/:beatId/generate
 * Generate video for a single beat using Sora
 */
router.post('/videos/:id/beats/:beatId/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id, beatId } = req.params;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Get beat prompts from step3Data (migrated from step5Data)
    // Check both step3Data and step5Data for backward compatibility
    const step3Data = video.step3Data as any;
    const step5Data = video.step5Data as any; // For backward compatibility
    const beatPrompts = step3Data?.beatPrompts || step5Data?.beatPrompts;
    
    if (!beatPrompts?.beat_prompts) {
      return res.status(400).json({
        error: 'Beat prompts not found',
        details: 'Please generate prompts first',
      });
    }

    const beat = beatPrompts.beat_prompts.find((b: any) => b.beatId === beatId);
    if (!beat) {
      return res.status(404).json({ error: 'Beat not found' });
    }

    // Get input image
    // All beats now use the same reference image (hero or composite)
    const step1Data = video.step1Data as any;
    const inputImageUrl = resolveProductImageUrl(step1Data) || undefined;

    if (!inputImageUrl) {
      return res.status(400).json({
        error: 'Input image not found',
        details: 'Product image (hero or composite) is required. Please upload a product image in Tab 1.',
      });
    }

    // Get video model and resolution from step1Data
    const videoModel = step1Data.videoModel || 'sora-2-pro';
    const videoResolution = step1Data.videoResolution || '720p';
    const aspectRatio = step1Data.aspectRatio || '9:16';

    // Get dimensions for the selected model, aspect ratio, and resolution
    const dimensions = getVideoDimensionsForImageGeneration(
      videoModel,
      aspectRatio,
      videoResolution
    );

    if (!dimensions) {
      return res.status(400).json({
        error: 'Invalid video configuration',
        details: `Unsupported combination: ${videoModel}, ${aspectRatio}, ${videoResolution}`,
      });
    }

    // Format resolution as "WIDTHxHEIGHT" for Sora API
    const resolution = `${dimensions.width}x${dimensions.height}`;

    console.log('[social-commerce:beat-generation] Generating beat:', {
      beatId,
      videoModel,
      resolution,
      duration: beat.total_duration || 12,
      promptLength: beat.sora_prompt.text.length,
      inputImageUrl: inputImageUrl.substring(0, 80) + '...',
      imageSource: step1Data.productImages?.compositeImage?.isApplied ? 'composite' : 
                   step1Data.productImages?.heroProfile ? 'hero' : 'legacy',
    });

    // Call Sora API to generate video
    const soraResponse = await callAi({
      provider: 'openai',
      model: videoModel,
      task: 'image-to-video',
      payload: {
        prompt: beat.sora_prompt.text,
        duration: beat.total_duration || 12,
        resolution: resolution,
        image: inputImageUrl, // Reference image (hero or composite) - CDN URL, publicly accessible
      },
      userId,
      workspaceId: video.workspaceId,
    });

    // Extract video buffer or URL from response
    const soraOutput = soraResponse.output as any;
    let videoBuffer: Buffer;
    
    if (soraOutput.videoBuffer) {
      // Video was downloaded directly from Sora API /content endpoint
      console.log('[social-commerce:beat-generation] Video buffer received from Sora API, uploading to CDN...');
      videoBuffer = soraOutput.videoBuffer;
    } else if (soraOutput.videoUrl) {
      // Legacy: Download from URL (if API changes back)
      console.log('[social-commerce:beat-generation] Video generated, downloading from OpenAI CDN...');
      const videoResponse = await fetch(soraOutput.videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video from OpenAI: ${videoResponse.status} ${videoResponse.statusText}`);
      }
      videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    } else {
      throw new Error('No video buffer or URL in Sora API response');
    }

    // Trim first 0.5 seconds from video (Sora sometimes has glitchy first frame)
    console.log('[social-commerce:beat-generation] Trimming first 0.5s from video...');
    try {
      videoBuffer = await trimVideoStart(videoBuffer, 0.5);
      console.log('[social-commerce:beat-generation] ✓ Video trimmed successfully');
    } catch (trimError) {
      console.warn('[social-commerce:beat-generation] Failed to trim video, using original:', trimError);
      // Continue with original buffer if trim fails - don't block video generation
    }

    // Get workspace info for path building (workspace variable already exists from verifyWorkspaceAccess)
    const workspaceInfo = await storage.getWorkspace(video.workspaceId);
    if (!workspaceInfo) {
      throw new Error('Workspace not found');
    }

    // Build Bunny CDN path for the video - use video's creation date to keep files in same folder
    const createdDate = new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
    const videoFileName = `${beatId}_${Date.now()}.mp4`;
    const videoPath = buildVideoModePath({
      userId,
      workspaceName: workspaceInfo.name,
      toolMode: 'commerce',
      projectName: video.title || 'untitled',
      subFolder: 'Beats',
      filename: videoFileName,
      dateLabel: createdDate,
    });

    // Upload video to Bunny CDN
    console.log('[social-commerce:beat-generation] Uploading video to Bunny CDN...');
    const videoCdnUrl = await bunnyStorage.uploadFile(
      videoPath,
      videoBuffer,
      'video/mp4'
    );

    // Extract last frame from video (optional - TODO: implement with ffmpeg)
    // For now, we'll skip this and set it to undefined
    let lastFrameUrl: string | undefined;
    // TODO: Implement last frame extraction using ffmpeg:
    // ffmpeg -i video.mp4 -vf "select=eq(n\\,N-1)" -vframes 1 frame.jpg

    console.log('[social-commerce:beat-generation] ✓ Video uploaded to CDN:', videoCdnUrl);

    // Use the real CDN URL instead of placeholder
    const videoUrl = videoCdnUrl;

    // ✅ FIX: Re-read video data fresh to prevent race condition
    // When multiple beats finish at similar times, each one might read stale data
    // and overwrite the other's beatVideos. By re-reading just before write, we minimize this.
    const freshVideo = await storage.getVideo(id);
    if (!freshVideo) {
      throw new Error('Video not found when saving beat');
    }

    // Update step3Data with generated video (migrated from step5Data)
    const existingStep3Data = freshVideo.step3Data as any || {};
    const updatedStep3Data: Step3Data = {
      ...existingStep3Data,
      beatVideos: {
        ...(existingStep3Data.beatVideos || {}),
        [beatId]: {
          videoUrl,
          lastFrameUrl,
          generatedAt: new Date(),
        },
      },
    };

    await storage.updateVideo(id, {
      step3Data: updatedStep3Data,
    });
    
    console.log('[social-commerce:beat-generation] ✓ Beat saved to database:', {
      beatId,
      totalBeatsNow: Object.keys(updatedStep3Data.beatVideos || {}).length,
    });

    res.json({
      success: true,
      beatId,
      videoUrl,
      lastFrameUrl,
      duration: beat.total_duration || 12,
      status: 'completed',
    });
  } catch (error) {
    console.error('[social-commerce:beat-generation] Error:', error);
    res.status(500).json({
      error: 'Failed to generate beat',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/social-commerce/videos/:id/beats/:beatId/status
 * Get generation status for a beat
 */
router.get('/videos/:id/beats/:beatId/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id, beatId } = req.params;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access (videos belong to workspaces, not directly to users)
    const workspace = await verifyWorkspaceAccess(video.workspaceId, userId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Check step3Data (migrated from step5Data) and step5Data (backward compatibility)
    const step3Data = video.step3Data as any;
    const step5Data = video.step5Data as any;
    const beatVideo = step3Data?.beatVideos?.[beatId] || step5Data?.beatVideos?.[beatId];

    if (beatVideo) {
      res.json({
        beatId,
        status: 'completed',
        videoUrl: beatVideo.videoUrl,
        lastFrameUrl: beatVideo.lastFrameUrl,
      });
    } else {
      res.json({
        beatId,
        status: 'pending',
      });
    }
  } catch (error) {
    console.error('[social-commerce:beat-status] Error:', error);
    res.status(500).json({
      error: 'Failed to get beat status',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE PREVIEW ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social-commerce/voice-preview/:voiceId
 * Generates voice preview audio using ElevenLabs TTS
 * No authentication required - just redirects to ElevenLabs preview URL
 * Query params:
 *   - lang: 'ar' for Arabic, 'en' for English (default: uses voice default preview)
 */
router.get(
  "/voice-preview/:voiceId",
  async (req: Request, res: Response) => {
    try {
      const { voiceId } = req.params;
      const { lang } = req.query;
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

      if (!elevenLabsApiKey) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      // If Arabic language requested, generate TTS with Arabic text
      if (lang === 'ar') {
        const arabicPreviewText = "مرحباً، أنا صوتك للسرد. سأساعدك في إنشاء قصص رائعة.";
        
        console.log(`[social-commerce:voice-preview] Generating Arabic preview for voice ${voiceId}`);
        
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: arabicPreviewText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!ttsResponse.ok) {
          console.error(`[social-commerce:voice-preview] TTS failed for voice ${voiceId}:`, ttsResponse.statusText);
          // Fall back to default preview
          return res.redirect(`/api/social-commerce/voice-preview/${voiceId}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.byteLength);
        return res.send(Buffer.from(audioBuffer));
      }

      // Default: fetch the standard preview from ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      });

      if (!response.ok) {
        console.error(`[social-commerce:voice-preview] Failed to fetch voice ${voiceId}:`, response.statusText);
        return res.status(response.status).json({ error: "Failed to fetch voice preview" });
      }

      const voiceData = await response.json();
      
      // ElevenLabs returns preview_url in the voice data
      if (voiceData.preview_url) {
        // Redirect to the preview URL
        return res.redirect(voiceData.preview_url);
      } else {
        return res.status(404).json({ error: "Preview not available for this voice" });
      }
    } catch (error) {
      console.error("[social-commerce:voice-preview] Error:", error);
      res.status(500).json({ error: "Failed to fetch voice preview" });
    }
  }
);

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

