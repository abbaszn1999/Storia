/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 3.2: 3-ACT NARRATIVE ARCHITECT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Screenwriter agent that transforms the creative spark and user beats
 * into a structured Script Manifest with energy levels and SFX cues.
 * 
 * INPUT:
 * - Creative spark from Agent 3.0
 * - Campaign context and user beats from Tab 3
 * 
 * OUTPUT:
 * - script_manifest: 3-act structure with text, emotions, energy, SFX
 */

import { callTextModel } from '../../../../ai/service';
import {
  NARRATIVE_SYSTEM_PROMPT,
  buildNarrativeUserPrompt,
  NARRATIVE_SCHEMA,
} from '../../prompts/tab-3/narrative-prompts';
import type { NarrativeOutput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o',
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
  pacing_profile: string;
  duration: number;
}

/**
 * Create narrative script manifest from creative spark and beats
 */
export async function createNarrative(
  input: NarrativeInput,
  userId: string,
  workspaceId: string
): Promise<NarrativeOutput> {
  console.log('[social-commerce:agent-3.2] Creating narrative:', {
    objective: input.campaignObjective,
    pacing: input.pacing_profile,
    duration: input.duration,
  });

  const userPrompt = buildNarrativeUserPrompt(input);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-3.2] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            temperature: AGENT_CONFIG.temperature,
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
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 600,
        }
      );

      const rawOutput = response.output.trim();
      const parsed = JSON.parse(rawOutput);

      const output: NarrativeOutput = {
        script_manifest: parsed.script_manifest,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-3.2] Narrative created:', {
        act1Energy: output.script_manifest.act_1_hook.target_energy,
        act2Energy: output.script_manifest.act_2_transform.target_energy,
        act3Energy: output.script_manifest.act_3_payoff.target_energy,
        hasCta: !!output.script_manifest.act_3_payoff.cta_text,
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

  throw lastError || new Error('Failed to create narrative');
}

