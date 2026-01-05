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
import { getDimensions, VIDEO_MODEL_CONFIGS } from "../../../ai/config";
import { randomUUID } from "crypto";
import type { StoryMode } from "./idea-generator";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** 
   * Maximum videos per batch request
   * Video generation is resource-intensive, so we limit batch size
   * to prevent timeouts and ensure reliable processing
   */
  MAX_BATCH_SIZE: 10,
  
  /** Base timeout for video generation (5 minutes) */
  BASE_TIMEOUT_MS: 300000,
  
  /** Additional timeout per video (2 minutes each) */
  TIMEOUT_PER_VIDEO_MS: 120000,
  
  /** Buffer timeout (1 minute) */
  BUFFER_TIMEOUT_MS: 60000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

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
 * Create video generator function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns generateVideos function configured for the specified mode
 */
export async function createVideoGenerator(mode: StoryMode) {
  // Dynamic imports for mode-specific prompts and types
  const videoPromptsModule = await import(`../../${mode}/prompts/video-prompts`);
  // All story modes use the same types from shared
  const typesModule = await import(`../types`);
  
  const {
    buildVideoPrompt,
    getDefaultVideoPrompt,
    analyzeNarrationForMotion,
    CAMERA_MOVEMENTS,
    SUBJECT_MOTIONS,
    ENVIRONMENTAL_EFFECTS,
  } = videoPromptsModule;
  
  // Types will be inferred from usage
  type VideoGeneratorInput = any;
  type VideoGeneratorOutput = any;
  type VideoGenerationResult = any;
  type ImageStyle = any;

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
    imageStyle: any = 'photorealistic',
    sceneNumber: number = 1,
    totalScenes: number = 5
  ): string {
  // Option 1: Use existing videoPrompt if it's good quality
  if (scene.videoPrompt && scene.videoPrompt.length >= 40) {
    console.log(`[${mode}:video-generator] Scene ${sceneNumber}: Using storyboard videoPrompt`);
    return scene.videoPrompt;
  }

  // Option 2: Build from context using video-prompts module
  if (scene.narration || scene.voiceMood) {
    console.log(`[${mode}:video-generator] Scene ${sceneNumber}: Building from context`);
    
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
    console.log(`[${mode}:video-generator] Scene ${sceneNumber}: Analyzing narration`);
    
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
    console.log(`[${mode}:video-generator] Scene ${sceneNumber}: Using style default`);
  return getDefaultVideoPrompt(imageStyle);
}

  /**
   * Generate videos for all scenes
   */
  async function generateVideos(
    input: any,
    userId?: string,
    workspaceName?: string
  ): Promise<any> {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SAFETY: Validate aspect ratio compatibility with video model
  // If the model doesn't support the requested aspect ratio, use fallback
  // ═══════════════════════════════════════════════════════════════════════════
  let finalAspectRatio: typeof modelConfig.aspectRatios[number] = 
    modelConfig.aspectRatios.includes(aspectRatio as any) 
      ? (aspectRatio as typeof modelConfig.aspectRatios[number])
      : modelConfig.aspectRatios[0];
      
  let finalResolution: typeof modelConfig.resolutions[number] = 
    modelConfig.resolutions.includes(videoResolution as any)
      ? (videoResolution as typeof modelConfig.resolutions[number])
      : modelConfig.resolutions[0];
  
  if (finalAspectRatio !== aspectRatio) {
    console.warn(
      `[${mode}:video-generator] ⚠️ Model "${videoModel}" doesn't support aspect ratio "${aspectRatio}". ` +
      `Auto-correcting to "${finalAspectRatio}"`
    );
  }
  
  if (finalResolution !== videoResolution) {
    console.warn(
      `[${mode}:video-generator] ⚠️ Model "${videoModel}" doesn't support resolution "${videoResolution}". ` +
      `Auto-correcting to "${finalResolution}"`
    );
  }

  // Get dimensions for validated aspect ratio and resolution
  const dimensions = getDimensions(finalAspectRatio, finalResolution, videoModel);

  // Get Runware model ID
  const runwareModelId = runwareModelIdMap[videoModel];
  if (!runwareModelId) {
    throw new Error(`No Runware mapping for model: ${videoModel}`);
  }

    console.log(`[${mode}:video-generator] Starting video generation:`, {
    sceneCount: scenes.length,
    videoModel,
    requestedAspectRatio: aspectRatio,
    finalAspectRatio,
    requestedResolution: videoResolution,
    finalResolution,
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
  
    const payloads = scenes.map((scene: any, index: number) => {
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

    console.log(`[${mode}:video-generator] Preparing Scene ${scene.sceneNumber}:`, {
      taskUUID: taskUUID.substring(0, 8) + '...',
      targetDuration: scene.duration,
      matchedDuration,
      imageUrl: scene.imageUrl.substring(0, 50) + "...",
      promptLength: enhancedPrompt.length,
      promptPreview: enhancedPrompt.substring(0, 80) + "...",
    });

    // Build Runware payload for video inference
    // Note: Different models require different frameImages formats:
    // - Runway Gen-4 Turbo, Kling VIDEO 2.6 Pro, Kling VIDEO O1: array of objects with { image } in inputs.frameImages
    // - Hailuo, LTX-2 Pro: array of objects with { inputImage, frame } in inputs.frameImages
    // - Alibaba Wan 2.6: array of objects with { image: "url" } in inputs.frameImages
    const modelsRequiringInputsWrapper = [
      "runway:1@1",      // Runway Gen-4 Turbo
      "runway:2@1",      // Runway Gen-4 (if exists)
      "minimax:4@1",     // Hailuo 2.3
      "lightricks:2@0",  // LTX-2 Pro
      "alibaba:wan@2.6", // Alibaba Wan 2.6
      "klingai:kling-video@2.6-pro", // Kling VIDEO 2.6 Pro
      "klingai:kling@o1", // Kling VIDEO O1
    ];
    
    const useInputsWrapper = modelsRequiringInputsWrapper.includes(runwareModelId);
    const isAlibabaWan = runwareModelId === "alibaba:wan@2.6";
    const modelsUsingImageProperty = [
      "runway:1@1",              // Runway Gen-4 Turbo
      "klingai:kling-video@2.6-pro", // Kling VIDEO 2.6 Pro
      "klingai:kling@o1",       // Kling VIDEO O1
    ];
    const usesImageProperty = modelsUsingImageProperty.includes(runwareModelId);
    
    // Build frameImages payload based on model requirements
    let frameImagesPayload: Record<string, any> = {};
    if (useInputsWrapper) {
      if (isAlibabaWan) {
        // Alibaba Wan 2.6: array of objects with { image: "url" }
        frameImagesPayload = { inputs: { frameImages: [{ image: scene.imageUrl }] } };
      } else if (usesImageProperty) {
        // Runway Gen-4 Turbo, Kling VIDEO 2.6 Pro, Kling VIDEO O1: 
        // array of objects with { image } in inputs.frameImages
        // Note: Uses "image" (not "inputImage") per documentation and playground
        frameImagesPayload = { 
          inputs: { 
            frameImages: [{ 
              image: scene.imageUrl,
              // frame: "first" is optional for Runway Gen-4 Turbo (works without it in playground)
            }] 
          } 
        };
      } else {
        // Other models (Hailuo, LTX-2 Pro): array of objects with { inputImage, frame }
        const frameImagesData = [{ 
          inputImage: scene.imageUrl,
          frame: "first" as const,
        }];
        frameImagesPayload = { inputs: { frameImages: frameImagesData } };
      }
    } else {
      // Models that use frameImages directly (not in inputs)
      const frameImagesData = [{ 
        inputImage: scene.imageUrl,
        frame: "first" as const,
      }];
      frameImagesPayload = { frameImages: frameImagesData };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIO SETTINGS: Handle audio generation based on mode and model support
    // ═══════════════════════════════════════════════════════════════════════════
    // - auto-asmr mode: Enable audio if model supports it (hasAudio: true)
    // - Other modes: Disable audio (voiceover handled separately via ElevenLabs)
    // ═══════════════════════════════════════════════════════════════════════════
    let providerSettings: Record<string, any> | undefined;
    
    // Determine if audio should be enabled
    const shouldEnableAudio = mode === 'auto-asmr' && modelConfig.hasAudio;
    
    // Only add providerSettings for models that support audio parameter
    // Note: Sora 2 Pro (openai:3@2) does NOT support generateAudio parameter
    // The model generates video without audio by default for image-to-video mode
    if (runwareModelId === "bytedance:seedance@1.5-pro") {
      // Seedance 1.5 Pro (ByteDance) - Native audio support
      if (shouldEnableAudio) {
        providerSettings = {
          bytedance: {
            audio: true,
            cameraFixed: false,
          },
        };
      }
      // Note: If audio is disabled, we don't add providerSettings
      // ByteDance models generate video without audio by default when audio: false is not specified
    } else if (runwareModelId.startsWith("google:3@")) {
      providerSettings = { google: { generateAudio: shouldEnableAudio } };
    } else if (runwareModelId.startsWith("lightricks:")) {
      providerSettings = { lightricks: { generateAudio: shouldEnableAudio } };
    } else if (runwareModelId.startsWith("pixverse:")) {
      providerSettings = { pixverse: { audio: shouldEnableAudio } };
    } else if (runwareModelId === "klingai:kling-video@2.6-pro") {
      providerSettings = { klingai: { sound: shouldEnableAudio } };
    } else if (runwareModelId.startsWith("alibaba:")) {
      providerSettings = { alibaba: { audio: shouldEnableAudio } };
    }
    // Sora 2 Pro (openai:3@2): Skip audio parameter - not supported
    // The model generates video without audio by default for image-to-video mode
    // Bytedance models: Skip audio parameter as it's not supported for image-to-video
    // The model will generate video without audio by default (unless native audio support)
    
    // Log audio settings for debugging
    if (shouldEnableAudio) {
      console.log(`[${mode}:video-generator] ✅ Audio enabled for model "${videoModel}" (hasAudio: ${modelConfig.hasAudio})`);
    } else if (mode !== 'auto-asmr') {
      console.log(`[${mode}:video-generator] 🔇 Audio disabled (voiceover handled separately via ElevenLabs)`);
    } else if (mode === 'auto-asmr' && !modelConfig.hasAudio) {
      console.log(`[${mode}:video-generator] 🔇 Audio disabled - model "${videoModel}" doesn't support native audio`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // BUILD PAYLOAD: Some models don't support width/height in image-to-video mode
    // Kling VIDEO O1: dimensions are inferred from frame image (only text-to-video supports width/height)
    // ═══════════════════════════════════════════════════════════════════════════
    const modelsWithoutDimensionsInImageToVideo = [
      "klingai:kling@o1", // Kling VIDEO O1: dimensions inferred from frame image in image-to-video mode
    ];
    const shouldOmitDimensions = modelsWithoutDimensionsInImageToVideo.includes(runwareModelId) && useInputsWrapper;
    
    const payload: Record<string, any> = {
      taskType: "videoInference",
      taskUUID,
      model: runwareModelId,
      positivePrompt: enhancedPrompt,
      duration: matchedDuration,
      ...frameImagesPayload,  // Spread the appropriate format
      // Disable audio for all models that support it
      ...(providerSettings && { providerSettings }),
      numberResults: 1,
      deliveryMethod: "async",
      includeCost: true,
    };
    
    // Only add width/height if the model supports them in image-to-video mode
    if (!shouldOmitDimensions) {
      payload.width = dimensions.width;
      payload.height = dimensions.height;
    }
    
    return payload;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH PROCESSING WITH CHUNKING
  // Split into chunks if scene count exceeds MAX_BATCH_SIZE
  // ═══════════════════════════════════════════════════════════════════════════
  
    const batches = chunkArray(payloads, CONFIG.MAX_BATCH_SIZE);
    console.log(`[${mode}:video-generator] Split ${payloads.length} scenes into ${batches.length} batch(es) (max ${CONFIG.MAX_BATCH_SIZE} per batch)`);

    let allResults: any[] = [];
    let errors: string[] = [];
    let totalCost = 0;

  // Process each batch sequentially
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNum = batchIndex + 1;
    
    // Calculate dynamic timeout based on batch size
    const dynamicTimeoutMs = Math.max(
      CONFIG.BASE_TIMEOUT_MS,
      batch.length * CONFIG.TIMEOUT_PER_VIDEO_MS + CONFIG.BUFFER_TIMEOUT_MS
    );
    
    console.log(`[${mode}:video-generator] Processing batch ${batchNum}/${batches.length} (${batch.length} videos, timeout: ${dynamicTimeoutMs / 1000}s)...`);

    try {
      // Send batch for parallel processing
      const response = await callAi(
        {
          provider: "runware",
          model: videoModel,
          task: "video-generation",
          payload: batch as any,
          userId,
          workspaceId: input.workspaceId,
          runware: {
            deliveryMethod: "async",
            timeoutMs: dynamicTimeoutMs,
          },
        },
        {
          skipCreditCheck: false,
        }
      );

      // Process results
      const outputData = response.output as any[];
      console.log(`[${mode}:video-generator] Batch ${batchNum} received ${outputData.length} results`);

      // Create a map of taskUUID -> result for O(1) lookup
      const resultByTaskUUID = new Map<string, any>();
      for (const data of outputData) {
        if (data?.taskUUID) {
          resultByTaskUUID.set(data.taskUUID, data);
        }
      }
      
      console.log(`[${mode}:video-generator] Batch ${batchNum} mapped ${resultByTaskUUID.size} results by taskUUID`);

      // Map results back to scenes using taskUUID
      const batchResults = batch.map((payload: any) => {
        const taskUUID = payload.taskUUID;
        const sceneInfo = taskToSceneMap.get(taskUUID);
        
        if (!sceneInfo) {
          console.error(`[${mode}:video-generator] No scene mapping for taskUUID: ${taskUUID}`);
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

        // Debug: Log available fields to understand response structure
        if (data && !data.videoURL && !data.videoUrl) {
          console.log(`[${mode}:video-generator] Debug - Scene ${sceneInfo.sceneNumber} data:`, {
            taskUUID: data.taskUUID?.substring(0, 8) + '...',
            hasVideoURL: Boolean(data.videoURL),
            hasVideoUrl: Boolean(data.videoUrl),
            hasImageURL: Boolean(data.imageURL),
            hasImageUrl: Boolean(data.imageUrl),
            status: data.status,
            error: data.error,
            allKeys: Object.keys(data || {}),
            fullData: JSON.stringify(data, null, 2).substring(0, 500), // First 500 chars
          });
        }

        // Try multiple possible field names for video URL
        const videoUrl = data?.videoURL || data?.videoUrl || data?.imageURL || data?.imageUrl;
        
        if (videoUrl) {
          console.log(`[${mode}:video-generator] Batch ${batchNum}: Scene ${sceneInfo.sceneNumber} completed ✓`);
          return {
            sceneNumber: sceneInfo.sceneNumber,
            sceneId: sceneInfo.sceneId,
            videoUrl: videoUrl,
            actualDuration: sceneInfo.duration,
            status: 'generated' as const,
          };
        } else {
          const errorMessage = data?.error || data?.status || 'No video URL in response';
          console.error(`[${mode}:video-generator] Batch ${batchNum}: Scene ${sceneInfo.sceneNumber} failed:`, errorMessage);
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

      allResults.push(...batchResults);
      
      // Calculate batch cost
      const batchCost = outputData.reduce((sum, data) => sum + (data?.cost || 0), 0);
      totalCost += batchCost;
      
      console.log(`[${mode}:video-generator] Batch ${batchNum} complete: ${batchResults.filter(r => r.status === 'generated').length}/${batchResults.length} successful, cost: $${batchCost.toFixed(4)}`);
      
      // Small delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`[${mode}:video-generator] Batch ${batchNum} generation failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Mark all scenes in this batch as failed
      const failedBatchResults = batch.map((payload: any) => {
        const sceneInfo = taskToSceneMap.get(payload.taskUUID);
        return {
          sceneNumber: sceneInfo?.sceneNumber || 0,
          sceneId: sceneInfo?.sceneId || '',
          videoUrl: "",
          actualDuration: sceneInfo?.duration || 0,
          status: "failed" as const,
          error: errorMessage,
        };
      });
      
      allResults.push(...failedBatchResults);
      errors.push(`Batch ${batchNum} failed: ${errorMessage}`);
    }
  }

  const results = allResults;

    console.log(`[${mode}:video-generator] Generation complete:`, {
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

  return generateVideos;
}

/**
 * Generate videos (backward compatibility - uses problem-solution mode by default)
 */
export async function generateVideos(
  input: any,
  userId?: string,
  workspaceName?: string
): Promise<any> {
  const generator = await createVideoGenerator("problem-solution");
  return generator(input, userId, workspaceName);
}

