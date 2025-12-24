/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 3.0: CREATIVE CONCEPT CATALYST
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Creative Director agent that synthesizes campaign strategy, product DNA,
 * and cultural context into a singular high-concept creative "Spark".
 * 
 * INPUT:
 * - Strategic context from Agent 1.1
 * - Product DNA from Agent 2.1
 * - Character profile from Agent 2.2 (if applicable)
 * 
 * OUTPUT:
 * - creative_spark: 2-4 sentence conceptual vision
 */

import { callTextModel } from '../../../../ai/service';
import {
  CREATIVE_SPARK_SYSTEM_PROMPT,
  buildCreativeSparkUserPrompt,
  CREATIVE_SPARK_SCHEMA,
} from '../../prompts/tab-3/creative-spark-prompts';
import type { CreativeSparkOutput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o',
  temperature: 0.7, // Higher creativity for concept generation
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreativeSparkInput {
  strategic_directives: string;
  targetAudience: string;
  region: string;
  duration: number;
  pacing_profile: string;
  geometry_profile: string;
  material_spec: string;
  heroFeature: string;
  originMetaphor: string;
  includeHumanElement: boolean;
  characterMode?: string;
  character_profile?: any;
}

/**
 * Generate creative spark from campaign context and product DNA
 */
export async function generateCreativeSpark(
  input: CreativeSparkInput,
  userId: string,
  workspaceId: string
): Promise<CreativeSparkOutput> {
  console.log('[social-commerce:agent-3.0] Generating creative spark:', {
    audience: input.targetAudience,
    region: input.region,
    hasCharacter: input.includeHumanElement,
  });

  const userPrompt = buildCreativeSparkUserPrompt(input);
  
  console.log('[social-commerce:agent-3.0] User prompt length:', userPrompt.length);
  console.log('[social-commerce:agent-3.0] Input validation:', {
    hasStrategicDirectives: !!input.strategic_directives && input.strategic_directives.length > 0,
    hasTargetAudience: !!input.targetAudience,
    hasGeometryProfile: !!input.geometry_profile && input.geometry_profile.length > 0,
    hasMaterialSpec: !!input.material_spec && input.material_spec.length > 0,
    strategicDirectivesLength: input.strategic_directives?.length || 0,
    geometryProfileLength: input.geometry_profile?.length || 0,
    materialSpecLength: input.material_spec?.length || 0,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-3.0] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);
      console.log('[social-commerce:agent-3.0] Calling OpenAI with:', {
        model: AGENT_CONFIG.model,
        temperature: AGENT_CONFIG.temperature,
        systemPromptLength: CREATIVE_SPARK_SYSTEM_PROMPT.length,
        userPromptLength: userPrompt.length,
      });

      const response = await callTextModel(
        {
          provider: AGENT_CONFIG.provider,
          model: AGENT_CONFIG.model,
          payload: {
            temperature: AGENT_CONFIG.temperature,
            input: [
              { role: 'system', content: CREATIVE_SPARK_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'creative_spark_output',
                strict: true,
                schema: CREATIVE_SPARK_SCHEMA,
              },
            },
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens: 300,
        }
      );

      console.log('[social-commerce:agent-3.0] Raw response received:', {
        hasOutput: !!response.output,
        outputLength: response.output?.length || 0,
        outputPreview: response.output?.substring(0, 200),
        hasUsage: !!response.usage,
        cost: response.usage?.totalCostUsd,
      });

      if (!response.output || response.output.trim().length === 0) {
        throw new Error('Empty response from AI model');
      }

      const rawOutput = response.output.trim();
      
      // Try to parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(rawOutput);
      } catch (parseError) {
        console.error('[social-commerce:agent-3.0] JSON parse error:', {
          rawOutput: rawOutput.substring(0, 500),
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      console.log('[social-commerce:agent-3.0] Parsed JSON:', {
        hasCreativeSpark: !!parsed.creative_spark,
        creativeSparkType: typeof parsed.creative_spark,
        creativeSparkLength: parsed.creative_spark?.length || 0,
        keys: Object.keys(parsed),
      });

      if (!parsed.creative_spark || typeof parsed.creative_spark !== 'string') {
        throw new Error(`Invalid response structure: creative_spark is missing or not a string. Got: ${JSON.stringify(parsed)}`);
      }

      if (parsed.creative_spark.trim().length < 50) {
        console.warn('[social-commerce:agent-3.0] Creative spark seems too short:', parsed.creative_spark);
      }

      const output: CreativeSparkOutput = {
        creative_spark: parsed.creative_spark as string,
        cost: response.usage?.totalCostUsd,
      };

      console.log('[social-commerce:agent-3.0] Creative spark generated successfully:', {
        sparkLength: output.creative_spark.length,
        sparkPreview: output.creative_spark.substring(0, 150) + '...',
        cost: output.cost,
      });

      return output;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-3.0] Attempt ${attempt} failed:`, {
        error: lastError.message,
        stack: lastError.stack,
      });

      if (attempt < AGENT_CONFIG.maxRetries) {
        console.log(`[social-commerce:agent-3.0] Retrying in ${1000 * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to generate creative spark');
}

