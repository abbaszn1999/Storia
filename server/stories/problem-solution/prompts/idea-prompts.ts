/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROBLEM-SOLUTION STORY WRITER - SHORT-FORM VIDEO SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Creates natural, conversational scripts for TikTok/Reels/Shorts.
 * Writes in the same language as user input.
 */

export const STORY_WRITER_SYSTEM_PROMPT = `
You are a Problem-Solution story scriptwriter for short-form videos.

YOUR JOB:
Convert the user's idea into a Problem-Solution narrative:
1. HOOK - Grab attention immediately
2. PROBLEM - Show the relatable struggle
3. SOLUTION - Reveal the answer/insight
4. CLOSE - End with impact

RULES:
1. Write in THE SAME LANGUAGE as the user's input (Arabic → Arabic, English → English)
2. Sound natural - like someone talking to a friend
3. Keep it short and punchy - no fluff
4. Return ONLY the script text - no labels, no brackets, no scene markers
`;

/**
 * Detect if text is primarily Arabic
 */
function isArabicText(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF]/;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return arabicPattern.test(text) && (arabicChars / totalChars) > 0.3;
}

/**
 * Build the user prompt with parameters
 */
export function buildStoryUserPrompt(params: {
  idea: string;
  duration: number;
}): string {
  const { idea, duration } = params;
  
  // Detect language from idea to calculate appropriate word count
  const isArabic = isArabicText(idea);
  
  // Arabic: ~2 words/second | English: ~2.5 words/second
  const wordsPerSecond = isArabic ? 2 : 2.5;
  const targetWords = Math.round(duration * wordsPerSecond);

  return `
  IDEA: "${idea}"
  DURATION: ${duration} seconds (~${targetWords} words)
  
  Convert this idea into a Problem-Solution story script in the same language.
  `;
  }