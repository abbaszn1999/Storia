/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROBLEM-SOLUTION SCENE BREAKDOWN - PROFESSIONAL PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module handles the intelligent breakdown of stories into scenes
 * based on duration and pacing preferences.
 * 
 * Scene Count Rules:
 * - SLOW pacing: 3-5 scenes (longer, more emotional, detailed)
 * - MEDIUM pacing: 5-7 scenes (balanced, natural rhythm)
 * - FAST pacing: 7-10 scenes (quick cuts, high energy)
 * 
 * Absolute Limits:
 * - Minimum: 3 scenes (always)
 * - Maximum: 10 scenes (always)
 * - Scene duration: 3-15 seconds per scene
 */

type Pacing = 'slow' | 'medium' | 'fast';

/**
 * Scene count ranges based on pacing
 */
const PACING_SCENE_RANGES: Record<Pacing, { min: number; max: number; avgDuration: { min: number; max: number } }> = {
  slow: {
    min: 3,
    max: 5,
    avgDuration: { min: 8, max: 15 },
  },
  medium: {
    min: 5,
    max: 7,
    avgDuration: { min: 5, max: 10 },
  },
  fast: {
    min: 7,
    max: 10,
    avgDuration: { min: 3, max: 6 },
  },
};

/**
 * Absolute limits for scene count
 */
const SCENE_LIMITS = {
  ABSOLUTE_MIN: 3,
  ABSOLUTE_MAX: 10,
  SCENE_DURATION_MIN: 3,
  SCENE_DURATION_MAX: 15,
};

/**
 * Calculate optimal scene count based on duration AND pacing
 * 
 * The algorithm:
 * 1. Get the pacing range (min/max scenes for this pacing)
 * 2. Calculate ideal count based on duration / average scene duration
 * 3. Clamp to pacing range
 * 4. Clamp to absolute limits (3-10)
 */
export function getOptimalSceneCount(duration: number, pacing: Pacing): number {
  const range = PACING_SCENE_RANGES[pacing] || PACING_SCENE_RANGES.medium;
  
  // Calculate ideal scene count based on average duration for this pacing
  const avgSceneDuration = (range.avgDuration.min + range.avgDuration.max) / 2;
  const idealCount = Math.round(duration / avgSceneDuration);
  
  // Clamp to pacing range first
  let sceneCount = Math.max(range.min, Math.min(range.max, idealCount));
  
  // Then clamp to absolute limits
  sceneCount = Math.max(SCENE_LIMITS.ABSOLUTE_MIN, Math.min(SCENE_LIMITS.ABSOLUTE_MAX, sceneCount));
  
  return sceneCount;
}

/**
 * Get scene duration range based on pacing
 */
export function getSceneDurationRange(pacing: Pacing): { min: number; max: number } {
  return PACING_SCENE_RANGES[pacing]?.avgDuration || PACING_SCENE_RANGES.medium.avgDuration;
}

/**
 * Calculate average scene duration
 */
export function getAverageSceneDuration(duration: number, sceneCount: number): number {
  return Math.round(duration / sceneCount);
}

/**
 * Video Model Constraints interface (from shared/config/video-models.ts)
 */
