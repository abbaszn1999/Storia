/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - FLOW DESIGN: CONTINUITY PRODUCER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Analyzes shots and proposes continuity groups for seamless visual transitions.
 * Only used in Start-End Frame video generation mode.
 * 
 * Continuity groups define sequences of shots where:
 * - The END frame of shot N matches the START frame of shot N+1
 * - Visual elements flow naturally between shots
 */

import { callTextModel } from "../../../ai/service";
import { randomUUID } from "crypto";
import {
  buildContinuityProducerSystemPrompt,
  buildContinuityProducerUserPrompt,
  TRANSITION_TYPES,
} from "../prompts/flow-continuity-producer-prompts";
import type {
  ContinuityProducerInput,
  ContinuityProducerOutput,
  ContinuityGroup,
  Shot,
} from "../types";

const CONTINUITY_PRODUCER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Group limits for validation
 */
const GROUP_LIMITS = {
  MIN_SHOTS: 2,
  MAX_SHOTS: 5,
};

/**
 * Parse AI response into ContinuityGroup objects
 * Note: Using array format because OpenAI strict JSON Schema doesn't support dynamic keys
 */
interface AIContinuityResponse {
  sceneGroups: Array<{
    sceneId: string;
    groups: Array<{
      groupNumber: number;
      shotIds: string[];
      transitionType: string;
      description: string;
    }>;
  }>;
  analysis: string;
}

/**
 * Validate that shot IDs are consecutive within their scene
 */
function validateConsecutiveShots(
  shotIds: string[],
  sceneShots: Shot[]
): boolean {
  if (shotIds.length < 2) return false;
  
  // Get shot numbers for the given IDs
  const shotNumbers = shotIds
    .map((id) => sceneShots.find((s) => s.id === id)?.shotNumber)
    .filter((n): n is number => n !== undefined);
  
  if (shotNumbers.length !== shotIds.length) return false;
  
  // Check if numbers are consecutive
  shotNumbers.sort((a, b) => a - b);
  for (let i = 1; i < shotNumbers.length; i++) {
    if (shotNumbers[i] !== shotNumbers[i - 1] + 1) return false;
  }
  
  return true;
}

/**
 * Validate transition type
 */
function validateTransitionType(type: string): string {
  return TRANSITION_TYPES.includes(type) ? type : "flow";
}

/**
 * Propose continuity groups for shots across scenes
 */
export async function proposeContinuity(
  input: ContinuityProducerInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<ContinuityProducerOutput> {
  const { scenes, shots } = input;

  // Check if there are enough shots to propose continuity
  const totalShots = Object.values(shots).flat().length;
  if (totalShots < 2) {
    console.log("[ambient-visual:continuity-producer] Not enough shots for continuity:", {
      totalShots,
    });
    return {
      continuityGroups: {},
      cost: 0,
    };
  }

  console.log("[ambient-visual:continuity-producer] Analyzing continuity:", {
    sceneCount: scenes.length,
    totalShots,
  });

  const systemPrompt = buildContinuityProducerSystemPrompt();
  const userPrompt = buildContinuityProducerUserPrompt(input);

  try {
    const response = await callTextModel(
      {
        provider: CONTINUITY_PRODUCER_CONFIG.provider,
        model: CONTINUITY_PRODUCER_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "continuity_proposal",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  sceneGroups: {
                    type: "array",
                    description: "Array of scene continuity data",
                    items: {
                      type: "object",
                      properties: {
                        sceneId: { type: "string", description: "The scene ID" },
                        groups: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              groupNumber: { type: "number" },
                              shotIds: {
                                type: "array",
                                items: { type: "string" },
                              },
                              transitionType: { type: "string" },
                              description: { type: "string" },
                            },
                            required: ["groupNumber", "shotIds", "transitionType", "description"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["sceneId", "groups"],
                      additionalProperties: false,
                    },
                  },
                  analysis: { type: "string" },
                },
                required: ["sceneGroups", "analysis"],
                additionalProperties: false,
              },
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 1000,
        metadata: { usageType, usageMode },
      }
    );

    // Parse the JSON response
    const parsed: AIContinuityResponse = JSON.parse(response.output.trim());

    // Validate response structure
    if (!parsed.sceneGroups || !Array.isArray(parsed.sceneGroups)) {
      throw new Error("Invalid response: missing sceneGroups array");
    }

    // Convert array format to Record<string, ContinuityGroup[]> with validation
    const continuityGroups: Record<string, ContinuityGroup[]> = {};
    const now = new Date();

    for (const sceneData of parsed.sceneGroups) {
      const { sceneId, groups } = sceneData;
      
      // Get shots for this scene
      const sceneShots = shots[sceneId] || [];
      if (sceneShots.length < 2) continue;

      const validGroups: ContinuityGroup[] = [];

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        // Validate shot IDs exist in this scene
        const validShotIds = group.shotIds.filter((id) =>
          sceneShots.some((s) => s.id === id)
        );

        // Skip if not enough valid shots
        if (validShotIds.length < GROUP_LIMITS.MIN_SHOTS) {
          console.warn(
            `[ambient-visual:continuity-producer] Group has too few valid shots, skipping`
          );
          continue;
        }

        // Trim if too many shots
        const trimmedShotIds = validShotIds.slice(0, GROUP_LIMITS.MAX_SHOTS);

        // Validate consecutive
        if (!validateConsecutiveShots(trimmedShotIds, sceneShots)) {
          console.warn(
            `[ambient-visual:continuity-producer] Group shots are not consecutive, skipping`
          );
          continue;
        }

        validGroups.push({
          id: randomUUID(),
          sceneId,
          groupNumber: i + 1,
          shotIds: trimmedShotIds,
          transitionType: validateTransitionType(group.transitionType),
          description: group.description || null,
          status: "proposed",
          editedBy: null,
          editedAt: null,
          approvedAt: null,
          createdAt: now,
        });
      }

      if (validGroups.length > 0) {
        continuityGroups[sceneId] = validGroups;
      }
    }

    // Count total groups proposed
    const totalGroups = Object.values(continuityGroups).flat().length;

    console.log("[ambient-visual:continuity-producer] Continuity proposed:", {
      scenesWithGroups: Object.keys(continuityGroups).length,
      totalGroups,
      analysis: parsed.analysis?.substring(0, 100) || "N/A",
      cost: response.usage?.totalCostUsd,
    });

    return {
      continuityGroups,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error(
      "[ambient-visual:continuity-producer] Failed to propose continuity:",
      error
    );
    throw new Error("Failed to propose continuity groups");
  }
}

