/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SOUND EFFECT PROMPT GENERATOR AGENT (Agent 5.3)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates recommended sound effect descriptions for character vlog content.
 * Takes shot context (description, type, scene info, theme) and
 * produces contextual sound effect prompts that complement the visuals.
 */

import { callTextModel } from "../../../../ai/service";
import {
  SOUND_EFFECT_PROMPT_SYSTEM_PROMPT,
  buildSoundEffectPromptUserPrompt,
} from "../../prompts/step-5-sound/sound-effect-prompts";
import type {
  SoundEffectPromptGeneratorInput,
  SoundEffectPromptGeneratorOutput,
} from "../../types";

const SOUND_EFFECT_PROMPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",  // Using GPT-5 for quality recommendations
};

/**
 * Generate a recommended sound effect description for a shot.
 * 
 * @param input - Shot context and atmospheric information
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated sound effect prompt and cost
 */
export async function generateSoundEffectPrompt(
  input: SoundEffectPromptGeneratorInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<SoundEffectPromptGeneratorOutput> {
  // Build the user prompt with all context
  const userPrompt = buildSoundEffectPromptUserPrompt(input);

  console.log('[character-vlog:sound-effect-prompt] Generating recommendation:', {
    shotType: input.shotType,
    duration: input.duration,
    sceneTitle: input.sceneTitle,
    theme: input.theme,
    hasShotDescription: !!input.shotDescription,
  });

  try {
    const response = await callTextModel(
      {
        provider: SOUND_EFFECT_PROMPT_GENERATOR_CONFIG.provider,
        model: SOUND_EFFECT_PROMPT_GENERATOR_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: SOUND_EFFECT_PROMPT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 150,  // Short response expected
        metadata: { usageType, usageMode },
      }
    );

    const prompt = response.output.trim();

    console.log('[character-vlog:sound-effect-prompt] Recommendation generated:', {
      promptLength: prompt.length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      prompt,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:sound-effect-prompt] Failed to generate:", error);
    throw new Error("Failed to generate sound effect recommendation");
  }
}
