// ═══════════════════════════════════════════════════════════════════════════
// Agent 4.2: Storyboard Image Generator (Character Vlog Mode)
// ═══════════════════════════════════════════════════════════════════════════
// Generates storyboard frame images using prompts from Agent 4.1
// Supports both image-reference mode (1F) and start-end mode (2F)
// Uses reference images for visual consistency (characters, locations, style, previous frames)
// Handles continuity groups and shared frame optimization

import { callAi } from "../../../../ai/service";
import { getRunwareModelId } from "../../../../ai/config";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StoryboardImageInput {
  shotId: string;
  videoId: string;
  narrativeMode: "image-reference" | "start-end";
  imagePrompt: string | null; // For 1F mode
  startFramePrompt: string | null; // For 2F mode (null if inherited)
  endFramePrompt: string | null; // For 2F mode
  referenceImages: string[]; // Character + location + style refs
  aspectRatio: string;
  imageModel: string;
  frame: "start" | "end" | "image"; // Which frame to generate
  // Continuity info
  isConnectedToPrevious?: boolean;
  previousEndFrameUrl?: string | null;
  // Shared frame optimization
  nextShotId?: string | null; // If generating end frame and next is continuous
  nextShotStartPrompt?: string | null; // To compare with current end prompt
  isSharedFrame?: boolean; // Flag to indicate this frame will be shared
}

export interface StoryboardImageOutput {
  imageUrl: string | null; // For 1F mode
  startFrameUrl: string | null; // For 2F mode
  endFrameUrl: string | null; // For 2F mode
  shotVersionId: string;
  cost?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

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
  referenceImages: string[],
  width: number,
  height: number,
  model: string,
  userId?: string,
  workspaceId?: string
): Promise<{ imageUrl: string; cost?: number }> {
  // Get Runware model ID from friendly name
  const runwareModelId = getRunwareModelId(model);
  
  // Log model mapping for debugging
  if (runwareModelId !== model) {
    console.log(`[character-vlog:agent-4.2] Model mapping: ${model} → ${runwareModelId}`);
  } else {
    console.warn(`[character-vlog:agent-4.2] Model "${model}" not found in mapping, using as-is (may be AIR ID)`);
  }

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
 * Agent 4.2: Storyboard Image Generator (Character Vlog Mode)
 * 
 * Generates images based on prompts from Agent 4.1:
 * - Image-reference mode (1F): Single image per shot
 * - Start-end mode (2F): Start and/or end frames for seamless transitions
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
    referenceImages,
    aspectRatio,
    imageModel,
    frame,
  } = input;

  // Get dimensions for aspect ratio
  const dimensions = getDimensions(aspectRatio);

  // Generate a version ID (will be created/updated by the API endpoint)
  const shotVersionId = `version-${shotId}-${Date.now()}`;

  try {
    console.log("[character-vlog:agent-4.2] Starting image generation:", {
      shotId,
      videoId,
      narrativeMode,
      frame,
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

    if (narrativeMode === "image-reference") {
      // Generate single image for 1F mode
      if (frame !== "image") {
        return {
          imageUrl: null,
          startFrameUrl: null,
          endFrameUrl: null,
          shotVersionId,
          error: `Frame type mismatch: requested "${frame}" but narrative mode is "image-reference" (requires "image")`,
        };
      }

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
      // Start-end mode (2F): generate start and/or end frames
      let startFrameUrl: string | null = null;
      let endFrameUrl: string | null = null;
      let totalCost = 0;

      // Generate start frame if requested
      if (frame === "start") {
        if (!startFramePrompt || startFramePrompt.trim() === "") {
          return {
            imageUrl: null,
            startFrameUrl: null,
            endFrameUrl: null,
            shotVersionId,
            error: "Start frame prompt is required but not found",
          };
        }

        const startResult = await generateSingleImage(
          startFramePrompt,
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

      // Generate end frame if requested
      if (frame === "end") {
        if (!endFramePrompt || endFramePrompt.trim() === "") {
          return {
            imageUrl: null,
            startFrameUrl: null,
            endFrameUrl: null,
            shotVersionId,
            error: "End frame prompt is required but not found",
          };
        }

        // For end frame, include start frame as reference if it exists (for continuity)
        const endReferenceImages = startFrameUrl
          ? [...referenceImages, startFrameUrl]
          : referenceImages;

        const endResult = await generateSingleImage(
          endFramePrompt,
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

      // Validate that at least one frame was generated
      if (frame === "start" && !startFrameUrl) {
        return {
          imageUrl: null,
          startFrameUrl: null,
          endFrameUrl: null,
          shotVersionId,
          error: "Failed to generate start frame",
        };
      }

      if (frame === "end" && !endFrameUrl) {
        return {
          imageUrl: null,
          startFrameUrl: null,
          endFrameUrl: null,
          shotVersionId,
          error: "Failed to generate end frame",
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
    console.error("[character-vlog:agent-4.2] Generation failed:", error);
    return {
      imageUrl: null,
      startFrameUrl: null,
      endFrameUrl: null,
      shotVersionId,
      error: error instanceof Error ? error.message : "Storyboard image generation failed",
    };
  }
}
