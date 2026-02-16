// ASMR Video Generation Agent
// Handles video generation using Runware API

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";
import { VIDEO_MODEL_CONFIGS, getDimensions, getDefaultVideoModel } from "../config";
import type {
  ASMRGenerateRequest,
  ASMRGenerateResponse,
  ASMRTaskStatus,
  VideoModelConfig,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract UUID from Runware image URL
 * Example: https://im.runware.ai/image/ws/2/ii/a53d45c0-2e09-470d-9fc2-c1143b5d7f5c.jpg
 * Returns: a53d45c0-2e09-470d-9fc2-c1143b5d7f5c
 */
function extractUuidFromUrl(urlOrUuid: string): string {
  // If already a UUID, return as-is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(urlOrUuid)) {
    return urlOrUuid;
  }
  
  // Extract UUID from Runware URL
  const match = urlOrUuid.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (match) {
    return match[1];
  }
  
  // Return original if no UUID found (might be base64 or data URI)
  return urlOrUuid;
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start ASMR video generation
 * Returns task ID for async polling
 */
export async function generateVideo(
  request: ASMRGenerateRequest,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<ASMRGenerateResponse> {
  const {
    modelId = getDefaultVideoModel().id,
    visualPrompt,
    aspectRatio,
    resolution,
    duration,
    firstFrameImage,
    lastFrameImage,
  } = request;

  // Validate model exists
  const modelConfig = VIDEO_MODEL_CONFIGS[modelId];
  if (!modelConfig) {
    return {
      taskId: "",
      status: "failed",
      error: `Unknown model: ${modelId}`,
    };
  }

  // Validate settings against model capabilities
  const validation = validateSettings(modelConfig, {
    duration,
    aspectRatio,
    resolution,
  });
  if (!validation.valid) {
    return {
      taskId: "",
      status: "failed",
      error: validation.error,
    };
  }

  // Get Runware model ID
  const runwareModelId = runwareModelIdMap[modelId];
  if (!runwareModelId) {
    return {
      taskId: "",
      status: "failed",
      error: `No Runware mapping for model: ${modelId}`,
    };
  }

  // Get pixel dimensions (model-specific if available)
  const dimensions = getDimensions(aspectRatio, resolution, modelId);

  // Check if model supports audio (modelConfig already defined above)
  const supportsAudio = modelConfig?.hasAudio || false;

  // Build Runware payload
  const payload: Record<string, unknown> = {
    taskType: "videoInference",
    model: runwareModelId,
    positivePrompt: visualPrompt,
    width: dimensions.width,
    height: dimensions.height,
    duration,
    includeCost: true,
  };

  // Add provider-specific settings for audio generation
  if (supportsAudio) {
    if (modelId === "seedance-1.5-pro") {
      // Seedance 1.5 Pro audio settings (ByteDance)
      payload.providerSettings = {
        bytedance: {
          audio: true,
          cameraFixed: false,
        },
      };
      console.log("[asmr-video-generator] Enabled Seedance 1.5 Pro native audio generation");
    } else if (modelId === "kling-video-2.6-pro") {
      // Kling VIDEO 2.6 Pro audio settings (KlingAI)
      payload.providerSettings = {
        klingai: {
          sound: true,
          cfgScale: 0.5,
        },
      };
      console.log("[asmr-video-generator] Enabled Kling VIDEO 2.6 Pro native audio generation");
    } else if (modelId === "veo-3.0" || modelId === "veo-3-fast" || modelId === "veo-3.1" || modelId === "veo-3.1-fast") {
      // Google Veo audio settings (all variants)
      payload.providerSettings = {
        google: {
          generateAudio: true,
          enhancePrompt: true,
        },
      };
      console.log(`[asmr-video-generator] Enabled ${modelId} native audio generation`);
    } else if (modelId === "pixverse-v5.5") {
      // PixVerse v5.5 audio settings
      payload.providerSettings = {
        pixverse: {
          audio: true,
          thinking: "auto",
        },
      };
      console.log("[asmr-video-generator] Enabled PixVerse audio generation");
    } else if (modelId === "ltx-2-pro") {
      // LTX-2 Pro audio settings (Lightricks)
      payload.providerSettings = {
        lightricks: {
          generateAudio: true,
          fps: 25,
        },
      };
      console.log("[asmr-video-generator] Enabled LTX-2 Pro audio generation");
    } else if (modelId === "alibaba-wan-2.6") {
      // Alibaba Wan 2.6 audio settings
      payload.providerSettings = {
        alibaba: {
          audio: true,
        },
      };
      console.log("[asmr-video-generator] Enabled Alibaba Wan 2.6 native audio generation");
    }
  }

  // Add frame images if provided (for I2V - Image to Video)
  // Note: frameImages is OPTIONAL - video can be generated without reference image
  // Some models require inputs.frameImages, others use frameImages directly
  if (firstFrameImage || lastFrameImage) {
    const frameImagesData: { inputImage: string; frame: "first" | "last" }[] = [];
    
    if (firstFrameImage) {
      console.log("[asmr-video-generator] Raw firstFrameImage input:", firstFrameImage);
      
      // Use URL directly - Runware accepts full URL in inputImage
      frameImagesData.push({ inputImage: firstFrameImage, frame: "first" });
      console.log("[asmr-video-generator] First frame URL:", firstFrameImage);
    }
    if (lastFrameImage) {
      console.log("[asmr-video-generator] Raw lastFrameImage input:", lastFrameImage);
      
      frameImagesData.push({ inputImage: lastFrameImage, frame: "last" });
      console.log("[asmr-video-generator] Last frame URL:", lastFrameImage);
    }
    
    // Models that require "inputs" wrapper for frameImages
    // Note: Different models require different frameImages formats:
    // - Runway, Hailuo, LTX-2 Pro: array of objects with { inputImage, frame }
    // - Alibaba Wan 2.6: array of objects with { image: "url" } in inputs.frameImages
    const modelsRequiringInputsWrapper = [
      "runway:1@1",      // Runway Gen-4 Turbo
      "runway:2@1",      // Runway Gen-4 (if exists)
      "minimax:4@1",     // Hailuo 2.3
      "lightricks:2@0",  // LTX-2 Pro
      "alibaba:wan@2.6", // Alibaba Wan 2.6 - requires inputs.frameImages as array of objects with { image: "url" }
    ];
    
    const useInputsWrapper = modelsRequiringInputsWrapper.includes(runwareModelId);
    const isAlibabaWan = runwareModelId === "alibaba:wan@2.6";
    
    if (useInputsWrapper) {
      if (isAlibabaWan) {
        // Alibaba Wan 2.6: array of objects with { image: "url" }
        const frameImagesForAlibaba = frameImagesData.map(item => ({ image: item.inputImage }));
        payload.inputs = { frameImages: frameImagesForAlibaba };
        console.log("[asmr-video-generator] Using inputs.frameImages format (Alibaba Wan 2.6 - array of objects with 'image' property)");
      } else {
        // Other models: array of objects with { inputImage, frame }
        payload.inputs = { frameImages: frameImagesData };
        console.log("[asmr-video-generator] Using inputs.frameImages format (array of objects)");
      }
    } else {
      payload.frameImages = frameImagesData;
      console.log("[asmr-video-generator] Using direct frameImages format");
    }
    const finalFrameImages = (payload.inputs as any)?.frameImages || (payload as any).frameImages;
    console.log("[asmr-video-generator] Final frameImages payload:", JSON.stringify(finalFrameImages));
  } else {
    console.log("[asmr-video-generator] No reference image (T2V mode)");
  }

  try {
    console.log("[asmr-video-generator] Starting generation with payload:", {
      model: runwareModelId,
      dimensions,
      duration,
      audioEnabled: supportsAudio,
      providerSettings: payload.providerSettings || null,
    });

    const response = await callAi(
      {
        provider: "runware",
        model: modelId,
        task: firstFrameImage ? "image-to-video" : "video-generation",
        payload,
        userId,
        workspaceId,
        runware: {
          deliveryMethod: "async",
          timeoutMs: 300000, // 5 minutes max
        },
      },
      {
        skipCreditCheck: false,
        metadata: { usageType, usageMode },
      }
    );

    // Extract response data - Runware returns an array
    const results = response.output as any[];
    const data = Array.isArray(results) ? results[0] : results;
    
    console.log("[asmr-video-generator] Response received:", {
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
      videoURL: data?.videoURL,
      status: data?.status,
    });

    // Check if video is ready (Runware adapter waits for completion)
    if (data?.videoURL) {
      return {
        taskId: data.taskUUID || "",
        status: "completed",
        videoUrl: data.videoURL,
        cost: response.usage?.totalCostUsd || data.cost,
      };
    }

    // If still processing (shouldn't happen with current adapter)
    if (data?.status === "processing" || data?.status === "pending") {
      return {
        taskId: data.taskUUID || "",
        status: "processing",
        cost: data.cost,
      };
    }

    // Check for errors
    if (data?.error || data?.status === "failed") {
      return {
        taskId: "",
        status: "failed",
        error: data.error || "Video generation failed",
      };
    }

    // Fallback - try to find video URL in different locations
    const videoUrl = data?.videoURL || data?.outputURL || data?.url;
    if (videoUrl) {
      return {
        taskId: data?.taskUUID || "",
        status: "completed",
        videoUrl,
        cost: response.usage?.totalCostUsd || data?.cost,
      };
    }

    return {
      taskId: "",
      status: "failed",
      error: "No video URL in response",
    };
  } catch (error) {
    console.error("[asmr-video-generator] Generation failed:", error);
    return {
      taskId: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Video generation failed",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK STATUS CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check the status of a video generation task
 */
export async function checkTaskStatus(
  taskId: string,
  userId?: string,
  workspaceId?: string
): Promise<{
  status: ASMRTaskStatus;
  videoUrl?: string;
  cost?: number;
  error?: string;
}> {
  try {
    const response = await callAi(
      {
        provider: "runware",
        model: "task-status", // Special model for status checks
        task: "video-generation",
        payload: {
          taskType: "getTaskStatus",
          taskUUID: taskId,
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: true, // Status checks don't cost
      }
    );

    const data = response.output as any;

    // Map Runware status to our status
    let status: ASMRTaskStatus = "processing";
    if (data.status === "completed" || data.status === "COMPLETED") {
      status = "completed";
    } else if (data.status === "failed" || data.status === "FAILED") {
      status = "failed";
    } else if (data.status === "pending" || data.status === "PENDING") {
      status = "pending";
    }

    return {
      status,
      videoUrl: data.videoURL || data.outputURL,
      cost: data.cost,
      error: data.error,
    };
  } catch (error) {
    console.error("[asmr-video-generator] Status check failed:", error);
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate generation settings against model capabilities
 */
function validateSettings(
  modelConfig: VideoModelConfig,
  settings: {
    duration: number;
    aspectRatio: string;
    resolution: string;
  }
): ValidationResult {
  const { duration, aspectRatio, resolution } = settings;

  // Check duration
  if (!modelConfig.durations.includes(duration)) {
    return {
      valid: false,
      error: `Model ${modelConfig.label} doesn't support ${duration}s duration. Supported: ${modelConfig.durations.join(", ")}s`,
    };
  }

  // Check aspect ratio
  if (!modelConfig.aspectRatios.includes(aspectRatio as any)) {
    return {
      valid: false,
      error: `Model ${modelConfig.label} doesn't support ${aspectRatio} aspect ratio. Supported: ${modelConfig.aspectRatios.join(", ")}`,
    };
  }

  // Check resolution
  if (!modelConfig.resolutions.includes(resolution as any)) {
    return {
      valid: false,
      error: `Model ${modelConfig.label} doesn't support ${resolution}. Supported: ${modelConfig.resolutions.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get valid settings for a model
 */
export function getModelCapabilities(modelId: string): VideoModelConfig | null {
  return VIDEO_MODEL_CONFIGS[modelId] || null;
}

/**
 * Check if model supports native audio
 */
export function modelHasAudio(modelId: string): boolean {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  return config?.hasAudio ?? false;
}
