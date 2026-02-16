/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - VOICEOVER SCRIPT GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates voiceover narration scripts for narrative visual content.
 * Takes video context (script, scenes, shots, characters) and produces
 * engaging narrative voiceover that enhances the cinematic storytelling.
 */

import { callTextModel } from "../../../../ai/service";
import {
  NARRATIVE_VOICEOVER_SYSTEM_PROMPT,
  buildNarrativeVoiceoverScriptUserPrompt,
  estimateNarrativeScriptDuration,
} from "../../prompts/sound-prompts";
import type { NarrativeVoiceoverScriptInput } from "../../types";

const VOICEOVER_SCRIPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

interface VoiceoverScriptGeneratorOutput {
  script: string;
  estimatedDuration: number;
  cost?: number;
}

/**
 * Generate a voiceover narration script for narrative visual content.
 * 
 * @param input - Video context including script, scenes, and characters
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated script, estimated duration, and cost
 */
export async function generateNarrativeVoiceoverScript(
  input: NarrativeVoiceoverScriptInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<VoiceoverScriptGeneratorOutput> {
  // Build the user prompt with all context
  const userPrompt = buildNarrativeVoiceoverScriptUserPrompt(input);

  console.log('[narrative:voiceover-script] Generating voiceover script:', {
    language: input.language,
    totalDuration: input.totalDuration,
    genre: input.genre,
    tone: input.tone,
    scenesCount: input.scenes.length,
    scriptLength: input.script.length,
  });

  try {
    // Calculate expected output tokens based on duration
    // Narrative pace: ~140 words/minute, ~1.3 tokens per word on average
    const durationMinutes = input.totalDuration / 60;
    const expectedWords = Math.round(durationMinutes * 140);
    const expectedTokens = Math.max(300, Math.min(4000, Math.round(expectedWords * 1.5)));

    console.log('[narrative:voiceover-script] Expected output:', {
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
            { role: "system", content: NARRATIVE_VOICEOVER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: expectedTokens,
        metadata: { usageType, usageMode },
      }
    );

    const script = response.output.trim();
    
    // Estimate the speaking duration of the generated script
    const estimatedDuration = estimateNarrativeScriptDuration(script);

    console.log('[narrative:voiceover-script] Script generated:', {
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
    console.error("[narrative:voiceover-script] Failed to generate script:", error);
    throw new Error("Failed to generate voiceover script");
  }
}

/**
 * Calculate total video duration from scenes and shots.
 * 
 * @param scenes - Array of scenes
 * @param shots - Record of shots keyed by sceneId
 * @returns Total duration in seconds
 */
export function calculateNarrativeTotalDuration(
  scenes: Array<{ id: string; duration?: number | null }>,
  shots: Record<string, Array<{ duration: number }>>
): number {
  let totalDuration = 0;

  for (const scene of scenes) {
    const sceneShots = shots[scene.id] || [];
    
    // Sum all shot durations in this scene
    for (const shot of sceneShots) {
      totalDuration += shot.duration;
    }
  }

  return totalDuration;
}




