/**
 * Composite Image Generator Service
 * 
 * Combines multiple product images (hero, angles, elements) into a single composite image
 * for use as reference in Sora video generation.
 */

import sharp from 'sharp';
import { uploadFile } from '../../../storage/bunny-storage';
import { generateCompositePrompt } from '../agents/composite-prompt-architect';
import { callAi } from '../../../ai/service';
import type { AiRequest } from '../../../ai/types';
import { getRunwareModelId, getImageDimensions } from '../../../ai/config';

export interface CompositeGenerationInput {
  mode: 'manual' | 'ai_generated';
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
 * Determine layout type based on number of images
 */
function determineLayout(imageCount: number): 'single' | 'side-by-side' | 'grid-2x2' | 'grid-3x2' {
  if (imageCount === 1) return 'single';
  if (imageCount === 2) return 'side-by-side';
  if (imageCount === 3 || imageCount === 4) return 'grid-2x2';
  return 'grid-3x2'; // 5 or 6 images
}

/**
 * Generate AI mode composite using Nano Banana Pro
 */
export async function generateAIModeComposite(
  input: CompositeGenerationInput,
  userId: string,
  workspaceId: string
): Promise<CompositeGenerationOutput> {
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
        workspaceId
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
        timeoutMs: 120000, // 2 minutes timeout
      },
    };

    const runwareResponse = await callAi({
      ...runwareRequest,
      userId,
      workspaceId,
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
    
    // Upload to Bunny Storage
    const timestamp = Date.now();
    const workspaceName = workspaceId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const bunnyPath = `${userId}/${workspaceName}/Assets/Composites/ai_composite_${timestamp}.png`;
    
    console.log('[composite-generator] Uploading AI composite to Bunny:', bunnyPath);
    const compositeUrl = await uploadFile(bunnyPath, imageBuffer, 'image/png');

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
    throw new Error(`Failed to generate AI composite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate composite image from uploaded product images
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

  const { heroImage, productAngles = [], elements = [] } = input;
  
  // Collect all source images
  const sourceImages: string[] = [heroImage, ...productAngles, ...elements].filter(Boolean);
  const imageCount = sourceImages.length;
  
  if (imageCount === 0) {
    throw new Error('No images provided for composite generation');
  }
  
  // Determine layout
  const layout = determineLayout(imageCount);
  
  // Target dimensions for 9:16 aspect ratio (Sora standard)
  const targetWidth = 1024;
  const targetHeight = 1820; // 9:16 ratio
  
  console.log('[composite-generator] Starting composite generation:', {
    imageCount,
    layout,
    dimensions: `${targetWidth}x${targetHeight}`,
  });
  
  try {
    // Download all images
    const imageBuffers: Buffer[] = [];
    for (const url of sourceImages) {
      console.log('[composite-generator] Downloading image:', url);
      const buffer = await downloadImage(url);
      imageBuffers.push(buffer);
    }
    
    let composite: sharp.Sharp;
    
    if (layout === 'single') {
      // Single image: Use hero as-is, resize to target dimensions
      composite = sharp(imageBuffers[0])
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        });
    } else if (layout === 'side-by-side') {
      // 2 images: Side-by-side (50/50 split)
      const [heroBuffer, secondBuffer] = imageBuffers;
      const halfWidth = Math.floor(targetWidth / 2);
      
      const heroResized = await sharp(heroBuffer)
        .resize(halfWidth, targetHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      
      const secondResized = await sharp(secondBuffer)
        .resize(halfWidth, targetHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      
      composite = sharp({
        create: {
          width: targetWidth,
          height: targetHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: heroResized, left: 0, top: 0 },
          { input: secondResized, left: halfWidth, top: 0 },
        ]);
    } else if (layout === 'grid-2x2') {
      // 3-4 images: Grid 2x2
      const cellWidth = Math.floor(targetWidth / 2);
      const cellHeight = Math.floor(targetHeight / 2);
      
      const resizedImages: Buffer[] = [];
      for (const buffer of imageBuffers) {
        const resized = await sharp(buffer)
          .resize(cellWidth, cellHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .toBuffer();
        resizedImages.push(resized);
      }
      
      const composites: Array<{ input: Buffer; left: number; top: number }> = [];
      
      // Hero always top-left
      composites.push({ input: resizedImages[0], left: 0, top: 0 });
      
      // Second image top-right
      if (resizedImages[1]) {
        composites.push({ input: resizedImages[1], left: cellWidth, top: 0 });
      }
      
      // Third image bottom-left
      if (resizedImages[2]) {
        composites.push({ input: resizedImages[2], left: 0, top: cellHeight });
      }
      
      // Fourth image bottom-right
      if (resizedImages[3]) {
        composites.push({ input: resizedImages[3], left: cellWidth, top: cellHeight });
      }
      
      composite = sharp({
        create: {
          width: targetWidth,
          height: targetHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).composite(composites);
    } else {
      // 5-6 images: Grid 3x2 (Hero takes 2 cells, others 1 cell each)
      const cellWidth = Math.floor(targetWidth / 3);
      const cellHeight = Math.floor(targetHeight / 2);
      const heroWidth = cellWidth * 2; // Hero takes 2 cells width
      
      const resizedImages: Buffer[] = [];
      
      // Hero: 2 cells wide, 1 cell tall
      const heroResized = await sharp(imageBuffers[0])
        .resize(heroWidth, cellHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      resizedImages.push(heroResized);
      
      // Other images: 1 cell each
      for (let i = 1; i < imageBuffers.length; i++) {
        const resized = await sharp(imageBuffers[i])
          .resize(cellWidth, cellHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .toBuffer();
        resizedImages.push(resized);
      }
      
      const composites: Array<{ input: Buffer; left: number; top: number }> = [];
      
      // Hero: top-left, 2 cells wide
      composites.push({ input: resizedImages[0], left: 0, top: 0 });
      
      // Remaining images arranged around hero
      let imageIndex = 1;
      // Top row: image after hero
      if (resizedImages[imageIndex]) {
        composites.push({ input: resizedImages[imageIndex], left: heroWidth, top: 0 });
        imageIndex++;
      }
      // Bottom row: remaining images
      for (let col = 0; col < 3 && imageIndex < resizedImages.length; col++) {
        composites.push({
          input: resizedImages[imageIndex],
          left: col * cellWidth,
          top: cellHeight,
        });
        imageIndex++;
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
    
    // Upload to Bunny Storage
    const timestamp = Date.now();
    const workspaceName = workspaceId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const bunnyPath = `${userId}/${workspaceName}/Assets/Composites/composite_${timestamp}.png`;
    
    console.log('[composite-generator] Uploading composite to Bunny:', bunnyPath);
    const compositeUrl = await uploadFile(bunnyPath, compositeBuffer, 'image/png');
    
    console.log('[composite-generator] ✓ Composite generated successfully:', {
      url: compositeUrl,
      layout,
      imageCount,
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
