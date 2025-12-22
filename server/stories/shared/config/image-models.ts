// Shared Image Model Configurations
// Used across all story modes (ASMR, Problem-Solution, Before-After, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageModelConfig {
  id: string;
  label: string;
  provider: 'runware' | 'openai' | 'stability';
  model: string;
  aspectRatios: string[];
  resolutions: string[];
  maxPromptLength: number;
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
  supportsStyleReference: boolean; // Whether model supports seedImage for style transfer
  default?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supported image models with their capabilities
 */
export const IMAGE_MODEL_CONFIGS: Record<string, ImageModelConfig> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Nano Banana (Gemini Flash Image 2.5) - Google DeepMind
  // Model AIR ID: google:4@1
  // Fast, interactive image workflows with sophisticated editing capabilities
  // Supports: Text-to-image, image-to-image (up to 8 reference images)
  // Includes invisible SynthID digital watermark
  // ─────────────────────────────────────────────────────────────────────────
  "nano-banana": {
    id: "nano-banana",
    label: "Nano Banana (Gemini Flash 2.5)",
    provider: "runware",
    model: "google:4@1",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "16:9", "9:16", "21:9"],
    resolutions: ["1k"],  // Single resolution tier
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: false, // Google models don't support seedImage in Runware
    default: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Nano Banana 2 Pro (Gemini 3 Pro Image Preview) - Google DeepMind
  // Model AIR ID: google:4@2
  // Professional-grade controls with advanced reasoning capabilities
  // Supports: Text-to-image, image-to-image (up to 14 reference images)
  // Enhanced: Lighting control, camera angles, high-res up to 4K, text rendering
  // Includes invisible SynthID digital watermark
  // ─────────────────────────────────────────────────────────────────────────
  "nano-banana-2-pro": {
    id: "nano-banana-2-pro",
    label: "Nano Banana 2 Pro (Gemini 3 Pro)",
    provider: "runware",
    model: "google:4@2",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "9:16", "16:9", "21:9"],
    resolutions: ["1k", "2k", "4k"],  // Three resolution tiers
    maxPromptLength: 45000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: false, // Google models don't support seedImage in Runware
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Midjourney V7
  // Model AIR ID: midjourney:3@1
  // Next-generation emphasizing realism and control
  // Grand, cinematic imagery with fluid brushwork and atmospheric tone
  // Supports: Text-to-image, image-to-image (1 reference image)
  // Features: Visual realism, texture fidelity, lighting, natural-language understanding
  // Provider settings: quality, stylize, chaos, weird, niji
  // ─────────────────────────────────────────────────────────────────────────
  "midjourney-v7": {
    id: "midjourney-v7",
    label: "Midjourney V7",
    provider: "runware",
    model: "midjourney:3@1",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (1 reference image)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Ideogram 3.0
  // Model AIR ID: ideogram:4@1
  // Design-level generation with sharper text rendering and better composition
  // Perfect for graphic-driven content with stylistic control
  // Supports: Text-to-image only
  // Provider settings: renderingSpeed, magicPrompt, styleType, stylePreset
  // ─────────────────────────────────────────────────────────────────────────
  "ideogram-3.0": {
    id: "ideogram-3.0",
    label: "Ideogram 3.0",
    provider: "runware",
    model: "ideogram:4@1",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "5:4", "4:5", "8:5", "5:8", "3:1", "1:3"],
    resolutions: ["custom"],  // Many fixed dimensions per aspect ratio
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: true,
    supportsStyleReference: false, // Text-to-image only
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Imagen 4.0 Preview - Google
  // Model AIR ID: google:2@1
  // Improved textures, lighting, and typography
  // Perfect for design-heavy or detail-focused work
  // Supports: Text-to-image only
  // ─────────────────────────────────────────────────────────────────────────
  "imagen-4.0-preview": {
    id: "imagen-4.0-preview",
    label: "Imagen 4.0 Preview",
    provider: "runware",
    model: "google:2@1",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: false, // Text-to-image only
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Imagen 4.0 Ultra - Google
  // Model AIR ID: google:2@2
  // Google's most advanced image model
  // Exceptional detail, color accuracy, and prompt adherence
  // Ideal for demanding use cases where quality and consistency matter most
  // Supports: Text-to-image only
  // ─────────────────────────────────────────────────────────────────────────
  "imagen-4.0-ultra": {
    id: "imagen-4.0-ultra",
    label: "Imagen 4.0 Ultra",
    provider: "runware",
    model: "google:2@2",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: false, // Text-to-image only
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Imagen 4.0 Fast - Google
  // Model AIR ID: google:2@3
  // Speed and quality optimized for quicker inference
  // Minimal quality loss with fast generation
  // Supports: Text-to-image only (with negative prompt support)
  // ─────────────────────────────────────────────────────────────────────────
  "imagen-4.0-fast": {
    id: "imagen-4.0-fast",
    label: "Imagen 4.0 Fast",
    provider: "runware",
    model: "google:2@3",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: true,
    supportsStyleReference: false, // Text-to-image only
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Seedream 4.0 - ByteDance
  // Model AIR ID: bytedance:5@0
  // Ultra-fast 2K/4K rendering with sequential image capabilities
  // Maintains character consistency across multiple outputs
  // Perfect for storyboard creation and professional design workflows
  // Supports: Text-to-image, image-to-image (up to 14 reference images)
  // Provider settings: maxSequentialImages (generates related sequential images)
  // ─────────────────────────────────────────────────────────────────────────
  "seedream-4.0": {
    id: "seedream-4.0",
    label: "Seedream 4.0",
    provider: "runware",
    model: "bytedance:5@0",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["1k", "2k", "4k"],  // Three resolution tiers
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 14 reference images)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Seedream 4.5 - ByteDance
  // Model AIR ID: bytedance:seedream@4.5
  // Production reliability focused: Fixed distant face distortion & text rendering
  // Sharp 2K/4K images suitable for professional work
  // Better multi-image fusion with consistent output
  // Supports: Text-to-image, image-to-image (up to 14 reference images)
  // Provider settings: maxSequentialImages, optimizePromptMode
  // Min: 2560×1440 pixels, Max: 4096×4096 pixels, Aspect ratio: 1:16 to 16:1
  // ─────────────────────────────────────────────────────────────────────────
  "seedream-4.5": {
    id: "seedream-4.5",
    label: "Seedream 4.5",
    provider: "runware",
    model: "bytedance:seedream@4.5",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["2k", "4k"],  // 2K and 4K only (minimum 2560×1440)
    maxPromptLength: 2000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 14 reference images)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [dev] - Black Forest Labs
  // Model AIR ID: runware:400@1
  // Open weights release with full architectural control
  // Perfect for developers needing custom pipelines and advanced workflows
  // Supports: Text-to-image, reference-to-image (up to 4 reference images)
  // Flexible dimensions: 512-2048px (multiples of 16)
  // Provider settings: CFGScale (1-20), steps (1-50), acceleration
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-dev": {
    id: "flux-2-dev",
    label: "FLUX.2 [dev]",
    provider: "runware",
    model: "runware:400@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],  // Flexible: 512-2048px (multiples of 16)
    maxPromptLength: 10000,
    supportsSeed: true,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 4 reference images)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [pro] - Black Forest Labs
  // Model AIR ID: bfl:5@1
  // Production-ready with robust reference-image editing
  // Built for reliability and speed in high-volume workflows
  // Supports: Text-to-image, reference-to-image (up to 9 reference images)
  // Flexible dimensions: 256-1920px (multiples of 16)
  // Total input capacity: 9 megapixels
  // Provider settings: promptUpsampling, safetyTolerance
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-pro": {
    id: "flux-2-pro",
    label: "FLUX.2 [pro]",
    provider: "runware",
    model: "bfl:5@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],  // Flexible: 256-1920px (multiples of 16)
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 9 reference images)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [flex] - Black Forest Labs
  // Model AIR ID: bfl:6@1
  // Strongest text rendering accuracy in FLUX family
  // Fine-grained control over composition and layout
  // Perfect for branded design, posters, and typography-driven work
  // Maintains character and product consistency across multiple references
  // Supports: Text-to-image, reference-to-image (up to 10 reference images)
  // Flexible dimensions: 256-1920px (multiples of 16)
  // Total input capacity: 14 megapixels
  // Provider settings: promptUpsampling, safetyTolerance, CFGScale, steps
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-flex": {
    id: "flux-2-flex",
    label: "FLUX.2 [flex]",
    provider: "runware",
    model: "bfl:6@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],  // Flexible: 256-1920px (multiples of 16)
    maxPromptLength: 3000,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 10 reference images)
  },

};

