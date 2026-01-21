// Video Model Utility Functions for Narrative Mode
// Provides helper functions for video model configuration and validation

import { VIDEO_MODEL_CONFIGS, getDimensions, getDefaultVideoModel, type VideoModelConfig, type AspectRatio, type Resolution } from '../../../ai/config/video-models';

/**
 * Get video model configuration by ID
 */
export function getModelConfig(modelId: string): VideoModelConfig | null {
  return VIDEO_MODEL_CONFIGS[modelId] || null;
}

/**
 * Validate model settings against capabilities
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateModelSettings(
  modelId: string,
  settings: {
    duration: number;
    aspectRatio: string;
    resolution: string;
  }
): ValidationResult {
  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    return {
      valid: false,
      error: `Unknown video model: ${modelId}`,
    };
  }

  const { duration, aspectRatio, resolution } = settings;

  // Check duration
  if (!modelConfig.durations.includes(duration)) {
    return {
      valid: false,
      error: `Model ${modelConfig.label} doesn't support ${duration}s duration. Supported: ${modelConfig.durations.join(", ")}s`,
    };
  }

  // Check aspect ratio
  if (!modelConfig.aspectRatios.includes(aspectRatio as AspectRatio)) {
    return {
      valid: false,
      error: `Model ${modelConfig.label} doesn't support ${aspectRatio} aspect ratio. Supported: ${modelConfig.aspectRatios.join(", ")}`,
    };
  }

  // Check resolution
  if (!modelConfig.resolutions.includes(resolution as Resolution)) {
    return {
      valid: false,
      error: `Model ${modelConfig.label} doesn't support ${resolution}. Supported: ${modelConfig.resolutions.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get supported durations for a model
 */
export function getSupportedDurations(modelId: string): number[] {
  const config = getModelConfig(modelId);
  return config?.durations || [];
}

/**
 * Get supported resolutions for a model and aspect ratio
 */
export function getSupportedResolutions(modelId: string, aspectRatio: string): Resolution[] {
  const config = getModelConfig(modelId);
  if (!config) return [];

  // Use getDimensions to check if resolution is supported for this aspect ratio
  // This handles model-specific dimension mappings
  const supportedResolutions: Resolution[] = [];
  
  for (const resolution of config.resolutions) {
    try {
      const dimensions = getDimensions(aspectRatio, resolution, modelId);
      if (dimensions.width > 0 && dimensions.height > 0) {
        supportedResolutions.push(resolution as Resolution);
      }
    } catch (error) {
      // Resolution not supported for this aspect ratio
      continue;
    }
  }

  return supportedResolutions;
}

/**
 * Check if model requires inputs wrapper for frame images
 */
export function shouldUseInputsWrapper(modelAirId: string): boolean {
  const modelsRequiringInputsWrapper = [
    "runway:1@1",      // Runway Gen-4 Turbo
    "runway:2@1",      // Runway Gen-4 (if exists)
    "minimax:4@1",     // Hailuo 2.3
    "lightricks:2@0",  // LTX-2 Pro
    "alibaba:wan@2.6", // Alibaba Wan 2.6
  ];
  
  return modelsRequiringInputsWrapper.includes(modelAirId);
}

/**
 * Check if model supports last frame (end frame)
 */
export function supportsLastFrame(modelId: string): boolean {
  const config = getModelConfig(modelId);
  return config?.frameImageSupport?.last ?? false;
}

/**
 * Resolve video settings from hierarchy (shot → scene → video)
 */
export interface ResolvedVideoSettings {
  videoModel: string;
  resolution: string;
  aspectRatio: string;
}

export function resolveVideoSettings(
  shot: { videoModel?: string | null; videoResolution?: string | null },
  scene: { videoModel?: string | null; videoResolution?: string | null },
  video: { videoModel?: string; videoResolution?: string; aspectRatio?: string },
  defaultVideoModel?: string,
  defaultResolution?: string,
  defaultAspectRatio?: string
): ResolvedVideoSettings {
  // Get defaults if not provided
  const finalDefaultVideoModel = defaultVideoModel || getDefaultVideoModel().id;
  const finalDefaultResolution = defaultResolution || '720p';
  const finalDefaultAspectRatio = defaultAspectRatio || '16:9';

  // Resolution priority: shot → scene → video → default
  const resolution = shot.videoResolution 
    || scene.videoResolution 
    || video.videoResolution 
    || finalDefaultResolution;

  // Helper to extract model ID string (handle both string and object formats)
  const getModelId = (model: any): string | null => {
    if (!model) return null;
    if (typeof model === "string") return model;
    if (typeof model === "object" && model.id) return model.id;
    if (typeof model === "object" && model.name) return model.name;
    return null;
  };

  // Video model priority: shot → scene → video → default
  const videoModel = getModelId(shot.videoModel) 
    || getModelId(scene.videoModel) 
    || getModelId(video.videoModel) 
    || finalDefaultVideoModel;

  // Aspect ratio from video level (consistent across shots)
  const aspectRatio = video.aspectRatio || finalDefaultAspectRatio;

  return {
    videoModel,
    resolution,
    aspectRatio,
  };
}

