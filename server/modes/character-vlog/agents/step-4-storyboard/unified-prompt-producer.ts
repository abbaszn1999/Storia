/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - UNIFIED PROMPT PRODUCER AGENT (BATCH PROCESSING)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates image and video prompts for all shots in a scene using batch processing.
 * Processes all shots in a single API call to maintain context and continuity.
 */

import { callTextModel } from "../../../../ai/service";
import {
  UNIFIED_PROMPT_PRODUCER_SYSTEM_PROMPT,
  buildUnifiedPromptProducerUserPrompt,
} from "../../prompts/step-4-storyboard/unified-prompt-producer-prompts";
import type {
  UnifiedPromptProducerSceneInput,
  UnifiedPromptProducerSceneOutput,
} from "../../types";

const UNIFIED_PROMPT_PRODUCER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5", // GPT-5 for large context window (272k input / 128k output)
};

/**
 * JSON Schema for unified prompt producer output validation
 */
const UNIFIED_PROMPT_PRODUCER_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    shots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          shotId: {
            type: "string",
            description: "Shot ID matching input shot ID",
          },
          imagePrompts: {
            type: "object",
            properties: {
              single: {
                type: ["string", "null"],
                description: "Single image prompt for 1F shots (null for 2F)",
              },
              start: {
                type: ["string", "null"],
                description: "Start frame prompt for 2F shots (null for 1F)",
              },
              end: {
                type: ["string", "null"],
                description: "End frame prompt for 2F shots (null for 1F)",
              },
            },
            required: ["single", "start", "end"],
            additionalProperties: false,
          },
          videoPrompt: {
            type: "string",
            description: "Video prompt describing motion and camera movement (~300 words)",
          },
          visualContinuityNotes: {
            type: ["string", "null"],
            description: "Continuity notes for next shot (only for isFirstInGroup: true)",
          },
        },
        required: ["shotId", "imagePrompts", "videoPrompt", "visualContinuityNotes"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 15, // Max shots per scene
    },
  },
  required: ["shots"],
  additionalProperties: false,
};

/**
 * Build character anchors from character data.
 * Creates SHORT stable identity descriptors (30-50 words) combining appearance + personality.
 * 
 * @param characters - Array of character objects from step2Data
 * @returns Array of character references with @ tags and anchors
 */
export function buildCharacterAnchors(
  characters: Array<{
    id: string;
    name: string;
    appearance?: string | null;
    personality?: string | null;
    imageUrl?: string | null;
  }>
): Array<{
  name: string;
  anchor: string;
  imageUrl: string;
  appearance?: string;
  personality?: string;
}> {
  return characters.map((char) => {
    // Ensure name has @ tag
    const name = char.name.startsWith("@") ? char.name : `@${char.name}`;
    
    // Build SHORT anchor (30-50 words) from appearance and personality
    const appearancePart = char.appearance 
      ? char.appearance.split(/[.!?]/)[0].trim() // First sentence only for brevity
      : "";
    const personalityPart = char.personality 
      ? char.personality.split(/[.!?]/)[0].trim() // First sentence only
      : "";
    
    // Combine into concise anchor
    const anchorParts = [appearancePart, personalityPart].filter(Boolean);
    const anchor = anchorParts.length > 0 
      ? anchorParts.join(". ") + "."
      : `A character with distinct visual presence.`;
    
    console.log(`[character-vlog:unified-prompt-producer] Built character anchor for ${name}: ${anchor.substring(0, 60)}...`);
    
    return {
      name,
      anchor,
      imageUrl: char.imageUrl || "",
      appearance: char.appearance || undefined,
      personality: char.personality || undefined,
    };
  });
}

/**
 * Build location anchors from location data.
 * Creates SHORT stable location descriptors (20-40 words) for environment consistency.
 * 
 * @param locations - Array of location objects from step2Data
 * @returns Array of location references with @ tags and anchors
 */
export function buildLocationAnchors(
  locations: Array<{
    id: string;
    name: string;
    description?: string | null;
    details?: string | null;
    imageUrl?: string | null;
  }>
): Array<{
  name: string;
  anchor: string;
  imageUrl: string;
  description?: string;
}> {
  return locations.map((loc) => {
    // Ensure name has @ tag
    const name = loc.name.startsWith("@") ? loc.name : `@${loc.name}`;
    
    // Build SHORT anchor (20-40 words) from description
    const descriptionText = loc.description || loc.details || "";
    const anchor = descriptionText 
      ? descriptionText.split(/[.!?]/)[0].trim() + "." // First sentence only
      : `A distinct location with specific visual characteristics.`;
    
    console.log(`[character-vlog:unified-prompt-producer] Built location anchor for ${name}: ${anchor.substring(0, 60)}...`);
    
    return {
      name,
      anchor,
      imageUrl: loc.imageUrl || "",
      description: loc.description || undefined,
    };
  });
}

