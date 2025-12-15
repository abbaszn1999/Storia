// Video Generation Agent for Problem-Solution Mode
// Generates videos from images using Runware video inference (Image-to-Video)

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";
import { getDimensions, VIDEO_MODEL_CONFIGS } from "../../shared/config";
import { randomUUID } from "crypto";
import type {
  VideoGeneratorInput,
  VideoGeneratorOutput,
  VideoGenerationResult,
} from "../types";

/**
 * Find the closest supported duration for a given target duration
 * Prefers lower duration if equidistant
 * 
 * @param targetDuration - Desired duration in seconds
 * @param supportedDurations - Array of supported durations for the model
 * @returns Closest supported duration
 * 
 * @example
 * findClosestDuration(6, [2, 4, 5, 8, 10]) // returns 5
 * findClosestDuration(7, [2, 4, 5, 8, 10]) // returns 8
 * findClosestDuration(3, [2, 4, 5, 8, 10]) // returns 2 (prefer lower)
 */
function findClosestDuration(
  targetDuration: number,
  supportedDurations: number[]
): number {
  // If exact match, return it
  if (supportedDurations.includes(targetDuration)) {
    return targetDuration;
  }

  // Find closest duration
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
 * Generate videos for all scenes using Image-to-Video
 * 
 * @param input - Scenes and settings
 * @param userId - User ID for tracking
 * @param workspaceName - Workspace name for tracking
 * @returns Generated video URLs (Runware direct URLs) and metadata
 */
export async function generateVideos(
  input: VideoGeneratorInput,
  userId: string,
  workspaceName: string
): Promise<VideoGeneratorOutput> {
  const { scenes, videoModel, videoResolution, aspectRatio, projectName, storyId } = input;

  // Get model configuration
  const modelConfig = VIDEO_MODEL_CONFIGS[videoModel];
  if (!modelConfig) {
    throw new Error(`Unknown video model: ${videoModel}`);
  }

  // Get dimensions for aspect ratio and resolution
  const dimensions = getDimensions(aspectRatio, videoResolution, videoModel);

  // Get Runware model ID
  const runwareModelId = runwareModelIdMap[videoModel];
  if (!runwareModelId) {
    throw new Error(`No Runware mapping for model: ${videoModel}`);
  }

  console.log("[problem-solution:video-generator] Starting video generation:", {
    sceneCount: scenes.length,
    videoModel,
    videoResolution,
    aspectRatio,
    dimensions,
    supportedDurations: modelConfig.durations,
  });

  // Build all payloads at once for parallel processing
  const payloads = scenes.map((scene) => {
    if (!scene.imageUrl) {
      throw new Error(`Scene ${scene.sceneNumber} has no imageUrl`);
    }

    // Find closest supported duration
    const matchedDuration = findClosestDuration(
      scene.duration,
      modelConfig.durations
    );

    console.log(`[problem-solution:video-generator] Preparing Scene ${scene.sceneNumber}:`, {
      targetDuration: scene.duration,
      matchedDuration,
      imageUrl: scene.imageUrl.substring(0, 50) + "...",
    });

    // Build Runware payload for video inference
    // Note: frameImages format is array of objects { inputImage: URL }
    return {
      taskType: "videoInference",
      taskUUID: randomUUID(), // Unique ID for tracking
      model: runwareModelId,
      positivePrompt: scene.videoPrompt || "Smooth camera movement, cinematic motion",
      width: dimensions.width,
      height: dimensions.height,
      duration: matchedDuration,
      frameImages: [{ inputImage: scene.imageUrl }], // Runware format: object with inputImage
      numberResults: 1,
      deliveryMethod: "async",
      includeCost: true,
    };
  });

  console.log(`[problem-solution:video-generator] Sending ${payloads.length} scenes in parallel batch...`);

  let results: VideoGenerationResult[] = [];
  let errors: string[] = [];
  let totalCost = 0;

  try {
    // Send ALL scenes in ONE request for parallel processing! 🚀
    const response = await callAi(
      {
        provider: "runware",
        model: videoModel,
        task: "video-generation",
        payload: payloads, // Array of all payloads
        userId,
        workspaceId: input.workspaceId,
        runware: {
          deliveryMethod: "async",
          timeoutMs: 300000, // 5 minutes timeout
        },
      },
      {
        skipCreditCheck: false,
      }
    );

    // Process results
    const outputData = response.output as any[];
    console.log(`[problem-solution:video-generator] Received ${outputData.length} results`);

    // Map results back to scenes
    results = scenes.map((scene, index) => {
      const data = outputData[index];
      const payload = payloads[index];

      if (data?.videoURL) {
        console.log(`[problem-solution:video-generator] Scene ${scene.sceneNumber} completed ✓`);
        return {
          sceneNumber: scene.sceneNumber,
          sceneId: scene.id,
          videoUrl: data.videoURL,
          actualDuration: payload.duration,
          status: "generated",
        };
      } else {
        const errorMessage = data?.error || "No video URL in response";
        console.error(`[problem-solution:video-generator] Scene ${scene.sceneNumber} failed:`, errorMessage);
        errors.push(`Scene ${scene.sceneNumber}: ${errorMessage}`);
        
        return {
          sceneNumber: scene.sceneNumber,
          sceneId: scene.id,
          videoUrl: "",
          actualDuration: scene.duration,
          status: "failed",
          error: errorMessage,
        };
      }
    });

    // Calculate total cost
    totalCost = outputData.reduce((sum, data) => sum + (data?.cost || 0), 0);
  } catch (error) {
    console.error("[problem-solution:video-generator] Batch generation failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Mark all scenes as failed
    results = scenes.map((scene) => ({
      sceneNumber: scene.sceneNumber,
      sceneId: scene.id,
      videoUrl: "",
      actualDuration: scene.duration,
      status: "failed",
      error: errorMessage,
    }));
    
    errors.push(`Batch generation failed: ${errorMessage}`);
  }

  console.log("[problem-solution:video-generator] Generation complete:", {
    total: results.length,
    successful: results.filter((r) => r.status === "generated").length,
    failed: results.filter((r) => r.status === "failed").length,
    totalCost,
  });

  return {
    scenes: results,
    totalCost,
    errors,
  };
}

