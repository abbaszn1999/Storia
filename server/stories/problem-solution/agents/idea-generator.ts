import { callTextModel } from "../../../ai/service";
import { STORY_WRITER_SYSTEM_PROMPT, buildStoryUserPrompt } from "../prompts/idea-prompts";

export interface StoryGeneratorInput {
  ideaText: string;
  durationSeconds: number;
  aspectRatio: string;
}

export interface StoryGeneratorOutput {
  story: string;
  cost?: number;
}

const STORY_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

export async function generateStory(
  input: StoryGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<StoryGeneratorOutput> {
  const { ideaText, durationSeconds, aspectRatio } = input;

  const userPrompt = buildStoryUserPrompt(ideaText, durationSeconds, aspectRatio);

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
        expectedOutputTokens: 400,
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

