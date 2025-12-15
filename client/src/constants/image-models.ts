// Image Model Configurations for Frontend
// Synced with server/stories/shared/config/image-models.ts
// ═══════════════════════════════════════════════════════════════════════════

export interface ImageModelConfig {
  value: string;
  label: string;
  provider: string;
  description: string;
  aspectRatios: string[];
  resolutions: string[];
  maxPromptLength: number;
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
  default?: boolean;
  badge?: string;
}

export const IMAGE_MODELS: ImageModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Google Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "nano-banana",
    label: "Nano Banana",
    provider: "Google",
    description: "Gemini Flash 2.5 - Fast, interactive workflows",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "16:9", "9:16", "21:9"],
    resolutions: ["1k"],
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    default: true,
    badge: "Fast",
  },
  {
    value: "nano-banana-2-pro",
    label: "Nano Banana 2 Pro",
    provider: "Google",
    description: "Gemini 3 Pro - Professional-grade, up to 4K",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "9:16", "16:9", "21:9"],
    resolutions: ["1k", "2k", "4k"],
    maxPromptLength: 45000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Pro",
  },
  {
    value: "imagen-4.0-preview",
    label: "Imagen 4.0 Preview",
    provider: "Google",
    description: "Improved textures, lighting, and typography",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
  },
  {
    value: "imagen-4.0-ultra",
    label: "Imagen 4.0 Ultra",
    provider: "Google",
    description: "Exceptional detail, color accuracy, best quality",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Ultra",
  },
  {
    value: "imagen-4.0-fast",
    label: "Imagen 4.0 Fast",
    provider: "Google",
    description: "Speed optimized with minimal quality loss",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: true,
    badge: "Fast",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // ByteDance Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "seedream-4.0",
    label: "Seedream 4.0",
    provider: "ByteDance",
    description: "Ultra-fast 2K/4K with sequential images",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["1k", "2k", "4k"],
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Sequential",
  },
  {
    value: "seedream-4.5",
    label: "Seedream 4.5",
    provider: "ByteDance",
    description: "Production reliability, sharp 2K/4K",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["2k", "4k"],
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Reliable",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Black Forest Labs - FLUX.2 Series
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "flux-2-dev",
    label: "FLUX.2 [dev]",
    provider: "Black Forest Labs",
    description: "Open weights, full architectural control",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],
    maxPromptLength: 10000,
    supportsSeed: true,
    supportsNegativePrompt: false,
    badge: "Dev",
  },
  {
    value: "flux-2-pro",
    label: "FLUX.2 [pro]",
    provider: "Black Forest Labs",
    description: "Production-ready, robust editing",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Pro",
  },
  {
    value: "flux-2-flex",
    label: "FLUX.2 [flex]",
    provider: "Black Forest Labs",
    description: "Best text rendering, typography specialist",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Typography",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Other Providers
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "midjourney-v7",
    label: "Midjourney V7",
    provider: "Midjourney",
    description: "Cinematic realism, photographic quality",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    badge: "Cinematic",
  },
  {
    value: "ideogram-3.0",
    label: "Ideogram 3.0",
    provider: "Ideogram",
    description: "Sharp text, graphic design specialist",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "5:4", "4:5", "8:5", "5:8", "3:1", "1:3"],
    resolutions: ["custom"],
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: true,
    badge: "Design",
  },
];

/**
 * Get model config by value
 */
export function getImageModelConfig(value: string): ImageModelConfig | undefined {
  return IMAGE_MODELS.find(m => m.value === value);
}

/**
 * Get default image model
 */
export function getDefaultImageModel(): ImageModelConfig {
  return IMAGE_MODELS.find(m => m.default) || IMAGE_MODELS[0];
}

/**
 * Resolution labels for display
 */
export const RESOLUTION_LABELS: Record<string, string> = {
  "1k": "1K (~1024px)",
  "2k": "2K (~2048px)",
  "4k": "4K (~4096px)",
  "custom": "Custom",
};

