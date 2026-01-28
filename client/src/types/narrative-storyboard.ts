/**
 * Narrative mode specific type extensions for storyboard types.
 * These types extend the base storyboard types with narrative-mode specific fields.
 */

import type { Scene, Shot, ShotVersion } from './storyboard';

/**
 * Extended Scene for narrative mode with videoResolution
 * Note: videoResolution is stored in step3Data but not in shared Scene type
 */
export interface NarrativeScene extends Scene {
  videoResolution?: string | null;  // Scene-level video resolution
}

/**
 * Extended Shot for narrative mode with videoResolution
 * Note: videoResolution is stored in step3Data but not in shared Shot type
 */
export interface NarrativeShot extends Shot {
  videoResolution?: string | null;  // Shot-level video resolution override
}

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
  // Per-frame model and configuration settings (for start-end mode)
  startFrameImageModel?: string | null;
  endFrameImageModel?: string | null;
  startFrameReferenceImageId?: string | null;
  endFrameReferenceImageId?: string | null;
  startFrameShotType?: string | null;
  endFrameShotType?: string | null;
  // Character tracking - which characters appear in this version/frame
  characters?: string[] | null; // Array of character IDs present in this version
  startFrameCharacters?: string[] | null; // Characters in start frame (for start-end mode)
  endFrameCharacters?: string[] | null; // Characters in end frame (for start-end mode)
}

