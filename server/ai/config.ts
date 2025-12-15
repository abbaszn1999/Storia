import fs from "fs";
import path from "path";
import type { AiModelConfig, AiProviderConfig, AiProviderName } from "./types";

function loadEnvIfNeeded() {
  if (process.env.AI_ENV_LOADED) return;
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    process.env.AI_ENV_LOADED = "true";
    return;
  }
  const contents = fs.readFileSync(envPath, "utf-8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
  process.env.AI_ENV_LOADED = "true";
}

loadEnvIfNeeded();

function buildModelRecord(models: AiModelConfig[]): Record<string, AiModelConfig> {
  return models.reduce<Record<string, AiModelConfig>>((acc, model) => {
    acc[model.name] = model;
    return acc;
  }, {});
}

const openAiModels: AiModelConfig[] = [
  {
    name: "gpt-5.1",
    provider: "openai",
    metadata: {
      label: "GPT-5.1",
      description: "Newest flagship reasoning model",
      supports: ["text-generation", "function-calling"],
      reasoning: true,
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.00125,
      outputCostPer1KTokens: 0.01,
      cacheInputCostPer1KTokens: 0.000125,
    },
  },
  {
    name: "gpt-5",
    provider: "openai",
    metadata: {
      label: "GPT-5",
      description: "Flagship GPT-5 model",
      supports: ["text-generation", "function-calling"],
      reasoning: true,
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.00125,
      outputCostPer1KTokens: 0.01,
      cacheInputCostPer1KTokens: 0.000125,
    },
  },
  {
    name: "gpt-5-mini",
    provider: "openai",
    metadata: {
      label: "GPT-5 Mini",
      description: "Mid-tier GPT-5 series",
      supports: ["text-generation", "function-calling"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.00025,
      outputCostPer1KTokens: 0.002,
      cacheInputCostPer1KTokens: 0.000025,
    },
  },
  {
    name: "gpt-5-nano",
    provider: "openai",
    default: true,
    metadata: {
      label: "GPT-5 Nano",
      description: "Fast, cost-effective text model",
      supports: ["text-generation"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.00005,
      outputCostPer1KTokens: 0.0004,
      cacheInputCostPer1KTokens: 0.000005,
    },
  },
  {
    name: "gpt-4o",
    provider: "openai",
    metadata: {
      label: "GPT-4o",
      description: "High-quality multimodal model",
      supports: ["text-generation", "function-calling", "vision"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.0025,
      outputCostPer1KTokens: 0.01,
      cacheInputCostPer1KTokens: 0.00125,
    },
  },
  {
    name: "o4-mini",
    provider: "openai",
    metadata: {
      label: "o4 Mini",
      description: "Lightweight GPT-4o variant",
      supports: ["text-generation", "function-calling", "vision"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.0011,
      outputCostPer1KTokens: 0.0044,
      cacheInputCostPer1KTokens: 0.000275,
    },
  },
];

const geminiModels: AiModelConfig[] = [
  {
    name: "gemini-2.5-flash",
    provider: "gemini",
    default: true,
    metadata: {
      label: "Gemini 2.5 Flash",
      description:
        "Hybrid reasoning model with 1M context window and implicit caching",
      supports: ["text-generation", "function-calling", "vision"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.0003, // $0.30 / 1M tokens
      outputCostPer1KTokens: 0.0025, // $2.50 / 1M tokens
      cacheInputCostPer1KTokens: 0.00003, // $0.03 / 1M cached tokens
      cacheStorageCostPer1MTokensPerHour: 1.0,
    },
  },
  {
    name: "gemini-2.5-pro",
    provider: "gemini",
    metadata: {
      label: "Gemini 2.5 Pro",
      description:
        "State-of-the-art multipurpose model for coding and complex reasoning (<=200k token tier)",
      supports: ["text-generation", "function-calling", "vision"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.00125, // $1.25 / 1M tokens
      outputCostPer1KTokens: 0.01, // $10 / 1M tokens
      cacheInputCostPer1KTokens: 0.000125, // $0.125 / 1M cached tokens
      cacheStorageCostPer1MTokensPerHour: 4.5,
    },
  },
  {
    name: "gemini-3-pro-preview",
    provider: "gemini",
    metadata: {
      label: "Gemini 3 Pro Preview",
      description:
        "Top-tier multimodal/agentic model (pricing for prompts <=200k tokens)",
      supports: ["text-generation", "function-calling", "vision"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.002, // $2 / 1M tokens
      outputCostPer1KTokens: 0.012, // $12 / 1M tokens
      cacheInputCostPer1KTokens: 0.0002, // $0.20 / 1M cached tokens
      cacheStorageCostPer1MTokensPerHour: 4.5,
    },
  },
];

/**
 * Runware Model Identifiers:
 * Format: "provider:modelId@version" (e.g., "runware:100@1", "civitai:102438@133677")
 * The `runwareModelId` field in metadata contains the actual identifier to send to Runware API.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE MODELS
// ═══════════════════════════════════════════════════════════════════════════════
const runwareImageModels: AiModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // FLUX.2 Series (Black Forest Labs)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "flux-2-dev",
    provider: "runware",
    default: true,
    metadata: {
      label: "FLUX.2 Dev",
      description: "Latest FLUX.2 with medium acceleration",
      supports: ["image-generation"],
      defaultSteps: 28,
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "flux-2-pro",
    provider: "runware",
    metadata: {
      label: "FLUX.2 Pro",
      description: "Professional quality FLUX.2 generation",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "flux-2-flex",
    provider: "runware",
    metadata: {
      label: "FLUX.2 Flex",
      description: "Strongest text rendering accuracy in FLUX family. Designed for branded design, posters, and typography-driven work",
      supports: ["image-generation", "image-to-image"],
      defaultSteps: 50,
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Google Imagen (AIR: google:1@1, google:2@2)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "imagen-3.0",
    provider: "runware",
    metadata: {
      label: "Google Imagen 3.0",
      description: "Detailed, high-quality images with better lighting and fewer artifacts. Works for realistic and stylized visuals",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "imagen-4-ultra",
    provider: "runware",
    metadata: {
      label: "Google Imagen 4.0 Ultra",
      description: "Google's most advanced image model. Exceptional detail, color accuracy, and prompt adherence",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "imagen-4.0-preview",
    provider: "runware",
    metadata: {
      label: "Google Imagen 4.0 Preview",
      description: "Improved textures, lighting, and typography—especially useful for design-heavy or detail-focused work",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "imagen-4.0-ultra",
    provider: "runware",
    metadata: {
      label: "Google Imagen 4.0 Ultra",
      description: "Google's most advanced image model. Exceptional detail, color accuracy, and prompt adherence",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "imagen-4.0-fast",
    provider: "runware",
    metadata: {
      label: "Google Imagen 4.0 Fast",
      description: "Speed and quality optimized for quicker inference with minimal quality loss",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Gemini Image / Nano Banana (AIR: google:4@1, google:4@2)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "nano-banana",
    provider: "runware",
    metadata: {
      label: "Nano Banana (Gemini Flash Image 2.5)",
      description: "Rapid, interactive image workflows with multi-image fusion and conversational editing. Includes SynthID watermark",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "nano-banana-2-pro",
    provider: "runware",
    metadata: {
      label: "Nano Banana 2 Pro (Gemini 3 Pro Image)",
      description: "Professional-grade with advanced text rendering, up to 4K. Supports 14 reference images. Includes SynthID watermark",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Midjourney (AIR: midjourney:3@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "midjourney-v7",
    provider: "runware",
    metadata: {
      label: "Midjourney V7",
      description: "Next-gen Midjourney with cinematic imagery, fluid brushwork, atmospheric tone. Improvements in realism, texture, lighting, and photographic quality",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Ideogram (AIR: ideogram:4@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "ideogram-3.0",
    provider: "runware",
    metadata: {
      label: "Ideogram 3.0",
      description: "Design-level generation with sharper text rendering and better composition. Perfect for graphic-driven content",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // OpenAI GPT Image (AIR: openai:1@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "gpt-image-1",
    provider: "runware",
    metadata: {
      label: "GPT Image 1",
      description: "GPT-4o architecture for high-fidelity images with enhanced prompt following, superior text rendering, and precise inpainting",
      supports: ["image-generation", "image-to-image", "inpainting"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Seedream / ByteDance (AIR: bytedance:5@0, bytedance:seedream@4.5)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "seedream-4.0",
    provider: "runware",
    metadata: {
      label: "Seedream 4.0",
      description: "Ultra-fast 2K/4K rendering with sequential image capabilities. Maintains character consistency across outputs. Supports up to 14 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "seedream-4.5",
    provider: "runware",
    metadata: {
      label: "Seedream 4.5",
      description: "Production-focused with improved face rendering and text quality. Better multi-image fusion, sharp 2K/4K output",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "2048x2048",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO MODELS
// ═══════════════════════════════════════════════════════════════════════════════
const runwareVideoModels: AiModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // OpenAI Sora 2 (AIR: openai:3@1, openai:3@2)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "sora-2",
    provider: "runware",
    metadata: {
      label: "Sora 2",
      description: "OpenAI's next-gen video with accurate physics, synchronized dialogue, high-fidelity visuals. T2V/I2V, 4/8/12s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  {
    name: "sora-2-pro",
    provider: "runware",
    metadata: {
      label: "Sora 2 Pro",
      description: "Higher-quality Sora 2 with additional resolutions (7:4, 4:7), refined control, better consistency for professional use",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Runway (AIR: runway:1@1, runway:2@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "runway-gen4-turbo",
    provider: "runware",
    metadata: {
      label: "Runway Gen-4 Turbo",
      description: "High-speed I2V with dynamic, cinematic motion. Transforms single image into video in seconds. 2-10s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 10,
    },
  },
  {
    name: "runway-aleph",
    provider: "runware",
    metadata: {
      label: "Runway Aleph",
      description: "Flagship V2V model for realism and storytelling. Transforms videos with cinematic precision. Supports 1 reference image",
      supports: ["video-generation", "video-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Vidu (AIR: vidu:3@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "vidu-q2-pro",
    provider: "runware",
    metadata: {
      label: "Vidu Q2 Pro",
      description: "Extremely high-quality with delicate motion portrayal. Ideal for professional film/TV. Supports first/last frame and 7 reference images. 24 FPS, 1-8s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 8,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Riverflow (AIR: sourceful:2@3)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "riverflow-2-max",
    provider: "runware",
    metadata: {
      label: "Riverflow 2 Preview Max",
      description: "Highest-quality Riverflow 2 focused on maximum detail, lighting control, and accuracy for demanding commercial work",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // PixVerse (AIR: pixverse:1@6)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "pixverse-v5.5",
    provider: "runware",
    metadata: {
      label: "PixVerse v5.5",
      description: "Multi-image fusion for character consistency. Comprehensive audio (music, SFX, dialogue), multi-shot camera control. T2V/I2V, 5/8/10s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // MiniMax Hailuo (AIR: minimax:4@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "hailuo-2.3",
    provider: "runware",
    metadata: {
      label: "MiniMax Hailuo 2.3",
      description: "Cinematic storytelling with lifelike human physics and precise prompt adherence. Fluid movement, emotional realism, consistent scene composition. 25 FPS",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "768p",
      defaultDuration: 6,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // KlingAI (AIR: klingai:5@3, klingai:6@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "klingai-2.5-turbo-pro",
    provider: "runware",
    metadata: {
      label: "KlingAI 2.5 Turbo Pro",
      description: "Next-level creativity with turbocharged motion and cinematic visuals. Enhanced motion fluidity with professional-grade capabilities. 30 FPS, 5/10s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  {
    name: "klingai-2.1-master",
    provider: "runware",
    metadata: {
      label: "KlingAI 2.1 Master",
      description: "Peak of KlingAI stack. Full HD I2V, ultra-fluid motion, exceptional prompt precision for VFX-grade output. 24 FPS, 5/10s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Google Veo (AIR: google:3@0, google:3@2)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "veo-3.0",
    provider: "runware",
    metadata: {
      label: "Google Veo 3.0",
      description: "Native audio generation with synchronized dialogue, music, and sound effects. T2V/I2V, 8s duration, 24 FPS. enhancePrompt always enabled",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  {
    name: "veo-3.1",
    provider: "runware",
    metadata: {
      label: "Google Veo 3.1",
      description: "Newest Veo for cinematic video. Realistic, story-driven scenes with natural sound and smooth motion. Supports typed image roles (asset/style)",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // ByteDance Seedance (AIR: bytedance:2@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "seedance-1.0-pro",
    provider: "runware",
    metadata: {
      label: "Seedance 1.0 Pro",
      description: "ByteDance flagship video with cinematic storytelling, multi-shot support, up to 1080p. First/last frame control. 24 FPS, 1.2-12s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Lightricks LTX-2 Pro (AIR: lightricks:2@0)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "ltx-2-pro",
    provider: "runware",
    metadata: {
      label: "LTX-2 Pro",
      description: "Professional cinematic video with realistic motion, precise lighting control. Native audio. 1080p-4K, 25/50 FPS, 6-10s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 6,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Ideogram (AIR: ideogram:4@1) - Image model
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "ideogram-3.0",
    provider: "runware",
    metadata: {
      label: "Ideogram 3.0",
      description: "Design-level generation with sharper text rendering and better composition. Greater stylistic control for graphic-driven content",
      supports: ["image-generation"],
      defaultResolution: "1024x1024",
    },
  },
];

// Combine all Runware models
const runwareModels: AiModelConfig[] = [...runwareImageModels, ...runwareVideoModels];

// ═══════════════════════════════════════════════════════════════════════════════
// ELEVENLABS MODELS
// ═══════════════════════════════════════════════════════════════════════════════
const elevenlabsModels: AiModelConfig[] = [
  {
    name: "eleven-v3",
    provider: "elevenlabs",
    default: true,
    metadata: {
      label: "Eleven v3 (Latest)",
      description: "Most emotionally rich and expressive speech synthesis. 70+ languages, dramatic delivery, natural multi-speaker dialogue",
      supports: ["text-to-speech"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.30, // ~$0.30 per 1000 characters
    },
  },
  {
    name: "tts-multilingual-v2",
    provider: "elevenlabs",
    metadata: {
      label: "Text-to-Speech Multilingual V2",
      description: "Lifelike, consistent quality. 29 languages, most stable for long-form",
      supports: ["text-to-speech"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.30, // ~$0.30 per 1000 characters
    },
  },
  {
    name: "tts-flash-v2.5",
    provider: "elevenlabs",
    metadata: {
      label: "Flash v2.5 (Ultra-Fast)",
      description: "Ultra-low latency ~75ms. 32 languages, 50% lower price",
      supports: ["text-to-speech"],
    },
    pricing: {
      currency: "usd",
      inputCostPer1KTokens: 0.15, // 50% lower than v2
    },
  },
  {
    name: "sound-effects",
    provider: "elevenlabs",
    metadata: {
      label: "Sound Effects",
      description: "Generate sound effects from text descriptions using ElevenLabs AI",
      supports: ["sound-effects"],
    },
    pricing: {
      currency: "usd",
      flatCostPerCall: 0.05, // Pro tier: $0.05 per generation
    },
  },
];

/**
 * Maps friendly model names to their Runware API model identifiers.
 * Use this when building payloads for Runware API calls.
 * NOTE: Many IDs need verification from Runware dashboard/docs.
 */
export const runwareModelIdMap: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  // FLUX.2 Series
  "flux-2-dev": "runware:400@1",
  "flux-2-pro": "bfl:5@1",
  "flux-2-flex": "bfl:6@1",

  // Google Imagen
  "imagen-3.0": "google:1@1",
  "imagen-4.0-preview": "google:2@1",  // ✅ Added
  "imagen-4.0-ultra": "google:2@2",
  "imagen-4-ultra": "google:2@2",      // Alias for backwards compatibility
  "imagen-4.0-fast": "google:2@3",     // ✅ Added

  // Gemini Image (Nano Banana)
  "nano-banana": "google:4@1",
  "nano-banana-2-pro": "google:4@2",

  // Midjourney
  "midjourney-v7": "midjourney:3@1",

  // Ideogram
  "ideogram-3.0": "ideogram:4@1",      // ✅ Added

  // OpenAI GPT Image
  "gpt-image-1": "openai:1@1",

  // Seedream (ByteDance) - Image
  "seedream-4.0": "bytedance:5@0",
  "seedream-4.5": "bytedance:seedream@4.5",

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  // ByteDance Seedance - Video
  "seedance-1.0-pro": "bytedance:2@1",

  // OpenAI Sora 2
  "sora-2": "openai:3@1",
  "sora-2-pro": "openai:3@2",
  // Runway
  "runway-gen4-turbo": "runway:1@1",
  "runway-aleph": "runway:2@1",
  // Vidu
  "vidu-q2-pro": "vidu:3@1",
  // Riverflow
  "riverflow-2-max": "sourceful:2@3",
  // PixVerse
  "pixverse-v5.5": "pixverse:1@6",
  // MiniMax Hailuo
  "hailuo-2.3": "minimax:4@1",
  // KlingAI
  "klingai-2.5-turbo-pro": "klingai:6@1",
  "klingai-2.1-master": "klingai:5@3",
  // Google Veo
  "veo-3.0": "google:3@0",
  "veo-3.1": "google:3@2",
  // LTX (Lightricks)
  "ltx-2-pro": "lightricks:2@0",
};

/**
 * Get the Runware API model identifier from a friendly model name.
 * Falls back to the input if no mapping exists (allows direct ID usage).
 */
export function getRunwareModelId(friendlyName: string): string {
  return runwareModelIdMap[friendlyName] ?? friendlyName;
}

/**
 * Get all available image models for Runware
 */
export function getRunwareImageModels(): AiModelConfig[] {
  return runwareImageModels;
}

/**
 * Get all available video models for Runware
 */
export function getRunwareVideoModels(): AiModelConfig[] {
  return runwareVideoModels;
}

export const aiProviders: Record<AiProviderName, AiProviderConfig> = {
  openai: {
    name: "openai",
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    organizationId: process.env.OPENAI_ORG_ID,
    enabled: Boolean(process.env.OPENAI_API_KEY),
    models: buildModelRecord(openAiModels),
  },
  gemini: {
    name: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl:
      process.env.GEMINI_API_BASE ??
      "https://generativelanguage.googleapis.com/v1beta",
    enabled: Boolean(process.env.GEMINI_API_KEY),
    models: buildModelRecord(geminiModels),
  },
  runware: {
    name: "runware",
    apiKey: process.env.RUNWARE_API_KEY,
    baseUrl:
      process.env.RUNWARE_BASE_URL ?? "https://api.runware.ai/v1",
    enabled: Boolean(process.env.RUNWARE_API_KEY),
    models: buildModelRecord(runwareModels),
  },
  elevenlabs: {
    name: "elevenlabs",
    apiKey: process.env.ELEVENLABS_API_KEY,
    baseUrl:
      process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io/v1",
    enabled: Boolean(process.env.ELEVENLABS_API_KEY),
    models: buildModelRecord(elevenlabsModels),
  },
};

export function getProviderConfig(provider: AiProviderName): AiProviderConfig {
  const config = aiProviders[provider];
  if (!config) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }
  return config;
}

export function getModelConfig(
  provider: AiProviderName,
  model: string,
): AiModelConfig {
  const providerConfig = getProviderConfig(provider);
  const modelConfig = providerConfig.models[model];
  if (!modelConfig) {
    throw new Error(
      `Model "${model}" is not defined for provider "${provider}"`,
    );
  }
  return modelConfig;
}

export function isProviderEnabled(provider: AiProviderName): boolean {
  return Boolean(getProviderConfig(provider).enabled);
}

