/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SCENE GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates scene breakdowns from scripts for character vlog content.
 * Divides scripts into logical, visually distinct scenes.
 */

import { callTextModel } from "../../../../ai/service";
import {
  SCENE_GENERATOR_SYSTEM_PROMPT,
  buildSceneGeneratorUserPrompt,
} from "../../prompts/step-3-scenes/scene-generator-prompts";
import type {
  SceneGeneratorInput,
  SceneGeneratorOutput,
} from "../../types";

const SCENE_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o", // As specified in prompt docs
};

/**
 * JSON Schema for scene generator output validation
 */
const SCENE_GENERATOR_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Scene name in format 'Scene {number}: {Title}'",
          },
          description: {
            type: "string",
            description: "2-3 sentence scene summary (30-80 words) setting context",
          },
          duration: {
            type: "number",
            description: "Estimated duration in seconds",
            minimum: 5,
            maximum: 300,
          },
        },
        required: ["name", "description", "duration"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 50,
    },
  },
  required: ["scenes"],
  additionalProperties: false,
};

/**
 * Parse JSON response from AI, handling potential formatting issues
 */
function parseSceneResponse(rawOutput: string): SceneGeneratorOutput {
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
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid object');
    }
    
    if (!Array.isArray(parsed.scenes)) {
      throw new Error('Response missing "scenes" array');
    }
    
    // Validate each scene
    const scenes = parsed.scenes.map((scene: any, index: number) => {
      if (!scene || typeof scene !== 'object') {
        throw new Error(`Scene ${index + 1} is not a valid object`);
      }
      if (!scene.name || typeof scene.name !== 'string') {
        throw new Error(`Scene ${index + 1} missing or invalid "name" field`);
      }
      if (!scene.description || typeof scene.description !== 'string') {
        throw new Error(`Scene ${index + 1} missing or invalid "description" field`);
      }
      if (typeof scene.duration !== 'number' || scene.duration < 5 || scene.duration > 300) {
        throw new Error(`Scene ${index + 1} has invalid "duration" (must be 5-300 seconds)`);
      }
      return {
        name: scene.name,
        description: scene.description,
        duration: scene.duration,
      };
    });
    
    return {
      scenes,
      cost: parsed.cost,
    };
  } catch (error) {
    console.error('[character-vlog:scene-generator] Failed to parse response:', error);
    throw new Error(`Failed to parse scene response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate scenes from script analysis.
 * 
 * @param input - The scene generation input (script, theme, characters, locations, etc.)
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated scenes and cost
 */
export async function generateScenes(
  input: SceneGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<SceneGeneratorOutput> {
  console.log('[character-vlog:scene-generator] Generating scenes:', {
    scriptLength: input.script.length,
    theme: input.theme,
    duration: input.duration,
    worldDescription: input.worldDescription || 'None',
    numberOfScenes: input.numberOfScenes,
    shotsPerScene: input.shotsPerScene,
    primaryCharacter: input.primaryCharacter.name,
    secondaryCharacterCount: input.secondaryCharacters.length,
    locationCount: input.locations.length,
    userId,
    workspaceId,
  });

  // Build the user prompt with all scene generation parameters
  const userPrompt = buildSceneGeneratorUserPrompt(input);

  try {
    const response = await callTextModel(
      {
        provider: SCENE_GENERATOR_CONFIG.provider,
        model: SCENE_GENERATOR_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: SCENE_GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "scene_generator_output",
              strict: true,
              schema: SCENE_GENERATOR_OUTPUT_SCHEMA,
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 4000, // Scenes can have multiple items
      }
    );

    const rawOutput = response.output.trim();
    
    console.log('[character-vlog:scene-generator] AI response received:', {
      outputLength: rawOutput.length,
      cost: response.usage?.totalCostUsd,
    });
    
    // Parse JSON response
    const parsed = parseSceneResponse(rawOutput);
    
    console.log('[character-vlog:scene-generator] Scenes generated:', {
      sceneCount: parsed.scenes.length,
      totalDuration: parsed.scenes.reduce((sum, scene) => sum + scene.duration, 0),
      cost: parsed.cost || response.usage?.totalCostUsd,
    });

    return {
      scenes: parsed.scenes,
      cost: parsed.cost || response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:scene-generator] Failed to generate scenes:", error);
    throw new Error(`Failed to generate scenes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

