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
 * - Duration (8, 16, 24, or 32 seconds)
 * 
 * OUTPUT:
 * - visual_beats: Array of beats (N = duration/8), each with beatId, beatName, 
 *   beatDescription, duration (8s), and isConnectedToPrevious
 * - connection_strategy: Overall connection strategy across beats
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
    beat4?: string; // Optional, only used for 32s duration
  };
  // Removed: pacing_profile (no longer from Agent 1.1)
  duration: number;
  productTitle?: string;
  productDescription?: string;
  visualIntensity?: number;
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
}

/**
 * Create visual beats from creative spark and user beats
 */
export async function createNarrative(
  input: NarrativeInput,
  userId: string,
  workspaceId: string
): Promise<NarrativeOutput> {
  const beatCount = input.duration / 8;
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

      const output: NarrativeOutput = {
        visual_beats: parsed.visual_beats,
        connection_strategy: parsed.connection_strategy,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-3.2] Visual beats created:', {
        beatCount: output.visual_beats.length,
        connectionStrategy: output.connection_strategy,
        beats: output.visual_beats.map(b => ({ id: b.beatId, name: b.beatName, connected: b.isConnectedToPrevious })),
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

