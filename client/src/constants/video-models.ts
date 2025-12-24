// Video Model Configurations for Frontend
// Synced with server/stories/shared/config/video-models.ts
// ═══════════════════════════════════════════════════════════════════════════

export interface VideoModelConfig {
  value: string;
  label: string;
  provider: string;
  description: string;
  durations: number[];
  aspectRatios: string[];
  resolutions: string[];
  hasAudio: boolean;
  supportsFrameImages: boolean;
  frameImageSupport?: {
    first: boolean;
    last: boolean;
  };
  default?: boolean;
  badge?: string;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // ByteDance Models (2)
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "seedance-1.0-pro",
    label: "Seedance 1.0 Pro",
    provider: "ByteDance",
    description: "2-12s, 24 FPS, versatile aspect ratios",
    durations: [2, 4, 5, 6, 8, 10, 12],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
    resolutions: ["480p", "720p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    default: true,
    badge: "Default",
  },
  {
    value: "seedance-1.5-pro",
    label: "Seedance 1.5 Pro",
    provider: "ByteDance",
    description: "4-12s, native audio, 24 FPS",
    durations: [4, 5, 6, 8, 10, 12],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    resolutions: ["480p", "720p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Audio",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "klingai-2.1-pro",
    label: "KlingAI 2.1 Pro",
    provider: "KlingAI",
    description: "Full HD 1080p, I2V only, 24 FPS",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["1080p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "I2V Only",
  },
  {
    value: "klingai-2.5-turbo-pro",
    label: "KlingAI 2.5 Turbo Pro",
    provider: "KlingAI",
    description: "Fast turbo mode, 5-10s, 30 FPS",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["720p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Turbo",
  },
  {
    value: "kling-video-2.6-pro",
    label: "Kling VIDEO 2.6 Pro",
    provider: "KlingAI",
    description: "Native audio, 1080p, 30 FPS",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
    badge: "Audio",
  },
  {
    value: "kling-video-o1",
    label: "Kling VIDEO O1",
    provider: "KlingAI",
    description: "Multimodal foundation, 3-10s, 30 FPS",
    durations: [3, 5, 7, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["1080p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Multimodal",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "veo-3.0",
    label: "Google Veo 3.0",
    provider: "Google",
    description: "Native audio, 8s, 24 FPS",
    durations: [8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
    badge: "Audio",
  },
  {
    value: "veo-3-fast",
    label: "Google Veo 3 Fast",
    provider: "Google",
    description: "Fast & affordable, native audio, 8s",
    durations: [8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Fast + Audio",
  },
  {
    value: "veo-3.1",
    label: "Google Veo 3.1",
    provider: "Google",
    description: "Cinematic, natural sound, 8s",
    durations: [8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Audio",
  },
  {
    value: "veo-3.1-fast",
    label: "Google Veo 3.1 Fast",
    provider: "Google",
    description: "Ultra-low latency, natural sound, 8s",
    durations: [8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Fast + Audio",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PixVerse
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "pixverse-v5.5",
    label: "PixVerse v5.5",
    provider: "PixVerse",
    description: "Native audio, 5-10s, multi-resolution",
    durations: [5, 8, 10],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    resolutions: ["360p", "540p", "720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: true,
    },
    badge: "Audio",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "hailuo-2.3",
    label: "MiniMax Hailuo 2.3",
    provider: "MiniMax",
    description: "Cinematic storytelling, 6-10s, 25 FPS",
    durations: [6, 10],
    aspectRatios: ["16:9"],
    resolutions: ["768p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "sora-2-pro",
    label: "Sora 2 Pro",
    provider: "OpenAI",
    description: "Professional quality, 4-12s, unique ratios",
    durations: [4, 8, 12],
    aspectRatios: ["16:9", "9:16", "7:4", "4:7"],
    resolutions: ["720p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
    badge: "Pro",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Lightricks
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "ltx-2-pro",
    label: "LTX-2 Pro",
    provider: "Lightricks",
    description: "Professional 4K, native audio, 6-10s",
    durations: [6, 8, 10],
    aspectRatios: ["16:9"],
    resolutions: ["1080p", "1440p", "2160p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
    badge: "4K + Audio",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runway
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "runway-gen4-turbo",
    label: "Runway Gen-4 Turbo",
    provider: "Runway",
    description: "High-speed I2V, 2-10s, 24 FPS",
    durations: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    aspectRatios: ["16:9", "9:16", "1:1", "21:9", "4:3"],
    resolutions: ["720p", "832p", "960p"],
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
    badge: "I2V Only",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Alibaba
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "alibaba-wan-2.6",
    label: "Alibaba Wan 2.6",
    provider: "Alibaba",
    description: "Multimodal, native audio, 5-15s",
    durations: [5, 10, 15],
    aspectRatios: ["16:9", "9:16", "1:1", "17:13", "13:17"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,
      last: false,
    },
    badge: "Audio",
  },
];

/**
 * Get model config by value
 */
export function getVideoModelConfig(value: string): VideoModelConfig | undefined {
  return VIDEO_MODELS.find(m => m.value === value);
}

/**
 * Get default video model
 */
export function getDefaultVideoModel(): VideoModelConfig {
  return VIDEO_MODELS.find(m => m.default) || VIDEO_MODELS[0];
}

/**
 * Get available video models filtered by video generation mode
 * @param videoGenerationMode - 'image-reference' | 'start-end-frame' | undefined
 * @returns Filtered list of compatible models
 */
export function getAvailableVideoModels(
  videoGenerationMode?: 'image-reference' | 'start-end-frame'
): VideoModelConfig[] {
  if (!videoGenerationMode) {
    return VIDEO_MODELS; // Return all if mode not specified
  }

  if (videoGenerationMode === 'image-reference') {
    // Image-reference only needs first frame support - all models work
    return VIDEO_MODELS.filter(m => m.frameImageSupport?.first !== false);
  }

  if (videoGenerationMode === 'start-end-frame') {
    // Start-end frame needs BOTH first AND last frame support
    return VIDEO_MODELS.filter(
      m => m.frameImageSupport?.first === true && m.frameImageSupport?.last === true
    );
  }

  return VIDEO_MODELS;
}

/**
 * Check if a model is compatible with the video generation mode
 */
export function isModelCompatible(
  modelValue: string,
  videoGenerationMode?: 'image-reference' | 'start-end-frame'
): boolean {
  const model = getVideoModelConfig(modelValue);
  if (!model) return false;
  
  if (!videoGenerationMode) return true;
  
  if (videoGenerationMode === 'image-reference') {
    return model.frameImageSupport?.first !== false;
  }
  
  if (videoGenerationMode === 'start-end-frame') {
    return model.frameImageSupport?.first === true && model.frameImageSupport?.last === true;
  }
  
  return true;
}

/**
 * Resolution labels for display
 */
export const VIDEO_RESOLUTION_LABELS: Record<string, string> = {
  "360p": "360p",
  "480p": "480p",
  "540p": "540p",
  "720p": "720p (HD)",
  "768p": "768p",
  "832p": "832p",
  "960p": "960p",
  "1080p": "1080p (Full HD)",
  "1440p": "1440p (2K)",
  "2160p": "2160p (4K)",
};

