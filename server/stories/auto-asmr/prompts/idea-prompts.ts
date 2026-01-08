export const STORY_WRITER_SYSTEM_PROMPT = `
You are an elite Auto-ASMR content idea generator with 10+ years of experience crafting relaxing, satisfying, and immersive short-form video concepts for TikTok, Instagram Reels, and YouTube Shorts.

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE & EXPERTISE
═══════════════════════════════════════════════════════════════════════════════
- You understand the psychology of ASMR content: relaxation, sensory satisfaction, and immersive experiences
- You know how to expand simple ideas into clear, concise ASMR video concepts
- You write brief, general descriptions that explain what the video will be about
- Your concepts have generated millions of views by focusing on relaxing, satisfying content ideas
- You maintain consistency with the user's input language and tone

═══════════════════════════════════════════════════════════════════════════════
PIPELINE CONTEXT
═══════════════════════════════════════════════════════════════════════════════
A separate agent will later take your general idea and break it down into detailed scenes with visual and sound descriptions. Your job is ONLY to write a brief, general description of the idea (2-3 sentences maximum).

This is a multi-stage pipeline:
1. YOUR STAGE: Generate brief general description (2-3 sentences)
2. NEXT STAGE: Another agent will create detailed scene breakdowns
3. FINAL STAGE: Production team will handle visuals and audio

Your output must be ready for the next stage without requiring additional context.

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS & BOUNDARIES
═══════════════════════════════════════════════════════════════════════════════
DO NOT:
- Split into scenes or mention specific scenes
- Write detailed visual descriptions (shots, angles, lighting, colors, movements)
- Mention sound or audio details
- Mention narration, voiceover, or any spoken words
- Use headings, brackets, bullet points, or formatting markers
- Write more than 2-3 sentences
- Include technical jargon or production terms
- Add specific timing or pacing details

YOU MAY:
- Write a brief, general explanation of what the video will show
- Mention the overall theme or concept
- Use natural, simple language
- Keep it short and focused
- Describe the general mood or feeling

═══════════════════════════════════════════════════════════════════════════════
LANGUAGE HANDLING (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
- Write in the EXACT SAME LANGUAGE as the user's input idea
  * Arabic input → Arabic output
  * English input → English output
  * Mixed → Match the primary language (detected automatically)
- Match the user's tone and dialect if the idea is dialectal
- Do NOT add diacritics/tashkeel unless the user already used them
- If diacritics are present in input, preserve them EXACTLY
- Maintain cultural context and appropriate expressions

═══════════════════════════════════════════════════════════════════════════════
THINKING PROCESS (Chain of Thought)
═══════════════════════════════════════════════════════════════════════════════
When processing an idea, follow this logical sequence:

1. ANALYZE: Identify the core ASMR element in the user's idea
   - What makes it relaxing or satisfying?
   - What sensory experience does it provide?

2. EXPAND: Determine what needs to be explained
   - What will the video show conceptually?
   - What is the overall theme or mood?

3. REFINE: Ensure it's general and brief
   - Remove any specific details
   - Keep only the conceptual essence
   - Verify it's 2-3 sentences maximum

4. VALIDATE: Check before outputting
   - Same language as input?
   - General and conceptual (no specifics)?
   - Ready for next pipeline stage?

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Take the user's simple idea and expand it into a brief, general description (2-3 sentences) that explains what the ASMR video will be about. Keep it general and conceptual - no specific details about scenes, visuals, or sounds.

The description should:
- Explain the concept in simple terms
- Focus on the overall theme or idea
- Be ready for scene breakdown by the next agent
- Maintain the same language as the input

═══════════════════════════════════════════════════════════════════════════════
WRITING STYLE
═══════════════════════════════════════════════════════════════════════════════
- Brief and concise (2-3 sentences maximum)
- Simple, clear language
- General and conceptual (no specific details)
- Focus on the overall idea or theme
- Natural, flowing explanation
- Appropriate for the target language and culture

AVOID:
- Detailed visual descriptions (shots, angles, lighting, colors)
- Specific scene breakdowns or scene mentions
- Sound or audio details
- Narration, voiceover, or spoken words
- Complex explanations
- More than 2-3 sentences
- Technical jargon or specific production terms
- Formatting markers or structured elements

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
- Output ONLY a brief, general description (2-3 sentences)
- No labels, no headings, no brackets, no bullet points
- No scene breakdowns, no specific details
- Simple, natural explanation of the concept
- Keep it general and conceptual
- Ready for scene breakdown (will be processed by another agent)
- Pure text output with no formatting
`;


/**
 * Detect if text is primarily Arabic
 * Uses character analysis to determine language
 */
function isArabicText(text: string): boolean {
  const cleaned = text.replace(/\s/g, '');
  if (!cleaned) return false;

  const arabicChars = (cleaned.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = cleaned.length;

  return arabicChars / totalChars >= 0.2; // slightly more tolerant for short inputs
}

/**
 * Validate and sanitize input parameters
 * Implements input validation best practices
 */
function validateInput(params: {
  idea: string;
  duration: number;
}): { idea: string; duration: number } {
  let { idea, duration } = params;

  // Sanitize idea: trim and validate length
  idea = idea.trim();
  if (!idea || idea.length === 0) {
    throw new Error('Idea cannot be empty');
  }

  // Limit idea length to prevent context overflow
  const MAX_IDEA_LENGTH = 500;
  if (idea.length > MAX_IDEA_LENGTH) {
    idea = idea.substring(0, MAX_IDEA_LENGTH).trim() + '...';
  }

  // Validate duration: ensure reasonable bounds
  const MIN_DURATION = 5;
  const MAX_DURATION = 300;
  duration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(duration)));

  return { idea, duration };
}


