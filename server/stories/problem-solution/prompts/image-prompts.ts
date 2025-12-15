// Image Generation Prompts for Problem-Solution Mode

/**
 * Negative prompt to ensure quality
 */
export const NEGATIVE_PROMPT = 
  "blurry, low quality, distorted, ugly, bad anatomy, deformed, disfigured, " +
  "mutation, mutated, extra limbs, missing limbs, floating limbs, disconnected limbs, " +
  "malformed hands, long neck, duplicate, watermark, signature, text, logo, " +
  "low resolution, pixelated, jpeg artifacts, compression artifacts";

/**
 * Build consistency suffix for scenes 2-N
 * Note: Nano Banana doesn't support seedImage, so we rely on seed + detailed prompt
 */
export function buildConsistencySuffix(): string {
  return ", IMPORTANT: maintain exact same character appearance, identical facial features, " +
         "same clothing and accessories, consistent art style, same person throughout, " +
         "character continuity, unified visual design";
}

/**
 * Enhance image prompt for better quality and consistency
 * 
 * Strategy for Nano Banana (no seedImage support):
 * - Scene 1: High quality modifiers only
 * - Scenes 2-N: Same seed + strong consistency instructions in prompt
 */
export function enhanceImagePrompt(
  prompt: string,
  aspectRatio: string,
  isFirstScene: boolean
): string {
  let enhanced = prompt.trim();

  // Add quality modifiers (always)
  const qualityModifiers = [
    "high quality",
    "detailed",
    "professional photography",
    "sharp focus",
    "8k uhd",
    "masterpiece",
  ];

  // Add aspect ratio specific guidance
  const aspectGuidance: Record<string, string> = {
    "9:16": "vertical composition, mobile-friendly framing",
    "16:9": "cinematic wide shot, horizontal composition",
    "1:1": "centered composition, balanced framing",
  };

  const guidance = aspectGuidance[aspectRatio] || "";

  // Build final prompt
  enhanced = `${enhanced}, ${qualityModifiers.join(", ")}`;
  
  if (guidance) {
    enhanced += `, ${guidance}`;
  }

  // Add strong consistency suffix for non-first scenes
  // Since Nano Banana doesn't support seedImage, we rely heavily on:
  // 1. Same seed (set in payload)
  // 2. Detailed consistency instructions in prompt
  if (!isFirstScene) {
    enhanced += buildConsistencySuffix();
  }

  return enhanced;
}

