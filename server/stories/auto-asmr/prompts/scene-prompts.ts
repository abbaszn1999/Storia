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
 * Validate and sanitize input parameters for scene breakdown
 * Implements input validation best practices
 */
function validateSceneInput(params: {
  storyText: string;
  duration: number;
  modelConstraints?: VideoModelConstraints | null;
}): { storyText: string; duration: number; modelConstraints?: VideoModelConstraints | null } {
  let { storyText, duration, modelConstraints } = params;

  // Sanitize storyText: trim and validate length
  storyText = storyText.trim();
  if (!storyText || storyText.length === 0) {
    throw new Error('Story text cannot be empty');
  }

  // Limit story text length to prevent context overflow
  const MAX_STORY_LENGTH = 2000;
  if (storyText.length > MAX_STORY_LENGTH) {
    storyText = storyText.substring(0, MAX_STORY_LENGTH).trim() + '...';
  }

  // Validate duration: ensure reasonable bounds
  const MIN_DURATION = 10;
  const MAX_DURATION = 300;
  duration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(duration)));

  // Validate model constraints if provided
  if (modelConstraints) {
    if (!modelConstraints.supportedDurations || modelConstraints.supportedDurations.length === 0) {
      throw new Error('Model constraints must have supported durations');
    }
    
    // NOTE: We don't validate total duration against model constraints here
    // because the total duration will be split into multiple scenes.
    // Each individual scene duration will be validated against model constraints
    // during scene generation. The total duration can be larger than maxDuration
    // as long as it can be divided into scenes that fit within the model's limits.
    
    // Only validate that we have a valid model configuration
    if (modelConstraints.minDuration <= 0 || modelConstraints.maxDuration <= 0) {
      throw new Error('Model constraints must have positive min and max durations');
    }
  }

  return { storyText, duration, modelConstraints };
}

/**
 * Calculate optimal scene count based on duration
 * 
 * Algorithm:
 * 1. Calculate ideal scene count based on average scene duration (10-15s for ASMR)
 * 2. Clamp to absolute limits (2-6)
 * 
 * Note: When model constraints are present, the AI will handle dividing
 * the total duration into scenes that fit within the model's supported durations.
 * This function provides a reasonable starting point for scene count.
 */
export function getOptimalSceneCount(duration: number, modelConstraints?: VideoModelConstraints | null): number {
  // Validate duration input
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('Duration must be a positive number');
  }

  // If model constraints exist, try to optimize based on max supported duration
  if (modelConstraints && modelConstraints.supportedDurations && modelConstraints.supportedDurations.length > 0) {
    const maxSupported = Math.max(...modelConstraints.supportedDurations);
    // Use max supported duration as average to minimize number of scenes
    const idealCount = Math.ceil(duration / maxSupported);
    // Ensure we have at least 2 scenes and at most 6
    return Math.max(
      SCENE_LIMITS.ABSOLUTE_MIN,
      Math.min(SCENE_LIMITS.ABSOLUTE_MAX, idealCount)
    );
  }

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
 * Get context guidance based on video duration and scene count
 * Applies context management best practices for scene breakdown
 */
