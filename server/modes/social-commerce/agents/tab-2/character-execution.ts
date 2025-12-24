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
import { getImageDimensions } from '../../../../ai/config';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CharacterExecutionInput {
  /** Ready-to-use prompt from Agent 2.2a recommendation */
  prompt: string;
  
  /** Identity locking strategy from recommendation */
  strategy: 'IP_ADAPTER_STRICT' | 'PROMPT_EMBEDDING' | 'SEED_CONSISTENCY' | 'COMBINED';
  
  /** VFX anchor tags to append for consistency */
  vfxAnchorTags?: string[];
  
  /** Reference image URL (for IP_ADAPTER_STRICT or COMBINED strategies) */
  referenceImageUrl?: string;
  
  /** Identity ID for seed generation (for SEED_CONSISTENCY strategy) */
  identityId?: string;
  
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
 * Enhance prompt with VFX anchor tags for consistency
 */
function enhancePromptWithAnchors(prompt: string, anchors?: string[]): string {
  if (!anchors || anchors.length === 0) return prompt;
  
  // Append anchor tags to the end of the prompt
  const anchorString = anchors.join(', ');
  return `${prompt}, ${anchorString}`;
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
    prompt,
    strategy,
    vfxAnchorTags,
    referenceImageUrl,
    identityId,
    imageModel,
    imageResolution,
    aspectRatio,
  } = input;

  console.log('[agent-2.2b] Starting character image generation...', {
    strategy,
    imageModel,
    imageResolution,
    aspectRatio,
    hasReferenceImage: !!referenceImageUrl,
    promptLength: prompt.length,
    anchorTagCount: vfxAnchorTags?.length || 0,
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

  // Enhance prompt with anchor tags for all strategies
  const enhancedPrompt = enhancePromptWithAnchors(prompt, vfxAnchorTags);

  const payload: Record<string, unknown> = {
    taskType: 'imageInference',
    model: runwareModelId,
    positivePrompt: enhancedPrompt,
    negativePrompt: CHARACTER_NEGATIVE_PROMPT,
    width: dimensions.width,
    height: dimensions.height,
    numberResults: 1,
    includeCost: true,
    outputType: 'URL',
  };

  // Apply strategy-specific modifications
  switch (strategy) {
    case 'IP_ADAPTER_STRICT':
      if (referenceImageUrl) {
        // Use reference image for identity preservation
        payload.referenceImages = [referenceImageUrl];
        console.log('[agent-2.2b] Using IP_ADAPTER_STRICT with reference image');
      } else {
        console.warn('[agent-2.2b] IP_ADAPTER_STRICT requested but no reference image provided');
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
      if (referenceImageUrl) {
        payload.referenceImages = [referenceImageUrl];
      }
      if (identityId) {
        payload.seed = hashToSeed(identityId);
      }
      console.log('[agent-2.2b] Using COMBINED strategy');
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
      promptLength: enhancedPrompt.length,
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

