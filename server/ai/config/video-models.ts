// Shared Video Model Configurations
// Used across all story modes (ASMR, Problem-Solution, Before-After, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export interface VideoDimensions {
  width: number;
  height: number;
}

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | "9:21" | "7:4" | "4:7" | "17:13" | "13:17";
export type Resolution = "360p" | "480p" | "540p" | "720p" | "768p" | "832p" | "960p" | "1080p" | "1440p" | "2160p";

export interface VideoModelConfig {
  id: string;
  label: string;
  modelAirId?: string;  // Runware model AIR ID (e.g., "bytedance:2@1")
  durations: number[];
  aspectRatios: AspectRatio[];
  resolutions: Resolution[];
  hasAudio: boolean;
  supportsFrameImages: boolean;
  frameImageSupport?: {
    first: boolean;
    last: boolean;
  };
  technicalSpecs?: {
    fps: number;
    minPromptLength: number;
    maxPromptLength: number;
    supportedWorkflows?: string[];
    inputImageRequirements?: {
      minWidth: number;
      maxWidth: number;
      minHeight: number;
      maxHeight: number;
      maxFileSize: string;  // e.g., "10MB"
    };
  };
  providerSettings?: Record<string, Record<string, any>>;
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
  // Model AIR ID: bytedance:2@1
  // Duration: 1.2-12 seconds (0.1s increments) | FPS: 24 | Prompt: 2-3000 chars
  // Supports: Text-to-video, Image-to-video
  // Frame Images: ✅ First AND Last frame supported
  // ─────────────────────────────────────────────────────────────────────────
  "seedance-1.0-pro": {
    id: "seedance-1.0-pro",
    label: "Seedance 1.0 Pro",
    modelAirId: "bytedance:2@1",
    durations: [2, 4, 5, 6, 8, 10, 12],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
    resolutions: ["480p", "720p", "1080p"],
    hasAudio: false,
    default: true,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 2,
      maxPromptLength: 3000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 6000,
        minHeight: 300,
        maxHeight: 6000,
        maxFileSize: "10MB",
      },
    },
    providerSettings: {
      bytedance: {
        cameraFixed: false,  // Set to true to lock camera movement
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Seedance 1.5 Pro - ByteDance (Next Generation)
  // Model AIR ID: bytedance:seedance@1.5-pro
  // Duration: 4-12 seconds or "auto" | FPS: 24 | Prompt: 2-3000 chars
  // Supports: Text-to-video, Image-to-video
  // Frame Images: ✅ First AND Last frame supported
  // Audio: ✅ Native synchronized audio generation
  // ─────────────────────────────────────────────────────────────────────────
  "seedance-1.5-pro": {
    id: "seedance-1.5-pro",
    label: "Seedance 1.5 Pro",
    modelAirId: "bytedance:seedance@1.5-pro",
    durations: [4, 5, 6, 8, 10, 12],  // 4-12 seconds (can also use "auto")
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    resolutions: ["480p", "720p"],
    hasAudio: true,  // ✅ Native synchronized audio support
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 2,
      maxPromptLength: 3000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 6000,
        minHeight: 300,
        maxHeight: 6000,
        maxFileSize: "10MB",
      },
    },
    providerSettings: {
      bytedance: {
        audio: true,         // Enable native synchronized audio
        cameraFixed: false,  // Set to true to lock camera movement
      },
    },
  },

 // ─────────────────────────────────────────────────────────────────────────
  // KlingAI 2.1 Pro - Higher Frame Fidelity & Full HD
  // Model AIR ID: klingai:5@2 | Image-to-video ONLY | 24 FPS
  // Dimensions: 1920×1080, 1080×1080, 1080×1920 (Full HD 1080p)
  // Frame Images: ✅ First AND Last frame supported
  // CFG Scale: 0-1 (default: 0.5) for prompt adherence control
  // Middle ground between Standard and Master tiers
  // ─────────────────────────────────────────────────────────────────────────
  "klingai-2.1-pro": {
    id: "klingai-2.1-pro",
    label: "KlingAI 2.1 Pro",
    modelAirId: "klingai:5@2",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["1080p"],  // Full HD 1080p (1920×1080, 1080×1080, 1080×1920)
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 0,  // No prompt needed for I2V only
      maxPromptLength: 0,  // Image-to-video only, no text prompt
      supportedWorkflows: ["image-to-video"],  // Image-to-video ONLY
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      klingai: {
        cfgScale: 0.5,  // 0-1 range, controls prompt adherence (default: 0.5)
      },
    },
  },



  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI 2.5 Turbo Pro
  // Model AIR ID: klingai:6@1 | Prompt: 2-2500 chars | 30 FPS
  // Dimensions: 1280×720, 720×720, 720×1280 (720p only)
  // Frame Images: ✅ First AND Last frame supported
  // CFG Scale: 0-1 (default: 0.5) for prompt adherence control
  // ─────────────────────────────────────────────────────────────────────────
  "klingai-2.5-turbo-pro": {
    id: "klingai-2.5-turbo-pro",
    label: "KlingAI 2.5 Turbo Pro",
    modelAirId: "klingai:6@1",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["720p"],  // Only 720p supported (1280×720, 720×720, 720×1280)
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 30,  // 30 FPS for turbocharged motion
      minPromptLength: 2,
      maxPromptLength: 2500,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      klingai: {
        cfgScale: 0.5,  // 0-1 range, controls prompt adherence (default: 0.5)
      },
    },
  },

 

  // ─────────────────────────────────────────────────────────────────────────
  // Kling VIDEO 2.6 Pro - Next Generation with Native Audio
  // Model AIR ID: klingai:kling-video@2.6-pro | Prompt: 2-2500 chars
  // Dimensions: 1920×1080, 1080×1080, 1080×1920 (1080p)
  // Frame Images: ✅ First frame supported
  // Audio: ✅ Native synchronized audio (dialogue, sound effects, ambience)
  // CFG Scale: 0-1 (default: 0.5) for prompt adherence control
  // ─────────────────────────────────────────────────────────────────────────
  "kling-video-2.6-pro": {
    id: "kling-video-2.6-pro",
    label: "Kling VIDEO 2.6 Pro",
    modelAirId: "klingai:kling-video@2.6-pro",
    durations: [5, 10],
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["1080p"],  // Only 1080p supported (1920×1080, 1080×1080, 1080×1920)
    hasAudio: true,  // ✅ Native synchronized audio support
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 30,  // Assuming 30 FPS like 2.5 Turbo Pro
      minPromptLength: 2,
      maxPromptLength: 2500,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      klingai: {
        sound: true,    // Enable native synchronized audio
        cfgScale: 0.5,  // 0-1 range, controls prompt adherence (default: 0.5)
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Kling VIDEO O1 - Unified Multimodal Video Foundation Model
  // Model AIR ID: klingai:kling@o1 | Prompt: 2-2500 chars
  // Dimensions: 1920×1080, 1080×1080, 1080×1920 (1080p)
  // Frame Images: ✅ First AND Last frame (image-to-video only)
  // Reference Images: 1-7 images (reference-to-video), up to 4 (video-edit)
  // High-control workflows: generation + editing + visual compositing
  // ─────────────────────────────────────────────────────────────────────────
  "kling-video-o1": {
    id: "kling-video-o1",
    label: "Kling VIDEO O1",
    modelAirId: "klingai:kling@o1",
    durations: [5, 10],   // Image-to-video: 5 or 10 seconds only (text-to-video also 5 or 10)
    aspectRatios: ["16:9", "1:1", "9:16"],
    resolutions: ["1080p"],  // Only 1080p supported (1920×1080, 1080×1080, 1080×1920)
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame (image-to-video only)
      last: true,    // ✅ Supports last frame (image-to-video only)
    },
    technicalSpecs: {
      fps: 30,  // Assuming 30 FPS like other Kling models
      minPromptLength: 2,
      maxPromptLength: 2500,
      supportedWorkflows: ["text-to-video", "image-to-video", "reference-to-video", "video-edit"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 1920,
        minHeight: 300,
        maxHeight: 1920,
        maxFileSize: "32MB",  // 32MB limit
      },
    },
    providerSettings: {
      klingai: {
        keepOriginalSound: false,  // Keep original sound in video-edit mode
        fast: false,               // Enable fast mode (6-20s video-edit)
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.0 (Has Native Audio - generateAudio)
  // Model AIR ID: google:3@0 | Duration: 8s | FPS: 24 | Prompt: 2-3000 chars
  // Native audio: dialogue, music, sound effects | enhancePrompt always ON
  // Frame Images: ✅ First frame supported
  // Image input: 300-2048px, 20MB max
  // ─────────────────────────────────────────────────────────────────────────
  "veo-3.0": {
    id: "veo-3.0",
    label: "Google Veo 3.0",
    modelAirId: "google:3@0",
    durations: [8],                          // 8 seconds only
    aspectRatios: ["16:9", "9:16"],          // Only these two
    resolutions: ["720p", "1080p"],          // 1280×720, 1920×1080, 720×1280, 1080×1920
    hasAudio: true,                          // Native audio via providerSettings.google.generateAudio
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 2,
      maxPromptLength: 3000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      google: {
        generateAudio: true,   // Enable native synchronized audio
        enhancePrompt: true,   // Always enabled, cannot be disabled
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3 Fast - Faster & Cost-Effective Variant
  // Model AIR ID: google:3@1 | Duration: 8s | FPS: 24 | Prompt: 2-3000 chars
  // Native audio: dialogue, music, sound effects | enhancePrompt always ON
  // Frame Images: ✅ First AND Last frame supported
  // Optimized for speed and affordability
  // Image input: 300-2048px, 20MB max
  // ─────────────────────────────────────────────────────────────────────────
  "veo-3-fast": {
    id: "veo-3-fast",
    label: "Google Veo 3 Fast",
    modelAirId: "google:3@1",
    durations: [8],                          // 8 seconds only
    aspectRatios: ["16:9", "9:16"],          // Only these two
    resolutions: ["720p", "1080p"],          // 1280×720, 1920×1080, 720×1280, 1080×1920
    hasAudio: true,                          // Native audio via providerSettings.google.generateAudio
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 2,
      maxPromptLength: 3000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      google: {
        generateAudio: true,   // Enable native synchronized audio
        enhancePrompt: true,   // Always enabled, cannot be disabled
      },
    },
  },


  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.1 (Has Native Audio - Natural Sound)
  // Model AIR ID: google:3@2 | Prompt: 2-3000 chars | 24 FPS
  // Duration: 8 seconds (or 7s for video extension)
  // Frame Images: ✅ First AND Last frame supported
  // Reference Images: ✅ Asset (up to 3) or Style (1) images
  // Video Extension: ✅ Extend videos by 7 seconds
  // Cinematic, story-driven with natural sound and smooth motion
  // ─────────────────────────────────────────────────────────────────────────
  "veo-3.1": {
    id: "veo-3.1",
    label: "Google Veo 3.1",
    modelAirId: "google:3@2",
    durations: [8],  // 8 seconds (7s for video extension)
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],  // 1280×720, 1920×1080, 720×1280, 1080×1920
    hasAudio: true,  // Natural sound
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 2,
      maxPromptLength: 3000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      google: {
        generateAudio: true,    // Enable natural sound generation
        enhancePrompt: true,    // Always enabled, cannot be disabled
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.1 Fast - Ultra-Low Latency Variant
  // Model AIR ID: google:3@3 | Prompt: 2-3000 chars | 24 FPS
  // Duration: 8 seconds (or 7s for video extension)
  // Frame Images: ✅ First AND Last frame supported
  // Video Extension: ✅ Extend videos by 7 seconds
  // Optimized for high-speed generation with rapid creative iteration
  // Cinematic quality with ultra-low latency
  // ─────────────────────────────────────────────────────────────────────────
  "veo-3.1-fast": {
    id: "veo-3.1-fast",
    label: "Google Veo 3.1 Fast",
    modelAirId: "google:3@3",
    durations: [8],  // 8 seconds (7s for video extension)
    aspectRatios: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],  // 1280×720, 1920×1080, 720×1280, 1080×1920
    hasAudio: true,  // Natural sound
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,
      minPromptLength: 2,
      maxPromptLength: 3000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      google: {
        generateAudio: true,    // Enable natural sound generation
        enhancePrompt: true,    // Always enabled, cannot be disabled
      },
    },
  },



  // ─────────────────────────────────────────────────────────────────────────
  // PixVerse v5.5 (Has Native Audio + Multi-Image Fusion)
  // Model AIR ID: pixverse:1@6 | Prompt: 2-2048 chars
  // Duration: 5, 8s (10s unavailable at 1080p)
  // Frame Images: ✅ First AND Last frame supported
  // Audio: ✅ Background music, sound effects, dialogue
  // Multi-Shot: Camera control for dynamic cinematography
  // ─────────────────────────────────────────────────────────────────────────
  "pixverse-v5.5": {
    id: "pixverse-v5.5",
    label: "PixVerse v5.5",
    modelAirId: "pixverse:1@6",
    durations: [5, 8, 10],  // 10s unavailable at 1080p
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    resolutions: ["360p", "540p", "720p", "1080p"],
    hasAudio: true,  // ✅ Background music, sound effects, dialogue
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: true,    // ✅ Supports last frame for I2V
    },
    technicalSpecs: {
      fps: 24,  // Assuming 24 FPS (not specified in docs)
      minPromptLength: 2,
      maxPromptLength: 2048,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 4000,
        minHeight: 300,
        maxHeight: 4000,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      pixverse: {
        style: "realistic",      // Options: "realistic", "3d_animation", etc.
        audio: true,             // Enable comprehensive audio generation
        multiClip: false,        // Enable multi-shot camera control
        thinking: "auto",        // Thinking mode: "auto", "on", "off"
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax Hailuo 2.3 - Cinematic Storytelling
  // Model AIR ID: minimax:4@1 | Prompt: 2-2000 chars (optional with frameImages)
  // Duration: 6 or 10s (1366×768), 6s only (1920×1080) | FPS: 25
  // Frame Images: ✅ First frame supported
  // Lifelike human physics, expressive motion, precise prompt adherence
  // ─────────────────────────────────────────────────────────────────────────
  "hailuo-2.3": {
    id: "hailuo-2.3",
    label: "MiniMax Hailuo 2.3",
    modelAirId: "minimax:4@1",
    durations: [6, 10],  // 6 or 10s at 1366×768, 6s only at 1920×1080
    aspectRatios: ["16:9"],  // Only 16:9 aspect ratio
    resolutions: ["768p", "1080p"],  // 1366×768 and 1920×1080
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 25,
      minPromptLength: 2,
      maxPromptLength: 2000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      minimax: {
        promptOptimizer: true,  // Enable prompt optimization
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI Sora 2 Pro - Higher Quality Professional Variant
  // Model AIR ID: openai:3@2 | Prompt: 1-4000 chars
  // Duration: 4, 8, or 12 seconds | Refined control, better consistency
  // Frame Images: ✅ First frame supported (dimensions must match output)
  // Higher quality for demanding professional use cases
  // ─────────────────────────────────────────────────────────────────────────
  "sora-2-pro": {
    id: "sora-2-pro",
    label: "Sora 2 Pro",
    modelAirId: "openai:3@2",
    durations: [4, 8, 12],
    aspectRatios: ["16:9", "9:16", "7:4", "4:7"],
    resolutions: ["720p"],  // Based on 1280×720 and 720×1280
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V (must match output dimensions)
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 30,  // Assuming 30 FPS (not specified in docs)
      minPromptLength: 1,
      maxPromptLength: 4000,
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 2048,
        minHeight: 300,
        maxHeight: 2048,
        maxFileSize: "20MB",
      },
    },
  },


  // ─────────────────────────────────────────────────────────────────────────
  // LTX-2 Pro (Lightricks) - Professional Cinematic
  // Model AIR ID: lightricks:2@0 | Prompt: 2-10000 chars | 25/50 FPS
  // Duration: 6, 8, or 10 seconds (default: 6)
  // Realistic motion, precise lighting control
  // Supports up to 4K (2160p) | Only 16:9 aspect ratio
  // Frame Images: ✅ First frame supported (max 7MB)
  // Audio: ✅ Native audio generation via generateAudio
  // ─────────────────────────────────────────────────────────────────────────
  "ltx-2-pro": {
    id: "ltx-2-pro",
    label: "LTX-2 Pro",
    modelAirId: "lightricks:2@0",
    durations: [6, 8, 10],  // Default: 6 seconds
    aspectRatios: ["16:9"],  // Only 16:9
    resolutions: ["1080p", "1440p", "2160p"],  // Up to 4K
    hasAudio: true,  // via providerSettings.lightricks.generateAudio
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame for I2V (max 7MB)
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 25,  // 25 or 50 FPS (default: 25)
      minPromptLength: 2,
      maxPromptLength: 10000,  // Very large prompt support!
      supportedWorkflows: ["text-to-video", "image-to-video"],
      inputImageRequirements: {
        minWidth: 300,
        maxWidth: 3840,  // 4K support
        minHeight: 300,
        maxHeight: 2160,  // 4K support
        maxFileSize: "7MB",  // Note: 7MB, not 20MB like others
      },
    },
    providerSettings: {
      lightricks: {
        generateAudio: true,  // Enable native audio generation
        fps: 25,              // 25 or 50 FPS (default: 25)
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runway Gen-4 Turbo - High-Speed Image-to-Video
  // Model AIR ID: runway:1@1 | Prompt: 1-1000 chars (optional)
  // Duration: 2-10 seconds (default: 10) | Image-to-video ONLY
  // Frame Images: ✅ First frame REQUIRED
  // Instant creative experimentation with exceptional fluidity and detail
  // ─────────────────────────────────────────────────────────────────────────
  "runway-gen4-turbo": {
    id: "runway-gen4-turbo",
    label: "Runway Gen-4 Turbo",
    modelAirId: "runway:1@1",
    durations: [2, 3, 4, 5, 6, 7, 8, 9, 10],  // 2-10 seconds (default: 10)
    aspectRatios: ["16:9", "9:16", "1:1", "21:9", "4:3"],  // Custom dimensions
    resolutions: ["720p", "832p", "960p"],  // Multiple custom resolutions
    hasAudio: false,
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ First frame REQUIRED for I2V
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 24,  // Assuming 24 FPS (not specified in docs)
      minPromptLength: 1,
      maxPromptLength: 1000,
      supportedWorkflows: ["image-to-video"],  // Image-to-video ONLY
      inputImageRequirements: {
        minWidth: 672,
        maxWidth: 1584,
        minHeight: 672,
        maxHeight: 1280,
        maxFileSize: "20MB",
      },
    },
    providerSettings: {
      runway: {
        contentModeration: {
          publicFigureThreshold: 0.5,  // Content moderation threshold
        },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Alibaba Wan 2.6 - Multimodal Video Generation with Native Audio
  // Model AIR ID: alibaba:wan@2.6 | Prompt: 1-1500 chars (EN/CN)
  // Duration: 5, 10, or 15 seconds (default: 5)
  // Frame Images: ✅ First frame (image-to-video only)
  // Reference Videos: ✅ Up to 3 videos (reference-to-video)
  // Audio: ✅ Native audio support + custom audio input
  // Multi-shot sequencing with temporal stability
  // ─────────────────────────────────────────────────────────────────────────
  "alibaba-wan-2.6": {
    id: "alibaba-wan-2.6",
    label: "Alibaba Wan 2.6",
    modelAirId: "alibaba:wan@2.6",
    durations: [5, 10, 15],  // 5, 10, or 15 seconds (default: 5)
    aspectRatios: ["16:9", "9:16", "1:1", "17:13", "13:17"],
    resolutions: ["720p", "1080p"],
    hasAudio: true,  // ✅ Native audio + custom audio input support
    supportsFrameImages: true,
    frameImageSupport: {
      first: true,   // ✅ Supports first frame (image-to-video only)
      last: false,   // ❌ Does not support last frame
    },
    technicalSpecs: {
      fps: 24,  // Assuming 24 FPS (not specified in docs)
      minPromptLength: 1,
      maxPromptLength: 1500,
      supportedWorkflows: ["text-to-video", "image-to-video", "reference-to-video"],
      inputImageRequirements: {
        minWidth: 360,
        maxWidth: 2000,
        minHeight: 360,
        maxHeight: 2000,
        maxFileSize: "10MB",
      },
    },
    providerSettings: {
      alibaba: {
        promptExtend: true,   // Enable prompt extension/enhancement
        audio: true,          // Enable native audio generation
        shotType: "single",   // "single" or "multi" for multi-shot sequencing
      },
    },
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

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO MODEL CONSTRAINTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Returns the constraints for a specific video model.
 * Used by scene-generator to ensure scene durations match model capabilities.
 */
export interface VideoModelConstraints {
  id: string;
  label: string;
  supportedDurations: number[];  // e.g., [5, 10] for KlingAI
  minDuration: number;          // Minimum scene duration
  maxDuration: number;          // Maximum scene duration
  hasAudio: boolean;            // Does model generate native audio?
  aspectRatios: string[];       // Supported aspect ratios
}

/**
 * Get constraints for a specific video model
 * Returns null if model not found
 */
export function getVideoModelConstraints(modelId: string): VideoModelConstraints | null {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) return null;
  
  return {
    id: config.id,
    label: config.label,
    supportedDurations: config.durations,
    minDuration: Math.min(...config.durations),
    maxDuration: Math.max(...config.durations),
    hasAudio: config.hasAudio,
    aspectRatios: config.aspectRatios,
  };
}

/**
 * Find the closest supported duration for a model
 * Useful for snapping arbitrary durations to model-supported values
 */
export function getClosestSupportedDuration(modelId: string, targetDuration: number): number {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) return targetDuration;
  
  const durations = config.durations;
  
  // Find closest supported duration
  return durations.reduce((closest, current) => {
    return Math.abs(current - targetDuration) < Math.abs(closest - targetDuration)
      ? current
      : closest;
  });
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
  // Seedance 1.5 Pro - ByteDance (Next Generation with Audio)
  "seedance-1.5-pro": {
    "16:9": {
      "480p": { width: 864, height: 496 },
      "720p": { width: 1280, height: 720 },
    },
    "9:16": {
      "480p": { width: 496, height: 864 },
      "720p": { width: 720, height: 1280 },
    },
    "1:1": {
      "480p": { width: 640, height: 640 },
      "720p": { width: 960, height: 960 },
    },
    "4:3": {
      "480p": { width: 752, height: 560 },
      "720p": { width: 1112, height: 834 },
    },
    "3:4": {
      "480p": { width: 560, height: 752 },
      "720p": { width: 834, height: 1112 },
    },
    "21:9": {
      "480p": { width: 992, height: 432 },
      "720p": { width: 1470, height: 630 },
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
  // Google Veo 3 Fast - Same dimensions as Veo 3.0 (faster & cost-effective)
  "veo-3-fast": {
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
  // KlingAI 2.1 Pro - Full HD 1080p (I2V only, higher frame fidelity)
  "klingai-2.1-pro": {
    "16:9": {
      "1080p": { width: 1920, height: 1080 },
    },
    "1:1": {
      "1080p": { width: 1080, height: 1080 },
    },
    "9:16": {
      "1080p": { width: 1080, height: 1920 },
    },
  },
  // Kling VIDEO 2.6 Pro - Only 1080p supported with native audio
  "kling-video-2.6-pro": {
    "16:9": {
      "1080p": { width: 1920, height: 1080 },
    },
    "1:1": {
      "1080p": { width: 1080, height: 1080 },
    },
    "9:16": {
      "1080p": { width: 1080, height: 1920 },
    },
  },
  // Kling VIDEO O1 - Only 1080p supported (unified multimodal foundation model)
  "kling-video-o1": {
    "16:9": {
      "1080p": { width: 1920, height: 1080 },
    },
    "1:1": {
      "1080p": { width: 1080, height: 1080 },
    },
    "9:16": {
      "1080p": { width: 1080, height: 1920 },
    },
  },
  // MiniMax Hailuo 2.3 - Official dimensions (only 16:9 aspect ratio)
  "hailuo-2.3": {
    "16:9": {
      "768p": { width: 1366, height: 768 },   // 6 or 10 seconds
      "1080p": { width: 1920, height: 1080 }, // 6 seconds only
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
  // Google Veo 3.1 Fast - Same dimensions (ultra-low latency variant)
  "veo-3.1-fast": {
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
  // Runway Gen-4 Turbo - Custom dimensions for high-speed I2V
  "runway-gen4-turbo": {
    "16:9": {
      "720p": { width: 1280, height: 720 },
    },
    "9:16": {
      "720p": { width: 720, height: 1280 },
    },
    "1:1": {
      "960p": { width: 960, height: 960 },
    },
    "21:9": {
      "672p": { width: 1584, height: 672 },
    },
    "4:3": {
      "832p": { width: 1104, height: 832 },
    },
  },
  // Alibaba Wan 2.6 - Multimodal with custom aspect ratios
  "alibaba-wan-2.6": {
    "16:9": {
      "720p": { width: 1280, height: 720 },
      "1080p": { width: 1920, height: 1080 },
    },
    "9:16": {
      "720p": { width: 720, height: 1280 },
      "1080p": { width: 1080, height: 1920 },
    },
    "1:1": {
      "720p": { width: 960, height: 960 },
      "1080p": { width: 1440, height: 1440 },
    },
    "17:13": {
      "720p": { width: 1088, height: 832 },
      "1080p": { width: 1632, height: 1248 },
    },
    "13:17": {
      "720p": { width: 832, height: 1088 },
      "1080p": { width: 1248, height: 1632 },
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

/**
 * Get supported resolutions for a specific model and aspect ratio
 * Returns resolutions that are actually supported (from MODEL_DIMENSIONS)
 * Falls back to model's general resolutions if not in MODEL_DIMENSIONS
 */
export function getSupportedResolutionsForAspectRatio(
  modelId: string,
  aspectRatio: string
): Resolution[] {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) return [];

  // If model has specific dimensions for this aspect ratio, use those
  if (MODEL_DIMENSIONS[modelId] && MODEL_DIMENSIONS[modelId][aspectRatio as AspectRatio]) {
    const supportedResolutions = Object.keys(MODEL_DIMENSIONS[modelId][aspectRatio as AspectRatio]) as Resolution[];
    return supportedResolutions;
  }

  // Otherwise, return all resolutions from config (no restrictions for this aspect ratio)
  return config.resolutions;
}
