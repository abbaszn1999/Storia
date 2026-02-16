// ═══════════════════════════════════════════════════════════════════════════
// Agent 4.2: Storyboard Image Generator
// ═══════════════════════════════════════════════════════════════════════════
// Generates storyboard frame images using prompts from Agent 4.1
// Supports both image-reference mode (single image) and start-end mode (paired keyframes)
// Uses reference images for visual consistency (characters, locations, style, previous frames)

import { callAi } from "../../../ai/service";
import { getRunwareModelId } from "../../../ai/config";
import { IMAGE_MODEL_CONFIGS, getImageDimensions } from "../../../ai/config/image-models";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StoryboardImageInput {
  shotId: string;
  videoId: string;
  narrativeMode: "image-reference" | "start-end" | "auto";
  imagePrompt: string; // For image-reference mode
  startFramePrompt: string; // For start-end mode
  endFramePrompt: string | null; // For start-end mode, null if start-only
  negativePrompt?: string; // For image-reference mode
  // Per-frame advanced settings (for start-end mode)
  startFrameNegativePrompt?: string;
  endFrameNegativePrompt?: string;
  startFrameSeed?: number;
  endFrameSeed?: number;
  startFrameGuidanceScale?: number;
  endFrameGuidanceScale?: number;
  startFrameSteps?: number;
  endFrameSteps?: number;
  startFrameStrength?: number;
  endFrameStrength?: number;
  referenceImages: string[]; // Character + location + style refs + previous frame if in continuity group
  aspectRatio: string; // From step1Data (e.g., "16:9", "9:16", "1:1")
  imageModel: string; // From shot/scene settings (e.g., "flux-2-dev", "nano-banana")
  frameType?: "start-only" | "end-only" | "start-and-end"; // For start-end mode
}

export interface StoryboardImageOutput {
  imageUrl: string | null; // For image-reference mode
  startFrameUrl: string | null; // For start-end mode
  endFrameUrl: string | null; // For start-end mode
  shotVersionId: string;
  cost?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Default negative prompt for storyboard images
const DEFAULT_STORYBOARD_NEGATIVE_PROMPT = 
  "blurry, low quality, distorted, extra limbs, watermark, text, " +
  "cropped, out of frame, bad anatomy, deformed, disfigured, " +
  "mutated, ugly, duplicate, morbid, mutilated, oversaturated, " +
  "underexposed, overexposed, bad lighting, inconsistent style";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get dimensions for aspect ratio and image model
 * Uses model-specific dimensions when available (e.g., SeaDream 4.5 requires minimum 2560×1440 for 16:9)
 */
function getDimensions(aspectRatio: string, imageModel: string): { width: number; height: number } {
  // Check if model has specific dimension requirements
  const modelConfig = IMAGE_MODEL_CONFIGS[imageModel];
  
  if (modelConfig) {
    // For SeaDream 4.5, use 2K resolution (minimum required)
    // SeaDream 4.5 requires minimum 3,686,400 pixels (2560×1440)
    if (imageModel === "seedream-4.5") {
      return getImageDimensions(aspectRatio, "2k", imageModel);
    }
    
    // For SeaDream 4.0, default to 2K if available, fallback to 1K
    if (imageModel === "seedream-4.0") {
      // Try 2K first (preferred for quality), fallback to 1K
      const dims2k = getImageDimensions(aspectRatio, "2k", imageModel);
      // Verify we got valid 2K dimensions (should be >= 1024×1024)
      if (dims2k && dims2k.width > 0 && dims2k.height > 0 && dims2k.width * dims2k.height >= 1024 * 1024) {
        return dims2k;
      }
      return getImageDimensions(aspectRatio, "1k", imageModel);
    }
    
    // For other models with model-specific dimensions, use the first available resolution
    if (modelConfig.resolutions && modelConfig.resolutions.length > 0) {
      const resolution = modelConfig.resolutions[0];
      const modelDims = getImageDimensions(aspectRatio, resolution, imageModel);
      // Verify we got valid dimensions
      if (modelDims && modelDims.width > 0 && modelDims.height > 0) {
        return modelDims;
      }
    }
  }
  
  // Fallback to standard dimensions for other models
  // Default to 1k resolution which works for most models
  return getImageDimensions(aspectRatio, "1k", imageModel);
}

/**
 * Generate a single image using Runware API
 */
async function generateSingleImage(
  prompt: string,
  negativePrompt: string,
  referenceImages: string[],
  width: number,
  height: number,
  model: string,
  userId?: string,
  workspaceId?: string,
  advancedSettings?: {
    seed?: number;
    guidanceScale?: number;
    steps?: number;
    strength?: number;
  },
  usageType?: string,
  usageMode?: string
): Promise<{ imageUrl: string; cost?: number }> {
  // Get Runware model ID from friendly name
  // Use getRunwareModelId() which handles mapping and fallback
  const runwareModelId = getRunwareModelId(model);
  
  // Log model mapping for debugging
  if (runwareModelId !== model) {
    console.log(`[agent-4.2:storyboard-image] Model mapping: ${model} → ${runwareModelId}`);
  } else {
    console.warn(`[agent-4.2:storyboard-image] Model "${model}" not found in mapping, using as-is (may be AIR ID)`);
  }

  // Get model config to check capabilities
  const modelConfig = IMAGE_MODEL_CONFIGS[model];
  const supportsNegativePrompt = modelConfig?.supportsNegativePrompt ?? false;

  // Build the payload
  const payload: Record<string, any> = {
    taskType: "imageInference",
    model: runwareModelId,
    positivePrompt: prompt,
    width,
    height,
    numberResults: 1,
    includeCost: true,
  };

  // Only include negativePrompt if the model supports it
  if (supportsNegativePrompt && negativePrompt) {
    payload.negativePrompt = negativePrompt;
  } else if (negativePrompt && !supportsNegativePrompt) {
    console.log(`[agent-4.2:storyboard-image] Model "${model}" does not support negativePrompt, omitting it`);
  }

  // Add advanced settings if provided
  if (advancedSettings) {
    if (advancedSettings.seed !== undefined) {
      payload.seed = advancedSettings.seed;
    }
    if (advancedSettings.guidanceScale !== undefined) {
      payload.guidanceScale = advancedSettings.guidanceScale;
    }
    if (advancedSettings.steps !== undefined) {
      payload.steps = advancedSettings.steps;
    }
    if (advancedSettings.strength !== undefined) {
      payload.strength = advancedSettings.strength;
    }
  }

  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    payload.referenceImages = referenceImages;
  }

