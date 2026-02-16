// ═══════════════════════════════════════════════════════════════════════════
// AGENT 1: ASMR Idea Generator
// ═══════════════════════════════════════════════════════════════════════════
// Expert AI agent specialized in generating creative ASMR video concepts
// Uses GPT-5 to suggest unique, trending, and satisfying content ideas

import { callTextModel } from "../../../ai/service";
import { getCategoryById } from "../config";
import { IDEA_GENERATOR_SYSTEM_PROMPT, buildIdeaUserPrompt } from "../prompts/idea-prompts";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface IdeaGeneratorInput {
  userIdea?: string;           // User's basic idea (can be empty)
  categoryId?: string;         // Selected category (optional)
}

export interface IdeaGeneratorOutput {
  enhancedIdea: string;        // The creative ASMR concept
  cost?: number;               // API cost in USD
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const IDEA_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",              // Using GPT-5 for creative ideation

};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a creative ASMR video concept
 * 
 * This agent is an expert in:
 * - Viral ASMR trends and triggers
 * - Satisfying visual concepts
 * - Unique texture and sound combinations
 * - Audience engagement patterns
 * 
 * @param input - User's basic idea and optional category
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Enhanced creative ASMR concept
 */
export async function generateIdea(
  input: IdeaGeneratorInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<IdeaGeneratorOutput> {
  const { userIdea, categoryId } = input;

  // Get category context if selected
  let categoryContext: string | undefined;
  if (categoryId) {
    const category = getCategoryById(categoryId);
    if (category) {
      categoryContext = `Category: ${category.name} - ${category.description}`;
    }
  }

  // Build the user prompt
  const userPrompt = buildIdeaUserPrompt(userIdea, categoryContext);

  try {
    console.log("[idea-generator] Generating creative ASMR concept...");
    
    const response = await callTextModel(
      {
        provider: IDEA_GENERATOR_CONFIG.provider,
        model: IDEA_GENERATOR_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },   // ← هنا
          input: [
            { role: "system", content: IDEA_GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],

        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 400,
        metadata: { usageType, usageMode },
      }
    );

    const enhancedIdea = response.output.trim();
    const cost = response.usage?.totalCostUsd;

    console.log("[idea-generator] Generated concept:", enhancedIdea.substring(0, 100) + "...");

    return {
      enhancedIdea,
      cost,
    };
  } catch (error) {
    console.error("[idea-generator] Failed to generate idea:", error);
    
    // Fallback: return user's original idea or a default suggestion
    return {
      enhancedIdea: userIdea || "Satisfying ASMR video with calming visuals and textures",
    };
  }
}

/**
 * Quick idea without AI - uses category template
 */
export function getQuickIdea(categoryId: string): string | null {
  const category = getCategoryById(categoryId);
  if (!category) return null;
  
  // Return a simplified version of the suggested prompt
  return category.suggestedVisualPrompt.split(",").slice(0, 3).join(",");
}

