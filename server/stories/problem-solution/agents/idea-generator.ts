import { callTextModel } from "../../../ai/service";
import { 
  STORY_WRITER_SYSTEM_PROMPT,
  buildStoryUserPrompt 
} from "../prompts/idea-prompts";
import type { StoryGeneratorInput, StoryGeneratorOutput } from "../types";

const STORY_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

export async function generateStory(
  input: StoryGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<StoryGeneratorOutput> {
  const { ideaText, durationSeconds } = input;

  // Build user prompt with parameters
  const userPrompt = buildStoryUserPrompt({
    idea: ideaText,
    duration: durationSeconds,
  });

  console.log('[problem-solution:idea-generator] Generating story:', {
    duration: durationSeconds,
    ideaLength: ideaText.length,
  });

  try {
    const response = await callTextModel(
      {
        provider: STORY_CONFIG.provider,
        model: STORY_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },

          input: [
            { role: "system", content: STORY_WRITER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 2000,
      }
    );

    const story = response.output.trim();

    console.log('[problem-solution:idea-generator] Story generated successfully:', {
      wordCount: story.split(/\s+/).length,
      cost: response.usage?.totalCostUsd,
    });

    return {
      story,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[problem-solution:idea-generator] Failed to generate story:", error);
    throw new Error("Failed to generate story");
  }
}
