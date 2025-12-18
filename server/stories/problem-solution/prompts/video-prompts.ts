/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO GENERATION PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module provides professional-grade video prompts for Image-to-Video AI.
 * It includes style-aware motion descriptions, camera movements, and effects.
 * 
 * VIDEO PROMPT FORMULA:
 * [Camera Movement] + [Subject Motion] + [Environmental Effects] + [Mood/Style]
 */

import type { ImageStyle } from '../types';

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

  // Build the prompt
  const promptParts: string[] = [];

  // Add position context
  if (positionModifier) {
    promptParts.push(positionModifier);
  }

  // Add camera movement
  promptParts.push(cameraMovement);

  // Add subject motion (skip if 'still' since it's minimal)
  if (moodMotion.subjectMotion !== 'still') {
    promptParts.push(subjectMotion);
  }

  // Add environmental effect
  if (moodMotion.environmentalEffect !== 'none') {
    promptParts.push(environmentalEffect);
  }

  // Add style modifiers
  const randomStyleModifier = stylePreset.styleModifiers[
    Math.floor(Math.random() * stylePreset.styleModifiers.length)
  ];
  promptParts.push(randomStyleModifier);

  // Add pacing
  promptParts.push(moodMotion.pacing);

  // Join and clean up
  let finalPrompt = promptParts.join(', ');

  // Add duration-based guidance
  if (duration <= 3) {
    finalPrompt += ', quick subtle movement';
  } else if (duration >= 8) {
    finalPrompt += ', extended smooth motion';
  }

  return finalPrompt;
}

/**
 * Enhance an existing video prompt with style-specific modifiers
 */
function enhanceVideoPrompt(
  originalPrompt: string,
  imageStyle: ImageStyle,
  mood: string
): string {
  const stylePreset = VIDEO_STYLE_PRESETS[imageStyle] || VIDEO_STYLE_PRESETS['photorealistic'];
  const moodMotion = MOOD_MOTION_MAP[mood] || MOOD_MOTION_MAP['neutral'];

  // Don't over-enhance already good prompts
  if (originalPrompt.length > 100) {
    return originalPrompt;
  }

  // Add style and mood modifiers
  const enhancements: string[] = [];

  // Add a style modifier if not present
  const hasStyleKeyword = stylePreset.styleModifiers.some(mod => 
    originalPrompt.toLowerCase().includes(mod.toLowerCase())
  );
  if (!hasStyleKeyword) {
    enhancements.push(stylePreset.styleModifiers[0]);
  }

  // Add pacing if not present
  if (!originalPrompt.includes('motion') && !originalPrompt.includes('movement')) {
    enhancements.push(moodMotion.pacing);
  }

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
 */
export function getDefaultVideoPrompt(imageStyle: ImageStyle): string {
  const stylePrompts: Record<ImageStyle, string> = {
    'photorealistic': 'Slow cinematic zoom in, subtle breathing motion, natural micro-movements, dust particles floating in light beams, lifelike animation',
    'cinematic': 'Dramatic slow dolly forward, subject turns head slightly, volumetric light rays shift, film-quality movement with theatrical pacing',
    '3d-render': 'Smooth camera orbit right, CGI motion with rendered reflections, clean 3D animation style',
    'digital-art': 'Gentle drift with artistic motion, subtle subject sway, flowing painterly animation',
    'anime': 'Dynamic camera zoom, expressive character movement, wind flows through hair, cel animation style motion',
    'illustration': 'Subtle storybook animation, gentle breathing motion, illustrated movement style',
    'watercolor': 'Ethereal flowing motion, soft camera drift, watercolor-like gentle animation',
    'minimalist': 'Minimal clean movement, static with subtle light shift, simple animation',
  };

  return stylePrompts[imageStyle] || stylePrompts['photorealistic'];
}

/**
 * Analyze narration to suggest appropriate motion
 */
export function analyzeNarrationForMotion(narration: string): {
  suggestedCamera: keyof typeof CAMERA_MOVEMENTS;
  suggestedSubject: keyof typeof SUBJECT_MOTIONS;
  suggestedEnvironment: keyof typeof ENVIRONMENTAL_EFFECTS;
} {
  const lowerNarration = narration.toLowerCase();

  // Default suggestions
  let suggestedCamera: keyof typeof CAMERA_MOVEMENTS = 'gentle-drift';
  let suggestedSubject: keyof typeof SUBJECT_MOTIONS = 'breathing';
  let suggestedEnvironment: keyof typeof ENVIRONMENTAL_EFFECTS = 'none';

  // Analyze for action words
  if (lowerNarration.includes('walk') || lowerNarration.includes('move') || lowerNarration.includes('يمشي')) {
    suggestedCamera = 'dolly-in';
    suggestedSubject = 'walk-forward';
  } else if (lowerNarration.includes('look') || lowerNarration.includes('see') || lowerNarration.includes('ينظر')) {
    suggestedCamera = 'slow-zoom-in';
    suggestedSubject = 'head-turn';
  } else if (lowerNarration.includes('speak') || lowerNarration.includes('say') || lowerNarration.includes('يقول')) {
    suggestedSubject = 'gesture';
  }

  // Analyze for emotional words
  if (lowerNarration.includes('happy') || lowerNarration.includes('joy') || lowerNarration.includes('سعيد')) {
    suggestedEnvironment = 'sun-rays';
    suggestedSubject = 'smile-form';
  } else if (lowerNarration.includes('sad') || lowerNarration.includes('cry') || lowerNarration.includes('حزين')) {
    suggestedCamera = 'slow-zoom-out';
    suggestedEnvironment = 'rain';
  } else if (lowerNarration.includes('fear') || lowerNarration.includes('scared') || lowerNarration.includes('خوف')) {
    suggestedCamera = 'breathing';
    suggestedEnvironment = 'shadows-move';
  }

  // Analyze for environmental words
  if (lowerNarration.includes('wind') || lowerNarration.includes('رياح')) {
    suggestedEnvironment = 'wind-hair';
  } else if (lowerNarration.includes('rain') || lowerNarration.includes('مطر')) {
    suggestedEnvironment = 'rain';
  } else if (lowerNarration.includes('sun') || lowerNarration.includes('light') || lowerNarration.includes('شمس')) {
    suggestedEnvironment = 'sun-rays';
  }

  return { suggestedCamera, suggestedSubject, suggestedEnvironment };
}

