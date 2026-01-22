/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO GENERATOR - AGENT 4.3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates animated video clips from storyboard images using Runware video API.
 * 
 * FEATURES:
 * - 1F Mode (Single Frame): Animates one image with motion
 * - 2F Mode (Start/End Frames): Interpolates between two keyframes
 * - Duration validation against video model capabilities
 * - Model-specific API format handling
 * - Aspect ratio and resolution validation
 * 
 * KEY DIFFERENCES FROM AMBIENT-VISUAL:
 * - Uses frameType ('1F' | '2F') instead of videoGenerationMode
 * - Matches character-vlog naming conventions (storyboardImage vs imageUrl)
 * - Simplified for single/batch shot generation (not scenes)
 */

import { randomUUID } from "crypto";
import { callAi } from "../../../../ai/service";
import { VIDEO_MODEL_CONFIGS, getDimensions } from "../../../../ai/config/video-models";
import { getRunwareModelId } from "../../../../ai/config";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface VideoGeneratorInput {
  shotId: string;
  frameType: '1F' | '2F';
  storyboardImage: string | null;    // For 1F mode
  startFrame: string | null;         // For 2F mode
  endFrame: string | null;           // For 2F mode
  videoPrompt: string;
  shotDuration: number;
  videoModel: string;
  aspectRatio: string;
  videoResolution?: string;          // Optional, defaults to first available
}