/**
 * Build style anchor from world settings.
 * Creates reusable style descriptor from artStyle preset and worldDescription.
 * 
 * @param worldSettings - World settings from step2Data
 * @returns Style reference object with anchor
 */
export function buildStyleAnchor(worldSettings: {
  artStyle?: string;
  worldDescription?: string;
  artStyleImageUrl?: string;
}): {
  anchor: string;
  negativeStyle?: string;
  artStyle: string;
  artStyleImageUrl?: string;
} {
  const artStyle = worldSettings.artStyle || "cinematic";
  const worldDesc = worldSettings.worldDescription || "";
  
  // Build style anchor from artStyle preset and worldDescription
  const stylePresets: Record<string, string> = {
    cinematic: "Cinematic quality with professional video production aesthetic, shallow depth of field, film-like color grading",
    anime: "Anime art style with vibrant colors, expressive character designs, stylized features",
    realistic: "Photorealistic quality with natural lighting, authentic textures, lifelike details",
    cartoon: "Cartoon art style with bold outlines, vibrant colors, simplified shapes",
    painterly: "Painterly aesthetic with artistic brushstrokes, rich textures, expressive colors",
    minimalist: "Minimalist design with clean lines, simple compositions, restrained color palette",
  };
  
  const styleBase = stylePresets[artStyle.toLowerCase()] || artStyle;
  
  // Add world description context if provided
  const worldContext = worldDesc 
    ? worldDesc.split(/[.!?]/)[0].trim() // First sentence only for brevity
    : "";
  
  const anchor = worldContext 
    ? `${styleBase}. ${worldContext}.`
    : `${styleBase}.`;
  
  // Common negative prompts
  const negativeStyle = "blurry, distorted, low quality, bad anatomy, deformed, disfigured, mutation, extra limbs, missing limbs, floating limbs, disconnected limbs, malformed hands, long neck, cross-eyed, watermark, signature, text, logo";
  
  console.log(`[character-vlog:unified-prompt-producer] Built style anchor: ${anchor.substring(0, 80)}...`);
  
  return {
    anchor,
    negativeStyle,
    artStyle,
    artStyleImageUrl: worldSettings.artStyleImageUrl,
  };
}

/**
 * Parse JSON response from AI, handling potential formatting issues
 */
