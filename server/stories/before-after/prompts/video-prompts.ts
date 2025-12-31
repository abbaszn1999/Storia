/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO GENERATION PROMPTS - BEFORE-AFTER TRANSFORMATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module provides professional-grade video prompts for Image-to-Video AI.
 * It includes style-aware motion descriptions, camera movements, and effects.
 * 
 * SPECIAL FOCUS: Transformation stories benefit from motion that shows change
 * and progression. Camera movements and subject motion should support the
 * before/after narrative, emphasizing the transformation journey.
 * 
 * PROMPT ENGINEERING BEST PRACTICES:
 * - Structured prompts: Clear sections for camera, subject, environment, style
 * - Weighted keywords: Use emphasis for critical motion elements
 * - Duration-aware: Adjust motion intensity based on clip length
 * - Story-aware: Match motion to narrative arc and mood
 * - Style consistency: Maintain visual coherence with image style
 * 
 * VIDEO PROMPT FORMULA (Optimized Order):
 * [Position Context] + [Camera Movement] + [Subject Motion] + [Environmental Effects] + [Style Modifiers] + [Pacing] + [Duration Guidance]
 */

import type { ImageStyle } from '../../shared/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA MOVEMENT LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

export const CAMERA_MOVEMENTS = {
  // Zoom movements
  'slow-zoom-in': 'Slow cinematic zoom in, gradually focusing on the subject',
  'fast-zoom-in': 'Dynamic fast zoom in, creating impact and emphasis',
  'slow-zoom-out': 'Slow pull back revealing the full scene',
  'dramatic-zoom-out': 'Dramatic zoom out revealing the environment',
  
  // Pan movements
  'pan-left': 'Smooth horizontal pan from right to left, following the action',
  'pan-right': 'Smooth horizontal pan from left to right, exploring the scene',
  'pan-up': 'Vertical tilt up, revealing height and aspiration',
  'pan-down': 'Vertical tilt down, grounding the scene',
  
  // Dolly movements
  'dolly-in': 'Camera moves forward through space, approaching the subject',
  'dolly-out': 'Camera moves backward through space, retreating from scene',
  'dolly-left': 'Camera slides left while maintaining focus',
  'dolly-right': 'Camera slides right while maintaining focus',
  
  // Complex movements
  'orbit-left': 'Camera orbits around subject moving left',
  'orbit-right': 'Camera orbits around subject moving right',
  'crane-up': 'Camera rises vertically like a crane shot',
  'crane-down': 'Camera descends vertically like a crane shot',
  
  // Subtle movements
  'gentle-drift': 'Very subtle floating camera movement, almost static',
  'breathing': 'Minimal organic movement simulating handheld breathing',
  'steady': 'Locked off static shot with minimal movement',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECT MOTION LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBJECT_MOTIONS = {
  // Face/Head movements
  'head-turn': 'Subject gently turns head to the side',
  'head-nod': 'Subtle nodding motion',
  'blink': 'Natural blinking and eye movement',
  'smile-form': 'Expression changes to a subtle smile',
  'look-up': 'Eyes and head slowly look upward',
  'look-down': 'Eyes and head slowly look downward',
  
  // Body movements
  'breathing': 'Subtle chest rise and fall from breathing',
  'sway': 'Gentle body sway, natural standing motion',
  'lean-forward': 'Subject leans slightly forward with interest',
  'lean-back': 'Subject leans back in contemplation',
  'gesture': 'Hand gesture while speaking or emphasizing',
  'walk-forward': 'Subject walks toward camera',
  'walk-away': 'Subject walks away from camera',
  
  // Minimal movements
  'subtle': 'Very subtle micro-movements, almost imperceptible',
  'still': 'Subject remains still with only natural micro-movements',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENTAL EFFECTS LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

export const ENVIRONMENTAL_EFFECTS = {
  // Lighting effects
  'light-flicker': 'Subtle light flickering or pulsing',
  'light-shift': 'Gradual lighting change, passing time',
  'sun-rays': 'Light rays shift and move through scene',
  'shadows-move': 'Shadows slowly shift across the scene',
  
  // Atmospheric effects
  'particles': 'Dust particles or motes floating in light',
  'smoke': 'Wisps of smoke or fog drifting through scene',
  'mist': 'Gentle mist or haze movement',
  'rain': 'Rain droplets falling in the background',
  'snow': 'Snowflakes gently falling',
  
  // Nature effects
  'wind-hair': 'Gentle wind moving hair',
  'wind-clothes': 'Wind causing subtle fabric movement',
  'wind-leaves': 'Leaves rustling in the breeze',
  'water-ripple': 'Water surface gently rippling',
  'clouds-drift': 'Clouds slowly moving across sky',
  
  // Urban effects
  'traffic': 'Background traffic movement',
  'crowd': 'People moving in the background',
  'reflections': 'Reflections shifting on surfaces',
  
  // None
  'none': 'No environmental effects, clean scene',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE-SPECIFIC VIDEO PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const VIDEO_STYLE_PRESETS: Record<ImageStyle, {
  preferredCameraMovements: (keyof typeof CAMERA_MOVEMENTS)[];
  preferredSubjectMotions: (keyof typeof SUBJECT_MOTIONS)[];
  preferredEnvironmentalEffects: (keyof typeof ENVIRONMENTAL_EFFECTS)[];
  motionIntensity: 'subtle' | 'moderate' | 'dynamic';
  styleModifiers: string[];
}> = {
  'photorealistic': {
    preferredCameraMovements: ['slow-zoom-in', 'dolly-in', 'gentle-drift', 'breathing'],
    preferredSubjectMotions: ['breathing', 'blink', 'subtle', 'head-turn'],
    preferredEnvironmentalEffects: ['particles', 'light-shift', 'wind-hair', 'none'],
    motionIntensity: 'subtle',
    styleModifiers: ['natural motion', 'realistic movement', 'lifelike animation'],
  },
  'cinematic': {
    preferredCameraMovements: ['slow-zoom-in', 'dolly-in', 'crane-up', 'orbit-right'],
    preferredSubjectMotions: ['head-turn', 'look-up', 'gesture', 'lean-forward'],
    preferredEnvironmentalEffects: ['sun-rays', 'particles', 'shadows-move', 'smoke'],
    motionIntensity: 'moderate',
    styleModifiers: ['cinematic motion', 'film-quality movement', 'dramatic pacing', 'theatrical'],
  },
  '3d-render': {
    preferredCameraMovements: ['orbit-right', 'crane-up', 'dolly-in', 'pan-right'],
    preferredSubjectMotions: ['gesture', 'walk-forward', 'head-turn', 'sway'],
    preferredEnvironmentalEffects: ['particles', 'reflections', 'light-shift', 'none'],
    motionIntensity: 'moderate',
    styleModifiers: ['CGI motion', 'smooth 3D animation', 'rendered movement'],
  },
  'digital-art': {
    preferredCameraMovements: ['slow-zoom-in', 'pan-right', 'gentle-drift', 'dolly-in'],
    preferredSubjectMotions: ['subtle', 'sway', 'head-turn', 'breathing'],
    preferredEnvironmentalEffects: ['particles', 'light-flicker', 'mist', 'none'],
    motionIntensity: 'subtle',
    styleModifiers: ['artistic motion', 'painterly movement', 'flowing animation'],
  },
  'anime': {
    preferredCameraMovements: ['fast-zoom-in', 'pan-right', 'crane-up', 'dolly-in'],
    preferredSubjectMotions: ['head-turn', 'blink', 'gesture', 'sway'],
    preferredEnvironmentalEffects: ['wind-hair', 'particles', 'wind-clothes', 'clouds-drift'],
    motionIntensity: 'dynamic',
    styleModifiers: ['anime motion', 'dynamic animation', 'expressive movement', 'cel animation style'],
  },
  'illustration': {
    preferredCameraMovements: ['gentle-drift', 'slow-zoom-in', 'breathing', 'steady'],
    preferredSubjectMotions: ['subtle', 'blink', 'breathing', 'still'],
    preferredEnvironmentalEffects: ['particles', 'mist', 'wind-leaves', 'none'],
    motionIntensity: 'subtle',
    styleModifiers: ['illustrated motion', 'storybook animation', 'gentle movement'],
  },
  'watercolor': {
    preferredCameraMovements: ['gentle-drift', 'slow-zoom-in', 'breathing', 'steady'],
    preferredSubjectMotions: ['subtle', 'breathing', 'still', 'blink'],
    preferredEnvironmentalEffects: ['mist', 'light-shift', 'water-ripple', 'none'],
    motionIntensity: 'subtle',
    styleModifiers: ['soft motion', 'flowing movement', 'ethereal animation', 'watercolor flow'],
  },
  'minimalist': {
    preferredCameraMovements: ['steady', 'gentle-drift', 'slow-zoom-in', 'breathing'],
    preferredSubjectMotions: ['still', 'subtle', 'breathing', 'blink'],
    preferredEnvironmentalEffects: ['none', 'light-shift', 'shadows-move'],
    motionIntensity: 'subtle',
    styleModifiers: ['minimal motion', 'clean movement', 'simple animation'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD-BASED MOTION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export const MOOD_MOTION_MAP: Record<string, {
  cameraMovement: keyof typeof CAMERA_MOVEMENTS;
  subjectMotion: keyof typeof SUBJECT_MOTIONS;
  environmentalEffect: keyof typeof ENVIRONMENTAL_EFFECTS;
  pacing: string;
}> = {
  'neutral': {
    cameraMovement: 'gentle-drift',
    subjectMotion: 'breathing',
    environmentalEffect: 'none',
    pacing: 'steady, even motion',
  },
  'happy': {
    cameraMovement: 'slow-zoom-in',
    subjectMotion: 'smile-form',
    environmentalEffect: 'sun-rays',
    pacing: 'uplifting, light movement',
  },
  'sad': {
    cameraMovement: 'slow-zoom-out',
    subjectMotion: 'look-down',
    environmentalEffect: 'rain',
    pacing: 'slow, melancholic motion',
  },
  'excited': {
    cameraMovement: 'fast-zoom-in',
    subjectMotion: 'gesture',
    environmentalEffect: 'particles',
    pacing: 'energetic, dynamic motion',
  },
  'dramatic': {
    cameraMovement: 'crane-up',
    subjectMotion: 'head-turn',
    environmentalEffect: 'shadows-move',
    pacing: 'theatrical, powerful movement',
  },
  'curious': {
    cameraMovement: 'dolly-in',
    subjectMotion: 'lean-forward',
    environmentalEffect: 'light-shift',
    pacing: 'exploratory, discovering motion',
  },
  'thoughtful': {
    cameraMovement: 'gentle-drift',
    subjectMotion: 'look-up',
    environmentalEffect: 'clouds-drift',
    pacing: 'contemplative, slow motion',
  },
  'whisper': {
    cameraMovement: 'slow-zoom-in',
    subjectMotion: 'subtle',
    environmentalEffect: 'mist',
    pacing: 'intimate, close motion',
  },
  'surprised': {
    cameraMovement: 'fast-zoom-in',
    subjectMotion: 'lean-back',
    environmentalEffect: 'light-flicker',
    pacing: 'sudden, reactive motion',
  },
  'angry': {
    cameraMovement: 'fast-zoom-in',
    subjectMotion: 'gesture',
    environmentalEffect: 'shadows-move',
    pacing: 'intense, aggressive motion',
  },
  'nervous': {
    cameraMovement: 'breathing',
    subjectMotion: 'sway',
    environmentalEffect: 'light-flicker',
    pacing: 'jittery, uneasy motion',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build an enhanced video prompt based on scene context
 * 
 * This function creates detailed motion descriptions for Image-to-Video AI
 * considering the image style, mood, and scene content.
 * 
 * @param options - Configuration for video prompt generation
 * @returns Detailed video motion prompt in English
 */
export function buildVideoPrompt(options: {
  /** Original video prompt from storyboard (if available) */
  originalPrompt?: string;
  /** The narration text for context */
  narration?: string;
  /** The image style being used */
  imageStyle?: ImageStyle;
  /** The mood/emotion of the scene */
  mood?: string;
  /** Duration of the scene in seconds */
  duration?: number;
  /** Scene position (for pacing) */
  sceneNumber?: number;
  /** Total number of scenes */
  totalScenes?: number;
}): string {
  const {
    originalPrompt,
    narration,
    imageStyle = 'photorealistic',
    mood = 'neutral',
    duration = 5,
    sceneNumber = 1,
    totalScenes = 5,
  } = options;

  // If we have a good original prompt, enhance it
  if (originalPrompt && originalPrompt.length > 30) {
    return enhanceVideoPrompt(originalPrompt, imageStyle, mood);
  }

  // Build from scratch based on context
  const stylePreset = VIDEO_STYLE_PRESETS[imageStyle] || VIDEO_STYLE_PRESETS['photorealistic'];
  const moodMotion = MOOD_MOTION_MAP[mood] || MOOD_MOTION_MAP['neutral'];

  // Determine position-based pacing
  let positionModifier = '';
  if (sceneNumber === 1) {
    positionModifier = 'Opening shot: ';
  } else if (sceneNumber === totalScenes) {
    positionModifier = 'Final shot: ';
  } else if (sceneNumber === Math.ceil(totalScenes / 2)) {
    positionModifier = 'Climax moment: ';
  }

  // Get primary movements based on mood
  const cameraMovement = CAMERA_MOVEMENTS[moodMotion.cameraMovement];
  const subjectMotion = SUBJECT_MOTIONS[moodMotion.subjectMotion];
  const environmentalEffect = ENVIRONMENTAL_EFFECTS[moodMotion.environmentalEffect];

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD PROMPT WITH OPTIMIZED STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════
  const promptParts: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. POSITION CONTEXT (Scene position in narrative arc)
  // ═══════════════════════════════════════════════════════════════════════════
  if (positionModifier) {
    promptParts.push(positionModifier);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CAMERA MOVEMENT (Primary motion element)
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push(cameraMovement);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SUBJECT MOTION (Character/object movement)
  // ═══════════════════════════════════════════════════════════════════════════
  if (moodMotion.subjectMotion !== 'still') {
    promptParts.push(subjectMotion);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ENVIRONMENTAL EFFECTS (Atmospheric elements)
  // ═══════════════════════════════════════════════════════════════════════════
  if (moodMotion.environmentalEffect !== 'none') {
    promptParts.push(environmentalEffect);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. STYLE MODIFIERS (Visual style consistency)
  // ═══════════════════════════════════════════════════════════════════════════
  // Use first style modifier (most representative) instead of random for consistency
  const primaryStyleModifier = stylePreset.styleModifiers[0];
  promptParts.push(primaryStyleModifier);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PACING (Motion rhythm and speed)
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push(moodMotion.pacing);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. DURATION-AWARE GUIDANCE (Motion intensity based on clip length)
  // ═══════════════════════════════════════════════════════════════════════════
  if (duration <= 3) {
    promptParts.push('quick subtle movement, efficient motion');
  } else if (duration > 3 && duration < 6) {
    promptParts.push('smooth controlled motion');
  } else if (duration >= 6 && duration < 10) {
    promptParts.push('extended smooth motion with natural progression');
  } else if (duration >= 10) {
    promptParts.push('extended smooth motion with natural progression and subtle variations');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. INTENSITY MODIFIER (Based on style preset)
  // ═══════════════════════════════════════════════════════════════════════════
  if (stylePreset.motionIntensity === 'dynamic') {
    promptParts.push('dynamic expressive movement');
  } else if (stylePreset.motionIntensity === 'subtle') {
    promptParts.push('subtle natural movement');
  }

  // Join and clean up
  let finalPrompt = promptParts.join(', ').trim();

  // Ensure prompt ends properly
  if (!finalPrompt.endsWith('.') && !finalPrompt.endsWith('!')) {
    finalPrompt += '.';
  }

  return finalPrompt;
}

/**
 * Enhance an existing video prompt with style-specific modifiers
 * Uses intelligent enhancement to avoid over-modification
 */
function enhanceVideoPrompt(
  originalPrompt: string,
  imageStyle: ImageStyle,
  mood: string
): string {
  const stylePreset = VIDEO_STYLE_PRESETS[imageStyle] || VIDEO_STYLE_PRESETS['photorealistic'];
  const moodMotion = MOOD_MOTION_MAP[mood] || MOOD_MOTION_MAP['neutral'];

  // Don't over-enhance already comprehensive prompts
  if (originalPrompt.length > 120) {
    return originalPrompt;
  }

  const lowerPrompt = originalPrompt.toLowerCase();
  const enhancements: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK FOR MISSING ELEMENTS AND ENHANCE
  // ═══════════════════════════════════════════════════════════════════════════

  // Add style modifier if not present
  const hasStyleKeyword = stylePreset.styleModifiers.some(mod => 
    lowerPrompt.includes(mod.toLowerCase())
  );
  if (!hasStyleKeyword) {
    enhancements.push(stylePreset.styleModifiers[0]);
  }

  // Add pacing if not present
  const hasPacingKeyword = lowerPrompt.includes('motion') || 
                          lowerPrompt.includes('movement') || 
                          lowerPrompt.includes('pacing') ||
                          lowerPrompt.includes('rhythm');
  if (!hasPacingKeyword) {
    enhancements.push(moodMotion.pacing);
  }

  // Add intensity modifier if style requires it
  if (stylePreset.motionIntensity === 'dynamic' && !lowerPrompt.includes('dynamic')) {
    enhancements.push('dynamic movement');
  } else if (stylePreset.motionIntensity === 'subtle' && !lowerPrompt.includes('subtle')) {
    enhancements.push('subtle movement');
  }

  // Join enhancements if any
  if (enhancements.length > 0) {
    return `${originalPrompt}, ${enhancements.join(', ')}`;
  }

  return originalPrompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT FALLBACK PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a default video prompt when no context is available
 * Provides high-quality default prompts optimized for each style
 */
export function getDefaultVideoPrompt(imageStyle: ImageStyle): string {
  const stylePrompts: Record<ImageStyle, string> = {
    'photorealistic': 'Slow cinematic zoom in, subject gently turns head to the side, subtle breathing motion, dust particles floating in warm sunlight beams, soft shadows shift across the scene, natural lifelike animation, smooth controlled motion',
    'cinematic': 'Dramatic slow dolly forward through space, subject turns head slightly with natural micro-expressions, volumetric light rays shift and intensify, soft shadows move slowly, film-quality movement with theatrical pacing, extended smooth motion',
    '3d-render': 'Smooth camera orbit right around subject, CGI motion with rendered reflections on surfaces, clean 3D animation style, volumetric lighting shifts, smooth controlled motion',
    'digital-art': 'Gentle drift with artistic motion, subtle subject sway, flowing painterly animation, atmospheric particles float, soft light shift, smooth natural movement',
    'anime': 'Dynamic camera zoom in, expressive character movement, wind flows through hair naturally, particles float in light, cel animation style motion, energetic dynamic movement',
    'illustration': 'Subtle storybook animation, gentle breathing motion, illustrated movement style, soft atmospheric effects, gentle natural movement',
    'watercolor': 'Ethereal flowing motion, soft camera drift, watercolor-like gentle animation, mist drifts through scene, light shift creates dreamy atmosphere, subtle natural movement',
    'minimalist': 'Minimal clean movement, static with subtle light shift, simple animation, clean shadows move slowly, subtle natural movement',
  };

  return stylePrompts[imageStyle] || stylePrompts['photorealistic'];
}

/**
 * Analyze narration to suggest appropriate motion
 * Uses advanced pattern matching for better motion suggestions
 */
export function analyzeNarrationForMotion(narration: string): {
  suggestedCamera: keyof typeof CAMERA_MOVEMENTS;
  suggestedSubject: keyof typeof SUBJECT_MOTIONS;
  suggestedEnvironment: keyof typeof ENVIRONMENTAL_EFFECTS;
  intensity: 'subtle' | 'moderate' | 'dynamic';
} {
  if (!narration || narration.trim().length === 0) {
    return {
      suggestedCamera: 'gentle-drift',
      suggestedSubject: 'breathing',
      suggestedEnvironment: 'none',
      intensity: 'subtle',
    };
  }

  const lowerNarration = narration.toLowerCase();

  // Default suggestions
  let suggestedCamera: keyof typeof CAMERA_MOVEMENTS = 'gentle-drift';
  let suggestedSubject: keyof typeof SUBJECT_MOTIONS = 'breathing';
  let suggestedEnvironment: keyof typeof ENVIRONMENTAL_EFFECTS = 'none';
  let intensity: 'subtle' | 'moderate' | 'dynamic' = 'moderate';

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION WORDS ANALYSIS (Enhanced pattern matching)
  // ═══════════════════════════════════════════════════════════════════════════
  const walkKeywords = ['walk', 'move', 'step', 'go', 'travel', 'journey'];
  const lookKeywords = ['look', 'see', 'watch', 'gaze', 'stare', 'observe', 'view'];
  const speakKeywords = ['speak', 'say', 'talk', 'tell', 'explain', 'discuss', 'present'];
  const runKeywords = ['run', 'rush', 'hurry', 'sprint', 'dash'];
  const sitKeywords = ['sit', 'rest', 'relax', 'settle'];
  
  if (walkKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'dolly-in';
    suggestedSubject = 'walk-forward';
    intensity = 'moderate';
  } else if (runKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'fast-zoom-in';
    suggestedSubject = 'walk-forward';
    intensity = 'dynamic';
  } else if (lookKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'slow-zoom-in';
    suggestedSubject = 'head-turn';
    intensity = 'subtle';
  } else if (speakKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedSubject = 'gesture';
    intensity = 'moderate';
  } else if (sitKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'gentle-drift';
    suggestedSubject = 'still';
    intensity = 'subtle';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTIONAL WORDS ANALYSIS (Enhanced detection)
  // ═══════════════════════════════════════════════════════════════════════════
  const happyKeywords = ['happy', 'joy', 'excited', 'celebrate', 'smile', 'laugh', 'cheerful', 'positive'];
  const sadKeywords = ['sad', 'cry', 'tears', 'grief', 'sorrow', 'melancholy', 'depressed'];
  const fearKeywords = ['fear', 'scared', 'afraid', 'anxious', 'worried', 'nervous', 'panic'];
  const angryKeywords = ['angry', 'furious', 'rage', 'mad', 'frustrated', 'annoyed'];
  const surpriseKeywords = ['surprised', 'shocked', 'amazed', 'astonished', 'stunned'];
  
  if (happyKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedEnvironment = 'sun-rays';
    suggestedSubject = 'smile-form';
    suggestedCamera = 'slow-zoom-in';
    intensity = 'moderate';
  } else if (sadKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'slow-zoom-out';
    suggestedEnvironment = 'rain';
    suggestedSubject = 'look-down';
    intensity = 'subtle';
  } else if (fearKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'breathing';
    suggestedEnvironment = 'shadows-move';
    suggestedSubject = 'sway';
    intensity = 'moderate';
  } else if (angryKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'fast-zoom-in';
    suggestedSubject = 'gesture';
    suggestedEnvironment = 'shadows-move';
    intensity = 'dynamic';
  } else if (surpriseKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedCamera = 'fast-zoom-in';
    suggestedSubject = 'lean-back';
    suggestedEnvironment = 'light-flicker';
    intensity = 'dynamic';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIRONMENTAL WORDS ANALYSIS (Enhanced detection)
  // ═══════════════════════════════════════════════════════════════════════════
  const windKeywords = ['wind', 'breeze', 'air', 'gust'];
  const rainKeywords = ['rain', 'rainy', 'drizzle', 'storm', 'downpour'];
  const sunKeywords = ['sun', 'sunny', 'sunlight', 'bright', 'light', 'daylight'];
  const snowKeywords = ['snow', 'snowy', 'snowflake', 'winter'];
  const cloudKeywords = ['cloud', 'cloudy', 'overcast', 'sky'];
  
  if (windKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedEnvironment = 'wind-hair';
  } else if (rainKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedEnvironment = 'rain';
  } else if (sunKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedEnvironment = 'sun-rays';
  } else if (snowKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedEnvironment = 'snow';
  } else if (cloudKeywords.some(keyword => lowerNarration.includes(keyword))) {
    suggestedEnvironment = 'clouds-drift';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTENSITY DETECTION (Based on action and emotion)
  // ═══════════════════════════════════════════════════════════════════════════
  const dynamicKeywords = ['fast', 'quick', 'rapid', 'sudden', 'explosive', 'dramatic', 'powerful', 'intense'];
  const subtleKeywords = ['slow', 'gentle', 'calm', 'peaceful', 'soft', 'quiet', 'minimal'];
  
  if (dynamicKeywords.some(keyword => lowerNarration.includes(keyword))) {
    intensity = 'dynamic';
  } else if (subtleKeywords.some(keyword => lowerNarration.includes(keyword))) {
    intensity = 'subtle';
  }

  return { suggestedCamera, suggestedSubject, suggestedEnvironment, intensity };
}

