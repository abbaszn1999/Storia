/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.1: PRODUCT DNA VISIONARY
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Analyzes product images using GPT-4o Vision to extract high-fidelity geometric
 * metadata and material physics.
 */

import { callTextModel } from '../../../../ai/service';
import { PRODUCT_DNA_SYSTEM_PROMPT, PRODUCT_DNA_USER_PROMPT } from '../../prompts/tab-2/product-dna-prompts';
import type { ProductDNAInput, ProductDNAOutput } from '../../types';

/**
 * JSON Schema for Product DNA output
 * Ensures structured, validated responses from GPT-4o
 */
const PRODUCT_DNA_SCHEMA = {
  type: "object" as const,
  properties: {
    geometry_profile: {
      type: "string" as const,
      description: "Mathematical description of product shape, silhouette, proportions, and component relationships"
    },
    material_spec: {
      type: "string" as const,
      description: "Technical texture specifications including surface type, PBR properties, and micro-details"
    },
    hero_anchor_points: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Array of 3-5 key visual landmarks with position and camera affinity",
      minItems: 3,
      maxItems: 5
    },
    lighting_response: {
      type: "string" as const,
      description: "Physics-based rules for how the product interacts with light"
    }
  },
  required: ["geometry_profile", "material_spec", "hero_anchor_points", "lighting_response"],
  additionalProperties: false
};

/**
 * Agent 2.1: Product DNA Visionary
 * 
 * Analyzes 1-3 product images to extract the "Physical Soul" of the product.
 * Uses GPT-4o Vision with JSON schema for structured output.
 * 
 * @param input - Product images and material settings
 * @param userId - User ID for credit tracking
 * @param workspaceId - Workspace ID for credit tracking
 * @returns Geometric profile, material specs, anchor points, and lighting response
 */
export async function analyzeProductDNA(
  input: ProductDNAInput,
  userId: string = 'system',
  workspaceId: string = 'system'
): Promise<ProductDNAOutput> {
  console.log('[agent-2.1] Analyzing product DNA...', {
    heroProfile: !!input.heroProfile,
    macroDetail: !!input.macroDetail,
    materialReference: !!input.materialReference,
    materialPreset: input.materialPreset,
    surfaceComplexity: input.surfaceComplexity,
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD IMAGE MESSAGES FOR VISION API
  // ═══════════════════════════════════════════════════════════════════════════
  
  const imageMessages: Array<{ type: "image_url"; image_url: { url: string } }> = [];
  
  // Always include hero profile (required)
  imageMessages.push({
    type: "image_url",
    image_url: { url: input.heroProfile }
  });
  
  // Include macro detail if provided
  if (input.macroDetail) {
    imageMessages.push({
      type: "image_url",
      image_url: { url: input.macroDetail }
    });
  }
  
  // Include material reference if provided
  if (input.materialReference) {
    imageMessages.push({
      type: "image_url",
      image_url: { url: input.materialReference }
    });
  }
  
  console.log(`[agent-2.1] Sending ${imageMessages.length} image(s) to GPT-4o Vision`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD USER PROMPT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const userPrompt = PRODUCT_DNA_USER_PROMPT(input);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-4O VISION WITH JSON SCHEMA
  // ═══════════════════════════════════════════════════════════════════════════
  
  try {
    const result = await callTextModel({
      provider: 'openai',
      model: 'gpt-4o',
      userId,
      workspaceId,
      messages: [
        { role: 'system', content: PRODUCT_DNA_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            ...imageMessages,
            { type: "text", text: userPrompt }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_dna_output",
          strict: true,
          schema: PRODUCT_DNA_SCHEMA
        }
      },
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Parse JSON response
    const output = JSON.parse(result.output);
    
    // Calculate cost from usage
    const cost = result.usage ? 
      (result.usage.inputTokens * 0.0025 / 1000) + (result.usage.outputTokens * 0.01 / 1000) : 
      0;
    
    console.log('[agent-2.1] Product DNA analysis complete:', {
      geometryLength: output.geometry_profile?.length || 0,
      materialLength: output.material_spec?.length || 0,
      anchorPoints: output.hero_anchor_points?.length || 0,
      cost,
    });
    
    return {
      ...output,
      cost
    };
  } catch (error) {
    console.error('[agent-2.1] Product DNA analysis failed:', error);
    throw new Error(`Failed to analyze product DNA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