/**
 * Get the default image model
 */
export function getDefaultImageModel(): ImageModelConfig {
  const defaultModel = Object.values(IMAGE_MODEL_CONFIGS).find((m) => m.default);
  return defaultModel || IMAGE_MODEL_CONFIGS["nano-banana"];
}

/**
 * Get all available image models as array
 */
export function getAvailableImageModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODEL_CONFIGS);
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE DIMENSION MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map aspect ratio + resolution to pixel dimensions for images
 * ═══════════════════════════════════════════════════════════════════════════
 * Based on Nano Banana 2 Pro (Gemini 3 Pro Image Preview) - google:4@2
 * Official dimensions from Runware documentation
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const IMAGE_DIMENSION_MAP: Record<string, Record<string, ImageDimensions>> = {
    "1:1": {
    "1k": { width: 1024, height: 1024 },
    "2k": { width: 2048, height: 2048 },
    "4k": { width: 4096, height: 4096 },
  },
  "3:2": {
    "1k": { width: 1264, height: 848 },
    "2k": { width: 2528, height: 1696 },
    "4k": { width: 5096, height: 3392 },
  },
  "2:3": {
    "1k": { width: 848, height: 1264 },
    "2k": { width: 1696, height: 2528 },
    "4k": { width: 3392, height: 5096 },
  },
  "4:3": {
    "1k": { width: 1200, height: 896 },
    "2k": { width: 2400, height: 1792 },
    "4k": { width: 4800, height: 3584 },
  },
  "3:4": {
    "1k": { width: 896, height: 1200 },
    "2k": { width: 1792, height: 2400 },
    "4k": { width: 3584, height: 4800 },
  },
  "4:5": {
    "1k": { width: 928, height: 1152 },
    "2k": { width: 1856, height: 2304 },
    "4k": { width: 3712, height: 4608 },
  },
  "5:4": {
    "1k": { width: 1152, height: 928 },
    "2k": { width: 2304, height: 1856 },
    "4k": { width: 4608, height: 3712 },
  },
  "9:16": {
    "1k": { width: 768, height: 1376 },
    "2k": { width: 1536, height: 2752 },
    "4k": { width: 3072, height: 5504 },
  },
  "16:9": {
    "1k": { width: 1376, height: 768 },
    "2k": { width: 2752, height: 1536 },
    "4k": { width: 5504, height: 3072 },
  },
  "21:9": {
    "1k": { width: 1584, height: 672 },
    "2k": { width: 3168, height: 1344 },
    "4k": { width: 6336, height: 2688 },
  },
};

