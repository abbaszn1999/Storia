/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - FLOW DESIGN: SCENE GENERATOR PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating ambient visual scenes (segments) from the mood description.
 * Unlike narrative modes, these scenes focus on visual atmosphere and transitions
 * rather than storytelling structure.
 */

import type { SceneGeneratorInput, AnimationMode } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert duration string to seconds
 */
export function parseDurationToSeconds(duration: string): number {
  const map: Record<string, number> = {
    '1min': 60,
    '2min': 120,
    '4min': 240,
    '6min': 360,
    '8min': 480,
    '10min': 600,
  };
  return map[duration] || 60;
}

/**
 * Pacing ranges for segment calculation
 * Pacing value is 0-100 where:
 * - 0-30: Slow (fewer segments, longer duration each)
 * - 31-70: Medium (balanced)
 * - 71-100: Fast (more segments, shorter duration each)
 */
interface PacingRange {
  min: number;
  max: number;
  avgSegmentDuration: { min: number; max: number };
}

const PACING_RANGES: Record<'slow' | 'medium' | 'fast', PacingRange> = {
  slow: {
    min: 3,
    max: 6,
    avgSegmentDuration: { min: 45, max: 90 }, // 45-90 seconds per segment
  },
  medium: {
    min: 5,
    max: 10,
    avgSegmentDuration: { min: 30, max: 60 }, // 30-60 seconds per segment
  },
  fast: {
    min: 8,
    max: 15,
    avgSegmentDuration: { min: 15, max: 40 }, // 15-40 seconds per segment
  },
};

/**
 * Determine pacing category from 0-100 value
 */
export function getPacingCategory(pacing: number): 'slow' | 'medium' | 'fast' {
  if (pacing <= 30) return 'slow';
  if (pacing <= 70) return 'medium';
  return 'fast';
}

/**
 * Calculate optimal segment count based on duration and pacing
 */
