// Tease & Reveal Template Configuration
// Structure: Hook → Tease → Buildup → Reveal
// Duration: 15-45s
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
} from '../shared/config';

// ═══════════════════════════════════════════════════════════════════════════
// MODE-SPECIFIC CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const TEASE_REVEAL_CONFIG = {
  // Default Models
  defaultImageModel: 'nano-banana',
  defaultVideoModel: 'seedance-1.0-pro',
  
  // Default Settings
  defaultDuration: 30,
  defaultAspectRatio: '9:16',
  defaultImageResolution: '1344p',
  defaultVideoResolution: '1080p',
  
  // Structure
  minScenes: 4,  // Hook, Tease, Buildup, Reveal
  maxScenes: 5,
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
