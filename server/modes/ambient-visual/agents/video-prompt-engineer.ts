/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - VIDEO PROMPT ENGINEER AGENT (4.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates optimized prompts based on animation mode and continuity status:
 * - Image Transitions: imagePrompt only
 * - Video Animation (standalone/first): startFramePrompt, endFramePrompt, videoPrompt
 * - Video Animation (connected): endFramePrompt only (start is inherited)
 * 
 * Uses strict JSON Schema to ensure reliable, structured output.
 */

import { callTextModel } from "../../../ai/service";
import {
  getSystemPrompt,
  buildVideoPromptEngineerUserPrompt,
} from "../prompts/video-prompt-engineer-prompts";
import type {
  VideoPromptEngineerInput,
  VideoPromptEngineerOutput,
} from "../types";

const VIDEO_PROMPT_ENGINEER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
  expectedOutputTokens: 1200, // Increased for longer frame prompts
};

/**
 * JSON Schema for Image Transitions mode
 */
const IMAGE_TRANSITIONS_SCHEMA = {
  type: "object",
  properties: {
    imagePrompt: {
      type: "string",
      description: "Comprehensive visual description for image generation (200-800 characters)"
    }
  },
  required: ["imagePrompt"],
  additionalProperties: false
} as const;

/**
 * JSON Schema for Video Animation mode (standalone or first in continuity group)
 */
const VIDEO_ANIMATION_SCHEMA = {
  type: "object",
  properties: {
    startFramePrompt: {
      type: "string",
      description: "Complete visual description of the initial frame state (150-600 characters)"
    },
    endFramePrompt: {
      type: "string",
      description: "Complete visual description of the final frame state (150-600 characters)"
    },
    videoPrompt: {
      type: "string",
      description: "Motion and camera instructions for video generation (50-300 characters)"
    }
  },
  required: ["startFramePrompt", "endFramePrompt", "videoPrompt"],
  additionalProperties: false
} as const;

/**
 * JSON Schema for Video Animation mode - connected shot (not first in group)
 * Generates endFramePrompt and videoPrompt (start is inherited from previous shot)
 */
const VIDEO_ANIMATION_CONNECTED_SCHEMA = {
  type: "object",
  properties: {
    endFramePrompt: {
      type: "string",
      description: "Complete visual description of the final frame state (150-600 characters)"
    },
    videoPrompt: {
      type: "string",
      description: "Motion and camera instructions for video generation (50-300 characters)"
    }
  },
  required: ["endFramePrompt", "videoPrompt"],
  additionalProperties: false
} as const;

/**
 * Response type for Image Transitions mode
 */
interface ImageTransitionsResponse {
  imagePrompt: string;
}

/**
 * Response type for Video Animation mode (standalone/first)
 */
interface VideoAnimationResponse {
  startFramePrompt: string;
  endFramePrompt: string;
  videoPrompt: string;
}

/**
 * Response type for Video Animation mode - connected shot (not first)
 */
interface VideoAnimationConnectedResponse {
  endFramePrompt: string;
  videoPrompt: string;
}

/**
 * Generate optimized prompts for a shot's image and video generation.
 * 
 * Output varies by animation mode and continuity status:
 * - image-transitions: { imagePrompt }
 * - video-animation (standalone/first): { startFramePrompt, endFramePrompt, videoPrompt }
 * - video-animation (connected): { endFramePrompt } only (start inherited from previous)
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
  const isImageTransitions = input.animationMode === 'image-transitions';
  const isConnectedNonFirst = input.isConnectedShot && !input.isFirstInGroup;
  
  // Select appropriate schema based on mode and continuity status
  let schema;
  let schemaName: string;
  
  if (isImageTransitions) {
    schema = IMAGE_TRANSITIONS_SCHEMA;
    schemaName = "image_transitions_output";
  } else if (isConnectedNonFirst) {
    schema = VIDEO_ANIMATION_CONNECTED_SCHEMA;
    schemaName = "video_animation_connected_output";
  } else {
    schema = VIDEO_ANIMATION_SCHEMA;
    schemaName = "video_animation_output";
  }
  
  const systemPrompt = getSystemPrompt(input.animationMode);
  const userPrompt = buildVideoPromptEngineerUserPrompt(input);

  console.log('[ambient-visual:video-prompt-engineer] Generating prompts:', {
    shotId: input.shotId,
    sceneId: input.sceneId,
    animationMode: input.animationMode,
    shotType: input.shotType,
    artStyle: input.artStyle,
    isConnectedShot: input.isConnectedShot,
    isFirstInGroup: input.isFirstInGroup,
    schemaUsed: schemaName,
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
              name: schemaName,
              strict: true,
              schema: schema
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

    // Parse the JSON response based on mode
    const parsed = JSON.parse(response.output.trim());

    if (isImageTransitions) {
      // Image Transitions mode: single image prompt
      const imageResponse = parsed as ImageTransitionsResponse;
      
      console.log('[ambient-visual:video-prompt-engineer] Image Transitions prompts generated:', {
        shotId: input.shotId,
        imagePromptLength: imageResponse.imagePrompt.length,
        cost: response.usage?.totalCostUsd,
      });

      return {
        imagePrompt: imageResponse.imagePrompt,
        cost: response.usage?.totalCostUsd,
      };
    } else if (isConnectedNonFirst) {
      // Video Animation mode - connected shot (not first): end frame + video prompt (start inherited)
      const connectedResponse = parsed as VideoAnimationConnectedResponse;
      
      console.log('[ambient-visual:video-prompt-engineer] Connected shot prompts generated:', {
        shotId: input.shotId,
        endFramePromptLength: connectedResponse.endFramePrompt.length,
        videoPromptLength: connectedResponse.videoPrompt.length,
        startFrameInherited: true,
        cost: response.usage?.totalCostUsd,
      });

      return {
        endFramePrompt: connectedResponse.endFramePrompt,
        videoPrompt: connectedResponse.videoPrompt,
        startFramePrompt: undefined, // Will be inherited from previous shot by route
        cost: response.usage?.totalCostUsd,
      };
    } else {
      // Video Animation mode - standalone or first in group: all prompts
      const videoResponse = parsed as VideoAnimationResponse;
      
      console.log('[ambient-visual:video-prompt-engineer] Video Animation prompts generated:', {
        shotId: input.shotId,
        startFramePromptLength: videoResponse.startFramePrompt.length,
        endFramePromptLength: videoResponse.endFramePrompt.length,
        videoPromptLength: videoResponse.videoPrompt.length,
        cost: response.usage?.totalCostUsd,
      });

      return {
        startFramePrompt: videoResponse.startFramePrompt,
        endFramePrompt: videoResponse.endFramePrompt,
        videoPrompt: videoResponse.videoPrompt,
        cost: response.usage?.totalCostUsd,
      };
    }
  } catch (error) {
    console.error('[ambient-visual:video-prompt-engineer] Generation failed:', {
      shotId: input.shotId,
      animationMode: input.animationMode,
      isConnectedNonFirst,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(
      `Failed to generate prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