interface VideoModelConstraints {
  id: string;
  label: string;
  supportedDurations: number[];
  minDuration: number;
  maxDuration: number;
  hasAudio: boolean;
  aspectRatios: string[];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYSTEM PROMPT - SCENE BREAKDOWN SPECIALIST
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function buildSceneBreakdownSystemPrompt(
  duration: number,
  sceneCount: number,
  pacing: Pacing,
  modelConstraints?: VideoModelConstraints | null
): string {
  const range = PACING_SCENE_RANGES[pacing] || PACING_SCENE_RANGES.medium;
  const avgDuration = getAverageSceneDuration(duration, sceneCount);

  return `
You are an elite video editor and scene architect who has crafted content for millions of viewers.
Your expertise is breaking down narratives into perfectly-timed visual segments that maximize engagement and emotional impact.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Break the provided story into EXACTLY ${sceneCount} scenes for a ${duration}-second video.

═══════════════════════════════════════════════════════════════════════════════
PACING STYLE: ${pacing.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════

${pacing === 'slow' ? `
SLOW PACING CHARACTERISTICS:
• Fewer scenes, each holding longer (${range.avgDuration.min}-${range.avgDuration.max}s per scene)
• Allow moments to breathe and resonate
• Focus on emotional depth over rapid information
• Build atmosphere through extended visual moments
• Perfect for: emotional stories, dramatic reveals, reflective content
• Scene transitions should feel smooth and unhurried
` : pacing === 'fast' ? `
FAST PACING CHARACTERISTICS:
• More scenes, quick cuts (${range.avgDuration.min}-${range.avgDuration.max}s per scene)
• High energy, rapid information delivery
• Keep viewers on the edge with constant visual changes
• No scene should overstay its welcome
• Perfect for: exciting content, quick tips, energetic reveals
• Scene transitions should feel punchy and dynamic
` : `
MEDIUM PACING CHARACTERISTICS:
• Balanced scene count (${range.avgDuration.min}-${range.avgDuration.max}s per scene)
• Natural conversational rhythm
• Good mix of breathing room and momentum
• Neither rushed nor dragging
• Perfect for: educational content, how-to stories, balanced narratives
• Scene transitions should feel natural and flowing
`}

═══════════════════════════════════════════════════════════════════════════════
SCENE STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

SCENE 1 - THE HOOK (First ${Math.min(5, Math.round(duration * 0.1))} seconds):
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Must grab attention IMMEDIATELY                                           │
│ • Pattern interrupt that stops the scroll                                   │
│ • Introduce the problem or intrigue                                         │
│ • Set the emotional tone for the entire video                              │
│ • Duration: 3-5 seconds (short and punchy)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

MIDDLE SCENES - THE JOURNEY:
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Each scene should have ONE clear focus                                    │
│ • Build tension, curiosity, or value progressively                         │
│ • Create visual variety - different "mental images" per scene              │
│ • Maintain momentum - no filler or dead time                               │
│ • Duration per scene: ${range.avgDuration.min}-${range.avgDuration.max} seconds                                       │
└─────────────────────────────────────────────────────────────────────────────┘

FINAL SCENE - THE PAYOFF (Last 3-5 seconds):
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Deliver the resolution, insight, or call-to-action                       │
│ • Leave a memorable impression                                              │
│ • Create the urge to share, save, or watch again                           │
│ • Duration: 3-5 seconds (impactful ending)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: WORD COUNT FOR VOICEOVER TIMING
═══════════════════════════════════════════════════════════════════════════════

For voiceover to match scene duration, narration word count MUST follow this:

READING SPEED: ~2.5 words/second (English) or ~2 words/second (Arabic/other)

WORD COUNT TABLE (STRICT - COUNT BEFORE ASSIGNING):
┌──────────────┬────────────────┬───────────────┐
│ Duration     │ English Words  │ Arabic Words  │
├──────────────┼────────────────┼───────────────┤
│ 3 seconds    │ 6-8 words      │ 5-7 words     │
│ 5 seconds    │ 10-13 words    │ 8-11 words    │
│ 7 seconds    │ 15-18 words    │ 12-15 words   │
│ 10 seconds   │ 22-28 words    │ 18-22 words   │
│ 15 seconds   │ 35-40 words    │ 28-32 words   │
└──────────────┴────────────────┴───────────────┘

⚠️ BEFORE ASSIGNING TEXT TO A SCENE:
1. Count the words in the narration segment
2. Calculate: expected_words = duration × 2.5 (or 2 for Arabic)
3. If words > expected: SHORTEN the text or INCREASE the duration
4. If words < expected: You may EXTEND the text slightly

═══════════════════════════════════════════════════════════════════════════════
NARRATION DISTRIBUTION
═══════════════════════════════════════════════════════════════════════════════

• Split the story text EXACTLY across ${sceneCount} scenes
• Each scene gets a complete thought or sentence(s)
• ⚠️ ADJUST text length to match duration (see word count table above)
• Preserve the original language and wording as much as possible
• Keep natural sentence boundaries - don't split mid-sentence
• If original text is too long, CONDENSE while keeping meaning

═══════════════════════════════════════════════════════════════════════════════
⚠️ ARABIC TEXT - PRESERVE DIACRITICS (TASHKEEL/HARAKAT)
═══════════════════════════════════════════════════════════════════════════════

If the story is in Arabic with diacritics (tashkeel):
• PRESERVE all diacritics exactly as they appear in the original text
• Do NOT remove or modify any ◌َ ◌ُ ◌ِ ◌ْ ◌ّ ◌ً ◌ٌ ◌ٍ
• Diacritics are REQUIRED for correct AI voice pronunciation

EXAMPLE:
✓ GOOD: "كُلُّنا نُؤَجِّلُ الحَياةَ" → Keep exactly as written
❌ BAD: Removing diacritics → "كلنا نؤجل الحياة"

${modelConstraints ? `
═══════════════════════════════════════════════════════════════════════════════
🎬 VIDEO MODEL CONSTRAINTS (MANDATORY - ${modelConstraints.label})
═══════════════════════════════════════════════════════════════════════════════

The selected video model "${modelConstraints.label}" has STRICT duration requirements.

⚠️ ALLOWED SCENE DURATIONS (ONLY THESE VALUES):
┌───────────────────────────────────────────────────────────────────────────┐
│  ${modelConstraints.supportedDurations.map(d => `${d}s`).join(' │ ')}  │
└───────────────────────────────────────────────────────────────────────────┘

• Minimum: ${modelConstraints.minDuration} seconds
• Maximum: ${modelConstraints.maxDuration} seconds

⚠️ CRITICAL: Each scene duration MUST be one of: [${modelConstraints.supportedDurations.join(', ')}] seconds
⚠️ ANY OTHER DURATION WILL CAUSE VIDEO GENERATION TO FAIL!

Example for ${duration}s total with ${sceneCount} scenes:
${(() => {
  // Calculate example distribution
  const supported = modelConstraints.supportedDurations;
  const target = Math.round(duration / sceneCount);
  const closest = supported.reduce((a, b) => Math.abs(b - target) < Math.abs(a - target) ? b : a);
  return `• Use durations like: ${closest}s per scene (adjust to sum to ${duration}s)`;
})()}
` : ''}
═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Total scenes = EXACTLY ${sceneCount}
✓ Sum of all durations = EXACTLY ${duration} seconds
${modelConstraints ? `✓ ⚠️ Scene duration MUST be one of: [${modelConstraints.supportedDurations.join(', ')}] seconds` : `✓ Each scene duration: ${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds`}
✓ Scene 1 (hook): ${modelConstraints ? modelConstraints.supportedDurations.filter(d => d <= 5)[0] || modelConstraints.minDuration : '3-5'} seconds
✓ Final scene: ${modelConstraints ? modelConstraints.supportedDurations.filter(d => d <= 5)[0] || modelConstraints.minDuration : '3-5'} seconds
✓ Average duration target: ~${avgDuration} seconds per scene
✓ ⚠️ WORD COUNT MUST MATCH DURATION (use table above!)

NEVER:
${modelConstraints ? `✗ NEVER use a duration NOT in [${modelConstraints.supportedDurations.join(', ')}] - this will break video generation!` : `✗ Never have a scene less than ${SCENE_LIMITS.SCENE_DURATION_MIN} seconds`}
✗ Never have a scene more than ${modelConstraints?.maxDuration || SCENE_LIMITS.SCENE_DURATION_MAX} seconds
✗ Never skip any part of the story
✗ Never assign more words than the duration allows

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this exact structure:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": <seconds>,
      "narration": "<exact text from story for this scene>"
    },
    ...
  ],
  "totalScenes": ${sceneCount},
  "totalDuration": ${duration}
}
`;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USER PROMPT - SCENE BREAKDOWN REQUEST
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function buildSceneUserPrompt(
  storyText: string,
  duration: number,
  pacing: Pacing
): string {
  const sceneCount = getOptimalSceneCount(duration, pacing);
  const range = PACING_SCENE_RANGES[pacing] || PACING_SCENE_RANGES.medium;

  return `
═══════════════════════════════════════════════════════════════════════════════
SCENE BREAKDOWN REQUEST
═══════════════════════════════════════════════════════════════════════════════

STORY TO BREAK DOWN:
"""
${storyText}
"""

═══════════════════════════════════════════════════════════════════════════════
PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Total Duration: ${duration} seconds
• Pacing Style: ${pacing.toUpperCase()}
• Target Scene Count: ${sceneCount} scenes
• Scene Duration Range: ${range.avgDuration.min}-${range.avgDuration.max} seconds each

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Read the story carefully
2. Identify natural breaking points (sentence boundaries, topic shifts)
3. Divide into EXACTLY ${sceneCount} scenes
4. Assign durations that:
   - Sum to EXACTLY ${duration} seconds
   - Match the ${pacing} pacing style
   - Give the hook (scene 1) 3-5 seconds
   - Give the ending (final scene) 3-5 seconds
5. Each scene's narration = exact text from the story (no modifications)

Generate the scene breakdown as JSON now.
`;
}
