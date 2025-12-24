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
  maxReferenceImages: number; // Maximum number of reference images (0 = not supported)
  supportsCharacterReference: boolean; // Whether model supports character reference separately
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
  // OpenAI GPT Image 1
  // Model AIR ID: openai:1@1
  // High-fidelity images with GPT-4o architecture
  // Enhanced prompt following, superior text rendering, and multimodal capabilities
  // Supports: Text-to-image, image-to-image (up to 16 reference images)
  // 
  // Key Features:
  // - Leverages GPT-4o architecture for advanced understanding
  // - High-fidelity image generation with exceptional detail
  // - Enhanced prompt following for precise creative control
  // - Superior text rendering for typography and branding
  // - Advanced multimodal capabilities (text + image understanding)
  // - Precise inpainting and image editing operations
  // - Supports up to 16 reference images (highest capacity!)
  // 
  // Technical Specifications:
  // - Positive prompt: 1-32000 characters
  // - Supported dimensions: 1024×1024 (1:1), 1536×1024 (3:2), 1024×1536 (2:3)
  // - Reference images: Up to 16 images via referenceImages (highest!)
  // 
  // Provider-Specific Settings (providerSettings.openai):
  // - quality: "standard" or "high" - Output quality level
  // - background: "transparent" or "opaque" - Background transparency
  // 
  // Workflows:
  // 1. Text-to-image: High-fidelity generation with GPT-4o understanding
  // 2. Image-to-image: Advanced editing with up to 16 reference images
  // 3. Inpainting: Precise editing of specific image regions
  // 4. Text rendering: Professional typography and brand names
  // 5. Product photography: Minimalist designs with precise details
  // 6. Multimodal editing: Complex edits combining text and image context
  // 7. Brand materials: High-quality visuals with text integration
  // ─────────────────────────────────────────────────────────────────────────
  "openai-gpt-image-1": {
    id: "openai-gpt-image-1",
    label: "OpenAI GPT Image 1",
    provider: "runware",
    model: "openai:1@1",
    aspectRatios: ["1:1", "3:2", "2:3"],
    resolutions: ["custom"],  // Fixed dimensions: 1024×1024, 1536×1024, 1024×1536
    maxPromptLength: 32000, // 1-32000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 16 reference images)
    maxReferenceImages: 16, // Highest reference image capacity across all models!
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI GPT Image 1.5
  // Model AIR ID: openai:4@1
  // Newest flagship image model powering ChatGPT Images
  // Significantly faster generation with enhanced instruction following
  // Supports: Text-to-image, image-to-image, image-editing (up to 16 reference images)
  // 
  // Key Features:
  // - Newest flagship model powering ChatGPT Images
  // - Significantly faster generation compared to GPT Image 1
  // - Enhanced instruction following for more precise results
  // - More precise edits that preserve original details
  // - Believable transformations with natural lighting integration
  // - Improved rendering of dense or small text
  // - Excellent for detailed design tasks
  // - Ideal for practical creative workflows and production use cases
  // - Supports up to 16 reference images (highest capacity!)
  // 
  // Technical Specifications:
  // - Positive prompt: 2-32000 characters
  // - Supported dimensions: 1024×1024 (1:1), 1536×1024 (3:2), 1024×1536 (2:3)
  // - Reference images: Up to 16 images via inputs.referenceImages (highest!)
  // 
  // Provider-Specific Settings (providerSettings.openai):
  // - quality: "auto", "standard", or "high" - Output quality level
  // - background: "auto", "transparent", or "opaque" - Background handling
  // 
  // Workflows:
  // 1. Text-to-image: Fast, high-quality generation with enhanced instruction following
  // 2. Image-to-image: Precise edits preserving original details
  // 3. Image-editing: Believable transformations (e.g., background replacement)
  // 4. Dense text rendering: Perfect for intricate typography and small text
  // 5. Design tasks: Detailed creative work with precise control
  // 6. Multi-image composition: Combine up to 16 references cohesively
  // 7. Background replacement: Natural lighting integration while preserving details
  // 8. Production workflows: Fast turnaround for practical creative projects
  // ─────────────────────────────────────────────────────────────────────────
  "openai-gpt-image-1.5": {
    id: "openai-gpt-image-1.5",
    label: "OpenAI GPT Image 1.5",
    provider: "runware",
    model: "openai:4@1",
    aspectRatios: ["1:1", "3:2", "2:3"],
    resolutions: ["custom"],  // Fixed dimensions: 1024×1024, 1536×1024, 1024×1536
    maxPromptLength: 32000, // 2-32000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image and editing (up to 16 reference images)
    maxReferenceImages: 16, // Highest reference image capacity across all models!
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runway Gen-4 Image
  // Model AIR ID: runway:4@1
  // High-fidelity text-to-image with advanced stylistic control
  // Visual consistency across scenes and characters for professional workflows
  // Supports: Text-to-image, image-to-image (up to 3 reference images)
  // 
  // Key Features:
  // - High-fidelity text-to-image generation
  // - Advanced stylistic control for artistic precision
  // - Visual consistency across scenes and characters
  // - Built for professional creative workflows
  // - Exceptional detail and artistic precision
  // - Reference tags system (@tag syntax) for precise control
  // - Optional reference image support with tagging
  // - Wide range of aspect ratios and dimensions
  // 
  // Technical Specifications:
  // - Positive prompt: 1-1000 characters (required)
  // - Reference images: Up to 3 images via inputs.referenceImages (optional)
  // - Reference tags: Use @tag syntax in prompts to reference specific images
  //   Tags must be 3-16 alphanumeric characters starting with a letter
  // - Supported dimensions: Multiple fixed dimensions across various aspect ratios
  //   16:9: 1920×1080, 1360×768, 1280×720
  //   9:16: 1080×1920, 720×1280
  //   1:1: 1024×1024, 1080×1080, 720×720
  //   4:3: 1168×880, 1440×1080, 960×720
  //   3:4: 1080×1440, 720×960
  //   21:9: 1808×768, 2112×912, 1680×720
  // 
  // Provider-Specific Settings (providerSettings.runway):
  // - contentModeration: Content filtering level
  // 
  // Reference Tags System:
  // - Assign tags to reference images: { "image": "uuid", "tag": "character" }
  // - Reference in prompt using @tag: "Create a scene with @character"
  // - Tags: 3-16 alphanumeric characters, must start with a letter
  // - Enables precise control over which reference influences which part
  // 
  // Workflows:
  // 1. Text-to-image: High-fidelity cinematic generation
  // 2. Image-to-image: Style transfer with up to 3 references
  // 3. Character consistency: Use tagged references for consistent characters
  // 4. Style application: Apply artistic styles via tagged references
  // 5. Scene composition: Combine character and style references
  // 6. Professional creative: Exceptional detail for production work
  // 7. Cinematic portraits: Dramatic lighting and rich color palettes
  // ─────────────────────────────────────────────────────────────────────────
  "runway-gen-4-image": {
    id: "runway-gen-4-image",
    label: "Runway Gen-4 Image",
    provider: "runware",
    model: "runway:4@1",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    resolutions: ["custom"],  // Multiple fixed dimensions per aspect ratio
    maxPromptLength: 1000, // 1-1000 characters (required)
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 3 reference images with tags)
    maxReferenceImages: 3, // Via inputs.referenceImages with optional tags
    supportsCharacterReference: true, // Via reference tags system
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runway Gen-4 Image Turbo
  // Model AIR ID: runway:4@2
  // Faster variant for rapid iterations and quick concept generation
  // Optimized for creative experimentation and workflow velocity
  // Supports: Image-to-image only (reference images required)
  // 
  // Key Features:
  // - Faster variant focused on rapid iterations
  // - Quick concept generation with preserved visual quality
  // - Optimized for creative experimentation
  // - Enhanced workflow velocity for iterative design
  // - Requires reference images to guide generation
  // - Reference tags system (@tag syntax) for precise control
  // - Key visual quality and control preserved despite speed
  // - Ideal for rapid prototyping and concept exploration
  // 
  // Technical Specifications:
  // - Positive prompt: 1-1000 characters (required)
  // - Reference images: Required via inputs.referenceImages (1-3 images)
  //   Note: Unlike Gen-4 Image, reference images are REQUIRED for Turbo
  // - Reference tags: Use @tag syntax in prompts to reference specific images
  //   Tags must be 3-16 alphanumeric characters starting with a letter
  // - Supported dimensions: Same as Gen-4 Image (multiple fixed dimensions)
  //   16:9: 1920×1080, 1360×768, 1280×720
  //   9:16: 1080×1920, 720×1280
  //   1:1: 1024×1024, 1080×1080, 720×720
  //   4:3: 1168×880, 1440×1080, 960×720
  //   3:4: 1080×1440, 720×960
  //   21:9: 1808×768, 2112×912, 1680×720
  // 
  // Provider-Specific Settings (providerSettings.runway):
  // - contentModeration.publicFigureThreshold: Public figure detection threshold
  // 
  // Reference Tags System:
  // - Assign tags to reference images: { "image": "uuid", "tag": "subject" }
  // - Reference in prompt using @tag: "Create composition with @subject"
  // - Tags: 3-16 alphanumeric characters, must start with a letter
  // - Enables precise control over reference influence
  // 
  // Workflows:
  // 1. Image-to-image: Fast iterations with 1-3 reference images (REQUIRED)
  // 2. Rapid prototyping: Quick concept exploration with visual guidance
  // 3. Creative experimentation: Fast turnaround for testing ideas
  // 4. Iterative design: Multiple quick variations from references
  // 5. Style exploration: Rapid testing of different artistic approaches
  // 6. Character variations: Quick iterations on character designs
  // 7. Environment testing: Fast composition experiments
  // 8. Mood exploration: Rapid lighting and atmosphere variations
  // ─────────────────────────────────────────────────────────────────────────
  "runway-gen-4-image-turbo": {
    id: "runway-gen-4-image-turbo",
    label: "Runway Gen-4 Image Turbo",
    provider: "runware",
    model: "runway:4@2",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    resolutions: ["custom"],  // Multiple fixed dimensions per aspect ratio (same as Gen-4)
    maxPromptLength: 1000, // 1-1000 characters (required)
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Image-to-image ONLY - reference images REQUIRED (1-3 with tags)
    maxReferenceImages: 3, // Via inputs.referenceImages with tags - REQUIRED for this model
    supportsCharacterReference: true, // Via reference tags system
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Kling IMAGE O1 - KlingAI
  // Model AIR ID: klingai:kling-image@o1
  // High-control image model for consistent character handling
  // Precise modification and strong stylization with structural stability
  // Supports: Text-to-image, image-to-image (up to 10 reference images)
  // 
  // Key Features:
  // - High-control image model built for consistent character handling
  // - Precise modification without structural drift
  // - Strong stylization capabilities with artistic control
  // - Interprets inputs with high accuracy
  // - Supports detailed edits while maintaining consistency
  // - Stable creative workflows across complex compositions
  // - Excellent for character consistency across multiple references
  // - Flexible dimension behavior (explicit or auto-match)
  // 
  // Technical Specifications:
  // - Positive prompt: 3-2500 characters
  // - Reference images: Up to 10 images via inputs.referenceImages
  // - Resolution tiers: 1K and 2K with multiple aspect ratios
  // - Supported dimensions:
  //   1K: 1024×1024 (1:1), 1248×832 (3:2), 832×1248 (2:3), 1168×880 (4:3),
  //       880×1168 (3:4), 768×1360 (9:16), 1360×768 (16:9), 1552×656 (21:9)
  //   2K: 2048×2048 (1:1), 2496×1664 (3:2), 1664×2496 (2:3), 2336×1760 (4:3),
  //       1760×2336 (3:4), 1536×2720 (9:16), 2720×1536 (16:9), 3104×1312 (21:9)
  // 
  // Dimension Behavior:
  // - Text-to-image: Requires explicit width and height from supported dimensions
  // - Image-to-image (Option 1): Specify width/height explicitly for precise control
  // - Image-to-image (Option 2): Omit width/height to auto-match first reference image,
  //   then use resolution parameter (1k/2k) to control output tier
  // 
  // Workflows:
  // 1. Text-to-image: High-accuracy character generation with strong stylization
  // 2. Image-to-image: Precise character modifications maintaining consistency
  // 3. Character consistency: Maintain features across multiple references (up to 10)
  // 4. Detailed edits: Refine features without structural drift
  // 5. Stylization: Apply artistic styles while preserving character identity
  // 6. Multi-reference blending: Unify multiple character references consistently
  // 7. Complex compositions: Stable workflows for intricate character designs
  // 8. Feature enhancement: Add details while maintaining core character traits
  // ─────────────────────────────────────────────────────────────────────────
  "kling-image-o1": {
    id: "kling-image-o1",
    label: "Kling IMAGE O1",
    provider: "runware",
    model: "klingai:kling-image@o1",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "9:16", "16:9", "21:9"],
    resolutions: ["1k", "2k"],  // Two resolution tiers
    maxPromptLength: 2500, // 3-2500 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 10 reference images)
    maxReferenceImages: 10, // Via inputs.referenceImages
    supportsCharacterReference: true, // Excellent for character consistency
  },

  // ─────────────────────────────────────────────────────────────────────────
// Nano Banana (Gemini Flash Image 2.5) - Google DeepMind
// Model AIR ID: google:4@1
// Fast, interactive image workflows with sophisticated editing capabilities
// Supports: Text-to-image, image-to-image (up to 8 reference images)
// 
// Key Features:
// - Prompt-based modifications and multi-image fusion
// - Conversational editing flows with context-aware edits
// - Deep real-world understanding for beyond-aesthetic manipulations
// 
// Technical Specifications:
// - Positive prompt: 2-3000 characters
// - Reference images: Up to 8 images via referenceImages parameter
// - Text-to-image dimensions: Fixed per aspect ratio (see MODEL_SPECIFIC_DIMENSIONS)
// - Image-to-image: Auto-matches reference image aspect ratio (width/height ignored)
// - Input image requirements: 300-2048px width/height, 20MB file size limit
// - Watermarking: Includes invisible SynthID digital watermark on all outputs
// 
// Workflows:
// 1. Text-to-image: Standard generation with prompt
// 2. Image-to-image: Edits/modifications using reference images
// 3. Multi-image fusion: Combine up to 8 images into cohesive scene
// ─────────────────────────────────────────────────────────────────────────
"nano-banana": {
  id: "nano-banana",
  label: "Nano Banana (Gemini Flash 2.5)",
  provider: "runware",
  model: "google:4@1",
  aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "16:9", "9:16", "21:9"],
  resolutions: ["1k"],  // Single resolution tier
  maxPromptLength: 3000, // 2-3000 characters
  supportsSeed: false,
  supportsNegativePrompt: false,
  supportsStyleReference: true, // Supports up to 8 reference images
  maxReferenceImages: 8,
  supportsCharacterReference: true,
  default: true,
},

 // ─────────────────────────────────────────────────────────────────────────
// Nano Banana 2 Pro (Gemini 3 Pro Image Preview) - Google DeepMind
// Model AIR ID: google:4@2
// Professional-grade controls with advanced reasoning capabilities
// Supports: Text-to-image, image-to-image (up to 14 reference images)
// 
// Key Features:
// - Sophisticated lighting control and camera angle manipulation
// - Advanced text rendering for logos, posters, and diagrams
// - High-resolution output up to 4K (4096×4096)
// - Enhanced aspect ratio control with professional-grade precision
// - Superior reasoning for complex visual compositions
// 
// Technical Specifications:
// - Positive prompt: 3-45000 characters (15x larger than Nano Banana)
// - Reference images: Up to 14 images via referenceImages parameter
// - Resolution tiers: 1K, 2K, 4K with specific dimensions per aspect ratio
// - Input image requirements: 300-2048px width/height, 20MB file size limit
// - Watermarking: Includes invisible SynthID digital watermark on all outputs
// 
// Dimension Behavior:
// - Text-to-image: Requires explicit width/height from supported dimensions
// - Image-to-image (Option 1): Specify width/height explicitly for precise control
// - Image-to-image (Option 2): Omit width/height to auto-match first reference image,
//   then use resolution parameter (1k/2k/4k) to control output tier
// 
// Workflows:
// 1. Text-to-image: High-quality generation with professional controls
// 2. Image-to-image: Advanced editing with up to 14 reference images
// 3. Multi-image fusion: Blend multiple images with sophisticated color/lighting control
// 4. Text rendering: Create logos, posters, diagrams with clear readable text
// ─────────────────────────────────────────────────────────────────────────
"nano-banana-2-pro": {
  id: "nano-banana-2-pro",
  label: "Nano Banana 2 Pro (Gemini 3 Pro)",
  provider: "runware",
  model: "google:4@2",
  aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "9:16", "16:9", "21:9"],
  resolutions: ["1k", "2k", "4k"],  // Three resolution tiers
  maxPromptLength: 45000, // 3-45000 characters (massive context window)
  supportsSeed: false,
  supportsNegativePrompt: false,
  supportsStyleReference: true, // Supports up to 14 reference images
  maxReferenceImages: 14,
  supportsCharacterReference: true,
},

  // ─────────────────────────────────────────────────────────────────────────
  // Midjourney V7
  // Model AIR ID: midjourney:3@1
  // Next-generation release emphasizing realism and control
  // Grand, cinematic imagery with fluid brushwork and deeply atmospheric tone
  // Supports: Text-to-image, image-to-image (1 reference image)
  // 
  // Key Features:
  // - Significant improvements in visual realism and photographic quality
  // - Enhanced texture fidelity and lighting accuracy
  // - Superior natural-language understanding for complex prompts
  // - Cinematic composition with fluid brushwork and atmospheric depth
  // 
  // Technical Specifications:
  // - Positive prompt: 1-2000 characters
  // - Reference images: Supports 1 image via inputs.referenceImages
  // - Number of results: Must be multiple of 4 (4, 8, 12, 16, 20, Default: 4)
  // - Supported dimensions: Fixed per aspect ratio (see MODEL_SPECIFIC_DIMENSIONS)
  //   16:9 (1456×816), 9:16 (816×1456), 1:1 (1024×1024), 4:3 (1232×928),
  //   3:4 (928×1232), 3:2 (1344×896), 2:3 (896×1344), 21:9 (1680×720)
  // 
  // Provider-Specific Settings (providerSettings.midjourney):
  // - quality: Image quality level (higher = more detail)
  // - stylize: Artistic interpretation strength (0-1000, default: 100)
  // - chaos: Variation and unpredictability (0-100, default: 0)
  // - weird: Unconventional and experimental results (0-3000, default: 0)
  // - niji: Anime/illustration style mode (boolean)
  // 
  // Workflows:
  // 1. Text-to-image: Cinematic, photorealistic generation
  // 2. Image-to-image: Style transfer with atmospheric consistency
  // 3. Editorial photography: Portrait and fashion with natural lighting
  // 4. Landscape photography: Atmospheric scenes with depth and mood
  // ─────────────────────────────────────────────────────────────────────────
  "midjourney-v7": {
    id: "midjourney-v7",
    label: "Midjourney V7",
    provider: "runware",
    model: "midjourney:3@1",
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 2000, // 1-2000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (1 reference image only via inputs.referenceImages)
    maxReferenceImages: 1,
    supportsCharacterReference: false, // Only supports 1 image total - no separate character reference
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Ideogram 3.0
  // Model AIR ID: ideogram:4@1
  // Design-level generation with sharper text rendering and better composition
  // Perfect for graphic-driven content with superior stylistic control
  // Supports: Text-to-image only
  // 
  // Key Features:
  // - Exceptional text rendering quality for logos, posters, and typography
  // - Enhanced composition and layout control for professional designs
  // - Greater stylistic control with multiple presets and style types
  // - Ideal for graphic design, branding, and marketing materials
  // - Magic Prompt feature for automatic prompt enhancement
  // 
  // Technical Specifications:
  // - Positive prompt: 1-2000 characters
  // - Negative prompt: 1-2000 characters (optional)
  // - Supported dimensions: 60+ fixed dimension combinations across 13 aspect ratios
  //   (See MODEL_SPECIFIC_DIMENSIONS for complete list)
  // - Wide aspect ratio support: 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 5:4, 4:5, 
  //   8:5, 5:8, 3:1, 1:3, plus many intermediate ratios
  // 
  // Provider-Specific Settings (providerSettings.ideogram):
  // - renderingSpeed: "QUALITY" (slower, higher quality) or "FAST" (faster generation)
  // - magicPrompt: "ON" or "OFF" - Auto-enhances prompts for better results
  // - styleType: Style category (e.g., "DESIGN", "PHOTO", "3D", "ILLUSTRATION")
  // - stylePreset: Specific style (e.g., "ART_DECO", "MINIMALIST", "VINTAGE")
  // - styleReferenceImages: Array of image UUIDs for style transfer
  // - characterReferenceImages: Array of image UUIDs for character consistency
  // - characterReferenceImagesMask: Masks for character reference images
  // 
  // Workflows:
  // 1. Text-to-image: Professional graphic design with precise text rendering
  // 2. Style-guided generation: Use styleReferenceImages for consistent aesthetics
  // 3. Character consistency: Use characterReferenceImages for brand mascots/characters
  // 4. Typography-focused: Posters, logos, diagrams with readable text
  // 5. Marketing materials: Social media graphics, advertisements, presentations
  // ─────────────────────────────────────────────────────────────────────────
  "ideogram-3.0": {
    id: "ideogram-3.0",
    label: "Ideogram 3.0",
    provider: "runware",
    model: "ideogram:4@1",
    aspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "5:4", "4:5", "8:5", "5:8", "3:1", "1:3"],
    resolutions: ["custom"],  // 60+ fixed dimensions per aspect ratio
    maxPromptLength: 2000, // 1-2000 characters
    supportsSeed: false,
    supportsNegativePrompt: true, // Supports negative prompts (1-2000 characters)
    supportsStyleReference: true, // Supports via providerSettings.ideogram.styleReferenceImages
    maxReferenceImages: 999, // No documented limit, uses providerSettings for style + character references
    supportsCharacterReference: true, // Via providerSettings.ideogram.characterReferenceImages
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Imagen 4.0 Preview - Google
  // Model AIR ID: google:2@1
  // Improved textures, lighting, and typography
  // Perfect for design-heavy or detail-focused work
  // Supports: Text-to-image only
  // 
  // Key Features:
  // - Enhanced texture rendering for realistic materials and surfaces
  // - Superior lighting accuracy for natural and studio lighting scenarios
  // - Improved typography rendering for text-inclusive designs
  // - Balanced quality and speed for professional workflows
  // - Excellent for product photography and detailed illustrations
  // 
  // Technical Specifications:
  // - Positive prompt: 2-3000 characters
  // - Negative prompt: Not supported
  // - Supported dimensions (fixed per aspect ratio):
  //   1:1 (1024×1024), 9:16 (768×1408), 16:9 (1408×768),
  //   3:4 (896×1280), 4:3 (1280×896)
  // 
  // Workflows:
  // 1. Text-to-image: High-quality photorealistic generation
  // 2. Product photography: Detailed textures and accurate lighting
  // 3. Portrait photography: Natural skin tones and lighting
  // 4. Architectural visualization: Realistic materials and lighting
  // 5. Design mockups: Typography and layout-focused imagery
  // ─────────────────────────────────────────────────────────────────────────
  "imagen-4.0-preview": {
    id: "imagen-4.0-preview",
    label: "Imagen 4.0 Preview",
    provider: "runware",
    model: "google:2@1",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 3000, // 2-3000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: false, // Text-to-image only
    maxReferenceImages: 0,
    supportsCharacterReference: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Imagen 4.0 Ultra - Google
  // Model AIR ID: google:2@2
  // Google's most advanced image model available
  // Exceptional detail, color accuracy, and prompt adherence
  // Ideal for demanding use cases where quality and consistency matter most
  // Supports: Text-to-image only
  // 
  // Key Features:
  // - Exceptional detail rendering for ultra-high-quality outputs
  // - Superior color accuracy and vibrancy for professional color work
  // - Outstanding prompt adherence for precise creative control
  // - Best-in-class consistency across multiple generations
  // - Perfect for commercial work requiring maximum quality
  // - Ideal for macro photography, fine art, and premium content
  // 
  // Technical Specifications:
  // - Positive prompt: 2-3000 characters
  // - Negative prompt: Not supported
  // - Supported dimensions (fixed per aspect ratio):
  //   1:1 (1024×1024), 9:16 (768×1408), 16:9 (1408×768),
  //   3:4 (896×1280), 4:3 (1280×896)
  // 
  // Workflows:
  // 1. Text-to-image: Premium photorealistic generation
  // 2. Commercial photography: Product shots with perfect color accuracy
  // 3. Fine art: Museum-quality digital art with exceptional detail
  // 4. Macro photography: Intricate patterns and textures with perfect focus
  // 5. Professional portraits: Studio-quality with accurate skin tones
  // 6. Advertising: High-end visuals for premium brand campaigns
  // ─────────────────────────────────────────────────────────────────────────
  "imagen-4.0-ultra": {
    id: "imagen-4.0-ultra",
    label: "Imagen 4.0 Ultra",
    provider: "runware",
    model: "google:2@2",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 3000, // 2-3000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: false, // Text-to-image only
    maxReferenceImages: 0,
    supportsCharacterReference: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Imagen 4.0 Fast - Google
  // Model AIR ID: google:2@3
  // Speed and quality optimized for quicker inference
  // Minimal quality loss with fast generation
  // Supports: Text-to-image only (with negative prompt support)
  // 
  // Key Features:
  // - Optimized for rapid generation without significant quality loss
  // - Maintains Imagen 4 quality standards with faster inference
  // - Supports negative prompts for better control over unwanted elements
  // - Ideal for iterative workflows and rapid prototyping
  // - Excellent balance of speed and fine detail retention
  // - Perfect for high-volume content generation
  // 
  // Technical Specifications:
  // - Positive prompt: 2-3000 characters
  // - Negative prompt: 2-3000 characters (optional) - Unique to Fast variant
  // - Supported dimensions (fixed per aspect ratio):
  //   1:1 (1024×1024), 9:16 (768×1408), 16:9 (1408×768),
  //   3:4 (896×1280), 4:3 (1280×896)
  // 
  // Workflows:
  // 1. Text-to-image: Fast photorealistic generation with quality retention
  // 2. Rapid prototyping: Quick iterations for concept development
  // 3. Content at scale: High-volume generation for social media, blogs
  // 4. A/B testing: Fast generation of multiple variations
  // 5. Real-time applications: Interactive image generation workflows
  // 6. Negative prompt refinement: Use negativePrompt to exclude unwanted elements
  // ─────────────────────────────────────────────────────────────────────────
  "imagen-4.0-fast": {
    id: "imagen-4.0-fast",
    label: "Imagen 4.0 Fast",
    provider: "runware",
    model: "google:2@3",
    aspectRatios: ["1:1", "9:16", "16:9", "3:4", "4:3"],
    resolutions: ["custom"],  // Fixed dimensions per aspect ratio
    maxPromptLength: 3000, // 2-3000 characters
    supportsSeed: false,
    supportsNegativePrompt: true, // 2-3000 characters (unique to Fast variant)
    supportsStyleReference: false, // Text-to-image only
    maxReferenceImages: 0,
    supportsCharacterReference: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Seedream 4.0 - ByteDance
  // Model AIR ID: bytedance:5@0
  // Major leap in multimodal AI image generation
  // Ultra-fast 2K/4K rendering with unique sequential image capabilities
  // Maintains character consistency across multiple outputs
  // Perfect for storyboard creation and professional design workflows
  // Supports: Text-to-image, image-to-image (up to 14 reference images)
  // 
  // Key Features:
  // - Ultra-fast 2K/4K rendering for high-resolution professional output
  // - Unique sequential image generation (multiple related outputs in one request)
  // - Exceptional character consistency across multiple generations
  // - Complex editing operations through natural language commands
  // - Ideal for storyboard creation and animation pre-production
  // - Multi-image fusion with consistent style and composition
  // 
  // Technical Specifications:
  // - Positive prompt: 1-2000 characters
  // - Reference images: Up to 14 images via referenceImages parameter
  // - Sequential images: Generate multiple related outputs (via maxSequentialImages)
  // - Combined limit: Reference images + sequential images ≤ 15 total
  // - Supported dimensions:
  //   1K: 1024×1024 (1:1) only
  //   2K: 2048×2048 (1:1), 2304×1728 (4:3), 1728×2304 (3:4), 2560×1440 (16:9),
  //       1440×2560 (9:16), 2496×1664 (3:2), 1664×2496 (2:3), 3024×1296 (21:9)
  //   4K: 4096×4096 (1:1), 4608×3456 (4:3), 3456×4608 (3:4), 5120×2880 (16:9),
  //       2880×5120 (9:16), 4992×3328 (3:2), 3328×4992 (2:3), 6048×2592 (21:9)
  // 
  // Provider-Specific Settings (providerSettings.bytedance):
  // - maxSequentialImages: Number of related sequential images to generate
  //   Note: Actual number may be fewer based on prompt complexity
  // 
  // Workflows:
  // 1. Text-to-image: Ultra-fast high-resolution generation
  // 2. Image-to-image: Character-consistent editing with up to 14 references
  // 3. Sequential generation: Create storyboards, animation frames, variations
  // 4. Character evolution: Show character through different states/emotions/seasons
  // 5. Multi-image fusion: Blend multiple references maintaining consistency
  // 6. Professional storyboarding: Generate related scenes for video pre-production
  // ─────────────────────────────────────────────────────────────────────────
  "seedream-4.0": {
    id: "seedream-4.0",
    label: "Seedream 4.0",
    provider: "runware",
    model: "bytedance:5@0",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["1k", "2k", "4k"],  // Three resolution tiers (1K limited to 1:1 only)
    maxPromptLength: 2000, // 1-2000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 14 reference images)
    maxReferenceImages: 14, // Combined with sequential images, total ≤ 15
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Seedream 4.5 - ByteDance
  // Model AIR ID: bytedance:seedream@4.5
  // Production reliability focused: Fixed distant face distortion & text rendering
  // Sharp 2K/4K images suitable for professional work
  // Better multi-image fusion with consistent output
  // Supports: Text-to-image, image-to-image (up to 14 reference images)
  // 
  // Key Features:
  // - Production-ready reliability with consistent, predictable results
  // - Fixed distant face distortion issues from previous versions
  // - Significantly improved text rendering quality
  // - Enhanced multi-image fusion with better consistency
  // - Sharp 2K and 4K output for professional workflows
  // - Sequential image generation for storyboarding
  // - Automatic aspect ratio matching in image-to-image mode
  // 
  // Technical Specifications:
  // - Positive prompt: 1-2000 characters
  // - Reference images: Up to 14 images via inputs.referenceImages
  // - Sequential images: Generate multiple related outputs (via maxSequentialImages)
  // - Combined limit: Reference images + sequential images ≤ 15 total
  // - Dimension constraints:
  //   Minimum: 2560×1440 pixels (3,686,400 total pixels)
  //   Maximum: 4096×4096 pixels (16,777,216 total pixels)
  //   Aspect ratio: Between 1:16 and 16:1
  // - Recommended 2K dimensions: 2048×2048 (1:1), 2304×1728 (4:3), 1728×2304 (3:4),
  //   2560×1440 (16:9), 1440×2560 (9:16), 2496×1664 (3:2), 1664×2496 (2:3), 3024×1296 (21:9)
  // - Recommended 4K dimensions: 4096×4096 (1:1), 4608×3456 (4:3), 3456×4608 (3:4),
  //   5120×2880 (16:9), 2880×5120 (9:16), 4992×3328 (3:2), 3328×4992 (2:3), 6048×2592 (21:9)
  // 
  // Dimension Behavior:
  // - Text-to-image: Specify explicit width and height from supported dimensions
  // - Image-to-image (Option 1): Specify width/height explicitly for precise control
  // - Image-to-image (Option 2): Use resolution parameter (2k/4k) to auto-match
  //   aspect ratio from first reference image
  // 
  // Input Image Requirements:
  // - Minimum: 14×14 pixels
  // - Maximum: 6000×6000 pixels
  // - Aspect ratio: Between 1:16 and 16:1
  // - File size limit: 10MB
  // 
  // Provider-Specific Settings (providerSettings.bytedance):
  // - maxSequentialImages: Number of related sequential images to generate
  //   Note: Actual number may be fewer based on prompt complexity
  // - optimizePromptMode: Enable automatic prompt optimization for better results
  // 
  // Workflows:
  // 1. Text-to-image: Production-quality 2K/4K generation with reliable output
  // 2. Image-to-image: Multi-image fusion with up to 14 references
  // 3. Sequential generation: Storyboards, character evolution, seasonal variations
  // 4. Professional portraits: Fixed face distortion for distant subjects
  // 5. Text-inclusive designs: Improved text rendering for logos and graphics
  // 6. Group compositions: Blend multiple characters with consistent lighting
  // 7. Flexible aspect ratios: Auto-match or specify for precise control
  // ─────────────────────────────────────────────────────────────────────────
  "seedream-4.5": {
    id: "seedream-4.5",
    label: "Seedream 4.5",
    provider: "runware",
    model: "bytedance:seedream@4.5",
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    resolutions: ["2k", "4k"],  // 2K and 4K only (minimum 2560×1440 pixels)
    maxPromptLength: 2000, // 1-2000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports image-to-image (up to 14 reference images via inputs.referenceImages)
    maxReferenceImages: 14, // Combined with sequential images, total ≤ 15
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [dev] - Black Forest Labs
  // Model AIR ID: runware:400@1
  // Open weights release with full architectural control
  // Perfect for developers needing custom pipelines and advanced workflows
  // Supports: Text-to-image, reference-to-image (up to 4 reference images)
  // 
  // Key Features:
  // - Open weights model for complete architectural control
  // - Full control over sampling behavior and guidance strategies
  // - Optimized inference through Runware for fast, cost-effective generation
  // - Ideal for experimentation and custom pipeline development
  // - Supports seed for reproducible results
  // - Flexible acceleration settings for speed/quality trade-offs
  // 
  // Technical Specifications:
  // - Positive prompt: 1-32000 characters (largest in FLUX family)
  // - Supported dimensions: 512-2048 pixels (width and height, multiples of 16)
  // - Reference images: Up to 4 images via referenceImages
  // - CFG Scale: 1-20 (default: 4) - Controls prompt adherence strength
  // - Steps: 1-50 - Number of diffusion steps
  // - Acceleration: none, low, medium, high (default: medium)
  // - Supports seed: Yes - for reproducible generation
  // 
  // Provider-Specific Settings:
  // - CFGScale: Classifier-Free Guidance scale (1-20, default: 4)
  // - steps: Number of inference steps (1-50)
  // - acceleration: Speed optimization level (none/low/medium/high)
  // - seed: Random seed for reproducible results
  // 
  // Workflows:
  // 1. Text-to-image: Experimental and custom generation workflows
  // 2. Reference-to-image: Style transfer with up to 4 reference images
  // 3. Research & development: Test custom sampling strategies
  // 4. Reproducible generation: Use seed for consistent results
  // 5. Speed optimization: Adjust acceleration for performance tuning
  // 6. Abstract art: Digital art with geometric patterns and gradients
  // 7. Custom pipelines: Build specialized generation workflows
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-dev": {
    id: "flux-2-dev",
    label: "FLUX.2 [dev]",
    provider: "runware",
    model: "runware:400@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
    resolutions: ["custom"],  // Flexible: 512-2048px (multiples of 16)
    maxPromptLength: 32000, // 1-32000 characters
    supportsSeed: true, // Unique to [dev] - supports reproducible generation
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 4 reference images)
    maxReferenceImages: 4,
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [pro] - Black Forest Labs
  // Model AIR ID: bfl:5@1
  // Production-ready with robust reference-image editing
  // Built for reliability and speed in high-volume workflows
  // Supports: Text-to-image, reference-to-image (up to 9 reference images)
  // 
  // Key Features:
  // - Production-ready quality with consistent, reliable results
  // - Robust reference-image editing capabilities
  // - Optimized for speed in high-volume workflows
  // - Dependable performance for commercial applications
  // - Excellent balance of quality and generation speed
  // - Supports up to 9 reference images for complex compositions
  // 
  // Technical Specifications:
  // - Positive prompt: 1-32000 characters
  // - Supported dimensions: 256-2048 pixels (width and height, multiples of 16)
  //   Note: Documentation mentions 256-1920px, but 2048 is supported
  // - Reference images: Up to 9 images via referenceImages
  // - Total input capacity: 9 megapixels
  // 
  // Provider-Specific Settings (providerSettings.bfl):
  // - promptUpsampling: Automatically enhance and expand prompts for better results
  // - safetyTolerance: Control content safety filtering level
  // 
  // Workflows:
  // 1. Text-to-image: High-quality production generation
  // 2. Reference-to-image: Multi-image style transfer and composition
  // 3. High-volume production: Consistent results for commercial workflows
  // 4. Product photography: Professional product shots with clean backgrounds
  // 5. Commercial content: Reliable output for business applications
  // 6. E-commerce: Product images at scale with consistent quality
  // 7. Marketing materials: Dependable visuals for campaigns
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-pro": {
    id: "flux-2-pro",
    label: "FLUX.2 [pro]",
    provider: "runware",
    model: "bfl:5@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],  // Flexible: 256-2048px (multiples of 16)
    maxPromptLength: 32000, // 1-32000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 9 reference images)
    maxReferenceImages: 9, // Total input capacity: 9 megapixels
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [flex] - Black Forest Labs
  // Model AIR ID: bfl:6@1
  // Strongest text rendering accuracy in FLUX family
  // Fine-grained control over composition and layout
  // Perfect for branded design, posters, and typography-driven work
  // Maintains character and product consistency across multiple references
  // Supports: Text-to-image, reference-to-image (up to 10 reference images)
  // 
  // Key Features:
  // - Strongest text rendering accuracy in the entire FLUX family
  // - Fine-grained control over composition and precise layout
  // - Exceptional typography readability for text-heavy designs
  // - Maintains character and product consistency across multiple references
  // - Designed specifically for branded design and marketing materials
  // - Perfect for posters, logos, and typography-driven creative work
  // - Highest reference image capacity (10 images, 14 megapixels)
  // 
  // Technical Specifications:
  // - Positive prompt: 1-32000 characters
  // - Supported dimensions: 256-2048 pixels (width and height, multiples of 16)
  //   Note: Documentation mentions 256-1920px, but 2048 is supported
  // - Reference images: Up to 10 images via referenceImages (highest in FLUX)
  // - Total input capacity: 14 megapixels (highest in FLUX)
  // - CFG Scale: 1-20 (default: 2.5) - Fine-tune prompt adherence
  // - Steps: 1-50 - Control generation quality vs speed
  // 
  // Provider-Specific Settings (providerSettings.bfl):
  // - promptUpsampling: Automatically enhance and expand prompts
  // - safetyTolerance: Control content safety filtering level
  // - CFGScale: Classifier-Free Guidance scale (1-20, default: 2.5)
  // - steps: Number of inference steps (1-50)
  // 
  // Workflows:
  // 1. Text-to-image: Typography-focused generation with precise text rendering
  // 2. Reference-to-image: Multi-image composition with up to 10 references
  // 3. Branded design: Logos, brand materials with consistent identity
  // 4. Poster design: Bold typography with structured layouts
  // 5. Marketing materials: Professional designs with readable text
  // 6. Product branding: Maintain product consistency across variations
  // 7. Typography art: Text-driven creative work with geometric elements
  // 8. Event graphics: Posters, banners with clear messaging
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-flex": {
    id: "flux-2-flex",
    label: "FLUX.2 [flex]",
    provider: "runware",
    model: "bfl:6@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],  // Flexible: 256-2048px (multiples of 16)
    maxPromptLength: 32000, // 1-32000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 10 reference images)
    maxReferenceImages: 10, // Highest in FLUX family, 14 megapixels total capacity
    supportsCharacterReference: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLUX.2 [max] - Black Forest Labs
  // Model AIR ID: bfl:7@1
  // Pinnacle of FLUX.2 family - Professional-grade visual intelligence
  // Maximum quality image generation and editing with real-world context
  // Supports: Text-to-image, reference-to-image (up to 8 reference images)
  // 
  // Key Features:
  // - Pinnacle of FLUX.2 model family for maximum quality output
  // - Professional-grade visual intelligence for production workflows
  // - Complex multi-reference workflows with exceptional style fidelity
  // - Grounded generation with real-world context integration (unique!)
  // - Perfect for marketing assets, product visuals, cinematic compositions
  // - Superior quality for high-end commercial and professional applications
  // - Real-world context awareness (e.g., current weather conditions)
  // - Exceptional character identity preservation across references
  // 
  // Technical Specifications:
  // - Positive prompt: 1-32000 characters
  // - Supported dimensions: 256-2048 pixels (width and height, multiples of 16)
  // - Reference images: Up to 8 images via inputs.referenceImages
  // - Grounded generation: Supports real-world context integration
  //   (e.g., "current weather conditions for London")
  // 
  // Provider-Specific Settings (providerSettings.bfl):
  // - promptUpsampling: Automatically enhance and expand prompts for better results
  // - safetyTolerance: Control content safety filtering level (0-6)
  // 
  // Workflows:
  // 1. Text-to-image: Maximum quality professional-grade generation
  // 2. Reference-to-image: Multi-reference composition with up to 8 images
  // 3. High-end product photography: Perfect lighting and studio-quality output
  // 4. Character identity preservation: Maintain same character across references
  // 5. Grounded generation: Real-world context (weather, time, location)
  // 6. Marketing assets: Premium visuals for commercial campaigns
  // 7. Cinematic compositions: Film-quality imagery for professional media
  // 8. Product visuals: Commercial-grade product photography
  // 9. Real-world scenarios: Context-aware generation (weather, environment)
  // ─────────────────────────────────────────────────────────────────────────
  "flux-2-max": {
    id: "flux-2-max",
    label: "FLUX.2 [max]",
    provider: "runware",
    model: "bfl:7@1",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["custom"],  // Flexible: 256-2048px (multiples of 16)
    maxPromptLength: 32000, // 1-32000 characters
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleReference: true, // Supports reference-to-image (up to 8 reference images via inputs.referenceImages)
    maxReferenceImages: 8,
    supportsCharacterReference: true,
  },

};

/**
 * Get image model config by ID
 */
export function getImageModelConfig(modelId: string): ImageModelConfig | undefined {
  return IMAGE_MODEL_CONFIGS[modelId];
}

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
 * For models with fixed dimensions (Midjourney, Ideogram, OpenAI, etc.)
 */
export const MODEL_SPECIFIC_DIMENSIONS: Record<string, Record<string, ImageDimensions>> = {
  // OpenAI GPT Image 1 - Fixed dimensions
  "openai-gpt-image-1": {
    "1:1": { width: 1024, height: 1024 },
    "3:2": { width: 1536, height: 1024 },
    "2:3": { width: 1024, height: 1536 },
  },
  
  // OpenAI GPT Image 1.5 - Fixed dimensions (same as 1.0)
  "openai-gpt-image-1.5": {
    "1:1": { width: 1024, height: 1024 },
    "3:2": { width: 1536, height: 1024 },
    "2:3": { width: 1024, height: 1536 },
  },
  
  // Runway Gen-4 Image - Multiple fixed dimensions per aspect ratio
  "runway-gen-4-image": {
    "16:9": { width: 1920, height: 1080 },  // Also: 1360×768, 1280×720
    "9:16": { width: 1080, height: 1920 },  // Also: 720×1280
    "1:1": { width: 1024, height: 1024 },   // Also: 1080×1080, 720×720
    "4:3": { width: 1440, height: 1080 },   // Also: 1168×880, 960×720
    "3:4": { width: 1080, height: 1440 },   // Also: 720×960
    "21:9": { width: 2112, height: 912 },   // Also: 1808×768, 1680×720
  },
  
  // Runway Gen-4 Image Turbo - Same dimensions as Gen-4 Image
  "runway-gen-4-image-turbo": {
    "16:9": { width: 1920, height: 1080 },  // Also: 1360×768, 1280×720
    "9:16": { width: 1080, height: 1920 },  // Also: 720×1280
    "1:1": { width: 1024, height: 1024 },   // Also: 1080×1080, 720×720
    "4:3": { width: 1440, height: 1080 },   // Also: 1168×880, 960×720
    "3:4": { width: 1080, height: 1440 },   // Also: 720×960
    "21:9": { width: 2112, height: 912 },   // Also: 1808×768, 1680×720
  },
  
  // Kling IMAGE O1 - KlingAI (1K dimensions)
  "kling-image-o1-1k": {
    "1:1": { width: 1024, height: 1024 },
    "3:2": { width: 1248, height: 832 },
    "2:3": { width: 832, height: 1248 },
    "4:3": { width: 1168, height: 880 },
    "3:4": { width: 880, height: 1168 },
    "9:16": { width: 768, height: 1360 },
    "16:9": { width: 1360, height: 768 },
    "21:9": { width: 1552, height: 656 },
  },
  
  // Kling IMAGE O1 - KlingAI (2K dimensions)
  "kling-image-o1-2k": {
    "1:1": { width: 2048, height: 2048 },
    "3:2": { width: 2496, height: 1664 },
    "2:3": { width: 1664, height: 2496 },
    "4:3": { width: 2336, height: 1760 },
    "3:4": { width: 1760, height: 2336 },
    "9:16": { width: 1536, height: 2720 },
    "16:9": { width: 2720, height: 1536 },
    "21:9": { width: 3104, height: 1312 },
  },
  
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
  
  // FLUX.2 [max] - Black Forest Labs (Recommended dimensions: 256-2048px)
  "flux-2-max": {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1920, height: 1080 },  // Full HD
    "9:16": { width: 1080, height: 1920 },
    "4:3": { width: 1280, height: 960 },
    "3:4": { width: 960, height: 1280 },
    "3:2": { width: 1440, height: 960 },
    "2:3": { width: 960, height: 1440 },
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
