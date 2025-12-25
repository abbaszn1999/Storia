/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 3.1: ATMOSPHERIC WORLD-BUILDER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Set Designer agent that creates the Global Visual Manifest — the
 * environmental DNA that every shot in the campaign will inherit.
 * 
 * INPUT:
 * - Strategic context from Agent 1.1
 * - Creative spark from Agent 3.0
 * - Environment inputs from Tab 3 frontend
 * 
 * OUTPUT:
 * - visual_manifest: Lighting, physics, colors, anchor prompt
 */

import { callTextModel } from '../../../../ai/service';
import {
  WORLD_BUILDER_SYSTEM_PROMPT,
  buildWorldBuilderUserPrompt,
  WORLD_BUILDER_SCHEMA,
} from '../../prompts/tab-3/world-builder-prompts';
import type { EnvironmentOutput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o', // Can use vision model if styleReferenceUrl provided
  temperature: 0.5, // Creative atmosphere with technical precision
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface WorldBuilderInput {
  strategic_directives: string;
  optimized_image_instruction: string;
  creative_spark: string;
  environmentConcept: string;
  atmosphericDensity: number;
  cinematicLighting: string;
  visualPreset: string;
  styleReferenceUrl?: string | null;
  environmentBrandPrimaryColor?: string;
  environmentBrandSecondaryColor?: string;
}

/**
 * Build atmospheric world manifest from environment inputs
 */
export async function buildEnvironment(
  input: WorldBuilderInput,
  userId: string,
  workspaceId: string
): Promise<EnvironmentOutput> {
  console.log('[social-commerce:agent-3.1] Building environment:', {
    environment: input.environmentConcept.substring(0, 50),
    density: input.atmosphericDensity,
    lighting: input.cinematicLighting,
    hasStyleRef: !!input.styleReferenceUrl,
  });

  const userPrompt = buildWorldBuilderUserPrompt(input);

  // Build input array - include image if style reference provided (interleaved pattern)
  const inputArray: Array<{ role: string; content: string | Array<{ type: string; image_url?: string; text?: string }> }> = [
    { role: 'system', content: WORLD_BUILDER_SYSTEM_PROMPT },
  ];

  if (input.styleReferenceUrl) {
    // Multi-modal input with interleaved pattern (label + image + prompt)
    console.log('[social-commerce:agent-3.1] Including style reference image with interleaved pattern');
    inputArray.push({
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: '--- STYLE REFERENCE IMAGE ---\nAnalyze this image for color extraction, lighting analysis, atmospheric observation, mood interpretation, and render style.',
        },
        {
          type: 'input_image',
          image_url: input.styleReferenceUrl,
        },
        {
          type: 'input_text',
          text: userPrompt,
        },
      ],
    });
  } else {
    inputArray.push({ role: 'user', content: userPrompt });
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-3.1] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            temperature: AGENT_CONFIG.temperature,
            input: inputArray,
            text: {
              format: {
                type: 'json_schema',
                name: 'environment_output',
                strict: true,
                schema: WORLD_BUILDER_SCHEMA,
              },
            },
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 500,
        }
      );

      const rawOutput = response.output.trim();
      const parsed = JSON.parse(rawOutput);

      const output: EnvironmentOutput = {
        visual_manifest: parsed.visual_manifest,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-3.1] Environment built:', {
        hasLighting: !!output.visual_manifest.global_lighting_setup,
        particleType: output.visual_manifest.physics_parameters.particle_type,
        cost: output.cost,
      });

      return output;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-3.1] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < AGENT_CONFIG.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to build environment');
}

