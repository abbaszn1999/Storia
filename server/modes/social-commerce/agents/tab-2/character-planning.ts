/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.2a: CHARACTER PLANNING (AI RECOMMEND)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates 3 character recommendations based on user description and/or
 * reference image. Runs when user clicks "AI Recommend" button.
 * 
 * Input scenarios:
 * 1. Description only → Text-based generation
 * 2. Reference image only → Vision-based analysis
 * 3. Both description + reference → Combined approach
 * 4. Neither → Should not run (validated before call)
 */

import { callTextModel } from '../../../../ai/service';
import { 
  CHARACTER_PLANNING_SYSTEM_PROMPT, 
  CHARACTER_PLANNING_USER_PROMPT 
} from '../../prompts/tab-2/character-planning-prompts';
import type { CharacterPlanningInput, CharacterPlanningOutput } from '../../types';

/**
 * JSON Schema for Character Planning output (Agent 2.2a)
 * Each recommendation is a COMPLETE profile ready for Agent 2.2b execution
 * NOTE: OpenAI strict mode requires additionalProperties: false on ALL nested objects
 */
const CHARACTER_PLANNING_SCHEMA = {
  type: "object" as const,
  properties: {
    recommendations: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: {
            type: "string" as const,
            description: "Unique identifier (REC_ASPIRATIONAL_001, REC_RELATABLE_002, REC_DISTINCTIVE_003)"
          },
          name: {
            type: "string" as const,
            description: "Short, evocative name for this character concept"
          },
          mode: {
            type: "string" as const,
            enum: ["hand-model", "full-body", "silhouette"],
            description: "Character presentation mode"
          },
          character_profile: {
            type: "object" as const,
            properties: {
              identity_id: {
                type: "string" as const,
                description: "Unique reference code (e.g., 'LUXURY_ELEGANT_F1')"
              },
          detailed_persona: {
            type: "string" as const,
            description: "Complete physical specification (4-6 sentences)",
            minLength: 200,
            maxLength: 600
          },
          cultural_fit: {
            type: "string" as const,
            description: "How character matches target audience (2-3 sentences)",
            minLength: 80,
            maxLength: 300
          }
            },
            required: ["identity_id", "detailed_persona", "cultural_fit"],
            additionalProperties: false
          },
          appearance: {
            type: "object" as const,
            properties: {
              age_range: {
                type: "string" as const,
                description: "Age range like '25-35'"
              },
              skin_tone: {
                type: "string" as const,
                description: "Detailed skin tone with undertones"
              },
              build: {
                type: "string" as const,
                description: "Body type and posture description"
              },
              style_notes: {
                type: "string" as const,
                description: "Key visual characteristics, attire, grooming"
              }
            },
            required: ["age_range", "skin_tone", "build", "style_notes"],
            additionalProperties: false
          },
          interaction_protocol: {
            type: "object" as const,
            properties: {
              product_engagement: {
                type: "string" as const,
                description: "Technical rules for product interaction (2-4 sentences)",
                minLength: 80,
                maxLength: 400
              },
              motion_limitations: {
                type: "string" as const,
                description: "AI-safe movement constraints (2-4 sentences)",
                minLength: 80,
                maxLength: 400
              }
            },
            required: ["product_engagement", "motion_limitations"],
            additionalProperties: false
          },
          identity_locking: {
            type: "object" as const,
            properties: {
              strategy: {
                type: "string" as const,
                enum: ["IP_ADAPTER_STRICT", "PROMPT_EMBEDDING", "SEED_CONSISTENCY", "COMBINED"],
                description: "Identity preservation strategy"
              },
              vfx_anchor_tags: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "5-7 keywords for shot-to-shot consistency"
              },
              reference_image_required: {
                type: "boolean" as const,
                description: "Whether image generation needs a reference image"
              }
            },
            required: ["strategy", "vfx_anchor_tags", "reference_image_required"],
            additionalProperties: false
          },
          image_generation_prompt: {
            type: "string" as const,
            description: "Ready-to-use prompt for AI image generation (100-150 words)",
            minLength: 100,
            maxLength: 1000
          },
          thumbnail_prompt: {
            type: "string" as const,
            description: "Concise prompt (50-80 words) for quick preview"
          }
        },
        required: [
          "id", "name", "mode", "character_profile", "appearance",
          "interaction_protocol", "identity_locking", 
          "image_generation_prompt", "thumbnail_prompt"
        ],
        additionalProperties: false
      },
      minItems: 3,
      maxItems: 3,
      description: "Exactly 3 complete character recommendations"
    },
    reasoning: {
      type: "string" as const,
      description: "Brief explanation of the casting strategy"
    }
  },
  required: ["recommendations", "reasoning"],
  additionalProperties: false
};

