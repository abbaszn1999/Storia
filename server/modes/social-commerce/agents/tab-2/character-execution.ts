/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.2b: CHARACTER EXECUTION (IMAGE GENERATION)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates character images from the planning agent's output.
 * Uses the image model and settings selected in Tab 1.
 * 
 * Supports identity locking strategies:
 * - IP_ADAPTER_STRICT: Uses reference image for identity preservation
 * - PROMPT_EMBEDDING: Pure prompt-based generation with anchor tags
 * - SEED_CONSISTENCY: Fixed seed for silhouette consistency
 * - COMBINED: Multiple strategies for maximum consistency
 */

import { callAi } from '../../../../ai/service';
import { runwareModelIdMap } from '../../../../ai/config';
import { getImageDimensions } from '../../../../stories/shared/config/image-models';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CharacterExecutionInput {
  /** Full character recommendation object from Agent 2.2a */
  recommendation: CharacterRecommendation;
  
  /** Reference image URL (for IP_ADAPTER_STRICT or COMBINED strategies) */
  referenceImageUrl?: string;
  
  /** Image model from Tab 1 settings */
  imageModel: string;
  
  /** Resolution from Tab 1 settings (e.g., "1k", "2k") */
  imageResolution: string;
  
  /** Aspect ratio from Tab 1 settings (e.g., "9:16", "3:4") */
  aspectRatio: string;
}

export interface CharacterExecutionOutput {
  /** Generated character image URL */
  imageUrl: string;
  
  /** Generation cost in USD */
  cost?: number;
  
