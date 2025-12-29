/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 4.2: TEMPORAL RHYTHMIC ORCHESTRATOR (THE EDITOR)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Editor agent that transforms shot manifest into rhythmically perfect timing
 * blueprint. Calculates durations, speed ramps, and SFX synchronization.
 * 
 * INPUT:
 * - Scenes with shots from Agent 4.1
 * - Pacing profile and duration from Tab 1
 * - Script manifest from Tab 3
 * 
 * OUTPUT:
 * - temporal_map[] with rendered_duration, multiplier, speed_curve, sfx_hint
 * - duration_budget with target, actual, variance
 */

import { callTextModel } from '../../../../ai/service';
import { getModelConfig } from '../../../../ai/config';
import {
  TIMING_SYSTEM_PROMPT,
  buildTimingUserPrompt,
  TIMING_SCHEMA,
  type TimingInput,
} from '../../prompts/tab-4/timing-prompts';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-5.2', // High reasoning for complex timing calculations
  temperature: 0.3, // Precise timing, minimal creativity
  maxRetries: 2,
};

// System constants
const MODEL_BASE_DURATION = 5.0;
const MIN_RENDERED_DURATION = 0.3;
const MAX_RENDERED_DURATION = 5.0;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimingOutput {
  temporal_map: Array<{
    shot_id: string;
    rendered_duration: number;
    multiplier: number;
    speed_curve: "LINEAR" | "EASE_IN" | "EASE_OUT";
    sfx_hint: string;
  }>;
  duration_budget: {
    target_total: number;
    actual_total: number;
    variance: number;
  };
  cost?: number;
}

/**
 * Calculate timing and speed ramps for all shots
 */
export async function calculateTiming(
  input: TimingInput,
  userId: string,
  workspaceId: string
): Promise<TimingOutput> {
  console.log('[social-commerce:agent-4.2] Calculating timing:', {
    sceneCount: input.scenes.length,
    totalShots: input.scenes.reduce((sum, s) => sum + s.shots.length, 0),
    pacing: input.pacing_profile,
    targetDuration: input.total_campaign_duration,
  });

  const userPrompt = buildTimingUserPrompt(input);

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
      console.log(`[social-commerce:agent-4.2] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            input: [
              { role: 'system', content: TIMING_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'timing_output',
                strict: true,
                schema: TIMING_SCHEMA,
              },
            },
            // Conditionally add reasoning if supported (temperature not supported with reasoning)
            ...(supportsReasoning ? { reasoning: { effort: "high" } } : { temperature: AGENT_CONFIG.temperature }),
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 1500,
        }
      );

      // Parse JSON response
      const output = JSON.parse(response.output);

      // Validate structure
      if (!output.temporal_map || !Array.isArray(output.temporal_map)) {
        throw new Error('Invalid output: missing temporal_map array');
      }

      if (!output.duration_budget) {
        throw new Error('Invalid output: missing duration_budget');
      }

      // Validate durations are within bounds
      for (const timing of output.temporal_map) {
        if (timing.rendered_duration < MIN_RENDERED_DURATION || timing.rendered_duration > MAX_RENDERED_DURATION) {
          throw new Error(`Invalid rendered_duration ${timing.rendered_duration} for shot ${timing.shot_id} (must be 0.3-5.0s)`);
        }

        // Validate multiplier calculation
        const expectedMultiplier = Math.round((MODEL_BASE_DURATION / timing.rendered_duration) * 100) / 100;
        if (Math.abs(timing.multiplier - expectedMultiplier) > 0.01) {
          console.warn(`[social-commerce:agent-4.2] Multiplier mismatch for ${timing.shot_id}: got ${timing.multiplier}, expected ${expectedMultiplier}`);
        }
      }

      // Validate budget variance
      const variance = Math.abs(output.duration_budget.variance);
      if (variance > 0.5) {
        console.warn(`[social-commerce:agent-4.2] Duration variance ${variance}s exceeds ±0.5s tolerance`);
      }

      // Calculate cost from usage
      const cost = response.usage ? 
        ((response.usage.inputTokens || 0) * 0.0025 / 1000) + ((response.usage.outputTokens || 0) * 0.01 / 1000) : 
        0;

      console.log('[social-commerce:agent-4.2] Timing calculation complete:', {
        shotCount: output.temporal_map.length,
        actualTotal: output.duration_budget.actual_total,
        variance: output.duration_budget.variance,
        cost,
      });

      return {
        ...output,
        cost
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-4.2] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < AGENT_CONFIG.maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  console.error('[social-commerce:agent-4.2] All attempts failed');
  throw new Error(`Failed to calculate timing after ${AGENT_CONFIG.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

