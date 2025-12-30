// ═══════════════════════════════════════════════════════════════════════════
// Agent 2.4: Location Image Generator
// ═══════════════════════════════════════════════════════════════════════════
// Creates location reference images for environmental consistency
// Used by: Location Assets Library (hard-coded nano-banana)
//          Narrative Mode World & Cast (user-selectable model)

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LocationImageInput {
  name: string;                    // Location name
  description: string;             // Location description
  details?: string;                // Additional details (optional)
  artStyleDescription?: string;    // Art style from Agent 2.5 (optional)
  model?: string;                  // Image model (default: "nano-banana")
  negativePrompt?: string;         // Custom negative prompt (optional)
  referenceImages?: string[];      // URLs for location consistency (optional)
  styleReferenceImage?: string;    // Style reference image URL (optional)
}

export interface LocationImageOutput {
  imageUrl: string;                // Generated image URL
  cost?: number;                   // API cost in USD
  error?: string;                  // Error message if failed
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_MODEL = "nano-banana";

// Location images use 16:9 landscape (1344x768)
// Note: nano-banana model supports specific dimensions only
// Supported 16:9 ratio: 1344x768 (closest to 1920x1080)
const LOCATION_DIMENSIONS = {
  width: 1344,
  height: 768,
};

// Default negative prompt for location images (configurable per request)
export const DEFAULT_LOCATION_NEGATIVE_PROMPT = 
  "blurry, low quality, distorted, watermark, text, logo, " +
  "people, characters, humans, animals, cropped, out of frame, " +
  "bad composition, oversaturated, low resolution, pixelated";

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the location image prompt
 */
function buildLocationPrompt(input: LocationImageInput): string {
  const { name, description, details, artStyleDescription } = input;

  // Base prompt structure
  let prompt = `Environmental reference image of ${name}, ${description}.`;

  // Add details if provided
  if (details && details.trim()) {
    prompt += `\nDetails: ${details}.`;
  }

  // Add art style if provided (from Agent 2.5)
  if (artStyleDescription && artStyleDescription.trim()) {
    prompt += `\n${artStyleDescription}`;
  }

  // Add the standard location composition guidelines
  prompt += `\nWide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a location reference image
 * 
 * Agent 2.4: Location Image Generator
 * 
 * Creates a consistent location reference image using:
 * - 16:9 landscape aspect ratio (1344x768)
 * - Wide establishing shot composition
 * - Atmospheric lighting matching the setting
 * - Optional reference images for consistency
 * 
 * @param input - Location details and generation settings
 * @param userId - User ID for billing/tracking
 * @param workspaceId - Workspace ID for billing/tracking
 * @returns Generated image URL or error
 */
export async function generateLocationImage(
  input: LocationImageInput,
  userId?: string,
  workspaceId?: string
): Promise<LocationImageOutput> {
  const {
    model = DEFAULT_MODEL,
    negativePrompt,
    referenceImages,
    styleReferenceImage,
  } = input;

  // Build the location prompt
  const positivePrompt = buildLocationPrompt(input);

  // Use provided negative prompt or default
  const finalNegativePrompt = negativePrompt ?? DEFAULT_LOCATION_NEGATIVE_PROMPT;

  // Get Runware model ID from friendly name
  const runwareModelId = runwareModelIdMap[model];
  if (!runwareModelId) {
    return {
      imageUrl: "",
      error: `No Runware mapping for model: ${model}`,
    };
  }

  try {
    console.log("[agent-2.4:location-image] Starting image generation:", {
      model,
      runwareModelId,
      locationName: input.name,
      promptLength: positivePrompt.length,
      hasReferenceImages: referenceImages && referenceImages.length > 0,
      referenceCount: referenceImages?.length || 0,
      hasStyleReference: !!styleReferenceImage,
    });

    // Build the payload
    const payload: Record<string, any> = {
      taskType: "imageInference",
      model: runwareModelId,
      positivePrompt,
      negativePrompt: finalNegativePrompt,
      width: LOCATION_DIMENSIONS.width,
      height: LOCATION_DIMENSIONS.height,
      numberResults: 1,
      includeCost: true,
    };

    // Add reference images if provided (for location consistency)
    // Runware expects referenceImages as an array of URL strings (not objects)
    const allReferenceUrls: string[] = [];
    
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((url) => {
        allReferenceUrls.push(url);
      });
      console.log("[agent-2.4:location-image] Added location reference images:", {
        count: referenceImages.length,
      });
    }

    // Add style reference image (same format - Runware doesn't support per-image weights)
    if (styleReferenceImage) {
      allReferenceUrls.push(styleReferenceImage);
      console.log("[agent-2.4:location-image] Added style reference image");
    }

    if (allReferenceUrls.length > 0) {
      payload.referenceImages = allReferenceUrls;
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

    console.log("[agent-2.4:location-image] Response received:", {
      hasData: !!data,
      imageURL: data?.imageURL ? "present" : "missing",
      cost: response.usage?.totalCostUsd || data?.cost,
    });

    // Try to extract image URL from various response formats
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
    console.error("[agent-2.4:location-image] Generation failed:", error);
    return {
      imageUrl: "",
      error: error instanceof Error ? error.message : "Location image generation failed",
    };
  }
}

/**
 * Get the default model for location image generation
 */
export function getDefaultLocationImageModel(): string {
  return DEFAULT_MODEL;
}

/**
 * Get the location dimensions
 */
export function getLocationDimensions(): { width: number; height: number } {
  return { ...LOCATION_DIMENSIONS };
}

