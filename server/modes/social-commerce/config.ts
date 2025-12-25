/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOCIAL COMMERCE MODE - CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * High-quality VFX promo video creation for products.
 * 
 * Features:
 * - 5-step workflow: Strategic Context → Product/Cast DNA → Environment/Story → Shot Orchestrator → Media Planning
 * - Multi-agent architecture with 11+ AI agents
 * - Connected shot system with visual continuity
 * - Speed ramping and temporal orchestration
 */

export const SOCIAL_COMMERCE_CONFIG = {
  mode: 'commerce' as const,
  defaultTitle: 'Untitled Product Video',
  initialStep: 1,
  totalSteps: 5,
  
  // Default settings
  defaults: {
    aspectRatio: '9:16' as const,
    duration: 15 as const, // seconds - must match DurationOption type
    pacingProfile: 'FAST_CUT' as const,
    imageModel: 'flux-2-dev',
    videoModel: 'pixverse-v5.5',
  },
  
  // System constants for video generation
  videoGeneration: {
    MODEL_BASE_DURATION: 5.0, // Every generated clip is 5 seconds
    MIN_RENDERED_DURATION: 0.3, // Minimum output duration (16.7× max speed)
    MAX_RENDERED_DURATION: 5.0, // Maximum output duration (1× speed, no slow-mo)
  },
  
  // Pacing profiles
  pacingProfiles: [
    'FAST_CUT',         // High energy, rapid cuts (≤15s, Gen Z, Social Media)
    'LUXURY_SLOW',      // Premium, deliberate (Any duration, High-end, Premium)
    'KINETIC_RAMP',     // Speed ramping, dynamic acceleration (≤30s, Action-oriented, Sports)
    'STEADY_CINEMATIC', // Consistent film-like pacing (≥20s, Brand-focused, Storytelling)
  ] as const,
  
  // Shot types
  shotTypes: {
    IMAGE_REF: 'IMAGE_REF',     // Single keyframe animated
    START_END: 'START_END',     // Interpolation between two frames
  } as const,
  
  // Character modes
  characterModes: [
    'hand-model',
    'full-body',
    'silhouette',
  ] as const,
  
  // Speed curve types for Agent 4.2
  speedCurves: [
    'LINEAR',     // Constant speed throughout
    'EASE_IN',    // Slow → Fast (accelerates)
    'EASE_OUT',   // Fast → Slow (decelerates)
  ] as const,
};

// Aspect ratio configurations
export const ASPECT_RATIOS = {
  '9:16': { width: 1080, height: 1920, label: 'Vertical (9:16)' },
  '16:9': { width: 1920, height: 1080, label: 'Horizontal (16:9)' },
  '1:1': { width: 1080, height: 1080, label: 'Square (1:1)' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait (4:5)' },
} as const;

// Duration options in seconds
export const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60] as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;
export type DurationOption = (typeof DURATION_OPTIONS)[number];
export type PacingProfile = (typeof SOCIAL_COMMERCE_CONFIG.pacingProfiles)[number];
export type ShotType = keyof typeof SOCIAL_COMMERCE_CONFIG.shotTypes;
export type CharacterMode = (typeof SOCIAL_COMMERCE_CONFIG.characterModes)[number];
export type SpeedCurve = (typeof SOCIAL_COMMERCE_CONFIG.speedCurves)[number];

