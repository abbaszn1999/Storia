/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOCIAL MEDIA METADATA GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates platform-specific metadata for social media:
 * - YouTube: Title + Description
 * - TikTok: Caption with hashtags
 * - Instagram: Caption with hashtags
 * - Facebook: Caption with hashtags
 */

import { callTextModel } from "../../../../ai/service";
import {
  getSystemPromptForPlatform,
  buildSocialMetadataUserPrompt,
} from "../prompts/metadata-prompts";
import type { SocialPlatform, SocialMetadataInput, SocialMetadataOutput } from "../types";

const AGENT_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5", // Fast and cost-effective for short text generation
};

/**
 * Parse JSON from AI response, handling potential formatting issues
 */
function parseJsonResponse(response: string): Record<string, string> {
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Try to fix common JSON issues
    let fixed = jsonMatch[0]
      .replace(/[\r\n]+/g, "\\n")  // Fix newlines
      .replace(/(?<!\\)"/g, '\\"') // Escape unescaped quotes
      .replace(/\\\\"/g, '\\"');   // Fix double-escaped quotes
    
    // Re-wrap with proper quotes
    fixed = fixed.replace(/^{/, '{"').replace(/}$/, '"}');
    
    return JSON.parse(jsonMatch[0]);
  }
}

/**
 * Generate social media metadata for a specific platform
 */
export async function generateSocialMetadata(
  input: SocialMetadataInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<SocialMetadataOutput> {
  const { platform, scriptText, duration } = input;

  console.log('[shared:social:metadata-generator] Generating metadata:', {
    platform,
    duration,
    scriptLength: scriptText.length,
  });

  // Get platform-specific prompts
  const systemPrompt = getSystemPromptForPlatform(platform);
  const userPrompt = buildSocialMetadataUserPrompt({
    platform,
    scriptText,
    duration,
  });

  try {
    const response = await callTextModel(
      {
        provider: AGENT_CONFIG.provider,
        model: AGENT_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },

          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 500,
        metadata: { usageType, usageMode },
      }
    );

    const rawOutput = response.output.trim();
    console.log('[shared:social:metadata-generator] Raw response:', rawOutput);

    // Parse the JSON response
    const parsed = parseJsonResponse(rawOutput);

    // Build output based on platform
    const output: SocialMetadataOutput = {
      platform,
      cost: response.usage?.totalCostUsd,
    };

    if (platform === 'youtube') {
      output.title = parsed.title || '';
      output.description = parsed.description || '';
    } else {
      output.caption = parsed.caption || '';
    }

    console.log('[shared:social:metadata-generator] Generated metadata:', {
      platform,
      hasTitle: !!output.title,
      hasDescription: !!output.description,
      hasCaption: !!output.caption,
      cost: output.cost,
    });

    return output;
  } catch (error) {
    console.error("[shared:social:metadata-generator] Failed to generate metadata:", error);
    throw new Error(`Failed to generate ${platform} metadata`);
  }
}

/**
 * Generate metadata for multiple platforms at once
 */
export async function generateSocialMetadataForPlatforms(
  platforms: SocialPlatform[],
  scriptText: string,
  duration: number,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<Record<SocialPlatform, SocialMetadataOutput>> {
  console.log('[shared:social:metadata-generator] Generating metadata for multiple platforms:', platforms);

  const results: Partial<Record<SocialPlatform, SocialMetadataOutput>> = {};

  // Generate in parallel for speed
  await Promise.all(
    platforms.map(async (platform) => {
      try {
        const metadata = await generateSocialMetadata(
          { platform, scriptText, duration },
          userId,
          workspaceId,
          usageType,
          usageMode
        );
        results[platform] = metadata;
      } catch (error) {
        console.error(`[shared:social:metadata-generator] Failed for ${platform}:`, error);
        // Return empty metadata on failure
        results[platform] = {
          platform,
          title: platform === 'youtube' ? '' : undefined,
          description: platform === 'youtube' ? '' : undefined,
          caption: platform !== 'youtube' ? '' : undefined,
        };
      }
    })
  );

  return results as Record<SocialPlatform, SocialMetadataOutput>;
}