function getDurationContextForScenes(duration: number, sceneCount: number): string {
  const avgDuration = duration / sceneCount;
  
  if (duration <= 30) {
    return "Short video - focus on 2-3 core scenes with clear, focused visuals. Each scene should be impactful and satisfying.";
  } else if (duration <= 60) {
    return "Medium video - create varied scenes with good visual diversity. Balance scene durations for smooth pacing.";
  } else {
    return "Longer video - you can include more detailed scenes and variations. Ensure each scene maintains viewer engagement.";
  }
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

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE & EXPERTISE
═══════════════════════════════════════════════════════════════════════════════
- Breaking down general ASMR ideas into independent, satisfying visual scenes
- Creating immersive, meditative experiences through detailed visual descriptions
- Generating sound effect descriptions when needed (for models without native audio)
- Understanding that ASMR scenes are independent and don't need narrative flow
- Maximizing relaxation through slow, deliberate pacing and detailed sensory descriptions
- Maintaining consistency with input language for visual descriptions
- Ensuring sound descriptions are always in English for API compatibility

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

This is a multi-stage pipeline:
1. YOUR STAGE: Break general idea into ${sceneCount} independent scenes
2. NEXT STAGE: Visual generation based on your descriptions
3. FINAL STAGE: Audio generation (if needed) based on sound descriptions

Your output must be ready for the next stages without requiring additional context.

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

LANGUAGE HANDLING (CRITICAL):
• VISUAL DESCRIPTION (description field): MUST ALWAYS be in ENGLISH ONLY
  - Regardless of input language, ALL descriptions must be in English
  - Write clear, detailed visual descriptions in English
  - Focus on what the viewer SEES: textures, colors, lighting, movements, angles

• SOUND DESCRIPTION (soundDescription field): MUST ALWAYS be in ENGLISH ONLY
  - Always use English for sound descriptions
  - Use sound words/onomatopoeia, NOT descriptive sentences
  - Format: "crisp slicing sound, soft thud, rhythmic cutting"
  - NOT: "The sound of cutting..." (sounds like narration)

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
THINKING PROCESS (Chain of Thought)
═══════════════════════════════════════════════════════════════════════════════

When breaking down an idea into scenes, follow this logical sequence:

1. ANALYZE the general idea
   - What is the core ASMR concept?
   - What sensory experiences does it provide?
   - What variations can be created from this idea?

2. PLAN scene variations
   - Create ${sceneCount} independent variations of the idea
   - Each scene should be a different aspect or variation
   - Ensure scenes are independent (no narrative connection)
   - Plan visual diversity (different angles, objects, actions)

3. CALCULATE durations
   - Plan scene durations FIRST so they sum to EXACTLY ${duration} seconds
   - Each scene: ${modelConstraints ? `one of [${modelConstraints.supportedDurations.join(', ')}]` : `${SCENE_LIMITS.SCENE_DURATION_MIN}-${SCENE_LIMITS.SCENE_DURATION_MAX} seconds`}
   - Average target: ~${avgDuration} seconds per scene
   - Verify: sum(durations) = ${duration} exactly

4. WRITE visual descriptions
   - For each scene: detailed visual description (1-2 sentences)
   - Describe what viewer SEES: textures, colors, lighting, movements, angles
   - ALWAYS write in ENGLISH ONLY (regardless of input language)
   - Focus on sensory details and satisfying visuals

5. WRITE sound descriptions (if needed)
   - ${hasAudio ? 'Skip (model has native audio)' : 'For each scene: English sound words only'}
   - ${hasAudio ? '' : 'Use onomatopoeia, NOT descriptive sentences'}
   - ${hasAudio ? '' : 'Format: "crisp slicing, soft thud, rhythmic cutting"'}
   - ${hasAudio ? '' : 'ALWAYS in English (regardless of input language)'}

6. VALIDATE before outputting
   - Total scenes = ${sceneCount}? ✓
   - Sum of durations = ${duration}? ✓
   - All narration = ""? ✓
   - ${hasAudio ? 'All soundDescription = ""?' : 'All soundDescription in English?'} ✓
   - All description in English? ✓
   - All scenes independent? ✓

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
✓ description ALWAYS in English (regardless of input language)
✓ soundDescription ALWAYS in English (for sound effects API compatibility)

NEVER:
${modelConstraints ? `✗ NEVER use a duration NOT in [${modelConstraints.supportedDurations.join(', ')}]` : `✗ Never have a scene less than ${SCENE_LIMITS.SCENE_DURATION_MIN} seconds`}
✗ Never write narration or voiceover text (always empty string)
✗ Never connect scenes narratively (they are independent)
✗ ${hasAudio ? 'Never write sound descriptions (model generates audio)' : 'Never leave soundDescription empty (detailed description required)'}
✗ Never use descriptive sentences in soundDescription (use sound words only)

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTENT: DESCRIPTION vs SOUND DESCRIPTION (CRITICAL DISTINCTION)
═══════════════════════════════════════════════════════════════════════════════

Each scene requires these fields:

1) DESCRIPTION (Visual - What Viewer SEES):
   • 1-2 sentences, detailed visual description
   • MUST ALWAYS be in ENGLISH ONLY (regardless of input language)
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
     BAD: "The sound of cutting..." (descriptive sentence - sounds like narration)
     BAD: "cutting sounds" (too vague - needs specific sound words)`}

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
/**
 * Build the user prompt with parameters and examples
 * Implements advanced prompt engineering techniques:
 * - Chain of Thought guidance
 * - Context-aware duration handling
 * - Few-shot learning with diverse examples
 * - Dynamic prompt construction
 * - Input validation and sanitization
 */
export function buildSceneUserPrompt(
  storyText: string,
  duration: number,
  modelConstraints?: VideoModelConstraints | null
): string {
  // Validate and sanitize inputs
  const { storyText: validatedStoryText, duration: validatedDuration, modelConstraints: validatedConstraints } = 
    validateSceneInput({ storyText, duration, modelConstraints });

  const sceneCount = getOptimalSceneCount(validatedDuration, validatedConstraints);
  const avgDuration = getAverageSceneDuration(validatedDuration, sceneCount);
  const range = getSceneDurationRange();
  const hasAudio = validatedConstraints?.hasAudio ?? false;

  // Build context-aware guidance
  const durationContext = getDurationContextForScenes(validatedDuration, sceneCount);
  const languageGuidance = "All 'description' fields MUST ALWAYS be in ENGLISH ONLY, regardless of input language. All 'soundDescription' fields MUST ALWAYS be in ENGLISH ONLY.";

  return `
