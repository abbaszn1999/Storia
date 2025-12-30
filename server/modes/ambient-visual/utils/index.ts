/**
 * Ambient Visual Mode Utilities
 * 
 * Mode-specific helper functions that don't belong in shared configs.
 */

// Video model helpers for Agent 4.3 (Video Clip Generator)
export {
  supportsStartEndFrame,
  supportsFirstFrame,
  getVideoModelAirId,
  getVideoDimensions,
  getModelDurationRange,
  clampDuration,
  getVideoModelProviderSettings,
  usesInputsWrapperFormat,
  buildFrameImagesPayload,
} from './video-model-helpers';

