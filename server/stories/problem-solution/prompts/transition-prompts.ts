/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSITION SELECTION PROMPTS - 2025 Trending
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Intelligent transition selection based on:
 * - Scene mood (voiceMood)
 * - Content type (problem, solution, CTA, etc.)
 * - Pacing (slow, medium, fast)
 * - Story position (intro, middle, outro)
 */

import type { SceneTransition, VoiceMood, TransitionCategory } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSITION METADATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detailed info about each transition
 */
export const TRANSITION_METADATA: Record<SceneTransition, {
  category: TransitionCategory;
  description: string;
  energy: 'low' | 'medium' | 'high';
  baseDuration: number;
  bestFor: string[];
}> = {
  // Motion-based (viral on TikTok/Reels)
  'whip-pan': {
    category: 'motion',
    description: 'Fast horizontal swipe with motion blur - viral TikTok effect',
    energy: 'high',
    baseDuration: 0.3,
    bestFor: ['action', 'energy', 'surprise', 'comedy'],
  },
  'zoom-punch': {
    category: 'motion',
    description: 'Quick zoom in/out creating impact feeling',
    energy: 'high',
    baseDuration: 0.4,
    bestFor: ['emphasis', 'reveal', 'surprise', 'CTA'],
  },
  'snap-zoom': {
    category: 'motion',
    description: 'Sharp quick zoom transition',
    energy: 'high',
    baseDuration: 0.25,
    bestFor: ['drama', 'focus', 'intensity'],
  },
  'motion-blur-left': {
    category: 'motion',
    description: 'Directional blur moving left',
    energy: 'medium',
    baseDuration: 0.4,
    bestFor: ['progression', 'journey', 'time-passing'],
  },
  'motion-blur-right': {
    category: 'motion',
    description: 'Directional blur moving right',
    energy: 'medium',
    baseDuration: 0.4,
    bestFor: ['progression', 'forward-motion', 'next-step'],
  },
  'motion-blur-up': {
    category: 'motion',
    description: 'Directional blur moving up',
    energy: 'medium',
    baseDuration: 0.4,
    bestFor: ['aspiration', 'hope', 'rising'],
  },
  'motion-blur-down': {
    category: 'motion',
    description: 'Directional blur moving down',
    energy: 'medium',
    baseDuration: 0.4,
    bestFor: ['grounding', 'discovery', 'falling'],
  },

  // Light & Glow (cinematic)
  'flash-white': {
    category: 'light',
    description: 'White flash between scenes - clean, new beginning',
    energy: 'high',
    baseDuration: 0.3,
    bestFor: ['solution', 'revelation', 'positive-turn', 'clean-start'],
  },
  'flash-black': {
    category: 'light',
    description: 'Black flash - dramatic, intense moment',
    energy: 'high',
    baseDuration: 0.35,
    bestFor: ['drama', 'tension', 'ending', 'impact'],
  },
  'light-leak': {
    category: 'light',
    description: 'Warm light leak effect - nostalgic, warm feeling',
    energy: 'low',
    baseDuration: 0.6,
    bestFor: ['nostalgia', 'warmth', 'romance', 'memory'],
  },
  'lens-flare': {
    category: 'light',
    description: 'Lens flare transition - cinematic, epic',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['epic', 'cinematic', 'hero-moment', 'inspiration'],
  },
  'luma-fade': {
    category: 'light',
    description: 'Brightness-based fade transition',
    energy: 'low',
    baseDuration: 0.7,
    bestFor: ['dream', 'memory', 'thoughtful', 'transition'],
  },

  // Digital / Glitch (modern/tech)
  'glitch': {
    category: 'digital',
    description: 'Digital distortion effect - edgy, modern',
    energy: 'high',
    baseDuration: 0.4,
    bestFor: ['tech', 'modern', 'error', 'disruption', 'problem'],
  },
  'rgb-split': {
    category: 'digital',
    description: 'RGB channel separation - cyberpunk aesthetic',
    energy: 'high',
    baseDuration: 0.35,
    bestFor: ['tech', 'cyberpunk', 'edgy', 'digital'],
  },
  'pixelate': {
    category: 'digital',
    description: 'Pixelation transition - retro gaming feel',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['retro', 'gaming', 'digital', 'transformation'],
  },
  'vhs-noise': {
    category: 'digital',
    description: 'Retro VHS noise effect - nostalgic tech',
    energy: 'low',
    baseDuration: 0.5,
    bestFor: ['nostalgia', 'retro', 'memory', 'vintage'],
  },

  // Shape Reveals (TikTok favorites)
  'circle-open': {
    category: 'shape',
    description: 'Circle expanding to reveal next scene',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['reveal', 'focus', 'intro', 'spotlight'],
  },
  'circle-close': {
    category: 'shape',
    description: 'Circle contracting to close scene',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['ending', 'mystery', 'focus', 'conclusion'],
  },
  'heart-reveal': {
    category: 'shape',
    description: 'Heart shape reveal - romantic, loving',
    energy: 'medium',
    baseDuration: 0.6,
    bestFor: ['love', 'romance', 'care', 'emotion'],
  },
  'diamond-wipe': {
    category: 'shape',
    description: 'Diamond pattern wipe',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['luxury', 'special', 'premium', 'elegant'],
  },
  'star-wipe': {
    category: 'shape',
    description: 'Star pattern reveal',
    energy: 'high',
    baseDuration: 0.5,
    bestFor: ['celebration', 'achievement', 'magic', 'special'],
  },
  'diagonal-tl': {
    category: 'shape',
    description: 'Diagonal wipe from top-left',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['progression', 'story', 'sequence'],
  },
  'diagonal-br': {
    category: 'shape',
    description: 'Diagonal wipe from bottom-right',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['progression', 'story', 'continuation'],
  },

  // 3D Effects
  'cube-rotate-left': {
    category: '3d',
    description: '3D cube rotation to the left',
    energy: 'medium',
    baseDuration: 0.6,
    bestFor: ['tech', 'modern', 'professional', 'change'],
  },
  'cube-rotate-right': {
    category: '3d',
    description: '3D cube rotation to the right',
    energy: 'medium',
    baseDuration: 0.6,
    bestFor: ['tech', 'modern', 'professional', 'progression'],
  },
  'page-flip': {
    category: '3d',
    description: 'Page flip effect like a book',
    energy: 'low',
    baseDuration: 0.7,
    bestFor: ['story', 'journey', 'chapter', 'narrative'],
  },
  'parallax-slide': {
    category: '3d',
    description: 'Multi-layer depth slide',
    energy: 'medium',
    baseDuration: 0.6,
    bestFor: ['depth', 'premium', 'sophisticated', 'layers'],
  },

  // Smooth & Elegant
  'smooth-blur': {
    category: 'smooth',
    description: 'Gentle blur dissolve transition',
    energy: 'low',
    baseDuration: 0.8,
    bestFor: ['calm', 'dream', 'soft', 'elegant'],
  },
  'cross-dissolve': {
    category: 'smooth',
    description: 'Classic cross dissolve - timeless',
    energy: 'low',
    baseDuration: 0.7,
    bestFor: ['professional', 'clean', 'universal', 'safe'],
  },
  'wave-ripple': {
    category: 'smooth',
    description: 'Water ripple effect',
    energy: 'low',
    baseDuration: 0.6,
    bestFor: ['dream', 'magical', 'water', 'transformation'],
  },
  'zoom-blur': {
    category: 'smooth',
    description: 'Radial zoom blur',
    energy: 'medium',
    baseDuration: 0.5,
    bestFor: ['focus', 'tunnel', 'intensity', 'depth'],
  },

  // Classic
  'fade': {
    category: 'classic',
    description: 'Simple fade to black/white',
    energy: 'low',
    baseDuration: 0.6,
    bestFor: ['universal', 'safe', 'clean', 'ending'],
  },
  'wipe-left': {
    category: 'classic',
    description: 'Wipe from right to left',
    energy: 'low',
    baseDuration: 0.5,
    bestFor: ['progression', 'next', 'sequence'],
  },
  'wipe-right': {
    category: 'classic',
    description: 'Wipe from left to right',
    energy: 'low',
    baseDuration: 0.5,
    bestFor: ['progression', 'next', 'sequence'],
  },
  'wipe-up': {
    category: 'classic',
    description: 'Wipe upward',
    energy: 'low',
    baseDuration: 0.5,
    bestFor: ['rising', 'progress', 'upward'],
  },
  'wipe-down': {
    category: 'classic',
    description: 'Wipe downward',
    energy: 'low',
    baseDuration: 0.5,
    bestFor: ['reveal', 'descend', 'ground'],
  },
  'none': {
    category: 'classic',
    description: 'Hard cut - no transition',
    energy: 'high',
    baseDuration: 0,
    bestFor: ['impact', 'shock', 'fast-pacing', 'documentary'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD TO TRANSITION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map voice mood to best matching transitions
 * Ranked by relevance (first is best match)
 */
export const MOOD_TRANSITION_MAP: Record<VoiceMood, SceneTransition[]> = {
  // Positive emotions
  happy: ['light-leak', 'flash-white', 'circle-open', 'lens-flare', 'star-wipe', 'zoom-punch'],
  excited: ['whip-pan', 'zoom-punch', 'snap-zoom', 'motion-blur-right', 'glitch', 'flash-white'],
  
  // Negative emotions
  sad: ['smooth-blur', 'luma-fade', 'fade', 'cross-dissolve', 'wave-ripple', 'light-leak'],
  angry: ['glitch', 'rgb-split', 'flash-black', 'snap-zoom', 'whip-pan', 'zoom-punch'],
  nervous: ['glitch', 'rgb-split', 'vhs-noise', 'motion-blur-up', 'pixelate', 'flash-black'],
  
  // Dramatic emotions
  dramatic: ['flash-black', 'zoom-punch', 'snap-zoom', 'glitch', 'lens-flare', 'cube-rotate-left'],
  surprised: ['zoom-punch', 'flash-white', 'circle-open', 'snap-zoom', 'whip-pan', 'star-wipe'],
  
  // Calm/thoughtful
  thoughtful: ['smooth-blur', 'luma-fade', 'cross-dissolve', 'parallax-slide', 'page-flip', 'zoom-blur'],
  curious: ['circle-open', 'zoom-blur', 'parallax-slide', 'diagonal-tl', 'motion-blur-right', 'lens-flare'],
  
  // Special moods
  whisper: ['smooth-blur', 'luma-fade', 'fade', 'wave-ripple', 'cross-dissolve', 'vhs-noise'],
  sarcastic: ['glitch', 'rgb-split', 'pixelate', 'whip-pan', 'snap-zoom', 'none'],
  
  // Neutral
  neutral: ['cross-dissolve', 'fade', 'wipe-right', 'circle-open', 'smooth-blur', 'diagonal-tl'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT TYPE TO TRANSITION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Content-aware transition selection
 * Based on Problem-Solution story structure (PAS framework)
 */
export const CONTENT_TRANSITION_MAP: Record<string, SceneTransition[]> = {
  // Story structure points
  intro: ['circle-open', 'fade', 'parallax-slide', 'zoom-blur', 'luma-fade'],
  problem: ['glitch', 'rgb-split', 'flash-black', 'zoom-punch', 'vhs-noise'],
  agitation: ['whip-pan', 'motion-blur-right', 'snap-zoom', 'glitch', 'flash-black'],
  solution: ['flash-white', 'light-leak', 'circle-open', 'lens-flare', 'star-wipe'],
  cta: ['zoom-punch', 'flash-white', 'star-wipe', 'lens-flare', 'circle-open'],
  outro: ['circle-close', 'fade', 'smooth-blur', 'luma-fade', 'cross-dissolve'],
  
  // Emotional beats
  tension_build: ['motion-blur-up', 'zoom-blur', 'snap-zoom', 'glitch'],
  tension_release: ['light-leak', 'smooth-blur', 'wave-ripple', 'flash-white'],
  revelation: ['flash-white', 'zoom-punch', 'circle-open', 'lens-flare'],
  reflection: ['smooth-blur', 'luma-fade', 'page-flip', 'cross-dissolve'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PACING ADJUSTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pacing multipliers for transition duration
 */
export const PACING_DURATION_MULTIPLIER: Record<'slow' | 'medium' | 'fast', number> = {
  slow: 1.4,    // Slower transitions for slow pacing
  medium: 1.0,  // Base duration
  fast: 0.7,    // Faster transitions for fast pacing
};

/**
 * Transitions to avoid based on pacing
 */
export const PACING_AVOID_TRANSITIONS: Record<'slow' | 'medium' | 'fast', SceneTransition[]> = {
  slow: ['whip-pan', 'snap-zoom', 'none', 'glitch'],  // Too fast for slow pacing
  medium: [],  // Medium can use anything
  fast: ['smooth-blur', 'luma-fade', 'page-flip', 'wave-ripple'],  // Too slow for fast pacing
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENT SELECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Select the best transition for a scene based on multiple factors
 */
export function selectTransitionForScene(
  currentMood: VoiceMood | string,
  nextMood: VoiceMood | string | null,
  contentType?: string,
  pacing: 'slow' | 'medium' | 'fast' = 'medium',
  isLastScene: boolean = false
): SceneTransition {
  // If last scene, use ending-appropriate transition
  if (isLastScene) {
    const endingTransitions: SceneTransition[] = ['circle-close', 'fade', 'smooth-blur', 'luma-fade'];
    return endingTransitions[Math.floor(Math.random() * endingTransitions.length)];
  }
  
  // Get candidates from mood
  const mood = (currentMood as VoiceMood) || 'neutral';
  let candidates = [...(MOOD_TRANSITION_MAP[mood] || MOOD_TRANSITION_MAP['neutral'])];
  
  // Filter by pacing (remove inappropriate transitions)
  const avoidList = PACING_AVOID_TRANSITIONS[pacing];
  candidates = candidates.filter(t => !avoidList.includes(t));
  
  // If content type provided, boost content-appropriate transitions
  if (contentType && CONTENT_TRANSITION_MAP[contentType]) {
    const contentCandidates = CONTENT_TRANSITION_MAP[contentType];
    // Find intersection - prefer transitions that match both mood and content
    const intersection = candidates.filter(t => contentCandidates.includes(t));
    if (intersection.length > 0) {
      // 70% chance to use intersection, 30% to use mood-based
      if (Math.random() < 0.7) {
        candidates = intersection;
      }
    }
  }
  
  // Consider mood contrast for dramatic effect
  if (nextMood && currentMood !== nextMood) {
    // Big mood shift → use more impactful transition
    const moodShiftTransitions: SceneTransition[] = ['zoom-punch', 'flash-white', 'flash-black', 'whip-pan'];
    const shiftIntersection = candidates.filter(t => moodShiftTransitions.includes(t));
    if (shiftIntersection.length > 0 && Math.random() < 0.4) {
      candidates = shiftIntersection;
    }
  }
  
  // Ensure we have at least one candidate
  if (candidates.length === 0) {
    candidates = ['cross-dissolve', 'fade'];
  }
  
  // Return weighted random selection (prefer earlier items)
  const weightedIndex = Math.floor(Math.pow(Math.random(), 1.5) * candidates.length);
  return candidates[weightedIndex];
}

/**
 * Get transition duration based on transition type and pacing
 */
export function getTransitionDuration(
  transition: SceneTransition,
  pacing: 'slow' | 'medium' | 'fast' = 'medium'
): number {
  const metadata = TRANSITION_METADATA[transition];
  if (!metadata) return 0.5;
  
  const baseDuration = metadata.baseDuration;
  const multiplier = PACING_DURATION_MULTIPLIER[pacing];
  
  // Calculate final duration with limits
  const duration = baseDuration * multiplier;
  
  // Clamp between 0.2s and 1.5s
  return Math.max(0.2, Math.min(1.5, duration));
}

/**
 * Auto-select transitions for all scenes in a story
 */
export function autoSelectTransitionsForStory(
  scenes: Array<{
    sceneNumber: number;
    voiceMood?: VoiceMood | string;
    narration: string;
  }>,
  pacing: 'slow' | 'medium' | 'fast' = 'medium'
): Array<{ sceneNumber: number; transition: SceneTransition; duration: number }> {
  const results: Array<{ sceneNumber: number; transition: SceneTransition; duration: number }> = [];
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const nextScene = scenes[i + 1];
    const isLast = i === scenes.length - 1;
    
    // Detect content type from narration (simple heuristics)
    let contentType: string | undefined;
    const narrationLower = scene.narration.toLowerCase();
    
    if (i === 0) {
      contentType = 'intro';
    } else if (isLast) {
      contentType = 'outro';
    } else if (narrationLower.includes('problem') || narrationLower.includes('struggle') || narrationLower.includes('pain')) {
      contentType = 'problem';
    } else if (narrationLower.includes('solution') || narrationLower.includes('answer') || narrationLower.includes('finally')) {
      contentType = 'solution';
    } else if (narrationLower.includes('try') || narrationLower.includes('start') || narrationLower.includes('click') || narrationLower.includes('join')) {
      contentType = 'cta';
    }
    
    const transition = selectTransitionForScene(
      scene.voiceMood || 'neutral',
      nextScene?.voiceMood || null,
      contentType,
      pacing,
      isLast
    );
    
    const duration = getTransitionDuration(transition, pacing);
    
    results.push({
      sceneNumber: scene.sceneNumber,
      transition,
      duration,
    });
  }
  
  return results;
}

/**
 * Get all transitions by category for UI display
 */
export function getTransitionsByCategory(): Record<TransitionCategory, Array<{
  name: SceneTransition;
  description: string;
  energy: string;
}>> {
  const result: Record<TransitionCategory, Array<{
    name: SceneTransition;
    description: string;
    energy: string;
  }>> = {
    motion: [],
    light: [],
    digital: [],
    shape: [],
    '3d': [],
    smooth: [],
    classic: [],
  };
  
  for (const [name, meta] of Object.entries(TRANSITION_METADATA)) {
    result[meta.category].push({
      name: name as SceneTransition,
      description: meta.description,
      energy: meta.energy,
    });
  }
  
  return result;
}

/**
 * Validate transition name
 */
export function isValidTransition(name: string): name is SceneTransition {
  return name in TRANSITION_METADATA;
}

