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
    
    let characterAIProfile = null;
    let characterCost = 0;

    if (requestData.includeHumanElement && characterReferenceUrl) {
      console.log('[social-commerce] Running Agent 2.2: Character Curator...');
      
      const { createCharacterProfile } = await import('../agents/tab-2/character-curator');
      
      // Get step1Data for context
      const step1Data = video.step1Data as any;
      
      const characterInput = {
        strategic_directives: step1Data?.strategicContext?.strategic_directives || '',
        targetAudience: requestData.targetAudience || '',
        optimized_image_instruction: step1Data?.strategicContext?.optimized_image_instruction || '',
        characterMode: requestData.characterMode || 'full-body',
        character_description: requestData.characterDescription || '',
        characterReferenceUrl,
      };

      const characterResult = await createCharacterProfile(characterInput, userId, video.workspaceId);
      characterAIProfile = characterResult;
      characterCost = characterResult.cost || 0;
      
      console.log('[social-commerce] Agent 2.2 completed:', {
        identityId: characterAIProfile.identity_id,
        cost: characterCost,
      });
    } else {
      console.log('[social-commerce] Skipping Agent 2.2:', {
        includeHumanElement: requestData.includeHumanElement,
        hasCharacterUrl: !!characterReferenceUrl,
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
    // STEP 4: SAVE TO DATABASE
    // ═══════════════════════════════════════════════════════════════
    
    const step2Data = {
      // Product images (Bunny CDN URLs from Assets/Uploads/)
      productImages: productImageUrls,
      
      // Material settings
      materialPreset: requestData.materialPreset || 'metallic',
      surfaceComplexity: requestData.surfaceComplexity || 50,
      refractionEnabled: requestData.refractionEnabled || false,
      heroFeature: requestData.heroFeature || '',
      originMetaphor: requestData.originMetaphor || '',
      
      // Agent 2.1 output
      productDNA,
      
      // Character (with asset ID for reference)
      characterMode: requestData.characterMode,
      characterDescription: requestData.characterDescription,
      characterReferenceUrl,
      characterAssetId,
      characterName: requestData.characterName,
      
      // Agent 2.2 output
      characterAIProfile,
      
      // Brand (with asset ID for reference)
      logoUrl,
      brandPrimaryColor: requestData.brandPrimaryColor,
      brandSecondaryColor: requestData.brandSecondaryColor,
      logoIntegrity: requestData.logoIntegrity,
      logoDepth: requestData.logoDepth,
      brandkitAssetId,
      brandName: requestData.brandName,
      
      // Agent 2.3 output
      brandIdentity,
      
      // Style reference
      styleReferenceUrl,
    };

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
// STEP 3: ENVIRONMENT & STORY (Placeholder - Sprint 4)
// ═══════════════════════════════════════════════════════════════════════════════

router.patch('/videos/:id/step/3/continue', isAuthenticated, async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet - Sprint 4' });
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