/**
 * Model-specific dimension mappings
 * For models with fixed dimensions (Midjourney, Ideogram)
 */
export const MODEL_SPECIFIC_DIMENSIONS: Record<string, Record<string, ImageDimensions>> = {
  // Midjourney V7 - Fixed dimensions per aspect ratio
  "midjourney-v7": {
    "16:9": { width: 1456, height: 816 },
    "9:16": { width: 816, height: 1456 },
    "1:1": { width: 1024, height: 1024 },
    "4:3": { width: 1232, height: 928 },
    "3:4": { width: 928, height: 1232 },
    "3:2": { width: 1344, height: 896 },
    "2:3": { width: 896, height: 1344 },
    "21:9": { width: 1680, height: 720 },
  },
  
  // Ideogram 3.0 - Multiple dimensions per aspect ratio (using most common/balanced)
  "ideogram-3.0": {
    "1:1": { width: 1024, height: 1024 },
    "3:2": { width: 1248, height: 832 },
    "2:3": { width: 832, height: 1248 },
    "4:3": { width: 1152, height: 864 },
    "3:4": { width: 864, height: 1152 },
    "16:9": { width: 1344, height: 768 },
    "9:16": { width: 768, height: 1344 },
    "5:4": { width: 1120, height: 896 },
    "4:5": { width: 896, height: 1120 },
    "8:5": { width: 1280, height: 800 },
    "5:8": { width: 800, height: 1280 },
    "3:1": { width: 1536, height: 512 },
    "1:3": { width: 512, height: 1536 },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Nano Banana (Gemini Flash Image 2.5) - google:4@1
  // Fixed dimensions - different from Nano Banana 2 Pro!
  // From Runware API error: Supported dimensions for text-to-image
  // ─────────────────────────────────────────────────────────────────────────
  "nano-banana": {
    "1:1": { width: 1024, height: 1024 },
    "3:2": { width: 1248, height: 832 },
    "2:3": { width: 832, height: 1248 },
    "4:3": { width: 1184, height: 864 },
    "3:4": { width: 864, height: 1184 },
    "4:5": { width: 896, height: 1152 },
    "5:4": { width: 1152, height: 896 },
    "9:16": { width: 768, height: 1344 },
    "16:9": { width: 1344, height: 768 },
    "21:9": { width: 1536, height: 672 },
  },
  
  // Imagen 4.0 Preview - Fixed dimensions (same for all Imagen 4.0 variants)
  "imagen-4.0-preview": {
    "1:1": { width: 1024, height: 1024 },
    "9:16": { width: 768, height: 1408 },
    "16:9": { width: 1408, height: 768 },
    "3:4": { width: 896, height: 1280 },
    "4:3": { width: 1280, height: 896 },
  },
  
  // Imagen 4.0 Ultra - Same dimensions as Preview
  "imagen-4.0-ultra": {
    "1:1": { width: 1024, height: 1024 },
    "9:16": { width: 768, height: 1408 },
    "16:9": { width: 1408, height: 768 },
    "3:4": { width: 896, height: 1280 },
    "4:3": { width: 1280, height: 896 },
  },
  
  // Imagen 4.0 Fast - Same dimensions as Preview & Ultra
  "imagen-4.0-fast": {
    "1:1": { width: 1024, height: 1024 },
    "9:16": { width: 768, height: 1408 },
    "16:9": { width: 1408, height: 768 },
    "3:4": { width: 896, height: 1280 },
    "4:3": { width: 1280, height: 896 },
  },
  
  // Seedream 4.0 - ByteDance (1K dimension)
  "seedream-4.0-1k": {
    "1:1": { width: 1024, height: 1024 },
  },
  
  // Seedream 4.0 - ByteDance (2K dimensions)
  "seedream-4.0-2k": {
    "1:1": { width: 2048, height: 2048 },
    "4:3": { width: 2304, height: 1728 },
    "3:4": { width: 1728, height: 2304 },
    "16:9": { width: 2560, height: 1440 },
    "9:16": { width: 1440, height: 2560 },
    "3:2": { width: 2496, height: 1664 },
    "2:3": { width: 1664, height: 2496 },
    "21:9": { width: 3024, height: 1296 },
  },
  
  // Seedream 4.0 - ByteDance (4K dimensions)
  "seedream-4.0-4k": {
    "1:1": { width: 4096, height: 4096 },
    "4:3": { width: 4608, height: 3456 },
    "3:4": { width: 3456, height: 4608 },
    "16:9": { width: 5120, height: 2880 },
    "9:16": { width: 2880, height: 5120 },
    "3:2": { width: 4992, height: 3328 },
    "2:3": { width: 3328, height: 4992 },
    "21:9": { width: 6048, height: 2592 },
  },
  
  // Seedream 4.5 - ByteDance (2K dimensions - same as 4.0)
  "seedream-4.5-2k": {
    "1:1": { width: 2048, height: 2048 },
    "4:3": { width: 2304, height: 1728 },
    "3:4": { width: 1728, height: 2304 },
    "16:9": { width: 2560, height: 1440 },
    "9:16": { width: 1440, height: 2560 },
    "3:2": { width: 2496, height: 1664 },
    "2:3": { width: 1664, height: 2496 },
    "21:9": { width: 3024, height: 1296 },
  },
  
  // Seedream 4.5 - ByteDance (4K dimensions - same as 4.0)
  "seedream-4.5-4k": {
    "1:1": { width: 4096, height: 4096 },
    "4:3": { width: 4608, height: 3456 },
    "3:4": { width: 3456, height: 4608 },
    "16:9": { width: 5120, height: 2880 },
    "9:16": { width: 2880, height: 5120 },
    "3:2": { width: 4992, height: 3328 },
    "2:3": { width: 3328, height: 4992 },
    "21:9": { width: 6048, height: 2592 },
  },
  
  // FLUX.2 [dev] - Black Forest Labs (Recommended dimensions: 512-2048px)
  "flux-2-dev": {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1344, height: 768 },
    "9:16": { width: 768, height: 1344 },
    "4:3": { width: 1152, height: 864 },
    "3:4": { width: 864, height: 1152 },
    "3:2": { width: 1248, height: 832 },
    "2:3": { width: 832, height: 1248 },
    "21:9": { width: 1584, height: 672 },
  },
  
  // FLUX.2 [pro] - Black Forest Labs (Recommended dimensions: 256-1920px)
  "flux-2-pro": {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "4:3": { width: 1152, height: 864 },
    "3:4": { width: 864, height: 1152 },
    "3:2": { width: 1248, height: 832 },
    "2:3": { width: 832, height: 1248 },
  },
  
  // FLUX.2 [flex] - Black Forest Labs (Recommended dimensions: 256-1920px)
  "flux-2-flex": {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1024, height: 1440 },  // Poster format
    "9:16": { width: 720, height: 1280 },
    "4:3": { width: 1152, height: 864 },
    "3:4": { width: 864, height: 1152 },
    "3:2": { width: 1248, height: 832 },
    "2:3": { width: 832, height: 1248 },
  },
};

