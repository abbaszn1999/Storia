// Problem-Solution Mode Configuration
// Imports shared model configs and defines mode-specific settings
// ═══════════════════════════════════════════════════════════════════════════

import {
  IMAGE_MODEL_CONFIGS,
  VIDEO_MODEL_CONFIGS,
  getDefaultImageModel,
  getDefaultVideoModel,
  getImageDimensions,
  getDimensions,
  type ImageModelConfig,
  type VideoModelConfig,
  type ImageDimensions,
  type VideoDimensions,
} from '../shared/config';

// ═══════════════════════════════════════════════════════════════════════════
// MODE-SPECIFIC CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const PROBLEM_SOLUTION_CONFIG = {
  // Default Models
  defaultImageModel: 'nano-banana',
  defaultVideoModel: 'seedance-1.0-pro',
  
  // Default Settings
  defaultDuration: 30,
  defaultAspectRatio: '9:16',
  defaultImageResolution: '1k',  // Nano Banana resolution tier
  defaultVideoResolution: '1080p',
  
  // Story Generation
  maxStoryLength: 500,  // words
  minStoryLength: 50,
  
  // Scene Generation
  minSceneDuration: 1,
  maxSceneDuration: 10,
  optimalSceneCount: 3,
  
  // Image Generation
  imageNegativePrompt: 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text',
  consistencyStrategy: 'seed-based',  // Use seed for character consistency
  
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
  type ImageModelConfig,
  type ImageDimensions,
  
  // Video Models
  VIDEO_MODEL_CONFIGS,
  getDefaultVideoModel,
  getDimensions,
  type VideoModelConfig,
  type VideoDimensions,
};
