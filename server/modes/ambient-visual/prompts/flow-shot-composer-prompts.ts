/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - FLOW DESIGN: SHOT COMPOSER PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating shots within each scene/segment.
 * Shots define individual visual moments with camera movements and durations.
 */

import type { Scene, ShotComposerInput, AnimationMode } from '../types';
import { getPacingCategory } from './flow-scene-generator-prompts';

// ═══════════════════════════════════════════════════════════════════════════════
// SHOT COUNT CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shot count ranges based on pacing
 */
interface ShotRange {
  min: number;
  max: number;
  avgDuration: { min: number; max: number };
}

const SHOT_RANGES: Record<'slow' | 'medium' | 'fast', ShotRange> = {
  slow: {
    min: 2,
    max: 3,
    avgDuration: { min: 15, max: 30 }, // 15-30 seconds per shot
  },
  medium: {
    min: 3,
    max: 4,
    avgDuration: { min: 8, max: 15 }, // 8-15 seconds per shot
  },
  fast: {
    min: 4,
    max: 6,
    avgDuration: { min: 5, max: 10 }, // 5-10 seconds per shot
  },
};

/**
 * Calculate optimal shot count for a scene based on duration and pacing
 */
export function calculateOptimalShotCount(
  sceneDuration: number,
  pacing: number,
  shotsPerSegment: 'auto' | number
): number {
  // If user specified a number, use it (within bounds)
  if (shotsPerSegment !== 'auto') {
    return Math.max(1, Math.min(10, shotsPerSegment));
  }

  const category = getPacingCategory(pacing);
  const range = SHOT_RANGES[category];
  
  // Calculate ideal count based on average duration
  const avgDuration = (range.avgDuration.min + range.avgDuration.max) / 2;
  const idealCount = Math.round(sceneDuration / avgDuration);
  
  // Clamp to pacing range
  return Math.max(range.min, Math.min(range.max, idealCount));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOT TYPES AND CAMERA MOVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SHOT_TYPES = [
  'Wide Shot',
  'Extreme Wide Shot',
  'Medium Shot',
  'Medium Wide Shot',
  'Close-Up',
  'Extreme Close-Up',
  'Establishing Shot',
  'Detail Shot',
];

const CAMERA_MOVEMENTS = {
  'video-animation': [
    'static',
    'slow-pan-left',
    'slow-pan-right',
    'tilt-up',
    'tilt-down',
    'gentle-drift',
    'orbit',
    'push-in',
    'pull-out',
    'floating',
  ],
  'image-transitions': [
    'static',
    'slow-zoom-in',
    'slow-zoom-out',
    'pan-left',
    'pan-right',
    'ken-burns-up',
    'ken-burns-down',
    'diagonal-drift',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildShotComposerSystemPrompt(
  shotCount: number,
  sceneDuration: number,
  pacing: number,
  animationMode: AnimationMode
): string {
  const category = getPacingCategory(pacing);
  const avgDuration = Math.round(sceneDuration / shotCount);
  const movements = CAMERA_MOVEMENTS[animationMode];
  
  return `You are an expert cinematographer specializing in ambient visual content.
Your task is to compose ${shotCount} individual SHOTS for a ${sceneDuration}-second scene segment.

═══════════════════════════════════════════════════════════════════════════════
AMBIENT SHOT COMPOSITION PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Ambient shots are about:
• Creating visual breathing room
• Highlighting specific details of the environment
• Building atmosphere through composition
• Smooth, meditative camera movements
• Visual variety within atmospheric consistency

═══════════════════════════════════════════════════════════════════════════════
PACING: ${category.toUpperCase()} (${pacing}/100)
═══════════════════════════════════════════════════════════════════════════════

${category === 'slow' ? `
SLOW SHOT CHARACTERISTICS:
• Longer holds on each shot (~${avgDuration}+ seconds)
• Subtle, almost imperceptible camera movement
• Deep focus on atmospheric details
• Let viewers absorb each visual moment
` : category === 'fast' ? `
FAST SHOT CHARACTERISTICS:
• Quicker cuts between shots (~${avgDuration} seconds)
• More dynamic camera movements
• Varied shot types for visual interest
• Maintains energy while staying ambient
` : `
MEDIUM SHOT CHARACTERISTICS:
• Balanced shot durations (~${avgDuration} seconds)
• Mix of static and moving shots
• Natural visual rhythm
• Good variety without feeling rushed
`}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE SHOT TYPES
═══════════════════════════════════════════════════════════════════════════════

${SHOT_TYPES.map(type => `• ${type}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE CAMERA MOVEMENTS (${animationMode === 'video-animation' ? 'AI Video' : 'Image Transitions'})
═══════════════════════════════════════════════════════════════════════════════

${movements.map(m => `• ${m}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
SHOT SEQUENCE GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

FIRST SHOT:
• Establish the scene's environment
• Usually a wider shot to orient the viewer
• Set the visual tone for the segment

MIDDLE SHOTS:
• Vary shot types (wide → close → detail → wide)
• Each shot reveals a different aspect of the scene
• Create visual rhythm through duration variety
• Alternate between static and moving camera

FINAL SHOT:
• Should flow naturally to the next scene
• Consider how it transitions out
• Can be a wider shot for scene continuity

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Generate EXACTLY ${shotCount} shots
✓ Total duration = EXACTLY ${sceneDuration} seconds
✓ Each shot: 5-30 seconds (based on pacing)
✓ Average duration: ~${avgDuration} seconds
✓ Vary shot types for visual interest
✓ Each description is visually specific

NEVER:
✗ Include people, characters, or actions
✗ Reference narrative or story elements
✗ Create shots shorter than 5 seconds
✗ Create shots longer than 30 seconds
✗ Use the same camera movement for all shots

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this exact structure:
{
  "shots": [
    {
      "shotNumber": 1,
      "shotType": "<from available shot types>",
      "cameraMovement": "<from available camera movements>",
      "duration": <seconds>,
      "description": "<specific visual description, what the viewer sees>"
    }
  ],
  "totalShots": ${shotCount},
  "totalDuration": ${sceneDuration}
}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildShotComposerUserPrompt(input: ShotComposerInput): string {
  const scene = input.scene;
  const sceneDuration = scene.duration || 60;
  const shotCount = calculateOptimalShotCount(
    sceneDuration,
    input.pacing,
    input.shotsPerSegment
  );
  
  return `
═══════════════════════════════════════════════════════════════════════════════
SHOT COMPOSITION REQUEST
═══════════════════════════════════════════════════════════════════════════════

SCENE TO COMPOSE SHOTS FOR:

Title: ${scene.title}
Description: ${scene.description || 'No description provided'}
Lighting: ${scene.lighting || 'Natural'}
Weather/Atmosphere: ${scene.weather || 'Clear'}

═══════════════════════════════════════════════════════════════════════════════
VISUAL CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• Art Style: ${input.artStyle || 'cinematic'}
${input.visualElements && input.visualElements.length > 0 ? `• Key Visual Elements: ${input.visualElements.join(', ')}` : ''}
• Animation Mode: ${input.animationMode === 'video-animation' ? 'AI Video Generation' : 'Image Transitions'}

═══════════════════════════════════════════════════════════════════════════════
TECHNICAL PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Scene Duration: ${sceneDuration} seconds
• Target Shot Count: ${shotCount} shots
• Pacing: ${input.pacing}/100 (${getPacingCategory(input.pacing)})

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Analyze the scene's atmosphere and visual elements
2. Create ${shotCount} shots that:
   - Explore different aspects of the scene
   - Sum to EXACTLY ${sceneDuration} seconds
   - Use appropriate camera movements
   - Flow naturally from one to the next
3. Each shot should be visually specific and filmable

Generate the shot breakdown as JSON now.`;
}

