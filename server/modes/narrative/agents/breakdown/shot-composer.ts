/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SCENE BREAKDOWN: SHOT COMPOSER AGENT (Agent 3.2)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Breaks scenes into individual shots with camera framing, timing, narration,
 * and action descriptions. Each shot includes visual and narrative elements.
 */

import { callTextModel } from "../../../../ai/service";
import { getModelConfig } from "../../../../ai/config";
import { randomUUID } from "crypto";
import {
  buildShotComposerSystemPrompt,
  buildShotComposerUserPrompt,
  calculateOptimalShotCount,
} from "../../prompts/shot-composer";

const SHOT_COMPOSER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Shot limits for validation
 */
const SHOT_LIMITS = {
  MIN: 1,
  MAX: 15,
  DURATION_MIN: 2,
  DURATION_MAX: 60,
};

/**
 * Parse AI response into Shot objects
 */
interface AIShotResponse {
  shots: Array<{
    shotNumber: number;
    duration: number;
    shotType: string;
    cameraMovement: string;
    actionDescription: string;  // With @tags - visual action only, NO narration
    characters: string[];  // @{CharacterName} format
    location: string;  // @{LocationName} format
    frameMode?: "image-reference" | "start-end";  // Only in auto mode
  }>;
  continuityGroups?: Array<{
    groupNumber: number;
    shotNumbers: number[];  // Shot numbers (1-indexed) in this scene
    transitionType: string;  // "flow", "pan", "character-movement", etc.
    description: string;  // Reason for connection
  }>;
  totalShots: number;
  totalDuration: number;
}

/**
 * Shot type for internal use
 */
