/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSITION PROMPTS STUB - AUTO-ASMR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * NOTE: AUTO-ASMR mode uses image-to-video mode with limited transitions.
 * This file provides minimal transition support for compatibility with
 * the shared storyboard-enhancer system.
 * 
 * AUTO-ASMR primarily uses simple transitions (fade, none) for smooth
 * scene transitions in image-to-video mode.
 */

import type { SceneTransition, VoiceMood } from '../../shared/types';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSITION SELECTION (Simplified for AUTO-ASMR)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Select transition for scene (simplified for AUTO-ASMR)
 * AUTO-ASMR uses simple, smooth transitions appropriate for ASMR content
 */
export function selectTransitionForScene(
  currentMood: VoiceMood | string,
  nextMood: VoiceMood | string | null,
  contentType?: string,
  pacing: 'slow' | 'medium' | 'fast' = 'medium',
  isLastScene: boolean = false
): SceneTransition {
  // Last scene: no transition
  if (isLastScene) {
    return 'none';
  }

  // AUTO-ASMR prefers gentle transitions for relaxation
  // Default to fade for smooth, non-intrusive transitions
  return 'fade';
}

/**
 * Get transition duration (simplified for AUTO-ASMR)
 * AUTO-ASMR uses shorter, smoother transitions
 */
export function getTransitionDuration(
  transition: SceneTransition,
  pacing: 'slow' | 'medium' | 'fast' = 'medium'
): number {
  // Default duration for fade transition
  if (transition === 'fade' || transition === 'none') {
    return pacing === 'slow' ? 0.5 : pacing === 'fast' ? 0.3 : 0.4;
  }

  // Default duration for other transitions (shouldn't happen in AUTO-ASMR)
  return 0.4;
}
