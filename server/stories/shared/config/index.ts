// Shared Configuration Exports
// Re-export all shared model configs for easy importing
// ═══════════════════════════════════════════════════════════════════════════

// Video Models
export {
  VIDEO_MODEL_CONFIGS,
  DIMENSION_MAP,
  MODEL_DIMENSIONS,
  getDefaultVideoModel,
  getAvailableVideoModels,
  getDimensions,
  // Video Model Constraints (for scene-generator)
  getVideoModelConstraints,
  getClosestSupportedDuration,
  type VideoModelConfig,
  type VideoDimensions,
  type VideoModelConstraints,
} from './video-models';

// Image Models
export {
  IMAGE_MODEL_CONFIGS,
  IMAGE_DIMENSION_MAP,
  MODEL_SPECIFIC_DIMENSIONS,
  getDefaultImageModel,
  getAvailableImageModels,
  getImageDimensions,
  aspectRatioToDimensions,
  type ImageModelConfig,
  type ImageDimensions,
} from './image-models';

