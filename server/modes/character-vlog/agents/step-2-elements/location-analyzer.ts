/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LOCATION ANALYZER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Agent 2.3: Location Analyzer
 * Extracts key locations from the story script for the Elements step.
 */

import { callTextModel } from "../../../../ai/service";
import { LOCATION_ANALYZER_SYSTEM_PROMPT, buildLocationAnalyzerUserPrompt } from "../../prompts/step-2-elements/location-analyzer-prompts";
import type { LocationAnalyzerInput, LocationAnalyzerOutput } from "../../types";

const LOCATION_ANALYZER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o", // Configured to use GPT-4o
};

/**
 * Parse and validate the location analysis response from AI
 */
function parseLocationAnalysisResponse(rawOutput: string): LocationAnalyzerOutput {
  // Strip markdown code fences if present
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
  }

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('[character-vlog:location-analyzer] Failed to parse JSON response:', cleaned);
    throw new Error(`Failed to parse location analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate structure
  if (!parsed.locations || !Array.isArray(parsed.locations)) {
    console.error('[character-vlog:location-analyzer] Invalid response structure:', parsed);
    throw new Error('AI response missing locations array');
  }

  // Validate and transform locations
  const locations = parsed.locations.map((loc: any, index: number) => {
    if (!loc.name || !loc.description || !loc.details) {
      console.warn(`[character-vlog:location-analyzer] Location ${index} missing required fields:`, loc);
    }

    return {
      name: loc.name || `Location ${index + 1}`,
      description: loc.description || '',
      details: loc.details || '',
    };
  });

  // Ensure minimum 2 locations
  if (locations.length < 2) {
    console.warn('[character-vlog:location-analyzer] Less than 2 locations returned, expected minimum 2');
  }

  // Ensure maximum 5 locations (or maxResults if specified)
  const maxLocations = 5;
  const finalLocations = locations.slice(0, maxLocations);

  return {
    locations: finalLocations,
  };
}

/**
 * Analyze locations from the story script
 */
export async function analyzeLocations(
  input: LocationAnalyzerInput,
  userId?: string,
  workspaceId?: string
): Promise<LocationAnalyzerOutput> {
  console.log('[character-vlog:location-analyzer] Analyzing locations:', {
    scriptLength: input.script.length,
    theme: input.theme,
    genres: input.genres,
    worldDescriptionLength: input.worldDescription.length,
    duration: input.duration,
    maxResults: input.maxResults || 5,
    userId,
    workspaceId,
  });

  // Build user prompt
  const userPrompt = buildLocationAnalyzerUserPrompt(
    input.script,
    input.theme,
    input.genres,
    input.worldDescription,
    input.duration,
    input.maxResults || 5
  );

  console.log('[character-vlog:location-analyzer] Calling AI model:', {
    provider: LOCATION_ANALYZER_CONFIG.provider,
    model: LOCATION_ANALYZER_CONFIG.model,
  });

  try {
    // Calculate expected output tokens
    // Estimate: ~200 tokens per location, assume max 5 locations
    const expectedOutputTokens = 1000;

    // Build payload with JSON schema for structured output
    const payload: any = {
      input: [
        { role: "system", content: LOCATION_ANALYZER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "location_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              locations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    details: { type: "string" },
                  },
                  required: ["name", "description", "details"],
                  additionalProperties: false,
                },
              },
            },
            required: ["locations"],
            additionalProperties: false,
          },
        },
      },
    };

    const response = await callTextModel(
      {
        provider: LOCATION_ANALYZER_CONFIG.provider,
        model: LOCATION_ANALYZER_CONFIG.model,
        payload,
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens,
      }
    );

    console.log('[character-vlog:location-analyzer] AI response received:', {
      outputLength: response.output.length,
      cost: response.usage?.totalCostUsd,
    });

    // Parse and validate response
    const result = parseLocationAnalysisResponse(response.output);

    console.log('[character-vlog:location-analyzer] Locations analyzed successfully:', {
      totalLocations: result.locations.length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      ...result,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error('[character-vlog:location-analyzer] Failed to analyze locations:', error);
    throw new Error(`Failed to analyze locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

