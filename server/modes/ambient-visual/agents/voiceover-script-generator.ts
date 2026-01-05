/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - VOICEOVER SCRIPT GENERATOR AGENT (Agent 5.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates voiceover narration scripts for ambient visual content.
 * Takes video context (mood, theme, scenes, duration) and user's narration theme
 * to produce meditative, atmospheric narration that complements the visuals.
 */

import { callTextModel } from "../../../ai/service";
import {
  VOICEOVER_SCRIPT_SYSTEM_PROMPT,
  buildVoiceoverScriptUserPrompt,
  estimateScriptDuration,
} from "../prompts/voiceover-script-prompts";
import type {
  VoiceoverScriptGeneratorInput,
  VoiceoverScriptGeneratorOutput,
} from "../types";

const VOICEOVER_SCRIPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",  // Using gpt-4o for creative writing quality
};

/**
 * Generate a voiceover narration script for ambient visual content.
 * 
 * @param input - Video context and user's narration theme
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

  console.log('[ambient-visual:voiceover-script] Generating voiceover script:', {
    language: input.language,
    totalDuration: input.totalDuration,
    mood: input.mood,
    theme: input.theme,
    scenesCount: input.scenes.length,
    voiceoverStoryLength: input.voiceoverStory.length,
  });

  try {
    // Calculate expected output tokens based on duration
    // Meditation pace: ~110 words/minute, ~1.3 tokens per word on average
    const durationMinutes = input.totalDuration / 60;
    // Account for pauses taking ~30-40% of time
    const speakingMinutes = durationMinutes * 0.65;
    const expectedWords = Math.round(speakingMinutes * 110);
    const expectedTokens = Math.max(500, Math.min(8000, Math.round(expectedWords * 1.5)));

    console.log('[ambient-visual:voiceover-script] Expected output:', {
      durationMinutes,
      speakingMinutes,
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

    console.log('[ambient-visual:voiceover-script] Script generated:', {
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
    console.error("[ambient-visual:voiceover-script] Failed to generate script:", error);
    throw new Error("Failed to generate voiceover script");
  }
}

/**
 * Calculate total video duration including loop repetitions.
 * 
 * Formula:
 * - For each shot: shotTotalDuration = shot.duration * (shot.loopCount || 1)
 * - For each scene: sceneTotalDuration = sum(shotTotalDurations) * (scene.loopCount || 1)
 * - totalDuration = sum(sceneTotalDurations)
 * 
 * @param scenes - Array of scenes with optional loopCount
 * @param shots - Record of shots keyed by sceneId
 * @returns Total duration in seconds
 */
export function calculateTotalDurationWithLoops(
  scenes: Array<{ id: string; loopCount?: number }>,
  shots: Record<string, Array<{ duration: number; loopCount?: number }>>
): number {
  let totalDuration = 0;

  for (const scene of scenes) {
    const sceneShots = shots[scene.id] || [];
    let sceneDuration = 0;

    // Calculate total duration for all shots in this scene
    for (const shot of sceneShots) {
      const shotDuration = shot.duration * (shot.loopCount || 1);
      sceneDuration += shotDuration;
    }

    // Apply scene loop count
    const sceneLoopCount = (scene as any).loopCount || 1;
    totalDuration += sceneDuration * sceneLoopCount;
  }

  return totalDuration;
}

