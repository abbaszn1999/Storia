// ═══════════════════════════════════════════════════════════════════════════
// Agent 2.3: Character Image Generator
// ═══════════════════════════════════════════════════════════════════════════
// Creates character portrait reference images for visual consistency
// Used by: Character Assets Library (hard-coded nano-banana)
//          Narrative Mode World & Cast (user-selectable model)

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CharacterImageInput {
  name: string;                    // Character name
  appearance: string;              // Physical description
  personality: string;            // Behavioral traits (mandatory)
  artStyleDescription?: string;    // Art style text from Agent 2.5 or selected style (optional)
  model?: string;                  // Image model (default: "nano-banana")
  negativePrompt?: string;         // Custom negative prompt (optional)
  referenceImages?: string[];      // URLs for character consistency (optional)
  styleReferenceImage?: string;    // Style reference image URL (optional - separate from artStyleDescription text)
}

export interface CharacterImageOutput {
  imageUrl: string;                // Generated image URL
  cost?: number;                   // API cost in USD
  error?: string;                  // Error message if failed
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_MODEL = "nano-banana";

// Character portraits are always 1:1 square (1024x1024)
const PORTRAIT_DIMENSIONS = {
  width: 1024,
  height: 1024,
};

// Default negative prompt for character portraits (configurable per request)
export const DEFAULT_CHARACTER_NEGATIVE_PROMPT = 
  "blurry, low quality, distorted face, extra limbs, watermark, text, " +
  "cropped, out of frame, bad anatomy, deformed, " +
  "disfigured, mutated, ugly, duplicate, morbid, mutilated, " +
  "missing angles, repeated angles, incomplete grid, inconsistent character";

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the character portrait prompt using the enhanced template
 * Now generates a 3x3 grid 360 model sheet for character consistency
 */
function buildCharacterPrompt(input: CharacterImageInput): string {
  const { name, appearance, personality, artStyleDescription } = input;

  // Layer 1: Character Subject Definition
  let prompt = `Character reference portrait of ${name}, ${appearance}.`;

  // Layer 2: Personality Integration (mandatory)
  prompt += `\nPersonality: ${personality}.`;

  // Layer 3: Art Style Integration (conditional - text style only)
  // Note: styleReferenceImage is handled separately as a reference image to the API
  if (artStyleDescription && artStyleDescription.trim()) {
    prompt += `\n${artStyleDescription}`;
  }

  // Layer 4: 3x3 Grid 360 Model Sheet for Character Consistency
  prompt += `\nCreate a 3x3 grid 360 model sheet. Stick strictly to the angles provided. DO NOT DOUBLE AN ANGLE. Do not forgot an angle. Here's the angle asked: Front angle - 3/4 left - 3/4 right - left side - right side - Chin up - Chin down - Back - Full body shot with clothes.`;

  // Layers 5-6: Lighting and Quality (adjusted for model sheet)
  prompt += `\nProfessional character model sheet, clean white or neutral studio background, consistent lighting across all angles, soft studio lighting with gentle key light and subtle rim light, clear detail in face, hair, and clothing across all views. 8K ultra-detailed, professional photography, studio quality, high-resolution, finely detailed, consistent character design, reference sheet for animation/production.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a character portrait image
 * 
 * Agent 2.3: Character Image Generator
 * 
 * Creates a consistent character reference portrait using:
 * - Square 1:1 aspect ratio (1024x1024)
 * - Waist-up composition with studio lighting
 * - Personality-reflecting natural pose
 * - Optional reference images for consistency
 * 
 * @param input - Character details and generation settings
 * @param userId - User ID for billing/tracking
 * @param workspaceId - Workspace ID for billing/tracking
 * @param usageType - Type for usage tracking (e.g. "assets", "video")
 * @param usageMode - Mode for usage tracking (e.g. "character", "narrative")
 * @returns Generated image URL or error
 */
export async function generateCharacterImage(
  input: CharacterImageInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<CharacterImageOutput> {
  const {
    model = DEFAULT_MODEL,
    negativePrompt,
    referenceImages,
    styleReferenceImage,
  } = input;

  // Build the character portrait prompt
  const positivePrompt = buildCharacterPrompt(input);

  // Use provided negative prompt or default
  const finalNegativePrompt = negativePrompt ?? DEFAULT_CHARACTER_NEGATIVE_PROMPT;

  // Get Runware model ID from friendly name
  const runwareModelId = runwareModelIdMap[model];
  if (!runwareModelId) {
    return {
      imageUrl: "",
      error: `No Runware mapping for model: ${model}`,
    };
  }

  try {
    console.log("[agent-2.3:character-image] Starting image generation:", {
      model,
      runwareModelId,
      characterName: input.name,
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
      width: PORTRAIT_DIMENSIONS.width,
      height: PORTRAIT_DIMENSIONS.height,
      numberResults: 1,
      includeCost: true,
    };

    // Add reference images if provided (for character consistency)
    // Runware expects referenceImages as an array of URL strings (not objects)
    // Models like nano-banana support up to 8 reference images
    const allReferenceUrls: string[] = [];
    
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((url) => {
        allReferenceUrls.push(url);
      });
      console.log("[agent-2.3:character-image] Added character reference images:", {
        count: referenceImages.length,
      });
    }

    // Add style reference image (same format - Runware doesn't support per-image weights)
    if (styleReferenceImage) {
      allReferenceUrls.push(styleReferenceImage);
      console.log("[agent-2.3:character-image] Added style reference image");
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
        metadata: { usageType, usageMode },
      }
    );

    // Extract image URL from response
    const results = response.output as any[];
    const data = Array.isArray(results) ? results[0] : results;

    console.log("[agent-2.3:character-image] Response received:", {
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
    console.error("[agent-2.3:character-image] Generation failed:", error);
    return {
      imageUrl: "",
      error: error instanceof Error ? error.message : "Character image generation failed",
    };
  }
}

/**
 * Get the default model for character image generation
 */
export function getDefaultCharacterImageModel(): string {
  return DEFAULT_MODEL;
}

/**
 * Get the portrait dimensions
 */
export function getPortraitDimensions(): { width: number; height: number } {
  return { ...PORTRAIT_DIMENSIONS };
}

