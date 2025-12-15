// Myth-Busting Template Configuration
// Structure: Common Myth → Why It's Wrong → The Truth → Takeaway
// Duration: 30-60s
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

export const MYTH_BUSTING_CONFIG = {
  // Default Models
  defaultImageModel: 'nano-banana',
  defaultVideoModel: 'seedance-1.0-pro',
  
  // Default Settings
  defaultDuration: 45,
  defaultAspectRatio: '9:16',
  defaultImageResolution: '1344p',
  defaultVideoResolution: '1080p',
  
  // Structure
  minScenes: 4,  // Myth, Why Wrong, Truth, Takeaway
  maxScenes: 6,
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
