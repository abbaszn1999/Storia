/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - FLOW DESIGN: SCENE GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates ambient visual scenes (segments) from the mood description.
 * Each scene represents a distinct visual moment in the ambient experience.
 */

import { callTextModel } from "../../../ai/service";
import { randomUUID } from "crypto";
import {
  buildSceneGeneratorSystemPrompt,
  buildSceneGeneratorUserPrompt,
  parseDurationToSeconds,
  calculateOptimalSegmentCount,
} from "../prompts/flow-scene-generator-prompts";
import type {
  SceneGeneratorInput,
  SceneGeneratorOutput,
  Scene,
} from "../types";

const SCENE_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Scene limits for validation
 */
const SCENE_LIMITS = {
  MIN: 1,
  MAX: 50,
  DURATION_MIN: 15,
  DURATION_MAX: 120,
};

/**
 * Parse AI response into Scene objects
 */
interface AISceneResponse {
  segments: Array<{
    sceneNumber: number;
    title: string;
    description: string;
    duration: number;
    lighting: string;
    weather: string;
  }>;
  totalSegments: number;
  totalDuration: number;
}

/**
 * Generate ambient visual scenes from mood description and settings
 */
export async function generateScenes(
  input: SceneGeneratorInput,
  videoId: string,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<SceneGeneratorOutput> {
  const durationSeconds = parseDurationToSeconds(input.duration);
  const segmentCount = calculateOptimalSegmentCount(
    durationSeconds,
    input.pacing,
    input.segmentCount
  );

  console.log("[ambient-visual:scene-generator] Generating scenes:", {
    duration: input.duration,
    durationSeconds,
    pacing: input.pacing,
    targetSegmentCount: segmentCount,
    theme: input.theme,
    mood: input.mood,
    animationMode: input.animationMode,
  });

  const systemPrompt = buildSceneGeneratorSystemPrompt(
    durationSeconds,
    segmentCount,
    input.pacing,
    input.animationMode
  );
  const userPrompt = buildSceneGeneratorUserPrompt(input);

  try {
    const response = await callTextModel(
      {
        provider: SCENE_GENERATOR_CONFIG.provider,
        model: SCENE_GENERATOR_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
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
                  segments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sceneNumber: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        duration: { type: "number" },
                        lighting: { type: "string" },
                        weather: { type: "string" },
                      },
                      required: ["sceneNumber", "title", "description", "duration", "lighting", "weather"],
                      additionalProperties: false,
                    },
                  },
                  totalSegments: { type: "number" },
                  totalDuration: { type: "number" },
                },
                required: ["segments", "totalSegments", "totalDuration"],
                additionalProperties: false,
              },
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 1500,
        metadata: { usageType, usageMode },
      }
    );

    // Parse the JSON response
    const parsed: AISceneResponse = JSON.parse(response.output.trim());

    // Validate response structure
    if (!parsed.segments || !Array.isArray(parsed.segments)) {
      throw new Error("Invalid response: missing segments array");
    }

    // Validate segment count
    let segments = parsed.segments;
    if (segments.length < SCENE_LIMITS.MIN) {
      console.warn(
        `[ambient-visual:scene-generator] Too few segments (${segments.length}), expected at least ${SCENE_LIMITS.MIN}`
      );
    }
    if (segments.length > SCENE_LIMITS.MAX) {
      console.warn(
        `[ambient-visual:scene-generator] Too many segments (${segments.length}), trimming to ${SCENE_LIMITS.MAX}`
      );
      segments = segments.slice(0, SCENE_LIMITS.MAX);
    }

    // Convert to Scene objects
    const scenes: Scene[] = segments.map((segment, index) => ({
      id: randomUUID(),
      videoId,
      sceneNumber: index + 1, // Ensure sequential numbering
      title: segment.title,
      description: segment.description,
      duration: Math.max(
        SCENE_LIMITS.DURATION_MIN,
        Math.min(SCENE_LIMITS.DURATION_MAX, segment.duration)
      ),
      videoModel: null,
      imageModel: null,
      cameraMotion: null,
      lighting: segment.lighting || null,
      weather: segment.weather || null,
      createdAt: new Date(),
    }));

    // Calculate actual total duration
    const totalDuration = scenes.reduce(
      (sum, scene) => sum + (scene.duration || 0),
      0
    );

    console.log("[ambient-visual:scene-generator] Scenes generated:", {
      sceneCount: scenes.length,
      totalDuration,
      targetDuration: durationSeconds,
      cost: response.usage?.totalCostUsd,
    });

    return {
      scenes,
      totalDuration,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error(
      "[ambient-visual:scene-generator] Failed to generate scenes:",
      error
    );
    throw new Error("Failed to generate scenes");
  }
}