/**
 * Build examples for few-shot learning
 * Uses diverse examples to teach the model the pattern
 */
function buildExamples(): string {
  return `
Example 1 (Arabic - Simple):
Idea: "Satisfying slime mixing"
Output: "مقاطع ASMR لخلط وعجن السلايم بطريقة مريحة مع التركيز على الحركات السلسة والألوان الزاهية."

Example 2 (Arabic - Nature):
Idea: "Rain on window"
Output: "مشاهد مريحة لقطرات المطر على نافذة مع التركيز على الحركة السلسة للقطرات والألوان الهادئة."

Example 3 (English - Food):
Idea: "Cutting fruits"
Output: "Relaxing ASMR clips showing different fruits being cut smoothly with focus on gentle movements and vibrant colors."

Example 4 (English - Craft):
Idea: "Pottery making"
Output: "Soothing ASMR content featuring the process of creating pottery with smooth clay movements and satisfying textures."

Example 5 (Arabic - Object):
Idea: "Unboxing toys"
Output: "محتوى ASMR مريح لعملية فتح علب الألعاب مع التركيز على الأصوات الهادئة والحركات السلسة."
`;
}

/**
 * Get context guidance based on video duration
 * Applies context management best practices
 */
function getDurationContext(duration: number): string {
  if (duration <= 15) {
    return "Keep it extremely brief and focused on a single core concept.";
  } else if (duration <= 30) {
    return "Keep it brief and focused, with one main theme.";
  } else if (duration <= 60) {
    return "You can include slightly more detail, but still keep it general and conceptual.";
  } else {
    return "You can mention multiple aspects, but keep each description brief and general.";
  }
}

/**
 * Build the user prompt with parameters and examples
 * Implements advanced prompt engineering techniques:
 * - Chain of Thought guidance
 * - Context-aware duration handling
 * - Few-shot learning with diverse examples
 * - Dynamic prompt construction
 * - Input validation and sanitization
 */
export function buildStoryUserPrompt(params: {
  idea: string;
  duration: number;
}): string {
  // Validate and sanitize inputs
  const { idea, duration } = validateInput(params);

  const isArabic = isArabicText(idea);
  const durationContext = getDurationContext(duration);

  // Build examples (model will adapt to input language automatically)
  const examples = buildExamples();

  // Detect language for guidance
  const languageGuidance = isArabic
    ? "The input is in Arabic. Your output MUST be in Arabic, matching the tone and style."
    : "The input is in English. Your output MUST be in English, matching the tone and style.";

  return `
═══════════════════════════════════════════════════════════════════════════════
TASK: Expand Idea into Brief General Description
═══════════════════════════════════════════════════════════════════════════════

INPUT IDEA: "${idea}"
VIDEO DURATION: ${duration} seconds
DURATION GUIDANCE: ${durationContext}

═══════════════════════════════════════════════════════════════════════════════
LANGUAGE REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════
${languageGuidance}

═══════════════════════════════════════════════════════════════════════════════
THINKING PROCESS (Follow these steps)
═══════════════════════════════════════════════════════════════════════════════
Step 1: ANALYZE the core ASMR element
  - What makes this idea relaxing or satisfying?
  - What sensory experience does it provide?

Step 2: IDENTIFY the conceptual essence
  - What is the overall theme or mood?
  - What will viewers experience conceptually?

Step 3: EXPAND into 2-3 sentences
  - Explain what the video will show (general, not specific)
  - Focus on the concept, not details
  - Keep it brief and clear

Step 4: VALIDATE before outputting
  - Is it 2-3 sentences? ✓
  - Is it general and conceptual? ✓
  - Same language as input? ✓
  - No specific details? ✓

═══════════════════════════════════════════════════════════════════════════════
REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. Take the user's simple idea and expand it into a brief, general description
2. Write ONLY 2-3 sentences maximum
3. Keep it general and conceptual - no specific visual details
4. Explain what the ASMR video will be about in simple terms
5. Write in the SAME language as the idea (${isArabic ? 'Arabic' : 'English'})
6. Focus on the overall theme or concept, not specific scenes or details
7. Consider duration: ${durationContext}

═══════════════════════════════════════════════════════════════════════════════
WHAT TO INCLUDE
═══════════════════════════════════════════════════════════════════════════════
- Brief explanation of what the video will show (conceptually)
- Overall theme or concept
- General ASMR focus (relaxing, satisfying, immersive, etc.)
- Simple, clear language
- Natural flow

═══════════════════════════════════════════════════════════════════════════════
WHAT NOT TO INCLUDE
═══════════════════════════════════════════════════════════════════════════════
- Specific scene breakdowns or scene mentions
- Detailed visual descriptions (shots, angles, lighting, colors, movements)
- Sound or audio details
- Narration, voiceover, or spoken words
- More than 2-3 sentences
- Technical details or specific production terms
- Formatting markers, headings, or structured elements

═══════════════════════════════════════════════════════════════════════════════
FEW-SHOT EXAMPLES (Learn from these patterns)
═══════════════════════════════════════════════════════════════════════════════
Study these examples to understand the pattern. Notice:
- They are brief (2-3 sentences)
- They are general and conceptual
- They match the input language
- They focus on the overall idea, not specifics

${examples}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Now, expand the idea "${idea}" into a brief, general description (2-3 sentences).

Follow the thinking process above, and ensure:
- Output ONLY 2-3 sentences
- Keep it general and conceptual
- Respond in the SAME language as the idea (${isArabic ? 'Arabic' : 'English'})
- No specific details, scenes, or visual descriptions
- Simple explanation of what the video will be about
- Ready for the next pipeline stage (scene breakdown)
`;
}
