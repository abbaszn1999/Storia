// Shared Video Model Configurations
// Used across all story modes (ASMR, Problem-Solution, Before-After, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface VideoModelConfig {
  id: string;
  label: string;
  durations: number[];
  aspectRatios: string[];
  resolutions: string[];
  hasAudio: boolean;
  supportsFrameImages: boolean;
  default?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supported video models with their capabilities
 * Each model has different supported durations, resolutions, and features
 */
export const VIDEO_MODEL_CONFIGS: Record<string, VideoModelConfig> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Seedance 1.0 Pro (Default) - ByteDance
  // Duration: 1.2-12 seconds | FPS: 24 | Prompt: 2-3000 chars
  // ─────────────────────────────────────────────────────────────────────────
  "seedance-1.0-pro": {
    id: "seedance-1.0-pro",
    label: "Seedance 1.0 Pro",
    durations: [2, 4, 5, 6, 8, 10, 12],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
    resolutions: ["480p", "720p", "1080p"],
    hasAudio: false,
    default: true,
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI 2.5 Turbo Pro
  // Model AIR ID: klingai:6@1 | Prompt: 2-2500 chars | 30 FPS
  // Dimensions: 1280×720, 720×720, 720×1280 (720p only)
  // Supports first AND last frame for frameImages
  // ─────────────────────────────────────────────────────────────────────────
  "klingai-2.5-turbo-pro": {
    id: "klingai-2.5-turbo-pro",
    label: "KlingAI 2.5 Turbo Pro",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["720p"],  // Only 720p supported
    hasAudio: false,
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.0 (Has Native Audio - generateAudio)
  // Model AIR ID: google:3@0 | Duration: 4, 6, 8s | FPS: 24 | Prompt: 2-3000 chars
  // Native audio: dialogue, music, sound effects | enhancePrompt always ON
  // Image input: 300-2048px, 20MB max
  // ─────────────────────────────────────────────────────────────────────────
  "veo-3.0": {
    id: "veo-3.0",
    label: "Google Veo 3.0",
    durations: [4, 6, 8],                    // 4, 6, or 8 seconds
    aspectRatios: ["16:9", "9:16"],          // Only these two
    resolutions: ["720p", "1080p"],          // 1280x720, 1920x1080, 720x1280, 1080x1920
    hasAudio: true,                          // Native audio via providerSettings.google.generateAudio
    supportsFrameImages: true,               // Supports first frame only
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PixVerse v5.5 (Has Native Audio)
  // Model AIR ID: pixverse:1@6 | Prompt: 2-2048 chars
  // Duration: 5, 8s (10s unavailable at 1080p)
  // Supports first AND last frame for frameImages
  // ─────────────────────────────────────────────────────────────────────────
  "pixverse-v5.5": {
    id: "pixverse-v5.5",
    label: "PixVerse v5.5",
    durations: [5, 8],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    resolutions: ["360p", "540p", "720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax Hailuo 2.3
  // Dimensions: 4:3 @ 768p (1024×768), 16:9 @ 1080p (1920×1080)
  // ─────────────────────────────────────────────────────────────────────────
  "hailuo-2.3": {
    id: "hailuo-2.3",
    label: "MiniMax Hailuo 2.3",
    durations: [6, 10],
    aspectRatios: ["16:9", "4:3"],
    resolutions: ["768p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI Sora 2 Pro
  // Model AIR ID: openai:3@2 | Prompt: 1-4000 chars
  // Higher quality, professional use cases
  // Supports first frame for I2V
  // ─────────────────────────────────────────────────────────────────────────
  "sora-2-pro": {
    id: "sora-2-pro",
    label: "Sora 2 Pro",
    durations: [4, 8, 12],
    aspectRatios: ["16:9", "9:16", "7:4", "4:7"],
    resolutions: ["720p"],  // Based on 1280×720 and 720×1280
    hasAudio: false,
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.1 (Has Native Audio - Natural Sound)
  // Model AIR ID: google:3@2 | Prompt: 2-3000 chars | 24 FPS
  // Cinematic, story-driven with natural sound and smooth motion
  // Supports first AND last frame + reference images (asset/style)
  // ─────────────────────────────────────────────────────────────────────────
  "veo-3.1": {
    id: "veo-3.1",
    label: "Google Veo 3.1",
    durations: [4, 6, 8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,  // Natural sound
    supportsFrameImages: true,  // First AND last frame
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LTX-2 Pro (Lightricks) - Professional Cinematic
  // Model AIR ID: lightricks:2@0 | Prompt: 2-10000 chars | 25/50 FPS
  // Realistic motion, precise lighting control
  // Supports up to 4K (2160p) | Only 16:9 aspect ratio
  // ─────────────────────────────────────────────────────────────────────────
  "ltx-2-pro": {
    id: "ltx-2-pro",
    label: "LTX-2 Pro",
    durations: [6, 8, 10],
    aspectRatios: ["16:9"],  // Only 16:9
    resolutions: ["1080p", "1440p", "2160p"],  // Up to 4K
    hasAudio: true,  // via providerSettings.generateAudio
    supportsFrameImages: true,  // First frame only
  },
};

/**
 * Get the default video model
 */
export function getDefaultVideoModel(): VideoModelConfig {
  const defaultModel = Object.values(VIDEO_MODEL_CONFIGS).find((m) => m.default);
  return defaultModel || VIDEO_MODEL_CONFIGS["seedance-1.0-pro"];
}

/**
 * Get all available video models as array
 */
export function getAvailableVideoModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODEL_CONFIGS);
}

// ═══════════════════════════════════════════════════════════════════════════
// DIMENSION MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map aspect ratio + resolution to actual pixel dimensions
 * NOTE: These are STANDARD dimensions used by most models (PixVerse, Veo, Kling, etc.)
 * Model-specific dimensions (like Seedance's non-standard) are in MODEL_DIMENSIONS
 */
export const DIMENSION_MAP: Record<string, Record<string, VideoDimensions>> = {
  "16:9": {
    "360p": { width: 640, height: 360 },
    "540p": { width: 960, height: 540 },
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
  },
  "9:16": {
    "360p": { width: 360, height: 640 },
    "540p": { width: 540, height: 960 },
    "720p": { width: 720, height: 1280 },
    "1080p": { width: 1080, height: 1920 },
  },
  "1:1": {
    "360p": { width: 360, height: 360 },
    "540p": { width: 540, height: 540 },
    "720p": { width: 720, height: 720 },
    "1080p": { width: 1080, height: 1080 },
  },
  "4:3": {
    "360p": { width: 480, height: 360 },
    "540p": { width: 720, height: 540 },
    "720p": { width: 960, height: 720 },
    "1080p": { width: 1440, height: 1080 },
  },
  "3:4": {
    "360p": { width: 360, height: 480 },
    "540p": { width: 540, height: 720 },
    "720p": { width: 720, height: 960 },
    "1080p": { width: 1080, height: 1440 },
  },
};

/**
 * Model-specific dimension mappings
 * Each model has different supported dimensions from Runware API
 */
export const MODEL_DIMENSIONS: Record<string, Record<string, Record<string, VideoDimensions>>> = {
  // Seedance 1.0 Pro - ByteDance (official dimensions from Runware)
  "seedance-1.0-pro": {
    "16:9": {
      "480p": { width: 864, height: 480 },
      "720p": { width: 1248, height: 704 },
      "1080p": { width: 1920, height: 1088 },
    },
    "9:16": {
      "480p": { width: 480, height: 864 },
      "720p": { width: 704, height: 1248 },
      "1080p": { width: 1088, height: 1920 },
    },
    "1:1": {
      "480p": { width: 640, height: 640 },
      "720p": { width: 960, height: 960 },
      "1080p": { width: 1440, height: 1440 },
    },
    "4:3": {
      "480p": { width: 736, height: 544 },
      "720p": { width: 1120, height: 832 },
      "1080p": { width: 1664, height: 1248 },
    },
    "3:4": {
      "480p": { width: 544, height: 736 },
      "720p": { width: 832, height: 1120 },
      "1080p": { width: 1248, height: 1664 },
    },
    "21:9": {
      "480p": { width: 960, height: 416 },
      "720p": { width: 1568, height: 672 },
      "1080p": { width: 2176, height: 928 },
    },
    "9:21": {
      "480p": { width: 416, height: 960 },
      "720p": { width: 672, height: 1568 },
      "1080p": { width: 928, height: 2176 },
    },
  },
  // PixVerse v5.5 - Standard dimensions
  "pixverse-v5.5": {
    "16:9": {
      "360p": { width: 640, height: 360 },
      "540p": { width: 960, height: 540 },
      "720p": { width: 1280, height: 720 },
      "1080p": { width: 1920, height: 1080 },
    },
    "9:16": {
      "360p": { width: 360, height: 640 },
      "540p": { width: 540, height: 960 },
      "720p": { width: 720, height: 1280 },
      "1080p": { width: 1080, height: 1920 },
    },
    "1:1": {
      "360p": { width: 360, height: 360 },
      "540p": { width: 540, height: 540 },
      "720p": { width: 720, height: 720 },
      "1080p": { width: 1080, height: 1080 },
    },
    "4:3": {
      "360p": { width: 480, height: 360 },
      "540p": { width: 720, height: 540 },
      "720p": { width: 960, height: 720 },
      "1080p": { width: 1440, height: 1080 },
    },
    "3:4": {
      "360p": { width: 360, height: 480 },
      "540p": { width: 540, height: 720 },
      "720p": { width: 720, height: 960 },
      "1080p": { width: 1080, height: 1440 },
    },
  },
  // Google Veo 3.0 - Official dimensions from Runware docs
  // Only 16:9 and 9:16 supported at 720p and 1080p
  "veo-3.0": {
    "16:9": {
      "720p": { width: 1280, height: 720 },
      "1080p": { width: 1920, height: 1080 },
    },
    "9:16": {
      "720p": { width: 720, height: 1280 },
      "1080p": { width: 1080, height: 1920 },
    },
  },
  // KlingAI 2.5 Turbo Pro - Only 720p supported
  "klingai-2.5-turbo-pro": {
    "16:9": {
      "720p": { width: 1280, height: 720 },
    },
    "1:1": {
      "720p": { width: 720, height: 720 },
    },
    "9:16": {
      "720p": { width: 720, height: 1280 },
    },
  },
  // MiniMax Hailuo 2.3 - Official dimensions
  "hailuo-2.3": {
    "16:9": {
      "1080p": { width: 1920, height: 1080 },
    },
    "4:3": {
      "768p": { width: 1024, height: 768 },
    },
  },
  // Sora 2 Pro - OpenAI (special dimensions for 7:4 and 4:7)
  "sora-2-pro": {
    "16:9": {
      "720p": { width: 1280, height: 720 },
    },
    "9:16": {
      "720p": { width: 720, height: 1280 },
    },
    "7:4": {
      "720p": { width: 1792, height: 1024 },
    },
    "4:7": {
      "720p": { width: 1024, height: 1792 },
    },
  },
  // Google Veo 3.1 - Standard dimensions
  "veo-3.1": {
    "16:9": {
      "720p": { width: 1280, height: 720 },
      "1080p": { width: 1920, height: 1080 },
    },
    "9:16": {
      "720p": { width: 720, height: 1280 },
      "1080p": { width: 1080, height: 1920 },
    },
  },
  // LTX-2 Pro - Lightricks (16:9 only, up to 4K)
  "ltx-2-pro": {
    "16:9": {
      "1080p": { width: 1920, height: 1080 },
      "1440p": { width: 2560, height: 1440 },
      "2160p": { width: 3840, height: 2160 },
    },
  },
};

/**
 * Get dimensions for aspect ratio, resolution, and optionally model
 */
export function getDimensions(
  aspectRatio: string,
  resolution: string,
  modelId?: string
): VideoDimensions {
  // Try model-specific dimensions first
  if (modelId && MODEL_DIMENSIONS[modelId]) {
    const modelDims = MODEL_DIMENSIONS[modelId][aspectRatio]?.[resolution];
    if (modelDims) return modelDims;
  }
  
  // Fall back to generic dimensions
  return (
    DIMENSION_MAP[aspectRatio]?.[resolution] || { width: 1248, height: 704 }
  );
}

