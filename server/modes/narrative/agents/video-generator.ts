// Narrative Mode Video Generation Agent (Agent 4.5)
// Handles video generation using Runware API with support for both image-reference and start-end modes

import { callAi } from '../../../ai/service';
import { VIDEO_MODEL_CONFIGS, getDimensions, getDefaultVideoModel } from '../../../ai/config/video-models';
import {
  getModelConfig,
  validateModelSettings,
  shouldUseInputsWrapper,
  supportsLastFrame,
  type ValidationResult,
} from '../utils/video-models';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface NarrativeVideoGenerateRequest {
  narrativeMode: "image-reference" | "start-end" | "auto";
  videoModel: string;
  aspectRatio: string;
  resolution: string;
  duration: number;
  videoPrompt: string;
  // Image-reference mode
  imageUrl?: string;
  // Start-end mode
  startFrameUrl?: string;
  endFrameUrl?: string;
  // For auto mode - effective mode determined by shot
  effectiveMode?: "image-reference" | "start-end";
}

export interface NarrativeVideoGenerateResponse {
  taskId: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  videoDuration?: number;
  cost?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate video for narrative mode shot
 * Supports both image-reference and start-end modes
 */
export async function generateVideo(
  request: NarrativeVideoGenerateRequest,
  userId?: string,
  workspaceId?: string
): Promise<NarrativeVideoGenerateResponse> {
  const {
    narrativeMode,
    videoModel,
    aspectRatio,
    resolution,
    duration,
    videoPrompt,
    imageUrl,
    startFrameUrl,
    endFrameUrl,
    effectiveMode,
  } = request;

  // Determine effective mode
  const mode = effectiveMode || (narrativeMode === "auto" ? "image-reference" : narrativeMode);

  // Ensure videoModel is a string (handle object cases)
  let modelId: string;
  if (typeof videoModel === "string") {
    modelId = videoModel;
  } else if (videoModel && typeof videoModel === "object") {
    // Try to extract ID from object
    modelId = (videoModel as any)?.id 
      || (videoModel as any)?.name 
      || (videoModel as any)?.modelId
      || (videoModel as any)?.value
      || "seedance-1.0-pro"; // Fallback instead of String() which gives "[object Object]"
    
    console.log('[narrative-video-generator] Extracted modelId from object:', {
      videoModel,
      extractedModelId: modelId,
      objectKeys: Object.keys(videoModel || {}),
    });
  } else {
    modelId = "seedance-1.0-pro"; // Fallback
    console.warn('[narrative-video-generator] videoModel is neither string nor object, using fallback:', videoModel);
  }
  
  // Final validation
  if (typeof modelId !== "string" || !modelId) {
    console.error('[narrative-video-generator] modelId is invalid:', modelId);
    modelId = "seedance-1.0-pro";
  }
  
  // Validate model exists
  const modelConfig = getModelConfig(modelId);
  if (!modelConfig || !modelConfig.modelAirId) {
    return {
      taskId: "",
      status: "failed",
      error: `Unknown or invalid video model: ${modelId}. Received: ${JSON.stringify(videoModel)}`,
    };
  }

  // Validate settings against model capabilities
  const validation = validateModelSettings(modelId, {
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

  // Get Runware model AIR ID
  const runwareModelId = modelConfig.modelAirId;

  // Get pixel dimensions (model-specific if available)
  const dimensions = getDimensions(aspectRatio, resolution, modelId);

  // Check if model supports audio
  const supportsAudio = modelConfig.hasAudio || false;

  // Build Runware payload
  const payload: Record<string, unknown> = {
    taskType: "videoInference",
    model: runwareModelId,
    width: dimensions.width,
    height: dimensions.height,
    duration,
    includeCost: true,
  };

  // Add prompt based on mode
  if (mode === "image-reference") {
    // Image-reference mode: use video prompt for camera movement
    payload.positivePrompt = videoPrompt;
  } else {
    // Start-end mode: minimal or no prompt (motion defined by keyframe pair)
    // Some models still benefit from a brief prompt
    payload.positivePrompt = videoPrompt || "Smooth motion between keyframes";
  }

  // Add provider-specific settings for audio generation
  if (supportsAudio) {
    payload.providerSettings = getAudioProviderSettings(modelId);
  }

  // Handle frame images based on mode
  if (mode === "image-reference") {
    // Image-reference mode: single image
    if (imageUrl) {
      handleFrameImages(payload, runwareModelId, imageUrl, null);
    }
  } else {
    // Start-end mode: paired keyframes
    if (startFrameUrl || endFrameUrl) {
      // Check if model supports last frame
      const supportsLast = supportsLastFrame(modelId);
      
      if (supportsLast && startFrameUrl && endFrameUrl) {
        // Model supports both frames - send both
        handleFrameImages(payload, runwareModelId, startFrameUrl, endFrameUrl);
      } else if (startFrameUrl) {
        // Model only supports first frame - use start frame only
        handleFrameImages(payload, runwareModelId, startFrameUrl, null);
        console.log(`[narrative-video-generator] Model ${modelId} doesn't support last frame, using start frame only`);
      } else {
        return {
          taskId: "",
          status: "failed",
          error: "Start frame is required for start-end mode",
        };
      }
    } else {
      return {
        taskId: "",
        status: "failed",
        error: "Frame images are required for video generation",
      };
    }
  }

  try {
    console.log("[narrative-video-generator] Starting generation:", {
      mode,
      modelId,
      model: runwareModelId,
      dimensions,
      duration,
      audioEnabled: supportsAudio,
      hasFirstFrame: !!(mode === "image-reference" ? imageUrl : startFrameUrl),
      hasLastFrame: !!(mode === "start-end" && endFrameUrl),
    });

    const response = await callAi(
      {
        provider: "runware",
        model: modelId,
        task: (mode === "image-reference" ? imageUrl : startFrameUrl) ? "image-to-video" : "video-generation",
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
      }
    );

    // Extract response data - Runware returns an array
    const results = response.output as any[];
    const data = Array.isArray(results) ? results[0] : results;

    console.log("[narrative-video-generator] Response received:", {
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
        videoDuration: duration, // Use requested duration (actual may differ slightly)
        cost: response.usage?.totalCostUsd || data.cost,
      };
    }

    // If still processing (shouldn't happen with current adapter, but handle it)
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
        videoDuration: duration,
        cost: response.usage?.totalCostUsd || data?.cost,
      };
    }

    return {
      taskId: "",
      status: "failed",
      error: "No video URL in response",
    };
  } catch (error) {
    console.error("[narrative-video-generator] Generation failed:", error);
    return {
      taskId: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Video generation failed",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle frame images for Runware payload
 */
function handleFrameImages(
  payload: Record<string, unknown>,
  runwareModelId: string,
  firstFrameImage: string | null,
  lastFrameImage: string | null
): void {
  if (!firstFrameImage && !lastFrameImage) {
    return;
  }

  const frameImagesData: { inputImage: string; frame: "first" | "last" }[] = [];

  if (firstFrameImage) {
    frameImagesData.push({ inputImage: firstFrameImage, frame: "first" });
  }
  if (lastFrameImage) {
    frameImagesData.push({ inputImage: lastFrameImage, frame: "last" });
  }

  // Models that require "inputs" wrapper for frameImages
  const useInputsWrapper = shouldUseInputsWrapper(runwareModelId);
  const isAlibabaWan = runwareModelId === "alibaba:wan@2.6";

  if (useInputsWrapper) {
    if (isAlibabaWan) {
      // Alibaba Wan 2.6: array of objects with { image: "url" }
      const frameImagesForAlibaba = frameImagesData.map(item => ({ image: item.inputImage }));
      payload.inputs = { frameImages: frameImagesForAlibaba };
    } else {
      // Other models: array of objects with { inputImage, frame }
      payload.inputs = { frameImages: frameImagesData };
    }
  } else {
    payload.frameImages = frameImagesData;
  }
}

/**
 * Get audio provider settings for models that support native audio
 */
function getAudioProviderSettings(modelId: string): Record<string, Record<string, any>> | undefined {
  if (modelId === "seedance-1.5-pro") {
    return {
      bytedance: {
        audio: true,
        cameraFixed: false,
      },
    };
  } else if (modelId === "kling-video-2.6-pro") {
    return {
      klingai: {
        sound: true,
        cfgScale: 0.5,
      },
    };
  } else if (modelId === "veo-3.0" || modelId === "veo-3-fast" || modelId === "veo-3.1" || modelId === "veo-3.1-fast") {
    return {
      google: {
        generateAudio: true,
        enhancePrompt: true,
      },
    };
  } else if (modelId === "pixverse-v5.5") {
    return {
      pixverse: {
        audio: true,
        thinking: "auto",
      },
    };
  } else if (modelId === "ltx-2-pro") {
    return {
      lightricks: {
        generateAudio: true,
        fps: 25,
      },
    };
  } else if (modelId === "alibaba-wan-2.6") {
    return {
      alibaba: {
        audio: true,
      },
    };
  }

  return undefined;
}

