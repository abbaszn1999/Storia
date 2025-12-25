/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMAGE GENERATION AGENT - BATCH MODE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates images for all scenes using Runware AI in batch mode.
 * 
 * FEATURES:
 * - Parallel batch processing (all images in one request)
 * - Chunking for large batches (max 10 per batch)
 * - Robust error handling (partial failures don't stop the process)
 * - Automatic retry for failed images
 * - Special handling for Midjourney (numberResults = 4)
 * 
 * INPUT:
 * - scenes[] with imagePrompt, sceneNumber, id
 * - aspectRatio, imageStyle, imageModel, imageResolution
 * 
 * OUTPUT:
 * - scenes[] with imageUrl, status ('generated' | 'failed')
 */

import { randomUUID } from "crypto";
import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";
import { enhanceImagePrompt } from "../prompts/image-prompts";
import { getImageDimensions, getImageModelConfig } from "../config";
import type {
  ImageGeneratorInput,
  ImageGeneratorOutput,
  ImageGenerationResult,
  ImageStyle,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** 
   * Maximum images per batch request
   * Based on Runware official docs: numberResults max is 20
   * Using 20 for optimal batch processing performance
   */
  MAX_BATCH_SIZE: 20,
  
  /** Maximum retry attempts for failed images */
  MAX_RETRIES: 2,
  
  /** Delay between retry attempts (ms) */
  RETRY_DELAY_MS: 1000,
  
  /** Timeout for batch request (ms) */
  BATCH_TIMEOUT_MS: 120000, // 2 minutes
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
 * Build Runware payload for a single image
 */
function buildImagePayload(
  scene: { imagePrompt: string; sceneNumber: number },
  options: {
    runwareModelId: string;
    dimensions: { width: number; height: number };
    aspectRatio: string;
    imageStyle: ImageStyle;
    isMidjourney: boolean;
    styleReferenceUrl?: string; // Custom style reference image URL (locks visual style)
    characterReferenceUrl?: string; // Character/face reference image URL
    imageModel: string; // Image model ID for checking capabilities
  }
): Record<string, any> {
  const { runwareModelId, dimensions, aspectRatio, imageStyle, isMidjourney, styleReferenceUrl, characterReferenceUrl, imageModel } = options;
  
  // Get model config to check reference image support
  const modelConfig = getImageModelConfig(imageModel);
  const maxReferenceImages = modelConfig?.maxReferenceImages ?? 0;
  const supportsCharacterReference = modelConfig?.supportsCharacterReference ?? false;
  const referenceImageFormat = modelConfig?.referenceImageFormat || 'direct';
  const requiresReferenceImages = modelConfig?.requiresReferenceImages ?? false;
  
  // When custom style reference is provided, use original prompt without style modifiers
  // The reference image itself will guide the visual style
  // When no reference, enhance prompt with style-specific modifiers
  // Note: Character reference does NOT disable style modifiers
  const finalPrompt = styleReferenceUrl 
    ? scene.imagePrompt.trim()  // Use original prompt - reference image handles style
    : enhanceImagePrompt(       // Add style modifiers when no reference
        scene.imagePrompt,
        aspectRatio,
        imageStyle,
        scene.sceneNumber === 1
      );

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBUG: Log the prompt details
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`[image-generator] Scene ${scene.sceneNumber} prompt details:`, {
    originalPromptLength: scene.imagePrompt?.length || 0,
    originalPrompt: scene.imagePrompt?.substring(0, 200) + (scene.imagePrompt?.length > 200 ? '...' : ''),
    finalPromptLength: finalPrompt.length,
    finalPrompt: finalPrompt.substring(0, 300) + (finalPrompt.length > 300 ? '...' : ''),
    model: runwareModelId,
    dimensions: `${dimensions.width}x${dimensions.height}`,
    imageStyle,
    maxReferenceImages,
    usingStyleReference: !!styleReferenceUrl,
    usingCharacterReference: !!characterReferenceUrl,
  });

  const payload: Record<string, any> = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model: runwareModelId,
    positivePrompt: finalPrompt,
    width: dimensions.width,
    height: dimensions.height,
    // Midjourney requires numberResults to be multiple of 4
    numberResults: isMidjourney ? 4 : 1,
    includeCost: true,
    outputType: "URL",
  };

  // Build referenceImages array respecting model limits
  // Priority: Style Reference > Character Reference
  
  // Check if model requires reference images
  if (requiresReferenceImages && !styleReferenceUrl && !characterReferenceUrl) {
    throw new Error(
      `Model "${imageModel}" requires at least one reference image (style or character). ` +
      `Please upload a reference image before generating.`
    );
  }
  
  if (maxReferenceImages > 0) {
    const referenceImages: string[] = [];
    
    // Add style reference first (highest priority)
    if (styleReferenceUrl) {
      // Validate URL format before adding
      if (!styleReferenceUrl || typeof styleReferenceUrl !== 'string' || styleReferenceUrl.trim() === '') {
        console.error(`[image-generator] Scene ${scene.sceneNumber} invalid style reference URL:`, styleReferenceUrl);
      } else if (!styleReferenceUrl.startsWith('http://') && !styleReferenceUrl.startsWith('https://')) {
        console.error(`[image-generator] Scene ${scene.sceneNumber} style reference URL must be a full URL:`, styleReferenceUrl);
      } else {
        referenceImages.push(styleReferenceUrl);
        console.log(`[image-generator] Scene ${scene.sceneNumber} using style reference (visual style modifiers disabled)`);
      }
    }
    
    // Add character reference if supported and within limit
    if (characterReferenceUrl && supportsCharacterReference && referenceImages.length < maxReferenceImages) {
      // Validate URL format before adding
      if (!characterReferenceUrl || typeof characterReferenceUrl !== 'string' || characterReferenceUrl.trim() === '') {
        console.error(`[image-generator] Scene ${scene.sceneNumber} invalid character reference URL:`, characterReferenceUrl);
      } else if (!characterReferenceUrl.startsWith('http://') && !characterReferenceUrl.startsWith('https://')) {
        console.error(`[image-generator] Scene ${scene.sceneNumber} character reference URL must be a full URL:`, characterReferenceUrl);
      } else {
        referenceImages.push(characterReferenceUrl);
        console.log(`[image-generator] Scene ${scene.sceneNumber} using character reference`);
      }
    } else if (characterReferenceUrl && !supportsCharacterReference) {
      console.log(`[image-generator] Scene ${scene.sceneNumber} character reference ignored (model doesn't support it)`);
    } else if (characterReferenceUrl && referenceImages.length >= maxReferenceImages) {
      console.log(`[image-generator] Scene ${scene.sceneNumber} character reference ignored (model limit: ${maxReferenceImages})`);
    }
    
    // Final validation: if model requires reference images, ensure we have at least one valid reference
    if (requiresReferenceImages && referenceImages.length === 0) {
      throw new Error(
        `Model "${imageModel}" requires at least one valid reference image. ` +
        `Please ensure your reference image URLs are valid and accessible.`
      );
    }
    
    // Add to payload if we have any valid references
    // All models now use inputs.referenceImages format
    if (referenceImages.length > 0) {
      if (referenceImageFormat === 'inputs-with-tags') {
        // Runway Gen-4 Image & Turbo: need inputs.referenceImages with tags
        // Tags: style reference = "style", character reference = "character"
        payload.inputs = {
          referenceImages: referenceImages.map((url) => {
            // Determine tag based on which reference this URL belongs to
            const isStyleRef = styleReferenceUrl && url === styleReferenceUrl;
            const tag = isStyleRef ? 'style' : 'character';
            return {
              image: url,
              tag: tag
            };
          })
        };
        console.log(`[image-generator] Scene ${scene.sceneNumber} using inputs.referenceImages with tags (${referenceImages.length}/${maxReferenceImages}):`, payload.inputs.referenceImages);
      } else {
        // All other models: use inputs.referenceImages (array of URLs)
        payload.inputs = {
          referenceImages: referenceImages
        };
        console.log(`[image-generator] Scene ${scene.sceneNumber} using inputs.referenceImages (${referenceImages.length}/${maxReferenceImages}):`, referenceImages);
      }
    } else if (styleReferenceUrl || characterReferenceUrl) {
      console.warn(`[image-generator] Scene ${scene.sceneNumber} reference images were provided but none were valid/added`);
    }
  } else if (styleReferenceUrl || characterReferenceUrl) {
    console.log(`[image-generator] Scene ${scene.sceneNumber} reference images ignored (model doesn't support them)`);
  }

  return payload;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

interface BatchItem {
  scene: { id: string; sceneNumber: number; imagePrompt: string };
  payload: Record<string, any>;
}

interface BatchResult {
  sceneId: string;
  sceneNumber: number;
  imageUrl: string;
  status: "generated" | "failed";
  error?: string;
  cost?: number;
}

/**
 * Process a single batch of images
 * Returns results for all items, with status indicating success/failure
 * Uses taskUUID for reliable result matching (prevents race conditions!)
 */
async function processBatch(
  items: BatchItem[],
  options: {
    imageModel: string;
    userId: string;
    workspaceId?: string;
    isMidjourney: boolean;
  }
): Promise<BatchResult[]> {
  const { imageModel, userId, workspaceId, isMidjourney } = options;
  
  // Create taskUUID -> scene mapping for reliable result matching
  const taskToSceneMap = new Map<string, { sceneId: string; sceneNumber: number }>();
  
  const payloads = items.map((item) => {
    const taskUUID = item.payload.taskUUID;
    taskToSceneMap.set(taskUUID, {
      sceneId: item.scene.id,
      sceneNumber: item.scene.sceneNumber,
    });
    return item.payload;
  });
  
  console.log(`[image-generator:batch] Processing batch of ${items.length} images...`);
  
  try {
    const response = await callAi(
      {
        provider: "runware",
        model: imageModel,
        task: "image-generation",
        payload: payloads,
        userId,
        workspaceId,
        runware: {
          timeoutMs: CONFIG.BATCH_TIMEOUT_MS,
        },
      },
      {
        skipCreditCheck: false,
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // DEBUG: Log raw AI response
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('[image-generator:batch] Raw AI response received:', {
      provider: response.provider,
      model: response.model,
      outputType: typeof response.output,
      outputLength: Array.isArray(response.output) ? response.output.length : 'not array',
      usage: response.usage,
      // Log first 1000 chars of raw response
      rawResponsePreview: JSON.stringify(response.rawResponse)?.substring(0, 1000),
    });

    // Process results
    const outputData = response.output as any[];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // Match results using taskUUID (NOT by index - results may be out of order!)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Create a map of taskUUID -> result for O(1) lookup
    const resultByTaskUUID = new Map<string, any>();
    let successCount = 0;
    let failCount = 0;
    
    for (const data of outputData) {
      if (data?.taskUUID) {
        resultByTaskUUID.set(data.taskUUID, data);
        if (data.imageURL) {
          successCount++;
        } else if (data.error || data.status === 'failed') {
          failCount++;
        }
      }
    }
    
    console.log(`[image-generator:batch] Results mapped: ${successCount} success, ${failCount} failed, ${resultByTaskUUID.size} total`);
    
    return items.map((item) => {
      const taskUUID = item.payload.taskUUID;
      const sceneInfo = taskToSceneMap.get(taskUUID);
      
      if (!sceneInfo) {
        console.error(`[image-generator:batch] No scene mapping for taskUUID: ${taskUUID}`);
        return {
          sceneId: item.scene.id,
          sceneNumber: item.scene.sceneNumber,
          imageUrl: "",
          status: "failed" as const,
          error: "Scene mapping not found",
          cost: 0,
        };
      }
      
      // Find result by taskUUID (reliable matching!)
      const data = resultByTaskUUID.get(taskUUID);
      
      // For Midjourney, we get 4 results per task, take the first one
      const imageData = isMidjourney && Array.isArray(data) ? data[0] : data;
      
      if (imageData?.imageURL) {
        console.log(`[image-generator:batch] Scene ${sceneInfo.sceneNumber} completed ✓ (taskUUID: ${taskUUID.substring(0, 8)}...)`);
        return {
          sceneId: sceneInfo.sceneId,
          sceneNumber: sceneInfo.sceneNumber,
          imageUrl: imageData.imageURL,
          status: "generated" as const,
          cost: imageData.cost || 0,
        };
      } else {
        const errorMsg = imageData?.error || "No image URL in response";
        console.error(`[image-generator:batch] Scene ${sceneInfo.sceneNumber} failed:`, errorMsg);
        return {
          sceneId: sceneInfo.sceneId,
          sceneNumber: sceneInfo.sceneNumber,
          imageUrl: "",
          status: "failed" as const,
          error: errorMsg,
          cost: 0,
        };
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown batch error";
    console.error(`[image-generator:batch] Batch failed:`, errorMessage);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO-RETRY: If batch failed with transient errors, wait and retry once
    // Common transient errors: NO_IMAGE, invalidProviderResponse, timeout
    // ═══════════════════════════════════════════════════════════════════════════
    const isTransientError = 
      errorMessage.includes('NO_IMAGE') || 
      errorMessage.includes('invalidProviderResponse') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNRESET');
    
    if (isTransientError) {
      console.warn('[image-generator:batch] Transient error detected, retrying in 5 seconds...');
      await sleep(5000);
      
      try {
        console.log('[image-generator:batch] Retry attempt starting...');
        
        const retryResponse = await callAi(
          {
            provider: "runware",
            model: imageModel,
            task: "image-generation",
            payload: payloads,
            userId,
            workspaceId,
            runware: {
              timeoutMs: CONFIG.BATCH_TIMEOUT_MS,
            },
          },
          { skipCreditCheck: false }
        );
        
        console.log('[image-generator:batch] Retry succeeded, processing results...');
        
        // Process retry results
        const outputData = retryResponse.output as any[];
        const resultByTaskUUID = new Map<string, any>();
        
        for (const data of outputData) {
          if (data?.taskUUID) {
            resultByTaskUUID.set(data.taskUUID, data);
          }
        }
        
        const retryResults = items.map((item) => {
          const taskUUID = item.payload.taskUUID;
          const sceneInfo = taskToSceneMap.get(taskUUID);
          
          if (!sceneInfo) {
            return {
              sceneId: item.scene.id,
              sceneNumber: item.scene.sceneNumber,
              imageUrl: "",
              status: "failed" as const,
              error: "Scene mapping not found on retry",
              cost: 0,
            };
          }
          
          const data = resultByTaskUUID.get(taskUUID);
          const imageData = isMidjourney && Array.isArray(data) ? data[0] : data;
          
          if (imageData?.imageURL) {
            console.log(`[image-generator:batch] Retry: Scene ${sceneInfo.sceneNumber} completed ✓`);
            return {
              sceneId: sceneInfo.sceneId,
              sceneNumber: sceneInfo.sceneNumber,
              imageUrl: imageData.imageURL,
              status: "generated" as const,
              cost: imageData.cost || 0,
            };
          } else {
            const retryError = imageData?.error || "No image URL in retry response";
            console.error(`[image-generator:batch] Retry: Scene ${sceneInfo.sceneNumber} failed:`, retryError);
            return {
              sceneId: sceneInfo.sceneId,
              sceneNumber: sceneInfo.sceneNumber,
              imageUrl: "",
              status: "failed" as const,
              error: retryError,
              cost: 0,
            };
          }
        });
        
        const retrySuccessCount = retryResults.filter(r => r.status === 'generated').length;
        console.log(`[image-generator:batch] Retry complete: ${retrySuccessCount}/${retryResults.length} succeeded`);
        
        return retryResults;
        
      } catch (retryError) {
        const retryErrorMessage = retryError instanceof Error ? retryError.message : "Unknown retry error";
        console.error('[image-generator:batch] Retry also failed:', retryErrorMessage);
        // Fall through to original error handling
      }
    }
    
    // Original error handling - mark all items as failed
    return items.map((item) => ({
      sceneId: item.scene.id,
      sceneNumber: item.scene.sceneNumber,
      imageUrl: "",
      status: "failed" as const,
      error: errorMessage,
      cost: 0,
    }));
  }
}

/**
 * Retry failed images individually
 * Uses single-image requests for more reliable retry
 */
async function retryFailedImages(
  failedResults: BatchResult[],
  sceneMap: Map<string, { id: string; sceneNumber: number; imagePrompt: string }>,
  options: {
    runwareModelId: string;
    dimensions: { width: number; height: number };
    aspectRatio: string;
    imageStyle: ImageStyle;
    styleReferenceUrl?: string;
    characterReferenceUrl?: string;
    imageModel: string;
    isMidjourney: boolean;
    userId: string;
    workspaceId?: string;
  }
): Promise<BatchResult[]> {
  const { runwareModelId, dimensions, aspectRatio, imageStyle, styleReferenceUrl, characterReferenceUrl, imageModel, isMidjourney, userId, workspaceId } = options;
  
  const retriedResults: BatchResult[] = [];
  
  for (const failedResult of failedResults) {
    const scene = sceneMap.get(failedResult.sceneId);
    if (!scene) continue;
    
    console.log(`[image-generator:retry] Retrying Scene ${failedResult.sceneNumber}...`);
    
    await sleep(CONFIG.RETRY_DELAY_MS);
    
    try {
      const payload = buildImagePayload(scene, {
        runwareModelId,
        dimensions,
        aspectRatio,
        imageStyle,
        isMidjourney,
        styleReferenceUrl,
        characterReferenceUrl,
        imageModel,
      });

      const response = await callAi(
        {
          provider: "runware",
          model: imageModel,
          task: "image-generation",
          payload: [payload],
          userId,
          workspaceId,
        },
        {
          skipCreditCheck: false,
        }
      );

      const outputData = response.output as any[];
      const data = isMidjourney && Array.isArray(outputData[0]) ? outputData[0][0] : outputData[0];

      if (data?.imageURL) {
        console.log(`[image-generator:retry] Scene ${failedResult.sceneNumber} retry succeeded ✓`);
        retriedResults.push({
          sceneId: failedResult.sceneId,
          sceneNumber: failedResult.sceneNumber,
          imageUrl: data.imageURL,
          status: "generated",
          cost: data.cost || 0,
        });
      } else {
        console.log(`[image-generator:retry] Scene ${failedResult.sceneNumber} retry failed again`);
        retriedResults.push({
          ...failedResult,
          error: `Retry failed: ${data?.error || "No image URL"}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[image-generator:retry] Scene ${failedResult.sceneNumber} retry error:`, errorMessage);
      retriedResults.push({
        ...failedResult,
        error: `Retry failed: ${errorMessage}`,
      });
    }
  }
  
  return retriedResults;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate images for all scenes using batch processing
 * 
 * @param input - Scenes and settings
 * @param userId - User ID for tracking
 * @param workspaceName - Workspace name for tracking
 * @returns Generated image URLs and metadata
 */
export async function generateImages(
  input: ImageGeneratorInput,
  userId: string,
  workspaceName: string
): Promise<ImageGeneratorOutput> {
  const { scenes, aspectRatio, imageStyle, styleReferenceUrl, characterReferenceUrl, imageModel, imageResolution, projectName, storyId } = input;

  // ─────────────────────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Get dimensions for aspect ratio and resolution
  const dimensions = getImageDimensions(aspectRatio, imageResolution, imageModel);

  // Get Runware model ID
  const runwareModelId = runwareModelIdMap[imageModel];
  if (!runwareModelId) {
    throw new Error(`No Runware mapping for model: ${imageModel}`);
  }

  const isMidjourney = imageModel === 'midjourney-v7';
  
  console.log("[image-generator] Starting batch image generation:", {
    sceneCount: scenes.length,
    aspectRatio,
    imageStyle,
    styleReferenceUrl: styleReferenceUrl ? 'provided' : 'none',
    characterReferenceUrl: characterReferenceUrl ? 'provided' : 'none',
    imageModel,
    imageResolution,
    dimensions,
    batchSize: CONFIG.MAX_BATCH_SIZE,
    isMidjourney,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD BATCH ITEMS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Create a map for quick scene lookup
  const sceneMap = new Map<string, { id: string; sceneNumber: number; imagePrompt: string }>();
  
  const batchItems: BatchItem[] = scenes.map((scene) => {
    sceneMap.set(scene.id, {
      id: scene.id,
      sceneNumber: scene.sceneNumber,
      imagePrompt: scene.imagePrompt,
    });
    
    return {
      scene: {
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        imagePrompt: scene.imagePrompt,
      },
      payload: buildImagePayload(
        { imagePrompt: scene.imagePrompt, sceneNumber: scene.sceneNumber },
        {
          runwareModelId,
          dimensions,
          aspectRatio,
          imageStyle,
          isMidjourney,
          styleReferenceUrl,
          characterReferenceUrl,
          imageModel,
        }
      ),
    };
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PROCESS IN BATCHES
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Split into chunks if needed
  const batches = chunkArray(batchItems, CONFIG.MAX_BATCH_SIZE);
  console.log(`[image-generator] Split into ${batches.length} batch(es)`);
  
  let allResults: BatchResult[] = [];
  let totalCost = 0;
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[image-generator] Processing batch ${i + 1}/${batches.length} (${batch.length} images)`);
    
    const batchResults = await processBatch(batch, {
      imageModel,
      userId,
      workspaceId: input.workspaceId,
      isMidjourney,
    });
    
    allResults.push(...batchResults);
    
    // Small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await sleep(500);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RETRY FAILED IMAGES
  // ─────────────────────────────────────────────────────────────────────────────
  
  const failedResults = allResults.filter((r) => r.status === "failed");
  
  if (failedResults.length > 0 && failedResults.length <= scenes.length / 2) {
    // Only retry if less than half failed (otherwise likely systemic issue)
    console.log(`[image-generator] Retrying ${failedResults.length} failed image(s)...`);
    
    const retriedResults = await retryFailedImages(failedResults, sceneMap, {
      runwareModelId,
      dimensions,
      aspectRatio,
      imageStyle,
      styleReferenceUrl,
      characterReferenceUrl,
      imageModel,
      isMidjourney,
      userId,
      workspaceId: input.workspaceId,
    });
    
    // Update results with retried ones
    const retriedMap = new Map(retriedResults.map((r) => [r.sceneId, r]));
    allResults = allResults.map((r) => retriedMap.get(r.sceneId) || r);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCULATE TOTALS
  // ─────────────────────────────────────────────────────────────────────────────
  
  totalCost = allResults.reduce((sum, r) => sum + (r.cost || 0), 0);
  
  const successfulCount = allResults.filter((r) => r.status === "generated").length;
  const failedCount = allResults.filter((r) => r.status === "failed").length;
  const errors = allResults
    .filter((r) => r.status === "failed" && r.error)
    .map((r) => `Scene ${r.sceneNumber}: ${r.error}`);

  console.log("[image-generator] Generation complete:", {
    total: scenes.length,
    successful: successfulCount,
    failed: failedCount,
    totalCost,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD OUTPUT
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Sort results by scene number
  allResults.sort((a, b) => a.sceneNumber - b.sceneNumber);
  
  const output: ImageGeneratorOutput = {
    scenes: allResults.map((r) => ({
      sceneNumber: r.sceneNumber,
      sceneId: r.sceneId,
      imageUrl: r.imageUrl,
      status: r.status,
      error: r.error,
    })),
    referenceSeed: 0, // No longer using seed consistency
    referenceImageUrl: "", // No longer using reference image
    totalCost,
    errors,
  };

  console.log("[image-generator] Returning output with", output.scenes.length, "scenes");

  return output;
}
