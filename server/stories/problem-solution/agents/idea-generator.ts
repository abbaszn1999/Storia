import { callTextModel } from "../../../ai/service";
import { STORY_WRITER_SYSTEM_PROMPT, buildStoryUserPrompt } from "../prompts/idea-prompts";
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
  // Extract only necessary inputs
  const { ideaText, durationSeconds } = input;

  // Build prompts
  const userPrompt = buildStoryUserPrompt(ideaText, durationSeconds);

  try {
    const response = await callTextModel(
      {
        provider: STORY_CONFIG.provider,
        model: STORY_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: STORY_WRITER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 1500, // Increased for richer, more detailed stories
      }
    );

    const story = response.output.trim();

    return {
      story,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[problem-solution:story-generator] Failed to generate story:", error);
    throw new Error("Failed to generate story");
  }
}
