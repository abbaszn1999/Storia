/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 5.1: PROMPT ARCHITECT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Prompt Architect agent that writes generation-ready prompts for each shot.
 * Uses GPT-5.2 Vision with high reasoning to analyze visual assets and create prompts with @ tag placeholders.
 * 
 * INPUT:
 * - Shot context from Agent 4.1 and 4.2
 * - Visual assets (product, logo, character, style, previous shots)
 * - Previous shot prompts (for connected shots)
 * 
 * OUTPUT:
 * - Image prompts (with @ tags)
 * - Video prompts
 * - Tags used array
 */

import { callTextModel } from '../../../../ai/service';
import { getModelConfig } from '../../../../ai/config';
import {
  PROMPT_ARCHITECT_SYSTEM_PROMPT,
  buildPromptArchitectUserPrompt,
  PROMPT_ARCHITECT_SCHEMA,
} from '../../prompts/tab-5/prompt-architect-prompts';
import type {
  PromptArchitectInput,
  ShotPrompts,
  ShotDefinition,
} from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-5.2', // Vision capable with high reasoning
  temperature: 0.5, // Balanced creativity and precision
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface AssetRegistry {
  product?: {
    heroProfileUrl?: string;
    macroDetailUrl?: string;
    materialReferenceUrl?: string;
  };
  logoUrl?: string;
  characterUrl?: string;
  styleReferenceUrl?: string;
}

