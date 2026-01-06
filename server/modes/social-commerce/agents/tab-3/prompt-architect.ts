/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 5.1: PROMPT ARCHITECT (NEW BATCH GENERATION)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Prompt Architect agent that generates comprehensive Sora prompts for ALL beats
 * in a single request. Uses multimodal GPT-4o Vision to analyze product images
 * and create production-ready prompts following the approved structure.
 * 
 * INPUT:
 * - ALL beats from Agent 3.2 (Narrative Architect)
 * - Raw user inputs from Tab 1 (replaces Agent 1.1/2.1)
 * - Creative spark from Agent 3.0
 * - Product image for vision analysis
 * - Audio settings from Tab 1
 * 
 * OUTPUT:
 * - Comprehensive Sora prompt for EACH beat (8 seconds each)
 * - Following approved 10-section structure
 * - With all technical rules included
 */

import { callTextModel } from '../../../../ai/service';
import { getModelConfig } from '../../../../ai/config';
import {
  PROMPT_ARCHITECT_SYSTEM_PROMPT,
  buildBatchBeatPromptUserPrompt,
  BEAT_PROMPT_SCHEMA,
} from '../../prompts/tab-3/prompt-architect-prompts';
import type {
  BatchBeatPromptInput,
  BeatPromptOutput,
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
 * Build interleaved content array with product image for vision analysis
 * Simplified: Single product image (hero) for vision analysis
 */
export async function buildImageAttachments(
  productImageUrl: string
): Promise<Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }>> {
  const contentArray: Array<
    { type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }
  > = [];

  if (!productImageUrl) {
    console.warn('[social-commerce:agent-5.1] No product image URL provided');
    return contentArray;
  }

  // Validate image URL
  const isValid = await validateImageUrl(productImageUrl);
  if (!isValid) {
    console.warn(`[social-commerce:agent-5.1] Product image URL validation failed, but continuing: ${productImageUrl}`);
  }
  
  // Add image mapping header
  contentArray.push({
    type: 'input_text',
    text: `I am providing 1 product image for vision analysis. This image is for VISION ANALYSIS ONLY - use it to understand the product and make informed prompt generation decisions. Analyze this image to extract: product geometry (exact dimensions, ratios, shapes), material properties (surface texture, finish, gloss level), hero features (key visual landmarks), color accuracy, and viable camera angles.`,
  });

  // Add product hero image
  contentArray.push({
    type: 'input_text',
    text: `--- PRODUCT HERO IMAGE ---\nPrimary product view showing overall shape, proportions, and main features. Use this for vision analysis to understand product geometry, hero features, material properties, and viable camera angles.`,
  });
  contentArray.push({
    type: 'input_image',
    image_url: productImageUrl,
  });

  return contentArray;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate BatchBeatPromptInput
 */
function validateBatchBeatPromptInput(input: BatchBeatPromptInput): void {
  if (!input.beats || input.beats.length === 0) {
    throw new Error('No beats provided in input');
  }

  if (input.beats.length > 4) {
    throw new Error(`Too many beats provided: ${input.beats.length} (maximum 4)`);
  }

  // Validate each beat
  for (const beat of input.beats) {
    if (!beat.beatId || !['beat1', 'beat2', 'beat3', 'beat4'].includes(beat.beatId)) {
      throw new Error(`Invalid beatId: ${beat.beatId}`);
    }

    if (!beat.beatDescription || beat.beatDescription.trim().length === 0) {
      throw new Error(`Beat ${beat.beatId} has no description`);
    }

    // Validate duration is 8 seconds (fixed for all beats)
    if (beat.duration !== 8) {
      throw new Error(`Beat ${beat.beatId} duration is ${beat.duration}s, must equal 8s`);
    }

    // Validate beat1 is not connected
    if (beat.beatId === 'beat1' && beat.isConnectedToPrevious) {
      throw new Error('Beat1 must have isConnectedToPrevious = false');
    }
  }

  // Validate required context fields (simplified - no Agent 1.1/2.1 dependencies)
  if (!input.productImageUrl) {
    throw new Error('Missing productImageUrl');
  }

  if (!input.productTitle) {
    throw new Error('Missing productTitle');
  }

  if (!input.targetAudience) {
    throw new Error('Missing targetAudience');
  }

  if (!input.visualPreset) {
    throw new Error('Missing visualPreset');
  }

  // creativeSpark is optional (can be empty string)
  // geometry_profile and material_spec removed - extracted from vision analysis
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate BeatPromptOutput matches input requirements
 */
export function validateBeatPromptOutput(
  output: BeatPromptOutput,
  input: BatchBeatPromptInput
): void {
  if (!output.beat_prompts || output.beat_prompts.length === 0) {
    throw new Error('No beat prompts in output');
  }

  if (output.beat_prompts.length !== input.beats.length) {
    throw new Error(`Output has ${output.beat_prompts.length} beats, but input has ${input.beats.length}`);
  }

  // Validate each beat prompt
  for (const beatPrompt of output.beat_prompts) {
    const inputBeat = input.beats.find(b => b.beatId === beatPrompt.beatId);
    if (!inputBeat) {
      throw new Error(`Output beat ${beatPrompt.beatId} not found in input`);
    }

    // Validate beatId matches
    if (beatPrompt.beatId !== inputBeat.beatId) {
      throw new Error(`Beat ID mismatch: output ${beatPrompt.beatId} vs input ${inputBeat.beatId}`);
    }

    // Validate isConnectedToPrevious matches
    if (beatPrompt.isConnectedToPrevious !== inputBeat.isConnectedToPrevious) {
      throw new Error(`Connection status mismatch for ${beatPrompt.beatId}`);
    }

    // Validate input_image_type
    const expectedInputType = beatPrompt.isConnectedToPrevious ? 'previous_frame' : 'hero';
    if (beatPrompt.input_image_type !== expectedInputType) {
      throw new Error(`Input image type mismatch for ${beatPrompt.beatId}: expected ${expectedInputType}, got ${beatPrompt.input_image_type}`);
    }

    // Validate total_duration
    if (beatPrompt.total_duration !== 8) {
      throw new Error(`Total duration mismatch for ${beatPrompt.beatId}: expected 8, got ${beatPrompt.total_duration}`);
    }

    // Validate timeline_segments exist (replaces shots_in_beat)
    if (!beatPrompt.timeline_segments || beatPrompt.timeline_segments.length === 0) {
      throw new Error(`Missing timeline_segments for ${beatPrompt.beatId}`);
    }

    // Validate sora_prompt.text is not empty
    if (!beatPrompt.sora_prompt.text || beatPrompt.sora_prompt.text.trim().length === 0) {
      throw new Error(`Empty sora_prompt.text for ${beatPrompt.beatId}`);
    }

    // Validate sora_prompt.text contains required sections (basic check)
    const promptText = beatPrompt.sora_prompt.text.toLowerCase();
    const requiredSections = [
      'exclusions',
      'reference image lock',
      'timeline',
    ];
    
    for (const section of requiredSections) {
      if (!promptText.includes(section.toLowerCase())) {
        console.warn(`[social-commerce:agent-5.1] Warning: ${beatPrompt.beatId} prompt may be missing section: ${section}`);
      }
    }

    // Validate non-connected beats have 0.1s first shot mentioned
    if (!beatPrompt.isConnectedToPrevious) {
      if (!promptText.includes('0.1') && !promptText.includes('0.0-0.1')) {
        console.warn(`[social-commerce:agent-5.1] Warning: ${beatPrompt.beatId} (non-connected) may be missing 0.1s first shot rule`);
      }
    }

    // Validate connected beats have final frame requirements
    if (beatPrompt.isConnectedToPrevious) {
      if (!promptText.includes('final frame') && !promptText.includes('final frame requirements')) {
        console.warn(`[social-commerce:agent-5.1] Warning: ${beatPrompt.beatId} (connected) may be missing FINAL FRAME REQUIREMENTS section`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate comprehensive Sora prompts for ALL beats in a single request
 */
export async function generateBeatPrompts(
  input: BatchBeatPromptInput,
  userId: string,
  workspaceId: string
): Promise<BeatPromptOutput> {
  console.log('[social-commerce:agent-5.1] Generating prompts for beats:', {
    beatCount: input.beats.length,
    beatIds: input.beats.map(b => b.beatId),
    connectionStrategy: input.connection_strategy,
  });

  // Validate input
  validateBatchBeatPromptInput(input);

  // Build image attachments for vision analysis
  const imageAttachments = await buildImageAttachments(input.productImageUrl);

  // Build user prompt
  const userPromptText = buildBatchBeatPromptUserPrompt(input);

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
    `[social-commerce:agent-5.1] Sending ${imageCount} product image(s) to GPT-5.2 Vision with interleaved pattern`
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
        name: 'beat_prompts_output',
        strict: true,
        schema: BEAT_PROMPT_SCHEMA,
      },
    },
    // Conditionally add reasoning if supported (temperature not supported with reasoning)
    ...(supportsReasoning ? { reasoning: { effort: "medium" } } : { temperature: AGENT_CONFIG.temperature }),
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
      const output: BeatPromptOutput = JSON.parse(result.output);

      // Validate output
      validateBeatPromptOutput(output, input);

      // Calculate cost
      const cost = result.cost || 0;

      console.log(`[social-commerce:agent-5.1] Successfully generated prompts for ${output.beat_prompts.length} beat(s)`, {
        beatIds: output.beat_prompts.map(bp => bp.beatId),
        cost,
      });

      return {
        ...output,
        cost,
      };
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
    `Failed to generate beat prompts after ${AGENT_CONFIG.maxRetries} attempts: ${lastError?.message}`
  );
}
