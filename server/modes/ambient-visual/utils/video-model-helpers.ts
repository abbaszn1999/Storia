/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO MODEL HELPERS - Agent 4.3 (Ambient Visual Mode)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Helper functions for video clip generation specific to the storyboard workflow.
 * These are NOT in the shared video-models.ts because they contain mode-specific logic.
 */

import { 
  VIDEO_MODEL_CONFIGS, 
  MODEL_DIMENSIONS,
  getDimensions,
  type VideoDimensions 
} from '../../../ai/config/video-models';

// ═══════════════════════════════════════════════════════════════════════════════
// FRAME IMAGE SUPPORT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if model supports start-end frame mode (both first AND last frame)
 * Required for Start-End Frame video animation mode
 */
export function supportsStartEndFrame(modelId: string): boolean {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  return config?.frameImageSupport?.first === true && 
         config?.frameImageSupport?.last === true;
}

/**
 * Check if model supports first frame only (for Image Reference mode)
 */
export function supportsFirstFrame(modelId: string): boolean {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  return config?.frameImageSupport?.first === true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the Runware AIR ID for a video model
 * Returns the modelAirId from config (e.g., "bytedance:2@1" for seedance-1.0-pro)
 */
export function getVideoModelAirId(modelId: string): string | undefined {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  return config?.modelAirId;
}

/**
 * Get video dimensions for a model, aspect ratio, and optional resolution
 * Prioritizes model-specific dimensions, then falls back to generic
 */
export function getVideoDimensions(
  modelId: string,
  aspectRatio: string,
  resolution?: string
): VideoDimensions {
  // Try model-specific dimensions first
  const modelDims = MODEL_DIMENSIONS[modelId]?.[aspectRatio];
  if (modelDims) {
    // If resolution specified and exists, use it
    if (resolution && modelDims[resolution]) {
      return modelDims[resolution];
    }
    // Otherwise use first available resolution for this aspect ratio
    const firstRes = Object.keys(modelDims)[0];
    if (firstRes) {
      return modelDims[firstRes];
    }
  }
  
  // Fall back to generic dimensions
  return getDimensions(aspectRatio, resolution || "720p", modelId);
}

/**
 * Get the duration range for a video model
 */
export function getModelDurationRange(modelId: string): { min: number; max: number; durations: number[] } {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) {
    return { min: 5, max: 10, durations: [5, 10] };
  }
  
  return {
    min: Math.min(...config.durations),
    max: Math.max(...config.durations),
    durations: config.durations,
  };
}

/**
 * Clamp duration to model's supported values
 * Returns the closest supported duration
 */
export function clampDuration(duration: number, modelId: string): number {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) return duration;
  
  const durations = config.durations;
  
  // Find closest supported duration
  return durations.reduce((closest, current) => {
    return Math.abs(current - duration) < Math.abs(closest - duration)
      ? current
      : closest;
  });
}

/**
 * Get provider settings for a video model
 * Returns default provider settings from config
 */
export function getVideoModelProviderSettings(modelId: string): Record<string, any> | undefined {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  return config?.providerSettings;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if model uses "inputs" wrapper format for frameImages
 * 
 * Runware API has two formats for frame images:
 * 
 * Format 1 - Standard (most models):
 * { frameImages: [{ inputImage: "url", frame: "first" }] }
 * 
 * Format 2 - Inputs Wrapper (Kling 2.6, O1, Runway, Alibaba):
 * { inputs: { frameImages: [{ image: "url", frame: "first" }] } }
 * 
 * This information is derived from the Runware API documentation.
 * Models using inputs-wrapper format have different payload structures.
 */
export function usesInputsWrapperFormat(modelId: string): boolean {
  // These models use the nested inputs.frameImages format based on Runware API docs
  // Check providerSettings to determine format - models with specific provider keys use wrapper
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) return false;
  
  // Models that use inputs wrapper format (from Runware documentation)
  // This is determined by the API structure, not a config property
  const inputsWrapperModels = new Set([
    "kling-video-2.6-pro",
    "kling-video-o1", 
    "runway-gen4-turbo",
    "alibaba-wan-2.6",
  ]);
  
  return inputsWrapperModels.has(modelId);
}

/**
 * Build frameImages payload based on model's API format
 */
export function buildFrameImagesPayload(
  startFrameUrl: string,
  endFrameUrl: string | undefined,
  modelId: string
): Record<string, any> {
  const useInputsWrapper = usesInputsWrapperFormat(modelId);
  
  if (useInputsWrapper) {
    // Format 2: Inputs wrapper (Kling 2.6 Pro, Kling O1, Runway, Alibaba Wan)
    const frames: Array<{ image: string; frame: string }> = [
      { image: startFrameUrl, frame: "first" }
    ];
    if (endFrameUrl) {
      frames.push({ image: endFrameUrl, frame: "last" });
    }
    return { inputs: { frameImages: frames } };
  } else {
    // Format 1: Standard (Seedance, KlingAI 2.1/2.5, PixVerse, Veo, Hailuo)
    const frames: Array<{ inputImage: string; frame: string }> = [
      { inputImage: startFrameUrl, frame: "first" }
    ];
    if (endFrameUrl) {
      frames.push({ inputImage: endFrameUrl, frame: "last" });
    }
    return { frameImages: frames };
  }
}

