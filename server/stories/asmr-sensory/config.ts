// ASMR / Sensory Template Configuration

import type {
  VideoModelConfig,
  VideoDimensions,
  ASMRCategory,
  ASMRMaterial,
} from "./types";

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
  // ─────────────────────────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// ASMR CATEGORIES (Backend mirror of frontend)
// ═══════════════════════════════════════════════════════════════════════════

export const ASMR_CATEGORIES: ASMRCategory[] = [
  {
    id: "food",
    name: "Food & Cooking",
    description: "Slicing, sizzling, crunching, and cooking sounds",
    suggestedVisualPrompt:
      "Cinematic extreme close-up of elegant hands with clean manicured nails slowly slicing through fresh vibrant vegetables on a pristine white marble cutting board, ultra sharp Japanese chef knife catching golden hour light, satisfying precision cuts revealing perfect cross-sections, morning sunlight streaming through kitchen window creating warm volumetric rays, shallow depth of field with creamy bokeh background, slow motion 120fps capturing every juice droplet and fiber separation, steam gently rising, professional food photography lighting setup with soft diffused key light, rich saturated colors, 8K ultra detailed texture of food surfaces, ASMR visual aesthetic, meditative calming atmosphere, studio quality production value",
    suggestedSoundPrompt:
      "Crystal clear high-fidelity ASMR audio capturing every crisp cutting sound, satisfying knife through vegetable crunch, juice releasing sounds, gentle chopping rhythm on wooden board, subtle kitchen ambient sounds, binaural 3D spatial audio recording, professional studio microphone quality",
    materials: ["food-crispy", "food-soft", "food-liquid", "water", "glass", "metal"],
  },
  {
    id: "triggers",
    name: "Classic Triggers",
    description: "Tapping, scratching, brushing, and clicking sounds",
    suggestedVisualPrompt:
      "Ultra close-up macro shot of beautifully manicured feminine hands with glossy nude nails gently tapping and scratching on luxurious textured surfaces, soft ethereal purple and pink gradient lighting creating dreamy atmosphere, extreme shallow depth of field with silky smooth bokeh orbs floating in background, slow deliberate hypnotic finger movements tracing patterns, alternating between dark polished wood grain texture and frosted glass surface, intimate ASMR perspective as if viewer is inches away, gentle rhythmic tapping creating visual pulse, fingernails catching sparkles of light, velvet fabric underneath, professional studio lighting with soft rim light highlighting finger contours, 4K macro lens detail showing every skin texture and nail reflection, deeply relaxing meditative visual experience",
    suggestedSoundPrompt:
      "Delicate binaural ASMR tapping sounds with perfect clarity, soft scratching textures creating tingles, gentle fingernail clicks on glass, hollow wood tapping resonance, fabric brushing whispers, layered multi-textural sound design, professional condenser microphone recording, 3D spatial audio positioning",
    materials: ["wood", "glass", "plastic", "metal", "fabric", "leather"],
  },
  {
    id: "nature",
    name: "Nature & Ambient",
    description: "Rain, forest, ocean, and natural soundscapes",
    suggestedVisualPrompt:
      "Breathtaking cinematic nature scene of gentle rain droplets falling on lush green forest leaves in ultra slow motion, each water bead perfectly formed catching diffused overcast light like tiny diamonds, macro close-up of rain sliding down vibrant emerald leaf surface creating mesmerizing water trails, misty fog rolling through ancient moss-covered trees in background, soft natural daylight filtering through dense canopy creating god rays, peaceful Japanese zen garden aesthetic, dewdrops collecting and dripping from leaf tips, ripples forming in small crystal clear puddle, extreme detail showing leaf veins and water surface tension, tranquil meditation visual, professional nature documentary cinematography, 8K HDR capturing full dynamic range of greens and water reflections, slow graceful camera movement, deeply calming atmospheric scene",
    suggestedSoundPrompt:
      "Immersive binaural nature soundscape with gentle rainfall on leaves, soft thunder in distance, forest bird songs, wind through trees, water droplets hitting various surfaces, creek bubbling, authentic field recording quality, layered ambient sound design, spatial 3D audio environment",
    materials: ["water", "sand", "wood", "paper"],
  },
  {
    id: "crafts",
    name: "Crafts & Making",
    description: "Clay, slime, art supplies, and creative making",
    suggestedVisualPrompt:
      "Hypnotic overhead shot of skilled hands slowly manipulating glossy iridescent slime with perfect consistency, stretching and folding in mesmerizing patterns, rainbow holographic shimmer catching studio lights, satisfying texture deformation in extreme slow motion, pristine white workspace with minimalist aesthetic, secondary angle showing slime being pressed into satisfying shapes, bubbles forming and popping, perfect viscosity creating smooth flowing movements, vibrant saturated candy colors - pink purple blue gradient, ASMR crafting visual with professional ring light reflection visible in glossy surface, clean manicured hands with subtle nail art, ultra detailed 4K macro showing every sparkle particle suspended in clear slime, deeply satisfying visual triggers, therapeutic art creation atmosphere, studio production quality lighting",
    suggestedSoundPrompt:
      "Deeply satisfying slime ASMR sounds with perfect squelching, stretching, and popping, bubble wrap crushing, clay molding wet sounds, crisp paper folding, kinetic sand crumbling, tactile material manipulation symphony, professional close-mic recording capturing every subtle texture sound",
    materials: ["clay", "slime", "paper", "sand", "soap", "foam"],
  },
  {
    id: "unboxing",
    name: "Unboxing & Products",
    description: "Package opening, product reveals, and tactile interactions",
    suggestedVisualPrompt:
      "Elegant luxury product unboxing experience on pristine matte black surface, soft dramatic lighting from above creating cinematic shadows, beautifully manicured hands slowly peeling premium packaging tape with satisfying precision, high-end minimalist white box with embossed logo being carefully opened, tissue paper rustling and parting to reveal mystery product, extreme close-up of fingers running across textured premium cardboard, magnetic closure clicking open, slow reveal building anticipation, Apple-style product photography aesthetic, shallow depth of field focusing on hands and package, subtle dust particles floating in light beams, ASMR unboxing visual perfection, professional studio setup with soft fill lights, 4K detail showing every packaging texture and material quality, luxurious premium feel, satisfying methodical unwrapping sequence",
    suggestedSoundPrompt:
      "Crisp premium packaging ASMR sounds, satisfying tape peeling, cardboard box opening creak, tissue paper crinkling and rustling, magnetic click closure, foam insert removal, product sliding from packaging, material handling sounds, high-fidelity close-microphone recording capturing every subtle crinkle and tap",
    materials: ["cardboard", "bubble-wrap", "paper", "plastic", "foam"],
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): ASMRCategory | undefined {
  return ASMR_CATEGORIES.find((c) => c.id === categoryId);
}

// ═══════════════════════════════════════════════════════════════════════════
// MATERIALS
// ═══════════════════════════════════════════════════════════════════════════

export const ASMR_MATERIALS: ASMRMaterial[] = [
  { id: "wood", name: "Wood", category: "solid", soundHint: "hollow tapping, warm resonance" },
  { id: "glass", name: "Glass", category: "solid", soundHint: "clear tapping, crisp clinking" },
  { id: "metal", name: "Metal", category: "solid", soundHint: "metallic ringing, sharp taps" },
  { id: "plastic", name: "Plastic", category: "solid", soundHint: "soft clicks, muted tapping" },
  { id: "fabric", name: "Fabric/Cloth", category: "soft", soundHint: "soft rustling, gentle swishing" },
  { id: "leather", name: "Leather", category: "soft", soundHint: "creaking, smooth rubbing" },
  { id: "paper", name: "Paper", category: "soft", soundHint: "crisp crinkling, page turning" },
  { id: "cardboard", name: "Cardboard", category: "soft", soundHint: "muted tapping, scratchy texture" },
  { id: "water", name: "Water", category: "liquid", soundHint: "splashing, droplets, pouring" },
  { id: "slime", name: "Slime", category: "tactile", soundHint: "squelching, stretching, popping" },
  { id: "clay", name: "Clay", category: "tactile", soundHint: "molding, pressing, smooth shaping" },
  { id: "sand", name: "Sand/Kinetic Sand", category: "tactile", soundHint: "satisfying crumbling, flowing" },
  { id: "soap", name: "Soap", category: "tactile", soundHint: "cutting, carving, shaving" },
  { id: "foam", name: "Foam", category: "tactile", soundHint: "squeaking, pressing, releasing" },
  { id: "bubble-wrap", name: "Bubble Wrap", category: "packaging", soundHint: "satisfying popping" },
  { id: "food-crispy", name: "Crispy Food", category: "food", soundHint: "crunching, breaking, snapping" },
  { id: "food-soft", name: "Soft Food", category: "food", soundHint: "slicing, spreading, squishing" },
  { id: "food-liquid", name: "Liquid/Sauce", category: "food", soundHint: "pouring, drizzling, bubbling" },
];

/**
 * Get materials by IDs
 */
export function getMaterialsByIds(ids: string[]): ASMRMaterial[] {
  return ASMR_MATERIALS.filter((m) => ids.includes(m.id));
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT ENHANCEMENT CONFIG
// ═══════════════════════════════════════════════════════════════════════════

export const PROMPT_ENHANCEMENT_CONFIG = {
  /** Model to use for prompt enhancement */
  model: "gpt-5-mini",
  /** Maximum tokens for response */
  maxTokens: 500,
  /** Temperature for creativity */
  temperature: 0.7,
};

/**
 * System prompt for enhancing ASMR video prompts
 */
export const PROMPT_ENHANCER_SYSTEM = `You are an expert ASMR video prompt engineer. Your task is to enhance user prompts for AI video generation to create satisfying, high-quality ASMR content.

Guidelines:
- Focus on CLOSE-UP shots and SLOW MOTION movements
- Emphasize TEXTURES, LIGHTING, and TACTILE details
- Include specific camera movements (slow pan, gentle zoom)
- Add atmospheric elements (soft lighting, bokeh, shallow depth of field)
- Keep the description VISUAL only (no audio descriptions)
- Make it cinematic and satisfying to watch
- Maximum 300 characters

Output ONLY the enhanced prompt, nothing else.`;
