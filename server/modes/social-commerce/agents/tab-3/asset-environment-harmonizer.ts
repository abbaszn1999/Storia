/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 3.3: ASSET-ENVIRONMENT HARMONIZER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The VFX Supervisor agent that ensures assets (products and characters) react
 * believably to the environment, preventing the "pasted-on" look.
 * 
 * INPUT:
 * - Visual manifest from Agent 3.1
 * - Product DNA from Agent 2.1
 * - Character profile from Agent 2.2 (if applicable)
 * 
 * OUTPUT:
 * - interaction_physics: Product/character modifiers and metaphor injection
 */

import { callTextModel } from '../../../../ai/service';
import {
  HARMONIZER_SYSTEM_PROMPT,
  buildHarmonizerUserPrompt,
  HARMONIZER_SCHEMA,
} from '../../prompts/tab-3/harmonizer-prompts';
import type { HarmonizerOutput, EnvironmentOutput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o',
  temperature: 0.4, // Precise technical reasoning
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface HarmonizerInput {
  visual_manifest: EnvironmentOutput['visual_manifest'];
  geometry_profile: string;
  material_spec: string;
  heroFeature: string;
  originMetaphor: string;
  includeHumanElement: boolean;
  characterMode?: string;
  character_profile?: any;
}

/**
 * Harmonize assets with environment to prevent "pasted-on" look
 */
export async function harmonizeAssets(
  input: HarmonizerInput,
  userId: string,
  workspaceId: string
): Promise<HarmonizerOutput> {
  console.log('[social-commerce:agent-3.3] Harmonizing assets:', {
    hasCharacter: input.includeHumanElement,
    particleType: input.visual_manifest.physics_parameters.particle_type,
    fogDensity: input.visual_manifest.physics_parameters.fog_density,
  });

  const userPrompt = buildHarmonizerUserPrompt(input);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-3.3] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            temperature: AGENT_CONFIG.temperature,
            input: [
              { role: 'system', content: HARMONIZER_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'harmonizer_output',
                strict: true,
                schema: HARMONIZER_SCHEMA,
              },
            },
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 400,
        }
      );

      const rawOutput = response.output.trim();
      const parsed = JSON.parse(rawOutput);

      const output: HarmonizerOutput = {
        interaction_physics: parsed.interaction_physics,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-3.3] Assets harmonized:', {
        hasProductModifiers: !!output.interaction_physics.product_modifiers,
        hasCharacterModifiers: !!output.interaction_physics.character_modifiers,
        hasMetaphor: !!output.interaction_physics.metaphor_injection,
        cost: output.cost,
      });

      return output;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-3.3] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < AGENT_CONFIG.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to harmonize assets');
}

