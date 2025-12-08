// ASMR API Client

import type { VideoModelConfig } from "@/constants/asmr-presets";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EnhancePromptRequest {
  prompt: string;
  categoryId?: string;
  materials?: string[];
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  suggestedSoundPrompt?: string;
  cost?: number;
}

/** Loop multiplier: 1 = no loop, 2/4/6 = repeat video that many times */
export type LoopMultiplier = 1 | 2 | 4 | 6;

export interface ASMRGenerateRequest {
  categoryId?: string;
  visualPrompt: string;
  soundPrompt?: string;
  /** Audio intensity 0-100 (for ElevenLabs prompt_influence) */
  audioIntensity?: number;
  materials?: string[];
  modelId: string;
  aspectRatio: string;
  resolution: string;
  duration: number;
  firstFrameImage?: string;
  lastFrameImage?: string;
  /** Loop multiplier: 1 = no loop, 2/4/6 = repeat video that many times */
  loopMultiplier?: LoopMultiplier;
}

/** Audio source type */
export type AudioSource = "model" | "elevenlabs" | "merged";

export interface ASMRGenerateResponse {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  /** Audio URL when generated separately (ElevenLabs) - null if model has native audio */
  audioUrl?: string;
  /** Source of audio: "model" (native) or "elevenlabs" (generated separately) */
  audioSource?: AudioSource;
  cost?: number;
  error?: string;
  /** Engineered prompt used for generation */
  engineeredPrompt?: string;
  /** Engineered sound prompt */
  engineeredSoundPrompt?: string;
}

export interface ASMRConfigResponse {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    suggestedVisualPrompt: string;
    suggestedSoundPrompt: string;
    materials: string[];
  }>;
  materials: Array<{
    id: string;
    name: string;
    category: string;
    soundHint: string;
  }>;
  models: VideoModelConfig[];
  defaultModel: VideoModelConfig;
}

// ═══════════════════════════════════════════════════════════════════════════
// API BASE
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = "/api/stories/asmr";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all ASMR configuration (categories, materials, models)
 */
export async function getASMRConfig(): Promise<ASMRConfigResponse> {
  return fetchAPI<ASMRConfigResponse>("/config");
}

/**
 * Get available video models
 */
export async function getVideoModels(): Promise<{
  models: VideoModelConfig[];
  default: string;
}> {
  return fetchAPI("/models");
}

/**
 * Get specific model configuration
 */
export async function getModelConfig(modelId: string): Promise<VideoModelConfig> {
  return fetchAPI(`/models/${modelId}/config`);
}

/**
 * Enhance a prompt using AI (Agent 1: Idea Generator)
 * Uses GPT-5 to generate creative ASMR concepts
 */
export async function enhancePrompt(
  request: EnhancePromptRequest
): Promise<EnhancePromptResponse> {
  return fetchAPI<EnhancePromptResponse>("/enhance", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get quick idea for a category (no AI cost)
 */
export async function getQuickIdea(
  categoryId: string
): Promise<{ idea: string }> {
  return fetchAPI(`/quick-idea/${categoryId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUND PROMPT ENHANCEMENT (Agent 6: ASMR Audio Architect)
// ═══════════════════════════════════════════════════════════════════════════

export interface EnhanceSoundPromptRequest {
  prompt: string;           // User's sound description (can be empty for generation from scratch)
  visualPrompt?: string;    // Visual context to base sound on (primary context source)
}

export interface EnhanceSoundPromptResponse {
  enhancedPrompt: string;
  cost?: number;
}

/**
 * Enhance a sound effect prompt using AI (Agent 6: Sound Prompt Enhancer)
 * Transforms basic sound descriptions into professional ASMR audio prompts
 */
export async function enhanceSoundPrompt(
  request: EnhanceSoundPromptRequest
): Promise<EnhanceSoundPromptResponse> {
  return fetchAPI<EnhanceSoundPromptResponse>("/enhance-sound", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION (Agent 4)
// ═══════════════════════════════════════════════════════════════════════════

export interface GenerateImageRequest {
  prompt: string;
  aspectRatio?: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  cost?: number;
}

/**
 * Generate an ASMR reference image using AI (Agent 4: Image Generator)
 * Uses Nano Banana model for fast, high-quality ASMR images
 */
export async function generateImage(
  request: GenerateImageRequest
): Promise<GenerateImageResponse> {
  return fetchAPI<GenerateImageResponse>("/generate-image", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Start video generation
 */
export async function generateVideo(
  request: ASMRGenerateRequest
): Promise<ASMRGenerateResponse> {
  return fetchAPI<ASMRGenerateResponse>("/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(
  taskId: string
): Promise<ASMRGenerateResponse> {
  return fetchAPI(`/status/${taskId}`);
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<{
  categories: ASMRConfigResponse["categories"];
}> {
  return fetchAPI("/categories");
}

/**
 * Get specific category
 */
export async function getCategory(categoryId: string): Promise<
  ASMRConfigResponse["categories"][0]
> {
  return fetchAPI(`/categories/${categoryId}`);
}

/**
 * Get all materials
 */
export async function getMaterials(): Promise<{
  materials: ASMRConfigResponse["materials"];
}> {
  return fetchAPI("/materials");
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO + AUDIO MERGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge video and audio into a single downloadable file
 * Returns a blob URL that can be used for download
 */
export async function mergeVideoAudio(
  videoUrl: string,
  audioUrl: string
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/merge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoUrl, audioUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Merge failed" }));
    throw new Error(error.error || "Failed to merge video and audio");
  }

  return response.blob();
}

/**
 * Download merged video with audio
 * Handles the merge request and triggers browser download
 */
export async function downloadMergedVideo(
  videoUrl: string,
  audioUrl: string,
  filename: string = "asmr-video.mp4"
): Promise<void> {
  // Get merged video blob
  const blob = await mergeVideoAudio(videoUrl, audioUrl);
  
  // Create download link
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(blobUrl);
}

// ═══════════════════════════════════════════════════════════════════════════
// POLLING HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Poll for video completion
 */
export async function pollVideoStatus(
  taskId: string,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    onProgress?: (status: ASMRGenerateResponse) => void;
  } = {}
): Promise<ASMRGenerateResponse> {
  const { intervalMs = 3000, maxAttempts = 100, onProgress } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkVideoStatus(taskId);
    onProgress?.(status);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error("Video generation timed out");
}

