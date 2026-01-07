/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SCRIPT GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates character-driven narrative scripts for character vlog content.
 * Takes script settings as input and produces complete scripts that embody
 * character personality and narration style.
 */

import { callTextModel } from "../../../../ai/service";
import {
  SCRIPT_GENERATOR_SYSTEM_PROMPT,
  buildScriptGeneratorUserPrompt,
} from "../../prompts/step-1-script/script-prompts";
import type {
  ScriptGeneratorInput,
  ScriptGeneratorOutput,
} from "../../types";

const SCRIPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Parse JSON response from AI, handling potential formatting issues
 */
function parseScriptResponse(rawOutput: string): { script: string } {
  const trimmed = rawOutput.trim();
  
  // Try to extract JSON if wrapped in markdown code blocks
  let jsonStr = trimmed;
  const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'object' && parsed !== null && 'script' in parsed) {
      return { script: String(parsed.script) };
    }
    throw new Error('Response missing "script" field');
  } catch (error) {
    // If parsing fails, try to extract script from text
    console.warn('[character-vlog:script-generator] Failed to parse JSON, attempting text extraction');
    
    // Fallback: if the response looks like it's just the script text, use it directly
    if (trimmed && !trimmed.startsWith('{')) {
      return { script: trimmed };
    }
    
    throw new Error(`Failed to parse script response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a character-driven narrative script from script settings.
 * 
 * @param input - The script generation settings (userPrompt, characterPersonality, etc.)
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated script and cost
 */
export async function generateScript(
  input: ScriptGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<ScriptGeneratorOutput> {
  // Build the user prompt with all script parameters
  const userPrompt = buildScriptGeneratorUserPrompt(input);

  console.log('[character-vlog:script-generator] Generating script:', {
    characterPersonality: input.characterPersonality,
    narrationStyle: input.narrationStyle,
    theme: input.theme,
    duration: input.duration,
    genres: input.genres,
    tones: input.tones,
    language: input.language,
    userPromptLength: input.userPrompt.length,
  });

  try {
    const response = await callTextModel(
      {
        provider: SCRIPT_GENERATOR_CONFIG.provider,
        model: SCRIPT_GENERATOR_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: SCRIPT_GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 2000, // Scripts can be longer than mood descriptions
      }
    );

    const rawOutput = response.output.trim();
    
    // Parse JSON response
    const parsed = parseScriptResponse(rawOutput);
    const script = parsed.script;

    console.log('[character-vlog:script-generator] Script generated:', {
      wordCount: script.split(/\s+/).length,
      characterCount: script.length,
      paragraphs: script.split(/\n\n+/).length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      script,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:script-generator] Failed to generate script:", error);
    throw new Error("Failed to generate script");
  }
}

