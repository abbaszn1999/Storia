// Image Generation Agent for Problem-Solution Mode
// Generates images with character consistency using seed + reference image

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";
import { enhanceImagePrompt } from "../prompts/image-prompts";
import { getImageDimensions } from "../config";
import type {
  ImageGeneratorInput,
  ImageGeneratorOutput,
  ImageGenerationResult,
} from "../types";

/**
 * Generate images for all scenes with character consistency
 * 
 * Strategy:
 * - Scene 1: Generate without seed/reference (becomes reference)
 * - Scenes 2-N: Use Scene 1 seed for character consistency
 * 
 * @param input - Scenes and settings (including imageModel and imageResolution)
 * @param userId - User ID for tracking
 * @param workspaceName - Workspace name for tracking
 * @returns Generated image URLs (Runware direct URLs) and metadata
 */
export async function generateImages(
  input: ImageGeneratorInput,
  userId: string,
  workspaceName: string
): Promise<ImageGeneratorOutput> {
  const { scenes, aspectRatio, imageStyle, imageModel, imageResolution, projectName, storyId } = input;

  // Get dimensions for aspect ratio and resolution (pass modelId for model-specific dimensions)
  const dimensions = getImageDimensions(aspectRatio, imageResolution, imageModel);

  // Get Runware model ID
  const runwareModelId = runwareModelIdMap[imageModel];
  if (!runwareModelId) {
    throw new Error(`No Runware mapping for model: ${imageModel}`);
  }

  const results: ImageGenerationResult[] = [];
  const errors: string[] = [];
  let referenceSeed: number | null = null;
  let referenceImageUrl: string | null = null;
  let totalCost = 0;

  console.log("[problem-solution:image-generator] Starting image generation:", {
    sceneCount: scenes.length,
    aspectRatio,
    imageStyle,
    imageModel,
    imageResolution,
    dimensions,
  });

  // Generate images sequentially to maintain consistency
  for (const scene of scenes) {
    const isFirstScene = scene.sceneNumber === 1;

    try {
      console.log(`[problem-solution:image-generator] Generating Scene ${scene.sceneNumber}...`);

      // Enhance prompt with style-specific modifiers
      const enhancedPrompt = enhanceImagePrompt(
        scene.imagePrompt,
        aspectRatio,
        imageStyle,
        isFirstScene
      );

      // Build Runware payload (no negativePrompt - not supported by many models)
      // Midjourney requires numberResults to be multiple of 4 (4, 8, 12, 16, 20)
      const isMidjourney = imageModel === 'midjourney-v7';
      
      const payload: any = {
        taskType: "imageInference",
        model: runwareModelId,
        positivePrompt: enhancedPrompt,
        width: dimensions.width,
        height: dimensions.height,
        numberResults: isMidjourney ? 4 : 1,
        includeCost: true,
      };

      // Add consistency parameters for non-first scenes
      if (!isFirstScene && referenceSeed) {
        payload.seed = referenceSeed;
      }

      // Call Runware API
      const response = await callAi(
        {
          provider: "runware",
          model: imageModel,
          task: "image-generation",
          payload,
          userId,
          workspaceId: input.workspaceId,
        },
        {
          skipCreditCheck: false,
        }
      );

      // Extract image data
      const outputData = response.output as any[];
      const data = Array.isArray(outputData) ? outputData[0] : outputData;

      if (!data?.imageURL) {
        throw new Error("No image URL in response");
      }

      const imageURL = data.imageURL;
      const seed = data.seed || Math.floor(Math.random() * 1000000);

      // Save reference for first scene
      if (isFirstScene) {
        referenceSeed = seed;
        referenceImageUrl = imageURL;
        console.log(`[problem-solution:image-generator] Reference saved:`, {
          seed: referenceSeed,
          url: referenceImageUrl,
        });
      }

      // Track cost
      totalCost += response.usage?.totalCostUsd || data.cost || 0;

      // Use Runware URL directly (no CDN upload)
      console.log(`[problem-solution:image-generator] Using Runware URL directly:`, imageURL);

      // Add to results
      results.push({
        sceneNumber: scene.sceneNumber,
        sceneId: scene.id,
        imageUrl: imageURL,
        status: "generated",
      });

      console.log(`[problem-solution:image-generator] Scene ${scene.sceneNumber} completed ✓`);
    } catch (error) {
      console.error(
        `[problem-solution:image-generator] Scene ${scene.sceneNumber} failed:`,
        error
      );

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Scene ${scene.sceneNumber}: ${errorMessage}`);

      results.push({
        sceneNumber: scene.sceneNumber,
        sceneId: scene.id,
        imageUrl: "",
        status: "failed",
        error: errorMessage,
      });
    }
  }

  const successfulCount = results.filter((r) => r.status === "generated").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  console.log("[problem-solution:image-generator] Generation complete:", {
    total: scenes.length,
    successful: successfulCount,
    failed: failedCount,
    totalCost,
  });

  console.log("[problem-solution:image-generator] Results array:", 
    results.map(r => ({ sceneNumber: r.sceneNumber, status: r.status, hasUrl: !!r.imageUrl }))
  );

  const output = {
    scenes: results,
    referenceSeed: referenceSeed || 0,
    referenceImageUrl: referenceImageUrl || "",
    totalCost,
    errors,
  };

  console.log("[problem-solution:image-generator] Returning output with", output.scenes.length, "scenes");

  return output;
}

