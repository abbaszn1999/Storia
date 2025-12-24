/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 1.1: STRATEGIC CONTEXT OPTIMIZER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Campaign Director agent that transforms raw user inputs into a professional
 * "Visual Bible" guiding all downstream agents in the Social Commerce pipeline.
 * 
 * INPUT:
 * - Product info, target audience, region, duration
 * - User's motion and style preferences (raw text)
 * 
 * OUTPUT:
 * - strategic_directives: Cultural and visual laws
 * - pacing_profile: FAST_CUT | LUXURY_SLOW | KINETIC_RAMP | STEADY_CINEMATIC
 * - optimized_motion_dna: Professional cinematic movement description
 * - optimized_image_instruction: SOTA technical prompts
 */

import { callTextModel } from '../../../../ai/service';
import {
  STRATEGIC_CONTEXT_SYSTEM_PROMPT,
  buildStrategicContextUserPrompt,
  validateStrategicContextOutput,
} from '../../prompts/tab-1/strategic-context-prompts';
import type { StrategicContextInput, StrategicContextOutput } from '../../types';
import type { PacingProfile } from '../../config';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o', // GPT-4o for balanced reasoning
  temperature: 0.5, // Balanced: creative yet consistent
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// JSON PARSING HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
function parseJsonResponse(response: string): Record<string, unknown> {
  // Try to extract JSON from markdown code block
  const jsonBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1].trim());
  }

  // Try direct parse
  const trimmed = response.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  // Try to find JSON object in response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('No valid JSON found in response');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate optimized strategic context from user inputs
 * 
 * @param input - Raw campaign inputs from Tab 1
 * @param userId - User ID for billing
 * @param workspaceId - Workspace ID for billing
 * @returns Strategic context output for downstream agents
 */
export async function optimizeStrategicContext(
  input: StrategicContextInput,
  userId: string,
  workspaceId: string
): Promise<StrategicContextOutput> {
  console.log('[social-commerce:agent-1.1] Optimizing strategic context:', {
    product: input.productTitle,
    audience: input.targetAudience,
    duration: input.duration,
    region: input.region,
  });

  // Build user prompt
  const userPrompt = buildStrategicContextUserPrompt(input);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-1.1] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            temperature: AGENT_CONFIG.temperature,
            input: [
              { role: 'system', content: STRATEGIC_CONTEXT_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'strategic_context_output',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    strategic_directives: {
                      type: 'string',
                      description: '4-8 sentences covering cultural laws, visual hierarchy, emotional targeting, and quality standards',
                    },
                    pacing_profile: {
                      type: 'string',
                      enum: ['FAST_CUT', 'LUXURY_SLOW', 'KINETIC_RAMP', 'STEADY_CINEMATIC'],
                      description: 'Rhythmic profile determining shot durations and transitions',
                    },
                    optimized_motion_dna: {
                      type: 'string',
                      description: 'Professional cinematic movement description with camera/lens/timing specs (3-5 sentences)',
                    },
                    optimized_image_instruction: {
                      type: 'string',
                      description: 'SOTA technical prompt with render quality, materials, lighting, lens, post-processing (3-5 sentences)',
                    },
                  },
                  required: ['strategic_directives', 'pacing_profile', 'optimized_motion_dna', 'optimized_image_instruction'],
                  additionalProperties: false,
                },
              },
            },
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 800, // ~4-8 sentences per field
        }
      );

      const rawOutput = response.output.trim();
      console.log('[social-commerce:agent-1.1] Raw response length:', rawOutput.length);

      // Parse JSON response (structured output from JSON schema)
      const parsed = JSON.parse(rawOutput);

      // Validate output
      const validation = validateStrategicContextOutput(parsed);
      if (!validation.valid) {
        console.warn('[social-commerce:agent-1.1] Validation failed:', validation.errors);
        throw new Error(`Invalid output: ${validation.errors.join(', ')}`);
      }

      const output: StrategicContextOutput = {
        strategic_directives: parsed.strategic_directives as string,
        pacing_profile: parsed.pacing_profile as PacingProfile,
        optimized_motion_dna: parsed.optimized_motion_dna as string,
        optimized_image_instruction: parsed.optimized_image_instruction as string,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-1.1] Strategic context generated:', {
        pacingProfile: output.pacing_profile,
        directivesLength: output.strategic_directives.length,
        motionDnaLength: output.optimized_motion_dna.length,
        imageInstructionLength: output.optimized_image_instruction.length,
        cost: output.cost,
      });

      return output;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-1.1] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < AGENT_CONFIG.maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  console.error('[social-commerce:agent-1.1] All attempts failed, throwing error');
  throw lastError || new Error('Failed to generate strategic context');
}

/**
 * Get default strategic context for fallback
 * Used when AI generation fails and user wants to proceed anyway
 */
export function getDefaultStrategicContext(input: StrategicContextInput): StrategicContextOutput {
  // Determine pacing based on duration
  let pacingProfile: PacingProfile = 'STEADY_CINEMATIC';
  if (input.duration <= 15) {
    pacingProfile = 'FAST_CUT';
  } else if (input.duration <= 30) {
    pacingProfile = 'KINETIC_RAMP';
  } else if (input.duration >= 20) {
    pacingProfile = 'STEADY_CINEMATIC';
  }

  return {
    strategic_directives: `Create visually compelling content for ${input.targetAudience} audience. Focus on premium product presentation with attention to lighting and composition. Maintain brand consistency and cultural relevance${input.region ? ` for ${input.region} market` : ''}. Ensure every frame communicates quality and aspiration.`,
    pacing_profile: pacingProfile,
    optimized_motion_dna: input.customMotionInstructions || 
      'Smooth camera movements with controlled dolly and orbital motion. Focus on product details with rack focus transitions. Maintain professional stabilization throughout.',
    optimized_image_instruction: input.customImageInstructions || 
      'High-quality cinematic render with photorealistic materials and professional lighting. Clean composition with shallow depth of field. Premium color grading.',
  };
}


