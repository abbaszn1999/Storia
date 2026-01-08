/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MUSIC PROMPTS STUB - AUTO-ASMR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * NOTE: AUTO-ASMR mode does not use background music generation.
 * This file exists only to satisfy the shared routes system that expects
 * music-prompts.ts to exist for all story modes.
 * 
 * All functions return minimal/default values to prevent errors in the
 * shared code that imports this module.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MusicStyle = 'none';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate if a string is a valid music style
 * For AUTO-ASMR: only 'none' is valid (no music generation)
 */
export function isValidMusicStyle(style: string): style is MusicStyle {
  return style === 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER (Stub)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build music prompt (stub - not used in AUTO-ASMR)
 * Returns empty string since AUTO-ASMR doesn't use music
 */
export function buildMusicPrompt(
  style: MusicStyle,
  options?: {
    storyTopic?: string;
    storyNarration?: string;
    duration?: number;
    additionalKeywords?: string[];
  }
): string {
  // AUTO-ASMR doesn't use music, return empty string
  return '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (Stubs)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate music duration (stub - not used in AUTO-ASMR)
 * Returns 0 since AUTO-ASMR doesn't generate music
 */
export function calculateMusicDuration(videoDurationSeconds: number): number {
  return 0;
}

/**
 * Recommend music style (stub - not used in AUTO-ASMR)
 * Always returns 'none' since AUTO-ASMR doesn't use music
 */
export function recommendMusicStyle(storyNarration: string): MusicStyle {
  return 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPATIBILITY EXPORTS (Stubs for shared code)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get available music styles (stub)
 * Returns empty array since AUTO-ASMR doesn't support music
 */
export function getAvailableMusicStyles(): any[] {
  return [];
}

/**
 * Get music style config (stub)
 * Returns minimal config for 'none' style
 */
export function getMusicStyleConfig(style: MusicStyle): any {
  return {
    id: 'none',
    name: 'No Music',
    description: 'Voice only',
    icon: '🔇',
  };
}
