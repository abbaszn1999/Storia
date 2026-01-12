/**
 * Composite Prompt Architect Agent
 * 
 * Analyzes uploaded images and user context to generate detailed prompts
 * for Nano Banana Pro (via Runware) to create composite grid images.
 */

import { callTextModel } from '../../../ai/service';
import { getModelConfig } from '../../../ai/config';

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
    const isValid = response.ok && (contentType?.startsWith('image/') ?? false);
    
    if (!isValid) {
      console.warn(`[composite-prompt-architect] Image URL validation failed: ${url}`, {
        status: response.status,
        contentType,
      });
    }
    
    return isValid;
  } catch (error) {
    console.warn(`[composite-prompt-architect] Image URL validation error: ${url}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export interface CompositePromptInput {
  images: string[]; // CDN URLs (up to 6)
  userContext?: string; // Optional user description
  productTitle?: string; // From step1Data
  productDescription?: string; // From step1Data
  targetAudience?: string; // From step1Data
  aspectRatio?: string; // Default: 9:16
}

export interface CompositePromptOutput {
  prompt: string; // Detailed prompt for Nano Banana
  layoutDescription: string; // How images should be arranged
  styleGuidance: string; // Visual style instructions
  cost: number; // AI call cost
}

/**
 * Analyze images using vision model and generate composite prompt
 */
export async function generateCompositePrompt(
  input: CompositePromptInput,
  userId: string,
  workspaceId: string
): Promise<CompositePromptOutput> {
  const { images, userContext, productTitle, productDescription, targetAudience, aspectRatio = '9:16' } = input;

  if (!images || images.length === 0) {
    throw new Error('At least one image is required');
  }

  if (images.length > 6) {
    throw new Error('Maximum 6 images allowed');
  }

  console.log('[composite-prompt-architect] Starting prompt generation:', {
    imageCount: images.length,
    hasContext: !!userContext,
    productTitle,
  });

  // Build vision analysis prompt - OpenAI GPT-5.2 format with image URLs
  const contentArray: Array<
    { type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }
  > = [];

  const systemPrompt = `You are an expert image analyst and prompt engineer specializing in creating detailed prompts for AI image generation models, specifically for composite/grid layouts.

Your task is to analyze product images and generate a comprehensive, detailed prompt that will guide an AI model (Nano Banana Pro) to create a well-composed grid composite image.

Key requirements:
1. Analyze each image to identify: product type, angles, composition, lighting, style, key features
2. Determine optimal grid layout based on number of images (1-6 images)
3. Generate a detailed prompt that describes:
   - The overall composition and layout
   - Each image's content and position in the grid
   - Visual style, lighting, and background
   - Product details and features
   - Professional, cinematic quality
4. Ensure the prompt is optimized for 9:16 aspect ratio (portrait, mobile-first)
5. The prompt should be specific, detailed, and follow best practices for image generation models

Output format: JSON with fields:
- prompt: The detailed generation prompt (500-800 words)
- layoutDescription: How images are arranged (e.g., "2x3 grid with hero image in top-left")
- styleGuidance: Visual style instructions (lighting, mood, composition)`;

  const userPrompt = `Analyze these ${images.length} product image${images.length > 1 ? 's' : ''} and generate a detailed prompt for creating a composite grid image.

${productTitle ? `Product: ${productTitle}` : ''}
${productDescription ? `Description: ${productDescription}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${userContext ? `User Context: ${userContext}` : ''}

Aspect Ratio: ${aspectRatio}

Please analyze each image and create a comprehensive prompt that will guide the AI to generate a professional composite image with all elements properly arranged in a grid layout.`;

  // DON'T add system prompt to contentArray - it goes in a separate system role message
  
  // Validate and add each image with description
  console.log('[composite-prompt-architect] Processing images:', images.map((url, i) => ({
    index: i + 1,
    url: url.substring(0, 80) + (url.length > 80 ? '...' : ''),
  })));
  
  for (let index = 0; index < images.length; index++) {
    const url = images[index];
    
    // Validate image URL before adding
    const isValid = await validateImageUrl(url);
    if (!isValid) {
      console.warn(`[composite-prompt-architect] Image URL ${index + 1} validation failed, but continuing: ${url.substring(0, 80)}...`);
      // Continue anyway - OpenAI might still accept it, or will give a clearer error
    } else {
      console.log(`[composite-prompt-architect] ✓ Image ${index + 1} validated: ${url.substring(0, 80)}...`);
    }
    
    contentArray.push({
      type: 'input_text',
      text: `--- Image ${index + 1} of ${images.length} ---\nAnalyze this product image for composite generation.`,
    });
    contentArray.push({
      type: 'input_image',
      image_url: url,
    });
  }

  // Add user prompt as text
  contentArray.push({
    type: 'input_text',
    text: userPrompt,
  });

  // Check if model supports reasoning
  let supportsReasoning = false;
  try {
    const modelConfig = getModelConfig('openai', 'gpt-5.2');
    supportsReasoning = modelConfig.metadata?.reasoning === true;
  } catch {
    // Model not found in config, assume no reasoning support
  }

  try {
    // Use GPT-5.2 Vision with reasoning for image analysis
    const payload = {
      input: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: contentArray,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'composite_prompt_output',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The detailed generation prompt (500-800 words)',
              },
              layoutDescription: {
                type: 'string',
                description: 'How images are arranged (e.g., "2x3 grid with hero image in top-left")',
              },
              styleGuidance: {
                type: 'string',
                description: 'Visual style instructions (lighting, mood, composition)',
              },
            },
            required: ['prompt', 'layoutDescription', 'styleGuidance'],
            additionalProperties: false,
          },
        },
      },
      // Use reasoning for GPT-5.2 if supported, otherwise use temperature
      ...(supportsReasoning ? { reasoning: { effort: 'medium' } } : { temperature: 0.7 }),
    };

    console.log('[composite-prompt-architect] Calling GPT-5.2 Vision for analysis...');
    const response = await callTextModel({
      provider: 'openai',
      model: 'gpt-5.2',
      userId,
      workspaceId,
      payload,
    });

    // Parse JSON response
    let parsedResponse: any;
    try {
      const responseText = typeof response.output === 'string' 
        ? response.output 
        : JSON.stringify(response.output);
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // If response is not JSON, try to extract from text
      console.warn('[composite-prompt-architect] Response not in JSON format, attempting to parse...');
      const responseText = typeof response.output === 'string' 
        ? response.output 
        : JSON.stringify(response.output);
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback: create prompt from text
        parsedResponse = {
          prompt: responseText,
          layoutDescription: `${images.length} image${images.length > 1 ? 's' : ''} in grid layout`,
          styleGuidance: 'Professional product photography with clean background',
        };
      }
    }

    const cost = (response as any).cost || 0;

    // Validate and structure output
    const output: CompositePromptOutput = {
      prompt: parsedResponse.prompt || parsedResponse.detailedPrompt || 'Professional product composite image with all elements arranged in a grid layout',
      layoutDescription: parsedResponse.layoutDescription || parsedResponse.layout || `${images.length} image${images.length > 1 ? 's' : ''} in grid layout`,
      styleGuidance: parsedResponse.styleGuidance || parsedResponse.style || 'Professional, cinematic quality with optimal lighting',
      cost,
    };

    // Ensure prompt is detailed enough
    if (output.prompt.length < 200) {
      console.warn('[composite-prompt-architect] Generated prompt is too short, enhancing...');
      output.prompt = `Create a professional composite grid image showing: ${output.prompt}. ${output.styleGuidance}. Arrange ${images.length} product image${images.length > 1 ? 's' : ''} in a ${output.layoutDescription}. Ensure high-quality, cinematic lighting, clean composition, and professional product photography standards.`;
    }

    console.log('[composite-prompt-architect] ✓ Prompt generated:', {
      promptLength: output.prompt.length,
      layout: output.layoutDescription,
      cost,
    });

    return output;
  } catch (error) {
    console.error('[composite-prompt-architect] Error generating prompt:', error);
    throw new Error(`Failed to generate composite prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
