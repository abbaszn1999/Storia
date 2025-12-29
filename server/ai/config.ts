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
    name: "gpt-5.2",
    provider: "openai",
    metadata: {
      label: "GPT-5.2",
      description: "Latest flagship reasoning model with enhanced capabilities and 400K context window",
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
// IMAGE MODELS (Synced with server/ai/config/image-models.ts)
// ═══════════════════════════════════════════════════════════════════════════════
const runwareImageModels: AiModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // OpenAI GPT Image (AIR: openai:1@1, openai:4@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "openai-gpt-image-1",
    provider: "runware",
    metadata: {
      label: "OpenAI GPT Image 1",
      description: "GPT-4o architecture for high-fidelity images with enhanced prompt following, superior text rendering. Supports up to 16 reference images",
      supports: ["image-generation", "image-to-image", "inpainting"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "openai-gpt-image-1.5",
    provider: "runware",
    metadata: {
      label: "OpenAI GPT Image 1.5",
      description: "Newest flagship powering ChatGPT Images. Faster with enhanced instruction following and precise edits. Supports up to 16 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Runway Gen-4 Image (AIR: runway:4@1, runway:4@2)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "runway-gen-4-image",
    provider: "runware",
    metadata: {
      label: "Runway Gen-4 Image",
      description: "High-fidelity with advanced stylistic control and visual consistency. Reference tags system (@tag). Supports up to 3 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1920x1080",
    },
  },
  {
    name: "runway-gen-4-image-turbo",
    provider: "runware",
    metadata: {
      label: "Runway Gen-4 Image Turbo",
      description: "Faster variant for rapid iterations. Requires 1-3 reference images. Reference tags system (@tag) supported",
      supports: ["image-to-image"],
      defaultResolution: "1920x1080",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Kling IMAGE O1 (AIR: klingai:kling-image@o1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "kling-image-o1",
    provider: "runware",
    metadata: {
      label: "Kling IMAGE O1",
      description: "High-control for consistent character handling, precise modification. Strong stylization. Supports up to 10 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Ideogram 3.0 (AIR: ideogram:4@1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "ideogram-3.0",
    provider: "runware",
    metadata: {
      label: "Ideogram 3.0",
      description: "Design-level generation with sharper text rendering and better composition. Enhanced stylistic control for graphic-driven content",
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
    default: true,
    metadata: {
      label: "Nano Banana (Gemini Flash 2.5)",
      description: "Rapid, interactive workflows with multi-image fusion and conversational editing. Supports up to 8 reference images. SynthID watermark",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "nano-banana-2-pro",
    provider: "runware",
    metadata: {
      label: "Nano Banana 2 Pro (Gemini 3 Pro)",
      description: "Professional-grade with advanced text rendering, up to 4K. Supports 14 reference images. SynthID watermark",
      supports: ["image-generation", "image-to-image"],
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
      description: "Ultra-fast 2K/4K rendering with sequential image capabilities. Maintains character consistency. Supports up to 14 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "seedream-4.5",
    provider: "runware",
    metadata: {
      label: "Seedream 4.5",
      description: "Production-focused with fixed face distortion and improved text rendering. Sharp 2K/4K output. Supports up to 14 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "2048x2048",
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // FLUX.2 Series (Black Forest Labs) - AIR: runware:400@1, bfl:5@1, bfl:6@1, bfl:7@1
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "flux-2-dev",
    provider: "runware",
    metadata: {
      label: "FLUX.2 [dev]",
      description: "Open weights release with full architectural control. Supports seed for reproducible results. Up to 4 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultSteps: 28,
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "flux-2-pro",
    provider: "runware",
    metadata: {
      label: "FLUX.2 [pro]",
      description: "Production-ready with robust reference-image editing. Built for reliability and speed. Up to 9 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "flux-2-flex",
    provider: "runware",
    metadata: {
      label: "FLUX.2 [flex]",
      description: "Strongest text rendering accuracy in FLUX family. Fine-grained control for branded design, posters, typography. Up to 10 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultSteps: 50,
      defaultResolution: "1024x1024",
    },
  },
  {
    name: "flux-2-max",
    provider: "runware",
    metadata: {
      label: "FLUX.2 [max]",
      description: "Pinnacle of FLUX.2 family. Professional-grade visual intelligence with grounded generation (real-world context). Up to 8 reference images",
      supports: ["image-generation", "image-to-image"],
      defaultResolution: "1920x1080",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO MODELS
// ═══════════════════════════════════════════════════════════════════════════════
const runwareVideoModels: AiModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // OpenAI Sora 2 Pro (AIR: openai:3@2)
  // ─────────────────────────────────────────────────────────────────────────────
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
  // Runway Gen-4 Turbo (AIR: runway:1@1)
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
  // KlingAI (AIR: klingai:5@2, klingai:5@3, klingai:6@1, klingai:kling-video@2.6-pro, klingai:kling@o1)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "klingai-2.1-pro",
    provider: "runware",
    metadata: {
      label: "KlingAI 2.1 Pro",
      description: "Full HD 1080p with higher frame fidelity. Image-to-video only. First/last frame control. 24 FPS, 5/10s",
      supports: ["image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  {
    name: "klingai-2.5-turbo-pro",
    provider: "runware",
    metadata: {
      label: "KlingAI 2.5 Turbo Pro",
      description: "Turbocharged motion with cinematic visuals. 720p only. First/last frame control. 30 FPS, 5/10s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 5,
    },
  },
  {
    name: "kling-video-2.6-pro",
    provider: "runware",
    metadata: {
      label: "Kling VIDEO 2.6 Pro",
      description: "Native synchronized audio (dialogue, SFX, ambience). 1080p. First frame control. 30 FPS, 5/10s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  {
    name: "kling-video-o1",
    provider: "runware",
    metadata: {
      label: "Kling VIDEO O1",
      description: "Unified multimodal foundation model. High-control with generation + editing + visual compositing. 1-7 reference images. 30 FPS, 3-10s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Google Veo (AIR: google:3@0, google:3@1, google:3@2, google:3@3)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "veo-3.0",
    provider: "runware",
    metadata: {
      label: "Google Veo 3.0",
      description: "Native audio (dialogue, music, SFX). First frame control. 24 FPS, 8s duration. enhancePrompt always enabled",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  {
    name: "veo-3-fast",
    provider: "runware",
    metadata: {
      label: "Google Veo 3 Fast",
      description: "Fast & affordable variant with native audio. First/last frame control. 24 FPS, 8s duration",
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
      description: "Cinematic with natural sound. First/last frame + video extension. Typed image roles (asset/style). 24 FPS, 8s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  {
    name: "veo-3.1-fast",
    provider: "runware",
    metadata: {
      label: "Google Veo 3.1 Fast",
      description: "Ultra-low latency variant. Natural sound + video extension. First/last frame control. 24 FPS, 8s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 8,
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // ByteDance Seedance (AIR: bytedance:2@1, bytedance:seedance@1.5-pro)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "seedance-1.0-pro",
    provider: "runware",
    default: true,
    metadata: {
      label: "Seedance 1.0 Pro",
      description: "ByteDance flagship video with cinematic storytelling, multi-shot support, up to 1080p. First/last frame control. 24 FPS, 2-12s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "1080p",
      defaultDuration: 5,
    },
  },
  {
    name: "seedance-1.5-pro",
    provider: "runware",
    metadata: {
      label: "Seedance 1.5 Pro",
      description: "Next-gen ByteDance with native synchronized audio. First/last frame control. 24 FPS, 4-12s duration",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
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
  // Alibaba Wan (AIR: alibaba:wan@2.6)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "alibaba-wan-2.6",
    provider: "runware",
    metadata: {
      label: "Alibaba Wan 2.6",
      description: "Multimodal with native audio + custom audio input. Multi-shot sequencing. Reference videos up to 3. 24 FPS, 5/10/15s",
      supports: ["video-generation", "image-to-video"],
      defaultResolution: "720p",
      defaultDuration: 5,
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
  {
    name: "music-v1",
    provider: "elevenlabs",
    metadata: {
      label: "Music Generation",
      description: "AI-generated instrumental music from text prompts. 10s-5min duration, commercial use licensed.",
      supports: ["music-generation"],
    },
    pricing: {
      currency: "usd",
      // ElevenLabs Music pricing: based on duration
      // Approximately $0.50 per 1000ms (1 second) of audio
      inputCostPer1KTokens: 0.50,
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
  // IMAGE MODELS (Synced with server/ai/config/image-models.ts)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // OpenAI GPT Image (AIR: openai:1@1, openai:4@1)
  "openai-gpt-image-1": "openai:1@1",
  "openai-gpt-image-1.5": "openai:4@1",

  // Runway Gen-4 Image (AIR: runway:4@1, runway:4@2)
  "runway-gen-4-image": "runway:4@1",
  "runway-gen-4-image-turbo": "runway:4@2",

  // Kling IMAGE O1 (AIR: klingai:kling-image@o1)
  "kling-image-o1": "klingai:kling-image@o1",

  // Ideogram 3.0 (AIR: ideogram:4@1)
  "ideogram-3.0": "ideogram:4@1",

  // Gemini Image / Nano Banana (AIR: google:4@1, google:4@2)
  "nano-banana": "google:4@1",
  "nano-banana-2-pro": "google:4@2",

  // Seedream / ByteDance (AIR: bytedance:5@0, bytedance:seedream@4.5)
  "seedream-4.0": "bytedance:5@0",
  "seedream-4.5": "bytedance:seedream@4.5",

  // FLUX.2 Series (AIR: runware:400@1, bfl:5@1, bfl:6@1, bfl:7@1)
  "flux-2-dev": "runware:400@1",
  "flux-2-pro": "bfl:5@1",
  "flux-2-flex": "bfl:6@1",
  "flux-2-max": "bfl:7@1",

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO MODELS
  // ═══════════════════════════════════════════════════════════════════════════
  // ByteDance Seedance - Video
  "seedance-1.0-pro": "bytedance:2@1",
  "seedance-1.5-pro": "bytedance:seedance@1.5-pro",  // ✅ Added - Next-gen with native audio

  // KlingAI Video Models
  "klingai-2.1-pro": "klingai:5@2",
  "klingai-2.5-turbo-pro": "klingai:6@1",
  "kling-video-2.6-pro": "klingai:kling-video@2.6-pro",
  "kling-video-o1": "klingai:kling@o1",

  // Google Veo Models
  "veo-3.0": "google:3@0",
  "veo-3-fast": "google:3@1",                        // ✅ Added - Fast & affordable variant
  "veo-3.1": "google:3@2",
  "veo-3.1-fast": "google:3@3",                      // ✅ Added - Ultra-low latency

  // OpenAI Sora 2
  "sora-2-pro": "openai:3@2",

  // Runway
  "runway-gen4-turbo": "runway:1@1",

  // PixVerse
  "pixverse-v5.5": "pixverse:1@6",

  // MiniMax Hailuo
  "hailuo-2.3": "minimax:4@1",

  // LTX (Lightricks)
  "ltx-2-pro": "lightricks:2@0",

  // Alibaba Wan
  "alibaba-wan-2.6": "alibaba:wan@2.6",
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

// Re-export video model configurations for backward compatibility
export {
  VIDEO_MODEL_CONFIGS,
  DIMENSION_MAP,
  MODEL_DIMENSIONS,
  getDefaultVideoModel,
  getAvailableVideoModels,
  getDimensions,
  getVideoModelConstraints,
  getSupportedResolutionsForAspectRatio,
  type VideoModelConfig,
  type VideoDimensions,
  type VideoModelConstraints,
} from './config/video-models';

// Re-export image model configurations for backward compatibility
export {
  IMAGE_MODEL_CONFIGS,
  IMAGE_DIMENSION_MAP,
  MODEL_SPECIFIC_DIMENSIONS,
  getImageModelConfig,
  getDefaultImageModel,
  getAvailableImageModels,
  getImageDimensions,
  aspectRatioToDimensions,
  type ImageModelConfig,
  type ImageDimensions,
} from './config/image-models';

