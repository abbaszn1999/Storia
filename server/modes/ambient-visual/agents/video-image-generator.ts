/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO IMAGE GENERATOR - AGENT 4.2
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates keyframe images for shots using Runware AI.
 * 
 * FEATURES:
 * - Handles both animation modes (image-transitions, video-animation)
 * - Supports continuity inheritance (subsequent shots inherit start from previous end)
 * - Uses reference images for visual consistency (end frame references start frame)
 * - Batch processing with chunking for large shot counts
 * - Robust error handling with retries
 * 
 * KEY PRINCIPLE:
 * Every END frame uses the START frame as a reference for visual consistency.
 * 
 * GENERATION LOGIC:
 * - Image Transitions: Generate single image from imagePrompt
 * - Video Animation (standalone/first): Generate START, then END using START as reference
 * - Video Animation (continuity subsequent): Inherit START, generate END using inherited START
 */

import { randomUUID } from "crypto";
import { callAi } from "../../../ai/service";
import { getRunwareModelId } from "../../../ai/config";
import { getImageDimensions, IMAGE_MODEL_CONFIGS } from "../../../ai/config/image-models";
import type {
  VideoImageGeneratorInput,
  VideoImageGeneratorOutput,
  AnimationMode,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** Maximum images per batch request (prevents API overload) */
  MAX_BATCH_SIZE: 10,
  
  /** Maximum retry attempts for failed images */
  MAX_RETRIES: 2,
  
  /** Delay between retry attempts (ms) */
  RETRY_DELAY_MS: 1000,
  
  /** Timeout for batch request (ms) */
  BATCH_TIMEOUT_MS: 180000, // 3 minutes (longer for reference image processing)
  
  /** Delay between sequential operations (ms) */
  SEQUENTIAL_DELAY_MS: 500,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build Runware payload for a single image
 */
function buildImagePayload(
  prompt: string,
  options: {
    runwareModelId: string;
    dimensions: { width: number; height: number };
    referenceImageUrl?: string; // Optional reference image for style/content consistency
    taskLabel?: string; // For logging
  }
): Record<string, any> {
  const { runwareModelId, dimensions, referenceImageUrl, taskLabel } = options;
  
  const modelConfig = Object.values(IMAGE_MODEL_CONFIGS).find(m => m.model === runwareModelId);
  const supportsReference = modelConfig?.supportsStyleReference ?? false;

  const payload: Record<string, any> = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model: runwareModelId,
    positivePrompt: prompt,
    width: dimensions.width,
    height: dimensions.height,
    numberResults: 1,
    includeCost: true,
    outputType: "URL",
  };

  // Add reference image if provided and model supports it
  if (referenceImageUrl && supportsReference) {
    payload.referenceImages = [referenceImageUrl];
    console.log(`[video-image-generator] Using reference image for ${taskLabel || 'generation'}:`, 
      referenceImageUrl.substring(0, 50) + '...');
  } else if (referenceImageUrl && !supportsReference) {
    console.log(`[video-image-generator] Model ${runwareModelId} does not support reference images, skipping`);
  }

  return payload;
}

/**
 * Process a single image generation request
 */