/**
 * Agent 2.2a: Character Planning
 * 
 * Generates 3 distinct character recommendations based on:
 * - Campaign context (from Tab 1)
 * - User's text description (optional)
 * - Reference image (optional, temporary)
 * 
 * At least one of description or reference image must be provided.
 * 
 * @param input - Planning context and user input
 * @param userId - User ID for credit tracking
 * @param workspaceId - Workspace ID for credit tracking
 * @returns 3 character recommendations with generation prompts
 */
export async function generateCharacterRecommendations(
  input: CharacterPlanningInput,
  userId: string = 'system',
  workspaceId: string = 'system'
): Promise<CharacterPlanningOutput> {
  const hasDescription = input.character_description && input.character_description.trim().length > 0;
  const hasReference = !!input.referenceImageUrl;
  
  // Determine generation mode
  const mode = !hasDescription && !hasReference 
    ? 'context-only' 
    : hasDescription && hasReference 
    ? 'both' 
    : hasDescription 
    ? 'description-only' 
    : 'reference-only';
  
  console.log('[agent-2.2a] Generating character recommendations...', {
    characterMode: input.characterMode,
    inputMode: mode,
    hasDescription,
    hasReference,
    descriptionLength: input.character_description?.length || 0,
    targetAudience: input.targetAudience,
    product: input.productTitle,
  });
  
  // No validation needed - agent can work from campaign context alone
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD USER PROMPT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const userPrompt = CHARACTER_PLANNING_USER_PROMPT(input);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD INPUT MESSAGES (OpenAI Responses API format)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const inputMessages: Array<any> = [
    { role: 'system', content: CHARACTER_PLANNING_SYSTEM_PROMPT }
  ];
  
  if (hasReference) {
    // Include reference image with interleaved pattern (best practice)
    console.log('[agent-2.2a] Including reference image in request with interleaved pattern');
    inputMessages.push({
      role: 'user',
      content: [
        {
          type: "input_text",
          text: "--- CHARACTER REFERENCE IMAGE ---\nAnalyze this reference image for physical characteristics (skin tone, build, age indicators), style elements (attire, accessories, grooming), mood and energy conveyed, and any distinctive features to incorporate."
        },
        {
          type: "input_image",
          image_url: input.referenceImageUrl!
        },
        { type: "input_text", text: userPrompt }
      ]
    });
  } else {
    // Text-only request
    inputMessages.push({
      role: 'user',
      content: userPrompt
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-4O WITH JSON SCHEMA (OpenAI Responses API format)
  // ═══════════════════════════════════════════════════════════════════════════
  
  try {
    console.log('[agent-2.2a] Calling GPT-4o for character recommendations...');
    
    const result = await callTextModel({
      provider: 'openai',
      model: 'gpt-4o',
      userId,
      workspaceId,
      payload: {
        input: inputMessages,
        text: {
          format: {
            type: "json_schema",
            name: "character_planning_output",
            strict: true,
            schema: CHARACTER_PLANNING_SCHEMA
          }
        },
        temperature: 0.6, // Balanced creativity with consistency (as per finalized document)
        max_output_tokens: 4000,  // Longer output for 3 detailed recommendations
      },
    });
    
    // Parse JSON response
    const output = JSON.parse(result.output) as CharacterPlanningOutput;
    
    // Calculate cost from usage
    const cost = result.usage ? 
      ((result.usage.inputTokens || 0) * 0.0025 / 1000) + ((result.usage.outputTokens || 0) * 0.01 / 1000) : 
      0;
    
    console.log('[agent-2.2a] Character recommendations generated:', {
      count: output.recommendations.length,
      names: output.recommendations.map(r => r.name),
      modes: output.recommendations.map(r => r.mode),
      cost,
    });
    
    // Validate we got exactly 3 recommendations
    if (output.recommendations.length !== 3) {
      console.warn(`[agent-2.2a] Expected 3 recommendations, got ${output.recommendations.length}`);
    }
    
    return {
      ...output,
      cost
    };
  } catch (error) {
    console.error('[agent-2.2a] Character planning failed:', error);
    throw new Error(`Failed to generate character recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

