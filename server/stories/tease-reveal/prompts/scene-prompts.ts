/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEASE–REVEAL SCENE BREAKDOWN - PROFESSIONAL PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module handles the intelligent breakdown of tease-reveal stories into scenes
 * based on duration and pacing preferences. Focuses on building curiosity and suspense.
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
export interface VideoModelConstraints {
  id: string;
  label: string;
  supportedDurations: number[];
  minDuration: number;
  maxDuration: number;
  hasAudio: boolean;
  aspectRatios: string[];
}

/**
 * Pick a "short" duration suggestion for hook/final scenes when modelConstraints are present.
 * - Prefer the smallest supported duration <= 5s
 * - Otherwise use the smallest supported duration available
 * - Fallback to minDuration
 */
function pickShortDurationSuggestion(modelConstraints: VideoModelConstraints): number {
  const supported = (modelConstraints.supportedDurations || []).slice().filter(n => Number.isFinite(n)).sort((a, b) => a - b);
  if (supported.length === 0) return modelConstraints.minDuration;

  const underOrEqual5 = supported.filter(d => d <= 5);
  if (underOrEqual5.length > 0) return underOrEqual5[0];

  // If no <=5 exists, pick the shortest supported duration (best possible hook/final)
  return supported[0];
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

  const shortSuggestion = modelConstraints ? pickShortDurationSuggestion(modelConstraints) : null;

  return `
You are an elite video editor and scene architect with 15+ years of experience crafting viral Tease–Reveal content for TikTok, Instagram Reels, and YouTube Shorts.

Your expertise includes:
- Breaking down suspenseful narratives into perfectly-timed visual segments
- Building curiosity and tension that keeps viewers watching until the reveal
- Creating compelling visual storytelling that teases without spoiling
- Maximizing engagement through strategic pacing and timing
- Understanding the psychology of curiosity-driven content consumption

You have edited content that has generated billions of views and millions of shares by masterfully building anticipation and delivering satisfying reveals.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Break the provided story into EXACTLY ${sceneCount} scenes for a ${duration}-second video.

Each scene must:
- Have a clear visual focus
- Match the pacing style (${pacing})
- Respect duration constraints
- Create seamless narrative flow

═══════════════════════════════════════════════════════════════════════════════
PACING STYLE: ${pacing.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════

${pacing === 'slow' ? `
SLOW PACING CHARACTERISTICS:
• Fewer scenes, each holding longer (${range.avgDuration.min}-${range.avgDuration.max}s per scene)
• Allow moments to breathe and resonate emotionally
• Focus on emotional depth over rapid information delivery
• Build atmosphere through extended visual moments
• Perfect for: emotional stories, dramatic reveals, reflective content, personal journeys
• Scene transitions should feel smooth, unhurried, and contemplative
• Visuals can linger on emotional moments
` : pacing === 'fast' ? `
FAST PACING CHARACTERISTICS:
• More scenes, quick cuts (${range.avgDuration.min}-${range.avgDuration.max}s per scene)
• High energy, rapid information delivery
• Keep viewers on the edge with constant visual changes
• No scene should overstay its welcome - every second counts
• Perfect for: exciting content, quick tips, energetic reveals, action-packed stories
• Scene transitions should feel punchy, dynamic, and attention-grabbing
• Visuals should be snappy and impactful
` : `
MEDIUM PACING CHARACTERISTICS:
• Balanced scene count (${range.avgDuration.min}-${range.avgDuration.max}s per scene)
• Natural conversational rhythm that feels authentic
• Good mix of breathing room and momentum
• Neither rushed nor dragging - just right
• Perfect for: educational content, how-to stories, balanced narratives, tutorials
• Scene transitions should feel natural, flowing, and seamless
• Visuals should support the narrative without overwhelming
`}

═══════════════════════════════════════════════════════════════════════════════
SCENE STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

SCENE 1 - THE HOOK / TEASE (First ${Math.min(5, Math.round(duration * 0.1))} seconds):
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRITICAL: This scene determines if viewers keep watching                   │
│                                                                             │
│ Requirements:                                                               │
│ • Must grab attention IMMEDIATELY (within first 0.5 seconds)              │
│ • Create a compelling TEASE that promises something interesting            │
│ • Build curiosity without revealing what will be shown                     │
│ • Set up the mystery or intrigue that will be revealed later               │
│ • Make it SHORT and punchy                                                  │
│ ${shortSuggestion ? `• Use duration: ${shortSuggestion}s (shortest supported)` : '• Keep it under 5 seconds'} │
│                                                                             │
│ Visual Strategy:                                                            │
│ - Intriguing visual that hints at something without showing it fully        │
│ - Close-up or partial reveal that creates curiosity                        │
│ - Mystery elements, shadows, or obscured views                             │
│ - Visual that makes viewer want to know more                               │
└─────────────────────────────────────────────────────────────────────────────┘

MIDDLE SCENES - BUILDING TENSION & ANTICIPATION (Scenes 2 to ${sceneCount - 1}):
┌─────────────────────────────────────────────────────────────────────────────┐
│ These scenes build curiosity and tension toward the reveal                 │
│                                                                             │
│ Requirements:                                                               │
│ • Continue TEASING without revealing too early                             │
│ • Build anticipation and curiosity progressively                           │
│ • Add context or hints that make the reveal more compelling                │
│ • Each scene should have ONE clear visual focus                            │
│ • Maintain momentum and suspense - no filler or dead time                  │
│ • Duration per scene: ${range.avgDuration.min}-${range.avgDuration.max} seconds                              │
│                                                                             │
│ Visual Strategy:                                                            │
│ - Partial reveals, hints, or clues without full disclosure                 │
│ - Build visual tension through composition and pacing                      │
│ - Vary shot types (wide, medium, close-up) to control information reveal   │
│ - Use visual elements that hint at what's coming without showing it        │
│ - Keep transitions smooth and logical while maintaining mystery            │
└─────────────────────────────────────────────────────────────────────────────┘

FINAL SCENE - THE REVEAL (Last scene, 3-5 seconds):
┌─────────────────────────────────────────────────────────────────────────────┐
│ This scene delivers the REVEAL and creates shareability                     │
│                                                                             │
│ Requirements:                                                               │
│ • REVEAL what was being teased - deliver the payoff                        │
│ • Make the reveal satisfying and worth the build-up                        │
│ • Connect back to the tease from Scene 1                                   │
│ • Leave a memorable impression that sticks                                  │
│ • Create the urge to share, save, or watch again                            │
│ • Keep it impactful and short                                               │
│ ${shortSuggestion ? `• Use duration: ${shortSuggestion}s (shortest supported)` : '• Keep it under 5 seconds'} │
│                                                                             │
│ Visual Strategy:                                                            │
│ - Full reveal of what was teased                                           │
│ - Clear, satisfying visual that delivers on the promise                    │
│ - Memorable final frame that justifies the anticipation                    │
│ - Visual closure that feels complete and rewarding                         │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: WORD COUNT FOR VOICEOVER TIMING
═══════════════════════════════════════════════════════════════════════════════

READING SPEED:
• English: ~2.5 words/second
• Arabic/Other: ~2.0 words/second

WORD COUNT TABLE (STRICT GUIDELINES):
┌──────────────┬────────────────┬───────────────┐
│ Duration     │ English Words  │ Arabic Words  │
├──────────────┼────────────────┼───────────────┤
│ 3 seconds    │ 6-8 words      │ 5-7 words     │
│ 5 seconds    │ 10-13 words    │ 8-11 words    │
│ 7 seconds    │ 15-18 words    │ 12-15 words   │
│ 10 seconds   │ 22-28 words    │ 18-22 words   │
│ 15 seconds   │ 35-40 words    │ 28-32 words   │
└──────────────┴────────────────┴───────────────┘

WORD COUNT VALIDATION PROCESS:
1) Count words in narration (split by spaces, filter empty)
2) Calculate: expected_words = duration × 2.5 (English) or × 2.0 (Arabic)
3) If too many words:
   - Shorten narration (preserve meaning, minimal edits)
   - OR increase scene duration (if constraints allow)
4) If too few words:
   - You may add a few words ONLY if needed for clarity
   - Do NOT pad with filler

⚠️ CRITICAL: Narration word count MUST match duration constraints!

═══════════════════════════════════════════════════════════════════════════════
NARRATION DISTRIBUTION STRATEGY
═══════════════════════════════════════════════════════════════════════════════

• Split the story text EXACTLY across ${sceneCount} scenes
• Keep natural sentence boundaries - NEVER split mid-sentence
• Preserve the original language and wording as much as possible
• If original text is too long, CONDENSE while keeping core meaning (minimal edits)
• If original text is too short, you may expand slightly (only if needed)

DISTRIBUTION RULES:
- Scene 1 (Hook): Short, punchy narration (3-8 words typically)
- Middle scenes: Balanced narration distribution
- Final scene: Short, memorable closing (3-8 words typically)

═══════════════════════════════════════════════════════════════════════════════
⚠️ LANGUAGE & DIACRITICS PRESERVATION
═══════════════════════════════════════════════════════════════════════════════

LANGUAGE HANDLING:
• ALL text (description AND narration) MUST be in the SAME LANGUAGE as the input story
• If story is Arabic → descriptions and narration in Arabic
• If story is English → descriptions and narration in English
• Match the tone and dialect of the original story

ARABIC DIACRITICS (TASHKEEL/HARAKAT):
If the story contains Arabic diacritics (◌َ ◌ُ ◌ِ ◌ْ ◌ّ ◌ً ◌ٌ ◌ٍ):
• PRESERVE all diacritics EXACTLY as they appear in the original text
• Do NOT remove, modify, or add diacritics
• Maintain diacritics in BOTH description and narration fields

${modelConstraints ? `
═══════════════════════════════════════════════════════════════════════════════
🎬 VIDEO MODEL CONSTRAINTS (MANDATORY - ${modelConstraints.label})
═══════════════════════════════════════════════════════════════════════════════

⚠️ ALLOWED SCENE DURATIONS (ONLY THESE VALUES):
[${modelConstraints.supportedDurations.join(', ')}] seconds

• Minimum: ${modelConstraints.minDuration} seconds
• Maximum: ${modelConstraints.maxDuration} seconds

⚠️ CRITICAL CONSTRAINTS:
- Each scene duration MUST be one of: [${modelConstraints.supportedDurations.join(', ')}] seconds
- NO OTHER DURATIONS ARE ALLOWED
- If you need a 3-5 second scene but it's not in the list, use: ${shortSuggestion}s (shortest supported)
- Hook and final scenes should use the shortest available duration: ${shortSuggestion}s

VALIDATION:
Before finalizing, verify:
✓ Every scene duration is in [${modelConstraints.supportedDurations.join(', ')}]
✓ Sum of all durations = EXACTLY ${duration} seconds
` : `
═══════════════════════════════════════════════════════════════════════════════
DURATION CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

• Each scene duration: ${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds
• Total duration: EXACTLY ${duration} seconds
• Average duration target: ~${avgDuration} seconds per scene
`}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS (MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Total scenes = EXACTLY ${sceneCount} (no more, no less)
✓ Sum of all durations = EXACTLY ${duration} seconds (no rounding errors)
${modelConstraints ? `✓ Scene duration MUST be one of: [${modelConstraints.supportedDurations.join(', ')}] seconds` : `✓ Each scene duration: ${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds`}
✓ Average duration target: ~${avgDuration} seconds per scene
✓ Description ≠ Narration (different content, same language)
✓ All text in the SAME LANGUAGE as input story

NEVER:
${modelConstraints ? `✗ NEVER use a duration NOT in [${modelConstraints.supportedDurations.join(', ')}]` : `✗ Never have a scene less than ${SCENE_LIMITS.SCENE_DURATION_MIN} seconds`}
✗ Never skip any part of the story
✗ Never assign more words than the duration allows
✗ Never copy narration into description (or vice versa)
✗ Never split sentences mid-way across scenes

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTENT: DESCRIPTION vs NARRATION (CRITICAL DISTINCTION)
═══════════════════════════════════════════════════════════════════════════════

Each scene requires TWO DISTINCT text fields:

1) DESCRIPTION (Visual Context - What Viewer SEES):
   • 1-2 sentences maximum
   • MUST be in the SAME LANGUAGE as the story
   • Describes what the VIEWER SEES visually (not hears)
   • MUST NOT copy narration verbatim
   • MUST NOT quote narration lines
   • Focus on visual elements: setting, actions, expressions, composition
   • Example: "A person sitting at a desk, looking frustrated, with papers scattered around"

2) NARRATION (Voiceover - What Viewer HEARS):
   • The spoken text assigned to this scene (from the original story)
   • MUST be in the SAME LANGUAGE as the story
   • Preserve diacritics if Arabic
   • Match word count to duration (see word count table above)
   • Example: "I was always late for work. Every morning was a struggle."

⚠️ CRITICAL: DESCRIPTION ≠ NARRATION
- They serve different purposes
- They contain different content
- They are in the same language
- Description = visual, Narration = audio

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return valid JSON that matches the provided JSON Schema exactly.
• No extra fields
• No invalid JSON
• All required fields present
• All constraints satisfied
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
  const avgDuration = getAverageSceneDuration(duration, sceneCount);

  // Detect language for examples
  const isArabic = /[\u0600-\u06FF]/.test(storyText);
  const wordsPerSecond = isArabic ? 2.0 : 2.5;

  return `
═══════════════════════════════════════════════════════════════════════════════
SCENE BREAKDOWN REQUEST
═══════════════════════════════════════════════════════════════════════════════

STORY TEXT:
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
• Average Duration: ~${avgDuration} seconds per scene
• Reading Speed: ${wordsPerSecond} words/second

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES (Learn from these patterns)
═══════════════════════════════════════════════════════════════════════════════

Example 1: Tease-Reveal Story
Story: "I found one trick that changed my entire workday. Everyone thinks I'm super productive because I finish everything by noon. They keep asking how I do it. The secret? I stopped checking my phone for the first three hours. That's it. No notifications, no distractions, just pure focus. My productivity tripled. The simplest change made the biggest difference."

Scenes:
1. { sceneNumber: 1, duration: 3, description: "Partial view of a desk with completed work, clock showing noon, person's satisfied expression in background blur, mysterious atmosphere", narration: "I found one trick that changed my entire workday. Everyone thinks I'm super productive because I finish everything by noon." }
2. { sceneNumber: 2, duration: 5, description: "People asking questions, pointing at the person, curiosity and intrigue in their expressions, building anticipation", narration: "They keep asking how I do it." }
3. { sceneNumber: 3, duration: 4, description: "Phone being set aside, screen going dark, focus mode activated, work environment becoming clear and organized", narration: "The secret? I stopped checking my phone for the first three hours. That's it." }
4. { sceneNumber: 4, duration: 3, description: "Full reveal: person at clean desk, phone far away, multiple completed tasks visible, productivity chart showing dramatic improvement, satisfied smile", narration: "My productivity tripled. The simplest change made the biggest difference." }

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

STEP 1: READ & UNDERSTAND
- Read the story text carefully
- Understand the tease-reveal narrative: TEASE → BUILD TENSION → REVEAL
- Identify what is being teased, how tension builds, and what is revealed

STEP 2: PLAN DURATIONS
- Plan scene durations FIRST so they sum to EXACTLY ${duration} seconds
- Scene 1 (Hook): Use shortest duration (3-5s)
- Middle scenes: Use ${range.avgDuration.min}-${range.avgDuration.max}s range
- Final scene: Use shortest duration (3-5s)
- Verify: sum(durations) = ${duration}

STEP 3: CREATE VISUAL SCENES
- Imagine ${sceneCount} distinct visual scenes that represent this story
- Each scene should have a clear visual focus
- Create visual variety (different shots, settings, actions)

STEP 4: ASSIGN CONTENT
For EACH scene:
- description = What viewer SEES (visual, 1-2 sentences, same language)
- narration = What viewer HEARS (from story text, same language)
- Ensure description ≠ narration (no copying)

STEP 5: VALIDATE WORD COUNT
For EACH scene:
- Count narration words
- Verify: word_count ≈ duration × ${wordsPerSecond}
- Adjust if needed (shorten or expand minimally)

STEP 6: FINAL CHECK
✓ scenes.length = ${sceneCount}
✓ sum(durations) = ${duration}
✓ description ≠ narration (no copying)
✓ All text in same language as story
✓ Word counts match durations

═══════════════════════════════════════════════════════════════════════════════
GENERATE SCENES NOW
═══════════════════════════════════════════════════════════════════════════════

Generate the ${sceneCount} scenes as JSON matching the schema exactly.
`;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JSON SCHEMA BUILDER - SCENE OUTPUT VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function buildSceneSchema(
  sceneCount: number,
  totalDuration: number,
  modelConstraints?: VideoModelConstraints | null
) {
  const sceneProperties: any = {
    sceneNumber: {
      type: "number",
      multipleOf: 1, // enforce integer-like values without changing type
      minimum: 1,
      description: "Scene number (sequential, starting from 1)",
    },
    duration: {
      type: "number",
      multipleOf: 1, // enforce integer-like values without changing type
      description: "Scene duration in seconds",
      ...(modelConstraints ? {
        enum: modelConstraints.supportedDurations,
      } : {
        minimum: SCENE_LIMITS.SCENE_DURATION_MIN,
        maximum: SCENE_LIMITS.SCENE_DURATION_MAX,
      }),
    },
    description: {
      type: "string",
      description: "Visual description of what the viewer sees in this scene. MUST be in the SAME LANGUAGE as the input story text. MUST NOT copy/quote narration verbatim.",
    },
    narration: {
      type: "string",
      description: "Exact voiceover text from the original story. MUST be in the SAME LANGUAGE as the input story text.",
    },
  };

  const requiredFields = ["sceneNumber", "duration", "description", "narration"];

  return {
    type: "object",
    properties: {
      scenes: {
        type: "array",
        minItems: sceneCount,
        maxItems: sceneCount,
        items: {
          type: "object",
          properties: sceneProperties,
          required: requiredFields,
          additionalProperties: false,
        },
      },
      totalScenes: {
        type: "number",
        multipleOf: 1,
        description: "Total number of scenes (must equal scenes array length)",
        const: sceneCount,
      },
      totalDuration: {
        type: "number",
        multipleOf: 1,
        description: "Sum of all scene durations (must equal total video duration)",
        const: totalDuration,
      },
    },
    required: ["scenes", "totalScenes", "totalDuration"],
    additionalProperties: false,
  };
}
