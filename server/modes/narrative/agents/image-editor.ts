// ═══════════════════════════════════════════════════════════════════════════
// Agent 4.3: Image Editor
// ═══════════════════════════════════════════════════════════════════════════
// Edits generated storyboard images based on user feedback
// Supports iterative refinement without full regeneration
// Maintains character consistency through reference images

import { callAi } from "../../../ai/service";
import { getRunwareModelId } from "../../../ai/config";
import { IMAGE_MODEL_CONFIGS, getImageDimensions } from "../../../ai/config/image-models";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ImageEditorInput {
  originalImageUrl: string;  // Selected version's image URL
  editingInstruction: string;  // User's editing instruction
  editCategory: "prompt" | "clothes" | "remove" | "expression" | "figure" | "effects";
  referenceImages?: string[];  // Optional reference images (character, location, style refs)
  characterId?: string;  // For character-specific edits
  characterName?: string;  // Character name for context
  shotId: string;
  videoId: string;
  aspectRatio: string;
  imageModel: string;  // User-selected editing model (required)
}

export interface ImageEditorOutput {
  editedImageUrl: string;
  cost?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get dimensions for aspect ratio and image model
 */
function getDimensions(aspectRatio: string, imageModel: string): { width: number; height: number } {
  const modelConfig = IMAGE_MODEL_CONFIGS[imageModel];
  
  if (modelConfig) {
    // For SeaDream 4.5, use 2K resolution (minimum required)
    if (imageModel === "seedream-4.5") {
      return getImageDimensions(aspectRatio, "2k", imageModel);
    }
    
    // For SeaDream 4.0, default to 2K if available, fallback to 1K
    if (imageModel === "seedream-4.0") {
      const dims2k = getImageDimensions(aspectRatio, "2k", imageModel);
      if (dims2k && dims2k.width > 0 && dims2k.height > 0 && dims2k.width * dims2k.height >= 1024 * 1024) {
        return dims2k;
      }
      return getImageDimensions(aspectRatio, "1k", imageModel);
    }
    
    // For other models with model-specific dimensions, use the first available resolution
    if (modelConfig.resolutions && modelConfig.resolutions.length > 0) {
      const resolution = modelConfig.resolutions[0];
      const modelDims = getImageDimensions(aspectRatio, resolution, imageModel);
      if (modelDims && modelDims.width > 0 && modelDims.height > 0) {
        return modelDims;
      }
    }
  }
  
  // Fallback to standard dimensions
  return getImageDimensions(aspectRatio, "1k", imageModel);
}

/**
 * Build the editing prompt based on category and instruction
 */
function buildEditingPrompt(
  category: string,
  instruction: string,
  characterName?: string
): string {
  switch (category) {
    case "prompt":
      return instruction;
    case "clothes":
      return characterName 
        ? `Change ${characterName}'s clothes to: ${instruction}`
        : `Change the character's clothes to: ${instruction}`;
    case "remove":
      return `Remove ${instruction} from the image`;
    case "expression":
      return characterName
        ? `Change ${characterName}'s expression to: ${instruction}`
        : `Change the character's expression to: ${instruction}`;
    case "figure":
      return characterName
        ? `Change ${characterName}'s view to: ${instruction}`
        : `Change the character's view to: ${instruction}`;
    case "effects":
      return `Add ${instruction} effect to the image`;
    default:
      return instruction;
  }
}

/**
 * Edit an image using image-to-image API
 */
async function editImage(
  originalImageUrl: string,
  editingPrompt: string,
  referenceImages: string[],
  width: number,
  height: number,
  model: string,
  userId?: string,
  workspaceId?: string
): Promise<{ imageUrl: string; cost?: number }> {
  // Get Runware model ID from friendly name
  const runwareModelId = getRunwareModelId(model);
  
  // Log model mapping for debugging
  if (runwareModelId !== model) {
    console.log(`[agent-4.3:image-editor] Model mapping: ${model} → ${runwareModelId}`);
  } else {
    console.warn(`[agent-4.3:image-editor] Model "${model}" not found in mapping, using as-is (may be AIR ID)`);
  }

  // Get model config to check capabilities
  const modelConfig = IMAGE_MODEL_CONFIGS[model];
  const supportsNegativePrompt = modelConfig?.supportsNegativePrompt ?? false;

  // Build the payload for image-to-image editing
  // The original image should be included as the first reference image
  const allReferenceImages = [originalImageUrl, ...referenceImages];

  const payload: Record<string, any> = {
    taskType: "imageInference",
    model: runwareModelId,
    positivePrompt: editingPrompt,
    width,
    height,
    numberResults: 1,
    includeCost: true,
    referenceImages: allReferenceImages,
  };

  // Only include negativePrompt if the model supports it
  if (supportsNegativePrompt) {
    // Use a default negative prompt for editing to maintain quality
    payload.negativePrompt = "blurry, low quality, distorted, watermark, text, logo, cropped, out of frame, bad composition";
  }

  // For image-to-image editing, we typically want lower strength to preserve original
  // But this depends on the model - some models handle this automatically
  // For now, we'll let the model use its defaults

  console.log('[agent-4.3:image-editor] Calling image-to-image API:', {
    model: runwareModelId,
    promptLength: editingPrompt.length,
    referenceImagesCount: allReferenceImages.length,
    dimensions: { width, height },
  });

  const response = await callAi(
    {
      provider: "runware",
      model,
      task: "image-to-image",
      payload,
      userId,
      workspaceId,
    },
    {
      skipCreditCheck: false,
    }
  );

  // Extract image URL from response
  const results = response.output as any[];
  const data = Array.isArray(results) ? results[0] : results;

  const imageUrl = data?.imageURL || data?.outputURL || data?.url || data?.image;
  
  if (!imageUrl) {
    throw new Error("No image URL in response from image editing API");
  }

  return {
    imageUrl,
    cost: response.usage?.totalCostUsd || data?.cost,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Edit a storyboard image based on user instructions
 * 
 * Agent 4.3: Image Editor
 * 
 * Processes editing requests and returns modified images using image-to-image API.
 * Supports various editing categories (prompt, clothes, remove, expression, figure, effects).
 * 
 * @param input - Editing request details
 * @param userId - User ID for billing/tracking
 * @param workspaceId - Workspace ID for billing/tracking
 * @returns Edited image URL and cost
 */
export async function editStoryboardImage(
  input: ImageEditorInput,
  userId?: string,
  workspaceId?: string
): Promise<ImageEditorOutput> {
  const {
    originalImageUrl,
    editingInstruction,
    editCategory,
    referenceImages = [],
    characterName,
    shotId,
    videoId,
    aspectRatio,
    imageModel,
  } = input;

  try {
    console.log("[agent-4.3:image-editor] Starting image editing:", {
      shotId,
      videoId,
      editCategory,
      model: imageModel,
      aspectRatio,
      hasOriginalImage: !!originalImageUrl,
      referenceCount: referenceImages.length,
      characterName,
      userId,
      workspaceId,
    });

    // Validate inputs
    if (!originalImageUrl || originalImageUrl.trim() === "") {
      return {
        editedImageUrl: "",
        error: "Original image URL is required",
      };
    }

    if (!editingInstruction || editingInstruction.trim() === "") {
      return {
        editedImageUrl: "",
        error: "Editing instruction is required",
      };
    }

    // Build the editing prompt based on category
    const editingPrompt = buildEditingPrompt(
      editCategory,
      editingInstruction,
      characterName
    );

    // Get dimensions for aspect ratio and image model
    const dimensions = getDimensions(aspectRatio, imageModel);

    // Call image-to-image API to edit the image
    const result = await editImage(
      originalImageUrl,
      editingPrompt,
      referenceImages,
      dimensions.width,
      dimensions.height,
      imageModel,
      userId,
      workspaceId
    );

    console.log("[agent-4.3:image-editor] Image edited successfully:", {
      shotId,
      hasEditedImage: !!result.imageUrl,
      cost: result.cost,
    });

    return {
      editedImageUrl: result.imageUrl,
      cost: result.cost,
    };
  } catch (error) {
    console.error("[agent-4.3:image-editor] Image editing failed:", error);
    return {
      editedImageUrl: "",
      error: error instanceof Error ? error.message : "Image editing failed",
    };
  }
}


