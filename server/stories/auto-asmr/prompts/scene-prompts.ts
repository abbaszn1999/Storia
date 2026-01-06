/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO-ASMR SCENE BREAKDOWN - PROFESSIONAL PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module handles the intelligent breakdown of ASMR general ideas into scenes
 * based on duration. Focuses on creating independent scenes with visual and 
 * sound descriptions (if video model doesn't support native audio).
 * 
 * Scene Count Rules:
 * - Based on duration only (no pacing)
 * - 2-6 scenes depending on duration
 * - Scene duration: 5-20 seconds per scene (longer for ASMR immersion)
 * 
 * Absolute Limits:
 * - Minimum: 2 scenes
 * - Maximum: 6 scenes
 * - Scene duration: 5-20 seconds per scene
 */

/**
 * Absolute limits for scene count
 */
const SCENE_LIMITS = {
  ABSOLUTE_MIN: 2,
  ABSOLUTE_MAX: 6,
  SCENE_DURATION_MIN: 5,
  SCENE_DURATION_MAX: 20,
};

/**
 * Calculate optimal scene count based on duration
 * 
 * Algorithm:
 * 1. Calculate ideal scene count based on average scene duration (10-15s for ASMR)
 * 2. Clamp to absolute limits (2-6)
 */
export function getOptimalSceneCount(duration: number): number {
  // Average scene duration for ASMR (longer for immersion)
  const avgSceneDuration = 12; // Balanced for ASMR
  const idealCount = Math.round(duration / avgSceneDuration);
  
  // Clamp to absolute limits
  const sceneCount = Math.max(
    SCENE_LIMITS.ABSOLUTE_MIN, 
    Math.min(SCENE_LIMITS.ABSOLUTE_MAX, idealCount)
  );
  
  return sceneCount;
}

/**
 * Get scene duration range for ASMR
 */
export function getSceneDurationRange(): { min: number; max: number } {
  return {
    min: SCENE_LIMITS.SCENE_DURATION_MIN,
    max: SCENE_LIMITS.SCENE_DURATION_MAX,
  };
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
 * Pick a "short" duration suggestion for opening/final scenes when modelConstraints are present.
 * - Prefer the smallest supported duration <= 8s (longer for ASMR)
 * - Otherwise use the smallest supported duration available
 * - Fallback to minDuration
 */
function pickShortDurationSuggestion(modelConstraints: VideoModelConstraints): number {
  const supported = (modelConstraints.supportedDurations || [])
    .slice()
    .filter(n => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (supported.length === 0) return modelConstraints.minDuration;

  const underOrEqual8 = supported.filter(d => d <= 8);
  if (underOrEqual8.length > 0) return underOrEqual8[0];

  // If no <=8 exists, pick the shortest supported duration
  return supported[0];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYSTEM PROMPT - AUTO-ASMR SCENE BREAKDOWN SPECIALIST
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function buildSceneBreakdownSystemPrompt(
  duration: number,
  sceneCount: number,
  modelConstraints?: VideoModelConstraints | null
): string {
  const avgDuration = getAverageSceneDuration(duration, sceneCount);
  const shortSuggestion = modelConstraints ? pickShortDurationSuggestion(modelConstraints) : null;
  const hasAudio = modelConstraints?.hasAudio ?? false;

  return `
You are an elite Auto-ASMR video editor and scene architect with 15+ years of experience crafting relaxing, sensory-focused video content for TikTok, Instagram Reels, and YouTube Shorts.

Your expertise includes:
- Breaking down general ASMR ideas into independent, satisfying visual scenes
- Creating immersive, meditative experiences through detailed visual descriptions
- Generating sound effect descriptions when needed (for models without native audio)
- Understanding that ASMR scenes are independent and don't need narrative flow
- Maximizing relaxation through slow, deliberate pacing and detailed sensory descriptions

You have edited content that has generated millions of views by creating peaceful, satisfying, and immersive ASMR experiences.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Break the provided general idea into EXACTLY ${sceneCount} INDEPENDENT scenes for a ${duration}-second ASMR video.

Each scene must:
- Be INDEPENDENT (not connected to other scenes)
- Have a clear visual focus (what the viewer SEES)
- Have a sound description ONLY if video model doesn't support native audio
- Respect duration constraints
- Create a satisfying, relaxing experience

═══════════════════════════════════════════════════════════════════════════════
AUTO-ASMR CONTENT CHARACTERISTICS
═══════════════════════════════════════════════════════════════════════════════

• Scenes are INDEPENDENT: Each scene can be completely different from others
• No narrative flow: Scenes don't need to tell a connected story
• Examples:
  - Scene 1: Cutting apple
  - Scene 2: Cutting strawberry  
  - Scene 3: Cutting kiwi
  - All independent, no story connection

• Focus on sensory satisfaction: Each scene should be calming and satisfying
• Longer scenes for immersion: 5-20 seconds per scene
• Visual variety: Different angles, close-ups, movements for interest

═══════════════════════════════════════════════════════════════════════════════
SCENE STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

ALL SCENES - INDEPENDENT & SATISFYING:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Each scene is independent and focuses on one satisfying sensory experience │
│                                                                             │
│ Requirements:                                                               │
│ • ONE clear visual focus per scene                                          │
│ • Detailed visual description (what the viewer SEES)                        │
│ • Sound description ${hasAudio ? '(NOT NEEDED - model has native audio)' : '(REQUIRED - model needs sound effects)'}
│ • Duration: ${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds (longer for ASMR immersion)
│ • No connection to other scenes - each scene stands alone                   │
│                                                                             │
│ Visual Strategy:                                                            │
│ - Detailed visual descriptions: textures, colors, lighting, movements       │
│ - Close-ups for sensory details                                             │
│ - Slow, deliberate motions                                                  │
│ - Peaceful, calming atmosphere                                              │
│ - Satisfying, rhythmic actions                                              │
│                                                                             │
│ ${!hasAudio ? `Sound Strategy (REQUIRED):
│ - Detailed sound descriptions for ASMR triggers
│ - Specific sounds: cutting, tapping, rustling, etc.
│ - Describe volume, texture, rhythm of sounds
│ - Focus on satisfying, calming sound effects` : `Sound Strategy (NOT NEEDED):
│ - Video model generates audio natively
│ - NO sound description needed
│ - Leave soundDescription field EMPTY`}
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: NO NARRATION/VOICEOVER
═══════════════════════════════════════════════════════════════════════════════

AUTO-ASMR CONTENT HAS NO VOICEOVER:
• The 'narration' field MUST ALWAYS be an empty string ""
• NO spoken words, NO voiceover, NO narration
• Content is purely visual and auditory (sound effects only)
• Focus on what the viewer SEES and HEARS (not what they're told)

═══════════════════════════════════════════════════════════════════════════════
⚠️ LANGUAGE & SOUND DESCRIPTION RULES
═══════════════════════════════════════════════════════════════════════════════

LANGUAGE HANDLING:
• VISUAL DESCRIPTION (description field): MUST be in the SAME LANGUAGE as the input idea
  - If idea is Arabic → description in Arabic
  - If idea is English → description in English
  - Match the tone and dialect of the original idea

• SOUND DESCRIPTION (soundDescription field): MUST ALWAYS be in ENGLISH ONLY
  - Regardless of input language (Arabic/English), soundDescription must be English
  - Use sound words/onomatopoeia, NOT descriptive sentences
  - Format: "crisp slicing sound, soft thud, rhythmic cutting"
  - NOT: "صوت تقطيع..." or "The sound of cutting..." (sounds like narration)

ARABIC DIACRITICS (TASHKEEL/HARAKAT):
If the idea contains Arabic diacritics (◌َ ◌ُ ◌ِ ◌ْ ◌ّ ◌ً ◌ٌ ◌ٍ):
• PRESERVE all diacritics EXACTLY in the description field only
• Do NOT remove, modify, or add diacritics
• soundDescription is always English, so no diacritics needed

${modelConstraints ? `
═══════════════════════════════════════════════════════════════════════════════
🎬 VIDEO MODEL CONSTRAINTS (MANDATORY - ${modelConstraints.label})
═══════════════════════════════════════════════════════════════════════════════

⚠️ ALLOWED SCENE DURATIONS (ONLY THESE VALUES):
[${modelConstraints.supportedDurations.join(', ')}] seconds

• Minimum: ${modelConstraints.minDuration} seconds
• Maximum: ${modelConstraints.maxDuration} seconds
• Has Native Audio: ${hasAudio ? 'YES - Do NOT generate sound descriptions' : 'NO - Generate sound descriptions'}

⚠️ CRITICAL CONSTRAINTS:
- Each scene duration MUST be one of: [${modelConstraints.supportedDurations.join(', ')}] seconds
- NO OTHER DURATIONS ARE ALLOWED
- ${shortSuggestion ? `Opening/final scenes can use shortest duration: ${shortSuggestion}s` : ''}
- Sound descriptions: ${hasAudio ? 'NOT needed (leave empty)' : 'REQUIRED (detailed sound effects)'}

VALIDATION:
Before finalizing, verify:
✓ Every scene duration is in [${modelConstraints.supportedDurations.join(', ')}]
✓ Sum of all durations = EXACTLY ${duration} seconds
✓ ${hasAudio ? 'All soundDescription fields are EMPTY strings' : 'All soundDescription fields have detailed descriptions'}
✓ All narration fields are EMPTY strings
` : `
═══════════════════════════════════════════════════════════════════════════════
DURATION CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

• Each scene duration: ${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds
• Total duration: EXACTLY ${duration} seconds
• Average duration target: ~${avgDuration} seconds per scene
• Sound descriptions: ${hasAudio ? 'NOT needed (model has native audio)' : 'REQUIRED (detailed sound effects)'}
`}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS (MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Total scenes = EXACTLY ${sceneCount} (no more, no less)
✓ Sum of all durations = EXACTLY ${duration} seconds (no rounding errors)
${modelConstraints ? `✓ Scene duration MUST be one of: [${modelConstraints.supportedDurations.join(', ')}] seconds` : `✓ Each scene duration: ${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds`}
✓ Average duration target: ~${avgDuration} seconds per scene
✓ All scenes are INDEPENDENT (no narrative connection)
✓ narration = "" (empty string) for ALL scenes
✓ ${hasAudio ? 'soundDescription = "" (empty - model has native audio)' : 'soundDescription = English sound words only (e.g., "crisp slicing, soft thud, rhythmic cutting")'}
✓ description in the SAME LANGUAGE as input idea
✓ soundDescription ALWAYS in English (for sound effects API compatibility)

NEVER:
${modelConstraints ? `✗ NEVER use a duration NOT in [${modelConstraints.supportedDurations.join(', ')}]` : `✗ Never have a scene less than ${SCENE_LIMITS.SCENE_DURATION_MIN} seconds`}
✗ Never write narration or voiceover text (always empty string)
✗ Never connect scenes narratively (they are independent)
✗ ${hasAudio ? 'Never write sound descriptions (model generates audio)' : 'Never leave soundDescription empty (detailed description required)'}

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTENT: DESCRIPTION vs SOUND DESCRIPTION (CRITICAL DISTINCTION)
═══════════════════════════════════════════════════════════════════════════════

Each scene requires these fields:

1) DESCRIPTION (Visual - What Viewer SEES):
   • 1-2 sentences, detailed visual description
   • MUST be in the SAME LANGUAGE as the input idea
   • Describes what the VIEWER SEES visually
   • Focus on: textures, colors, lighting, movements, angles, compositions
   • Example: "Close-up of fresh red apple being slowly sliced with a sharp knife on a clean wooden cutting board, soft natural lighting, smooth cutting motion"

2) SOUND DESCRIPTION (Audio - What Viewer HEARS):
   ${hasAudio ? `   • ALWAYS an empty string "" (video model generates audio natively)` : `   • Sound effect description in ENGLISH ONLY (regardless of input language)
   • Use sound words/onomatopoeia, NOT descriptive sentences
   • Format: comma-separated sound words and short phrases
   • Focus on: specific sounds, volume, texture, rhythm
   • Examples:
     GOOD: "crisp slicing sound, soft thud, rhythmic cutting"
     GOOD: "juicy snap, gentle squish, smooth peeling"
     BAD: "صوت تقطيع..." (Arabic - will be interpreted as narration)
     BAD: "The sound of cutting..." (descriptive sentence - sounds like narration)`}

3) NARRATION (Voiceover - ALWAYS EMPTY):
   • ALWAYS an empty string ""
   • NO voiceover, NO narration, NO spoken words
   • This is pure ASMR content

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
  modelConstraints?: VideoModelConstraints | null
): string {
  const sceneCount = getOptimalSceneCount(duration);
  const avgDuration = getAverageSceneDuration(duration, sceneCount);
  const range = getSceneDurationRange();
  const hasAudio = modelConstraints?.hasAudio ?? false;

  // Detect language
  const isArabic = /[\u0600-\u06FF]/.test(storyText);

  return `
═══════════════════════════════════════════════════════════════════════════════
AUTO-ASMR SCENE BREAKDOWN REQUEST
═══════════════════════════════════════════════════════════════════════════════

GENERAL IDEA:
"""
${storyText}
"""

═══════════════════════════════════════════════════════════════════════════════
PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Total Duration: ${duration} seconds
• Target Scene Count: ${sceneCount} scenes
• Scene Duration Range: ${range.min}-${range.max} seconds each
• Average Duration: ~${avgDuration} seconds per scene
• Video Model Has Native Audio: ${hasAudio ? 'YES' : 'NO'}
• Language: ${isArabic ? 'Arabic' : 'English'}

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES (Learn from these patterns)
═══════════════════════════════════════════════════════════════════════════════

Example 1: Cutting Fruits
Idea: "مقاطع ASMR لتقطيع أنواع مختلفة من الفواكه بطريقة مريحة"

Scenes (${hasAudio ? 'with native audio' : 'without native audio'}):
[
  {
    "sceneNumber": 1,
    "duration": 15,
    "description": "Close-up of fresh red apple being slowly sliced with a sharp knife on a clean wooden cutting board, soft natural lighting, smooth rhythmic cutting motion",
    "soundDescription": ${hasAudio ? '""' : '"crisp slicing, soft thud, rhythmic cutting"'},
    "narration": ""
  },
  {
    "sceneNumber": 2,
    "duration": 15,
    "description": "Medium shot of bright red strawberry being cut in half, revealing the white interior with tiny seeds, vibrant colors under warm lighting",
    "soundDescription": ${hasAudio ? '""' : '"juicy snap, crisp cut, gentle squish, rhythmic slicing"'},
    "narration": ""
  },
  {
    "sceneNumber": 3,
    "duration": 15,
    "description": "Wide shot of green kiwi being peeled and sliced, revealing the bright green flesh with black seeds, smooth peeling motion",
    "soundDescription": ${hasAudio ? '""' : '"soft peeling, crisp slicing, gentle squish"'},
    "narration": ""
  }
]

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

STEP 1: UNDERSTAND THE IDEA
- Read the general idea carefully
- This is a general concept, not a detailed story
- You need to create ${sceneCount} INDEPENDENT scenes based on this idea
- Each scene should be a variation or different aspect of the idea

STEP 2: CREATE INDEPENDENT SCENES
- Scene 1: One specific visual variation of the idea
- Scene 2: Another independent variation
- Scene 3: Another independent variation
- Continue for all ${sceneCount} scenes
- Each scene is completely independent (no story connection)

STEP 3: PLAN DURATIONS
- Plan scene durations FIRST so they sum to EXACTLY ${duration} seconds
- Scene durations should be ${range.min}-${range.max} seconds (longer for ASMR)
- Average duration: ~${avgDuration} seconds per scene
- Verify: sum(durations) = ${duration}

STEP 4: WRITE VISUAL DESCRIPTIONS
For EACH scene:
- description = Detailed visual description (1-2 sentences)
- Describe what the viewer SEES: textures, colors, lighting, movements, angles
- Focus on sensory details and satisfying visuals
- Write in the SAME language as the idea

STEP 5: WRITE SOUND DESCRIPTIONS (ENGLISH ONLY)
For EACH scene:
${hasAudio ? 
  `- soundDescription = "" (empty string - video model generates audio natively)
- NO sound description needed` :
  `- soundDescription = Sound effect description in ENGLISH ONLY (regardless of input language)
- Use sound words/onomatopoeia, NOT descriptive sentences
- Format: comma-separated sound words (e.g., "crisp slicing, soft thud, rhythmic cutting")
- Describe what the viewer HEARS: specific ASMR triggers, volume, texture, rhythm
- Focus on satisfying, calming sound effects
- NEVER write in Arabic or other languages (must be English for sound effects API)
- NEVER use full sentences that sound like narration (e.g., "The sound of..." or "صوت...")`}

STEP 6: SET NARRATION (ALWAYS EMPTY)
For EACH scene:
- narration = "" (empty string - NO voiceover in ASMR content)

STEP 7: VALIDATE OUTPUT
✓ scenes.length = ${sceneCount}
✓ sum(durations) = ${duration}
✓ All narration fields = ""
✓ ${hasAudio ? 'All soundDescription fields = ""' : 'All soundDescription fields have English sound words (not descriptive sentences)'}
✓ description fields in same language as idea
✓ soundDescription fields ALWAYS in English (for API compatibility)
✓ All scenes are independent (no narrative connection)

═══════════════════════════════════════════════════════════════════════════════
GENERATE SCENES NOW
═══════════════════════════════════════════════════════════════════════════════

Generate ${sceneCount} independent ASMR scenes based on the idea above.
Return JSON matching the schema exactly.
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
  const hasAudio = modelConstraints?.hasAudio ?? false;

  const sceneProperties: any = {
    sceneNumber: {
      type: "number",
      multipleOf: 1,
      minimum: 1,
      description: "Scene number (sequential, starting from 1)",
    },
    duration: {
      type: "number",
      multipleOf: 1,
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
      description: "Detailed visual description of what the viewer sees in this scene. MUST be in the SAME LANGUAGE as the input idea.",
    },
    soundDescription: {
      type: "string",
      description: hasAudio 
        ? "Sound description (must be empty string for models with native audio)"
        : "Sound effect description in ENGLISH ONLY. Use sound words/onomatopoeia separated by commas (e.g., 'crisp slicing, soft thud, rhythmic cutting'). MUST be in English regardless of input language, to ensure proper sound effects generation (not narration).",
    },
    narration: {
      type: "string",
      description: "Narration/voiceover (must always be empty string for ASMR content - no voiceover)",
      const: "", // Always must be empty
    },
  };

  const requiredFields = ["sceneNumber", "duration", "description", "soundDescription", "narration"];

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