/**
 * Get image dimensions for aspect ratio and resolution
 * @param aspectRatio - Aspect ratio (e.g., "16:9", "9:16", "1:1")
 * @param resolution - Resolution tier ("1k", "2k", "4k", "custom")
 * @param modelId - Optional model ID for model-specific dimensions
 * @returns Image dimensions {width, height}
 */
export function getImageDimensions(
  aspectRatio: string,
  resolution: string = "1k",
  modelId?: string
): ImageDimensions {
  // Check model-specific dimensions first (for Midjourney, Ideogram, Imagen, Seedream)
  if (modelId) {
    // Try with resolution suffix first (e.g., "seedream-4.0-2k")
    const modelWithResolution = `${modelId}-${resolution}`;
    if (MODEL_SPECIFIC_DIMENSIONS[modelWithResolution]) {
      const modelDims = MODEL_SPECIFIC_DIMENSIONS[modelWithResolution][aspectRatio];
      if (modelDims) return modelDims;
    }
    
    // Try without resolution suffix (e.g., "midjourney-v7")
    if (MODEL_SPECIFIC_DIMENSIONS[modelId]) {
      const modelDims = MODEL_SPECIFIC_DIMENSIONS[modelId][aspectRatio];
      if (modelDims) return modelDims;
    }
  }
  
  // Fall back to standard dimension map
  return IMAGE_DIMENSION_MAP[aspectRatio]?.[resolution] || { width: 1024, height: 1024 };
}

/**
 * Helper to convert aspect ratio string to dimensions
 * e.g., "9:16" with resolution "1k" -> { width: 768, height: 1376 }
 */
export function aspectRatioToDimensions(
  aspectRatio: string,
  resolution: string = "1k"
): ImageDimensions {
  return getImageDimensions(aspectRatio, resolution);
}