interface Shot {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType: string;
  cameraMovement: string;
  duration: number;
  description?: string | null;
  videoModel?: string | null;
  imageModel?: string | null;
  soundEffects?: string | null;
  transition?: string | null;
  currentVersionId?: string | null;
  characters?: string[];  // Array of @{CharacterName} tags
  location?: string;  // @{LocationName} tag
  frameMode?: "image-reference" | "start-end";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for shot composer
 */
export interface ShotComposerInput {
  script: string;
  scene: {
    id: string;
    sceneNumber: number;
    title: string;
    description?: string | null;
    duration?: number | null;
  };
  previousScenes: Array<{
    scene: {
      id: string;
      sceneNumber: number;
      title: string;
      description?: string | null;
      duration?: number | null;
    };
    shots: Shot[];
  }>;
  shotsPerScene: number | 'auto';
  characters: Array<{ id: string; name: string; description?: string }>;
  locations: Array<{ id: string; name: string; description?: string }>;
  genre: string;
  tone?: string;
  model?: string;
  availableDurations?: number[];
  narrativeMode?: "image-reference" | "start-end" | "auto";
}

/**
 * Output from shot composer
 */
export interface ShotComposerOutput {
  shots: Shot[];
  continuityGroups?: ContinuityGroup[];  // Generated continuity groups for this scene
  cost?: number;
}

/**
 * Continuity group structure (matches client-side ContinuityGroup)
 */
interface ContinuityGroup {
  id: string;
  sceneId: string;
  groupNumber: number;
  shotIds: string[];
  description?: string | null;
  transitionType?: string | null;
  status: string;
  editedBy?: string | null;
  editedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

/**
 * Map AI continuity groups to ContinuityGroup objects
 * Validates and filters invalid groups
 */
function mapContinuityGroups(
  aiGroups: Array<{
    groupNumber: number;
    shotNumbers: number[];
    transitionType: string;
    description: string;
  }>,
  shots: Shot[],
  sceneId: string,
  narrativeMode?: "image-reference" | "start-end" | "auto"
): ContinuityGroup[] {
  const now = new Date();
  const mappedGroups: ContinuityGroup[] = [];
  const shotMap = new Map(shots.map(shot => [shot.shotNumber, shot]));

  for (const aiGroup of aiGroups) {
    // Validate group has at least 2 shots
    if (!aiGroup.shotNumbers || aiGroup.shotNumbers.length < 2) {
      console.warn(
        `[narrative:shot-composer] Skipping continuity group ${aiGroup.groupNumber}: needs at least 2 shots, got ${aiGroup.shotNumbers?.length || 0}`
      );
      continue;
    }

    // Map shot numbers to shot IDs and validate they exist
    const shotIds: string[] = [];
    const invalidShots: number[] = [];

    for (const shotNumber of aiGroup.shotNumbers) {
      const shot = shotMap.get(shotNumber);
      if (shot) {
        shotIds.push(shot.id);
      } else {
        invalidShots.push(shotNumber);
      }
    }

    // Skip group if any shot numbers are invalid
    if (invalidShots.length > 0) {
      console.warn(
        `[narrative:shot-composer] Skipping continuity group ${aiGroup.groupNumber}: invalid shot numbers: ${invalidShots.join(', ')}`
      );
      continue;
    }

    // In auto mode, validate first shot is start-end
    if (narrativeMode === "auto") {
      const firstShot = shotMap.get(aiGroup.shotNumbers[0]);
      if (firstShot && firstShot.frameMode !== "start-end") {
        console.warn(
          `[narrative:shot-composer] Skipping continuity group ${aiGroup.groupNumber}: first shot must be start-end mode, got ${firstShot.frameMode}`
        );
        continue;
      }
    }

    // Create continuity group
    const continuityGroup: ContinuityGroup = {
      id: randomUUID(),
      sceneId,
      groupNumber: aiGroup.groupNumber,
      shotIds,
      description: aiGroup.description || null,
      transitionType: aiGroup.transitionType || null,
      status: "proposed",
      editedBy: null,
      editedAt: null,
      approvedAt: null,
      createdAt: now,
    };

    mappedGroups.push(continuityGroup);
  }

  return mappedGroups;
}

/**
 * Compose shots for a single scene
 */
export async function composeShots(
  input: ShotComposerInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<ShotComposerOutput> {
  // Determine provider and model
  let provider: "openai" | "gemini" = "openai";
  let modelName = input.model || SHOT_COMPOSER_CONFIG.model;
  
  // Parse model string to determine provider
  if (modelName.startsWith("gemini")) {
    provider = "gemini";
  }

  const sceneDuration = input.scene.duration || 30;
  
  // Calculate optimal shot count if auto
  const shotCount = input.shotsPerScene === 'auto'
    ? calculateOptimalShotCount(sceneDuration)
    : input.shotsPerScene;

  // Check if the model supports reasoning
  let supportsReasoning = false;
  try {
    const modelConfig = getModelConfig(provider, modelName);
    supportsReasoning = modelConfig.metadata?.reasoning === true;
  } catch {
    // Model not found in config, assume no reasoning support
  }

  console.log("[narrative:shot-composer] Composing shots:", {
    sceneId: input.scene.id,
    sceneNumber: input.scene.sceneNumber,
    sceneTitle: input.scene.title,
    sceneDuration,
    shotsPerScene: input.shotsPerScene,
    calculatedShotCount: shotCount,
    previousScenesCount: input.previousScenes.length,
    characterCount: input.characters.length,
    locationCount: input.locations.length,
    genre: input.genre,
    tone: input.tone,
    model: modelName,
    provider,
    supportsReasoning,
    userId,
    workspaceId,
  });

  const systemPrompt = buildShotComposerSystemPrompt(
    sceneDuration,
    shotCount,
    input.shotsPerScene === 'auto',
    input.genre,
    input.tone,
    input.availableDurations,
    input.narrativeMode
  );
  const userPrompt = buildShotComposerUserPrompt(input, shotCount, input.narrativeMode);

  try {
    // Calculate expected output tokens
    // Estimate: ~150 tokens per shot, assume max 15 shots
    const expectedOutputTokens = 2500;

    // Build payload - only include reasoning for models that support it
    const payload: any = {
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "shot_composition",
          strict: true,
          schema: {
            type: "object",
            properties: {
              shots: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    shotNumber: { type: "number" },
                    duration: { type: "number" },
                    shotType: { type: "string" },
                    cameraMovement: { type: "string" },
                    actionDescription: { type: "string" },
                    characters: {
                      type: "array",
                      items: { type: "string" }
                    },
                    location: { type: "string" },
                    ...(input.narrativeMode === "auto" ? {
                      frameMode: { 
                        type: "string",
                        enum: ["image-reference", "start-end"]
                      }
                    } : {}),
                  },
                  required: input.narrativeMode === "auto" 
                    ? ["shotNumber", "duration", "shotType", "cameraMovement", "actionDescription", "characters", "location", "frameMode"]
                    : ["shotNumber", "duration", "shotType", "cameraMovement", "actionDescription", "characters", "location"],
                  additionalProperties: false,
                },
              },
              // Conditionally include continuityGroups only in start-end or auto mode
              ...((input.narrativeMode === "start-end" || input.narrativeMode === "auto") ? {
                continuityGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      groupNumber: { type: "number" },
                      shotNumbers: {
                        type: "array",
                        items: { type: "number" }
                      },
                      transitionType: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["groupNumber", "shotNumbers", "transitionType", "description"],
                    additionalProperties: false,
                  },
                },
              } : {}),
              totalShots: { type: "number" },
              totalDuration: { type: "number" },
            },
            required: (input.narrativeMode === "start-end" || input.narrativeMode === "auto")
              ? ["shots", "totalShots", "totalDuration", "continuityGroups"]
              : ["shots", "totalShots", "totalDuration"],
            additionalProperties: false,
          },
        },
      },
    };

    // Only add reasoning parameter for models that support it (gpt-5, gpt-5.1)
    if (supportsReasoning) {
      payload.reasoning = { effort: "low" };
    }

    const response = await callTextModel(
      {
        provider,
        model: modelName,
        payload,
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens,
        metadata: { usageType, usageMode },
      }
    );

    // Parse the JSON response
    let rawOutput = response.output.trim();
    
    // Strip markdown code fences if present
    if (rawOutput.startsWith('```')) {
      rawOutput = rawOutput
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
    }

    let parsed: AIShotResponse;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (parseError) {
      console.error("[narrative:shot-composer] JSON parse error:", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawOutputPreview: rawOutput.substring(0, 1000),
        narrativeMode: input.narrativeMode,
        sceneNumber: input.scene.sceneNumber,
      });
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

    // Validate response structure
    if (!parsed.shots || !Array.isArray(parsed.shots)) {
      console.error("[narrative:shot-composer] Invalid response structure:", {
        hasShots: !!parsed.shots,
        shotsIsArray: Array.isArray(parsed.shots),
        shotsType: typeof parsed.shots,
        rawOutputPreview: rawOutput.substring(0, 500),
        narrativeMode: input.narrativeMode,
        sceneNumber: input.scene.sceneNumber,
        parsedKeys: Object.keys(parsed),
      });
      throw new Error("Invalid response: missing shots array");
    }

    // Validate shot count
    let aiShots = parsed.shots;
    
    // If shotsPerScene is a number, validate exact match
    if (input.shotsPerScene !== 'auto') {
      if (aiShots.length !== input.shotsPerScene) {
        console.warn(
          `[narrative:shot-composer] Shot count mismatch for scene ${input.scene.sceneNumber}: expected ${input.shotsPerScene}, got ${aiShots.length}`
        );
        // For now, we'll use what was generated, but log the warning
      }
    }

    // Validate shot count limits
    if (aiShots.length < SHOT_LIMITS.MIN) {
      console.warn(
        `[narrative:shot-composer] Too few shots (${aiShots.length}), expected at least ${SHOT_LIMITS.MIN}`
      );
    }
    if (aiShots.length > SHOT_LIMITS.MAX) {
      console.warn(
        `[narrative:shot-composer] Too many shots (${aiShots.length}), trimming to ${SHOT_LIMITS.MAX}`
      );
      aiShots = aiShots.slice(0, SHOT_LIMITS.MAX);
    }

    // Convert to Shot objects
    const now = new Date();
    const shots: Shot[] = aiShots.map((shot, index) => {
      // Ensure characters are properly tagged with @{Name} format
      const taggedCharacters = shot.characters
        ? shot.characters.map((char: string) => {
            // If already tagged, return as is
            if (char.startsWith('@')) {
              return char;
            }
            // If plain name, tag it with @{Name} format
            return `@{${char}}`;
          })
        : [];
      
      // Ensure location is properly tagged
      let taggedLocation = shot.location || '';
      if (taggedLocation && !taggedLocation.startsWith('@')) {
        taggedLocation = `@{${taggedLocation}}`;
      }
      
      return {
        id: randomUUID(),
        sceneId: input.scene.id,
        shotNumber: index + 1, // Ensure sequential numbering
        shotType: shot.shotType || "Medium Shot",
        cameraMovement: shot.cameraMovement || "static",
        duration: Math.max(
          SHOT_LIMITS.DURATION_MIN,
          Math.min(SHOT_LIMITS.DURATION_MAX, shot.duration)
        ),
        description: shot.actionDescription, // Only use actionDescription - no narration text
        videoModel: null,
        imageModel: null,
        soundEffects: null,
        transition: null,
        currentVersionId: null,
        frameMode: input.narrativeMode === "auto" ? (shot.frameMode || "image-reference") : undefined, // Only set in auto mode
        // Store characters and location (will be stored in step3Data)
        characters: taggedCharacters,
        location: taggedLocation,
        createdAt: now,
        updatedAt: now,
      };
    });

    // Calculate actual total duration
    const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);

    // Validate duration is close to scene duration (allow ±2 seconds tolerance)
    const durationDiff = Math.abs(totalDuration - sceneDuration);
    if (durationDiff > 2) {
      console.warn(
        `[narrative:shot-composer] Duration mismatch for scene ${input.scene.sceneNumber}: target ${sceneDuration}s, got ${totalDuration}s (diff: ${durationDiff}s)`
      );
    }

    // Parse and map continuity groups (if provided and in start-end or auto mode)
    let continuityGroups: ContinuityGroup[] = [];
    if ((input.narrativeMode === "start-end" || input.narrativeMode === "auto") && parsed.continuityGroups) {
      // Ensure continuityGroups is an array (handle null or invalid values)
      if (Array.isArray(parsed.continuityGroups)) {
        try {
          continuityGroups = mapContinuityGroups(
            parsed.continuityGroups,
            shots,
            input.scene.id,
            input.narrativeMode
          );
          console.log(`[narrative:shot-composer] Mapped ${continuityGroups.length} continuity groups for scene ${input.scene.sceneNumber}`);
        } catch (error) {
          console.warn(
            `[narrative:shot-composer] Failed to parse continuity groups for scene ${input.scene.sceneNumber}:`,
            error
          );
          // Graceful degradation: continue without continuity groups
          continuityGroups = [];
        }
      } else {
        console.warn(
          `[narrative:shot-composer] continuityGroups is not an array for scene ${input.scene.sceneNumber}, got:`,
          typeof parsed.continuityGroups
        );
      }
    }

    console.log("[narrative:shot-composer] Shots composed:", {
      sceneId: input.scene.id,
      sceneNumber: input.scene.sceneNumber,
      shotCount: shots.length,
      totalDuration,
      targetDuration: sceneDuration,
      cost: response.usage?.totalCostUsd,
    });

    return {
      shots,
      continuityGroups: continuityGroups.length > 0 ? continuityGroups : undefined,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error(
      "[narrative:shot-composer] Failed to compose shots:",
      error
    );
    throw new Error(`Failed to compose shots for scene ${input.scene.sceneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compose shots for multiple scenes sequentially
 * Processes scenes one by one to maintain narrative context
 */
export async function composeShotsForScenes(
  scenes: Array<{
    id: string;
    sceneNumber: number;
    title: string;
    description?: string | null;
    duration?: number | null;
  }>,
  input: {
    script: string;
    shotsPerScene: number | 'auto';
    characters: Array<{ id: string; name: string; description?: string }>;
    locations: Array<{ id: string; name: string; description?: string }>;
    genre: string;
    tone?: string;
    model?: string;
    availableDurations?: number[];
    narrativeMode?: "image-reference" | "start-end" | "auto";
  },
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<{
  shots: Record<string, Shot[]>;
  continuityGroups: Record<string, ContinuityGroup[]>;
  totalCost: number;
}> {
  console.log("[narrative:shot-composer] Composing shots for all scenes:", {
    sceneCount: scenes.length,
    shotsPerScene: input.shotsPerScene,
    genre: input.genre,
    tone: input.tone,
    narrativeMode: input.narrativeMode,
  });

  const shots: Record<string, Shot[]> = {};
  const continuityGroups: Record<string, ContinuityGroup[]> = {};
  let totalCost = 0;
  const previousScenes: Array<{ scene: typeof scenes[0]; shots: Shot[] }> = [];

  // Process scenes sequentially to maintain narrative context
  for (const scene of scenes) {
    try {
      const result = await composeShots(
        {
          script: input.script,
          scene,
          previousScenes,
          shotsPerScene: input.shotsPerScene,
          characters: input.characters,
          locations: input.locations,
          genre: input.genre,
          tone: input.tone,
          model: input.model,
          availableDurations: input.availableDurations,
          narrativeMode: input.narrativeMode,
        },
        userId,
        workspaceId,
        usageType,
        usageMode
      );

      shots[scene.id] = result.shots;
      totalCost += result.cost || 0;

      // Collect continuity groups if provided
      if (result.continuityGroups && result.continuityGroups.length > 0) {
        continuityGroups[scene.id] = result.continuityGroups;
        console.log(`[narrative:shot-composer] Scene ${scene.sceneNumber} has ${result.continuityGroups.length} continuity groups`);
      }

      // Add to previous scenes for next iteration
      previousScenes.push({
        scene,
        shots: result.shots,
      });

      console.log(`[narrative:shot-composer] Completed scene ${scene.sceneNumber}/${scenes.length}`);
    } catch (error) {
      console.error(
        `[narrative:shot-composer] Failed to compose shots for scene ${scene.sceneNumber}:`,
        error
      );
      // Continue with other scenes even if one fails
      shots[scene.id] = [];
    }
  }

  console.log("[narrative:shot-composer] All shots composed:", {
    sceneCount: scenes.length,
    totalShots: Object.values(shots).flat().length,
    totalContinuityGroups: Object.values(continuityGroups).flat().length,
    totalCost,
  });

  return { shots, continuityGroups, totalCost };
}


