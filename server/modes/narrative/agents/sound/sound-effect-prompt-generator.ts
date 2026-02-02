/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SOUND EFFECT PROMPT GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates recommended sound effect descriptions for narrative visual content.
 * Takes shot context (action, scene, characters) and produces contextual sound 
 * effect prompts that enhance the cinematic storytelling.
 */

import { callTextModel } from "../../../../ai/service";
import {
  NARRATIVE_SOUND_EFFECT_SYSTEM_PROMPT,
  buildNarrativeSoundEffectPromptUserPrompt,
} from "../../prompts/sound-prompts";
import type { NarrativeSoundEffectPromptInput } from "../../types";

const SOUND_EFFECT_PROMPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

interface SoundEffectPromptGeneratorOutput {
  prompt: string;
  cost?: number;
}

/**
 * Generate a recommended sound effect description for a narrative shot.
 * 
 * @param input - Shot context and scene information
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated sound effect prompt and cost
 */
export async function generateNarrativeSoundEffectPrompt(
  input: NarrativeSoundEffectPromptInput,
  userId?: string,
  workspaceId?: string
): Promise<SoundEffectPromptGeneratorOutput> {
  // Build the user prompt with all context
  const userPrompt = buildNarrativeSoundEffectPromptUserPrompt(input);

  console.log('[narrative:sound-effect-prompt] Generating recommendation:', {
    shotNumber: input.shot.shotNumber,
    shotType: input.shot.shotType,
    sceneNumber: input.scene.sceneNumber,
    sceneTitle: input.scene.title,
    hasDescription: !!input.shot.description,
    genre: input.genre,
    tone: input.tone,
  });

  try {
    const response = await callTextModel(
      {
        provider: SOUND_EFFECT_PROMPT_GENERATOR_CONFIG.provider,
        model: SOUND_EFFECT_PROMPT_GENERATOR_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: NARRATIVE_SOUND_EFFECT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 150,  // Short response expected
      }
    );

    const prompt = response.output.trim();

    console.log('[narrative:sound-effect-prompt] Recommendation generated:', {
      promptLength: prompt.length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      prompt,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[narrative:sound-effect-prompt] Failed to generate:", error);
    throw new Error("Failed to generate sound effect recommendation");
  }
}



