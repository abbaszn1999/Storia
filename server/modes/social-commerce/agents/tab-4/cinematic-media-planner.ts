/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 4.1: CINEMATIC MEDIA PLANNER (THE DIRECTOR)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Director agent that uses Vision-to-Text reasoning to analyze physical assets
 * and campaign constraints. Creates a complete Shot Manifest with scenes and shots.
 * 
 * INPUT:
 * - All context from Tabs 1-3
 * - Visual assets (product images, character, logo)
 * 
 * OUTPUT:
 * - scenes[] with shots[], cinematography, generation_mode, continuity_logic
 * - Does NOT output duration (that's Agent 4.2's job)
 */

import { callTextModel } from '../../../../ai/service';
import {
  MEDIA_PLANNER_SYSTEM_PROMPT,
  buildMediaPlannerUserPrompt,
  MEDIA_PLANNER_SCHEMA,
  type MediaPlannerInput,
} from '../../prompts/tab-4/media-planner-prompts';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o', // Vision capable
  temperature: 0.6, // Creative shot planning with structural discipline
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface MediaPlannerOutput {
  scenes: Array<{
    scene_id: string;
    scene_name: string;
    scene_description: string;
    shots: Array<{
      shot_id: string;
      cinematic_goal: string;
      brief_description: string;
      technical_cinematography: {
        camera_movement: string;
        lens: string;
        depth_of_field: string;
        framing: "ECU" | "CU" | "MCU" | "MED" | "WIDE";
        motion_intensity: number;
      };
      generation_mode: {
        shot_type: "IMAGE_REF" | "START_END";
        reason: string;
      };
      identity_references: {
        refer_to_product: boolean;
        product_image_ref?: "heroProfile" | "macroDetail" | "materialReference";
        refer_to_character: boolean;
        refer_to_logo: boolean;
        focus_anchor: string;
        refer_to_previous_outputs: Array<{
          shot_id: string;
          reason: string;
          reference_type: "VISUAL_CALLBACK" | "LIGHTING_MATCH" | "PRODUCT_STATE" | "COMPOSITION_ECHO";
        }>;
      };
      continuity_logic: {
        is_connected_to_previous: boolean;
        is_connected_to_next: boolean;
        handover_type: "SEAMLESS_FLOW" | "MATCH_CUT" | "JUMP_CUT";
      };
      composition_safe_zones: string;
      lighting_event: string;
    }>;
  }>;
  cost?: number;
}

/**
 * Plan shots using vision model to analyze product images
 */
export async function planShots(
  input: MediaPlannerInput,
  userId: string,
  workspaceId: string
): Promise<MediaPlannerOutput> {
  console.log('[social-commerce:agent-4.1] Planning shots:', {
    duration: input.duration,
    pacing: input.strategicContext.pacing_profile,
    hasHeroImage: !!input.productImages.heroProfile,
    hasMacro: !!input.productImages.macroDetail,
    hasMaterial: !!input.productImages.materialReference,
    hasCharacter: !!input.characterReferenceUrl,
    hasLogo: !!input.logoUrl,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD IMAGE MESSAGES FOR VISION API (OpenAI Responses API format)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const imageMessages: Array<{ type: "input_image"; image_url: string }> = [];
  
  // Always include hero profile (required)
  if (input.productImages.heroProfile) {
    imageMessages.push({
      type: "input_image",
      image_url: input.productImages.heroProfile
    });
  }
  
  // Include macro detail if provided
  if (input.productImages.macroDetail) {
    imageMessages.push({
      type: "input_image",
      image_url: input.productImages.macroDetail
    });
  }
  
  // Include material reference if provided
  if (input.productImages.materialReference) {
    imageMessages.push({
      type: "input_image",
      image_url: input.productImages.materialReference
    });
  }
  
  // Include character reference if provided
  if (input.characterReferenceUrl) {
    imageMessages.push({
      type: "input_image",
      image_url: input.characterReferenceUrl
    });
  }
  
  // Include logo if provided
  if (input.logoUrl) {
    imageMessages.push({
      type: "input_image",
      image_url: input.logoUrl
    });
  }
  
  console.log(`[social-commerce:agent-4.1] Sending ${imageMessages.length} image(s) to GPT-4o Vision`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD USER PROMPT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const userPrompt = buildMediaPlannerUserPrompt(input);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-4O VISION WITH JSON SCHEMA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const payload = {
    input: [
      { role: 'system', content: MEDIA_PLANNER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          ...imageMessages,
          { type: "input_text", text: userPrompt }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "media_planner_output",
        strict: true,
        schema: MEDIA_PLANNER_SCHEMA
      }
    },
    temperature: AGENT_CONFIG.temperature,
    max_output_tokens: 4000, // Large output for multiple scenes and shots
  };
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-4.1] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);
      
      const result = await callTextModel({
        provider: AGENT_CONFIG.provider,
        model: AGENT_CONFIG.model,
        userId,
        workspaceId,
        payload,
      });
      
      // Parse JSON response
      const output = JSON.parse(result.output);
      
      // Validate structure
      if (!output.scenes || !Array.isArray(output.scenes) || output.scenes.length !== 3) {
        throw new Error('Invalid output: must have exactly 3 scenes');
      }
      
      // Calculate total shots
      const totalShots = output.scenes.reduce((sum: number, scene: any) => sum + (scene.shots?.length || 0), 0);
      
      // Calculate cost from usage
      const cost = result.usage ? 
        ((result.usage.inputTokens || 0) * 0.0025 / 1000) + ((result.usage.outputTokens || 0) * 0.01 / 1000) : 
        0;
      
      console.log('[social-commerce:agent-4.1] Shot planning complete:', {
        sceneCount: output.scenes.length,
        totalShots,
        cost,
      });
      
      return {
        ...output,
        cost
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[social-commerce:agent-4.1] Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < AGENT_CONFIG.maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // All retries failed
  console.error('[social-commerce:agent-4.1] All attempts failed');
  throw new Error(`Failed to plan shots after ${AGENT_CONFIG.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

