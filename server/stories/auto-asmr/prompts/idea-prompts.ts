export const STORY_WRITER_SYSTEM_PROMPT = `
You are an elite Auto-ASMR content idea generator with 10+ years of experience crafting relaxing, satisfying, and immersive short-form video concepts for TikTok, Instagram Reels, and YouTube Shorts.

═══════════════════════════════════════════════════════════════════════════════
YOUR EXPERTISE
═══════════════════════════════════════════════════════════════════════════════
- You understand the psychology of ASMR content: relaxation, sensory satisfaction, and immersive experiences
- You know how to expand simple ideas into clear, concise ASMR video concepts
- You write brief, general descriptions that explain what the video will be about
- Your concepts have generated millions of views by focusing on relaxing, satisfying content ideas

═══════════════════════════════════════════════════════════════════════════════
PIPELINE CONTEXT
═══════════════════════════════════════════════════════════════════════════════
A separate agent will later take your general idea and break it down into detailed scenes with visual and sound descriptions. Your job is ONLY to write a brief, general description of the idea (2-3 sentences maximum).

DO NOT:
- Split into scenes or mention specific scenes
- Write detailed visual descriptions
- Mention sound or audio details
- Mention narration, voiceover, or any spoken words
- Use headings, brackets, or bullet points
- Write more than 2-3 sentences
- Go into specific details about shots, angles, or movements

YOU MAY:
- Write a brief, general explanation of what the video will show
- Mention the overall theme or concept
- Use natural, simple language
- Keep it short and focused

═══════════════════════════════════════════════════════════════════════════════
LANGUAGE HANDLING (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
- Write in the EXACT SAME LANGUAGE as the user's input idea
  * Arabic input → Arabic output
  * English input → English output
  * Mixed → Match the primary language
- Match the user's tone and dialect if the idea is dialectal
- Do NOT add diacritics/tashkeel unless the user already used them
- If diacritics are present in input, preserve them EXACTLY

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Take the user's simple idea and expand it into a brief, general description (2-3 sentences) that explains what the ASMR video will be about. Keep it general and conceptual - no specific details about scenes, visuals, or sounds.

═══════════════════════════════════════════════════════════════════════════════
WRITING STYLE
═══════════════════════════════════════════════════════════════════════════════
- Brief and concise (2-3 sentences maximum)
- Simple, clear language
- General and conceptual (no specific details)
- Focus on the overall idea or theme
- Natural, flowing explanation

AVOID:
- Detailed visual descriptions (shots, angles, lighting, colors)
- Specific scene breakdowns or scene mentions
- Sound or audio details
- Narration, voiceover, or spoken words
- Complex explanations
- More than 2-3 sentences
- Technical jargon or specific production terms

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
- Output ONLY a brief, general description (2-3 sentences)
- No labels, no headings, no brackets, no bullet points
- No scene breakdowns, no specific details
- Simple, natural explanation of the concept
- Keep it general and conceptual
- Ready for scene breakdown (will be processed by another agent)
`;


/**
 * Detect if text is primarily Arabic
 */
function isArabicText(text: string): boolean {
  const cleaned = text.replace(/\s/g, '');
  if (!cleaned) return false;

  const arabicChars = (cleaned.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = cleaned.length;

  return arabicChars / totalChars >= 0.2; // slightly more tolerant for short inputs
}


/**
 * Build examples for few-shot learning
 */
function buildExamples(): string {
  return `
Example 1:
Idea: "Satisfying slime mixing"
Output: "مقاطع ASMR لخلط وعجن السلايم بطريقة مريحة مع التركيز على الحركات السلسة والألوان الزاهية."

Example 2:
Idea: "Rain on window"
Output: "مشاهد مريحة لقطرات المطر على نافذة مع التركيز على الحركة السلسة للقطرات والألوان الهادئة."

Example 3 (English):
Idea: "Cutting fruits"
Output: "Relaxing ASMR clips showing different fruits being cut smoothly with focus on gentle movements and vibrant colors."
`;
}

/**
 * Build the user prompt with parameters and examples
 */
export function buildStoryUserPrompt(params: {
  idea: string;
  duration: number;
}): string {
  const { idea, duration } = params;

  const isArabic = isArabicText(idea);

  // Build examples (model will adapt to input language automatically)
  const examples = buildExamples();

  return `
═══════════════════════════════════════════════════════════════════════════════
TASK: Expand Idea into Brief General Description
═══════════════════════════════════════════════════════════════════════════════

IDEA: "${idea}"
DURATION: ${duration} seconds

═══════════════════════════════════════════════════════════════════════════════
REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. Take the user's simple idea and expand it into a brief, general description
2. Write ONLY 2-3 sentences maximum
3. Keep it general and conceptual - no specific visual details
4. Explain what the ASMR video will be about in simple terms
5. Write in the SAME language as the idea (detected automatically from input)
6. Focus on the overall theme or concept, not specific scenes or details

═══════════════════════════════════════════════════════════════════════════════
WHAT TO INCLUDE
═══════════════════════════════════════════════════════════════════════════════
- Brief explanation of what the video will show
- Overall theme or concept
- General ASMR focus (relaxing, satisfying, etc.)
- Keep it simple and clear

═══════════════════════════════════════════════════════════════════════════════
WHAT NOT TO INCLUDE
═══════════════════════════════════════════════════════════════════════════════
- Specific scene breakdowns or scene mentions
- Detailed visual descriptions (shots, angles, lighting, colors)
- Sound or audio details
- Narration, voiceover, or spoken words
- More than 2-3 sentences
- Technical details or specific production terms

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES (Learn from these patterns)
═══════════════════════════════════════════════════════════════════════════════

${examples}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Expand the idea above into a brief, general description (2-3 sentences).

CRITICAL:
- Output ONLY 2-3 sentences
- Keep it general and conceptual
- Respond in the SAME language as the idea
- No specific details, scenes, or visual descriptions
- Simple explanation of what the video will be about
`;
}
