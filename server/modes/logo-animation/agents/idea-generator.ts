// Logo Animation Idea Generator Agent
// Generates creative visual prompts for logo animations

import { callTextModel } from "../../../ai/service";
import { buildLogoIdeaUserPrompt, buildLogoIdeaSystemPrompt } from "../prompts/idea-prompts";

const CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o",
};

export interface LogoIdeaGeneratorInput {
  /** User's simple idea or logo description */
  idea: string;
  /** Video duration in seconds (4, 6, or 8) */
  duration: number;
  /** Reference image URL (base64 data URL or external URL) - optional */
  referenceImage?: string;
}

export interface LogoIdeaGeneratorOutput {
  /** Generated visual prompt for logo animation */
  visualPrompt: string;
  /** Cost of generation */
  cost?: number;
}

/**
 * Build content array with reference image (if provided)
 * Uses the same pattern as storyboard-enhancer.ts for consistency
 */
function buildImageAttachments(
  referenceImageUrl?: string
): Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string }> {
  const contentArray: Array<
    { type: "input_text"; text: string } | { type: "input_image"; image_url: string }
  > = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERENCE IMAGE (Logo Reference)
  // ═══════════════════════════════════════════════════════════════════════════
  if (referenceImageUrl) {
    // Image provided - add image with label
    contentArray.push({
      type: "input_text",
      text: "--- LOGO REFERENCE IMAGE ---\nAnalyze this logo image carefully. Pay attention to:\n- Logo design, shapes, and typography\n- Colors and color scheme\n- Style and aesthetic (minimalist, bold, elegant, etc.)\n- Visual elements and details\n- Overall brand personality\n\nUse this logo as the primary reference for creating the animation visual prompt. The animation should showcase this specific logo, maintaining its design integrity while adding dynamic motion, camera movements, and visual effects."
    });
    contentArray.push({
      type: "input_image",
      image_url: referenceImageUrl
    });
  }

  return contentArray;
}

/**
 * Generate a creative visual prompt for logo animation
 */
export async function generateLogoIdea(
  input: LogoIdeaGeneratorInput
): Promise<LogoIdeaGeneratorOutput> {
  const { idea, duration, referenceImage } = input;

  // Build prompts
  const systemPrompt = buildLogoIdeaSystemPrompt(!!referenceImage);
  const userPrompt = buildLogoIdeaUserPrompt({ idea, duration, hasReferenceImage: !!referenceImage });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD INTERLEAVED CONTENT ARRAY (Images + Text)
  // ═══════════════════════════════════════════════════════════════════════════
  const imageAttachments = buildImageAttachments(referenceImage);

  // Build content array (images first, then text prompt)
  const contentArray: Array<
    { type: "input_text"; text: string } | { type: "input_image"; image_url: string }
  > = [...imageAttachments];

  // Add user prompt at the end
  contentArray.push({
    type: "input_text",
    text: userPrompt
  });

  const imageCount = imageAttachments.filter((item) => item.type === "input_image").length;
  
  console.log('[logo-animation:idea-generator] Content array prepared:', {
    totalItems: contentArray.length,
    imageCount,
    hasReferenceImage: !!referenceImage,
    willSendImages: imageCount > 0,
  });

  // Call AI model
  const result = await callTextModel(
    {
      provider: CONFIG.provider,
      model: CONFIG.model,
      payload: {
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            // Use contentArray if images are present, otherwise use plain text
            content: imageCount > 0 ? contentArray : userPrompt,
          },
        ],
      },
    },
    {
      expectedOutputTokens: 500, // Enough for 200-300 word prompt
    }
  );

  // Extract and clean the visual prompt
  let visualPrompt = result.output.trim();

  // Remove any labels or formatting that might have been added
  visualPrompt = visualPrompt
    .replace(/^(visual prompt|prompt|description|idea):\s*/i, '')
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .trim();

  const cost = result.usage?.totalCostUsd || 0;

  return {
    visualPrompt,
    cost,
  };
}

