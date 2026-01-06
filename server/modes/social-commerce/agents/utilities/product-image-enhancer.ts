/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.0.5: PRODUCT IMAGE ENHANCER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates professional product images using nano-banana-2-pro to enhance
 * user-uploaded hero images. Optimized for use as starting frame in Sora video generation.
 * 
 * Uses context from Tab 1 (strategic directives, target audience, product info)
 * to create professional commercial product photography prompts.
 */

import { callAi } from '../../../../ai/service';
import { getRunwareModelId } from '../../../../ai/config';
import { IMAGE_DIMENSION_MAP } from '../../../../ai/config/image-models';
import type { AspectRatio } from '../../config';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProductImageEnhancerInput {
  heroImageUrl: string;  // Uploaded hero image (reference)
  productTitle: string;
  productDescription?: string;
  productCategory?: string;
  targetAudience: string;
  aspectRatio: AspectRatio;  // From Tab 1
  strategicContext: {
    strategic_directives: string;
    optimized_motion_dna: string;
  };
  productionLevel?: string;
  visualIntensity?: number;
}

export interface ProductImageEnhancerOutput {
  imageUrl: string;  // Generated image URL from Runware
  cost?: number;     // API cost in USD
  error?: string;    // Error message if failed
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const MODEL = "nano-banana-2-pro";
const RESOLUTION = "2k";  // Professional quality
const RUNWARE_MODEL_ID = "google:4@2";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get dimensions for aspect ratio from nano-banana-2-pro dimension map
 */
function getDimensionsForAspectRatio(aspectRatio: AspectRatio): { width: number; height: number } | null {
  const dimensionMap = IMAGE_DIMENSION_MAP[aspectRatio];
  if (!dimensionMap) {
    console.warn(`[product-image-enhancer] Aspect ratio ${aspectRatio} not found in dimension map, using 9:16 as fallback`);
    const fallback = IMAGE_DIMENSION_MAP["9:16"];
    return fallback ? fallback[RESOLUTION] : { width: 1536, height: 2752 };
  }

  const dimensions = dimensionMap[RESOLUTION];
  if (!dimensions) {
    console.warn(`[product-image-enhancer] Resolution ${RESOLUTION} not found for ${aspectRatio}, using 1k as fallback`);
    return dimensionMap["1k"] || { width: 768, height: 1376 };
  }

  return dimensions;
}

/**
 * Build professional product photography prompt
 */
function buildProfessionalPrompt(input: ProductImageEnhancerInput): string {
  const {
    productTitle,
    productDescription,
    productCategory,
    targetAudience,
    strategicContext,
    productionLevel,
    visualIntensity,
  } = input;

  // Base: Professional commercial product photography
  let prompt = `Professional commercial product photography of ${productTitle}`;

  // Product context
  if (productCategory) {
    prompt += `, ${productCategory} product`;
  }
  if (productDescription) {
    prompt += `. ${productDescription}`;
  }

  // Target audience optimization
  prompt += `, optimized for ${targetAudience} audience.`;

  // Strategic directives (visual/cultural guidelines)
  if (strategicContext.strategic_directives) {
    prompt += `\n\nVisual Guidelines: ${strategicContext.strategic_directives}`;
  }

  // Motion DNA hints for lighting/camera style
  if (strategicContext.optimized_motion_dna) {
    // Extract lighting/camera hints from motion DNA
    const motionDna = strategicContext.optimized_motion_dna.toLowerCase();
    if (motionDna.includes('golden') || motionDna.includes('warm')) {
      prompt += `\nLighting: Warm golden hour studio lighting with soft directional key light.`;
    } else if (motionDna.includes('dramatic') || motionDna.includes('contrast')) {
      prompt += `\nLighting: Dramatic contrast lighting with bold shadows and highlights.`;
    } else if (motionDna.includes('soft') || motionDna.includes('diffused')) {
      prompt += `\nLighting: Soft diffused studio lighting with even illumination.`;
    } else {
      prompt += `\nLighting: Professional studio lighting with clean, flattering illumination.`;
    }
  }

  // Production level quality
  const qualityLevel = productionLevel === 'ultra' ? 'ultra-high' : 
                      productionLevel === 'cinematic' ? 'cinematic' :
                      productionLevel === 'balanced' ? 'high' : 'professional';
  prompt += `\nQuality: ${qualityLevel} quality, 4K, photorealistic, commercial product photography.`;

  // Visual intensity (if provided)
  if (visualIntensity !== undefined) {
    if (visualIntensity >= 70) {
      prompt += ` Dynamic composition with bold visual impact.`;
    } else if (visualIntensity >= 40) {
      prompt += ` Balanced composition with engaging visual appeal.`;
    } else {
      prompt += ` Clean, minimal composition with product focus.`;
    }
  }

  // Technical specifications
  prompt += ` Perfect for social media advertising and video production.`;
  prompt += ` Clean background, professional product presentation, sharp focus,`;
  prompt += ` commercial photography quality, magazine editorial standard.`;

  // Reference image enhancement instruction
  prompt += `\n\nEnhance and professionalize the reference product image while maintaining`;
  prompt += ` the product's identity, shape, and key features. Improve lighting,`;
  prompt += ` composition, and overall visual quality to professional commercial standards.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate enhanced professional product image
 * 
 * Agent 2.0.5: Product Image Enhancer
 * 
 * Creates a professional product image optimized for use as starting frame in Sora:
 * - Uses nano-banana-2-pro for professional quality
 * - Incorporates Tab 1 context (strategic directives, target audience)
 * - Maintains product identity from reference image
 * - Optimized for specified aspect ratio
 * 
 * @param input - Product details and context from Tab 1
 * @param userId - User ID for billing/tracking
 * @param workspaceId - Workspace ID for billing/tracking
 * @returns Generated image URL or error
 */
export async function generateEnhancedProductImage(
  input: ProductImageEnhancerInput,
  userId: string,
  workspaceId: string
): Promise<ProductImageEnhancerOutput> {
  console.log('[product-image-enhancer] Starting image enhancement:', {
    productTitle: input.productTitle,
    aspectRatio: input.aspectRatio,
    targetAudience: input.targetAudience,
    hasStrategicContext: !!input.strategicContext,
  });

  // Get dimensions for aspect ratio
  const dimensions = getDimensionsForAspectRatio(input.aspectRatio);
  if (!dimensions) {
    return {
      imageUrl: '',
      error: `Unsupported aspect ratio: ${input.aspectRatio}`,
    };
  }

  // Build professional prompt
  const positivePrompt = buildProfessionalPrompt(input);
  console.log('[product-image-enhancer] Prompt length:', positivePrompt.length);

  // Get Runware model ID
  const runwareModelId = getRunwareModelId(MODEL);
  if (!runwareModelId) {
    return {
      imageUrl: '',
      error: `No Runware mapping for model: ${MODEL}`,
    };
  }

  try {
    // Build the payload
    const payload: Record<string, any> = {
      taskType: "imageInference",
      model: runwareModelId,
      positivePrompt,
      width: dimensions.width,
      height: dimensions.height,
      referenceImages: [input.heroImageUrl],  // Use uploaded hero image as reference
      numberResults: 1,
      includeCost: true,
    };

    console.log('[product-image-enhancer] Calling nano-banana-2-pro:', {
      model: runwareModelId,
      dimensions: `${dimensions.width}x${dimensions.height}`,
      promptLength: positivePrompt.length,
      hasReferenceImage: !!input.heroImageUrl,
    });

    // Call Runware API
    const response = await callAi(
      {
        provider: "runware",
        model: MODEL,
        task: "image-generation",
        payload,
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
      }
    );

    // Extract image URL from response
    const results = response.output as any[];
    const data = Array.isArray(results) ? results[0] : results;

    console.log('[product-image-enhancer] Response received:', {
      hasData: !!data,
      imageURL: data?.imageURL ? 'present' : 'missing',
      cost: response.usage?.totalCostUsd || data?.cost,
    });

    // Try to extract image URL from various response formats
    // Runware uses imageURL (uppercase), but check multiple formats for compatibility
    const imageUrl = data?.imageURL || data?.imageUrl || data?.outputURL || data?.url || data?.image;
    
    if (!imageUrl) {
      console.error('[product-image-enhancer] No image URL found in response:', {
        dataKeys: data ? Object.keys(data) : 'no data',
        fullData: JSON.stringify(data).substring(0, 500),
      });
      return {
        imageUrl: '',
        error: 'No image URL returned from generation',
      };
    }

    const cost = response.usage?.totalCostUsd || data?.cost;

    console.log('[product-image-enhancer] Image generated successfully:', {
      imageUrl: imageUrl.substring(0, 80) + '...',
      cost,
    });

    return {
      imageUrl,
      cost,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[product-image-enhancer] Generation failed:', errorMessage);
    return {
      imageUrl: '',
      error: errorMessage,
    };
  }
}

