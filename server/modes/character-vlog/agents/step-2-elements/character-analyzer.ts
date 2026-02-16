/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - CHARACTER ANALYZER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Analyzes story scripts to extract character information.
 * Identifies primary character and up to 4 secondary characters with detailed
 * appearance descriptions suitable for image generation.
 */

import { callTextModel } from "../../../../ai/service";
import {
  CHARACTER_ANALYZER_SYSTEM_PROMPT,
  buildCharacterAnalyzerUserPrompt,
} from "../../prompts/step-2-elements/character-analyzer-prompts";
import type {
  CharacterAnalyzerInput,
  CharacterAnalyzerOutput,
} from "../../types";

const CHARACTER_ANALYZER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o", // Using GPT-4o for analyzer agents
};

/**
 * Parse JSON response from AI, handling potential formatting issues
 */
function parseCharacterAnalysisResponse(rawOutput: string): CharacterAnalyzerOutput {
  const trimmed = rawOutput.trim();
  
  // Try to extract JSON if wrapped in markdown code blocks
  let jsonStr = trimmed;
  const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (!parsed.primaryCharacter) {
      throw new Error('Response missing "primaryCharacter" field');
    }
    
    if (!Array.isArray(parsed.secondaryCharacters)) {
      throw new Error('Response missing or invalid "secondaryCharacters" array');
    }
    
    // Ensure secondary characters array has max 4 items
    const secondaryCharacters = parsed.secondaryCharacters.slice(0, 4);
    
    return {
      primaryCharacter: {
        name: String(parsed.primaryCharacter.name || 'Narrator'),
        summaryDescription: String(parsed.primaryCharacter.summaryDescription || ''),
        summaryAppearance: String(parsed.primaryCharacter.summaryAppearance || ''),
        description: String(parsed.primaryCharacter.description || ''),
        appearance: String(parsed.primaryCharacter.appearance || ''),
        personality: String(parsed.primaryCharacter.personality || ''),
        age: parsed.primaryCharacter.age !== undefined && parsed.primaryCharacter.age !== null 
          ? Number(parsed.primaryCharacter.age) 
          : null,
        mentionCount: parsed.primaryCharacter.mentionCount === 'implicit' 
          ? 'implicit' 
          : Number(parsed.primaryCharacter.mentionCount || 0),
      },
      secondaryCharacters: secondaryCharacters.map((char: any) => ({
        name: String(char.name || 'Unknown'),
        summaryDescription: String(char.summaryDescription || ''),
        summaryAppearance: String(char.summaryAppearance || ''),
        description: String(char.description || ''),
        appearance: String(char.appearance || ''),
        age: char.age !== undefined && char.age !== null 
          ? Number(char.age) 
          : null,
        mentionCount: Number(char.mentionCount || 0),
      })),
    };
  } catch (error) {
    console.error('[character-vlog:character-analyzer] Failed to parse JSON:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      rawOutput: trimmed.substring(0, 500),
    });
    throw new Error(`Failed to parse character analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze a story script to extract character information.
 * 
 * @param input - The character analysis input (script, narrationStyle, etc.)
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Character analysis with primary and secondary characters
 */
export async function analyzeCharacters(
  input: CharacterAnalyzerInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<CharacterAnalyzerOutput> {
  // Build the user prompt with all analysis parameters
  const userPrompt = buildCharacterAnalyzerUserPrompt(
    input.script,
    input.narrationStyle,
    input.characterPersonality,
    input.theme,
    input.style,
    input.worldDescription
  );

  console.log('[character-vlog:character-analyzer] Analyzing characters:', {
    scriptLength: input.script.length,
    scriptPreview: input.script.substring(0, 200) + '...',
    narrationStyle: input.narrationStyle,
    characterPersonality: input.characterPersonality,
    theme: input.theme,
    style: input.style,
    hasWorldDescription: !!input.worldDescription,
    worldDescriptionLength: input.worldDescription.length,
    userId,
    workspaceId,
  });

  try {
    console.log('[character-vlog:character-analyzer] Calling AI model:', {
      provider: CHARACTER_ANALYZER_CONFIG.provider,
      model: CHARACTER_ANALYZER_CONFIG.model,
      userPromptLength: userPrompt.length,
      userPromptPreview: userPrompt.substring(0, 300) + '...',
    });
    
    const response = await callTextModel(
      {
        provider: CHARACTER_ANALYZER_CONFIG.provider,
        model: CHARACTER_ANALYZER_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: CHARACTER_ANALYZER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "character_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  primaryCharacter: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      summaryDescription: { type: "string" },
                      summaryAppearance: { type: "string" },
                      description: { type: "string" },
                      appearance: { type: "string" },
                      personality: { type: "string" },
                      age: { type: ["number", "null"] },
                      mentionCount: { 
                        type: ["string", "number"]
                      },
                    },
                    required: ["name", "summaryDescription", "summaryAppearance", "description", "appearance", "personality", "age", "mentionCount"],
                    additionalProperties: false,
                  },
                  secondaryCharacters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        summaryDescription: { type: "string" },
                        summaryAppearance: { type: "string" },
                        description: { type: "string" },
                        appearance: { type: "string" },
                        age: { type: ["number", "null"] },
                        mentionCount: { type: ["string", "number"] },
                      },
                      required: ["name", "summaryDescription", "summaryAppearance", "description", "appearance", "age", "mentionCount"],
                      additionalProperties: false,
                    },
                    maxItems: 4,
                  },
                },
                required: ["primaryCharacter", "secondaryCharacters"],
                additionalProperties: false,
              },
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 2000, // Character analysis can be detailed
        metadata: { usageType, usageMode },
      }
    );

    const rawOutput = response.output.trim();
    console.log('[character-vlog:character-analyzer] AI response received:', {
      outputLength: rawOutput.length,
      outputPreview: rawOutput.substring(0, 500) + '...',
      hasJsonSchema: rawOutput.includes('{'),
    });
    
    // Parse JSON response
    const parsed = parseCharacterAnalysisResponse(rawOutput);

    console.log('[character-vlog:character-analyzer] Characters analyzed:', {
      primaryCharacter: parsed.primaryCharacter.name,
      secondaryCount: parsed.secondaryCharacters.length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      ...parsed,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:character-analyzer] Failed to analyze characters:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorName: error instanceof Error ? error.name : undefined,
      fullError: error,
    });
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to analyze characters: ${error.message}`);
    }
    throw new Error("Failed to analyze characters: Unknown error");
  }
}

