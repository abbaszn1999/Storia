/**
 * Composite Image Generator Service
 * 
 * Combines multiple product images (hero, angles, elements) into a single composite image
 * for use as reference in Sora video generation.
 */

import sharp from 'sharp';
import { uploadFile, buildVideoModePath } from '../../../storage/bunny-storage';
import { generateCompositePrompt } from '../agents/composite-prompt-architect';
import { callAi } from '../../../ai/service';
import type { AiRequest } from '../../../ai/types';
import { getRunwareModelId, getImageDimensions } from '../../../ai/config';
import { storage } from '../../../storage';

export interface CompositeGenerationInput {
  mode: 'manual' | 'ai_generated';
  videoId: string; // Video ID for building correct path
  // Manual mode fields
  heroImage?: string; // CDN URL
  productAngles?: string[]; // CDN URLs (max 2)
  elements?: string[]; // CDN URLs (max 3)
  // AI mode fields
  images?: string[]; // Up to 6 images (CDN URLs)
  context?: string; // Optional user context
  productTitle?: string; // From step1Data
  productDescription?: string; // From step1Data
  targetAudience?: string; // From step1Data
  aspectRatio?: string; // For layout (default: 9:16)
  prompt?: string; // Optional: pre-generated prompt (skips prompt generation)
  layoutDescription?: string; // Optional: layout description from prompt generation
  styleGuidance?: string; // Optional: style guidance from prompt generation
}

export interface CompositeGenerationOutput {
  compositeUrl: string; // CDN URL of generated composite
  sourceImages: string[]; // All source image URLs
  layout: string; // Layout type used
  generatedAt: number;
  prompt?: string; // Generated prompt (for AI mode)
}

/**
 * Download image from CDN URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Layout types for Hero-centric composite generation
 * 
 * NEW LAYOUT SYSTEM:
 * - 'skip': Hero only - no compositing needed, use original image
 * - 'hero-60-others-40': Hero (60% height) + Others (40% height, split by width)
 * - 'hero-50-angles-25-elements-25': All three sections present
 */
type CompositeLayout = 'skip' | 'hero-60-others-40' | 'hero-50-angles-25-elements-25';

/**
 * Determine layout type based on which image categories are present
 * 
 * Rules:
 * 1. Hero only → skip (no compositing)
 * 2. Hero + (Angles OR Elements) → hero-60-others-40
 * 3. Hero + Angles + Elements → hero-50-angles-25-elements-25
 */
function determineHeroCentricLayout(
  hasHero: boolean,
  anglesCount: number,
  elementsCount: number
): CompositeLayout {
  if (!hasHero) {
    throw new Error('Hero image is required for composite generation');
  }
  
  const hasAngles = anglesCount > 0;
  const hasElements = elementsCount > 0;
  
  // Hero only - no compositing needed
  if (!hasAngles && !hasElements) {
    return 'skip';
  }
  
  // All three sections present
  if (hasAngles && hasElements) {
    return 'hero-50-angles-25-elements-25';
  }
  
  // Hero + (Angles OR Elements)
  return 'hero-60-others-40';
}

/**
 * Generate AI mode composite using Nano Banana Pro
 */
