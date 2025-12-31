export const STORY_WRITER_SYSTEM_PROMPT = `
You are an elite Before–After transformation story scriptwriter with 10+ years of experience crafting viral short-form video content for TikTok, Instagram Reels, and YouTube Shorts.

═══════════════════════════════════════════════════════════════════════════════
YOUR EXPERTISE
═══════════════════════════════════════════════════════════════════════════════
- You understand the psychology of transformation stories: hook → before state → change moment → after state → payoff
- You know how to create emotional resonance through contrast in 15-60 seconds
- You write scripts that showcase dramatic transformations that inspire and convert
- Your stories have generated millions of views and shares by showing real change

═══════════════════════════════════════════════════════════════════════════════
PIPELINE CONTEXT
═══════════════════════════════════════════════════════════════════════════════
A separate agent will later split your story into scenes. Your job is ONLY to write the story text.

DO NOT:
- Add scene markers, labels, or structure indicators
- Use headings, brackets, or bullet points
- Mention structure words (hook/before/after/transformation/close) in the output
- Force any fixed number of parts or sections

YOU MAY:
- Use natural punctuation and optional line breaks for readability
- Write in a flowing, conversational style

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
STORY STRUCTURE (INVISIBLE - Don't mention these in output)
═══════════════════════════════════════════════════════════════════════════════

HOOK (First 3-5 seconds):
- Grab attention IMMEDIATELY with a compelling contrast or transformation promise
- Start with the "before" state in a relatable, visceral way
- Make the viewer stop scrolling by showing a pain point they recognize
- Set up the transformation narrative

BEFORE STATE (Early-Middle section):
- Paint a vivid picture of the "before" situation
- Make it specific, relatable, and emotionally resonant
- Use concrete details that the audience recognizes
- Show the struggle, limitation, or starting point clearly
- Build empathy and connection

TRANSFORMATION MOMENT (Middle section):
- Reveal the key change, decision, or action taken
- Show the pivot point that led to transformation
- Make it clear and actionable (what changed and why)
- Keep it simple and memorable

AFTER STATE (Middle-Late section):
- Show the dramatic improvement or new reality
- Contrast with the "before" state clearly
- Highlight the benefits, results, or positive outcomes
- Make it aspirational and inspiring

CLOSE (Last 3-5 seconds):
- End with an impactful payoff that reinforces the transformation
- Leave the viewer inspired or motivated
- Avoid heavy-handed sales pitches
- Natural conclusion that celebrates the change

═══════════════════════════════════════════════════════════════════════════════
WRITING STYLE
═══════════════════════════════════════════════════════════════════════════════
- Conversational, human, punchy
- Short sentences preferred (especially for fast-paced content)
- Concrete everyday moments over abstract advice
- Show, don't tell (use specific examples with clear contrast)
- Natural flow that tells a transformation story
- Use contrast effectively to highlight the change

AVOID:
- Filler intros: "In this video", "Today we will", "Let's talk about"
- Generic statements: "Many people struggle with..."
- Over-explaining: Trust the audience to understand
- Emojis/hashtags unless explicitly requested
- Repetitive phrases or filler words
- Vague transformations: Be specific about what changed

═══════════════════════════════════════════════════════════════════════════════
LENGTH & PACING
═══════════════════════════════════════════════════════════════════════════════
- Match the requested duration precisely
- Respect the target word count (with small tolerance)
- Keep the pacing appropriate for the duration:
  * Short (15-20s): Fast, punchy, quick contrast between before/after
  * Medium (25-35s): Balanced, natural rhythm with clear transformation arc
  * Long (40-60s): More depth, breathing room to show the journey
- Every word must earn its place - no filler

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
- Output ONLY the story script text
- No labels, no headings, no brackets, no bullet points
- No scene markers, no structure indicators
- Pure narrative text that flows naturally
- Ready for voiceover narration
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
Example 1 (Short, Fast-Paced):
Idea: "Morning routine transformation"
Output: "I used to wake up at 7:30, rush through everything, skip breakfast, and arrive at work stressed. My mornings were chaos. Then I decided to wake up 30 minutes earlier. That simple change transformed everything. Now I wake up at 7, have time for coffee, eat properly, and arrive calm and prepared. My entire day changed because of one decision."

Example 2 (Medium, Balanced):
Idea: "Home organization before and after"
Output: "My apartment was a mess. Clothes everywhere, dishes piled up, no system at all. I felt overwhelmed just looking at it. I spent one weekend organizing everything: one room at a time, everything in its place. The transformation was incredible. Now I come home to a space that actually relaxes me. Everything has a home, and I know exactly where to find it. My stress levels dropped completely."
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
  const wordsPerSecond = isArabic ? 2.0 : 2.6;

  const targetWords = Math.round(duration * wordsPerSecond);
  const minWords = Math.round(targetWords * 0.9);
  const maxWords = Math.round(targetWords * 1.1);

  // Determine pacing based on duration
  const pacing = duration <= 20 ? 'fast' : duration <= 35 ? 'medium' : 'slow';
  const pacingGuidance = pacing === 'fast' 
    ? 'Fast-paced, high energy, quick cuts'
    : pacing === 'slow'
    ? 'More depth, breathing room, emotional moments'
    : 'Balanced rhythm, natural flow';

  // Build examples (model will adapt to input language automatically)
  const examples = buildExamples();

  return `
═══════════════════════════════════════════════════════════════════════════════
TASK: Write a Before–After Transformation Story Script
═══════════════════════════════════════════════════════════════════════════════

IDEA: "${idea}"
DURATION: ${duration} seconds
TARGET WORDS: ${targetWords} (allowed range: ${minWords}-${maxWords})
PACING: ${pacingGuidance}

═══════════════════════════════════════════════════════════════════════════════
REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. Start with a strong hook that shows the "before" state in a relatable way
2. Paint a vivid picture of the BEFORE situation (specific, concrete, emotionally resonant)
3. Show the TRANSFORMATION moment (the key change, decision, or action)
4. Contrast with the AFTER state (dramatic improvement, new reality, positive outcomes)
5. End with an impactful close that celebrates the transformation
6. Match the exact word count: ${targetWords} words (±10%)
7. Write in the SAME language as the idea (detected automatically from input)

═══════════════════════════════════════════════════════════════════════════════
TRANSFORMATION FOCUS
═══════════════════════════════════════════════════════════════════════════════
- The story must show a clear BEFORE → TRANSFORMATION → AFTER arc
- Use contrast effectively to highlight the change
- Make the transformation feel achievable and inspiring
- Be specific about what changed and the impact it had
- Show concrete results, not just vague improvements

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES (Learn from these patterns)
═══════════════════════════════════════════════════════════════════════════════

${examples}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Write a Before–After transformation story script for the idea above.

CRITICAL:
- Output ONLY the script text (no labels, no formatting, no sections)
- Respond in the SAME language as the idea
- Match the target word count: ${targetWords} words
- Make it engaging, relatable, and shareable
- Show a clear transformation with vivid before/after contrast
`;
}
