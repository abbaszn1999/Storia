// Shared Configuration Exports
// Re-export all shared model configs for easy importing
// ═══════════════════════════════════════════════════════════════════════════

// Model ID mapping (from legacy config.ts)
export { getRunwareModelId } from '../config';

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
  // Matching dimensions support
  requiresMatchingDimensions,
  getVideoDimensionsForImageGeneration,
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
  getImageModelConfig,
  aspectRatioToDimensions,
  imageModelSupportsDimensions,
  type ImageModelConfig,
  type ImageDimensions,
} from './image-models';
