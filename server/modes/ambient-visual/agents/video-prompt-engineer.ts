/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - VIDEO PROMPT ENGINEER AGENT (4.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates optimized prompts for image and video generation in Video Animation mode.
 * This agent takes shot descriptions, atmosphere, and visual world settings
 * to create detailed prompts optimized for AI image/video models.
 * 
 * Uses strict JSON Schema to ensure reliable, structured output.
 */

import { callTextModel } from "../../../ai/service";
import {
  VIDEO_PROMPT_ENGINEER_SYSTEM_PROMPT,
  buildVideoPromptEngineerUserPrompt,
} from "../prompts/video-prompt-engineer-prompts";
import type {
  VideoPromptEngineerInput,
  VideoPromptEngineerOutput,
} from "../types";

const VIDEO_PROMPT_ENGINEER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
  expectedOutputTokens: 800,
};

/**
 * JSON Schema response structure from the AI
 */
interface AIPromptResponse {
  imagePrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  startFramePrompt: string;
  endFramePrompt: string;
}

/**
 * Generate optimized prompts for a shot's image and video generation.
 * 
 * @param input - Shot context, atmosphere, visual world, and continuity info
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated prompts and cost
 */
export async function generateVideoPrompts(
  input: VideoPromptEngineerInput,
  userId?: string,
  workspaceId?: string
): Promise<VideoPromptEngineerOutput> {
  const systemPrompt = VIDEO_PROMPT_ENGINEER_SYSTEM_PROMPT;
  const userPrompt = buildVideoPromptEngineerUserPrompt(input);

  console.log('[ambient-visual:video-prompt-engineer] Generating prompts:', {
    shotId: input.shotId,
    sceneId: input.sceneId,
    shotType: input.shotType,
    artStyle: input.artStyle,
    isConnectedShot: input.isConnectedShot,
    isFirstInGroup: input.isFirstInGroup,
  });

  try {
    const response = await callTextModel(
      {
        provider: VIDEO_PROMPT_ENGINEER_CONFIG.provider,
        model: VIDEO_PROMPT_ENGINEER_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "video_prompt_engineer_output",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  imagePrompt: {
                    type: "string",
                    description: "Detailed visual description for image generation models"
                  },
                  videoPrompt: {
                    type: "string",
                    description: "Motion and camera instructions for video generation"
                  },
                  negativePrompt: {
                    type: "string",
                    description: "Elements to avoid in generation"
                  },
                  startFramePrompt: {
                    type: "string",
                    description: "Specific prompt for the start frame"
                  },
                  endFramePrompt: {
                    type: "string",
                    description: "Specific prompt for the end frame"
                  }
                },
                required: ["imagePrompt", "videoPrompt", "negativePrompt", "startFramePrompt", "endFramePrompt"],
                additionalProperties: false
              }
            }
          }
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: VIDEO_PROMPT_ENGINEER_CONFIG.expectedOutputTokens,
      }
    );

    // Parse the JSON response
    const parsed: AIPromptResponse = JSON.parse(response.output.trim());

    console.log('[ambient-visual:video-prompt-engineer] Prompts generated:', {
      shotId: input.shotId,
      imagePromptLength: parsed.imagePrompt.length,
      videoPromptLength: parsed.videoPrompt.length,
      negativePromptLength: parsed.negativePrompt.length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      imagePrompt: parsed.imagePrompt,
      videoPrompt: parsed.videoPrompt,
      negativePrompt: parsed.negativePrompt,
      startFramePrompt: parsed.startFramePrompt,
      endFramePrompt: parsed.endFramePrompt,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error('[ambient-visual:video-prompt-engineer] Generation failed:', {
      shotId: input.shotId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(
      `Failed to generate video prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

