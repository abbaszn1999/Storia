import { callTextModel } from "../../../ai/service";
import {
  buildSceneBreakdownSystemPrompt,
  buildSceneUserPrompt,
  getOptimalSceneCount,
} from "../prompts/scene-prompts";

export interface SceneGeneratorInput {
  storyText: string;
  duration: number;
  aspectRatio: string;
  voiceoverEnabled: boolean;
  imageMode: string;
}

export interface SceneOutput {
  sceneNumber: number;
  narration: string;
  duration: number;
  visualDescription: string;
}

export interface SceneGeneratorOutput {
  scenes: SceneOutput[];
  totalScenes: number;
  totalDuration: number;
  cost?: number;
}

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
          narration: {
            type: "string",
            description: "Text narration for this scene",
          },
          duration: {
            type: "number",
            description: "Duration of this scene in seconds",
          },
          visualDescription: {
            type: "string",
            description: "Detailed visual description for video generation",
          },
        },
        required: ["sceneNumber", "narration", "duration", "visualDescription"],
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
  const { storyText, duration, aspectRatio, voiceoverEnabled, imageMode } = input;

  const sceneCount = getOptimalSceneCount(duration);
  const systemPrompt = buildSceneBreakdownSystemPrompt(
    duration,
    aspectRatio,
    voiceoverEnabled,
    sceneCount
  );
  const userPrompt = buildSceneUserPrompt(storyText, duration, aspectRatio);

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

