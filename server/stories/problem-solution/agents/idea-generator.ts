import { callTextModel } from "../../../ai/service";
import { 
  STORY_WRITER_SYSTEM_PROMPT,
  buildStoryUserPrompt 
} from "../prompts/idea-prompts";
import type { StoryGeneratorInput, StoryGeneratorOutput } from "../types";

const STORY_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o",
};

// Validation constants
const VALIDATION = {
  MIN_DURATION: 10,
  MAX_DURATION: 120,
  MIN_IDEA_LENGTH: 5,
  MAX_IDEA_LENGTH: 500,
};

/**
 * Detect if text is primarily Arabic
 */
function isArabicText(text: string): boolean {
  const cleaned = text.replace(/\s/g, '');
  if (!cleaned) return false;

  const arabicChars = (cleaned.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = cleaned.length;

  return arabicChars / totalChars >= 0.2;
}

/**
 * Validate input parameters
 */
function validateInput(input: StoryGeneratorInput): void {
  const { ideaText, durationSeconds } = input;

  // Validate duration
  if (!durationSeconds || durationSeconds < VALIDATION.MIN_DURATION) {
    throw new Error(
      `Duration must be at least ${VALIDATION.MIN_DURATION} seconds`
    );
  }
  if (durationSeconds > VALIDATION.MAX_DURATION) {
    throw new Error(
      `Duration must not exceed ${VALIDATION.MAX_DURATION} seconds`
    );
  }

  // Validate idea text
  if (!ideaText || !ideaText.trim()) {
    throw new Error("Idea text is required");
  }

  const trimmedIdea = ideaText.trim();
  if (trimmedIdea.length < VALIDATION.MIN_IDEA_LENGTH) {
    throw new Error(
      `Idea text must be at least ${VALIDATION.MIN_IDEA_LENGTH} characters`
    );
  }
  if (trimmedIdea.length > VALIDATION.MAX_IDEA_LENGTH) {
    throw new Error(
      `Idea text must not exceed ${VALIDATION.MAX_IDEA_LENGTH} characters`
    );
  }
}

/**
 * Validate output story
 */
function validateOutput(story: string, expectedWordCount: number): void {
  if (!story || story.trim().length === 0) {
    throw new Error("Generated story is empty");
  }

  const wordCount = story.split(/\s+/).filter(w => w.length > 0).length;
  const minWords = Math.round(expectedWordCount * 0.85);
  const maxWords = Math.round(expectedWordCount * 1.15);

  if (wordCount < minWords) {
    console.warn(
      `[idea-generator] Story is too short: ${wordCount} words (expected ${expectedWordCount})`
    );
  }
  if (wordCount > maxWords) {
    console.warn(
      `[idea-generator] Story is too long: ${wordCount} words (expected ${expectedWordCount})`
    );
  }

  // Check for unwanted formatting
  const hasLabels = /^(hook|problem|solution|close|scene|part)/i.test(story);
  const hasBullets = /^[\-\*\+]\s/m.test(story);
  const hasBrackets = /\[.*?\]/.test(story);

  if (hasLabels || hasBullets || hasBrackets) {
    console.warn(
      "[idea-generator] Story may contain unwanted formatting elements"
    );
  }
}

/**
 * Generate story from idea text
 * 
 * @param input - Story generation input (idea text and duration)
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated story text and cost
 */
export async function generateStory(
  input: StoryGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<StoryGeneratorOutput> {
  const { ideaText, durationSeconds } = input;

  // Validate input
  validateInput(input);

  // Build user prompt with parameters
  const userPrompt = buildStoryUserPrompt({
    idea: ideaText.trim(),
    duration: durationSeconds,
  });

  // Calculate expected word count for validation
  const isArabic = isArabicText(ideaText);
  const wordsPerSecond = isArabic ? 2.0 : 2.6;
  const expectedWordCount = Math.round(durationSeconds * wordsPerSecond);

  console.log('[problem-solution:idea-generator] ═══════════════════════════════════════════════');
  console.log('[problem-solution:idea-generator] Generating story');
  console.log('[problem-solution:idea-generator] ═══════════════════════════════════════════════');
  console.log('[problem-solution:idea-generator] Duration:', durationSeconds, 'seconds');
  console.log('[problem-solution:idea-generator] Idea length:', ideaText.length, 'characters');
  console.log('[problem-solution:idea-generator] Language:', isArabic ? 'Arabic' : 'English');
  console.log('[problem-solution:idea-generator] Expected words:', expectedWordCount);
  console.log('[problem-solution:idea-generator] Idea preview:', ideaText.substring(0, 100) + '...');

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
        expectedOutputTokens: 2000,
      }
    );

    const story = response.output.trim();

    // Validate output
    validateOutput(story, expectedWordCount);

    const actualWordCount = story.split(/\s+/).filter(w => w.length > 0).length;
    const cost = response.usage?.totalCostUsd || 0;

    console.log('[problem-solution:idea-generator] ═══════════════════════════════════════════════');
    console.log('[problem-solution:idea-generator] ✓ Story generated successfully');
    console.log('[problem-solution:idea-generator] ═══════════════════════════════════════════════');
    console.log('[problem-solution:idea-generator] Word count:', actualWordCount, '(expected:', expectedWordCount + ')');
    console.log('[problem-solution:idea-generator] Cost:', `$${cost.toFixed(4)}`);
    console.log('[problem-solution:idea-generator] Story preview:', story.substring(0, 150) + '...');

    return {
      story,
      cost,
    };
  } catch (error) {
    console.error("[problem-solution:idea-generator] ═══════════════════════════════════════════════");
    console.error("[problem-solution:idea-generator] ✗ Story generation failed");
    console.error("[problem-solution:idea-generator] ═══════════════════════════════════════════════");
    console.error("[problem-solution:idea-generator] Error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (error.message.includes('insufficient credits')) {
        throw new Error("Insufficient credits. Please check your account balance.");
      }
      throw new Error(`Failed to generate story: ${error.message}`);
    }
    
    throw new Error("Failed to generate story: Unknown error occurred");
  }
}