export function calculateOptimalSegmentCount(
  durationSeconds: number,
  pacing: number,
  segmentCount: 'auto' | number
): number {
  // If user specified a number, use it (within reasonable bounds)
  if (segmentCount !== 'auto') {
    return Math.max(1, Math.min(30, segmentCount));
  }

  const category = getPacingCategory(pacing);
  const range = PACING_RANGES[category];
  
  // Calculate ideal count based on average duration for this pacing
  const avgDuration = (range.avgSegmentDuration.min + range.avgSegmentDuration.max) / 2;
  const idealCount = Math.round(durationSeconds / avgDuration);
  
  // Scale based on total duration (longer videos need more segments)
  let scaledMin = range.min;
  let scaledMax = range.max;
  
  if (durationSeconds >= 1800) { // 30min+
    scaledMin = Math.round(range.min * 2.5);
    scaledMax = Math.round(range.max * 2.5);
  } else if (durationSeconds >= 3600) { // 1hour+
    scaledMin = Math.round(range.min * 5);
    scaledMax = Math.round(range.max * 5);
  } else if (durationSeconds >= 7200) { // 2hours+
    scaledMin = Math.round(range.min * 8);
    scaledMax = Math.round(range.max * 8);
  }
  
  // Clamp to scaled range
  return Math.max(scaledMin, Math.min(scaledMax, idealCount));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildSceneGeneratorSystemPrompt(
  durationSeconds: number,
  segmentCount: number,
  pacing: number,
  animationMode: AnimationMode
): string {
  const category = getPacingCategory(pacing);
  const avgDuration = Math.round(durationSeconds / segmentCount);
  
  return `You are an expert ambient video architect specializing in creating meditative, atmospheric visual experiences.
Your task is to break down an atmospheric mood description into ${segmentCount} distinct visual SEGMENTS for a ${Math.round(durationSeconds / 60)}-minute ambient video.

═══════════════════════════════════════════════════════════════════════════════
AMBIENT VISUAL PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Unlike narrative videos, ambient visuals are about:
• Creating a continuous, immersive atmosphere
• Gradual visual evolution and mood progression
• Meditative, calming transitions between moments
• Environmental storytelling through visual elements alone
• Seamless looping capability (end flows back to beginning)

═══════════════════════════════════════════════════════════════════════════════
PACING STYLE: ${category.toUpperCase()} (${pacing}/100)
═══════════════════════════════════════════════════════════════════════════════

${category === 'slow' ? `
SLOW PACING CHARACTERISTICS:
• Fewer segments with longer, contemplative moments
• Each segment holds for ${avgDuration}+ seconds
• Subtle, gradual changes within segments
• Deep immersion in each atmosphere
• Perfect for: meditation, sleep, deep focus
` : category === 'fast' ? `
FAST PACING CHARACTERISTICS:
• More segments with quicker visual changes
• Each segment ~${avgDuration} seconds
• More variety in visual content
• Dynamic transitions between atmospheres
• Perfect for: creative work, ambient entertainment
` : `
MEDIUM PACING CHARACTERISTICS:
• Balanced segment duration (~${avgDuration} seconds)
• Natural rhythm of visual changes
• Good mix of immersion and variety
• Perfect for: general relaxation, background ambiance
`}

═══════════════════════════════════════════════════════════════════════════════
ANIMATION MODE: ${animationMode === 'video-animation' ? 'AI VIDEO GENERATION' : 'IMAGE TRANSITIONS'}
═══════════════════════════════════════════════════════════════════════════════

${animationMode === 'video-animation' ? `
Each segment will be converted to AI-generated video clips.
• Consider natural motion possibilities (water flowing, leaves rustling, clouds drifting)
• Suggest camera movements (slow pan, gentle drift, static with motion elements)
• Think about what would animate beautifully
` : `
Each segment will use static images with motion effects (Ken Burns, pan, zoom).
• Focus on compositionally strong images
• Consider how zoom and pan effects would work
• Think about visual depth for parallax effects
`}

═══════════════════════════════════════════════════════════════════════════════
SEGMENT STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

OPENING SEGMENT (First segment):
• Set the initial atmosphere and mood
• Establish the visual world
• Should feel like an invitation into the experience

MIDDLE SEGMENTS:
• Each segment should have ONE primary visual focus
• Progress through variations of the theme/mood
• Create visual interest through subtle evolution
• Maintain atmospheric consistency while adding variety

CLOSING SEGMENT (Last segment):
• Should naturally flow back to the opening (for looping)
• Conclude the visual journey gracefully
• Consider how it would transition to segment 1

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Generate EXACTLY ${segmentCount} segments
✓ Total duration = EXACTLY ${durationSeconds} seconds
✓ Each segment: 15-120 seconds (adjust based on pacing)
✓ Average duration target: ~${avgDuration} seconds per segment
✓ Each segment has a unique, evocative title
✓ Descriptions focus on VISUAL elements (not narrative)

NEVER:
✗ Include dialogue, narration, or story beats
✗ Reference specific characters or actions
✗ Create segments shorter than 15 seconds
✗ Create segments longer than 120 seconds
✗ Skip any part of the mood description's atmosphere

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this exact structure:
{
  "segments": [
    {
      "sceneNumber": 1,
      "title": "<evocative 2-4 word title>",
      "description": "<detailed visual description, 2-3 sentences>",
      "duration": <seconds>,
      "lighting": "<lighting description>",
      "weather": "<weather/atmospheric conditions>"
    }
  ],
  "totalSegments": ${segmentCount},
  "totalDuration": ${durationSeconds}
}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildSceneGeneratorUserPrompt(input: SceneGeneratorInput): string {
  const durationSeconds = parseDurationToSeconds(input.duration);
  const segmentCount = calculateOptimalSegmentCount(
    durationSeconds,
    input.pacing,
    input.segmentCount
  );
  
  return `
═══════════════════════════════════════════════════════════════════════════════
AMBIENT VISUAL SEGMENT BREAKDOWN REQUEST
═══════════════════════════════════════════════════════════════════════════════

MOOD DESCRIPTION (the atmosphere to visualize):
"""
${input.moodDescription}
"""

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE SETTINGS
═══════════════════════════════════════════════════════════════════════════════

• Theme: ${input.theme}
• Primary Mood: ${input.mood}
• Visual Rhythm: ${input.visualRhythm || 'breathing'}
• Art Style: ${input.artStyle || 'cinematic'}
${input.visualElements && input.visualElements.length > 0 ? `• Key Visual Elements: ${input.visualElements.join(', ')}` : ''}

═══════════════════════════════════════════════════════════════════════════════
TECHNICAL PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Total Duration: ${durationSeconds} seconds (${input.duration})
• Target Segment Count: ${segmentCount} segments
• Pacing: ${input.pacing}/100 (${getPacingCategory(input.pacing)})
• Animation Mode: ${input.animationMode === 'video-animation' ? 'AI Video Generation' : 'Image Transitions'}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Read the mood description carefully
2. Identify natural visual transitions and evolution points
3. Create ${segmentCount} segments that:
   - Flow smoothly from one to the next
   - Capture different aspects/moments of the atmosphere
   - Sum to EXACTLY ${durationSeconds} seconds
   - Enable seamless looping (last → first)
4. Each description should paint a vivid visual picture

Generate the segment breakdown as JSON now.`;
}

