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
      description: "Precise physical description of product form: dimensions, ratios, shapes, edge treatments, component positions. Must be specific enough to reconstruct the silhouette.",
      minLength: 150,
      maxLength: 600
    },
    material_spec: {
      type: "string" as const,
      description: "PBR-compliant material description: roughness values, metalness, texture patterns, grain direction, transparency properties. Uses technical rendering terminology.",
      minLength: 150,
      maxLength: 600
    },
    hero_anchor_points: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Key visual landmarks for camera focus. Each entry specifies position and visual characteristic.",
      minItems: 4,
      maxItems: 6
    },
    lighting_response: {
      type: "string" as const,
      description: "How product materials react to light: specular behavior, shadow characteristics, caustics, warnings for difficult lighting scenarios.",
      minLength: 150,
      maxLength: 600
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
  // BUILD INTERLEAVED CONTENT ARRAY (Best Practice: Label + Image pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Count images for mapping header
  const imageCount = 1 + (input.macroDetail ? 1 : 0) + (input.materialReference ? 1 : 0);
  
  // Build image mapping header
  let mappingText = "I am providing product images for analysis. Map: Image 1 = Hero Profile (primary product view showing overall shape, proportions, and main features)";
  if (input.macroDetail) {
    mappingText += ", Image 2 = Macro Detail (close-up view showing surface texture, micro-features, and craftsmanship details)";
  }
  if (input.materialReference) {
    mappingText += ", Image 3 = Material Reference (texture and material focus showing surface properties and material behavior)";
  }
  mappingText += ".";
  
  // Build interleaved content array
  const contentArray: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string }> = [];
  
  // STEP 1: Image Mapping Header
  contentArray.push({
    type: "input_text",
    text: mappingText
  });
  
  // STEP 2: Image 1 - Hero Profile (ALWAYS PRESENT)
  contentArray.push({
    type: "input_text",
    text: "--- Image 1: HERO PROFILE ---\nPrimary product view showing overall shape, proportions, and main features."
  });
  contentArray.push({
    type: "input_image",
    image_url: input.heroProfile
  });
  
  // STEP 3: Image 2 - Macro Detail (CONDITIONAL)
  if (input.macroDetail) {
    contentArray.push({
      type: "input_text",
      text: "--- Image 2: MACRO DETAIL ---\nClose-up view showing surface texture, micro-features, and craftsmanship details."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.macroDetail
    });
  }
  
  // STEP 4: Image 3 - Material Reference (CONDITIONAL)
  if (input.materialReference) {
    contentArray.push({
      type: "input_text",
      text: "--- Image 3: MATERIAL REFERENCE ---\nTexture and material focus showing surface properties and material behavior."
    });
    contentArray.push({
      type: "input_image",
      image_url: input.materialReference
    });
  }
  
  // STEP 5: Main Analysis Instructions (after all images)
  const userPrompt = PRODUCT_DNA_USER_PROMPT(input);
  contentArray.push({
    type: "input_text",
    text: userPrompt
  });
  
  console.log(`[agent-2.1] Sending ${imageCount} image(s) to GPT-4o Vision with interleaved pattern`);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-dna-visionary.ts:99',message:'Interleaved content array structure',data:{contentArrayLength:contentArray.length,imageCount,contentTypes:contentArray.map((c:any)=>c?.type),firstContentItem:contentArray[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-4O VISION WITH JSON SCHEMA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const payload = {
    input: [
      { role: 'system', content: PRODUCT_DNA_SYSTEM_PROMPT },
      {
        role: 'user',
        content: contentArray
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "product_dna_output",
        strict: true,
        schema: PRODUCT_DNA_SCHEMA
      }
    },
    temperature: 0.3,
    max_output_tokens: 2000,
  };
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-dna-visionary.ts:117',message:'Full payload before API call',data:{payload:JSON.stringify(payload),contentArray:payload.input[1].content,contentTypes:payload.input[1].content.map((c:any)=>c?.type),firstContentItem:payload.input[1].content[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  try {
    const result = await callTextModel({
      provider: 'openai',
      model: 'gpt-4o',
      userId,
      workspaceId,
      payload,
    });
    
    // Parse JSON response
    const output = JSON.parse(result.output);
    
    // Calculate cost from usage
    const cost = result.usage ? 
      ((result.usage.inputTokens || 0) * 0.0025 / 1000) + ((result.usage.outputTokens || 0) * 0.01 / 1000) : 
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
    // #region agent log
    const errorDetails = error instanceof Error ? error.message : String(error);
    fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-dna-visionary.ts:160',message:'API call failed',data:{error:errorDetails,errorString:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('[agent-2.1] Product DNA analysis failed:', error);
    throw new Error(`Failed to analyze product DNA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