export async function generateAIModeComposite(
  input: CompositeGenerationInput,
  userId: string,
  workspaceId: string
): Promise<CompositeGenerationOutput> {
  const { videoId } = input;
  const { 
    images = [], 
    context, 
    productTitle, 
    productDescription, 
    targetAudience, 
    aspectRatio = '9:16',
    prompt: providedPrompt,
    layoutDescription: providedLayoutDescription,
    styleGuidance: providedStyleGuidance,
  } = input;

  if (!images || images.length === 0) {
    throw new Error('No images provided for AI composite generation');
  }

  if (images.length > 6) {
    throw new Error('Maximum 6 images allowed for AI composite generation');
  }

  console.log('[composite-generator] Starting AI mode composite generation:', {
    imageCount: images.length,
    hasContext: !!context,
    aspectRatio,
    hasProvidedPrompt: !!providedPrompt,
  });

  try {
    // Step 1: Generate prompt using agent (if not provided)
    let promptOutput;
    if (providedPrompt) {
      // Use provided prompt (from preview dialog)
      promptOutput = {
        prompt: providedPrompt,
        layoutDescription: providedLayoutDescription || `${images.length} image${images.length > 1 ? 's' : ''} in grid layout`,
        styleGuidance: providedStyleGuidance || 'Professional, cinematic quality with optimal lighting',
        cost: 0, // No cost for using provided prompt
      };
      console.log('[composite-generator] Using provided prompt, skipping generation');
    } else {
      // Generate prompt using agent
      promptOutput = await generateCompositePrompt(
        {
          images,
          userContext: context,
          productTitle,
          productDescription,
          targetAudience,
          aspectRatio,
        },
        userId,
        workspaceId,
        'video',
        'social-commerce'
      );
      console.log('[composite-generator] Prompt generated, calling Nano Banana Pro...');
    }

    // Step 2: Call Runware API with Nano Banana Pro
    // Get supported dimensions for Nano Banana 2 Pro
    // Default to 1K resolution for cost efficiency
    const dimensions = getImageDimensions(aspectRatio, '1k', 'nano-banana-2-pro');
    const width = dimensions.width;
    const height = dimensions.height;
    
    console.log('[composite-generator] Using dimensions:', { width, height, aspectRatio });

    // Get Runware model identifier (google:4@2 for nano-banana-2-pro)
    const runwareModelId = getRunwareModelId('nano-banana-2-pro');
    
    const runwareRequest: AiRequest = {
      provider: 'runware',
      model: 'nano-banana-2-pro', // Friendly name for config lookup
      task: 'image-generation',
      payload: {
        model: runwareModelId, // Use AIR identifier in payload
        positivePrompt: promptOutput.prompt,
        referenceImages: images, // Up to 6 reference images
        width,
        height,
        outputType: 'URL',
      },
      runware: {
        deliveryMethod: 'async',
        pollIntervalMs: 2000,
        timeoutMs: 180000, // 3 minutes timeout (increased from 2 minutes)
      },
    };

    const runwareResponse = await callAi({
      ...runwareRequest,
      userId,
      workspaceId,
    }, {
      skipCreditCheck: false,
      metadata: { usageType: 'image', usageMode: 'social-commerce' },
    });
    const results = Array.isArray(runwareResponse.output) ? runwareResponse.output : [runwareResponse.output];
    
    if (!results || results.length === 0) {
      throw new Error('No results from Runware API');
    }

    const firstResult = results[0];
    if (firstResult.error || firstResult.status === 'failed') {
      throw new Error(firstResult.error || 'Image generation failed');
    }

    if (!firstResult.imageURL) {
      throw new Error('No image URL in Runware response');
    }

    const generatedImageUrl = firstResult.imageURL;
    console.log('[composite-generator] Image generated by Nano Banana Pro:', generatedImageUrl);

    // Step 3: Download generated image and upload to Bunny CDN
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Upload to Bunny Storage using buildVideoModePath
    const timestamp = Date.now();

    // Get workspace info for path building
    const workspaceInfo = await storage.getWorkspace(workspaceId);
    if (!workspaceInfo) {
      throw new Error('Workspace not found');
    }

    // Get video info for project name
    const video = await storage.getVideo(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Use video's creation date to keep files in same folder
    const createdDate = new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
    const compositeFileName = `ai_composite_${timestamp}.png`;
    const compositePath = buildVideoModePath({
      userId,
      workspaceName: workspaceInfo.name,
      toolMode: 'commerce',
      projectName: video.title || 'untitled',
      subFolder: 'Composites',
      filename: compositeFileName,
      dateLabel: createdDate,
    });
    
    console.log('[composite-generator] Uploading AI composite to Bunny:', compositePath);
    const compositeUrl = await uploadFile(compositePath, imageBuffer, 'image/png');

    console.log('[composite-generator] ✓ AI composite generated successfully:', {
      url: compositeUrl,
      promptLength: promptOutput.prompt.length,
      imageCount: images.length,
      cost: (runwareResponse.usage?.totalCostUsd || 0) + promptOutput.cost,
    });

    return {
      compositeUrl,
      sourceImages: images,
      layout: promptOutput.layoutDescription,
      generatedAt: Date.now(),
      prompt: promptOutput.prompt,
    };
  } catch (error) {
    console.error('[composite-generator] Error generating AI composite:', error);
    
    // ✅ تحسين error message للـ network errors
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('fetch failed')) {
        errorMessage = 'Network connection error while generating image. Please try again.';
      } else if (error.message.includes('timeout') || error.message.includes('timeout exceeded')) {
        errorMessage = 'Image generation timed out. Please try again.';
      } else if (error.message.includes('No image URL')) {
        errorMessage = 'Image generation completed but no image URL was returned. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    throw new Error(`Failed to generate AI composite: ${errorMessage}`);
  }
}

/**
 * Generate composite image from uploaded product images
 * 
 * NEW HERO-CENTRIC LAYOUT SYSTEM:
 * 
 * 1. Hero only → No compositing, return original image URL
 * 
 * 2. Hero + (Angles OR Elements) → 60/40 split:
 *    ┌─────────────────────────────────────┐
 *    │           HERO (60%)                │
 *    │         Width: 100%                 │
 *    │         Height: 60%                 │
 *    ├──────────┬──────────┬───────────────┤
 *    │ Other 1  │ Other 2  │ Other 3...    │
 *    │ Height: 40%, Width: 100%/count      │
 *    └──────────┴──────────┴───────────────┘
 * 
 * 3. Hero + Angles + Elements → 50/25/25 split:
 *    ┌─────────────────────────────────────┐
 *    │           HERO (50%)                │
 *    │         Width: 100%                 │
 *    │         Height: 50%                 │
 *    ├──────────────────┬──────────────────┤
 *    │   ANGLES (25%)   │   ANGLES (25%)   │
 *    │  Width: 100%/count, Height: 25%    │
 *    ├──────────┬───────┴───┬──────────────┤
 *    │ ELEMENTS │ ELEMENTS  │ ELEMENTS     │
 *    │ Width: 100%/count, Height: 25%     │
 *    └──────────┴───────────┴──────────────┘
 */
export async function generateComposite(
  input: CompositeGenerationInput,
  userId: string,
  workspaceId: string
): Promise<CompositeGenerationOutput> {
  // Route to appropriate function based on mode
  if (input.mode === 'ai_generated') {
    return generateAIModeComposite(input, userId, workspaceId);
  }

  const { videoId, heroImage, productAngles = [], elements = [] } = input;
  
  // Validate hero image
  if (!heroImage) {
    throw new Error('Hero image is required for composite generation');
  }
  
  // Determine layout based on which categories are present
  const layout = determineHeroCentricLayout(
    !!heroImage,
    productAngles.length,
    elements.length
  );
  
  // Collect all source images for tracking
  const sourceImages: string[] = [heroImage, ...productAngles, ...elements].filter((img): img is string => Boolean(img));
  
  console.log('[composite-generator] Starting Hero-centric composite generation:', {
    layout,
    heroImage: !!heroImage,
    anglesCount: productAngles.length,
    elementsCount: elements.length,
    totalImages: sourceImages.length,
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT: SKIP - Hero only, no compositing needed
  // ═══════════════════════════════════════════════════════════════════════════
  if (layout === 'skip') {
    console.log('[composite-generator] ✓ Hero only - skipping composite, using original image');
    return {
      compositeUrl: heroImage,
      sourceImages: [heroImage],
      layout: 'hero-only',
      generatedAt: Date.now(),
    };
  }
  
  // Target dimensions for 9:16 aspect ratio (Sora standard)
  const targetWidth = 1024;
  const targetHeight = 1820; // 9:16 ratio
  
  try {
    // Download hero image
    console.log('[composite-generator] Downloading hero image:', heroImage);
    const heroBuffer = await downloadImage(heroImage);
    
    let composite: sharp.Sharp;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LAYOUT: hero-60-others-40 - Hero (60%) + Others (40%)
    // ═══════════════════════════════════════════════════════════════════════════
    if (layout === 'hero-60-others-40') {
      const heroHeight = Math.floor(targetHeight * 0.6); // 60%
      const othersHeight = targetHeight - heroHeight; // 40%
      
      // Combine angles and elements into "others"
      const otherImages = [...productAngles, ...elements];
      const othersCount = otherImages.length;
      const cellWidth = Math.floor(targetWidth / othersCount);
      
      console.log('[composite-generator] Layout hero-60-others-40:', {
        heroHeight,
        othersHeight,
        othersCount,
        cellWidth,
      });
      
      // Resize hero to 100% width, 60% height
      const heroResized = await sharp(heroBuffer)
        .resize(targetWidth, heroHeight, { 
          fit: 'contain', 
          background: { r: 255, g: 255, b: 255, alpha: 1 } 
        })
        .toBuffer();
      
      // Download and resize other images
      const othersResized: Buffer[] = [];
      for (const url of otherImages) {
        console.log('[composite-generator] Downloading other image:', url);
        const buffer = await downloadImage(url);
        const resized = await sharp(buffer)
          .resize(cellWidth, othersHeight, { 
            fit: 'contain', 
            background: { r: 255, g: 255, b: 255, alpha: 1 } 
          })
          .toBuffer();
        othersResized.push(resized);
      }
      
      // Build composite layers
      const composites: Array<{ input: Buffer; left: number; top: number }> = [
        { input: heroResized, left: 0, top: 0 },
      ];
      
      // Add other images side by side at bottom
      for (let i = 0; i < othersResized.length; i++) {
        composites.push({
          input: othersResized[i],
          left: i * cellWidth,
          top: heroHeight,
        });
      }
      
      composite = sharp({
        create: {
          width: targetWidth,
          height: targetHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).composite(composites);
      
    // ═══════════════════════════════════════════════════════════════════════════
    // LAYOUT: hero-50-angles-25-elements-25 - All three sections
    // ═══════════════════════════════════════════════════════════════════════════
    } else {
      const heroHeight = Math.floor(targetHeight * 0.5); // 50%
      const anglesHeight = Math.floor(targetHeight * 0.25); // 25%
      const elementsHeight = targetHeight - heroHeight - anglesHeight; // 25%
      
      const anglesCellWidth = Math.floor(targetWidth / productAngles.length);
      const elementsCellWidth = Math.floor(targetWidth / elements.length);
      
      console.log('[composite-generator] Layout hero-50-angles-25-elements-25:', {
        heroHeight,
        anglesHeight,
        elementsHeight,
        anglesCount: productAngles.length,
        elementsCount: elements.length,
        anglesCellWidth,
        elementsCellWidth,
      });
      
      // Resize hero to 100% width, 50% height
      const heroResized = await sharp(heroBuffer)
        .resize(targetWidth, heroHeight, { 
          fit: 'contain', 
          background: { r: 255, g: 255, b: 255, alpha: 1 } 
        })
        .toBuffer();
      
      // Download and resize angles
      const anglesResized: Buffer[] = [];
      for (const url of productAngles) {
        console.log('[composite-generator] Downloading angle image:', url);
        const buffer = await downloadImage(url);
        const resized = await sharp(buffer)
          .resize(anglesCellWidth, anglesHeight, { 
            fit: 'contain', 
            background: { r: 255, g: 255, b: 255, alpha: 1 } 
          })
          .toBuffer();
        anglesResized.push(resized);
      }
      
      // Download and resize elements
      const elementsResized: Buffer[] = [];
      for (const url of elements) {
        console.log('[composite-generator] Downloading element image:', url);
        const buffer = await downloadImage(url);
        const resized = await sharp(buffer)
          .resize(elementsCellWidth, elementsHeight, { 
            fit: 'contain', 
            background: { r: 255, g: 255, b: 255, alpha: 1 } 
          })
          .toBuffer();
        elementsResized.push(resized);
      }
      
      // Build composite layers
      const composites: Array<{ input: Buffer; left: number; top: number }> = [
        { input: heroResized, left: 0, top: 0 },
      ];
      
      // Add angles row (below hero)
      for (let i = 0; i < anglesResized.length; i++) {
        composites.push({
          input: anglesResized[i],
          left: i * anglesCellWidth,
          top: heroHeight,
        });
      }
      
      // Add elements row (below angles)
      for (let i = 0; i < elementsResized.length; i++) {
        composites.push({
          input: elementsResized[i],
          left: i * elementsCellWidth,
          top: heroHeight + anglesHeight,
        });
      }
      
      composite = sharp({
        create: {
          width: targetWidth,
          height: targetHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).composite(composites);
    }
    
    // Generate final composite as PNG
    const compositeBuffer = await composite.png().toBuffer();
    
    // Upload to Bunny Storage using buildVideoModePath
    const timestamp = Date.now();

    // Get workspace info for path building
    const workspaceInfo = await storage.getWorkspace(workspaceId);
    if (!workspaceInfo) {
      throw new Error('Workspace not found');
    }

    // Get video info for project name
    const video = await storage.getVideo(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Use video's creation date to keep files in same folder
    const createdDateManual = new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
    const compositeFileName = `composite_${timestamp}.png`;
    const compositePath = buildVideoModePath({
      userId,
      workspaceName: workspaceInfo.name,
      toolMode: 'commerce',
      projectName: video.title || 'untitled',
      subFolder: 'Composites',
      filename: compositeFileName,
      dateLabel: createdDateManual,
    });
    
    console.log('[composite-generator] Uploading composite to Bunny:', compositePath);
    const compositeUrl = await uploadFile(compositePath, compositeBuffer, 'image/png');
    
    console.log('[composite-generator] ✓ Composite generated successfully:', {
      url: compositeUrl,
      layout,
      anglesCount: productAngles.length,
      elementsCount: elements.length,
    });
    
    return {
      compositeUrl,
      sourceImages,
      layout,
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error('[composite-generator] Error generating composite:', error);
    throw new Error(`Failed to generate composite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