function parsePromptResponse(
  rawOutput: string,
  inputShots: UnifiedPromptProducerSceneInput["shots"]
): UnifiedPromptProducerSceneOutput {
  const trimmed = rawOutput.trim();

  // Try to extract JSON if wrapped in markdown code blocks
  let jsonStr = trimmed;
  const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Response is not a valid object");
    }

    if (!Array.isArray(parsed.shots)) {
      throw new Error('Response missing "shots" array');
    }

    // Validate each shot and apply continuity rule
    const shots = parsed.shots.map((shot: any, index: number) => {
      if (!shot || typeof shot !== "object") {
        throw new Error(`Shot ${index + 1} is not a valid object`);
      }

      if (!shot.shotId || typeof shot.shotId !== "string") {
        throw new Error(`Shot ${index + 1} missing or invalid "shotId" field`);
      }

      // Find corresponding input shot to check continuity rules
      const inputShot = inputShots.find((s) => s.shotId === shot.shotId);
      if (!inputShot) {
        throw new Error(`Shot ${index + 1} has shotId "${shot.shotId}" that doesn't match any input shot`);
      }

      // Validate imagePrompts structure
      if (!shot.imagePrompts || typeof shot.imagePrompts !== "object") {
        throw new Error(`Shot ${index + 1} missing or invalid "imagePrompts" field`);
      }

      const { single, start, end } = shot.imagePrompts;
      if (single !== null && typeof single !== "string") {
        throw new Error(`Shot ${index + 1} has invalid "imagePrompts.single" (must be string or null)`);
      }
      if (start !== null && typeof start !== "string") {
        throw new Error(`Shot ${index + 1} has invalid "imagePrompts.start" (must be string or null)`);
      }
      if (end !== null && typeof end !== "string") {
        throw new Error(`Shot ${index + 1} has invalid "imagePrompts.end" (must be string or null)`);
      }

      // Validate videoPrompt
      if (!shot.videoPrompt || typeof shot.videoPrompt !== "string") {
        throw new Error(`Shot ${index + 1} missing or invalid "videoPrompt" field`);
      }

      // Validate visualContinuityNotes
      if (shot.visualContinuityNotes !== null && typeof shot.visualContinuityNotes !== "string") {
        throw new Error(`Shot ${index + 1} has invalid "visualContinuityNotes" (must be string or null)`);
      }

      // Validate explicit inheritance: If inheritedPrompts exists, AI should NOT have generated those fields
      // The routes will merge inherited prompts after this function returns
      if (inputShot.inheritedPrompts) {
        if (inputShot.frameType === "1F" && inputShot.inheritedPrompts.imagePrompt) {
          // 1F: AI should have left imagePrompts.single as null
          if (shot.imagePrompts.single) {
            console.warn(
              `[character-vlog:unified-prompt-producer] INHERITANCE WARNING: Shot ${shot.shotId} (1F linked) generated imagePrompts.single, ` +
              `but it should be null (will be inherited). AI-generated value will be ignored.`
            );
            // Clear it - routes will set the inherited value
            shot.imagePrompts.single = null;
          } else {
            console.log(
              `[character-vlog:unified-prompt-producer] INHERITANCE VALIDATED: Shot ${shot.shotId} (1F linked) correctly left imagePrompts.single as null`
            );
          }
        } else if (inputShot.frameType === "2F" && inputShot.inheritedPrompts.startFramePrompt) {
          // 2F: AI should have left imagePrompts.start as null
          if (shot.imagePrompts.start) {
            console.warn(
              `[character-vlog:unified-prompt-producer] INHERITANCE WARNING: Shot ${shot.shotId} (2F linked) generated imagePrompts.start, ` +
              `but it should be null (will be inherited). AI-generated value will be ignored.`
            );
            // Clear it - routes will set the inherited value
            shot.imagePrompts.start = null;
          } else {
            console.log(
              `[character-vlog:unified-prompt-producer] INHERITANCE VALIDATED: Shot ${shot.shotId} (2F linked) correctly left imagePrompts.start as null`
            );
          }
        }
      }

      return {
        shotId: shot.shotId,
        imagePrompts: {
          single: shot.imagePrompts.single || null,
          start: shot.imagePrompts.start || null,
          end: shot.imagePrompts.end || null,
        },
        videoPrompt: shot.videoPrompt,
        visualContinuityNotes: shot.visualContinuityNotes || null,
      };
    });

    // Validate all input shots are present in output
    const outputShotIds = new Set(shots.map((s: any) => s.shotId));
    const missingShots = inputShots.filter((s: any) => !outputShotIds.has(s.shotId));
    if (missingShots.length > 0) {
      throw new Error(
        `Missing shots in output: ${missingShots.map((s) => s.shotId).join(", ")}`
      );
    }

    // Ensure output order matches input order
    const orderedShots = inputShots.map((inputShot: any) => {
      const outputShot = shots.find((s: any) => s.shotId === inputShot.shotId);
      if (!outputShot) {
        throw new Error(`Output missing shot ${inputShot.shotId}`);
      }
      return outputShot;
    });

    return {
      shots: orderedShots,
      cost: parsed.cost,
    };
  } catch (error) {
    console.error("[character-vlog:unified-prompt-producer] Failed to parse response:", error);
    throw new Error(
      `Failed to parse prompt response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate prompts for all shots in a scene using batch processing.
 * 
 * @param input - The scene input with all shots to process
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated prompts for all shots and cost
 */
export async function generatePromptsForScene(
  input: UnifiedPromptProducerSceneInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<UnifiedPromptProducerSceneOutput> {
  console.log("[character-vlog:unified-prompt-producer] Generating prompts for scene:", {
    sceneId: input.sceneId,
    sceneName: input.sceneName,
    shotCount: input.shots.length,
    characterReferencesCount: input.characterReferences?.length || 0,
    locationReferencesCount: input.locationReferences?.length || 0,
    hasStyleAnchor: !!input.styleReference?.anchor,
    linkedShotsCount: input.shots.filter((s) => s.isLinkedToPrevious).length,
    userId,
    workspaceId,
  });

  // Build the user prompt with all scene data
  const userPrompt = buildUnifiedPromptProducerUserPrompt(input);

  try {
    const response = await callTextModel(
      {
        provider: UNIFIED_PROMPT_PRODUCER_CONFIG.provider,
        model: UNIFIED_PROMPT_PRODUCER_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: UNIFIED_PROMPT_PRODUCER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "unified_prompt_producer_output",
              strict: true,
              schema: UNIFIED_PROMPT_PRODUCER_OUTPUT_SCHEMA,
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        // Estimate: 45 prompts max × 450 tokens = ~20,250 tokens
        expectedOutputTokens: 25000, // Add buffer for JSON structure
        metadata: { usageType, usageMode },
      }
    );

    const rawOutput = response.output.trim();

    console.log("[character-vlog:unified-prompt-producer] AI response received:", {
      outputLength: rawOutput.length,
      cost: response.usage?.totalCostUsd,
      inputTokens: response.usage?.inputTokens,
      outputTokens: response.usage?.outputTokens,
    });

    // Parse JSON response
    const parsed = parsePromptResponse(rawOutput, input.shots);

    console.log("[character-vlog:unified-prompt-producer] Prompts generated:", {
      shotCount: parsed.shots.length,
      cost: parsed.cost || response.usage?.totalCostUsd,
    });

    return {
      shots: parsed.shots,
      cost: parsed.cost || response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:unified-prompt-producer] Failed to generate prompts:", error);
    throw new Error(
      `Failed to generate prompts: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
