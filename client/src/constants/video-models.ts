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
  default?: boolean;
  badge?: string;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // ByteDance Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "seedance-1.0-pro",
    label: "Seedance 1.0 Pro",
    provider: "ByteDance",
    description: "1.2-12s, 24 FPS, versatile aspect ratios",
    durations: [2, 4, 5, 6, 8, 10, 12],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
    resolutions: ["480p", "720p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
    default: true,
    badge: "Default",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "veo-3.0",
    label: "Google Veo 3.0",
    provider: "Google",
    description: "High quality, 4-8s, 24 FPS",
    durations: [4, 6, 8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
  },
  {
    value: "veo-3.1",
    label: "Google Veo 3.1",
    provider: "Google",
    description: "Cinematic quality, 4-8s, smooth motion",
    durations: [4, 6, 8],
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
    badge: "Cinematic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI
  // ─────────────────────────────────────────────────────────────────────────
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
    badge: "Turbo",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PixVerse
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "pixverse-v5.5",
    label: "PixVerse v5.5",
    provider: "PixVerse",
    description: "Versatile, 5-8s, multi-resolution",
    durations: [5, 8],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    resolutions: ["360p", "540p", "720p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "hailuo-2.3",
    label: "MiniMax Hailuo 2.3",
    provider: "MiniMax",
    description: "6-10s, optimized for 16:9 and 4:3",
    durations: [6, 10],
    aspectRatios: ["16:9", "4:3"],
    resolutions: ["768p", "1080p"],
    hasAudio: false,
    supportsFrameImages: true,
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
    badge: "Pro",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Lightricks
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "ltx-2-pro",
    label: "LTX-2 Pro",
    provider: "Lightricks",
    description: "Professional 4K, 6-10s, 25/50 FPS",
    durations: [6, 8, 10],
    aspectRatios: ["16:9"],
    resolutions: ["1080p", "1440p", "2160p"],
    hasAudio: false,
    supportsFrameImages: true,
    badge: "4K",
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
 * Resolution labels for display
 */
export const VIDEO_RESOLUTION_LABELS: Record<string, string> = {
  "360p": "360p",
  "480p": "480p",
  "540p": "540p",
  "720p": "720p (HD)",
  "768p": "768p",
  "1080p": "1080p (Full HD)",
  "1440p": "1440p (2K)",
  "2160p": "2160p (4K)",
};

