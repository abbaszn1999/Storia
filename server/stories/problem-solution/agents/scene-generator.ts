import { callTextModel } from "../../../ai/service";
import {
  buildSceneBreakdownSystemPrompt,
  buildSceneUserPrompt,
  getOptimalSceneCount,
} from "../prompts/scene-prompts";
import { getVideoModelConstraints, getDefaultVideoModel } from "../config";
import type { SceneGeneratorInput, SceneGeneratorOutput, SceneOutput } from "../types";

const SCENE_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Scene count limits
 */
const SCENE_LIMITS = {
  MIN: 3,
  MAX: 10,
};

export async function generateScenes(
  input: SceneGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<SceneGeneratorOutput> {
  const { storyText, duration, pacing, videoModel } = input;

  // Get video model constraints for duration limits
  const modelId = videoModel || getDefaultVideoModel().id;
  const modelConstraints = getVideoModelConstraints(modelId);
  
  // Calculate optimal scene count based on duration AND pacing
  const sceneCount = getOptimalSceneCount(duration, pacing);
  
  console.log('[problem-solution:scene-generator] Generating scenes:', {
    duration,
    pacing,
    targetSceneCount: sceneCount,
    storyLength: storyText.length,
    videoModel: modelId,
    supportedDurations: modelConstraints?.supportedDurations || 'default',
  });

  const systemPrompt = buildSceneBreakdownSystemPrompt(
    duration,
    sceneCount,
    pacing,
    modelConstraints // Pass video model constraints
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

    // Validate the response structure
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error("Invalid response: missing scenes array");
    }

    // Validate scene count limits (3-10)
    const actualSceneCount = parsed.scenes.length;
    if (actualSceneCount < SCENE_LIMITS.MIN) {
      console.warn(`[problem-solution:scene-generator] Too few scenes (${actualSceneCount}), expected at least ${SCENE_LIMITS.MIN}`);
    }
    if (actualSceneCount > SCENE_LIMITS.MAX) {
      console.warn(`[problem-solution:scene-generator] Too many scenes (${actualSceneCount}), expected at most ${SCENE_LIMITS.MAX}`);
      // Trim excess scenes if needed
      parsed.scenes = parsed.scenes.slice(0, SCENE_LIMITS.MAX);
    }

    // Validate and fix scene numbers
    parsed.scenes = parsed.scenes.map((scene: any, index: number) => ({
      ...scene,
      sceneNumber: index + 1, // Ensure sequential numbering
    }));

    console.log('[problem-solution:scene-generator] Scenes generated successfully:', {
      sceneCount: parsed.scenes.length,
      totalDuration: parsed.scenes.reduce((sum: number, s: any) => sum + s.duration, 0),
      cost: response.usage?.totalCostUsd,
    });

    return {
      scenes: parsed.scenes,
      totalScenes: parsed.scenes.length,
      totalDuration: parsed.totalDuration || duration,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[problem-solution:scene-generator] Failed to generate scenes:", error);
    throw new Error("Failed to generate scenes");
  }
}

