/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO GENERATION AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates videos from images using Runware Image-to-Video AI.
 * 
 * INPUT:
 * - scenes[] with imageUrl, videoPrompt, narration, duration
 * - videoModel, videoResolution, aspectRatio
 * - imageStyle (for style-aware fallback prompts)
 * 
 * OUTPUT:
 * - scenes[] with videoUrl, actualDuration, status
 * 
 * FLOW:
 * 1. For each scene, build motion prompt
 * 2. Send all scenes in parallel batch to Runware
 * 3. Map results back to scenes
 */

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";
import { getDimensions, VIDEO_MODEL_CONFIGS } from "../../shared/config";
import { randomUUID } from "crypto";
import {
  buildVideoPrompt,
  getDefaultVideoPrompt,
  analyzeNarrationForMotion,
  CAMERA_MOVEMENTS,
  SUBJECT_MOTIONS,
  ENVIRONMENTAL_EFFECTS,
} from "../prompts/video-prompts";
import type {
  VideoGeneratorInput,
  VideoGeneratorOutput,
  VideoGenerationResult,
  ImageStyle,
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
/**
 * Find the closest supported duration for a given target duration
 * Prefers lower duration if equidistant
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
 * ═══════════════════════════════════════════════════════════════════════════════
 * BUILD ENHANCED VIDEO PROMPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Creates a professional motion prompt for Image-to-Video AI.
 * 
 * PRIORITY:
 * 1. Use videoPrompt from storyboard-enhancer (if available and good)
 * 2. Build from narration analysis + style
 * 3. Fall back to style-specific default
 * 
 * @param scene - Scene data with videoPrompt, narration, mood
 * @param imageStyle - The image style for style-aware prompts
 * @param sceneNumber - Current scene number
 * @param totalScenes - Total number of scenes
 * @returns Enhanced video prompt string
 */
function buildEnhancedVideoPrompt(
  scene: {
    videoPrompt?: string;
    narration?: string;
    voiceMood?: string;
    duration: number;
  },
  imageStyle: ImageStyle = 'photorealistic',
  sceneNumber: number = 1,
  totalScenes: number = 5
): string {
  // Option 1: Use existing videoPrompt if it's good quality
  if (scene.videoPrompt && scene.videoPrompt.length >= 40) {
    console.log(`[video-generator] Scene ${sceneNumber}: Using storyboard videoPrompt`);
    return scene.videoPrompt;
  }

  // Option 2: Build from context using video-prompts module
  if (scene.narration || scene.voiceMood) {
    console.log(`[video-generator] Scene ${sceneNumber}: Building from context`);
    
    return buildVideoPrompt({
      originalPrompt: scene.videoPrompt,
      narration: scene.narration,
      imageStyle,
      mood: scene.voiceMood || 'neutral',
      duration: scene.duration,
      sceneNumber,
      totalScenes,
    });
  }

  // Option 3: Analyze narration for motion suggestions
  if (scene.narration) {
    console.log(`[video-generator] Scene ${sceneNumber}: Analyzing narration`);
    
    const analysis = analyzeNarrationForMotion(scene.narration);
    const camera = CAMERA_MOVEMENTS[analysis.suggestedCamera];
    const subject = SUBJECT_MOTIONS[analysis.suggestedSubject];
    
    const parts: string[] = [camera, subject];
    if (analysis.suggestedEnvironment !== 'none') {
      const envEffect = ENVIRONMENTAL_EFFECTS[analysis.suggestedEnvironment];
      parts.push(envEffect);
    }
    
    return parts.join(', ');
  }

  // Option 4: Style-specific default
  console.log(`[video-generator] Scene ${sceneNumber}: Using style default`);
  return getDefaultVideoPrompt(imageStyle);
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
  const { 
    scenes, 
    videoModel, 
    videoResolution, 
    aspectRatio, 
    projectName, 
    storyId,
    imageStyle = 'photorealistic', // Default to photorealistic
  } = input;

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
    imageStyle,
    dimensions,
    supportedDurations: modelConfig.durations,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Build payloads with taskUUID tracking for correct result matching
  // This prevents race conditions when results return out of order!
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Map to track taskUUID -> sceneNumber for reliable matching
  const taskToSceneMap = new Map<string, { sceneNumber: number; sceneId: string; duration: number }>();
  
  const payloads = scenes.map((scene, index) => {
    if (!scene.imageUrl) {
      throw new Error(`Scene ${scene.sceneNumber} has no imageUrl`);
    }

    // Find closest supported duration
    const matchedDuration = findClosestDuration(
      scene.duration,
      modelConfig.durations
    );

    // Build enhanced video prompt using the new prompt system
    const enhancedPrompt = buildEnhancedVideoPrompt(
      {
        videoPrompt: scene.videoPrompt,
        narration: scene.narration,
        voiceMood: scene.voiceMood,
        duration: scene.duration,
      },
      imageStyle,
      scene.sceneNumber,
      scenes.length
    );

    // Generate unique taskUUID for this scene
    const taskUUID = randomUUID();
    
    // Store mapping for later result matching
    taskToSceneMap.set(taskUUID, {
      sceneNumber: scene.sceneNumber,
      sceneId: scene.id,
      duration: matchedDuration,
    });

    console.log(`[problem-solution:video-generator] Preparing Scene ${scene.sceneNumber}:`, {
      taskUUID: taskUUID.substring(0, 8) + '...',
      targetDuration: scene.duration,
      matchedDuration,
      imageUrl: scene.imageUrl.substring(0, 50) + "...",
      promptLength: enhancedPrompt.length,
      promptPreview: enhancedPrompt.substring(0, 80) + "...",
    });

    // Build Runware payload for video inference
    return {
      taskType: "videoInference",
      taskUUID,
      model: runwareModelId,
      positivePrompt: enhancedPrompt,
      width: dimensions.width,
      height: dimensions.height,
      duration: matchedDuration,
      frameImages: [{ inputImage: scene.imageUrl }],
      numberResults: 1,
      deliveryMethod: "async",
      includeCost: true,
    };
  });

  // Calculate dynamic timeout based on number of scenes (2 min per scene + 1 min buffer)
  const dynamicTimeoutMs = Math.max(300000, payloads.length * 120000 + 60000);
  console.log(`[problem-solution:video-generator] Sending ${payloads.length} scenes in parallel batch (timeout: ${dynamicTimeoutMs / 1000}s)...`);

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
          timeoutMs: dynamicTimeoutMs, // Dynamic: 2 min per scene + 1 min buffer
        },
      },
      {
        skipCreditCheck: false,
      }
    );

    // Process results
    const outputData = response.output as any[];
    console.log(`[problem-solution:video-generator] Received ${outputData.length} results`);

    // ═══════════════════════════════════════════════════════════════════════════
    // Match results using taskUUID (NOT by index - results may be out of order!)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Create a map of taskUUID -> result for O(1) lookup
    const resultByTaskUUID = new Map<string, any>();
    for (const data of outputData) {
      if (data?.taskUUID) {
        resultByTaskUUID.set(data.taskUUID, data);
      }
    }
    
    console.log(`[problem-solution:video-generator] Mapped ${resultByTaskUUID.size} results by taskUUID`);

    // Map results back to scenes using taskUUID
    results = payloads.map((payload) => {
      const taskUUID = payload.taskUUID;
      const sceneInfo = taskToSceneMap.get(taskUUID);
      
      if (!sceneInfo) {
        console.error(`[problem-solution:video-generator] No scene mapping for taskUUID: ${taskUUID}`);
        return {
          sceneNumber: 0,
          sceneId: '',
          videoUrl: '',
          actualDuration: 0,
          status: 'failed' as const,
          error: 'Scene mapping not found',
        };
      }

      // Find result by taskUUID (reliable matching!)
      const data = resultByTaskUUID.get(taskUUID);

      if (data?.videoURL) {
        console.log(`[problem-solution:video-generator] Scene ${sceneInfo.sceneNumber} completed ✓ (taskUUID: ${taskUUID.substring(0, 8)}...)`);
        return {
          sceneNumber: sceneInfo.sceneNumber,
          sceneId: sceneInfo.sceneId,
          videoUrl: data.videoURL,
          actualDuration: sceneInfo.duration,
          status: 'generated' as const,
        };
      } else {
        const errorMessage = data?.error || 'No video URL in response';
        console.error(`[problem-solution:video-generator] Scene ${sceneInfo.sceneNumber} failed:`, errorMessage);
        errors.push(`Scene ${sceneInfo.sceneNumber}: ${errorMessage}`);
        
        return {
          sceneNumber: sceneInfo.sceneNumber,
          sceneId: sceneInfo.sceneId,
          videoUrl: '',
          actualDuration: sceneInfo.duration,
          status: 'failed' as const,
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

