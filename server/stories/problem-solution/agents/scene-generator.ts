import { callTextModel } from "../../../ai/service";
import {
  buildSceneBreakdownSystemPrompt,
  buildSceneUserPrompt,
  getOptimalSceneCount,
} from "../prompts/scene-prompts";
import type { SceneGeneratorInput, SceneGeneratorOutput, SceneOutput } from "../types";

const SCENE_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

// JSON Schema for structured outputs
const SCENE_SCHEMA = {
  type: "object",
  properties: {
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sceneNumber: {
            type: "number",
            description: "Scene number starting from 1",
          },
          duration: {
            type: "number",
            description: "Duration of this scene in seconds (maximum 10 seconds)",
            minimum: 1,
            maximum: 10,
          },
          narration: {
            type: "string",
            description: "Text narration for this scene",
          },
        },
        required: ["sceneNumber", "duration", "narration"],
        additionalProperties: false,
      },
    },
    totalScenes: {
      type: "number",
      description: "Total number of scenes",
    },
    totalDuration: {
      type: "number",
      description: "Total duration in seconds",
    },
  },
  required: ["scenes", "totalScenes", "totalDuration"],
  additionalProperties: false,
};

export async function generateScenes(
  input: SceneGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<SceneGeneratorOutput> {
  const { storyText, duration, pacing } = input;

  const sceneCount = getOptimalSceneCount(duration);
  const systemPrompt = buildSceneBreakdownSystemPrompt(
    duration,
    sceneCount,
    pacing
  );
  const userPrompt = buildSceneUserPrompt(storyText, duration, pacing);

  try {
    const response = await callTextModel(
      {
        provider: SCENE_CONFIG.provider,
        model: SCENE_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_object",
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 800,
      }
    );

    // Parse the JSON response
    const parsed = JSON.parse(response.output.trim());

    // Validate the response
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error("Invalid response: missing scenes array");
    }

    return {
      scenes: parsed.scenes,
      totalScenes: parsed.totalScenes || parsed.scenes.length,
      totalDuration: parsed.totalDuration || duration,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[problem-solution:scene-generator] Failed to generate scenes:", error);
    throw new Error("Failed to generate scenes");
  }
}