export interface VideoGeneratorOutput {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  actualDuration?: number;
  metadata?: {
    model: string;
    generationTime: number;
    resolution: string;
  };
  error?: {
    message: string;
    details: string;
    suggestions?: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** Timeout for video generation (5 minutes) */
  TIMEOUT_MS: 300000,
  
  /** Maximum retry attempts */
  MAX_RETRIES: 2,
  
  /** Retry delay (exponential backoff base) */
  RETRY_BASE_DELAY_MS: 5000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find closest supported duration for a video model
 */
function findClosestDuration(targetDuration: number, supportedDurations: number[]): number {
  if (supportedDurations.includes(targetDuration)) {
    return targetDuration;
  }

  return supportedDurations.reduce((closest, current) => {
    const currentDiff = Math.abs(current - targetDuration);
    const closestDiff = Math.abs(closest - targetDuration);

    if (currentDiff < closestDiff) {
      return current;
    } else if (currentDiff === closestDiff && current < closest) {
      return current; // Prefer lower duration if equidistant
    }
    return closest;
  });
}

/**
 * Check if model requires inputs wrapper format
 */
function usesInputsWrapperFormat(modelAirId: string): boolean {
  const modelsRequiringInputsWrapper = [
    "runway:1@1",      // Runway Gen-4 Turbo
    "minimax:4@1",     // Hailuo 2.3
    "lightricks:2@0",  // LTX-2 Pro
    "alibaba:wan@2.6", // Alibaba Wan 2.6
    "klingai:kling-video@2.6-pro", // Kling VIDEO 2.6 Pro
    "klingai:kling@o1", // Kling VIDEO O1
  ];
  return modelsRequiringInputsWrapper.includes(modelAirId);
}

/**
 * Check if model uses "image" property instead of "inputImage"
 */
function usesImageProperty(modelAirId: string): boolean {
  const modelsUsingImage = [
    "runway:1@1",              // Runway Gen-4 Turbo
    "klingai:kling-video@2.6-pro", // Kling VIDEO 2.6 Pro
    "klingai:kling@o1",       // Kling VIDEO O1
  ];
  return modelsUsingImage.includes(modelAirId);
}

/**
 * Check if model supports last frame (for 2F mode)
 */
function supportsLastFrame(videoModel: string): boolean {
  const modelConfig = VIDEO_MODEL_CONFIGS[videoModel];
  if (!modelConfig?.frameImageSupport) return false;
  return modelConfig.frameImageSupport.last === true;
}

/**
 * Build frameImages payload based on model and mode
 */
function buildFrameImagesPayload(
  frameType: '1F' | '2F',
  storyboardImage: string | null,
  startFrame: string | null,
  endFrame: string | null,
  modelAirId: string,
  videoModel: string
): Record<string, any> {
  const useInputsWrapper = usesInputsWrapperFormat(modelAirId);
  const useImageProp = usesImageProperty(modelAirId);
  const supportsLast = supportsLastFrame(videoModel);
  const isAlibabaWan = modelAirId === "alibaba:wan@2.6";

  // Determine which image(s) to use
  let frameImages: any[] = [];

  if (frameType === '1F') {
    // Single frame mode
    const imageUrl = storyboardImage;
    if (!imageUrl) {
      throw new Error('1F mode requires storyboardImage');
    }

    if (useInputsWrapper) {
      if (isAlibabaWan) {
        frameImages = [{ image: imageUrl }];
      } else if (useImageProp) {
        frameImages = [{ image: imageUrl }];
      } else {
        frameImages = [{ inputImage: imageUrl, frame: "first" }];
      }
    } else {
      frameImages = [{ inputImage: imageUrl, frame: "first" }];
    }
  } else {
    // 2F mode (start/end frames)
    if (!startFrame) {
      throw new Error('2F mode requires startFrame');
    }

    if (useInputsWrapper) {
      if (isAlibabaWan) {
        frameImages = [{ image: startFrame }];
        if (endFrame && supportsLast) {
          frameImages.push({ image: endFrame });
        }
      } else if (useImageProp) {
        frameImages = [{ image: startFrame }];
        if (endFrame && supportsLast) {
          frameImages.push({ image: endFrame });
        }
      } else {
        frameImages = [{ inputImage: startFrame, frame: "first" }];
        if (endFrame && supportsLast) {
          frameImages.push({ inputImage: endFrame, frame: "last" });
        }
      }
    } else {
      frameImages = [{ inputImage: startFrame, frame: "first" }];
      if (endFrame && supportsLast) {
        frameImages.push({ inputImage: endFrame, frame: "last" });
      }
    }
  }

  // Return payload based on wrapper format
  if (useInputsWrapper) {
    return { inputs: { frameImages } };
  } else {
    return { frameImages };
  }
}

/**
 * Check if model should omit dimensions in payload
 */
function shouldOmitDimensions(modelAirId: string): boolean {
  const modelsWithoutDimensions = [
    "klingai:kling@o1", // Kling VIDEO O1: dimensions inferred from frame
  ];
  return modelsWithoutDimensions.includes(modelAirId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate video for a single shot
 * 
 * @param input - Shot details with frame URLs and settings
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for tracking
 * @returns Generated video URL and metadata
 */
export async function generateVideo(
  input: VideoGeneratorInput,
  userId: string,
  workspaceId?: string
): Promise<VideoGeneratorOutput> {
  const startTime = Date.now();

  console.log('[character-vlog:video-generator] Starting video generation:', {
    shotId: input.shotId.substring(0, 30) + '...',
    frameType: input.frameType,
    videoModel: input.videoModel,
    duration: input.shotDuration,
    aspectRatio: input.aspectRatio,
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════════

  // Validate frame images
  if (input.frameType === '1F' && !input.storyboardImage) {
    return {
      success: false,
      error: {
        message: '1F mode requires a storyboard image',
        details: 'Generate the storyboard image first using Agent 4.2',
      },
    };
  }

  if (input.frameType === '2F' && !input.startFrame) {
    return {
      success: false,
      error: {
        message: '2F mode requires a start frame',
        details: 'Generate the start frame first using Agent 4.2',
      },
    };
  }

  // Get model configuration
  const modelConfig = VIDEO_MODEL_CONFIGS[input.videoModel];
  if (!modelConfig) {
    return {
      success: false,
      error: {
        message: `Unknown video model: ${input.videoModel}`,
        details: 'Please select a valid video model',
      },
    };
  }

  // Get Runware model AIR ID
  const modelAirId = getRunwareModelId(input.videoModel);
  if (!modelAirId) {
    return {
      success: false,
      error: {
        message: `No Runware mapping for model: ${input.videoModel}`,
        details: 'Model not configured in Runware system',
      },
    };
  }

  // Validate duration
  const maxDuration = Math.max(...modelConfig.durations);
  if (input.shotDuration > maxDuration) {
    return {
      success: false,
      error: {
        message: 'Shot duration exceeds model maximum',
        details: `Shot duration: ${input.shotDuration}s, Model max: ${maxDuration}s (${input.videoModel})`,
        suggestions: [
          `Reduce shot duration to ${maxDuration}s or less`,
          'Choose a different video model with longer duration support',
          'Split shot into multiple shorter shots',
        ],
      },
    };
  }

  // Find closest supported duration
  const matchedDuration = findClosestDuration(input.shotDuration, modelConfig.durations);
  if (matchedDuration !== input.shotDuration) {
    console.log(`[character-vlog:video-generator] Adjusted duration: ${input.shotDuration}s → ${matchedDuration}s`);
  }

  // Get resolution (use provided or default to first available)
  const resolution = input.videoResolution || modelConfig.resolutions[0];
  
  // Get dimensions
  const dimensions = getDimensions(input.aspectRatio, resolution, input.videoModel);

  console.log('[character-vlog:video-generator] Generation settings:', {
    modelAirId,
    matchedDuration,
    resolution,
    dimensions,
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // BUILD PAYLOAD
  // ═══════════════════════════════════════════════════════════════════════════════

  const taskUUID = randomUUID();

  try {
    // Build frame images payload based on mode
    const frameImagesPayload = buildFrameImagesPayload(
      input.frameType,
      input.storyboardImage,
      input.startFrame,
      input.endFrame,
      modelAirId,
      input.videoModel
    );

    // Build base payload
    const payload: Record<string, any> = {
      taskType: "videoInference",
      taskUUID,
      model: modelAirId,
      positivePrompt: input.videoPrompt,
      duration: matchedDuration,
      ...frameImagesPayload,
      numberResults: 1,
      deliveryMethod: "async",
      includeCost: true,
    };

    // Only add dimensions if model supports them
    if (!shouldOmitDimensions(modelAirId)) {
      payload.width = dimensions.width;
      payload.height = dimensions.height;
    }

    console.log('[character-vlog:video-generator] Payload built:', {
      taskUUID: taskUUID.substring(0, 8) + '...',
      model: modelAirId,
      duration: matchedDuration,
      hasDimensions: !shouldOmitDimensions(modelAirId),
      promptLength: input.videoPrompt.length,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL RUNWARE API
    // ═══════════════════════════════════════════════════════════════════════════

    const response = await callAi(
      {
        provider: "runware",
        model: input.videoModel,
        task: "video-generation",
        payload: [payload],  // Array for batch support
        userId,
        workspaceId,
        runware: {
          deliveryMethod: "async",
          timeoutMs: CONFIG.TIMEOUT_MS,
        },
      },
      {
        skipCreditCheck: false,
      }
    );

    // Extract result
    const outputData = response.output as any[];
    if (!outputData || outputData.length === 0) {
      throw new Error('No output data received from Runware API');
    }

    const result = outputData[0];
    const videoUrl = result?.videoURL || result?.videoUrl || result?.imageURL || result?.imageUrl;

    if (!videoUrl) {
      const errorMsg = result?.error || result?.status || 'No video URL in response';
      throw new Error(errorMsg);
    }

    // Calculate generation time
    const generationTime = (Date.now() - startTime) / 1000;

    console.log('[character-vlog:video-generator] ✓ Video generated successfully:', {
      shotId: input.shotId.substring(0, 30) + '...',
      videoUrl: videoUrl.substring(0, 60) + '...',
      duration: matchedDuration,
      generationTime: generationTime.toFixed(1) + 's',
      cost: result.cost,
    });

    return {
      success: true,
      videoUrl,
      thumbnailUrl: result.thumbnailUrl || null,
      actualDuration: matchedDuration,
      metadata: {
        model: input.videoModel,
        generationTime,
        resolution: `${dimensions.width}x${dimensions.height}`,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[character-vlog:video-generator] ✗ Video generation failed:', {
      shotId: input.shotId.substring(0, 30) + '...',
      error: errorMessage,
    });

    return {
      success: false,
      error: {
        message: 'Video generation failed',
        details: errorMessage,
      },
    };
  }
}


