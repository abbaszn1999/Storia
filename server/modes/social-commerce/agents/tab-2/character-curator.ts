/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.2: CAST & CHARACTER CURATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Creates character profiles that fit the campaign strategy and maintain VFX
 * consistency across shots.
 */

import { callTextModel } from '../../../../ai/service';
import { CHARACTER_CURATOR_SYSTEM_PROMPT, CHARACTER_CURATOR_USER_PROMPT } from '../../prompts/tab-2/character-curator-prompts';
import type { CharacterCuratorInput, CharacterAIProfile } from '../../types';

/**
 * JSON Schema for Character Profile output
 */
const CHARACTER_PROFILE_SCHEMA = {
  type: "object" as const,
  properties: {
    character_profile: {
      type: "object" as const,
      properties: {
        identity_id: {
          type: "string" as const,
          description: "Unique reference code for this character (e.g., 'LUXURY_HANDS_V1')"
        },
        character_name: {
          type: "string" as const,
          description: "Short descriptive name (e.g., 'Elegant Hand Model')"
        },
        detailed_persona: {
          type: "string" as const,
          description: "Complete physical specifications including skin tone, age, attire, and features"
        },
        cultural_fit: {
          type: "string" as const,
          description: "Reasoning on how this character resonates with the target audience"
        }
      },
      required: ["identity_id", "character_name", "detailed_persona", "cultural_fit"]
    },
    interaction_protocol: {
      type: "object" as const,
      properties: {
        product_engagement: {
          type: "string" as const,
          description: "Technical rules for how the character holds/interacts with the product"
        },
        motion_limitations: {
          type: "string" as const,
          description: "Physics rules to avoid AI distortion (e.g., speed limits, pose constraints)"
        }
      },
      required: ["product_engagement", "motion_limitations"]
    },
    identity_locking: {
      type: "object" as const,
      properties: {
        strategy: {
          type: "string" as const,
          enum: ["IP_ADAPTER_STRICT", "PROMPT_EMBEDDING", "SEED_CONSISTENCY", "COMBINED"]
        },
        vfx_anchor_tags: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "Specific keywords to force consistency across shots"
        },
        reference_image_required: {
          type: "boolean" as const,
          description: "Whether a reference image is needed for generation"
        }
      },
      required: ["strategy", "vfx_anchor_tags", "reference_image_required"]
    }
  },
  required: ["character_profile", "interaction_protocol", "identity_locking"],
  additionalProperties: false
};

/**
 * Agent 2.2: Cast & Character Curator
 * 
 * Creates a character persona that fits the campaign strategy and can be
 * consistently generated across multiple shots.
 * 
 * CONDITIONAL EXECUTION: Only runs if includeHumanElement === true
 * 
 * @param input - Strategic context and character settings
 * @param userId - User ID for credit tracking
 * @param workspaceId - Workspace ID for credit tracking
 * @returns Complete character profile with interaction rules and VFX strategies
 */
export async function createCharacterProfile(
  input: CharacterCuratorInput,
  userId: string = 'system',
  workspaceId: string = 'system'
): Promise<CharacterAIProfile> {
  console.log('[agent-2.2] Creating character profile...', {
    characterMode: input.characterMode,
    hasReferenceImage: !!input.characterReferenceUrl,
    targetAudience: input.targetAudience,
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD USER PROMPT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const userPrompt = CHARACTER_CURATOR_USER_PROMPT(input);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD MESSAGES (with optional reference image)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const messages: Array<any> = [
    { role: 'system', content: CHARACTER_CURATOR_SYSTEM_PROMPT }
  ];
  
  if (input.characterReferenceUrl) {
    // Include reference image if provided
    messages.push({
      role: 'user',
      content: [
        {
          type: "image_url",
          image_url: { url: input.characterReferenceUrl }
        },
        { type: "text", text: userPrompt }
      ]
    });
  } else {
    // Text-only prompt
    messages.push({
      role: 'user',
      content: userPrompt
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-4O WITH JSON SCHEMA
  // ═══════════════════════════════════════════════════════════════════════════
  
  try {
    const result = await callTextModel({
      provider: 'openai',
      model: 'gpt-4o',
      userId,
      workspaceId,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "character_profile_output",
          strict: true,
          schema: CHARACTER_PROFILE_SCHEMA
        }
      },
      temperature: 0.8, // Higher temperature for creative character generation
      max_tokens: 1500,
    });
    
    // Parse JSON response
    const output = JSON.parse(result.output);
    
    // Calculate cost from usage
    const cost = result.usage ? 
      (result.usage.inputTokens * 0.0025 / 1000) + (result.usage.outputTokens * 0.01 / 1000) : 
      0;
    
    console.log('[agent-2.2] Character profile created:', {
      identityId: output.character_profile.identity_id,
      characterName: output.character_profile.character_name,
      strategy: output.identity_locking.strategy,
      cost,
    });
    
    return {
      ...output.character_profile,
      interaction_protocol: output.interaction_protocol.product_engagement,
      motion_limitations: output.interaction_protocol.motion_limitations,
      identity_locking: output.identity_locking,
      cost
    };
  } catch (error) {
    console.error('[agent-2.2] Character profile creation failed:', error);
    throw new Error(`Failed to create character profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

