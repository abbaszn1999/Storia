/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - MOOD DESCRIPTION GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates atmospheric mood descriptions for ambient visual content.
 * Takes atmosphere settings as input and produces evocative, sensory-rich
 * descriptions that guide visual generation in later phases.
 */

import { callTextModel } from "../../../ai/service";
import {
  MOOD_DESCRIPTION_SYSTEM_PROMPT,
  buildMoodDescriptionUserPrompt,
} from "../prompts/atmosphere-prompts";
import type {
  MoodDescriptionGeneratorInput,
  MoodDescriptionGeneratorOutput,
} from "../types";

const MOOD_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Generate an atmospheric mood description from atmosphere settings.
 * 
 * @param input - The 15 fields from atmosphere settings (mood, theme, etc.)
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @param usageType - Type of usage for tracking (e.g., "video")
 * @param usageMode - Mode of usage for tracking (e.g., "ambient")
 * @returns Generated mood description and cost
 */
export async function generateMoodDescription(
  input: MoodDescriptionGeneratorInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<MoodDescriptionGeneratorOutput> {
  // Build the user prompt with all atmosphere parameters
  const userPrompt = buildMoodDescriptionUserPrompt(input);

  console.log('[ambient-visual:mood-generator] Generating mood description:', {
    mood: input.mood,
    theme: input.theme,
    duration: input.duration,
    animationMode: input.animationMode,
    loopMode: input.loopMode,
    hasUserPrompt: !!input.userPrompt,
  });

  try {
    const response = await callTextModel(
      {
        provider: MOOD_GENERATOR_CONFIG.provider,
        model: MOOD_GENERATOR_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: MOOD_DESCRIPTION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 1000,
        metadata: { usageType, usageMode },
      }
    );

    const moodDescription = response.output.trim();

    console.log('[ambient-visual:mood-generator] Mood description generated:', {
      wordCount: moodDescription.split(/\s+/).length,
      paragraphs: moodDescription.split(/\n\n+/).length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      moodDescription,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[ambient-visual:mood-generator] Failed to generate mood description:", error);
    throw new Error("Failed to generate mood description");
  }
}

