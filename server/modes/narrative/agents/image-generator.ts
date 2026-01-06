// ═══════════════════════════════════════════════════════════════════════════
// Agent 4.2: Storyboard Image Generator
// ═══════════════════════════════════════════════════════════════════════════
// Generates storyboard frame images using prompts from Agent 4.1
// Supports both image-reference mode (single image) and start-end mode (paired keyframes)
// Uses reference images for visual consistency (characters, locations, style, previous frames)

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";

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
  negativePrompt?: string;
  referenceImages: string[]; // Character + location + style refs + previous frame if in continuity group
  aspectRatio: string; // From step1Data (e.g., "16:9", "9:16", "1:1")
  imageModel: string; // From shot/scene settings (e.g., "flux-2-dev", "nano-banana")
  frameType?: "start-only" | "start-and-end"; // For start-end mode
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

// Aspect ratio to dimensions mapping
// Based on common model capabilities (nano-banana, flux-2-dev, etc.)
const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1184, height: 864 },
  "3:4": { width: 864, height: 1184 },
  "3:2": { width: 1248, height: 832 },
  "2:3": { width: 832, height: 1248 },
  "5:4": { width: 1152, height: 896 },
  "4:5": { width: 896, height: 1152 },
  "21:9": { width: 1536, height: 672 },
  "9:21": { width: 672, height: 1536 },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get dimensions for aspect ratio
 */
function getDimensions(aspectRatio: string): { width: number; height: number } {
  return ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS["16:9"];
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
  workspaceId?: string
): Promise<{ imageUrl: string; cost?: number }> {
  // Get Runware model ID from friendly name
  const runwareModelId = runwareModelIdMap[model];
  if (!runwareModelId) {
    throw new Error(`No Runware mapping for model: ${model}`);
  }

  // Build the payload
  const payload: Record<string, any> = {
    taskType: "imageInference",
    model: runwareModelId,
    positivePrompt: prompt,
    negativePrompt,
    width,
    height,
    numberResults: 1,
    includeCost: true,
  };

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
  workspaceId?: string
): Promise<StoryboardImageOutput> {
  const {
    shotId,
    videoId,
    narrativeMode,
    imagePrompt,
    startFramePrompt,
    endFramePrompt,
    negativePrompt,
    referenceImages,
    aspectRatio,
    imageModel,
    frameType,
  } = input;

  // Determine effective mode
  const effectiveMode = narrativeMode === "auto"
    ? (frameType ? "start-end" : "image-reference")
    : narrativeMode;

  // Get dimensions for aspect ratio
  const dimensions = getDimensions(aspectRatio);

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
        workspaceId
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
      if (frameType === "start-and-end" && startFramePrompt && startFramePrompt.trim() !== "") {
        const startResult = await generateSingleImage(
          startFramePrompt,
          finalNegativePrompt,
          referenceImages,
          dimensions.width,
          dimensions.height,
          imageModel,
          userId,
          workspaceId
        );
        startFrameUrl = startResult.imageUrl;
        totalCost += startResult.cost || 0;
      }

      // Generate end frame if needed
      if (endFramePrompt && endFramePrompt.trim() !== "") {
        // For end frame, include start frame as reference if it exists (for continuity)
        const endReferenceImages = startFrameUrl
          ? [...referenceImages, startFrameUrl]
          : referenceImages;

        const endResult = await generateSingleImage(
          endFramePrompt,
          finalNegativePrompt,
          endReferenceImages,
          dimensions.width,
          dimensions.height,
          imageModel,
          userId,
          workspaceId
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