  const response = await callAi(
    {
      provider: "runware",
      model,
      task: "image-generation",
      payload,
      userId,
      workspaceId,
    },
    {
      skipCreditCheck: false,
      metadata: { usageType, usageMode },
    }
  );

  // Extract image URL from response
  const results = response.output as any[];
  const data = Array.isArray(results) ? results[0] : results;

  const imageUrl = data?.imageURL || data?.outputURL || data?.url || data?.image;
  
  if (!imageUrl) {
    throw new Error("No image URL in response");
  }

  return {
    imageUrl,
    cost: response.usage?.totalCostUsd || data?.cost,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate storyboard frame images
 * 
 * Agent 4.2: Storyboard Image Generator
 * 
 * Generates images based on prompts from Agent 4.1:
 * - Image-reference mode: Single image per shot
 * - Start-end mode: Paired keyframes (start and/or end) for seamless transitions
 * 
 * Supports continuity groups by including previous shot's frame as reference
 * 
 * @param input - Shot details, prompts, and generation settings
 * @param userId - User ID for billing/tracking
 * @param workspaceId - Workspace ID for billing/tracking
 * @returns Generated image URLs and version ID
 */
export async function generateStoryboardImage(
  input: StoryboardImageInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<StoryboardImageOutput> {
  const {
    shotId,
    videoId,
    narrativeMode,
    imagePrompt,
    startFramePrompt,
    endFramePrompt,
    negativePrompt,
    startFrameNegativePrompt,
    endFrameNegativePrompt,
    startFrameSeed,
    endFrameSeed,
    startFrameGuidanceScale,
    endFrameGuidanceScale,
    startFrameSteps,
    endFrameSteps,
    startFrameStrength,
    endFrameStrength,
    referenceImages,
    aspectRatio,
    imageModel,
    frameType,
  } = input;

  // Determine effective mode
  const effectiveMode = narrativeMode === "auto"
    ? (frameType ? "start-end" : "image-reference")
    : narrativeMode;

  // Get dimensions for aspect ratio and image model
  // This ensures model-specific requirements are met (e.g., SeaDream 4.5 minimum 2560×1440)
  const dimensions = getDimensions(aspectRatio, imageModel);

  // Use provided negative prompt or default
  const finalNegativePrompt = negativePrompt || DEFAULT_STORYBOARD_NEGATIVE_PROMPT;

  // Generate a version ID (will be created/updated by the API endpoint)
  const shotVersionId = `version-${shotId}-${Date.now()}`;

  try {
    console.log("[agent-4.2:storyboard-image] Starting image generation:", {
      shotId,
      videoId,
      effectiveMode,
      frameType,
      model: imageModel,
      aspectRatio,
      dimensions,
      referenceCount: referenceImages.length,
      hasImagePrompt: !!imagePrompt,
      hasStartFrame: !!startFramePrompt,
      hasEndFrame: !!endFramePrompt,
      userId,
      workspaceId,
    });

    if (effectiveMode === "image-reference") {
      // Generate single image
      if (!imagePrompt || imagePrompt.trim() === "") {
        return {
          imageUrl: null,
          startFrameUrl: null,
          endFrameUrl: null,
          shotVersionId,
          error: "Image prompt is required for image-reference mode",
        };
      }

      const result = await generateSingleImage(
        imagePrompt,
        finalNegativePrompt,
        referenceImages,
        dimensions.width,
        dimensions.height,
        imageModel,
        userId,
        workspaceId,
        undefined,
        usageType,
        usageMode
      );

      return {
        imageUrl: result.imageUrl,
        startFrameUrl: null,
        endFrameUrl: null,
        shotVersionId,
        cost: result.cost,
      };
    } else {
      // Start-end mode: generate start and/or end frames
      let startFrameUrl: string | null = null;
      let endFrameUrl: string | null = null;
      let totalCost = 0;

      // Generate start frame if needed
      if ((frameType === "start-and-end" || frameType === "start-only") && startFramePrompt && startFramePrompt.trim() !== "") {
        // Use start frame specific negative prompt if provided, otherwise fall back to default
        const startNegativePrompt = startFrameNegativePrompt || finalNegativePrompt;
        const startAdvancedSettings = {
          seed: startFrameSeed,
          guidanceScale: startFrameGuidanceScale,
          steps: startFrameSteps,
          strength: startFrameStrength,
        };
        
        const startResult = await generateSingleImage(
          startFramePrompt,
          startNegativePrompt,
          referenceImages,
          dimensions.width,
          dimensions.height,
          imageModel,
          userId,
          workspaceId,
          startAdvancedSettings,
          usageType,
          usageMode
        );
        startFrameUrl = startResult.imageUrl;
        totalCost += startResult.cost || 0;
      }

      // Generate end frame if needed
      if ((frameType === "start-and-end" || frameType === "end-only") && endFramePrompt && endFramePrompt.trim() !== "") {
        // For end frame, include start frame as reference if it exists (for continuity)
        const endReferenceImages = startFrameUrl
          ? [...referenceImages, startFrameUrl]
          : referenceImages;
        
        // Use end frame specific negative prompt if provided, otherwise fall back to default
        const endNegativePrompt = endFrameNegativePrompt || finalNegativePrompt;
        const endAdvancedSettings = {
          seed: endFrameSeed,
          guidanceScale: endFrameGuidanceScale,
          steps: endFrameSteps,
          strength: endFrameStrength,
        };

        const endResult = await generateSingleImage(
          endFramePrompt,
          endNegativePrompt,
          endReferenceImages,
          dimensions.width,
          dimensions.height,
          imageModel,
          userId,
          workspaceId,
          endAdvancedSettings,
          usageType,
          usageMode
        );
        endFrameUrl = endResult.imageUrl;
        totalCost += endResult.cost || 0;
      }

      if (!startFrameUrl && !endFrameUrl) {
        return {
          imageUrl: null,
          startFrameUrl: null,
          endFrameUrl: null,
          shotVersionId,
          error: "At least one frame (start or end) is required for start-end mode",
        };
      }

      return {
        imageUrl: null,
        startFrameUrl,
        endFrameUrl,
        shotVersionId,
        cost: totalCost > 0 ? totalCost : undefined,
      };
    }
  } catch (error) {
    console.error("[agent-4.2:storyboard-image] Generation failed:", error);
    return {
      imageUrl: null,
      startFrameUrl: null,
      endFrameUrl: null,
      shotVersionId,
      error: error instanceof Error ? error.message : "Storyboard image generation failed",
    };
  }
}

