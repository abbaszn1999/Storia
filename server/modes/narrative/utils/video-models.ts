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
 * 
 * Runware API has two formats for frame images:
 * 
 * Format 1 - Standard (most models):
 * { frameImages: [{ inputImage: "url", frame: "first" }] }
 * 
 * Format 2 - Inputs Wrapper (only 4 models):
 * { inputs: { frameImages: [{ image: "url", frame: "first" }] } }
 * 
 * Only these 4 models use the inputs wrapper format:
 * - Kling VIDEO 2.6 Pro
 * - Kling VIDEO O1
 * - Runway Gen-4 Turbo
 * - Alibaba Wan 2.6
 */
export function shouldUseInputsWrapper(modelAirId: string): boolean {
  const modelsRequiringInputsWrapper = [
    "klingai:kling-video@2.6-pro",  // Kling VIDEO 2.6 Pro
    "klingai:kling@o1",              // Kling VIDEO O1
    "runway:1@1",                    // Runway Gen-4 Turbo
    "alibaba:wan@2.6",               // Alibaba Wan 2.6
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
 * Check if model uses "image" property instead of "inputImage" in frameImages
 * 
 * Some models in the inputs wrapper format use "image" instead of "inputImage":
 * - Kling VIDEO 2.6 Pro
 * - Kling VIDEO O1
 * - Runway Gen-4 Turbo
 * 
 * Alibaba Wan uses "image" but in a different structure (no frame property)
 */
export function usesImageProperty(modelAirId: string): boolean {
  const modelsUsingImage = [
    "klingai:kling-video@2.6-pro",  // Kling VIDEO 2.6 Pro
    "klingai:kling@o1",              // Kling VIDEO O1
    "runway:1@1",                    // Runway Gen-4 Turbo
  ];
  return modelsUsingImage.includes(modelAirId);
}

/**
 * Build frameImages payload based on model's API format
 * 
 * Handles three formats:
 * 1. Standard: { frameImages: [{ inputImage: "url", frame: "first" }] }
 * 2. Inputs wrapper with image: { inputs: { frameImages: [{ image: "url", frame: "first" }] } }
 * 3. Alibaba Wan: { inputs: { frameImages: [{ image: "url" }] } }
 */
export function buildFrameImagesPayload(
  startFrameUrl: string,
  endFrameUrl: string | undefined,
  modelAirId: string,
  modelId: string
): Record<string, any> {
  const useInputsWrapper = shouldUseInputsWrapper(modelAirId);
  const useImageProp = usesImageProperty(modelAirId);
  const isAlibabaWan = modelAirId === "alibaba:wan@2.6";
  const supportsLast = supportsLastFrame(modelId);

  if (useInputsWrapper) {
    // Format 2: Inputs wrapper
    if (isAlibabaWan) {
      // Alibaba Wan: array of objects with { image: "url" } (no frame property)
      const frames: Array<{ image: string }> = [{ image: startFrameUrl }];
      if (endFrameUrl && supportsLast) {
        frames.push({ image: endFrameUrl });
      }
      return { inputs: { frameImages: frames } };
    } else if (useImageProp) {
      // Kling 2.6, O1, Runway: array of objects with { image: "url", frame: "first" }
      const frames: Array<{ image: string; frame: string }> = [
        { image: startFrameUrl, frame: "first" }
      ];
      if (endFrameUrl && supportsLast) {
        frames.push({ image: endFrameUrl, frame: "last" });
      }
      return { inputs: { frameImages: frames } };
    } else {
      // Should not happen, but handle gracefully
      const frames: Array<{ inputImage: string; frame: string }> = [
        { inputImage: startFrameUrl, frame: "first" }
      ];
      if (endFrameUrl && supportsLast) {
        frames.push({ inputImage: endFrameUrl, frame: "last" });
      }
      return { inputs: { frameImages: frames } };
    }
  } else {
    // Format 1: Standard (Seedance, KlingAI 2.1/2.5, PixVerse, Veo, Hailuo, Sora)
    const frames: Array<{ inputImage: string; frame: string }> = [
      { inputImage: startFrameUrl, frame: "first" }
    ];
    if (endFrameUrl && supportsLast) {
      frames.push({ inputImage: endFrameUrl, frame: "last" });
    }
    return { frameImages: frames };
  }
}

/**
 * Clamp duration to model's supported values
 * Returns the closest supported duration
 */
export function clampDuration(duration: number, modelId: string): number {
  const config = getModelConfig(modelId);
  if (!config) return duration;

  const durations = config.durations;
  if (durations.includes(duration)) {
    return duration;
  }

  // Find closest supported duration
  return durations.reduce((closest, current) => {
    return Math.abs(current - duration) < Math.abs(closest - duration)
      ? current
      : closest;
  });
}

/**
 * Get provider settings for a video model
 * Returns default provider settings from config with optional overrides for style preservation
 * 
 * @param modelId - The model ID (e.g., "seedance-1.5-pro")
 * @param hasFrameImages - Whether frame images are being used (for style preservation)
 * @returns Provider settings object or undefined
 */
export function getVideoModelProviderSettings(
  modelId: string,
  hasFrameImages: boolean = false
): Record<string, Record<string, any>> | undefined {
  const config = getModelConfig(modelId);
  if (!config?.providerSettings) {
    return undefined;
  }

  // Clone provider settings to avoid mutating config
  const providerSettings: Record<string, Record<string, any>> = {};
  
  for (const [provider, settings] of Object.entries(config.providerSettings)) {
    providerSettings[provider] = { ...settings };
    
    // Style preservation overrides
    if (hasFrameImages) {
      // Veo: Disable enhancePrompt when using frame images to preserve visual style
      if (provider === "google" && "enhancePrompt" in settings) {
        providerSettings[provider].enhancePrompt = false;
      }
      
      // Seedance: Enable cameraFixed when using frame images to maintain visual consistency
      if (provider === "bytedance" && "cameraFixed" in settings) {
        providerSettings[provider].cameraFixed = true;
      }
    }
  }

  return Object.keys(providerSettings).length > 0 ? providerSettings : undefined;
}

/**
 * Get provider settings to disable audio generation for video models
 * 
 * Some video models generate audio by default (Veo 3, Seedance 1.5, Kling 2.6, etc.)
 * This function returns provider settings that explicitly disable audio.
 * 
 * NOTE: Different providers use different parameter names for audio:
 * - Google Veo: generateAudio
 * - ByteDance Seedance 1.5: audio
 * - KlingAI 2.6 Pro: sound
 * - PixVerse: generateAudio
 * - Lightricks LTX-2: generateAudio
 * - Alibaba Wan: generateAudio
 * 
 * @param modelAirId - The Runware model AIR ID (e.g., "google:3@0")
 * @param modelId - The friendly model ID (e.g., "veo-3.0")
 * @returns Provider settings with audio disabled, or undefined if model doesn't support audio
 */
export function getProviderSettingsWithAudioDisabled(
  modelAirId: string,
  modelId: string
): Record<string, Record<string, any>> | undefined {
  const config = getModelConfig(modelId);
  
  // If model doesn't have audio, no need for provider settings to disable it
  if (!config?.hasAudio) {
    return undefined;
  }

  // Extract provider from AIR ID (e.g., "google:3@0" -> "google")
  const provider = modelAirId.split(":")[0];
  
  // Provider-specific settings to disable audio
  // Each provider uses different parameter names!
  switch (provider) {
    case "google":
      // Google Veo models: generateAudio controls audio generation
      return {
        google: {
          generateAudio: false,
        },
      };
    
    case "lightricks":
      // LTX-2 Pro: generateAudio controls audio generation
      return {
        lightricks: {
          generateAudio: false,
        },
      };
    
    case "bytedance":
      // Seedance 1.5 Pro: "audio" parameter (not generateAudio!)
      return {
        bytedance: {
          audio: false,
        },
      };
    
    case "pixverse":
      // PixVerse v5.5: generateAudio controls background music/sound effects/dialogue
      return {
        pixverse: {
          generateAudio: false,
        },
      };
    
    case "klingai":
      // Kling VIDEO 2.6 Pro: "sound" parameter (not generateAudio!)
      return {
        klingai: {
          sound: false,
        },
      };
    
    case "alibaba":
      // Alibaba Wan 2.6: generateAudio controls native audio
      return {
        alibaba: {
          generateAudio: false,
        },
      };
    
    case "minimax":
      // Hailuo 2.3: May have audio support
      return {
        minimax: {
          generateAudio: false,
        },
      };
    
    default:
      // Unknown provider - return undefined (no audio settings needed)
      return undefined;
  }
}

/**
 * Check if model should omit width/height dimensions in payload
 * 
 * Some models derive output dimensions from the input image and don't accept explicit dimensions:
 * - Kling VIDEO O1: Dimensions inferred from frame
 * 
 * Note: KlingAI 2.1 and 2.5 DO support explicit dimensions, they were incorrectly listed before
 */
export function shouldOmitDimensions(modelAirId: string): boolean {
  const modelsWithoutDimensions = [
    "klingai:kling@o1",  // Kling VIDEO O1: dimensions inferred from frame
  ];
  return modelsWithoutDimensions.includes(modelAirId);
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