interface GeneratedOutput {
  imageUrl?: string;
  endFrameUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITION DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect condition based on shot type and connection status
 */
export function detectCondition(shot: {
  shot_type: 'IMAGE_REF' | 'START_END';
  is_connected_to_previous: boolean;
}): 1 | 2 | 3 | 4 {
  if (shot.shot_type === 'IMAGE_REF') {
    return shot.is_connected_to_previous ? 4 : 1;
  } else if (shot.shot_type === 'START_END') {
    return shot.is_connected_to_previous ? 3 : 2;
  }
  throw new Error(`Invalid shot type: ${shot.shot_type}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// URL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate image URL is accessible before sending to OpenAI
 * Returns true if URL is accessible, false otherwise
 */
async function validateImageUrl(url: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const contentType = response.headers.get('content-type');
    const isValid = response.ok && contentType?.startsWith('image/');
    
    if (!isValid) {
      console.warn(`[social-commerce:agent-5.1] Image URL validation failed: ${url}`, {
        status: response.status,
        contentType,
      });
    }
    
    return isValid;
  } catch (error) {
    console.warn(`[social-commerce:agent-5.1] Image URL validation error: ${url}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE ATTACHMENT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build interleaved content array with images based on identity_references
 * Maps Agent 4.1's decisions to correct images with @ tag instructions
 * Validates URLs before including them (logs warnings but continues on failure)
 */
export async function buildImageAttachments(
  identityReferences: ShotDefinition['identity_references'],
  assets: AssetRegistry,
  previousShotOutputs: Record<string, GeneratedOutput>,
  condition: number
): Promise<Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }>> {
  const contentArray: Array<
    { type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }
  > = [];

  let imageIndex = 1;
  const imageLabels: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT IMAGES (mutually exclusive - only one per shot)
  // ═══════════════════════════════════════════════════════════════════════════

  if (identityReferences.refer_to_product) {
    if (identityReferences.product_image_ref === 'heroProfile' && assets.product?.heroProfileUrl) {
      // Validate URL before adding (non-blocking - log warning if fails)
      const isValid = await validateImageUrl(assets.product.heroProfileUrl);
      if (!isValid) {
        console.warn(`[social-commerce:agent-5.1] Product hero profile URL validation failed, but continuing: ${assets.product.heroProfileUrl}`);
      }
      
      imageLabels.push(`Image ${imageIndex} = Product Hero Profile (use @Product tag)`);
      contentArray.push({
        type: 'input_text',
        text: `--- Image ${imageIndex}: PRODUCT HERO PROFILE (product_image_ref: "heroProfile") ---\nPrimary product view showing overall shape, proportions, and main features. Use @Product tag to reference this image.`,
      });
      contentArray.push({
        type: 'input_image',
        image_url: assets.product.heroProfileUrl,
      });
      imageIndex++;
    } else if (
      identityReferences.product_image_ref === 'macroDetail' &&
      assets.product?.macroDetailUrl
    ) {
      const isValid = await validateImageUrl(assets.product.macroDetailUrl);
      if (!isValid) {
        console.warn(`[social-commerce:agent-5.1] Product macro detail URL validation failed, but continuing: ${assets.product.macroDetailUrl}`);
      }
      
      imageLabels.push(`Image ${imageIndex} = Product Macro Detail (use @Product_Macro tag)`);
      contentArray.push({
        type: 'input_text',
        text: `--- Image ${imageIndex}: PRODUCT MACRO DETAIL (product_image_ref: "macroDetail") ---\nClose-up view showing surface texture, micro-features, and craftsmanship details. Use @Product_Macro tag to reference this image.`,
      });
      contentArray.push({
        type: 'input_image',
        image_url: assets.product.macroDetailUrl,
      });
      imageIndex++;
    } else if (
      identityReferences.product_image_ref === 'materialReference' &&
      assets.product?.materialReferenceUrl
    ) {
      const isValid = await validateImageUrl(assets.product.materialReferenceUrl);
      if (!isValid) {
        console.warn(`[social-commerce:agent-5.1] Material reference URL validation failed, but continuing: ${assets.product.materialReferenceUrl}`);
      }
      
      imageLabels.push(`Image ${imageIndex} = Material Reference (use @Texture tag)`);
      contentArray.push({
        type: 'input_text',
        text: `--- Image ${imageIndex}: MATERIAL REFERENCE (product_image_ref: "materialReference") ---\nTexture and material focus showing surface properties and material behavior. Use @Texture tag to reference this image.`,
      });
      contentArray.push({
        type: 'input_image',
        image_url: assets.product.materialReferenceUrl,
      });
      imageIndex++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND LOGO
  // ═══════════════════════════════════════════════════════════════════════════

  if (identityReferences.refer_to_logo && assets.logoUrl) {
    const isValid = await validateImageUrl(assets.logoUrl);
    if (!isValid) {
      console.warn(`[social-commerce:agent-5.1] Logo URL validation failed, but continuing: ${assets.logoUrl}`);
    }
    
    imageLabels.push(`Image ${imageIndex} = Brand Logo (use @Logo tag)`);
    contentArray.push({
      type: 'input_text',
      text: `--- Image ${imageIndex}: BRAND LOGO ---\nHigh-resolution brand logo for typography and branding preservation. Use @Logo tag to reference this image.`,
    });
    contentArray.push({
      type: 'input_image',
      image_url: assets.logoUrl,
    });
    imageIndex++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARACTER REFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  if (identityReferences.refer_to_character && assets.characterUrl) {
    const isValid = await validateImageUrl(assets.characterUrl);
    if (!isValid) {
      console.warn(`[social-commerce:agent-5.1] Character URL validation failed, but continuing: ${assets.characterUrl}`);
    }
    
    imageLabels.push(`Image ${imageIndex} = Character Reference (use @Character tag)`);
    contentArray.push({
      type: 'input_text',
      text: `--- Image ${imageIndex}: CHARACTER REFERENCE ---\nCharacter reference image for identity consistency in interaction and lifestyle shots. Use @Character tag to reference this image.`,
    });
    contentArray.push({
      type: 'input_image',
      image_url: assets.characterUrl,
    });
    imageIndex++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREVIOUS SHOT OUTPUTS (@Shot_X references)
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    identityReferences.refer_to_previous_outputs &&
    identityReferences.refer_to_previous_outputs.length > 0
  ) {
    for (const ref of identityReferences.refer_to_previous_outputs) {
      const shotOutput = previousShotOutputs[ref.shot_id];
      if (shotOutput) {
        // Use endFrameUrl if available (for START_END shots), else imageUrl
        const imageUrl = shotOutput.endFrameUrl || shotOutput.imageUrl;
        if (imageUrl) {
          const isValid = await validateImageUrl(imageUrl);
          if (!isValid) {
            console.warn(`[social-commerce:agent-5.1] Previous shot output URL validation failed, but continuing: ${imageUrl}`);
          }
          
          imageLabels.push(`Image ${imageIndex} = Shot ${ref.shot_id} Output (use @Shot_${ref.shot_id} tag)`);
          contentArray.push({
            type: 'input_text',
            text: `--- Image ${imageIndex}: SHOT ${ref.shot_id} OUTPUT (reference_type: "${ref.reference_type}") ---\nPrevious shot's generated output for ${ref.reason}. Use @Shot_${ref.shot_id} tag to reference this image.`,
          });
          contentArray.push({
            type: 'input_image',
            image_url: imageUrl,
          });
          imageIndex++;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE MAPPING HEADER (if images exist)
  // ═══════════════════════════════════════════════════════════════════════════

  if (contentArray.length > 0) {
    const mappingHeader = `I am providing ${imageLabels.length} image(s) for prompt generation. Map: ${imageLabels.join(', ')}.`;
    contentArray.unshift({
      type: 'input_text',
      text: mappingHeader,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE: Inherited images are NOT attached
  // ═══════════════════════════════════════════════════════════════════════════

  // For connected shots (Condition 3 & 4), inherited images don't exist yet.
  // Instead, previous shot prompts are provided as text in previous_shot_context.
  // Agent 5.1 will write @StartFrame in end_frame prompts, and Agent 5.2 will
  // inject the inherited image URL during execution.

  return contentArray;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate PromptArchitectInput
 */
function validatePromptArchitectInput(input: PromptArchitectInput): void {
  if (!input.target_shot.shot_id) {
    throw new Error('Missing shot_id in target_shot');
  }

  if (!input.target_shot.shot_type || !['IMAGE_REF', 'START_END'].includes(input.target_shot.shot_type)) {
    throw new Error('Invalid shot_type in target_shot');
  }

  // Validate condition-specific requirements
  const condition = detectCondition(input.target_shot);
  if ((condition === 3 || condition === 4) && !input.previous_shot_context) {
    throw new Error(`Condition ${condition} requires previous_shot_context`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a prompt object is empty (should be normalized to null)
 * Check if prompt is empty (no text or whitespace-only)
 */
function isEmptyPrompt(prompt: any): boolean {
  if (!prompt || typeof prompt !== 'object') return true;
  const text = prompt.text;
  // Consider empty if: no text, empty text, or whitespace-only text
  return !text || typeof text !== 'string' || !text.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate ShotPrompts output matches condition requirements
 */
export function validateShotPromptsOutput(
  output: ShotPrompts,
  condition: 1 | 2 | 3 | 4
): void {
  // Validate condition-specific structure
  if (condition === 1) {
    if (!output.prompts.image || !output.prompts.video) {
      throw new Error('Condition 1 must have image and video prompts');
    }
    if (output.prompts.start_frame || output.prompts.end_frame) {
      throw new Error('Condition 1 must not have start_frame or end_frame');
    }
  } else if (condition === 2) {
    if (!output.prompts.start_frame || !output.prompts.end_frame || !output.prompts.video) {
      throw new Error('Condition 2 must have start_frame, end_frame, and video prompts');
    }
    if (output.prompts.image) {
      throw new Error('Condition 2 must not have image prompt');
    }
    // Check @StartFrame in end_frame
    if (!output.prompts.end_frame.text.includes('@StartFrame')) {
      throw new Error('Condition 2 end_frame prompt must include @StartFrame tag');
    }
  } else if (condition === 3) {
    if (!output.prompts.end_frame || !output.prompts.video) {
      throw new Error('Condition 3 must have end_frame and video prompts');
    }
    if (output.prompts.image || output.prompts.start_frame) {
      throw new Error('Condition 3 must not have image or start_frame prompts');
    }
    // Check @StartFrame in end_frame
    if (!output.prompts.end_frame.text.includes('@StartFrame')) {
      throw new Error('Condition 3 end_frame prompt must include @StartFrame tag');
    }
  } else if (condition === 4) {
    if (!output.prompts.video) {
      throw new Error('Condition 4 must have video prompt');
    }
    if (output.prompts.image || output.prompts.start_frame || output.prompts.end_frame) {
      throw new Error('Condition 4 must not have image, start_frame, or end_frame prompts');
    }
  }

  // Validate all prompts have text
  if (output.prompts.image && !output.prompts.image.text) {
    throw new Error('Image prompt must have text');
  }
  if (output.prompts.start_frame && !output.prompts.start_frame.text) {
    throw new Error('Start frame prompt must have text');
  }
  if (output.prompts.end_frame && !output.prompts.end_frame.text) {
    throw new Error('End frame prompt must have text');
  }
  if (!output.prompts.video.text) {
    throw new Error('Video prompt must have text');
  }

  // No tags_used validation needed - tags are parsed from text by Agent 5.2
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST-PROCESSING (Auto-append @Style)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Post-process prompts to auto-append @Style tag if style is uploaded
 */
export function postProcessPrompts(
  agent51Output: ShotPrompts,
  hasStyleUploaded: boolean
): ShotPrompts {
  const processed = { ...agent51Output };

  if (hasStyleUploaded) {
    const styleAppend = '\n\nStyle Reference: Apply visual style from @Style';

    // Append to image prompt (Condition 1)
    if (processed.prompts.image) {
      processed.prompts.image = {
        ...processed.prompts.image,
        text: processed.prompts.image.text + styleAppend,
      };
    }

    // Append to start_frame prompt (Condition 2)
    if (processed.prompts.start_frame) {
      processed.prompts.start_frame = {
        ...processed.prompts.start_frame,
        text: processed.prompts.start_frame.text + styleAppend,
      };
    }

    // Append to end_frame prompt (Condition 2, 3)
    if (processed.prompts.end_frame) {
      processed.prompts.end_frame = {
        ...processed.prompts.end_frame,
        text: processed.prompts.end_frame.text + styleAppend,
      };
    }

    // Video prompts don't get @Style (not image generation)
  }

  return processed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate prompts for a single shot
 */
export async function generateShotPrompts(
  input: PromptArchitectInput,
  userId: string,
  workspaceId: string
): Promise<ShotPrompts> {
  console.log('[social-commerce:agent-5.1] Generating prompts for shot:', {
    shot_id: input.target_shot.shot_id,
    shot_type: input.target_shot.shot_type,
    is_connected: input.target_shot.is_connected_to_previous,
  });

  // Validate input
  validatePromptArchitectInput(input);

  // Detect condition
  const condition = detectCondition(input.target_shot);
  console.log(`[social-commerce:agent-5.1] Condition: ${condition}`);

  // Build image attachments
  // Extract identity_references from subject_assets (built from shot.identity_references in route handler)
  const identityReferences: ShotDefinition['identity_references'] = {
    refer_to_product: !!input.subject_assets.product,
    product_image_ref: input.subject_assets.product?.image_ref,
    refer_to_character: !!input.subject_assets.character,
    refer_to_logo: !!input.subject_assets.logo,
    refer_to_previous_outputs: input.subject_assets.previous_shots?.map((ref) => ({
      shot_id: ref.shot_id,
      reason: ref.reason,
      reference_type: ref.reference_type as
        | 'VISUAL_CALLBACK'
        | 'LIGHTING_MATCH'
        | 'PRODUCT_STATE'
        | 'COMPOSITION_ECHO',
    })) || [],
  };
  const assets: AssetRegistry = {
    product: input.subject_assets.product
      ? {
          heroProfileUrl:
            input.subject_assets.product.image_ref === 'heroProfile'
              ? input.subject_assets.product.image_url
              : undefined,
          macroDetailUrl:
            input.subject_assets.product.image_ref === 'macroDetail'
              ? input.subject_assets.product.image_url
              : undefined,
          materialReferenceUrl:
            input.subject_assets.product.image_ref === 'materialReference'
              ? input.subject_assets.product.image_url
              : undefined,
        }
      : undefined,
    logoUrl: input.subject_assets.logo?.image_url,
    characterUrl: input.subject_assets.character?.image_url,
    styleReferenceUrl: input.subject_assets.style_reference?.image_url,
  };

  // Build previous shot outputs map
  const previousShotOutputs: Record<string, GeneratedOutput> = {};
  if (input.subject_assets.previous_shots) {
    for (const ref of input.subject_assets.previous_shots) {
      previousShotOutputs[ref.shot_id] = {
        imageUrl: ref.shot_image_url,
        endFrameUrl: ref.shot_image_url, // For now, use same URL (Agent 5.2 will provide endFrameUrl)
      };
    }
  }

  const imageAttachments = await buildImageAttachments(
    identityReferences,
    assets,
    previousShotOutputs,
    condition
  );

  // Build user prompt
  const userPromptText = buildPromptArchitectUserPrompt(input, condition);

  // Build content array (images first, then text prompt)
  const contentArray: Array<
    { type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }
  > = [...imageAttachments];

  // Add user prompt at the end
  contentArray.push({
    type: 'input_text',
    text: userPromptText,
  });

  const imageCount = imageAttachments.filter((item) => item.type === 'input_image').length;
  console.log(
    `[social-commerce:agent-5.1] Sending ${imageCount} image(s) to GPT-5.2 Vision with interleaved pattern`
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK REASONING SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Check if model supports reasoning
  let supportsReasoning = false;
  try {
    const modelConfig = getModelConfig(AGENT_CONFIG.provider, AGENT_CONFIG.model);
    supportsReasoning = modelConfig.metadata?.reasoning === true;
  } catch {
    // Model not found in config, assume no reasoning support
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALL GPT-5.2 VISION WITH JSON SCHEMA
  // ═══════════════════════════════════════════════════════════════════════════

  const payload = {
    input: [
      { role: 'system', content: PROMPT_ARCHITECT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: contentArray,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'shot_prompts_output',
        strict: true,
        schema: PROMPT_ARCHITECT_SCHEMA,
      },
    },
    // Conditionally add reasoning if supported (temperature not supported with reasoning)
    ...(supportsReasoning ? { reasoning: { effort: "high" } } : { temperature: AGENT_CONFIG.temperature }),
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[social-commerce:agent-5.1] Attempt ${attempt}/${AGENT_CONFIG.maxRetries}`);

      const result = await callTextModel({
        provider: AGENT_CONFIG.provider,
        model: AGENT_CONFIG.model,
        userId,
        workspaceId,
        payload,
      });

      // Parse JSON response
      const output: ShotPrompts = JSON.parse(result.output);

      // Normalize empty objects or missing fields to null FIRST
      // OpenAI will return all fields (they're required), but some may be empty objects when not needed
      const normalizedOutput: ShotPrompts = {
        ...output,
        prompts: {
          ...output.prompts,
          // Use isEmptyPrompt to check if prompt is empty
          image: isEmptyPrompt(output.prompts.image) ? null : output.prompts.image,
          start_frame: isEmptyPrompt(output.prompts.start_frame) ? null : output.prompts.start_frame,
          end_frame: isEmptyPrompt(output.prompts.end_frame) ? null : output.prompts.end_frame,
          video: output.prompts.video,
        },
        // Normalize inheritance_note: convert empty strings to null
        inheritance_note: (output.inheritance_note && output.inheritance_note.trim()) ? output.inheritance_note : null,
      };

      // Validate output AFTER normalization
      validateShotPromptsOutput(normalizedOutput, condition);

      // Calculate cost
      const cost = result.cost || 0;

      console.log(`[social-commerce:agent-5.1] Successfully generated prompts for ${normalizedOutput.shot_id}`, {
        condition: normalizedOutput.condition,
        hasImage: !!normalizedOutput.prompts.image,
        hasStartFrame: !!normalizedOutput.prompts.start_frame,
        hasEndFrame: !!normalizedOutput.prompts.end_frame,
        hasVideo: !!normalizedOutput.prompts.video,
        cost,
      });

      return normalizedOutput;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[social-commerce:agent-5.1] Attempt ${attempt} failed:`,
        lastError.message
      );

      if (attempt < AGENT_CONFIG.maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `Failed to generate prompts after ${AGENT_CONFIG.maxRetries} attempts: ${lastError?.message}`
  );
}

