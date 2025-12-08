// ═══════════════════════════════════════════════════════════════════════════
// AGENT 6: SOUND PROMPT ENHANCER - THE ASMR AUDIO ARCHITECT
// ═══════════════════════════════════════════════════════════════════════════
// Specialized AI agent for crafting professional-grade ASMR sound effect
// prompts. It always anchors to the Visual Prompt (no generation from scratch).
//
// Uses GPT-5 for maximum creative capability.
// ═══════════════════════════════════════════════════════════════════════════

import { callTextModel } from "../../../ai/service";
import {
  SOUND_ENHANCER_SYSTEM_PROMPT,
  buildSoundEnhancerUserPrompt,
} from "../prompts/sound-prompts";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SoundPromptEnhancerInput {
  /** User's sound description (can be empty for generation from scratch) */
  userPrompt: string;
  /** Visual prompt to base sounds on (primary context source) */
  visualPrompt?: string;
}

export interface SoundPromptEnhancerOutput {
  /** Enhanced/generated sound prompt */
  enhancedPrompt: string;
  /** API cost in USD */
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SOUND_ENHANCER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5", // Maximum creative capability
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enhance or generate an ASMR sound effect prompt
 * 
 * This agent specializes in:
 * - Professional audio terminology
 * - Binaural/3D spatial audio hints
 * - ASMR trigger sound descriptions
 * - Texture, rhythm, and recording perspective details
 * 
 * It must:
 * 1. Use visual context as the primary source (visualPrompt is required)
 * 2. Optionally refine using userPrompt (but never generate without visualPrompt)
 * 
 * @param input - User's sound prompt and optional visual context
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Enhanced/generated sound prompt
 */
export async function enhanceSoundPrompt(
  input: SoundPromptEnhancerInput,
  userId?: string,
  workspaceId?: string
): Promise<SoundPromptEnhancerOutput> {
  const { userPrompt, visualPrompt } = input;

  if (!visualPrompt || !visualPrompt.trim()) {
    throw new Error("visualPrompt is required to enhance sound prompt");
  }

  console.log("[sound-prompt-enhancer] Starting sound prompt generation:", {
    soundInputLength: userPrompt?.length || 0,
    visualInputLength: visualPrompt?.length || 0,
    mode: "visual-context-required",
  });

  // Build the user prompt based on available context
  const userMessage = buildSoundEnhancerUserPrompt(
    userPrompt || "",
    visualPrompt
  );

  try {
    // Call GPT-5 for maximum creative output
    const response = await callTextModel(
      {
        provider: SOUND_ENHANCER_CONFIG.provider,
        model: SOUND_ENHANCER_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: SOUND_ENHANCER_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 400,
      }
    );

    // Clean up the response
    let enhancedPrompt = response.output
      .trim()
      .replace(/^["']|["']$/g, "")     // Remove surrounding quotes
      .replace(/^\*\*|\*\*$/g, "")     // Remove markdown bold
      .replace(/^```[\s\S]*?```$/g, "") // Remove code blocks
      .replace(/^#.*$/gm, "")          // Remove markdown headers
      .trim();

    // Ensure reasonable length (100-450 chars for ElevenLabs)
    if (enhancedPrompt.length > 450) {
      // Truncate at last complete sentence/phrase
      const truncated = enhancedPrompt.substring(0, 450);
      const lastComma = truncated.lastIndexOf(",");
      enhancedPrompt = lastComma > 300 
        ? truncated.substring(0, lastComma) 
        : truncated;
    }

    // Ensure minimum length
    if (enhancedPrompt.length < 50) {
      enhancedPrompt = "Gentle ASMR sounds, soft tapping on wooden surface, close-mic recording, calming rhythmic patterns";
    }

    console.log("[sound-prompt-enhancer] Generated successfully:", {
      outputLength: enhancedPrompt.length,
      preview: enhancedPrompt.substring(0, 80) + "...",
      cost: response.usage?.totalCostUsd,
    });

    return {
      enhancedPrompt,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[sound-prompt-enhancer] Generation failed:", error);
    
    // Intelligent fallback based on input
    const fallbackPrompt = userPrompt?.trim() 
      ? userPrompt 
      : "Crystal clear ASMR tapping sounds, gentle fingernail percussion on hollow wood, close-mic binaural recording, soothing rhythmic patterns";
    
    return {
      enhancedPrompt: fallbackPrompt,
    };
  }
}
