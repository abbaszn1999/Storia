// Before & After Template Configuration
// Structure: Before State → Transformation → After State → Results
// Duration: 30-90s
// ═══════════════════════════════════════════════════════════════════════════

// Import shared model configurations
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
} from '../../ai/config';

// ═══════════════════════════════════════════════════════════════════════════
// MODE-SPECIFIC CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const BEFORE_AFTER_CONFIG = {
  // Default Models
  defaultImageModel: 'nano-banana',
  defaultVideoModel: 'seedance-1.0-pro',
  
  // Default Settings
  defaultDuration: 60,
  defaultAspectRatio: '9:16',
  defaultImageResolution: '1344p',
  defaultVideoResolution: '1080p',
  
  // Structure
  minScenes: 4,  // Before, Transformation, After, Results
  maxScenes: 8,
};

// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORT SHARED CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

export {
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
};
