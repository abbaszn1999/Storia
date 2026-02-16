/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO CLIP GENERATOR - AGENT 4.3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates video clips from keyframe images using Runware's image-to-video API.
 * 
 * FEATURES:
 * - Start-End Frame mode: Uses both startFrameUrl and endFrameUrl for interpolation
 * - Image Reference mode: Uses only startFrameUrl (single keyframe animation)
 * - Supports multiple video models (Seedance, KlingAI, Veo, PixVerse, etc.)
 * - Handles model-specific API formats (standard vs inputs-wrapper)
 * - Async video generation with polling
 * 
 * KEY PRINCIPLE:
 * Video models interpolate between start and end frames, creating smooth motion.
 * The videoPrompt from Agent 4.1 guides the motion and camera movement.
 */

import { randomUUID } from "crypto";
import { callAi } from "../../../ai/service";
import { VIDEO_MODEL_CONFIGS } from "../../../ai/config/video-models";
import {
  getVideoModelAirId,
  getVideoDimensions,
  clampDuration,
  supportsStartEndFrame,
  usesInputsWrapperFormat,
  buildFrameImagesPayload,
} from "../utils/video-model-helpers";
import type {
  VideoClipGeneratorInput,
  VideoClipGeneratorOutput,
  VideoClipGeneratorBatchInput,
  VideoClipGeneratorBatchOutput,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** Timeout for video generation (5 minutes - video gen is slow) */
  TIMEOUT_MS: 300000,
  
  /** Delay between batch items (1 second) */
  BATCH_DELAY_MS: 1000,
  
  /** Maximum retry attempts */
  MAX_RETRIES: 1,
  
  /** Retry delay (10 seconds) */
  RETRY_DELAY_MS: 10000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the complete Runware payload for video generation
 */
function buildVideoPayload(
  input: VideoClipGeneratorInput,
  modelAirId: string,
  dimensions: { width: number; height: number }
): Record<string, any> {
  const {
    videoPrompt,
    startFrameUrl,
    endFrameUrl,
    videoModel,
    duration,
    cameraFixed,
    generateAudio,
  } = input;
  
  // Check if model uses inputs wrapper format (these models don't support top-level width/height)
  const useInputsWrapper = usesInputsWrapperFormat(videoModel);
  
  // Build base payload
  const payload: Record<string, any> = {
    taskType: "videoInference",
    taskUUID: randomUUID(),
    model: modelAirId,
    positivePrompt: videoPrompt,
    duration: clampDuration(duration, videoModel),
    deliveryMethod: "async",
    includeCost: true,
  };
  
  // Only add width/height for models that support them (not for inputs-wrapper models like Kling O1)
  if (!useInputsWrapper) {
    payload.width = dimensions.width;
    payload.height = dimensions.height;
  }
  
  // Add frame images based on model format
  const frameImagesPayload = buildFrameImagesPayload(startFrameUrl, endFrameUrl, videoModel);
  Object.assign(payload, frameImagesPayload);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO SETTINGS: Explicitly handle audio generation based on model provider
  // ═══════════════════════════════════════════════════════════════════════════
  // Audio is disabled by default (generateAudio: false from caller)
  // Each provider has different parameter names for audio control
  // ═══════════════════════════════════════════════════════════════════════════
  let providerSettings: Record<string, any> | undefined;
  
  // Determine if audio should be enabled (default is false)
  const shouldEnableAudio = generateAudio === true;
  
  // Build provider settings based on model AIR ID
  if (modelAirId === "bytedance:seedance@1.5-pro") {
    // Seedance 1.5 Pro (ByteDance) - Uses 'audio' parameter
    providerSettings = {
      bytedance: {
        audio: shouldEnableAudio,
        ...(cameraFixed !== undefined && { cameraFixed }),
      },
    };
  } else if (modelAirId.startsWith("google:3@")) {
    // Google Veo models - Use 'generateAudio' parameter
    providerSettings = {
      google: {
        generateAudio: shouldEnableAudio,
      },
    };
  } else if (modelAirId.startsWith("lightricks:")) {
    // LTX-2 Pro - Uses 'generateAudio' parameter
    providerSettings = {
      lightricks: {
        generateAudio: shouldEnableAudio,
      },
    };
  } else if (modelAirId.startsWith("pixverse:")) {
    // PixVerse models - Use 'audio' parameter
    providerSettings = {
      pixverse: {
        audio: shouldEnableAudio,
      },
    };
  } else if (modelAirId === "klingai:kling-video@2.6-pro") {
    // Kling VIDEO 2.6 Pro - Uses 'sound' parameter
    providerSettings = {
      klingai: {
        sound: shouldEnableAudio,
      },
    };
  } else if (modelAirId.startsWith("alibaba:")) {
    // Alibaba Wan models - Use 'audio' parameter
    providerSettings = {
      alibaba: {
        audio: shouldEnableAudio,
      },
    };
  }
  // Note: Models without audio support (or where audio param isn't needed) 
  // will have providerSettings = undefined, which is fine
  
  // Add providerSettings to payload if defined
  if (providerSettings) {
    payload.providerSettings = providerSettings;
  }
  
  return payload;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a video clip for a single shot
 * 
 * @param input - Shot details with frame URLs and settings
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated video URL and metadata
 */
export async function generateVideoClip(
  input: VideoClipGeneratorInput,
  userId: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<VideoClipGeneratorOutput> {
  const {
    shotId,
    shotNumber,
    videoModel,
    aspectRatio,
    videoResolution,
    startFrameUrl,
    endFrameUrl,
  } = input;

  console.log("[video-clip-generator] Processing shot:", {
    shotId: shotId.substring(0, 8) + '...',
    shotNumber,
    videoModel,
    aspectRatio,
    hasStartFrame: !!startFrameUrl,
    hasEndFrame: !!endFrameUrl,
    duration: input.duration,
  });

  // Validate start frame is provided
  if (!startFrameUrl) {
    console.error(`[video-clip-generator] Shot ${shotNumber}: Missing start frame URL`);
    return {
      shotId,
      error: "Start frame URL is required for video generation",
    };
  }

  // Get model AIR ID
  const modelAirId = getVideoModelAirId(videoModel);
  if (!modelAirId) {
    console.error(`[video-clip-generator] Shot ${shotNumber}: No AIR ID for model: ${videoModel}`);
    return {
      shotId,
      error: `No Runware AIR ID mapping for video model: ${videoModel}`,
    };
  }

  // Check if model supports start-end frame mode when end frame is provided
  if (endFrameUrl && !supportsStartEndFrame(videoModel)) {
    console.warn(`[video-clip-generator] Shot ${shotNumber}: Model ${videoModel} does not support end frame, using start frame only`);
  }

  // Get dimensions for the model, aspect ratio, and resolution
  const dimensions = getVideoDimensions(videoModel, aspectRatio, videoResolution);
  console.log("[video-clip-generator] Using dimensions:", dimensions);

  // Build the Runware payload
  const payload = buildVideoPayload(input, modelAirId, dimensions);

  console.log("[video-clip-generator] Runware payload:", {
    taskType: payload.taskType,
    model: payload.model,
    duration: payload.duration,
    width: payload.width,
    height: payload.height,
    hasFrameImages: !!payload.frameImages || !!payload.inputs?.frameImages,
    promptLength: payload.positivePrompt?.length,
  });

  try {
    // Call Runware API with async delivery
    const response = await callAi(
      {
        provider: "runware",
        model: videoModel,
        task: "video-generation",
        payload: [payload],
        userId,
        workspaceId,
        runware: {
          deliveryMethod: "async",
          timeoutMs: CONFIG.TIMEOUT_MS,
        },
      },
      {
        skipCreditCheck: false,
        metadata: { usageType, usageMode },
      }
    );

    const outputData = response.output as any[];
    const data = outputData[0];

    if (data?.videoURL) {
      console.log(`[video-clip-generator] Shot ${shotNumber}: Video generated successfully ✓`);
      return {
        shotId,
        videoUrl: data.videoURL,
        actualDuration: data.duration || input.duration,
        cost: data.cost || 0,
      };
    } else {
      const errorMsg = data?.error || data?.errorMessage || "No video URL in response";
      console.error(`[video-clip-generator] Shot ${shotNumber}: Generation failed:`, errorMsg);
      return {
        shotId,
        error: errorMsg,
        cost: data?.cost || 0,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[video-clip-generator] Shot ${shotNumber}: Exception:`, errorMessage);
    return {
      shotId,
      error: errorMessage,
    };
  }
}

/**
 * Generate video clips for multiple shots (batch processing)
 * Processes shots sequentially due to long generation times
 * 
 * @param batchInput - Batch of shots to process
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for tracking
 * @returns Results for all shots with success/failure counts
 */
export async function generateVideoClipBatch(
  batchInput: VideoClipGeneratorBatchInput,
  userId: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<VideoClipGeneratorBatchOutput> {
  const { videoId, shots } = batchInput;

  console.log("[video-clip-generator] Starting batch generation:", {
    videoId: videoId.substring(0, 8) + '...',
    totalShots: shots.length,
  });

  const results: VideoClipGeneratorOutput[] = [];
  let totalCost = 0;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    console.log(`[video-clip-generator] Processing shot ${i + 1}/${shots.length}: ${shot.shotNumber}`);

    const result = await generateVideoClip(shot, userId, workspaceId, usageType, usageMode);
    results.push(result);

    if (result.error) {
      failureCount++;
      console.error(`[video-clip-generator] Shot ${shot.shotNumber} failed:`, result.error);
    } else {
      successCount++;
      totalCost += result.cost || 0;
      console.log(`[video-clip-generator] Shot ${shot.shotNumber} succeeded`);
    }

    // Add delay between shots to avoid overwhelming the API
    if (i < shots.length - 1) {
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
  }

  console.log("[video-clip-generator] Batch complete:", {
    videoId: videoId.substring(0, 8) + '...',
    successCount,
    failureCount,
    totalCost,
  });

  return {
    videoId,
    results,
    totalCost,
    successCount,
    failureCount,
  };
}

/**
 * Retry failed video generation
 */
export async function retryVideoClip(
  input: VideoClipGeneratorInput,
  userId: string,
  workspaceId?: string,
  retryCount: number = 0,
  usageType?: string,
  usageMode?: string
): Promise<VideoClipGeneratorOutput> {
  if (retryCount >= CONFIG.MAX_RETRIES) {
    return {
      shotId: input.shotId,
      error: `Max retries (${CONFIG.MAX_RETRIES}) exceeded`,
    };
  }

  console.log(`[video-clip-generator] Retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} for shot ${input.shotNumber}`);
  await sleep(CONFIG.RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff

  const result = await generateVideoClip(input, userId, workspaceId, usageType, usageMode);

  if (result.error && retryCount < CONFIG.MAX_RETRIES - 1) {
    return retryVideoClip(input, userId, workspaceId, retryCount + 1, usageType, usageMode);
  }

  return result;
}

