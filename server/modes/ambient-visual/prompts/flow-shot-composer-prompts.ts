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
  shotCount: number | 'auto',
  sceneDuration: number,
  pacing: number,
  animationMode: AnimationMode,
  supportedDurations?: number[],
  shotsPerSegment?: 'auto' | number
): string {
  const category = getPacingCategory(pacing);
  const isAuto = shotsPerSegment === 'auto' || shotCount === 'auto';
  const avgDuration = typeof shotCount === 'number' ? Math.round(sceneDuration / shotCount) : Math.round(sceneDuration / 4); // Default estimate for auto
  const movements = CAMERA_MOVEMENTS[animationMode];
  
  const durationConstraint = supportedDurations && supportedDurations.length > 0
    ? `\n\n═══════════════════════════════════════════════════════════════════════════════
SUPPORTED DURATIONS
═══════════════════════════════════════════════════════════════════════════════

IMPORTANT: Shot durations MUST be one of these values: ${supportedDurations.join(', ')} seconds
The video model only supports these specific durations. Choose from this list when setting each shot's duration.`
    : '';
  
  // When auto, let AI determine optimal shot count based on duration
  const shotCountInstruction = isAuto
    ? `determine the optimal number of shots (typically 2-6 shots) based on the ${sceneDuration}-second duration and pacing`
    : `${shotCount} individual SHOTS`;
  
  return `You are an expert cinematographer specializing in ambient visual content.
Your task is to compose ${shotCountInstruction} for a ${sceneDuration}-second scene segment.${durationConstraint}

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
• Typically fewer shots (2-3) for longer durations
` : category === 'fast' ? `
FAST SHOT CHARACTERISTICS:
• Quicker cuts between shots (~${avgDuration} seconds)
• More dynamic camera movements
• Varied shot types for visual interest
• Maintains energy while staying ambient
• Typically more shots (4-6) for visual variety
` : `
MEDIUM SHOT CHARACTERISTICS:
• Balanced shot durations (~${avgDuration} seconds)
• Mix of static and moving shots
• Natural visual rhythm
• Good variety without feeling rushed
• Typically 3-4 shots for balanced pacing
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
${isAuto 
  ? `✓ Determine the optimal number of shots based on scene duration and pacing
✓ Total duration = EXACTLY ${sceneDuration} seconds
✓ Choose shot count that allows each shot to be 5-30 seconds (based on pacing)
✓ Consider pacing: ${category === 'slow' ? 'slower pacing = fewer, longer shots' : category === 'fast' ? 'faster pacing = more, shorter shots' : 'medium pacing = balanced shot count and durations'}`
  : `✓ Generate EXACTLY ${shotCount} shots
✓ Total duration = EXACTLY ${sceneDuration} seconds`}
${supportedDurations && supportedDurations.length > 0 
  ? `✓ Each shot duration MUST be one of: ${supportedDurations.join(', ')} seconds`
  : `✓ Each shot: 5-30 seconds (based on pacing)`}
${!isAuto ? `✓ Average duration: ~${avgDuration} seconds` : ''}
✓ Vary shot types for visual interest
✓ Each description is visually specific

NEVER:
✗ Include people, characters, or actions
✗ Reference narrative or story elements
${supportedDurations && supportedDurations.length > 0 
  ? `✗ Use durations not in the supported list: ${supportedDurations.join(', ')} seconds`
  : `✗ Create shots shorter than 5 seconds
✗ Create shots longer than 30 seconds`}
✗ Use the same camera movement for all shots
${!isAuto ? `✗ Generate more or fewer than ${shotCount} shots` : ''}

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
  "totalShots": <number of shots you created>,
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
  
  // Build full story context section with interleaved scenes and shots
  let fullStoryContext = '';
  if (input.allScenes && input.allScenes.length > 0) {
    const currentSceneIndex = input.allScenes.findIndex(s => s.id === scene.id);
    const scenePosition = currentSceneIndex + 1;
    const totalScenes = input.allScenes.length;
    
    fullStoryContext = `
═══════════════════════════════════════════════════════════════════════════════
FULL STORY CONTEXT (${totalScenes} scenes total)
═══════════════════════════════════════════════════════════════════════════════

You are currently composing shots for Scene ${scenePosition} of ${totalScenes}.

COMPLETE SCENE SEQUENCE WITH SHOTS:
${input.allScenes.map((s, idx) => {
  const isCurrent = s.id === scene.id;
  const sceneNumber = idx + 1;
  const shots = input.existingShots?.[s.id] || [];
  const hasShots = shots.length > 0;
  
  let sceneBlock = `${sceneNumber}. ${isCurrent ? '→ CURRENT SCENE ←' : ''} Scene ${sceneNumber}: "${s.title}"
   Description: ${s.description || 'No description'}
   Duration: ${s.duration || 60}s
   Lighting: ${s.lighting || 'Natural'}
   Weather: ${s.weather || 'Clear'}`;
  
  // Interleave shots immediately after each scene
  if (hasShots) {
    sceneBlock += `\n   Shots (${shots.length} total):`;
    shots.forEach(shot => {
      sceneBlock += `\n     Shot ${shot.shotNumber}: ${shot.shotType} - ${shot.cameraMovement} (${shot.duration}s)
       "${shot.description}"`;
    });
  } else if (!isCurrent) {
    sceneBlock += `\n   (shots not yet composed)`;
  } else {
    sceneBlock += `\n   (you are composing shots for this scene now)`;
  }
  
  return sceneBlock;
}).join('\n\n')}
`;
  }
  
  return `
═══════════════════════════════════════════════════════════════════════════════
SHOT COMPOSITION REQUEST
═══════════════════════════════════════════════════════════════════════════════
${fullStoryContext}
═══════════════════════════════════════════════════════════════════════════════
CURRENT SCENE TO COMPOSE SHOTS FOR:
═══════════════════════════════════════════════════════════════════════════════

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
${input.shotsPerSegment === 'auto' 
  ? `• Shot Count: AUTO - Determine the optimal number of shots (typically 2-6) based on duration and pacing`
  : `• Target Shot Count: ${shotCount} shots (exact count required)`}
• Pacing: ${input.pacing}/100 (${getPacingCategory(input.pacing)})

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Review the full story context above to understand where this scene fits in the overall flow
${input.allScenes && input.allScenes.length > 1 ? '2. Consider how your shots will flow from previous scenes and transition to upcoming scenes' : ''}
${input.existingShots && Object.keys(input.existingShots).length > 0 ? '3. Maintain visual consistency and pacing with shots already composed for earlier scenes' : ''}
${input.allScenes && input.allScenes.length > 1 ? '4' : '2'}. Analyze the current scene's atmosphere and visual elements
${input.shotsPerSegment === 'auto'
  ? `${input.allScenes && input.allScenes.length > 1 ? '5' : '3'}. Determine the optimal number of shots (2-6 recommended) that:
   - Appropriately fill the ${sceneDuration}-second duration
   - Match the ${getPacingCategory(input.pacing)} pacing (${input.pacing}/100)
   - Allow each shot to be 5-30 seconds (based on pacing)
   - Explore different aspects of the scene
   - Sum to EXACTLY ${sceneDuration} seconds
   - Use appropriate camera movements
   - Flow naturally from one to the next`
  : `${input.allScenes && input.allScenes.length > 1 ? '5' : '3'}. Create EXACTLY ${shotCount} shots that:
   - Explore different aspects of the scene
   - Sum to EXACTLY ${sceneDuration} seconds
   - Use appropriate camera movements
   - Flow naturally from one to the next`}
${input.allScenes && input.allScenes.length > 1 ? '6' : '4'}. Each shot should be visually specific and filmable

Generate the shot breakdown as JSON now.`;
}