═══════════════════════════════════════════════════════════════════════════════
AUTO-ASMR SCENE BREAKDOWN REQUEST
═══════════════════════════════════════════════════════════════════════════════

GENERAL IDEA:
"""
${validatedStoryText}
"""

═══════════════════════════════════════════════════════════════════════════════
PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Total Duration: ${validatedDuration} seconds
• Target Scene Count: ${sceneCount} scenes
• Scene Duration Range: ${range.min}-${range.max} seconds each
• Average Duration: ~${avgDuration} seconds per scene
• Video Model Has Native Audio: ${hasAudio ? 'YES' : 'NO'}
• Output Language: ENGLISH ONLY (all descriptions must be in English)
• Duration Context: ${durationContext}

═══════════════════════════════════════════════════════════════════════════════
LANGUAGE REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════
${languageGuidance}

═══════════════════════════════════════════════════════════════════════════════
FEW-SHOT EXAMPLES (Learn from these patterns)
═══════════════════════════════════════════════════════════════════════════════

Study these examples to understand the pattern. Notice:
- Scenes are independent (no narrative connection)
- Visual descriptions are ALWAYS in English (regardless of input language)
- Sound descriptions are always in English (sound words only)
- Narration is always empty
- Durations sum to total exactly

Example 1: Cutting Fruits
Idea: "Relaxing ASMR clips showing different fruits being cut smoothly"

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

Example 2: Slime Mixing
Idea: "Relaxing ASMR clips showing different colored slimes being mixed smoothly"

Scenes (${hasAudio ? 'with native audio' : 'without native audio'}):
[
  {
    "sceneNumber": 1,
    "duration": 12,
    "description": "Close-up of hands mixing bright pink slime with slow, deliberate movements, smooth stretching and folding motions, vibrant color transitions",
    "soundDescription": ${hasAudio ? '""' : '"soft squish, smooth stretch, gentle pop, rhythmic mixing"'},
    "narration": ""
  },
  {
    "sceneNumber": 2,
    "duration": 12,
    "description": "Medium shot of blue and white slime being combined, creating marbled patterns, smooth blending motion under soft lighting",
    "soundDescription": ${hasAudio ? '""' : '"gentle squelch, smooth blend, soft pop, rhythmic folding"'},
    "narration": ""
  }
]

Example 3: Rain on Window
Idea: "Relaxing ASMR scenes of raindrops on a window"

Scenes (${hasAudio ? 'with native audio' : 'without native audio'}):
[
  {
    "sceneNumber": 1,
    "duration": 20,
    "description": "Close-up of raindrops on window glass, slow and calm movement of droplets, soft natural lighting, blurred background",
    "soundDescription": ${hasAudio ? '""' : '"gentle tap, soft drip, rhythmic patter, light splatter"'},
    "narration": ""
  },
  {
    "sceneNumber": 2,
    "duration": 20,
    "description": "Wide shot of small streams of water on the window, forming flowing patterns, soft lighting from outside",
    "soundDescription": ${hasAudio ? '""' : '"soft trickle, gentle flow, rhythmic drip, light tap"'},
    "narration": ""
  }
]

═══════════════════════════════════════════════════════════════════════════════
THINKING PROCESS (Follow these steps)
═══════════════════════════════════════════════════════════════════════════════

