/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - VOICEOVER SCRIPT GENERATOR AGENT (Agent 5.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates voiceover narration scripts for character vlog content.
 * Takes the existing story script and shot durations to produce properly
 * timed narration that matches the video structure.
 */

import { callTextModel } from "../../../../ai/service";
import {
  VOICEOVER_SCRIPT_SYSTEM_PROMPT,
  buildVoiceoverScriptUserPrompt,
  estimateScriptDuration,
} from "../../prompts/step-5-sound/voiceover-script-prompts";
import type {
  VoiceoverScriptGeneratorInput,
  VoiceoverScriptGeneratorOutput,
} from "../../types";

const VOICEOVER_SCRIPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",  // Using gpt-5 for high-quality creative writing
};

/**
 * Generate a voiceover narration script for character vlog content.
 * 
 * @param input - Video context including script, scenes, and shots
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated script, estimated duration, and cost
 */
export async function generateVoiceoverScript(
  input: VoiceoverScriptGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<VoiceoverScriptGeneratorOutput> {
  // Build the user prompt with all context
  const userPrompt = buildVoiceoverScriptUserPrompt(input);

  console.log('[character-vlog:voiceover-script] Generating voiceover script:', {
    language: input.language,
    totalDuration: input.totalDuration,
    scriptLength: input.script.length,
    scenesCount: input.scenes.length,
    narrationStyle: input.narrationStyle,
    characterPersonality: input.characterPersonality,
  });

  try {
    // Calculate expected output tokens based on duration
    // Conversational pace: ~140 words/minute, ~1.3 tokens per word on average
    const durationMinutes = input.totalDuration / 60;
    const expectedWords = Math.round(durationMinutes * 140);
    const expectedTokens = Math.max(300, Math.min(6000, Math.round(expectedWords * 1.5)));

    console.log('[character-vlog:voiceover-script] Expected output:', {
      durationMinutes,
      expectedWords,
      expectedTokens,
    });

    const response = await callTextModel(
      {
        provider: VOICEOVER_SCRIPT_GENERATOR_CONFIG.provider,
        model: VOICEOVER_SCRIPT_GENERATOR_CONFIG.model,
        payload: {
          reasoning: { effort: "medium" },
          input: [
            { role: "system", content: VOICEOVER_SCRIPT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: expectedTokens,
      }
    );

    const script = response.output.trim();
    
    // Estimate the speaking duration of the generated script
    const estimatedDuration = estimateScriptDuration(script);

    console.log('[character-vlog:voiceover-script] Script generated:', {
      wordCount: script.split(/\s+/).length,
      estimatedDuration,
      targetDuration: input.totalDuration,
      cost: response.usage?.totalCostUsd,
    });

    return {
      script,
      estimatedDuration,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:voiceover-script] Failed to generate script:", error);
    throw new Error("Failed to generate voiceover script");
  }
}

/**
 * Calculate total video duration from scenes and shots.
 * Unlike ambient mode, character vlog has no loop multipliers.
 * 
 * @param scenes - Array of scenes
 * @param shots - Record of shots keyed by sceneId
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(
  scenes: Array<{ id: string }>,
  shots: Record<string, Array<{ duration: number }>>
): number {
  let totalDuration = 0;

  for (const scene of scenes) {
    const sceneShots = shots[scene.id] || [];
    for (const shot of sceneShots) {
      totalDuration += shot.duration;
    }
  }

  return totalDuration;
}
