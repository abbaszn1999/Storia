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
  // BUILD INTERLEAVED CONTENT ARRAY (Best Practice: Label + Image pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Build interleaved content array with labels
  const contentArray: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string }> = [];
  
  // STEP 1: Image Mapping Header
  let mappingText = "I am providing visual assets for shot planning. Map: ";
  const imageLabels: string[] = [];
  let imageIndex = 1;
  
  if (input.productImages.heroProfile) {
    imageLabels.push(`Image ${imageIndex} = Product Hero Profile (primary product view for most shots)`);
    imageIndex++;
  }
  if (input.productImages.macroDetail) {
    imageLabels.push(`Image ${imageIndex} = Product Macro Detail (close-up texture for ECU shots)`);
    imageIndex++;
  }
  if (input.productImages.materialReference) {
    imageLabels.push(`Image ${imageIndex} = Product Material Reference (surface properties for texture shots)`);
    imageIndex++;
  }
  if (input.characterReferenceUrl) {
    imageLabels.push(`Image ${imageIndex} = Character Reference (for interaction and lifestyle shots)`);
    imageIndex++;
  }
  if (input.logoUrl) {
    imageLabels.push(`Image ${imageIndex} = Brand Logo (for branding moments and hero shots)`);
    imageIndex++;
  }
  
  contentArray.push({
    type: "input_text",
    text: mappingText + imageLabels.join(", ") + "."
  });
  
  // STEP 2: Interleave each image with its label
  if (input.productImages.heroProfile) {
    contentArray.push({
      type: "input_text",
      text: "--- PRODUCT HERO PROFILE (product_image_ref: \"heroProfile\") ---\nPrimary product view showing overall shape, proportions, and main features. Use this for most product shots. When you set refer_to_product=true and product_image_ref=\"heroProfile\", this is the image to reference."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.productImages.heroProfile
    });
  }
  
  if (input.productImages.macroDetail) {
    contentArray.push({
      type: "input_text",
      text: "--- PRODUCT MACRO DETAIL (product_image_ref: \"macroDetail\") ---\nClose-up view showing surface texture, micro-features, and craftsmanship details. Use this for ECU shots and texture focus. When you set refer_to_product=true and product_image_ref=\"macroDetail\", this is the image to reference."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.productImages.macroDetail
    });
  }
  
  if (input.productImages.materialReference) {
    contentArray.push({
      type: "input_text",
      text: "--- PRODUCT MATERIAL REFERENCE (product_image_ref: \"materialReference\") ---\nTexture and material focus showing surface properties and material behavior. Use this for material-specific shots. When you set refer_to_product=true and product_image_ref=\"materialReference\", this is the image to reference."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.productImages.materialReference
    });
  }
  
  if (input.characterReferenceUrl) {
    contentArray.push({
      type: "input_text",
      text: "--- CHARACTER REFERENCE (refer_to_character: true) ---\nCharacter reference image showing appearance, interaction possibilities, and physical characteristics. Use when refer_to_character is true for interaction shots, lifestyle moments, and product-in-use scenes."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.characterReferenceUrl
    });
  }
  
  if (input.logoUrl) {
    contentArray.push({
      type: "input_text",
      text: "--- BRAND LOGO (refer_to_logo: true) ---\nBrand logo image showing shape, placement, and integration options. Use when refer_to_logo is true for branding moments, hero shots, and final payoff scenes."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.logoUrl
    });
  }
  
  // STEP 3: Main user prompt (after all images)
  const userPrompt = buildMediaPlannerUserPrompt(input);
  contentArray.push({
    type: "input_text",
    text: userPrompt
  });
  
  const imageCount = imageIndex - 1;
  console.log(`[social-commerce:agent-4.1] Sending ${imageCount} image(s) to GPT-4o Vision with interleaved pattern`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-4O VISION WITH JSON SCHEMA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const payload = {
    input: [
      { role: 'system', content: MEDIA_PLANNER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: contentArray
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

