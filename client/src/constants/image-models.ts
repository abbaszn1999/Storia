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
  supportsStyleReference: boolean; // Whether model supports style reference images
  supportsCharacterReference: boolean; // Whether model supports character reference images
  maxReferenceImages: number; // Maximum number of reference images (0 = not supported)
  requiresReferenceImages?: boolean; // Whether reference images are REQUIRED (e.g., Runway Gen-4 Image Turbo)
  inputImageRequirements?: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    maxFileSize: string; // e.g., "20MB"
    aspectRatioRange?: { min: string; max: string }; // e.g., { min: "1:16", max: "16:1" }
  };
  default?: boolean;
  badge?: string;
}

export const IMAGE_MODELS: ImageModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "openai-gpt-image-1",
    label: "OpenAI GPT Image 1",
    provider: "OpenAI",
    description: "GPT-4o architecture, superior text rendering, up to 16 refs",
    aspectRatios: ["1:1", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 32000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 16,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "16 Refs",
  },
  {
    value: "openai-gpt-image-1.5",
    label: "OpenAI GPT Image 1.5",
    provider: "OpenAI",
    description: "Newest flagship, faster with precise edits, up to 16 refs",
    aspectRatios: ["1:1", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 32000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 16,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "New + Fast",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runway Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "runway-gen-4-image",
    label: "Runway Gen-4 Image",
    provider: "Runway",
    description: "High-fidelity, advanced stylistic control, up to 3 refs",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    resolutions: ["custom"],
    maxPromptLength: 1000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 3,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
  },
  {
    value: "runway-gen-4-image-turbo",
    label: "Runway Gen-4 Image Turbo",
    provider: "Runway",
    description: "Fast iterations, requires 1-3 reference images",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    resolutions: ["custom"],
    maxPromptLength: 1000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 3,
    requiresReferenceImages: true, // Reference images are REQUIRED for this model
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Turbo",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI Models
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: "kling-image-o1",
    label: "Kling IMAGE O1",
    provider: "KlingAI",
    description: "High-control character handling, up to 10 refs",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "9:16", "16:9", "21:9"],
    resolutions: ["1k", "2k"],
    maxPromptLength: 2500,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 10,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Character",
  },
  {
    value: "ideogram-3.0",
    label: "Ideogram 3.0",
    provider: "Ideogram",
    description: "Design-level generation, superior text rendering",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9", "9:21", "2:1", "1:2", "5:3", "3:5", "8:5", "5:8", "7:4", "4:7"],
    resolutions: ["custom"],
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: true,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 0, // Via providerSettings, not inputs.referenceImages
    inputImageRequirements: {
      minWidth: 512,
      maxWidth: 1536,
      minHeight: 512,
      maxHeight: 1536,
      maxFileSize: "20MB",
    },
    badge: "Design",
  },

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
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 8,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    default: true,
    badge: "Default",
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
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 14,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Pro",
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
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 14,
    inputImageRequirements: {
      minWidth: 300,
      maxWidth: 2048,
      minHeight: 300,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
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
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 14,
    inputImageRequirements: {
      minWidth: 14,
      maxWidth: 6000,
      minHeight: 14,
      maxHeight: 6000,
      maxFileSize: "10MB",
      aspectRatioRange: { min: "1:16", max: "16:1" },
    },
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
    maxPromptLength: 32000,
    supportsSeed: true,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 4,
    inputImageRequirements: {
      minWidth: 512,
      maxWidth: 2048,
      minHeight: 512,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Dev",
  },
  {
    value: "flux-2-pro",
    label: "FLUX.2 [pro]",
    provider: "Black Forest Labs",
    description: "Production-ready, robust editing",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 32000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 9,
    inputImageRequirements: {
      minWidth: 256,
      maxWidth: 2048,
      minHeight: 256,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Pro",
  },
  {
    value: "flux-2-flex",
    label: "FLUX.2 [flex]",
    provider: "Black Forest Labs",
    description: "Best text rendering, typography specialist",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 32000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 10,
    inputImageRequirements: {
      minWidth: 256,
      maxWidth: 2048,
      minHeight: 256,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Typography",
  },
  {
    value: "flux-2-max",
    label: "FLUX.2 [max]",
    provider: "Black Forest Labs",
    description: "Professional-grade, grounded generation",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],
    maxPromptLength: 32000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true,
    supportsCharacterReference: true,
    maxReferenceImages: 8,
    inputImageRequirements: {
      minWidth: 256,
      maxWidth: 2048,
      minHeight: 256,
      maxHeight: 2048,
      maxFileSize: "20MB",
    },
    badge: "Max",
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

