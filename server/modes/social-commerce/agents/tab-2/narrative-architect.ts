/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 3.2: VISUAL BEATS ARCHITECT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Visual Beats agent that transforms the creative spark and user beats
 * into structured visual beats for the beat-based chunking system.
 * 
 * INPUT:
 * - Creative spark from Agent 3.0
 * - Campaign context and user beats from Tab 3
 * - Duration (12, 24, or 36 seconds)
 * 
 * OUTPUT:
 * - visual_beats: Array of beats (N = duration/12), each with beatId, beatName, 
 *   beatDescription, duration (12s)
 */

import { callTextModel } from '../../../../ai/service';
import { getModelConfig } from '../../../../ai/config';
import {
  NARRATIVE_SYSTEM_PROMPT,
  buildNarrativeUserPrompt,
  NARRATIVE_SCHEMA,
} from '../../prompts/tab-2/narrative-prompts';
import type { NarrativeOutput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-5.2',
  temperature: 0.6, // Creative narrative with structural discipline
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface NarrativeInput {
  creative_spark: string;
  campaignSpark: string;
  campaignObjective: string;
  visualBeats: {
    beat1: string;
    beat2: string;
    beat3: string;
  };
  // Removed: pacing_profile (no longer from Agent 1.1)
  duration: number;
  productTitle?: string;
  productDescription?: string;
  visualIntensity?: number;
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
  // NEW: Image context
  imageMode?: 'hero' | 'composite';
  compositeElements?: {
    hasHeroProduct: boolean;
    hasProductAngles: boolean;
    hasDecorativeElements: boolean;
    elementDescriptions?: string[]; // Optional descriptions
  };
  // NEW: Pacing
  pacingOverride?: number; // 0-100
}

/**
 * Create visual beats from creative spark and user beats
 */
export async function createNarrative(
  input: NarrativeInput,
  userId: string,
  workspaceId: string
): Promise<NarrativeOutput> {
  const beatCount = input.duration / 12;
  console.log('[social-commerce:agent-3.2] Creating visual beats:', {
    objective: input.campaignObjective,
    // Removed: pacing_profile
    duration: input.duration,
    beatCount,
  });

  const userPrompt = buildNarrativeUserPrompt(input);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK REASONING SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Check if model supports reasoning
  let supportsReasoning = false;
  try {
    const modelConfig = getModelConfig(AGENT_CONFIG.provider, AGENT_CONFIG.model);
    supportsReasoning = modelConfig.metadata?.reasoning === true;
  } catch {
    // Model not found in config, assume no reasoning support
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-3.2] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            input: [
              { role: 'system', content: NARRATIVE_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'narrative_output',
                strict: true,
                schema: NARRATIVE_SCHEMA,
              },
            },
            // Conditionally add reasoning if supported (temperature not supported with reasoning)
            ...(supportsReasoning ? { reasoning: { effort: "high" } } : { temperature: AGENT_CONFIG.temperature }),
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 800,
        }
      );

      const rawOutput = response.output.trim();
      const parsed = JSON.parse(rawOutput);

      // Validate beat count matches expected count based on duration
      const expectedBeatCount = input.duration / 12;
      const actualBeatCount = parsed.visual_beats?.length || 0;
      
      if (actualBeatCount !== expectedBeatCount) {
        throw new Error(
          `Beat count mismatch: expected ${expectedBeatCount} beat(s) for ${input.duration}s duration, but got ${actualBeatCount} beat(s)`
        );
      }

      // Validate all beat IDs are valid and sequential
      const validBeatIds = ['beat1', 'beat2', 'beat3'] as const;
      for (let i = 0; i < actualBeatCount; i++) {
        const expectedBeatId = validBeatIds[i];
        const actualBeat = parsed.visual_beats[i];
        if (!actualBeat || actualBeat.beatId !== expectedBeatId) {
          throw new Error(
            `Invalid beat ID at index ${i}: expected ${expectedBeatId}, got ${actualBeat?.beatId || 'undefined'}`
          );
        }
      }

      const output: NarrativeOutput = {
        visual_beats: parsed.visual_beats,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-3.2] Visual beats created:', {
        beatCount: output.visual_beats.length,
        expectedBeatCount,
        beats: output.visual_beats.map(b => ({ id: b.beatId, name: b.beatName })),
        cost: output.cost,
      });

      return output;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-3.2] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < AGENT_CONFIG.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to create visual beats');
}