async function generateSingleImage(
  prompt: string,
  options: {
    runwareModelId: string;
    dimensions: { width: number; height: number };
    imageModel: string;
    userId: string;
    workspaceId?: string;
    referenceImageUrl?: string;
    taskLabel?: string;
  }
): Promise<{ imageUrl: string; cost: number; error?: string }> {
  const { runwareModelId, dimensions, imageModel, userId, workspaceId, referenceImageUrl, taskLabel } = options;
  
  console.log(`[video-image-generator] Generating ${taskLabel || 'image'}...`);
  
  try {
    const payload = buildImagePayload(prompt, {
      runwareModelId,
      dimensions,
      referenceImageUrl,
      taskLabel,
    });

    const response = await callAi(
      {
        provider: "runware",
        model: imageModel,
        task: "image-generation",
        payload: [payload],
        userId,
        workspaceId,
        runware: {
          timeoutMs: CONFIG.BATCH_TIMEOUT_MS,
        },
      },
      {
        skipCreditCheck: false,
      }
    );

    const outputData = response.output as any[];
    const data = outputData[0];

    if (data?.imageURL) {
      console.log(`[video-image-generator] ${taskLabel || 'Image'} generated successfully ✓`);
      return {
        imageUrl: data.imageURL,
        cost: data.cost || 0,
      };
    } else {
      const errorMsg = data?.error || "No image URL in response";
      console.error(`[video-image-generator] ${taskLabel || 'Image'} generation failed:`, errorMsg);
      return {
        imageUrl: "",
        cost: 0,
        error: errorMsg,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[video-image-generator] ${taskLabel || 'Image'} generation error:`, errorMessage);
    return {
      imageUrl: "",
      cost: 0,
      error: errorMessage,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate images for a single shot
 * 
 * @param input - Shot details and prompts
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated image URLs and metadata
 */
export async function generateShotImages(
  input: VideoImageGeneratorInput,
  userId: string,
  workspaceId?: string
): Promise<VideoImageGeneratorOutput> {
  const {
    shotId,
    shotNumber,
    sceneId,
    imagePrompt,
    startFramePrompt,
    endFramePrompt,
    animationMode,
    imageModel,
    aspectRatio,
    imageResolution,
    isFirstInGroup,
    isConnectedShot,
    previousShotEndFrameUrl,
    inheritStartFrame,
    existingStartFrameUrl,  // NEW: Use existing frames if available
    existingEndFrameUrl,    // NEW: Use existing frames if available
  } = input;

  console.log("[video-image-generator] Processing shot:", {
    shotId: shotId.substring(0, 8) + '...',
    shotNumber,
    animationMode,
    videoGenerationMode: input.videoGenerationMode,
    isConnectedShot,
    isFirstInGroup,
    inheritStartFrame,
    hasStartPrompt: !!startFramePrompt,
    hasEndPrompt: !!endFramePrompt,
    hasImagePrompt: !!imagePrompt,
    hasPreviousEndUrl: !!previousShotEndFrameUrl,
    hasExistingStart: !!existingStartFrameUrl,
    hasExistingEnd: !!existingEndFrameUrl,
  });

  // Get Runware model ID
  const runwareModelId = getRunwareModelId(imageModel);
  if (!runwareModelId) {
    console.error(`[video-image-generator] No Runware mapping for model: ${imageModel}`);
    return {
      shotId,
      error: `No Runware mapping for model: ${imageModel}`,
    };
  }

  // Get dimensions for aspect ratio and resolution
  const dimensions = getImageDimensions(aspectRatio, imageResolution, imageModel);
  console.log("[video-image-generator] Using dimensions:", dimensions);

  let totalCost = 0;
  const baseOptions = {
    runwareModelId,
    dimensions,
    imageModel,
    userId,
    workspaceId,
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // IMAGE TRANSITIONS MODE: Generate single image (or use existing)
  // ─────────────────────────────────────────────────────────────────────────────
  
  if (animationMode === 'image-transitions') {
    // Check if image already exists (smart partial generation)
    if (existingStartFrameUrl) {
      console.log(`[video-image-generator] Shot ${shotNumber}: Using existing image (skipping generation)`);
      return {
        shotId,
        imageUrl: existingStartFrameUrl,
        width: dimensions.width,
        height: dimensions.height,
        cost: 0,  // No cost since we're reusing existing
      };
    }
    
    if (!imagePrompt) {
      return {
        shotId,
        error: "Missing imagePrompt for image-transitions mode",
      };
    }

    const result = await generateSingleImage(imagePrompt, {
      ...baseOptions,
      taskLabel: `Shot ${shotNumber} image`,
    });

    totalCost += result.cost;

    if (result.error) {
      return {
        shotId,
        error: result.error,
        cost: totalCost,
      };
    }

    return {
      shotId,
      imageUrl: result.imageUrl,
      width: dimensions.width,
      height: dimensions.height,
      cost: totalCost,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIDEO ANIMATION MODE: Check if image-reference or start-end-frame
  // ─────────────────────────────────────────────────────────────────────────────

  const isImageReference = animationMode === 'video-animation' && 
                           input.videoGenerationMode === 'image-reference';
  const isStartEndFrame = animationMode === 'video-animation' && 
                          input.videoGenerationMode === 'start-end-frame';

  // ─────────────────────────────────────────────────────────────────────────────
  // IMAGE-REFERENCE MODE: Generate single start frame only (no end frame)
  // ─────────────────────────────────────────────────────────────────────────────

  if (isImageReference) {
    // Check if image already exists (smart partial generation)
    if (existingStartFrameUrl) {
      console.log(`[video-image-generator] Shot ${shotNumber}: Using existing start frame (skipping generation)`);
      return {
        shotId,
        startFrameUrl: existingStartFrameUrl,
        imageUrl: existingStartFrameUrl,  // Also set imageUrl for compatibility
        // No endFrameUrl for image-reference mode
        width: dimensions.width,
        height: dimensions.height,
        cost: 0,  // No cost since we're reusing existing
      };
    }

    if (!startFramePrompt) {
      return {
        shotId,
        error: "Missing startFramePrompt for image-reference mode",
      };
    }

    const result = await generateSingleImage(startFramePrompt, {
      ...baseOptions,
      taskLabel: `Shot ${shotNumber} start frame (image-reference)`,
    });

    if (result.error) {
      return {
        shotId,
        error: result.error,
        cost: result.cost,
      };
    }

    console.log(`[video-image-generator] Shot ${shotNumber}: Start frame generated (image-reference mode)`);

    return {
      shotId,
      startFrameUrl: result.imageUrl,
      imageUrl: result.imageUrl,  // Also set imageUrl for compatibility (some UI code may check for it)
      // No endFrameUrl for image-reference mode
      width: dimensions.width,
      height: dimensions.height,
      cost: result.cost,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // START-END FRAME MODE: Generate start and end frames (or use existing)
  // ─────────────────────────────────────────────────────────────────────────────

  if (isStartEndFrame) {
    let startFrameUrl: string | undefined;
    let endFrameUrl: string | undefined;
    let startFrameInherited = false;

    // Step 1: Get or generate START frame
    if (existingStartFrameUrl) {
      // Use existing START frame (smart partial generation)
      console.log(`[video-image-generator] Shot ${shotNumber}: Using existing start frame (skipping generation)`);
      startFrameUrl = existingStartFrameUrl;
    } else if (inheritStartFrame && previousShotEndFrameUrl) {
      // Inherit START from previous shot's END
      console.log(`[video-image-generator] Shot ${shotNumber}: Inheriting start frame from previous shot`);
      startFrameUrl = previousShotEndFrameUrl;
      startFrameInherited = true;
    } else if (startFramePrompt) {
      // Generate START frame
      const startResult = await generateSingleImage(startFramePrompt, {
        ...baseOptions,
        taskLabel: `Shot ${shotNumber} START frame`,
      });

      totalCost += startResult.cost;

      if (startResult.error) {
        return {
          shotId,
          error: `Start frame generation failed: ${startResult.error}`,
          cost: totalCost,
        };
      }

      startFrameUrl = startResult.imageUrl;
      console.log(`[video-image-generator] Shot ${shotNumber}: Start frame generated`);
    } else {
      return {
        shotId,
        error: "Missing startFramePrompt for start-end-frame mode",
      };
    }

    // Small delay between generations (only if we generated start frame)
    if (!existingStartFrameUrl && !inheritStartFrame) {
      await sleep(CONFIG.SEQUENTIAL_DELAY_MS);
    }

    // Step 2: Generate END frame using START frame as reference (or use existing)
    if (existingEndFrameUrl) {
      // Use existing END frame (smart partial generation)
      console.log(`[video-image-generator] Shot ${shotNumber}: Using existing end frame (skipping generation)`);
      endFrameUrl = existingEndFrameUrl;
    } else if (endFramePrompt) {
      const endResult = await generateSingleImage(endFramePrompt, {
        ...baseOptions,
        referenceImageUrl: startFrameUrl, // Use start frame as reference for visual consistency
        taskLabel: `Shot ${shotNumber} END frame`,
      });

      totalCost += endResult.cost;

      if (endResult.error) {
        return {
          shotId,
          startFrameUrl, // Return start even if end failed
          startFrameInherited,
          error: `End frame generation failed: ${endResult.error}`,
          cost: totalCost,
        };
      }

      endFrameUrl = endResult.imageUrl;
      console.log(`[video-image-generator] Shot ${shotNumber}: End frame generated`);
    } else {
      return {
        shotId,
        startFrameUrl,
        startFrameInherited,
        error: "Missing endFramePrompt for start-end-frame mode",
        cost: totalCost,
      };
    }

    console.log(`[video-image-generator] Shot ${shotNumber}: Complete ✓`, {
      startFrameInherited,
      hasStartFrame: !!startFrameUrl,
      hasEndFrame: !!endFrameUrl,
      totalCost,
    });

    return {
      shotId,
      startFrameUrl,
      endFrameUrl,
      startFrameInherited,
      width: dimensions.width,
      height: dimensions.height,
      cost: totalCost,
    };
  }

  // Fallback: If neither image-reference nor start-end-frame, return error
  return {
    shotId,
    error: `Unsupported video generation mode: ${input.videoGenerationMode}`,
  };
}

/**
 * Retry failed shot image generation
 */
export async function retryShotImages(
  input: VideoImageGeneratorInput,
  userId: string,
  workspaceId?: string,
  retryCount: number = 0
): Promise<VideoImageGeneratorOutput> {
  if (retryCount >= CONFIG.MAX_RETRIES) {
    return {
      shotId: input.shotId,
      error: `Max retries (${CONFIG.MAX_RETRIES}) exceeded`,
    };
  }

  console.log(`[video-image-generator] Retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} for shot ${input.shotNumber}`);
  await sleep(CONFIG.RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff

  const result = await generateShotImages(input, userId, workspaceId);

  if (result.error && retryCount < CONFIG.MAX_RETRIES - 1) {
    return retryShotImages(input, userId, workspaceId, retryCount + 1);
  }

  return result;
}

