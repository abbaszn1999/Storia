/**
 * Narrative mode specific type extensions for storyboard types.
 * These types extend the base storyboard types with narrative-mode specific fields.
 */

import type { ShotVersion } from './storyboard';

/**
 * Extended ShotVersion for narrative mode with per-frame advanced settings
 * Used in start-end mode for independent control of start and end frame generation
 */
export interface NarrativeShotVersion extends ShotVersion {
  // Per-frame advanced settings (for start-end mode)
  startFrameNegativePrompt?: string | null;
  endFrameNegativePrompt?: string | null;
  startFrameSeed?: number | null;
  endFrameSeed?: number | null;
  startFrameGuidanceScale?: number | null;
  endFrameGuidanceScale?: number | null;
  startFrameSteps?: number | null;
  endFrameSteps?: number | null;
  startFrameStrength?: number | null;
  endFrameStrength?: number | null;
  startFrameInherited?: boolean;  // True if start frame was inherited from previous shot
}

