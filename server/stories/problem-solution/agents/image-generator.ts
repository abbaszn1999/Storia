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
import { getImageDimensions } from "../config";
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
  /** Maximum images per batch request (prevents API overload) */
  MAX_BATCH_SIZE: 10,
  
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
    styleReferenceUrl?: string; // Custom style reference image URL
  }
): Record<string, any> {
  const { runwareModelId, dimensions, aspectRatio, imageStyle, isMidjourney, styleReferenceUrl } = options;
  
  // Enhance prompt with style-specific modifiers
  const enhancedPrompt = enhanceImagePrompt(
    scene.imagePrompt,
    aspectRatio,
    imageStyle,
    scene.sceneNumber === 1
  );

  const payload: Record<string, any> = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model: runwareModelId,
    positivePrompt: enhancedPrompt,
    width: dimensions.width,
    height: dimensions.height,
    // Midjourney requires numberResults to be multiple of 4
    numberResults: isMidjourney ? 4 : 1,
    includeCost: true,
    outputType: "URL",
  };

  // Add style reference using referenceImages array if provided
  // referenceImages: array of image URLs/UUIDs to guide the generation style
  // Supported formats: PNG, JPG, WEBP - can be URL, UUID, base64, or data URI
  if (styleReferenceUrl) {
    payload.referenceImages = [styleReferenceUrl];
    console.log(`[image-generator] Using referenceImages for scene ${scene.sceneNumber}:`, styleReferenceUrl);
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

    // Process results
    const outputData = response.output as any[];
    
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
    
    console.log(`[image-generator:batch] Mapped ${resultByTaskUUID.size} results by taskUUID`);
    
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
    // Batch failed - mark all items as failed
    const errorMessage = error instanceof Error ? error.message : "Unknown batch error";
    console.error(`[image-generator:batch] Batch failed:`, errorMessage);
    
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
    imageModel: string;
    isMidjourney: boolean;
    userId: string;
    workspaceId?: string;
  }
): Promise<BatchResult[]> {
  const { runwareModelId, dimensions, aspectRatio, imageStyle, styleReferenceUrl, imageModel, isMidjourney, userId, workspaceId } = options;
  
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
  const { scenes, aspectRatio, imageStyle, styleReferenceUrl, imageModel, imageResolution, projectName, storyId } = input;

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
