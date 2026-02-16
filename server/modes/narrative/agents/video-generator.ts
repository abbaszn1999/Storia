// Narrative Mode Video Generation Agent (Agent 4.5)
// Handles video generation using Runware API with support for both image-reference and start-end modes

import { callAi } from '../../../ai/service';
import { VIDEO_MODEL_CONFIGS, getDimensions, getDefaultVideoModel } from '../../../ai/config/video-models';
import {
  getModelConfig,
  validateModelSettings,
  supportsLastFrame,
  buildFrameImagesPayload,
  clampDuration,
  shouldOmitDimensions,
  getProviderSettingsWithAudioDisabled,
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
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
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

  // Get Runware model AIR ID
  const runwareModelId = modelConfig.modelAirId;

  // Clamp duration to nearest supported value
  const clampedDuration = clampDuration(duration, modelId);
  if (clampedDuration !== duration) {
    console.log(`[narrative-video-generator] Adjusted duration: ${duration}s → ${clampedDuration}s for model ${modelId}`);
  }

  // Validate clamped duration against model capabilities
  const validation = validateModelSettings(modelId, {
    duration: clampedDuration,
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

  // Get pixel dimensions (model-specific if available)
  const dimensions = getDimensions(aspectRatio, resolution, modelId);

  // Check if model supports audio
  const supportsAudio = modelConfig.hasAudio || false;

  // Check if we have frame images (image-to-video mode)
  const hasFrameImages = !!(mode === "image-reference" ? imageUrl : startFrameUrl);

  // Validate frame images are provided
  if (mode === "image-reference") {
    if (!imageUrl) {
      return {
        taskId: "",
        status: "failed",
        error: "Image URL is required for image-reference mode",
      };
    }
  } else {
    // Start-end mode
    if (!startFrameUrl) {
      return {
        taskId: "",
        status: "failed",
        error: "Start frame URL is required for start-end mode",
      };
    }
  }

  // Build optimized prompt for style preservation
  const optimizedPrompt = optimizePromptForStylePreservation(videoPrompt, mode, hasFrameImages);

  // Build Runware payload
  const payload: Record<string, unknown> = {
    taskType: "videoInference",
    model: runwareModelId,
    positivePrompt: optimizedPrompt,
    duration: clampedDuration,
    includeCost: true,
    deliveryMethod: "async",
  };

  // Only add dimensions for models that support them
  // Models without explicit dimensions derive output from input image
  if (!shouldOmitDimensions(runwareModelId)) {
    payload.width = dimensions.width;
    payload.height = dimensions.height;
  }

  // Disable audio generation for models that support native audio
  // We generate audio separately in the Sound tab (voiceover, SFX, music)
  if (supportsAudio) {
    const providerSettings = getProviderSettingsWithAudioDisabled(runwareModelId, modelId);
    if (providerSettings) {
      payload.providerSettings = providerSettings;
      console.log(`[narrative-video-generator] Disabled native audio for model ${modelId}`);
    }
  }

  // Build and add frame images payload
  if (mode === "image-reference") {
    // Image-reference mode: single image
    if (imageUrl) {
      const frameImagesPayload = buildFrameImagesPayload(imageUrl, undefined, runwareModelId, modelId);
      Object.assign(payload, frameImagesPayload);
    }
  } else {
    // Start-end mode: paired keyframes
    const frameImagesPayload = buildFrameImagesPayload(
      startFrameUrl!,
      endFrameUrl,
      runwareModelId,
      modelId
    );
    Object.assign(payload, frameImagesPayload);
    
    if (endFrameUrl && !supportsLastFrame(modelId)) {
      console.log(`[narrative-video-generator] Model ${modelId} doesn't support last frame, using start frame only`);
    }
  }

  try {
    console.log("[narrative-video-generator] Starting generation:", {
      mode,
      modelId,
      model: runwareModelId,
      dimensions: shouldOmitDimensions(runwareModelId) ? "inferred from frame" : dimensions,
      duration: clampedDuration,
      audioEnabled: supportsAudio,
      hasFirstFrame: !!(mode === "image-reference" ? imageUrl : startFrameUrl),
      hasLastFrame: !!(mode === "start-end" && endFrameUrl && supportsLastFrame(modelId)),
      promptLength: optimizedPrompt.length,
      hasProviderSettings: !!payload.providerSettings,
    });

    // Log payload structure for debugging (without sensitive URLs)
    const payloadWithInputs = payload as { inputs?: { frameImages?: any[] } };
    const payloadWithFrameImages = payload as { frameImages?: any[] };
    console.log("[narrative-video-generator] Payload structure:", {
      taskType: payload.taskType,
      model: payload.model,
      duration: payload.duration,
      width: payload.width,
      height: payload.height,
      hasFrameImages: !!(payloadWithFrameImages.frameImages || payloadWithInputs.inputs?.frameImages),
      frameImagesFormat: payloadWithFrameImages.frameImages ? "standard" : payloadWithInputs.inputs?.frameImages ? "inputs-wrapper" : "none",
      hasProviderSettings: !!payload.providerSettings,
      promptPreview: (payload.positivePrompt as string)?.substring(0, 100) + "...",
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
        metadata: { usageType, usageMode },
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
      console.log("[narrative-video-generator] ✓ Video generated successfully:", {
        modelId,
        taskUUID: data.taskUUID?.substring(0, 8) + "...",
        videoUrl: data.videoURL.substring(0, 60) + "...",
        duration: clampedDuration,
        cost: response.usage?.totalCostUsd || data.cost,
      });
      return {
        taskId: data.taskUUID || "",
        status: "completed",
        videoUrl: data.videoURL,
        videoDuration: clampedDuration, // Use clamped duration (actual may differ slightly)
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
      console.log("[narrative-video-generator] ✓ Video found in fallback location");
      return {
        taskId: data?.taskUUID || "",
        status: "completed",
        videoUrl,
        videoDuration: clampedDuration,
        cost: response.usage?.totalCostUsd || data?.cost,
      };
    }

    const errorMsg = data?.error || data?.errorMessage || "No video URL in response";
    console.error("[narrative-video-generator] ✗ Generation failed - no video URL:", {
      modelId,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      error: errorMsg,
    });
    return {
      taskId: "",
      status: "failed",
      error: errorMsg,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("[narrative-video-generator] ✗ Generation exception:", {
      modelId,
      error: errorMessage,
      details: errorDetails,
    });
    return {
      taskId: "",
      status: "failed",
      error: errorMessage,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Optimize prompt for style preservation
 * 
 * For start-end mode: Use minimal prompts focused on motion/camera, not visual style
 * For image-reference mode: Use full prompt but ensure it complements, not overrides, the frame
 * 
 * @param originalPrompt - The original video prompt
 * @param mode - The narrative mode (image-reference or start-end)
 * @param hasFrameImages - Whether frame images are being used
 * @returns Optimized prompt that preserves visual style from frames
 */
function optimizePromptForStylePreservation(
  originalPrompt: string,
  mode: "image-reference" | "start-end",
  hasFrameImages: boolean
): string {
  if (!originalPrompt || originalPrompt.trim().length === 0) {
    // Default minimal prompt for start-end mode
    if (mode === "start-end") {
      return "Smooth motion between keyframes";
    }
    return "Smooth camera movement";
  }

  // For start-end mode with frames, focus on motion/camera, minimize visual descriptions
  if (mode === "start-end" && hasFrameImages) {
    // Extract motion and camera instructions, remove visual style descriptions
    // This is a simple heuristic - in production, you might use AI to parse and optimize
    const prompt = originalPrompt.trim();
    
    // If prompt is very short, it's likely already focused on motion
    if (prompt.length < 100) {
      return prompt;
    }
    
    // For longer prompts, try to focus on motion keywords
    // Common motion/camera keywords: track, pan, zoom, dolly, crane, tilt, rotate, move, follow, etc.
    const motionKeywords = [
      "track", "pan", "zoom", "dolly", "crane", "tilt", "rotate", "move", "follow",
      "camera", "motion", "smooth", "slow", "fast", "gradual", "steady", "glide"
    ];
    
    const hasMotionKeywords = motionKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasMotionKeywords) {
      // Prompt seems motion-focused, use as-is but truncate if too long
      return prompt.length > 300 ? prompt.substring(0, 300) + "..." : prompt;
    }
    
    // Prompt might be describing visual style - use minimal default
    console.log("[narrative-video-generator] Prompt appears to describe visual style, using minimal motion prompt for style preservation");
    return "Smooth motion between keyframes";
  }

  // For image-reference mode, use full prompt but ensure it's motion-focused
  // Frame defines the "what", prompt defines the "how" (motion)
  return originalPrompt;
}

