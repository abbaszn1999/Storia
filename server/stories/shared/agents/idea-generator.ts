import { callTextModel } from "../../../ai/service";

// Type for mode parameter
export type StoryMode = "problem-solution" | "before-after" | "myth-busting" | "tease-reveal" | "auto-asmr";

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
 * Clean story text from unwanted formatting
 */
function cleanStoryText(story: string): string {
  let cleaned = story.trim();
  
  if (!cleaned) return cleaned;
  
  // Remove labels at the start of lines (Hook:, Problem:, Solution:, etc.)
  cleaned = cleaned.replace(/^(hook|problem|solution|close|scene|part)\s*:?\s*/gim, '');
  
  // Remove bullet points at the start of lines
  cleaned = cleaned.replace(/^[\-\*\+]\s+/gm, '');
  
  // Remove numbered lists at the start of lines (1., 2., etc.)
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  
  // Remove brackets and their content (e.g., [Scene 1], [Visual: ...])
  cleaned = cleaned.replace(/\[.*?\]/g, '');
  
  // Remove markdown-style headers (# ## ###)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove multiple consecutive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  // Remove empty lines at start and end
  cleaned = cleaned.replace(/^\n+|\n+$/g, '');
  
  // Final trim
  return cleaned.trim();
}

/**
 * Create idea generator function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns generateStory function configured for the specified mode
 */
export async function createIdeaGenerator(mode: StoryMode) {
  // Dynamic imports for mode-specific prompts and types
  const promptsModule = await import(`../../${mode}/prompts/idea-prompts`);
  // All story modes use the same types from shared
  const typesModule = await import(`../types`);
  
  const { STORY_WRITER_SYSTEM_PROMPT, buildStoryUserPrompt } = promptsModule;
  
  // Types will be inferred from usage (any for now since we can't extract types from require)
  type StoryGeneratorInput = any;
  type StoryGeneratorOutput = any;

  /**
   * Validate input parameters
   */
  function validateInput(input: any): void {
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
   * Validate and clean output story
   * @returns Cleaned story text
   */
  function validateOutput(story: string, expectedWordCount: number): string {
    if (!story || story.trim().length === 0) {
      throw new Error("Generated story is empty");
    }

    // Clean the story first
    const cleanedStory = cleanStoryText(story);
    
    if (cleanedStory.length === 0) {
      throw new Error("Story became empty after cleaning");
    }

    // Check if cleaning made a difference (for logging)
    if (cleanedStory !== story) {
      console.log(
        `[${mode}:idea-generator] Story was cleaned: removed unwanted formatting`
      );
    }

    const wordCount = cleanedStory.split(/\s+/).filter(w => w.length > 0).length;
    const minWords = Math.round(expectedWordCount * 0.85);
    const maxWords = Math.round(expectedWordCount * 1.15);

    if (wordCount < minWords) {
      console.warn(
        `[${mode}:idea-generator] Story is too short: ${wordCount} words (expected ${expectedWordCount})`
      );
    }
    if (wordCount > maxWords) {
      console.warn(
        `[${mode}:idea-generator] Story is too long: ${wordCount} words (expected ${expectedWordCount})`
      );
    }

    return cleanedStory;
  }

  /**
   * Generate story from idea text
   * 
   * @param input - Story generation input (idea text and duration)
   * @param userId - User ID for tracking
   * @param workspaceId - Workspace ID for tracking
   * @returns Generated story text and cost
   */
  async function generateStory(
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

    console.log(`[${mode}:idea-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:idea-generator] Generating story`);
    console.log(`[${mode}:idea-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:idea-generator] Duration:`, durationSeconds, 'seconds');
    console.log(`[${mode}:idea-generator] Idea length:`, ideaText.length, 'characters');
    console.log(`[${mode}:idea-generator] Language:`, isArabic ? 'Arabic' : 'English');
    console.log(`[${mode}:idea-generator] Expected words:`, expectedWordCount);
    console.log(`[${mode}:idea-generator] Idea preview:`, ideaText.substring(0, 100) + '...');

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

    const rawStory = response.output.trim();

    // Validate and clean output
    const story = validateOutput(rawStory, expectedWordCount);

    const actualWordCount = story.split(/\s+/).filter(w => w.length > 0).length;
    const cost = response.usage?.totalCostUsd || 0;

    console.log(`[${mode}:idea-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:idea-generator] ✓ Story generated successfully`);
    console.log(`[${mode}:idea-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:idea-generator] Word count:`, actualWordCount, '(expected:', expectedWordCount + ')');
    console.log(`[${mode}:idea-generator] Cost:`, `$${cost.toFixed(4)}`);
    console.log(`[${mode}:idea-generator] Story preview:`, story.substring(0, 150) + '...');

    return {
      story,
      cost,
    };
    } catch (error) {
      console.error(`[${mode}:idea-generator] ═══════════════════════════════════════════════`);
      console.error(`[${mode}:idea-generator] ✗ Story generation failed`);
      console.error(`[${mode}:idea-generator] ═══════════════════════════════════════════════`);
      console.error(`[${mode}:idea-generator] Error:`, error);
    
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

  return generateStory;
}

/**
 * Generate story from idea text (backward compatibility - uses problem-solution mode by default)
 * 
 * @param input - Story generation input (idea text and duration)
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated story text and cost
 */
export async function generateStory(
  input: any,
  userId?: string,
  workspaceId?: string
): Promise<any> {
  const generator = await createIdeaGenerator("problem-solution");
  return generator(input, userId, workspaceId);
}