STEP 1: ANALYZE the general idea
  - Read the general idea carefully
  - Identify the core ASMR concept
  - What sensory experiences does it provide?
  - What variations can be created from this idea?
  - This is a general concept, not a detailed story

STEP 2: PLAN independent scene variations
  - Create ${sceneCount} independent variations of the idea
  - Scene 1: One specific visual variation
  - Scene 2: Another independent variation
  - Scene 3: Another independent variation
  - Continue for all ${sceneCount} scenes
  - Each scene is completely independent (no story connection)
  - Ensure visual diversity (different angles, objects, actions)

STEP 3: CALCULATE durations FIRST
  - Plan scene durations FIRST so they sum to EXACTLY ${validatedDuration} seconds
  - Scene durations: ${validatedConstraints ? `one of [${validatedConstraints.supportedDurations.join(', ')}]` : `${range.min}-${range.max} seconds`}
  - Average duration target: ~${avgDuration} seconds per scene
  - Verify: sum(durations) = ${validatedDuration} exactly
  - ${durationContext}

STEP 4: WRITE visual descriptions
  For EACH scene:
  - description = Detailed visual description (1-2 sentences)
  - Describe what the viewer SEES: textures, colors, lighting, movements, angles, compositions
  - Focus on sensory details and satisfying visuals
  - ALWAYS write in ENGLISH ONLY (regardless of input language)
  - Use natural, flowing English language

STEP 5: WRITE sound descriptions (if needed)
  For EACH scene:
  ${hasAudio ? 
    `- soundDescription = "" (empty string - video model generates audio natively)
  - NO sound description needed
  - Model handles audio automatically` :
    `- soundDescription = Sound effect description in ENGLISH ONLY (regardless of input language)
  - Use sound words/onomatopoeia, NOT descriptive sentences
  - Format: comma-separated sound words (e.g., "crisp slicing, soft thud, rhythmic cutting")
  - Describe what the viewer HEARS: specific ASMR triggers, volume, texture, rhythm
  - Focus on satisfying, calming sound effects
  - NEVER write in any language other than English (must be English for sound effects API)
  - NEVER use full sentences that sound like narration (e.g., "The sound of cutting...")
  - Examples of GOOD sound descriptions:
    * "crisp slicing, soft thud, rhythmic cutting"
    * "juicy snap, gentle squish, smooth peeling"
    * "gentle tap, soft drip, rhythmic patter"
  - Examples of BAD sound descriptions:
    * "The sound of cutting..." (descriptive sentence - sounds like narration)
    * "cutting sounds" (too vague - needs specific sound words)`}

STEP 6: SET narration (ALWAYS EMPTY)
  For EACH scene:
  - narration = "" (empty string - NO voiceover in ASMR content)
  - This is pure ASMR - no spoken words

STEP 7: VALIDATE before outputting
  ✓ Total scenes = ${sceneCount} (no more, no less)
  ✓ Sum of durations = ${validatedDuration} exactly (no rounding errors)
  ✓ All narration fields = "" (empty strings)
  ✓ ${hasAudio ? 'All soundDescription fields = "" (empty - model has native audio)' : 'All soundDescription fields have English sound words (not descriptive sentences)'}
  ✓ All description fields in English (regardless of input language)
  ✓ All soundDescription fields ALWAYS in English (for API compatibility)
  ✓ All scenes are independent (no narrative connection)
  ✓ ${validatedConstraints ? `All scene durations are in [${validatedConstraints.supportedDurations.join(', ')}]` : `All scene durations are ${range.min}-${range.max} seconds`}

═══════════════════════════════════════════════════════════════════════════════
GENERATE SCENES NOW
═══════════════════════════════════════════════════════════════════════════════

Generate ${sceneCount} independent ASMR scenes based on the idea above.
Follow the thinking process above, and return JSON matching the schema exactly.

Remember:
- Follow the 7-step thinking process
- All scenes must be independent
- Visual descriptions ALWAYS in English (regardless of input language)
- Sound descriptions always in English (sound words only)
- Narration always empty
- Durations must sum to ${validatedDuration} exactly
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
      description: "Detailed visual description of what the viewer sees in this scene. MUST ALWAYS be in ENGLISH ONLY, regardless of input language.",
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