  /** Error message if generation failed */
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEGATIVE PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

const CHARACTER_NEGATIVE_PROMPT = `
blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions,
extra limbs, extra fingers, missing fingers, fused fingers, mutated hands,
poorly drawn hands, poorly drawn face, mutation, malformed, disfigured,
text, watermark, signature, logo, cropped, out of frame, worst quality,
low resolution, jpeg artifacts, noise, grainy
`.trim().replace(/\n/g, ' ');

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a consistent seed from an identity ID
 * Used for SEED_CONSISTENCY strategy
 */
function hashToSeed(identityId: string): number {
  let hash = 0;
  for (let i = 0; i < identityId.length; i++) {
    hash = ((hash << 5) - hash) + identityId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 2147483647; // Keep within safe integer range
}

/**
 * Build image generation prompt from character recommendation data
 * Handles all 3 modes: hand-model, full-body, silhouette
 */
function buildImageGenerationPrompt(
  recommendation: CharacterRecommendation,
  imageModel: string
): string {
  const { 
    character_profile, 
    appearance, 
    mode, 
    identity_locking,
  } = recommendation;

  let prompt = '';

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE-SPECIFIC PROMPT CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════

  if (mode === 'hand-model') {
    // HAND-MODEL: Focus on hands and wrists only
    prompt = `Close-up photograph of ${appearance.age_range} hands, ${appearance.skin_tone}. `;
    prompt += `${character_profile.detailed_persona} `;
    prompt += `${appearance.style_notes}. `;
    prompt += `Professional product photography, macro lens, soft diffused lighting, `;
    prompt += `high detail, sharp focus on hands and wrists, elegant composition, `;
    prompt += `commercial quality, studio lighting setup`;
    
  } else if (mode === 'full-body') {
    // FULL-BODY: Complete person visible
    prompt = `Portrait of ${appearance.age_range} person, ${appearance.skin_tone}, ${appearance.build}. `;
    prompt += `${character_profile.detailed_persona} `;
    prompt += `${appearance.style_notes}. `;
    prompt += `High-end fashion photography, 85mm lens, shallow depth of field, `;
    prompt += `cinematic lighting, professional studio setup, commercial quality, `;
    prompt += `sharp focus on subject, elegant composition`;
    
  } else if (mode === 'silhouette') {
    // SILHOUETTE: Shape/outline only
    prompt = `Dramatic silhouette of ${appearance.build} figure, ${appearance.age_range}. `;
    prompt += `${character_profile.detailed_persona} `;
    prompt += `High contrast lighting, figure completely in shadow against bright background, `;
    prompt += `clean profile line, distinctive outline, dramatic cinematic lighting, `;
    prompt += `studio setup, commercial quality, minimalist composition`;
    
  } else {
    // Fallback (should not happen, but safety)
    prompt = `${character_profile.detailed_persona} ${appearance.style_notes}. `;
    prompt += `Professional photography, commercial quality`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPEND VFX ANCHOR TAGS FOR CONSISTENCY
  // ═══════════════════════════════════════════════════════════════════════════

  if (identity_locking.vfx_anchor_tags && identity_locking.vfx_anchor_tags.length > 0) {
    const anchorString = identity_locking.vfx_anchor_tags.join(', ');
    prompt += `, ${anchorString}`;
  }

  return prompt.trim();
}

/**
 * Build thumbnail prompt (shorter version for preview cards)
 */
function buildThumbnailPrompt(recommendation: CharacterRecommendation): string {
  const { appearance, mode } = recommendation;
  
  if (mode === 'hand-model') {
    return `${appearance.age_range} hands, ${appearance.skin_tone}, ${appearance.style_notes}, professional photography`;
  } else if (mode === 'full-body') {
    return `${appearance.age_range} person, ${appearance.skin_tone}, ${appearance.build}, ${appearance.style_notes}, fashion photography`;
  } else {
    return `Silhouette of ${appearance.build} figure, ${appearance.age_range}, dramatic lighting`;
  }
}

/**
 * Prepare reference image for Runware API
 * Runware accepts reference images in these formats:
 * - UUID v4 string (previously uploaded image)
 * - Data URI (data:image/png;base64,...)
 * - Base64-encoded image
 * - Publicly accessible URL (https://)
 * 
 * This function returns the URL as-is if it's already in an acceptable format,
 * or converts it to a data URI if necessary.
 */
async function prepareReferenceImageForRunware(imageUrl: string): Promise<string> {
  try {
    // If already a data URI, return as-is
    if (imageUrl.startsWith('data:')) {
      console.log('[agent-2.2b] Reference image is already a data URI');
      return imageUrl;
    }

    // If it's a public URL (https://), use it directly - Runware accepts public URLs
    if (imageUrl.startsWith('https://')) {
      console.log('[agent-2.2b] Reference image is a public URL, using directly:', {
        url: imageUrl.substring(0, 80) + '...',
      });
      return imageUrl; // Runware can fetch public URLs directly - no conversion needed
    }

    // Only convert if it's not a public URL (e.g., blob URL, http://, or other)
    // This shouldn't happen if frontend uploads to Bunny CDN first, but handle it as fallback
    console.warn('[agent-2.2b] Reference image is not a public URL, converting to data URI...', {
      url: imageUrl.substring(0, 80) + '...',
    });

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download reference image: ${response.statusText}`);
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Convert to buffer and then to base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Create data URI
    const dataUri = `data:${contentType};base64,${base64}`;

    console.log('[agent-2.2b] Reference image converted to data URI (fallback):', {
      originalUrl: imageUrl.substring(0, 80) + '...',
      contentType,
      dataUriLength: dataUri.length,
      imageSize: `${(buffer.length / 1024).toFixed(2)}KB`,
    });

    return dataUri;
  } catch (error) {
    console.error('[agent-2.2b] Failed to prepare reference image:', error);
    throw new Error(`Failed to prepare reference image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Agent 2.2b: Character Execution
 * 
 * Generates a character image using the selected image model and settings.
 * Implements different identity locking strategies for VFX consistency.
 * 
 * @param input - Execution parameters including prompt and settings
 * @param userId - User ID for credit tracking
 * @param workspaceId - Workspace ID for credit tracking
 * @returns Generated image URL and metadata
 */
export async function generateCharacterImage(
  input: CharacterExecutionInput,
  userId: string = 'system',
  workspaceId: string = 'system'
): Promise<CharacterExecutionOutput> {
  const {
    recommendation,
    referenceImageUrl,
    imageModel,
    imageResolution,
    aspectRatio,
  } = input;

  const { identity_locking, character_profile } = recommendation;
  const strategy = identity_locking.strategy;
  const vfxAnchorTags = identity_locking.vfx_anchor_tags;
  const identityId = character_profile.identity_id;

  console.log('[agent-2.2b] Starting character image generation...', {
    strategy,
    mode: recommendation.mode,
    imageModel,
    imageResolution,
    aspectRatio,
    hasReferenceImage: !!referenceImageUrl,
    anchorTagCount: vfxAnchorTags?.length || 0,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD PROMPT FROM RECOMMENDATION DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const prompt = buildImageGenerationPrompt(recommendation, imageModel);
  
  console.log('[agent-2.2b] Prompt constructed:', {
    promptLength: prompt.length,
    mode: recommendation.mode,
    preview: prompt.substring(0, 100) + '...',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATE MODEL MAPPING
  // ═══════════════════════════════════════════════════════════════════════════

  const runwareModelId = runwareModelIdMap[imageModel];
  if (!runwareModelId) {
    console.error(`[agent-2.2b] No Runware mapping for model: ${imageModel}`);
    return {
      imageUrl: '',
      error: `Unsupported image model: ${imageModel}`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET DIMENSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Character images typically use portrait aspect ratios (3:4 or 9:16)
  // But we respect whatever was set in Tab 1
  const dimensions = getImageDimensions(aspectRatio, imageResolution, imageModel);

  console.log('[agent-2.2b] Dimensions calculated:', {
    aspectRatio,
    resolution: imageResolution,
    width: dimensions.width,
    height: dimensions.height,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD PAYLOAD BASED ON STRATEGY
  // ═══════════════════════════════════════════════════════════════════════════

  // Note: VFX anchor tags are already included in the prompt from buildImageGenerationPrompt
  const payload: Record<string, unknown> = {
    taskType: 'imageInference',
    model: runwareModelId,
    positivePrompt: prompt,
    negativePrompt: CHARACTER_NEGATIVE_PROMPT,
    width: dimensions.width,
    height: dimensions.height,
    numberResults: 1,
    includeCost: true,
    outputType: 'URL',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PREPARE REFERENCE IMAGE FOR RUNWARE (if provided)
  // ═══════════════════════════════════════════════════════════════════════════
  // Runware accepts public URLs directly, so we use Bunny CDN URLs as-is
  // Only convert to data URI if it's not a public URL (fallback)
  
  let referenceImageForRunware: string | null = null;
  if (referenceImageUrl) {
    try {
      referenceImageForRunware = await prepareReferenceImageForRunware(referenceImageUrl);
    } catch (error) {
      console.error('[agent-2.2b] Failed to prepare reference image, continuing without it:', error);
      // Continue without reference image - strategy will fall back to prompt-based
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADE STRATEGY IF REFERENCE IMAGE IS PROVIDED
  // ═══════════════════════════════════════════════════════════════════════════
  // If user uploads a reference image after selecting a recommendation,
  // we should use it even if the original strategy was PROMPT_EMBEDDING
  // This handles the case: Generate recommendations → Select → Upload reference → Generate image
  
  let effectiveStrategy = strategy;
  if (referenceImageForRunware) {
    // If user provided a reference image, upgrade strategy to use it
    if (strategy === 'PROMPT_EMBEDDING') {
      // Upgrade to IP_ADAPTER_STRICT if we have reference, or COMBINED if we also have identityId
      effectiveStrategy = identityId ? 'COMBINED' : 'IP_ADAPTER_STRICT';
      console.log('[agent-2.2b] Strategy upgraded due to reference image:', {
        original: strategy,
        upgraded: effectiveStrategy,
        reason: 'User provided reference image after recommendation was generated',
        hasIdentityId: !!identityId,
      });
    } else if (strategy === 'SEED_CONSISTENCY') {
      // Upgrade to COMBINED to use both seed and reference
      effectiveStrategy = 'COMBINED';
      console.log('[agent-2.2b] Strategy upgraded due to reference image:', {
        original: strategy,
        upgraded: effectiveStrategy,
        reason: 'User provided reference image - using COMBINED for maximum consistency',
      });
    }
  }

  // Apply strategy-specific modifications (use effectiveStrategy)
  switch (effectiveStrategy) {
    case 'IP_ADAPTER_STRICT':
      if (referenceImageForRunware) {
        // Use reference image for identity preservation
        payload.referenceImages = [referenceImageForRunware];
        console.log('[agent-2.2b] Using IP_ADAPTER_STRICT with reference image', {
          format: referenceImageForRunware.startsWith('https://') ? 'public-url' : 'data-uri',
        });
      } else {
        console.warn('[agent-2.2b] IP_ADAPTER_STRICT requested but no reference image available');
      }
      break;

    case 'SEED_CONSISTENCY':
      if (identityId) {
        // Use consistent seed based on identity ID
        payload.seed = hashToSeed(identityId);
        console.log('[agent-2.2b] Using SEED_CONSISTENCY with seed:', payload.seed);
      }
      break;

    case 'COMBINED':
      // Maximum consistency: Reference image + seed + anchor tags
      if (referenceImageForRunware) {
        payload.referenceImages = [referenceImageForRunware];
      }
      if (identityId) {
        payload.seed = hashToSeed(identityId);
      }
      console.log('[agent-2.2b] Using COMBINED strategy', {
        hasReference: !!referenceImageForRunware,
        referenceFormat: referenceImageForRunware?.startsWith('https://') ? 'public-url' : 'data-uri',
        hasSeed: !!identityId,
      });
      break;

    case 'PROMPT_EMBEDDING':
    default:
      // Pure prompt-based - anchor tags already added above
      console.log('[agent-2.2b] Using PROMPT_EMBEDDING (prompt-based consistency)');
      break;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALL RUNWARE API
  // ═══════════════════════════════════════════════════════════════════════════

  try {
    console.log('[agent-2.2b] Calling Runware API...', {
      model: runwareModelId,
      promptLength: prompt.length,
    });

    const response = await callAi(
      {
        provider: 'runware',
        model: imageModel,
        task: 'image-generation',
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

    console.log('[agent-2.2b] Response received:', {
      hasData: !!data,
      hasImageURL: !!data?.imageURL,
    });

    // Try multiple possible URL fields
    const imageUrl = data?.imageURL || data?.outputURL || data?.url || data?.image;

    if (imageUrl) {
      const cost = response.usage?.totalCostUsd || data?.cost;
      
      console.log('[agent-2.2b] Character image generated successfully:', {
        imageUrl: imageUrl.substring(0, 80) + '...',
        cost,
      });

      return {
        imageUrl,
        cost,
      };
    }

    console.error('[agent-2.2b] No image URL in response:', data);
    return {
      imageUrl: '',
      error: 'No image URL in response from Runware',
    };

  } catch (error) {
    console.error('[agent-2.2b] Character image generation failed:', error);
    return {
      imageUrl: '',
      error: error instanceof Error ? error.message : 'Image generation failed',
    };
  }
}

