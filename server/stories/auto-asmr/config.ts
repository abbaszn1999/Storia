// Auto-ASMR Template Configuration
// Structure: Focus on satisfying visuals and sounds, relaxation-focused content
// Duration: 15-60s (typically longer for ASMR)
// ═══════════════════════════════════════════════════════════════════════════

// Import shared model configurations
import {
  IMAGE_MODEL_CONFIGS,
  VIDEO_MODEL_CONFIGS,
  getDefaultImageModel,
  getDefaultVideoModel,
  getImageDimensions,
  getImageModelConfig,
  getDimensions,
  getVideoModelConstraints,
  requiresMatchingDimensions,
  getVideoDimensionsForImageGeneration,
  type ImageModelConfig,
  type VideoModelConfig,
  type ImageDimensions,
  type VideoDimensions,
  type VideoModelConstraints,
} from '../../ai/config';

// ═══════════════════════════════════════════════════════════════════════════
// MODE-SPECIFIC CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const AUTO_ASMR_CONFIG = {
  // Default Models
  defaultImageModel: 'nano-banana',
  defaultVideoModel: 'seedance-1.0-pro',
  
  // Default Settings
  defaultDuration: 45,  // ASMR videos are typically longer for relaxation
  defaultAspectRatio: '9:16',
  defaultImageResolution: '1k',  // Nano Banana resolution tier
  defaultVideoResolution: '1080p',
  
  // Story Generation
  maxStoryLength: 300,  // ASMR content is typically minimal text
  minStoryLength: 20,
  
  // Scene Generation
  minSceneDuration: 2,  // ASMR scenes need more time for immersion
  maxSceneDuration: 15,  // Longer scenes for relaxation
  optimalSceneCount: 3,  // Simpler structure for ASMR
  
  // Image Generation
  imageNegativePrompt: 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text, busy, chaotic',
  consistencyStrategy: 'seed-based',  // Use seed for visual consistency
  
  // Voiceover
  defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL',  // ElevenLabs Rachel
  defaultLanguage: 'en',
};

// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORT SHARED CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Image Models
  IMAGE_MODEL_CONFIGS,
  getDefaultImageModel,
  getImageDimensions,
  getImageModelConfig,
  type ImageModelConfig,
  type ImageDimensions,
  
  // Video Models
  VIDEO_MODEL_CONFIGS,
  getDefaultVideoModel,
  getDimensions,
  getVideoModelConstraints,
  requiresMatchingDimensions,
  getVideoDimensionsForImageGeneration,
  type VideoModelConfig,
  type VideoDimensions,
  type VideoModelConstraints,
};
