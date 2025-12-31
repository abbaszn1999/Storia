/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SCENE BREAKDOWN: SCENE ANALYZER AGENT (Agent 3.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Analyzes scripts and breaks them into logical scenes with narrative structure.
 * Each scene includes script excerpt, duration estimate, location, and characters.
 */

import { callTextModel } from "../../../../ai/service";
import { getModelConfig } from "../../../../ai/config";
import { randomUUID } from "crypto";
import {
  buildSceneAnalyzerSystemPrompt,
  buildSceneAnalyzerUserPrompt,
  calculateOptimalSceneCount,
} from "../../prompts/scene-analyzer";
// Scene type - matches client-side Scene type from @/types/storyboard
interface Scene {
  id: string;
  videoId: string;
  sceneNumber: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  videoModel?: string | null;
  imageModel?: string | null;
  cameraMotion?: string | null;
  lighting?: string | null;
  weather?: string | null;
  createdAt: Date;
}

const SCENE_ANALYZER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Scene limits for validation
 */
const SCENE_LIMITS = {
  MIN: 1,
  MAX: 50,
  DURATION_MIN: 5,
  DURATION_MAX: 300,
};

/**
 * Parse AI response into Scene objects
 */
interface AISceneResponse {
  scenes: Array<{
    sceneNumber: number;
    title: string;
    scriptExcerpt: string;
    durationEstimate: number;
    location: string;  // @location{id} format
    charactersPresent: string[];  // @character{id} format
  }>;
  totalScenes: number;
  totalDuration: number;
}

/**
 * Input for scene analyzer
 */
export interface SceneAnalyzerInput {
  script: string;
  targetDuration: number;
  genre: string;
  tone?: string;
  numberOfScenes: number | 'auto';
  characters: Array<{ id: string; name: string; description?: string }>;
  locations: Array<{ id: string; name: string; description?: string }>;
  model?: string;
}

/**
 * Output from scene analyzer
 */
export interface SceneAnalyzerOutput {
  scenes: Scene[];
  totalDuration: number;
  cost?: number;
}

/**
 * Generate scenes from script analysis
 */
export async function generateScenes(
  input: SceneAnalyzerInput,
  videoId: string,
  userId?: string,
  workspaceId?: string
): Promise<SceneAnalyzerOutput> {
  // Determine provider and model
  let provider: "openai" | "gemini" = "openai";
  let modelName = input.model || SCENE_ANALYZER_CONFIG.model;
  
  // Parse model string to determine provider
  if (modelName.startsWith("gemini")) {
    provider = "gemini";
  }

  // Calculate optimal scene count if auto
  const sceneCount = input.numberOfScenes === 'auto' 
    ? calculateOptimalSceneCount(input.targetDuration, input.script.length)
    : input.numberOfScenes;

  // Check if the model supports reasoning
  let supportsReasoning = false;
  try {
    const modelConfig = getModelConfig(provider, modelName);
    supportsReasoning = modelConfig.metadata?.reasoning === true;
  } catch {
    // Model not found in config, assume no reasoning support
  }

  console.log("[narrative:scene-analyzer] Generating scenes:", {
    videoId,
    targetDuration: input.targetDuration,
    genre: input.genre,
    tone: input.tone,
    numberOfScenes: input.numberOfScenes,
    calculatedSceneCount: sceneCount,
    characterCount: input.characters.length,
    locationCount: input.locations.length,
    scriptLength: input.script.length,
    model: modelName,
    provider,
    supportsReasoning,
    userId,
    workspaceId,
  });

  const systemPrompt = buildSceneAnalyzerSystemPrompt(
    input.targetDuration,
    sceneCount,
    input.numberOfScenes === 'auto',
    input.genre,
    input.tone
  );
  const userPrompt = buildSceneAnalyzerUserPrompt(input, sceneCount);

  try {
    // Calculate expected output tokens
    // Estimate: ~200 tokens per scene, assume max 20 scenes
    const expectedOutputTokens = 4000;

    // Build payload - only include reasoning for models that support it
    const payload: any = {
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "scene_breakdown",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sceneNumber: { type: "number" },
                    title: { type: "string" },
                    scriptExcerpt: { type: "string" },
                    durationEstimate: { type: "number" },
                    location: { type: "string" },
                    charactersPresent: {
                      type: "array",
                      items: { type: "string" }
                    },
                  },
                  required: ["sceneNumber", "title", "scriptExcerpt", "durationEstimate", "location", "charactersPresent"],
                  additionalProperties: false,
                },
              },
              totalScenes: { type: "number" },
              totalDuration: { type: "number" },
            },
            required: ["scenes", "totalScenes", "totalDuration"],
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

    const parsed: AISceneResponse = JSON.parse(rawOutput);

    // Validate response structure
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error("Invalid response: missing scenes array");
    }

    // Validate scene count
    let aiScenes = parsed.scenes;
    
    // If numberOfScenes is a number, validate exact match
    if (input.numberOfScenes !== 'auto') {
      if (aiScenes.length !== input.numberOfScenes) {
        console.warn(
          `[narrative:scene-analyzer] Scene count mismatch: expected ${input.numberOfScenes}, got ${aiScenes.length}`
        );
        // For now, we'll use what was generated, but log the warning
        // In production, you might want to retry or throw an error
      }
    }

    // Validate scene count limits
    if (aiScenes.length < SCENE_LIMITS.MIN) {
      console.warn(
        `[narrative:scene-analyzer] Too few scenes (${aiScenes.length}), expected at least ${SCENE_LIMITS.MIN}`
      );
    }
    if (aiScenes.length > SCENE_LIMITS.MAX) {
      console.warn(
        `[narrative:scene-analyzer] Too many scenes (${aiScenes.length}), trimming to ${SCENE_LIMITS.MAX}`
      );
      aiScenes = aiScenes.slice(0, SCENE_LIMITS.MAX);
    }

    // Convert to Scene objects
    const now = new Date();
    const scenes: Scene[] = aiScenes.map((scene, index) => ({
      id: randomUUID(),
      videoId,
      sceneNumber: index + 1, // Ensure sequential numbering
      title: scene.title,
      description: scene.scriptExcerpt, // Store script excerpt in description field
      duration: Math.max(
        SCENE_LIMITS.DURATION_MIN,
        Math.min(SCENE_LIMITS.DURATION_MAX, scene.durationEstimate)
      ),
      videoModel: null,
      imageModel: null,
      cameraMotion: null,
      lighting: null,
      weather: null,
      createdAt: now,
    }));

    // Calculate actual total duration
    const totalDuration = scenes.reduce(
      (sum, scene) => sum + (scene.duration || 0),
      0
    );

    // Validate duration is close to target (allow ±5 seconds tolerance)
    const durationDiff = Math.abs(totalDuration - input.targetDuration);
    if (durationDiff > 5) {
      console.warn(
        `[narrative:scene-analyzer] Duration mismatch: target ${input.targetDuration}s, got ${totalDuration}s (diff: ${durationDiff}s)`
      );
    }

    console.log("[narrative:scene-analyzer] Scenes generated:", {
      sceneCount: scenes.length,
      totalDuration,
      targetDuration: input.targetDuration,
      cost: response.usage?.totalCostUsd,
    });

    return {
      scenes,
      totalDuration,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error(
      "[narrative:scene-analyzer] Failed to generate scenes:",
      error
    );
    throw new Error(`Failed to generate scenes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

