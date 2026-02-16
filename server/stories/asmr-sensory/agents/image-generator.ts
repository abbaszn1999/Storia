// ═══════════════════════════════════════════════════════════════════════════
// ASMR Image Generation Agent
// ═══════════════════════════════════════════════════════════════════════════
// Creates high-quality ASMR reference images using Runware Nano Banana
// These images can be used as first frame for video generation (I2V)

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";
import { buildImagePrompt, ASMR_IMAGE_NEGATIVE_PROMPT } from "../prompts/image-prompts";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ImageGenerationInput {
  prompt: string;              // User's visual prompt
  aspectRatio?: string;        // 16:9, 9:16, 1:1
}

export interface ImageGenerationOutput {
  imageUrl: string;            // Generated image URL
  cost?: number;               // API cost in USD
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const IMAGE_MODEL_CONFIG = {
  model: "nano-banana",        // Gemini Flash Image 2.5 - Fast, cost-effective
  // Nano Banana supported dimensions (from Runware docs)
  dimensions: {
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
  } as Record<string, { width: number; height: number }>,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate an ASMR-style reference image
 * 
 * This agent creates visually satisfying images optimized for:
 * - Close-up textures and details
 * - Soft, pleasing lighting
 * - ASMR aesthetic (calming, tactile, sensory)
 * 
 * @param input - User prompt and settings
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated image URL
 */
export async function generateImage(
  input: ImageGenerationInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<ImageGenerationOutput> {
  const { prompt, aspectRatio = "16:9" } = input;

  // Get dimensions for aspect ratio
  const dimensions = IMAGE_MODEL_CONFIG.dimensions[aspectRatio] 
    || IMAGE_MODEL_CONFIG.dimensions["16:9"];

  // Build enhanced prompt for ASMR aesthetic (independent of categories)
  const enhancedPrompt = buildImagePrompt(prompt);

  // Get Runware model ID
  const runwareModelId = runwareModelIdMap[IMAGE_MODEL_CONFIG.model];
  if (!runwareModelId) {
    return {
      imageUrl: "",
      error: `No Runware mapping for model: ${IMAGE_MODEL_CONFIG.model}`,
    };
  }

  try {
    console.log("[asmr-image-generator] Starting image generation:", {
      model: IMAGE_MODEL_CONFIG.model,
      dimensions,
      promptLength: enhancedPrompt.length,
    });

    const response = await callAi(
      {
        provider: "runware",
        model: IMAGE_MODEL_CONFIG.model,
        task: "image-generation",
        payload: {
          taskType: "imageInference",
          model: runwareModelId,
          positivePrompt: enhancedPrompt,
          negativePrompt: ASMR_IMAGE_NEGATIVE_PROMPT,
          width: dimensions.width,
          height: dimensions.height,
          numberResults: 1,
          includeCost: true,
        },
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

    console.log("[asmr-image-generator] Response received:", {
      hasData: !!data,
      imageURL: data?.imageURL,
    });

    if (data?.imageURL) {
      return {
        imageUrl: data.imageURL,
        cost: response.usage?.totalCostUsd || data.cost,
      };
    }

    // Try alternative URL fields
    const imageUrl = data?.imageURL || data?.outputURL || data?.url || data?.image;
    if (imageUrl) {
      return {
        imageUrl,
        cost: response.usage?.totalCostUsd || data?.cost,
      };
    }

    return {
      imageUrl: "",
      error: "No image URL in response",
    };
  } catch (error) {
    console.error("[asmr-image-generator] Generation failed:", error);
    return {
      imageUrl: "",
      error: error instanceof Error ? error.message : "Image generation failed",
    };
  }
}

/**
 * Get supported aspect ratios for image generation
 */
export function getSupportedAspectRatios(): string[] {
  return Object.keys(IMAGE_MODEL_CONFIG.dimensions);
}

